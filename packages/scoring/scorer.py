"""Multi-dimensional scoring and qualification routing engine.

Implements Section 10 of the SignalHarbor Blueprint:
- 5 distinct score dimensions: ICP fit, Identity confidence, Contact confidence, Freshness, Evidence completeness.
- Strict export gate: never qualify a lead without actionable, source-backed contact channels.
- Transparent explainability: generates explicit positive and negative reason codes.
"""

from __future__ import annotations

from typing import List, Optional

from packages.domain.models import (
    ChannelType,
    ContactChannel,
    EmailValidationStatus,
    ICPProfile,
    Organization,
    ProspectDisposition,
    QualityScores,
)


class ProspectScorer:
    """Evaluates candidates against ICP criteria and strict evidence gates."""

    def evaluate(
        self,
        org: Organization,
        icp: ICPProfile,
        is_suppressed: bool = False,
    ) -> QualityScores:
        scores = QualityScores()

        # 0. Immediate suppression check
        if is_suppressed:
            scores.risk_flags.append("SUPPRESSED_BY_POLICY")
            scores.negative_reasons.append("Organization or domain matches workspace suppression list")
            return scores

        # 1. Evaluate ICP Fit (0-100)
        fit_points = 0.0
        total_fit_weights = 0.0

        # Industry match
        if icp.target_industries:
            total_fit_weights += 40.0
            if org.industry and any(
                ind.lower() in org.industry.lower()
                for ind in icp.target_industries
            ):
                fit_points += 40.0
                scores.positive_reasons.append(f"Industry '{org.industry}' aligns with target criteria")
            else:
                scores.negative_reasons.append(f"Industry '{org.industry or 'Unknown'}' does not match target")

        # Geography match
        if icp.target_geographies:
            total_fit_weights += 30.0
            country = (org.headquarters_country or "").lower()
            if any(geo.lower() in country for geo in icp.target_geographies):
                fit_points += 30.0
                scores.positive_reasons.append(f"Headquarters '{org.headquarters_country}' within target geography")
            else:
                scores.negative_reasons.append(f"Headquarters '{org.headquarters_country or 'Unknown'}' outside target")

        # Company Size match
        if icp.target_sizes:
            total_fit_weights += 15.0
            if org.employee_count_range and org.employee_count_range in icp.target_sizes:
                fit_points += 15.0
                scores.positive_reasons.append(f"Company size '{org.employee_count_range}' matches ICP")
            else:
                scores.negative_reasons.append(f"Company size '{org.employee_count_range or 'Unknown'}' outside target")

        # Keyword checks
        if icp.required_keywords:
            total_fit_weights += 15.0
            desc = (org.description or "").lower()
            matched_kw = [kw for kw in icp.required_keywords if kw.lower() in desc]
            if matched_kw:
                fit_points += 15.0
                scores.positive_reasons.append(f"Found required keywords: {', '.join(matched_kw)}")
            else:
                scores.negative_reasons.append("Missing required keyword mentions in company profile")

        scores.fit_score = (fit_points / total_fit_weights * 100.0) if total_fit_weights > 0 else 85.0

        # 2. Company Identity Confidence (0-100)
        id_score = 50.0
        if org.canonical_domain:
            id_score += 20.0
            scores.positive_reasons.append(f"Verified canonical domain '{org.canonical_domain}'")
        if org.registry_number:
            id_score += 20.0
            scores.positive_reasons.append(f"Corroborated by official registry record ({org.registry_number})")
        if len(org.claims) >= 3:
            id_score += 10.0
        scores.company_identity_confidence = min(100.0, id_score)

        # 3. Contact Confidence (0-100)
        contact_score = 0.0
        verified_channels = [c for c in org.contacts if c.is_verified]
        if verified_channels:
            best_contact = max(verified_channels, key=lambda c: c.confidence_score)
            contact_score = best_contact.confidence_score
            scores.positive_reasons.append(f"Direct verified channel: {best_contact.normalized_value} ({best_contact.channel_type.value})")
        elif org.contacts:
            contact_score = 35.0
            scores.negative_reasons.append("Contact channel present but pending full domain/DNS verification")
        else:
            contact_score = 0.0
            scores.negative_reasons.append("No actionable contact channels discovered")

        scores.contact_confidence = contact_score

        # 4. Freshness (0-100)
        scores.freshness = 100.0  # Freshly harvested

        # 5. Evidence Completeness (0-100)
        critical_fields = [org.legal_name, org.canonical_domain, org.industry]
        present_fields = [f for f in critical_fields if f]
        scores.evidence_completeness = (len(present_fields) / len(critical_fields)) * 100.0

        return scores

    def determine_disposition(
        self,
        scores: QualityScores,
        icp: ICPProfile,
        has_verified_contact: bool,
    ) -> ProspectDisposition:
        if "SUPPRESSED_BY_POLICY" in scores.risk_flags:
            return ProspectDisposition.SUPPRESSED

        # Strict export gate: must meet fit threshold AND have verified contact channel
        if scores.fit_score >= icp.min_fit_threshold and scores.company_identity_confidence >= icp.min_confidence_threshold:
            if has_verified_contact:
                return ProspectDisposition.QUALIFIED
            else:
                # Plausible fit but no verified contact -> Hold for review or discovery view
                return ProspectDisposition.REVIEW

        if scores.fit_score >= (icp.min_fit_threshold - 20.0):
            return ProspectDisposition.REVIEW

        return ProspectDisposition.REJECTED
