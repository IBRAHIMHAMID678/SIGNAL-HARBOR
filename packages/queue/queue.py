"""Durable work queue backed by relational storage.

Implements Section 4 and 6.8 of the SignalHarbor Blueprint:
- Leases with timeouts preventing lost tasks on worker crash.
- Priority levels and retry counters.
- Dead-letter state when retries exceed limits.
- Idempotency keys preventing duplicate enqueues.
"""

from __future__ import annotations

import datetime
from datetime import timedelta, timezone
from typing import Any, Dict, List, Optional
import uuid

from sqlalchemy import and_, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from packages.db.models import WorkQueueItemDB, utcnow


class WorkQueue:
    def __init__(self, session: AsyncSession, worker_id: Optional[str] = None):
        self.session = session
        self.worker_id = worker_id or f"worker-{uuid.uuid4().hex[:8]}"

    async def enqueue(
        self,
        task_type: str,
        payload: Dict[str, Any],
        priority: int = 10,
        idempotency_key: Optional[str] = None,
        max_attempts: int = 3,
    ) -> WorkQueueItemDB:
        """Enqueue a new task. If an idempotency_key is provided and already exists, returns the existing task."""
        if idempotency_key:
            stmt = select(WorkQueueItemDB).where(
                WorkQueueItemDB.idempotency_key == idempotency_key
            )
            existing = (await self.session.execute(stmt)).scalar_one_or_none()
            if existing:
                return existing

        item = WorkQueueItemDB(
            task_type=task_type,
            priority=priority,
            status="pending",
            payload=payload,
            max_attempts=max_attempts,
            idempotency_key=idempotency_key,
        )
        self.session.add(item)
        await self.session.flush()
        return item

    async def claim(
        self,
        task_types: Optional[List[str]] = None,
        lease_seconds: int = 60,
    ) -> Optional[WorkQueueItemDB]:
        """Claim the highest priority pending or expired leased task."""
        now = utcnow()
        conditions = [
            or_(
                WorkQueueItemDB.status == "pending",
                and_(
                    WorkQueueItemDB.status == "running",
                    WorkQueueItemDB.lease_expires_at < now,
                ),
            ),
            WorkQueueItemDB.attempts < WorkQueueItemDB.max_attempts,
        ]
        if task_types:
            conditions.append(WorkQueueItemDB.task_type.in_(task_types))

        stmt = (
            select(WorkQueueItemDB)
            .where(and_(*conditions))
            .order_by(WorkQueueItemDB.priority.asc(), WorkQueueItemDB.created_at.asc())
            .limit(1)
        )

        item = (await self.session.execute(stmt)).scalar_one_or_none()
        if not item:
            return None

        item.status = "running"
        item.lease_owner = self.worker_id
        item.lease_expires_at = now + timedelta(seconds=lease_seconds)
        item.attempts += 1
        item.updated_at = now
        await self.session.flush()
        return item

    async def heartbeat(self, task_id: str, lease_seconds: int = 60) -> bool:
        """Extend lease for a running task."""
        now = utcnow()
        stmt = (
            update(WorkQueueItemDB)
            .where(
                and_(
                    WorkQueueItemDB.id == task_id,
                    WorkQueueItemDB.lease_owner == self.worker_id,
                    WorkQueueItemDB.status == "running",
                )
            )
            .values(
                lease_expires_at=now + timedelta(seconds=lease_seconds),
                updated_at=now,
            )
        )
        result = await self.session.execute(stmt)
        return result.rowcount > 0

    async def complete(self, task_id: str) -> None:
        """Mark task as completed."""
        stmt = (
            update(WorkQueueItemDB)
            .where(WorkQueueItemDB.id == task_id)
            .values(
                status="completed",
                lease_owner=None,
                lease_expires_at=None,
                updated_at=utcnow(),
            )
        )
        await self.session.execute(stmt)

    async def fail(self, task_id: str, error_message: str) -> None:
        """Mark task failure, route to dead_letter if max attempts reached."""
        stmt = select(WorkQueueItemDB).where(WorkQueueItemDB.id == task_id)
        item = (await self.session.execute(stmt)).scalar_one_or_none()
        if not item:
            return

        item.last_error = error_message
        item.lease_owner = None
        item.lease_expires_at = None
        item.updated_at = utcnow()

        if item.attempts >= item.max_attempts:
            item.status = "dead_letter"
        else:
            item.status = "pending"

        await self.session.flush()
