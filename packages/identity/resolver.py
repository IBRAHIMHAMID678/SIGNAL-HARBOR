"""Entity resolution, domain normalization, and deduplication engine.

Implements Section 8 of the SignalHarbor Blueprint:
- Strict matching tiers: Strong (auto-link), Likely, Possible (routes to ReviewQueue).
- Domain normalization & punycode handling.
- Legal entity suffix normalization without losing original legal names.
- Duplicate prevention with auditable merge records.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from typing import List, Optional, Set, Tuple
from urllib.parse import urlparse

LEGAL_SUFFIXES = [
    r"\binc\.?\b",
    r"\bincorporated\b",
    r"\bllc\.?\b",
    r"\bltd\.?\b",
    r"\blimited\b",
    r"\bcorp\.?\b",
    r"\bcorporation\b",
    r"\bgmbh\b",
    r"\bag\b",
    r"\bs\.?a\.?\b",
    r"\bs\.?r\.?l\.?\b",
    r"\bpty\.?\s+ltd\.?\b",
    r"\bplc\b",
    r"\bco\.?\b",
    r"\bcompany\b",
]

SUFFIX_REGEX = re.compile("|".join(LEGAL_SUFFIXES), re.IGNORECASE)


def normalize_domain(domain_or_url: str) -> str:
    """Canonicalize domain name: strip protocols, port, www, trailing slashes, and lowercase."""
    text = domain_or_url.strip().lower()
    if not text.startswith(("http://", "https://")):
        text = "https://" + text
    parsed = urlparse(text)
    host = parsed.netloc.split(":")[0]
    if host.startswith("www."):
        host = host[4:]
    return host


def normalize_company_name(raw_name: str) -> Tuple[str, Optional[str]]:
    """Clean company name, stripping legal suffixes for matching while returning detected suffix."""
    name = raw_name.strip()
    detected_suffix = None

    match = SUFFIX_REGEX.search(name)
    if match:
        detected_suffix = match.group(0).strip(" .").upper()
        # Remove suffix for the core normalized comparison
        core_name = SUFFIX_REGEX.sub("", name)
    else:
        core_name = name

    # Cleanup whitespace and punctuation
    cleaned = re.sub(r"[^\w\s]", " ", core_name)
    cleaned = re.sub(r"\s+", " ", cleaned).strip().lower()
    return cleaned, detected_suffix


@dataclass
class MatchResult:
    tier: str  # "strong", "likely", "possible", "none"
    score: float
    reason: str
    requires_manual_review: bool = False


class EntityResolver:
    """Resolution engine evaluating candidate matches against existing entities."""

    def evaluate_match(
        self,
        candidate_domain: str,
        candidate_name: str,
        existing_domain: str,
        existing_name: str,
        candidate_registry_id: Optional[str] = None,
        existing_registry_id: Optional[str] = None,
    ) -> MatchResult:
        norm_cand_domain = normalize_domain(candidate_domain)
        norm_exist_domain = normalize_domain(existing_domain)

        # 1. Strong match: Matching government registry numbers
        if candidate_registry_id and existing_registry_id:
            if candidate_registry_id.strip() == existing_registry_id.strip():
                return MatchResult(
                    tier="strong",
                    score=1.0,
                    reason=f"Exact match on official registry ID '{candidate_registry_id}'",
                    requires_manual_review=False,
                )

        # 2. Strong match: Identical canonical domains
        if norm_cand_domain == norm_exist_domain:
            return MatchResult(
                tier="strong",
                score=0.98,
                reason=f"Exact canonical domain match on '{norm_cand_domain}'",
                requires_manual_review=False,
            )

        # 3. Fuzzy name analysis
        norm_cand_name, _ = normalize_company_name(candidate_name)
        norm_exist_name, _ = normalize_company_name(existing_name)

        if norm_cand_name and norm_exist_name and norm_cand_name == norm_exist_name:
            # Same name but DIFFERENT domains -> Possible branch / collision!
            return MatchResult(
                tier="possible",
                score=0.65,
                reason=f"Identical name '{norm_cand_name}' but differing domains ({norm_cand_domain} vs {norm_exist_domain})",
                requires_manual_review=True,
            )

        # Token set overlap for names
        cand_tokens = set(norm_cand_name.split())
        exist_tokens = set(norm_exist_name.split())
        if cand_tokens and exist_tokens:
            intersection = cand_tokens.intersection(exist_tokens)
            union = cand_tokens.union(exist_tokens)
            jaccard = len(intersection) / len(union)
            if jaccard >= 0.7:
                return MatchResult(
                    tier="likely",
                    score=jaccard,
                    reason=f"High token similarity ({jaccard:.2f}) on '{candidate_name}' and '{existing_name}'",
                    requires_manual_review=True,
                )

        return MatchResult(
            tier="none",
            score=0.0,
            reason="No strong domain or corporate identity overlap",
            requires_manual_review=False,
        )
