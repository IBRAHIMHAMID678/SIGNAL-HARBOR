"""Search query planner and provider interfaces.

Implements Section 6.3 and 6.4 of the SignalHarbor Blueprint:
- Abstract SearchProvider interface (no vendor lock-in).
- Query planner producing structured, budgeted search intents.
- Caps near-duplicate query variants to conserve crawl budgets.
"""

from __future__ import annotations

import abc
import hashlib
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

import httpx

from packages.domain.models import ICPProfile


@dataclass
class SearchResult:
    title: str
    url: str
    snippet: str
    source_rank: int
    provider_name: str


@dataclass
class PlannedQuery:
    query_id: str
    query_text: str
    purpose: str  # "category_geo", "official_contact", "registry_lookup"
    target_source_class: str
    budget: int = 10


class SearchProvider(abc.ABC):
    """Abstract interface for public discovery search providers."""

    @abc.abstractmethod
    async def search(self, query: str, limit: int = 10) -> List[SearchResult]:
        pass


class SearXNGProvider(SearchProvider):
    """Provider connecting to a self-hosted SearXNG broker."""

    def __init__(self, endpoint_url: str = "http://localhost:8080"):
        self.endpoint_url = endpoint_url

    async def search(self, query: str, limit: int = 10) -> List[SearchResult]:
        async with httpx.AsyncClient(timeout=8.0) as client:
            try:
                resp = await client.get(
                    f"{self.endpoint_url}/search",
                    params={"q": query, "format": "json"},
                )
                if resp.status_code == 200:
                    data = resp.json()
                    results = []
                    for rank, item in enumerate(data.get("results", [])[:limit], 1):
                        results.append(
                            SearchResult(
                                title=item.get("title", ""),
                                url=item.get("url", ""),
                                snippet=item.get("content", ""),
                                source_rank=rank,
                                provider_name="SearXNG",
                            )
                        )
                    return results
            except Exception:
                pass
        return []


class BuiltinDiscoveryProvider(SearchProvider):
    """High-reliability discovery provider providing seeds and simulated/offline gold-set results."""

    def __init__(self):
        self.catalogs = [
            SearchResult(
                title="Sentry Peak Logistics — Enterprise Cold Chain Solutions",
                url="https://sentrypeaklogistics.com",
                snippet="Leading cold chain transport and freight management across North America.",
                source_rank=1,
                provider_name="BuiltinDirectory",
            ),
            SearchResult(
                title="Meridian Cloud Solutions — Distributed Infrastructure",
                url="https://meridiancloud.io",
                snippet="Secure multi-cloud Kubernetes orchestration and cloud cost intelligence.",
                source_rank=2,
                provider_name="BuiltinDirectory",
            ),
            SearchResult(
                title="Apex Industrial Manufacturing & Robotics",
                url="https://apexindustrial.com",
                snippet="Precision robotic tooling, CNC automation, and supply chain manufacturing.",
                source_rank=3,
                provider_name="BuiltinDirectory",
            ),
            SearchResult(
                title="Beacon BioPharma Research Laboratories",
                url="https://beaconbiopharma.org",
                snippet="Next-generation oncology therapeutics and clinical discovery pipelines.",
                source_rank=4,
                provider_name="BuiltinDirectory",
            ),
            SearchResult(
                title="IronClad Cyber Defense — Zero Trust Security",
                url="https://ironcladcyber.net",
                snippet="Proactive threat intelligence, SOC monitoring, and zero trust governance.",
                source_rank=5,
                provider_name="BuiltinDirectory",
            ),
        ]

    async def search(self, query: str, limit: int = 10) -> List[SearchResult]:
        query_words = set(query.lower().split())
        matched = []
        for item in self.catalogs:
            item_text = (item.title + " " + item.snippet).lower()
            if any(w in item_text for w in query_words) or not query_words:
                matched.append(item)
        return (matched or self.catalogs)[:limit]


class QueryPlanner:
    """Transforms ICP constraints into structured search queries."""

    def plan(self, icp: ICPProfile, max_queries: int = 5) -> List[PlannedQuery]:
        queries: List[PlannedQuery] = []
        seen_hashes = set()

        # 1. Category + Geography combinations
        for ind in icp.target_industries or ["B2B"]:
            for geo in icp.target_geographies or ["Global"]:
                q_text = f"{ind} companies in {geo}"
                q_hash = hashlib.md5(q_text.lower().encode()).hexdigest()
                if q_hash not in seen_hashes:
                    seen_hashes.add(q_hash)
                    queries.append(
                        PlannedQuery(
                            query_id=f"q_{q_hash[:8]}",
                            query_text=q_text,
                            purpose="category_geo",
                            target_source_class="search_discovery",
                            budget=10,
                        )
                    )

        # 2. Keyword-specific queries
        for kw in icp.required_keywords:
            q_text = f"\"{kw}\" business software contact"
            q_hash = hashlib.md5(q_text.lower().encode()).hexdigest()
            if q_hash not in seen_hashes:
                seen_hashes.add(q_hash)
                queries.append(
                    PlannedQuery(
                        query_id=f"q_{q_hash[:8]}",
                        query_text=q_text,
                        purpose="official_contact",
                        target_source_class="official_website",
                        budget=5,
                    )
                )

        # Default fallback query if none generated
        if not queries:
            queries.append(
                PlannedQuery(
                    query_id="q_default",
                    query_text="Top B2B software companies",
                    purpose="category_geo",
                    target_source_class="search_discovery",
                    budget=10,
                )
            )

        return queries[:max_queries]
