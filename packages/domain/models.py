"""Core domain models, schemas, and enumerations for SignalHarbor.

Strict compliance with the SignalHarbor Complete Blueprint:
- Evidence before claims: every critical field has provenance (source URL, timestamp, DOM/text excerpt).
- Separate fit score from data confidence.
- Distinct states: unknown, conflicting, disputed, corroborated, supported.
- Explicit non-negotiable rule: Never fabricate or guess unverified contacts.
"""

from __future__ import annotations

import enum
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, HttpUrl


class ClaimStatus(str, enum.Enum):
    CANDIDATE = "candidate"
    SUPPORTED = "supported"
    CORROBORATED = "corroborated"
    DISPUTED = "disputed"
    REJECTED = "rejected"
    STALE = "stale"
    SUPERSEDED = "superseded"


class ChannelType(str, enum.Enum):
    EMAIL = "email"
    PHONE = "phone"
    CONTACT_FORM = "contact_form"
    SOCIAL_URL = "social_url"


class EmailValidationStatus(str, enum.Enum):
    PUBLISHED_OFFICIAL = "published_on_official_source"
    PUBLISHED_THIRD_PARTY = "published_on_third_party_source"
    SYNTAX_VALID = "syntax_valid"
    SYNTAX_INVALID = "syntax_invalid"
    DOMAIN_DNS_OK = "domain_dns_ok"
    DOMAIN_DNS_MISSING = "domain_dns_missing"
    DNS_UNKNOWN = "dns_unknown"
    MX_PRESENT = "mx_present"
    MX_MISSING = "mx_missing"
    MX_UNKNOWN = "mx_unknown"
    DISPOSABLE_SUSPECTED = "disposable_provider_suspected"
    ROLE_ADDRESS = "role_address"
    NAMED_ADDRESS = "named_address"
    UNKNOWN_TYPE = "unknown_type"
    CATCH_ALL_POSSIBLE = "catch_all_possible"
    MAILBOX_STATUS_UNKNOWN = "mailbox_status_unknown"
    SUPPRESSED = "suppressed"
    OPTED_OUT = "opted_out"
    STALE = "stale"


class ProspectDisposition(str, enum.Enum):
    QUALIFIED = "qualified"
    REVIEW = "review"
    REJECTED = "rejected"
    SUPPRESSED = "suppressed"
    STALE = "stale"


class SourceClass(str, enum.Enum):
    OFFICIAL_WEBSITE = "official_website"
    GOVERNMENT_REGISTRY = "government_registry"
    INDUSTRY_DIRECTORY = "industry_directory"
    SEARCH_DISCOVERY = "search_discovery"
    SITEMAP_FEED = "sitemap_feed"
    CUSTOMER_SEED = "customer_seed"


class SourceStatus(str, enum.Enum):
    ACTIVE = "active"
    LIMITED = "limited"
    PAUSED = "paused"
    BLOCKED = "blocked"
    NEEDS_REVIEW = "needs_review"
    RETIRED = "retired"


class JobStatus(str, enum.Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    DEAD_LETTER = "dead_letter"
    CANCELLED = "cancelled"


# Evidence Model
class EvidenceRecord(BaseModel):
    id: str
    source_id: str
    source_url: str
    canonical_url: str
    page_title: Optional[str] = None
    retrieval_timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    claimed_date: Optional[datetime] = None
    content_hash: str
    dom_locator: Optional[str] = None
    supporting_excerpt: str
    extraction_method: str = "deterministic_dom"
    parser_version: str = "1.0.0"
    snapshot_storage_key: Optional[str] = None


# Claim Model
class Claim(BaseModel):
    id: str
    entity_id: str
    field_name: str
    raw_value: str
    normalized_value: str
    evidence: EvidenceRecord
    status: ClaimStatus = ClaimStatus.CANDIDATE
    confidence: float = Field(ge=0.0, le=1.0, default=0.5)
    dispute_reason: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# Contact Channel Model
class ContactChannel(BaseModel):
    id: str
    organization_id: str
    channel_type: ChannelType
    raw_value: str
    normalized_value: str
    is_primary: bool = False
    evidence_ids: List[str] = Field(default_factory=list)
    validation_statuses: List[EmailValidationStatus] = Field(default_factory=list)
    confidence_score: float = Field(ge=0.0, le=100.0, default=0.0)
    is_verified: bool = False  # True only if publication evidence + DNS/syntax pass
    validation_notes: List[str] = Field(default_factory=list)
    last_checked_at: Optional[datetime] = None


# Multi-Dimensional Quality Scores
class QualityScores(BaseModel):
    fit_score: float = Field(ge=0.0, le=100.0, default=0.0)
    company_identity_confidence: float = Field(ge=0.0, le=100.0, default=0.0)
    contact_confidence: float = Field(ge=0.0, le=100.0, default=0.0)
    freshness: float = Field(ge=0.0, le=100.0, default=100.0)
    evidence_completeness: float = Field(ge=0.0, le=100.0, default=0.0)
    positive_reasons: List[str] = Field(default_factory=list)
    negative_reasons: List[str] = Field(default_factory=list)
    risk_flags: List[str] = Field(default_factory=list)


# Organization Entity
class Organization(BaseModel):
    id: str
    legal_name: str
    trading_names: List[str] = Field(default_factory=list)
    canonical_domain: str
    website_url: str
    industry: Optional[str] = None
    industry_taxonomy_id: Optional[str] = None
    description: Optional[str] = None
    employee_count_range: Optional[str] = None
    headquarters_country: Optional[str] = None
    headquarters_city: Optional[str] = None
    postal_address: Optional[str] = None
    registry_jurisdiction: Optional[str] = None
    registry_number: Optional[str] = None
    contacts: List[ContactChannel] = Field(default_factory=list)
    claims: List[Claim] = Field(default_factory=list)
    scores: QualityScores = Field(default_factory=QualityScores)
    disposition: ProspectDisposition = ProspectDisposition.REVIEW
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# Ideal Customer Profile (ICP) Criteria
class ICPProfile(BaseModel):
    id: str
    workspace_id: str
    name: str
    description: Optional[str] = None
    target_industries: List[str] = Field(default_factory=list)
    target_geographies: List[str] = Field(default_factory=list)
    target_sizes: List[str] = Field(default_factory=list)  # e.g., ["11-50", "51-200"]
    required_keywords: List[str] = Field(default_factory=list)
    excluded_keywords: List[str] = Field(default_factory=list)
    required_contact_channels: List[ChannelType] = Field(
        default_factory=lambda: [ChannelType.EMAIL]
    )
    min_fit_threshold: float = 70.0
    min_confidence_threshold: float = 80.0
    allowed_sources: List[SourceClass] = Field(
        default_factory=lambda: [
            SourceClass.OFFICIAL_WEBSITE,
            SourceClass.GOVERNMENT_REGISTRY,
            SourceClass.INDUSTRY_DIRECTORY,
            SourceClass.CUSTOMER_SEED,
        ]
    )
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
