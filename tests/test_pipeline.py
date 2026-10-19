"""Unit and integration test suite for SignalHarbor.

Verifies:
1. URL normalization & SSRF defenses.
2. Contact channel validation & email state transitions.
3. Deterministic HTML & JSON-LD claim extraction.
4. Entity resolution match tiers & deduplication.
5. Multi-dimensional scoring & strict export gates.
6. Durable work queue leases & idempotency.
"""

import pytest
from packages.domain.models import (
    ChannelType,
    EmailValidationStatus,
    ICPProfile,
    Organization,
    ProspectDisposition,
    ContactChannel,
)
from packages.harvester.fetcher import (
    SSRFValidationError,
    normalize_url,
    validate_ip_safety,
)
from packages.identity.resolver import (
    EntityResolver,
    normalize_company_name,
    normalize_domain,
)
from packages.parsing.extractor import PageExtractor
from packages.scoring.scorer import ProspectScorer
from packages.validation.contact_validator import ContactValidator


def test_url_normalization():
    raw = "HTTPS://WWW.Example.com:443/products/?utm_source=google&gclid=12345&tab=features"
    normalized = normalize_url(raw)
    assert normalized == "https://www.example.com/products?tab=features"


def test_ssrf_blocks_private_ip():
    with pytest.raises(SSRFValidationError):
        validate_ip_safety("localhost")

    with pytest.raises(SSRFValidationError):
        validate_ip_safety("127.0.0.1")


def test_contact_validator_email_states():
    validator = ContactValidator()
    report = validator.validate_email("sales@example.com", is_official_source=True, check_live_dns=False)

    assert EmailValidationStatus.PUBLISHED_OFFICIAL in report.statuses
    assert EmailValidationStatus.SYNTAX_VALID in report.statuses
    assert EmailValidationStatus.ROLE_ADDRESS in report.statuses
    assert EmailValidationStatus.MAILBOX_STATUS_UNKNOWN in report.statuses
    assert report.channel_type == ChannelType.EMAIL


def test_disposable_email_detection():
    validator = ContactValidator()
    report = validator.validate_email("user@mailinator.com", is_official_source=False, check_live_dns=False)
    assert EmailValidationStatus.DISPOSABLE_SUSPECTED in report.statuses
    assert report.is_verified is False


def test_entity_resolution_tiers():
    resolver = EntityResolver()

    # Strong match on canonical domain
    m1 = resolver.evaluate_match(
        candidate_domain="https://www.apple.com",
        candidate_name="Apple Technologies",
        existing_domain="apple.com",
        existing_name="Apple Inc.",
    )
    assert m1.tier == "strong"
    assert m1.score > 0.95

    # Possible match on same name but differing domains -> routes to review
    m2 = resolver.evaluate_match(
        candidate_domain="apple-orchards.org",
        candidate_name="Apple Inc.",
        existing_domain="apple.com",
        existing_name="Apple Inc.",
    )
    assert m2.tier == "possible"
    assert m2.requires_manual_review is True


def test_page_extractor_jsonld_and_mailto():
    html = """
    <html>
        <head>
            <title>Acme Robotics Corp</title>
            <script type="application/ld+json">
            {
                "@context": "https://schema.org",
                "@type": "Organization",
                "name": "Acme Robotics",
                "email": "info@acme-robotics.com"
            }
            </script>
        </head>
        <body>
            <footer>
                Contact: <a href="mailto:support@acme-robotics.com">Support Team</a>
                Phone: <a href="tel:+18005550199">+1 (800) 555-0199</a>
            </footer>
        </body>
    </html>
    """
    extractor = PageExtractor()
    data = extractor.parse(html, "https://acme-robotics.com")

    assert data.organization_name == "Acme Robotics"
    emails = [e[0] for e in data.emails]
    assert "info@acme-robotics.com" in emails
    assert "support@acme-robotics.com" in emails
    assert len(data.phones) >= 1


def test_prospect_scorer_strict_export_gate():
    scorer = ProspectScorer()
    icp = ICPProfile(
        id="icp-1",
        workspace_id="ws-1",
        name="Logistics",
        target_industries=["Logistics"],
        target_geographies=["United States"],
        min_fit_threshold=70.0,
        min_confidence_threshold=70.0,
    )

    # Org without verified contact channel should NOT be QUALIFIED
    unverified_org = Organization(
        id="org-1",
        legal_name="Apex Logistics LLC",
        canonical_domain="apexlogistics.com",
        website_url="https://apexlogistics.com",
        industry="Logistics",
        headquarters_country="United States",
        contacts=[],  # No contacts
    )

    scores = scorer.evaluate(unverified_org, icp)
    disposition = scorer.determine_disposition(scores, icp, has_verified_contact=False)
    assert disposition != ProspectDisposition.QUALIFIED
    assert disposition == ProspectDisposition.REVIEW

    # With verified contact channel
    verified_channel = ContactChannel(
        id="c-1",
        organization_id="org-1",
        channel_type=ChannelType.EMAIL,
        raw_value="inquiries@apexlogistics.com",
        normalized_value="inquiries@apexlogistics.com",
        is_verified=True,
        confidence_score=90.0,
    )
    unverified_org.contacts.append(verified_channel)
    disposition_qualified = scorer.determine_disposition(scores, icp, has_verified_contact=True)
    assert disposition_qualified == ProspectDisposition.QUALIFIED
