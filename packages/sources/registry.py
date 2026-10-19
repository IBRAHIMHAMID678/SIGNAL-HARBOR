"""Source registry, policies, and rate-limiting controls.

Implements Section 6.1 and 6.2 of the SignalHarbor Blueprint:
- Pluggable source registry with policy controls.
- Host-level politeness, token-bucket rate limiter.
- Emergency pause / kill switch per source.
"""

from __future__ import annotations

import asyncio
import time
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Dict, List, Optional
from urllib.parse import urlparse

from packages.domain.models import SourceClass, SourceStatus


@dataclass
class SourcePolicy:
    source_id: str
    name: str
    source_class: SourceClass
    base_url: str
    max_rpm: int = 30  # Max requests per minute
    daily_budget: int = 1000
    is_paused: bool = False
    status: SourceStatus = SourceStatus.ACTIVE
    disallowed_paths: List[str] = field(default_factory=list)
    user_agent: str = "SignalHarborBot/1.0 (+https://signalharbor.local/bot; contact@signalharbor.local)"
    last_policy_review: datetime = field(default_factory=lambda: datetime.now(timezone.utc))


class HostRateLimiter:
    """Token-bucket rate limiter per host to enforce strict politeness."""

    def __init__(self):
        self._hosts: Dict[str, Dict[str, float]] = {}
        self._lock = asyncio.Lock()

    async def acquire(self, host: str, min_delay_seconds: float = 1.0) -> None:
        async with self._lock:
            now = time.monotonic()
            state = self._hosts.get(host)
            if not state:
                self._hosts[host] = {"last_time": now}
                return

            elapsed = now - state["last_time"]
            if elapsed < min_delay_seconds:
                sleep_time = min_delay_seconds - elapsed
                await asyncio.sleep(sleep_time)
                self._hosts[host]["last_time"] = time.monotonic()
            else:
                self._hosts[host]["last_time"] = now


class SourceRegistry:
    """Central registry for public sources and their policies."""

    def __init__(self):
        self._sources: Dict[str, SourcePolicy] = {}
        self.rate_limiter = HostRateLimiter()
        self._register_default_sources()

    def _register_default_sources(self) -> None:
        defaults = [
            SourcePolicy(
                source_id="official_website",
                name="Company First-Party Website",
                source_class=SourceClass.OFFICIAL_WEBSITE,
                base_url="https://*",
                max_rpm=20,
                daily_budget=5000,
            ),
            SourcePolicy(
                source_id="uk_companies_house",
                name="UK Companies House Public Registry",
                source_class=SourceClass.GOVERNMENT_REGISTRY,
                base_url="https://api.company-information.service.gov.uk",
                max_rpm=60,
                daily_budget=2000,
            ),
            SourcePolicy(
                source_id="opencorporates",
                name="OpenCorporates Open Data Registry",
                source_class=SourceClass.GOVERNMENT_REGISTRY,
                base_url="https://api.opencorporates.com",
                max_rpm=30,
                daily_budget=1000,
            ),
            SourcePolicy(
                source_id="searxng_broker",
                name="Self-Hosted SearXNG Search Broker",
                source_class=SourceClass.SEARCH_DISCOVERY,
                base_url="http://localhost:8080",
                max_rpm=30,
                daily_budget=1500,
            ),
            SourcePolicy(
                source_id="tech_directory",
                name="Open B2B Technology & Software Directory",
                source_class=SourceClass.INDUSTRY_DIRECTORY,
                base_url="https://directory.b2btech.local",
                max_rpm=15,
                daily_budget=800,
            ),
        ]
        for src in defaults:
            self._sources[src.source_id] = src

    def get_source(self, source_id: str) -> Optional[SourcePolicy]:
        return self._sources.get(source_id)

    def list_sources(self) -> List[SourcePolicy]:
        return list(self._sources.values())

    def register_source(self, policy: SourcePolicy) -> None:
        self._sources[policy.source_id] = policy

    def pause_source(self, source_id: str) -> bool:
        src = self.get_source(source_id)
        if src:
            src.is_paused = True
            src.status = SourceStatus.PAUSED
            return True
        return False

    def resume_source(self, source_id: str) -> bool:
        src = self.get_source(source_id)
        if src:
            src.is_paused = False
            src.status = SourceStatus.ACTIVE
            return True
        return False

    def can_fetch(self, source_id: str, url: str) -> bool:
        src = self.get_source(source_id)
        if not src:
            return False
        if src.is_paused or src.status in (SourceStatus.BLOCKED, SourceStatus.PAUSED):
            return False

        parsed = urlparse(url)
        path = parsed.path.lower()
        for disallowed in src.disallowed_paths:
            if path.startswith(disallowed.lower()):
                return False
        return True
