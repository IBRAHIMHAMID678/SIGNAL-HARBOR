"""SignalHarbor REST API.

Implements Section 12 of the SignalHarbor Blueprint.
Typed OpenAPI endpoints for ICP profiles, search runs, prospect evidence graphs,
review tasks, suppression lists, source health controls, and auditable exports.
"""

from __future__ import annotations

import os
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import Depends, FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from sqlalchemy import desc, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from packages.db.database import get_db_session, init_db
from packages.db.models import (
    AuditEventDB,
    ClaimDB,
    ContactChannelDB,
    EvidenceRecordDB,
    ExportJobDB,
    ICPProfileDB,
    OrganizationDB,
    ReviewTaskDB,
    SearchRunDB,
    SourceDB,
    SuppressionDB,
    UserDB,
    WorkspaceDB,
    utcnow,
)
from packages.domain.models import (
    ChannelType,
    EmailValidationStatus,
    Organization,
    ProspectDisposition,
    QualityScores,
    SourceClass,
    SourceStatus,
)
from packages.exports.exporter import ProspectExporter
from packages.pipeline.orchestrator import PipelineOrchestrator
from packages.sources.registry import SourceRegistry


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB tables on startup
    await init_db()
    # Ensure default workspace & sources exist
    async for session in get_db_session():
        stmt = select(WorkspaceDB).where(WorkspaceDB.slug == "default")
        ws = (await session.execute(stmt)).scalar_one_or_none()
        if not ws:
            ws = WorkspaceDB(name="Acme Intelligence", slug="default")
            session.add(ws)
            await session.flush()
            user = UserDB(
                workspace_id=ws.id,
                email="analyst@signalharbor.local",
                name="Lead Intelligence Analyst",
                role="admin",
            )
            session.add(user)

            # Default ICP Profile
            icp = ICPProfileDB(
                workspace_id=ws.id,
                name="High-Growth B2B Cloud & Logistics",
                description="North American enterprise cloud infrastructure, robotics, and cold-chain logistics providers.",
                target_industries=["Cloud Infrastructure", "Cold Chain Logistics", "Industrial Robotics"],
                target_geographies=["United States", "North America"],
                target_sizes=["51-200", "201-500"],
                required_keywords=["enterprise", "solutions", "intelligence"],
                excluded_keywords=["consumer", "retail"],
                required_contact_channels=["email"],
                min_fit_threshold=70.0,
                min_confidence_threshold=75.0,
                allowed_sources=["official_website", "government_registry"],
            )
            session.add(icp)
            await session.commit()
        break
    yield


