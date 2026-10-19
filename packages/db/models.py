"""Relational models for SignalHarbor data platform.

Adheres strictly to Section 11 of the SignalHarbor Blueprint.
Enforces UTC timestamps, foreign keys, deterministic IDs, and auditable evidence relationships.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.sqlite import JSON
from sqlalchemy.orm import relationship

from packages.db.database import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def generate_uuid() -> str:
    return str(uuid.uuid4())


class WorkspaceDB(Base):
    __tablename__ = "workspaces"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    users = relationship("UserDB", back_populates="workspace")
    icp_profiles = relationship("ICPProfileDB", back_populates="workspace")
    search_runs = relationship("SearchRunDB", back_populates="workspace")
    suppressions = relationship("SuppressionDB", back_populates="workspace")


class UserDB(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    workspace_id = Column(String(36), ForeignKey("workspaces.id"), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    name = Column(String(255), nullable=False)
    role = Column(String(50), default="member", nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    workspace = relationship("WorkspaceDB", back_populates="users")


class SourceDB(Base):
    __tablename__ = "sources"

    id = Column(String(64), primary_key=True)
    name = Column(String(255), nullable=False)
    source_class = Column(String(64), nullable=False)
    base_url = Column(String(512), nullable=False)
    status = Column(String(32), default="active", nullable=False)
    is_paused = Column(Boolean, default=False, nullable=False)
    max_rpm = Column(Integer, default=30, nullable=False)
    daily_budget = Column(Integer, default=1000, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)


class ICPProfileDB(Base):
    __tablename__ = "icp_profiles"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    workspace_id = Column(String(36), ForeignKey("workspaces.id"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    target_industries = Column(JSON, default=list, nullable=False)
    target_geographies = Column(JSON, default=list, nullable=False)
    target_sizes = Column(JSON, default=list, nullable=False)
    required_keywords = Column(JSON, default=list, nullable=False)
    excluded_keywords = Column(JSON, default=list, nullable=False)
    required_contact_channels = Column(JSON, default=list, nullable=False)
    min_fit_threshold = Column(Float, default=70.0, nullable=False)
    min_confidence_threshold = Column(Float, default=80.0, nullable=False)
    allowed_sources = Column(JSON, default=list, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    workspace = relationship("WorkspaceDB", back_populates="icp_profiles")
    search_runs = relationship("SearchRunDB", back_populates="icp_profile")


class SearchRunDB(Base):
    __tablename__ = "search_runs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    workspace_id = Column(String(36), ForeignKey("workspaces.id"), nullable=False)
    icp_profile_id = Column(String(36), ForeignKey("icp_profiles.id"), nullable=False)
    status = Column(String(32), default="pending", nullable=False)
    query_plan = Column(JSON, default=dict, nullable=False)
    urls_discovered = Column(Integer, default=0, nullable=False)
    pages_crawled = Column(Integer, default=0, nullable=False)
    prospects_found = Column(Integer, default=0, nullable=False)
    prospects_qualified = Column(Integer, default=0, nullable=False)
    prospects_review = Column(Integer, default=0, nullable=False)
    error_summary = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    workspace = relationship("WorkspaceDB", back_populates="search_runs")
    icp_profile = relationship("ICPProfileDB", back_populates="search_runs")
    organizations = relationship("OrganizationDB", back_populates="search_run")


class OrganizationDB(Base):
    __tablename__ = "organizations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    search_run_id = Column(String(36), ForeignKey("search_runs.id"), nullable=True)
    legal_name = Column(String(255), nullable=False)
    canonical_domain = Column(String(255), index=True, nullable=False)
    website_url = Column(String(512), nullable=False)
    industry = Column(String(128), nullable=True)
    description = Column(Text, nullable=True)
    employee_count_range = Column(String(64), nullable=True)
    headquarters_country = Column(String(64), nullable=True)
    headquarters_city = Column(String(128), nullable=True)
    postal_address = Column(Text, nullable=True)
    registry_number = Column(String(128), nullable=True)
    disposition = Column(String(32), default="review", nullable=False)
    fit_score = Column(Float, default=0.0, nullable=False)
    identity_confidence = Column(Float, default=0.0, nullable=False)
    contact_confidence = Column(Float, default=0.0, nullable=False)
    freshness = Column(Float, default=100.0, nullable=False)
    evidence_completeness = Column(Float, default=0.0, nullable=False)
    scores_detail = Column(JSON, default=dict, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    search_run = relationship("SearchRunDB", back_populates="organizations")
    contacts = relationship("ContactChannelDB", back_populates="organization", cascade="all, delete-orphan")
    claims = relationship("ClaimDB", back_populates="organization", cascade="all, delete-orphan")
    review_tasks = relationship("ReviewTaskDB", back_populates="organization")


class ContactChannelDB(Base):
    __tablename__ = "contact_channels"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id"), nullable=False)
    channel_type = Column(String(32), nullable=False)
    raw_value = Column(String(255), nullable=False)
    normalized_value = Column(String(255), index=True, nullable=False)
    is_primary = Column(Boolean, default=False, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    confidence_score = Column(Float, default=0.0, nullable=False)
    validation_statuses = Column(JSON, default=list, nullable=False)
    validation_notes = Column(JSON, default=list, nullable=False)
    last_checked_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    organization = relationship("OrganizationDB", back_populates="contacts")


class EvidenceRecordDB(Base):
    __tablename__ = "evidence_records"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    source_id = Column(String(64), nullable=False)
    source_url = Column(String(1024), nullable=False)
    canonical_url = Column(String(1024), nullable=False)
    page_title = Column(String(512), nullable=True)
    retrieval_timestamp = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    content_hash = Column(String(64), nullable=False)
    dom_locator = Column(String(255), nullable=True)
    supporting_excerpt = Column(Text, nullable=False)
    extraction_method = Column(String(64), default="deterministic_dom", nullable=False)
    parser_version = Column(String(32), default="1.0.0", nullable=False)
    snapshot_storage_key = Column(String(255), nullable=True)

    claims = relationship("ClaimDB", back_populates="evidence")


class ClaimDB(Base):
    __tablename__ = "claims"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id"), nullable=False)
    evidence_id = Column(String(36), ForeignKey("evidence_records.id"), nullable=False)
    field_name = Column(String(64), nullable=False)
    raw_value = Column(Text, nullable=False)
    normalized_value = Column(Text, nullable=False)
    status = Column(String(32), default="candidate", nullable=False)
    confidence = Column(Float, default=0.5, nullable=False)
    dispute_reason = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    organization = relationship("OrganizationDB", back_populates="claims")
    evidence = relationship("EvidenceRecordDB", back_populates="claims")


class ReviewTaskDB(Base):
    __tablename__ = "review_tasks"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id"), nullable=False)
    reason = Column(String(255), nullable=False)
    details = Column(JSON, default=dict, nullable=False)
    status = Column(String(32), default="pending", nullable=False)  # pending, resolved, dismissed
    decision = Column(String(32), nullable=True)
    reviewer_notes = Column(Text, nullable=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    organization = relationship("OrganizationDB", back_populates="review_tasks")


class SuppressionDB(Base):
    __tablename__ = "suppressions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    workspace_id = Column(String(36), ForeignKey("workspaces.id"), nullable=False)
    item_type = Column(String(32), nullable=False)  # domain, email, company_name
    normalized_value = Column(String(255), index=True, nullable=False)
    reason = Column(String(255), default="user_opt_out", nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    workspace = relationship("WorkspaceDB", back_populates="suppressions")


class ExportJobDB(Base):
    __tablename__ = "export_jobs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    workspace_id = Column(String(36), ForeignKey("workspaces.id"), nullable=False)
    format = Column(String(16), default="csv", nullable=False)
    include_evidence = Column(Boolean, default=True, nullable=False)
    row_count = Column(Integer, default=0, nullable=False)
    file_path = Column(String(512), nullable=False)
    status = Column(String(32), default="completed", nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)


class WorkQueueItemDB(Base):
    __tablename__ = "work_queue"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    task_type = Column(String(64), index=True, nullable=False)
    priority = Column(Integer, default=10, nullable=False)
    status = Column(String(32), index=True, default="pending", nullable=False)
    payload = Column(JSON, default=dict, nullable=False)
    attempts = Column(Integer, default=0, nullable=False)
    max_attempts = Column(Integer, default=3, nullable=False)
    lease_owner = Column(String(128), nullable=True)
    lease_expires_at = Column(DateTime(timezone=True), nullable=True)
    last_error = Column(Text, nullable=True)
    idempotency_key = Column(String(128), index=True, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)


class AuditEventDB(Base):
    __tablename__ = "audit_events"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    workspace_id = Column(String(36), nullable=False)
    event_type = Column(String(64), nullable=False)
    actor = Column(String(128), default="system", nullable=False)
    details = Column(JSON, default=dict, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
