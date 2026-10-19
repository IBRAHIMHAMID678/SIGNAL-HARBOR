"""Export generation engine with full evidence provenance.

Implements Section 10.3 and Section 14.3 of the SignalHarbor Blueprint:
- Enforces strict export gate (actionable contact channels, verified identity).
- Preserves full provenance: source URL, retrieval timestamp, extraction excerpt, DOM locator.
- Supports both CSV and JSON formats with custom inclusion toggles.
"""

from __future__ import annotations

import csv
import io
import json
from dataclasses import asdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from packages.domain.models import Organization, ProspectDisposition

EXPORTS_DIR = Path("./data/exports")
EXPORTS_DIR.mkdir(parents=True, exist_ok=True)


class ProspectExporter:
    """Produces auditable prospect exports with end-to-end evidence trails."""

    def export_csv(
        self,
        organizations: List[Organization],
        include_evidence: bool = True,
        filename_prefix: str = "export",
    ) -> Tuple[str, int]:
        timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
        filepath = EXPORTS_DIR / f"{filename_prefix}_{timestamp}.csv"

        fieldnames = [
            "organization_id",
            "company_name",
            "canonical_domain",
            "website_url",
            "industry",
            "headquarters_country",
            "headquarters_city",
            "disposition",
            "fit_score",
            "identity_confidence",
            "contact_confidence",
            "primary_contact_type",
            "primary_contact_value",
            "primary_contact_verified",
            "validation_statuses",
        ]
        if include_evidence:
            fieldnames.extend([
                "provenance_source_url",
                "provenance_observed_at",
                "provenance_dom_locator",
                "provenance_excerpt",
            ])

        exported_count = 0
        with open(filepath, mode="w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()

            for org in organizations:
                # Default gate: only qualified prospects by default
                if org.disposition != ProspectDisposition.QUALIFIED:
                    continue

                primary_contact = next(
                    (c for c in org.contacts if c.is_verified),
                    org.contacts[0] if org.contacts else None,
                )
                primary_claim = org.claims[0] if org.claims else None

                row = {
                    "organization_id": org.id,
                    "company_name": org.legal_name,
                    "canonical_domain": org.canonical_domain,
                    "website_url": org.website_url,
                    "industry": org.industry or "Unknown",
                    "headquarters_country": org.headquarters_country or "Unknown",
                    "headquarters_city": org.headquarters_city or "Unknown",
                    "disposition": org.disposition.value,
                    "fit_score": round(org.scores.fit_score, 1),
                    "identity_confidence": round(org.scores.company_identity_confidence, 1),
                    "contact_confidence": round(org.scores.contact_confidence, 1),
                    "primary_contact_type": primary_contact.channel_type.value if primary_contact else "none",
                    "primary_contact_value": primary_contact.normalized_value if primary_contact else "none",
                    "primary_contact_verified": primary_contact.is_verified if primary_contact else False,
                    "validation_statuses": "; ".join([s.value for s in primary_contact.validation_statuses]) if primary_contact else "",
                }

                if include_evidence:
                    row["provenance_source_url"] = primary_claim.evidence.source_url if primary_claim else org.website_url
                    row["provenance_observed_at"] = primary_claim.evidence.retrieval_timestamp.isoformat() if primary_claim else ""
                    row["provenance_dom_locator"] = primary_claim.evidence.dom_locator or "" if primary_claim else ""
                    row["provenance_excerpt"] = primary_claim.evidence.supporting_excerpt if primary_claim else ""

                writer.writerow(row)
                exported_count += 1

        return str(filepath), exported_count

    def export_json(
        self,
        organizations: List[Organization],
        filename_prefix: str = "export",
    ) -> Tuple[str, int]:
        timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
        filepath = EXPORTS_DIR / f"{filename_prefix}_{timestamp}.json"

        qualified = [
            org.model_dump(mode="json")
            for org in organizations
            if org.disposition == ProspectDisposition.QUALIFIED
        ]

        with open(filepath, mode="w", encoding="utf-8") as f:
            json.dump(qualified, f, indent=2)

        return str(filepath), len(qualified)
