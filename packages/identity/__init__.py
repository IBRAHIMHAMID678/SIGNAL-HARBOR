"""SignalHarbor identity package."""

from packages.identity.resolver import (
    EntityResolver,
    MatchResult,
    normalize_company_name,
    normalize_domain,
)

__all__ = [
    "EntityResolver",
    "MatchResult",
    "normalize_company_name",
    "normalize_domain",
]