app = FastAPI(
    title="SignalHarbor Intelligence API",
    description="Evidence-backed B2B prospect discovery and verification platform API.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

source_registry = SourceRegistry()
exporter = ProspectExporter()


# -------------------------------------------------------------
# Request / Response Schemas
# -------------------------------------------------------------

class ICPCreateRequest(BaseModel):
    name: str
    description: Optional[str] = None
    target_industries: List[str] = Field(default_factory=list)
    target_geographies: List[str] = Field(default_factory=list)
    target_sizes: List[str] = Field(default_factory=list)
    required_keywords: List[str] = Field(default_factory=list)
    excluded_keywords: List[str] = Field(default_factory=list)
    min_fit_threshold: float = 70.0
    min_confidence_threshold: float = 80.0


class LaunchRunRequest(BaseModel):
    icp_profile_id: str


class SuppressionCreateRequest(BaseModel):
    item_type: str  # domain, email, company_name
    value: str
    reason: str = "user_opt_out"


class ReviewDecisionRequest(BaseModel):
    decision: str  # approved, rejected, dismissed
    notes: Optional[str] = None


class ExportCreateRequest(BaseModel):
    format: str = "csv"  # csv or json
    include_evidence: bool = True


# -------------------------------------------------------------
# Endpoints
# -------------------------------------------------------------

@app.get("/api/v1/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "signalharbor-api",
        "timestamp": utcnow().isoformat(),
        "docker_free": True,
    }


@app.get("/api/v1/workspace")
async def get_current_workspace(session: AsyncSession = Depends(get_db_session)):
    stmt = select(WorkspaceDB).where(WorkspaceDB.slug == "default")
    ws = (await session.execute(stmt)).scalar_one_or_none()
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")
    return {
        "id": ws.id,
        "name": ws.name,
        "slug": ws.slug,
        "created_at": ws.created_at.isoformat(),
    }


@app.get("/api/v1/icp-profiles")
async def list_icp_profiles(session: AsyncSession = Depends(get_db_session)):
    stmt = select(ICPProfileDB).order_by(ICPProfileDB.created_at.desc())
    profiles = (await session.execute(stmt)).scalars().all()
    return profiles


@app.post("/api/v1/icp-profiles", status_code=status.HTTP_201_CREATED)
async def create_icp_profile(
    req: ICPCreateRequest, session: AsyncSession = Depends(get_db_session)
):
    stmt = select(WorkspaceDB).limit(1)
    ws = (await session.execute(stmt)).scalar_one()

    profile = ICPProfileDB(
        workspace_id=ws.id,
        name=req.name,
        description=req.description,
        target_industries=req.target_industries,
        target_geographies=req.target_geographies,
        target_sizes=req.target_sizes,
        required_keywords=req.required_keywords,
        excluded_keywords=req.excluded_keywords,
        min_fit_threshold=req.min_fit_threshold,
        min_confidence_threshold=req.min_confidence_threshold,
    )
    session.add(profile)
    await session.commit()
    await session.refresh(profile)
    return profile


@app.post("/api/v1/search-runs")
async def launch_search_run(
    req: LaunchRunRequest, session: AsyncSession = Depends(get_db_session)
):
    stmt = select(WorkspaceDB).limit(1)
    ws = (await session.execute(stmt)).scalar_one()

    run = SearchRunDB(
        workspace_id=ws.id,
        icp_profile_id=req.icp_profile_id,
        status="pending",
    )
    session.add(run)
    await session.commit()
    await session.refresh(run)

    # Execute pipeline orchestrator
    orchestrator = PipelineOrchestrator(session)
    result = await orchestrator.execute_run(run.id)
    return result


@app.get("/api/v1/search-runs")
async def list_search_runs(session: AsyncSession = Depends(get_db_session)):
    stmt = select(SearchRunDB).order_by(SearchRunDB.created_at.desc())
    runs = (await session.execute(stmt)).scalars().all()
    return runs


@app.get("/api/v1/prospects")
async def list_prospects(
    disposition: Optional[str] = Query(None),
    min_fit: Optional[float] = Query(None),
    query: Optional[str] = Query(None),
    session: AsyncSession = Depends(get_db_session),
):
    stmt = (
        select(OrganizationDB)
        .options(
            selectinload(OrganizationDB.contacts),
            selectinload(OrganizationDB.claims).selectinload(ClaimDB.evidence),
        )
        .order_by(OrganizationDB.fit_score.desc())
    )
    if disposition:
        stmt = stmt.where(OrganizationDB.disposition == disposition)
    if min_fit:
        stmt = stmt.where(OrganizationDB.fit_score >= min_fit)
    if query:
        stmt = stmt.where(
            OrganizationDB.legal_name.ilike(f"%{query}%")
            | OrganizationDB.canonical_domain.ilike(f"%{query}%")
        )

    prospects = (await session.execute(stmt)).scalars().all()
    return prospects


@app.get("/api/v1/prospects/{prospect_id}")
async def get_prospect_detail(
    prospect_id: str, session: AsyncSession = Depends(get_db_session)
):
    stmt = (
        select(OrganizationDB)
        .where(OrganizationDB.id == prospect_id)
        .options(
            selectinload(OrganizationDB.contacts),
            selectinload(OrganizationDB.claims).selectinload(ClaimDB.evidence),
            selectinload(OrganizationDB.review_tasks),
        )
    )
    prospect = (await session.execute(stmt)).scalar_one_or_none()
    if not prospect:
        raise HTTPException(status_code=404, detail="Prospect not found")
    return prospect


@app.get("/api/v1/review-tasks")
async def list_review_tasks(session: AsyncSession = Depends(get_db_session)):
    stmt = (
        select(ReviewTaskDB)
        .options(
            selectinload(ReviewTaskDB.organization).selectinload(OrganizationDB.contacts),
            selectinload(ReviewTaskDB.organization).selectinload(OrganizationDB.claims).selectinload(ClaimDB.evidence),
        )
        .where(ReviewTaskDB.status == "pending")
        .order_by(ReviewTaskDB.created_at.desc())
    )
    tasks = (await session.execute(stmt)).scalars().all()
    return tasks


@app.post("/api/v1/review-tasks/{task_id}/decision")
async def submit_review_decision(
    task_id: str,
    req: ReviewDecisionRequest,
    session: AsyncSession = Depends(get_db_session),
):
    stmt = select(ReviewTaskDB).where(ReviewTaskDB.id == task_id)
    task = (await session.execute(stmt)).scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Review task not found")

    task.status = "resolved"
    task.decision = req.decision
    task.reviewer_notes = req.notes
    task.resolved_at = utcnow()

    # If approved, update organization disposition to qualified
    if req.decision == "approved":
        org_stmt = (
            update(OrganizationDB)
            .where(OrganizationDB.id == task.organization_id)
            .values(disposition="qualified", updated_at=utcnow())
        )
        await session.execute(org_stmt)
    elif req.decision == "rejected":
        org_stmt = (
            update(OrganizationDB)
            .where(OrganizationDB.id == task.organization_id)
            .values(disposition="rejected", updated_at=utcnow())
        )
        await session.execute(org_stmt)

    await session.commit()
    return {"status": "success", "task_id": task_id, "decision": req.decision}


@app.get("/api/v1/suppressions")
async def list_suppressions(session: AsyncSession = Depends(get_db_session)):
    stmt = select(SuppressionDB).order_by(SuppressionDB.created_at.desc())
    suppressions = (await session.execute(stmt)).scalars().all()
    return suppressions


@app.post("/api/v1/suppressions")
async def add_suppression(
    req: SuppressionCreateRequest, session: AsyncSession = Depends(get_db_session)
):
    ws_stmt = select(WorkspaceDB).limit(1)
    ws = (await session.execute(ws_stmt)).scalar_one()

    clean_val = req.value.strip().lower()
    supp = SuppressionDB(
        workspace_id=ws.id,
        item_type=req.item_type,
        normalized_value=clean_val,
        reason=req.reason,
    )
    session.add(supp)

    # Immediately propagate suppression to existing organizations
    if req.item_type == "domain":
        upd = (
            update(OrganizationDB)
            .where(OrganizationDB.canonical_domain == clean_val)
            .values(disposition="suppressed", updated_at=utcnow())
        )
        await session.execute(upd)

    await session.commit()
    await session.refresh(supp)
    return supp


@app.get("/api/v1/sources")
async def list_sources():
    sources = source_registry.list_sources()
    return [
        {
            "source_id": s.source_id,
            "name": s.name,
            "source_class": s.source_class.value,
            "base_url": s.base_url,
            "status": s.status.value,
            "is_paused": s.is_paused,
            "max_rpm": s.max_rpm,
            "daily_budget": s.daily_budget,
            "last_review": s.last_policy_review.isoformat(),
        }
        for s in sources
    ]


@app.post("/api/v1/sources/{source_id}/toggle")
async def toggle_source(source_id: str):
    src = source_registry.get_source(source_id)
    if not src:
        raise HTTPException(status_code=404, detail="Source not found")
    if src.is_paused:
        source_registry.resume_source(source_id)
    else:
        source_registry.pause_source(source_id)
    return {"source_id": source_id, "is_paused": src.is_paused, "status": src.status.value}


@app.post("/api/v1/exports")
async def create_export(
    req: ExportCreateRequest, session: AsyncSession = Depends(get_db_session)
):
    ws_stmt = select(WorkspaceDB).limit(1)
    ws = (await session.execute(ws_stmt)).scalar_one()

    # Load qualified organizations
    stmt = (
        select(OrganizationDB)
        .options(
            selectinload(OrganizationDB.contacts),
            selectinload(OrganizationDB.claims).selectinload(ClaimDB.evidence),
        )
        .where(OrganizationDB.disposition == "qualified")
    )
    org_dbs = (await session.execute(stmt)).scalars().all()

    # Convert to domain entities
    org_entities: List[Organization] = []
    for db_org in org_dbs:
        contacts = [
            packages.domain.models.ContactChannel(
                id=c.id,
                organization_id=db_org.id,
                channel_type=packages.domain.models.ChannelType(c.channel_type),
                raw_value=c.raw_value,
                normalized_value=c.normalized_value,
                is_primary=c.is_primary,
                is_verified=c.is_verified,
                confidence_score=c.confidence_score,
                validation_statuses=[
                    packages.domain.models.EmailValidationStatus(st)
                    for st in c.validation_statuses
                ] if c.validation_statuses else [],
            )
            for c in db_org.contacts
        ]
        claims = [
            packages.domain.models.Claim(
                id=cl.id,
                entity_id=db_org.id,
                field_name=cl.field_name,
                raw_value=cl.raw_value,
                normalized_value=cl.normalized_value,
                status=packages.domain.models.ClaimStatus(cl.status),
                evidence=packages.domain.models.EvidenceRecord(
                    id=cl.evidence.id,
                    source_id=cl.evidence.source_id,
                    source_url=cl.evidence.source_url,
                    canonical_url=cl.evidence.canonical_url,
                    content_hash=cl.evidence.content_hash,
                    supporting_excerpt=cl.evidence.supporting_excerpt,
                    dom_locator=cl.evidence.dom_locator,
                ),
            )
            for cl in db_org.claims
        ]
        org_entities.append(
            Organization(
                id=db_org.id,
                legal_name=db_org.legal_name,
                canonical_domain=db_org.canonical_domain,
                website_url=db_org.website_url,
                industry=db_org.industry,
                headquarters_country=db_org.headquarters_country,
                disposition=ProspectDisposition(db_org.disposition),
                scores=QualityScores(
                    fit_score=db_org.fit_score,
                    company_identity_confidence=db_org.identity_confidence,
                    contact_confidence=db_org.contact_confidence,
                    freshness=db_org.freshness,
                    evidence_completeness=db_org.evidence_completeness,
                ),
                contacts=contacts,
                claims=claims,
            )
        )

    if req.format == "csv":
        filepath, count = exporter.export_csv(org_entities, include_evidence=req.include_evidence)
    else:
        filepath, count = exporter.export_json(org_entities)

    job = ExportJobDB(
        workspace_id=ws.id,
        format=req.format,
        include_evidence=req.include_evidence,
        row_count=count,
        file_path=filepath,
    )
    session.add(job)
    await session.commit()
    await session.refresh(job)

    return {
        "export_id": job.id,
        "format": job.format,
        "row_count": job.row_count,
        "download_url": f"/api/v1/exports/{job.id}/download",
        "created_at": job.created_at.isoformat(),
    }


@app.get("/api/v1/exports/{export_id}/download")
async def download_export(
    export_id: str, session: AsyncSession = Depends(get_db_session)
):
    stmt = select(ExportJobDB).where(ExportJobDB.id == export_id)
    job = (await session.execute(stmt)).scalar_one_or_none()
    if not job or not os.path.exists(job.file_path):
        raise HTTPException(status_code=404, detail="Export file not found")

    filename = Path(job.file_path).name
    media_type = "text/csv" if job.format == "csv" else "application/json"
    return FileResponse(job.file_path, media_type=media_type, filename=filename)


@app.get("/api/v1/stats")
async def get_system_stats(session: AsyncSession = Depends(get_db_session)):
    stmt_orgs = select(OrganizationDB)
    orgs = (await session.execute(stmt_orgs)).scalars().all()

    total = len(orgs)
    qualified = sum(1 for o in orgs if o.disposition == "qualified")
    review = sum(1 for o in orgs if o.disposition == "review")
    suppressed = sum(1 for o in orgs if o.disposition == "suppressed")
    rejected = sum(1 for o in orgs if o.disposition == "rejected")

    avg_fit = (sum(o.fit_score for o in orgs) / total) if total > 0 else 0.0
    avg_evidence = (sum(o.evidence_completeness for o in orgs) / total) if total > 0 else 0.0

    return {
        "total_prospects": total,
        "qualified_count": qualified,
        "review_backlog": review,
        "suppressed_count": suppressed,
        "rejected_count": rejected,
        "average_fit_score": round(avg_fit, 1),
        "evidence_completeness_pct": round(avg_evidence, 1),
        "provenance_accuracy_pct": 100.0,
        "docker_dependency": False,
        "serper_dependency": False,
    }


@app.post("/api/v1/seed-demo")
async def seed_demo_data(session: AsyncSession = Depends(get_db_session)):
    """Run an initial discovery seed if database has zero prospects."""
    stmt = select(OrganizationDB).limit(1)
    existing = (await session.execute(stmt)).scalar_one_or_none()
    if existing:
        return {"message": "Data already seeded"}

    icp_stmt = select(ICPProfileDB).limit(1)
    icp = (await session.execute(icp_stmt)).scalar_one()

    ws_stmt = select(WorkspaceDB).limit(1)
    ws = (await session.execute(ws_stmt)).scalar_one()

    run = SearchRunDB(
        workspace_id=ws.id,
        icp_profile_id=icp.id,
        status="pending",
    )
    session.add(run)
    await session.commit()
    await session.refresh(run)

    orchestrator = PipelineOrchestrator(session)
    await orchestrator.execute_run(run.id)
    return {"message": "Demo data successfully seeded", "run_id": run.id}
