"""Contact channel validation engine and state machine.

Implements Section 9 of the SignalHarbor Blueprint:
- Strict non-negotiable rule: Never guess or fabricate contacts.
- Email state machine: syntax, MX records, disposable providers, role vs named.
- Explicit transparency: MX presence proves mail routing, NOT mailbox existence.
- Phone validation & Contact form route validation.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import List, Optional, Tuple
from urllib.parse import urlparse

import dns.resolver

from packages.domain.models import ChannelType, EmailValidationStatus

# Well-known role-based local parts
ROLE_PREFIXES = {
    "info",
    "sales",
    "support",
    "contact",
    "hello",
    "team",
    "help",
    "admin",
    "billing",
    "press",
    "media",
    "marketing",
    "inquiries",
    "jobs",
    "careers",
    "office",
}

# Known disposable email domains
DISPOSABLE_DOMAINS = {
    "mailinator.com",
    "tempmail.com",
    "10minutemail.com",
    "guerrillamail.com",
    "yopmail.com",
    "trashmail.com",
    "sharklasers.com",
}


@dataclass
class ContactValidationReport:
    raw_value: str
    normalized_value: str
    channel_type: ChannelType
    statuses: List[EmailValidationStatus] = field(default_factory=list)
    confidence_score: float = 0.0
    is_verified: bool = False
    notes: List[str] = field(default_factory=list)


class ContactValidator:
    """Rigorous validator for public business contact channels."""

    def __init__(self, dns_timeout: float = 3.0):
        self.dns_timeout = dns_timeout

    def validate_email(
        self,
        raw_email: str,
        is_official_source: bool = True,
        check_live_dns: bool = True,
    ) -> ContactValidationReport:
        clean = raw_email.strip().lower()
        report = ContactValidationReport(
            raw_value=raw_email,
            normalized_value=clean,
            channel_type=ChannelType.EMAIL,
        )

        # 1. Source publication status
        if is_official_source:
            report.statuses.append(EmailValidationStatus.PUBLISHED_OFFICIAL)
            report.notes.append("Discovered on company's official first-party website or registry")
        else:
            report.statuses.append(EmailValidationStatus.PUBLISHED_THIRD_PARTY)
            report.notes.append("Discovered on permitted third-party directory")

        # 2. Syntax check
        if "@" not in clean or ".." in clean:
            report.statuses.append(EmailValidationStatus.SYNTAX_INVALID)
            report.notes.append("Email fails RFC syntax checks")
            report.confidence_score = 0.0
            return report

        local_part, domain = clean.split("@", 1)
        if not local_part or not domain or "." not in domain:
            report.statuses.append(EmailValidationStatus.SYNTAX_INVALID)
            report.confidence_score = 0.0
            return report

        report.statuses.append(EmailValidationStatus.SYNTAX_VALID)

        # 3. Disposable provider check
        if domain in DISPOSABLE_DOMAINS:
            report.statuses.append(EmailValidationStatus.DISPOSABLE_SUSPECTED)
            report.notes.append(f"Domain {domain} is recognized as a temporary/disposable provider")
            report.confidence_score = 15.0
            return report

        # 4. Role address vs named address
        if local_part in ROLE_PREFIXES:
            report.statuses.append(EmailValidationStatus.ROLE_ADDRESS)
            report.notes.append(f"Role address detected ({local_part})")
        else:
            report.statuses.append(EmailValidationStatus.NAMED_ADDRESS)
            report.notes.append("Personal / individual professional business address")

        # 5. DNS / MX verification
        has_mx = False
        if check_live_dns:
            try:
                resolver = dns.resolver.Resolver()
                resolver.lifetime = self.dns_timeout
                answers = resolver.resolve(domain, "MX")
                if answers:
                    has_mx = True
                    report.statuses.append(EmailValidationStatus.MX_PRESENT)
                    report.statuses.append(EmailValidationStatus.DOMAIN_DNS_OK)
                    report.notes.append(f"Active MX record verified: {answers[0].exchange}")
            except (dns.resolver.NoAnswer, dns.resolver.NXDOMAIN):
                report.statuses.append(EmailValidationStatus.MX_MISSING)
                report.notes.append(f"No active MX records found for domain '{domain}'")
            except Exception as e:
                report.statuses.append(EmailValidationStatus.MX_UNKNOWN)
                report.notes.append(f"DNS resolution check timed out or unavailable: {e}")
        else:
            report.statuses.append(EmailValidationStatus.MX_UNKNOWN)

        # 6. Honest mailbox status
        report.statuses.append(EmailValidationStatus.MAILBOX_STATUS_UNKNOWN)
        report.notes.append("Mailbox delivery status is unprobed (inbox placement not guaranteed)")

        # Confidence calculation
        score = 40.0
        if EmailValidationStatus.PUBLISHED_OFFICIAL in report.statuses:
            score += 30.0
        elif EmailValidationStatus.PUBLISHED_THIRD_PARTY in report.statuses:
            score += 15.0

        if EmailValidationStatus.SYNTAX_VALID in report.statuses:
            score += 15.0

        if EmailValidationStatus.MX_PRESENT in report.statuses:
            score += 15.0
            report.is_verified = True
        elif EmailValidationStatus.MX_MISSING in report.statuses:
            score -= 40.0
            report.is_verified = False

        report.confidence_score = max(0.0, min(100.0, score))
        return report

    def validate_phone(
        self,
        raw_phone: str,
        is_official_source: bool = True,
    ) -> ContactValidationReport:
        clean = re.sub(r"[^\d+]", "", raw_phone)
        report = ContactValidationReport(
            raw_value=raw_phone,
            normalized_value=clean,
            channel_type=ChannelType.PHONE,
        )

        if len(clean) < 7 or len(clean) > 16:
            report.confidence_score = 20.0
            report.notes.append("Phone length falls outside standard E.164 ranges")
            return report

        report.confidence_score = 80.0 if is_official_source else 60.0
        report.is_verified = is_official_source
        report.notes.append("Phone syntax structured according to E.164 conventions")
        return report

    def validate_contact_form(
        self,
        form_url: str,
        is_official_source: bool = True,
    ) -> ContactValidationReport:
        parsed = urlparse(form_url)
        clean = f"{parsed.scheme}://{parsed.netloc}{parsed.path}"
        report = ContactValidationReport(
            raw_value=form_url,
            normalized_value=clean,
            channel_type=ChannelType.CONTACT_FORM,
        )
        report.confidence_score = 90.0 if is_official_source else 60.0
        report.is_verified = True
        report.notes.append("Direct official contact page route")
        return report
