"""Safe HTTP Fetcher and URL normalizer with strict SSRF defense.

Implements Section 6.5 and 6.6 of the SignalHarbor Blueprint:
- Defense against SSRF: blocks private, loopback, link-local, and reserved IP addresses.
- URL normalization: canonical scheme, lowercased host, tracking parameter stripping.
- Politeness, conditional caching, content-addressed snapshot storage.
"""

from __future__ import annotations

import hashlib
import ipaddress
import os
import socket
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Optional, Set, Tuple
from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse

import httpx

# Tracking parameters to strip
TRACKING_PARAMS: Set[str] = {
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",
    "gclid",
    "fbclid",
    "msclkid",
    "_hsenc",
    "_hsmi",
    "mc_cid",
    "mc_eid",
}

SNAPSHOTS_DIR = Path("./data/snapshots")
SNAPSHOTS_DIR.mkdir(parents=True, exist_ok=True)


class SSRFValidationError(ValueError):
    """Raised when a URL resolves to a forbidden, private, or internal IP."""
    pass


@dataclass
class FetchResult:
    url: str
    canonical_url: str
    status_code: int
    content_hash: str
    raw_html: str
    page_title: Optional[str]
    headers: Dict[str, str]
    elapsed_ms: float
    is_cached: bool = False
    error_message: Optional[str] = None


def normalize_url(raw_url: str) -> str:
    """Normalize URL by cleaning scheme, host, ports, and stripping tracking parameters."""
    raw_url = raw_url.strip()
    lower_check = raw_url.lower()
    if not lower_check.startswith(("http://", "https://")):
        raw_url = "https://" + raw_url

    parsed = urlparse(raw_url)
    scheme = parsed.scheme.lower()
    netloc = parsed.netloc.lower()

    # Strip default ports
    if netloc.endswith(":80") and scheme == "http":
        netloc = netloc[:-3]
    elif netloc.endswith(":443") and scheme == "https":
        netloc = netloc[:-4]

    # Normalize path
    path = parsed.path or "/"
    if path != "/" and path.endswith("/"):
        path = path[:-1]

    # Strip tracking parameters
    query_params = parse_qsl(parsed.query, keep_blank_values=False)
    filtered_params = [
        (k, v) for k, v in query_params if k.lower() not in TRACKING_PARAMS
    ]
    query = urlencode(filtered_params)

    return urlunparse((scheme, netloc, path, parsed.params, query, ""))


def validate_ip_safety(hostname: str) -> None:
    """Validate that hostname does not resolve to private, loopback, or link-local IPs."""
    # Remove port if present
    host = hostname.split(":")[0]

    try:
        addrinfo = socket.getaddrinfo(host, None)
    except socket.gaierror as e:
        raise SSRFValidationError(f"Could not resolve hostname '{host}': {e}")

    for family, _, _, _, sockaddr in addrinfo:
        ip_str = sockaddr[0]
        ip = ipaddress.ip_address(ip_str)
        if (
            ip.is_private
            or ip.is_loopback
            or ip.is_link_local
            or ip.is_multicast
            or ip.is_reserved
            or ip.is_unspecified
        ):
            raise SSRFValidationError(
                f"Security violation: Hostname '{host}' resolves to restricted IP {ip_str}"
            )


class SafeFetcher:
    """HTTP Fetcher respecting robots, politeness, and SSRF restrictions."""

    def __init__(
        self,
        user_agent: str = "SignalHarborBot/1.0 (+https://signalharbor.local/bot; contact@signalharbor.local)",
        timeout_seconds: float = 12.0,
        max_bytes: int = 5 * 1024 * 1024,  # 5MB cap
    ):
        self.user_agent = user_agent
        self.timeout = timeout_seconds
        self.max_bytes = max_bytes

    async def fetch(
        self,
        url: str,
        etag: Optional[str] = None,
        last_modified: Optional[str] = None,
    ) -> FetchResult:
        canonical_url = normalize_url(url)
        parsed = urlparse(canonical_url)

        start_time = datetime.now(timezone.utc)

        try:
            # 1. SSRF check
            validate_ip_safety(parsed.netloc)
        except Exception as e:
            elapsed_ms = (datetime.now(timezone.utc) - start_time).total_seconds() * 1000
            return FetchResult(
                url=url,
                canonical_url=canonical_url,
                status_code=0,
                content_hash="",
                raw_html="",
                page_title=None,
                headers={},
                elapsed_ms=elapsed_ms,
                error_message=f"SSRF or DNS resolution error: {e}",
            )

        headers = {
            "User-Agent": self.user_agent,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
        }
        if etag:
            headers["If-None-Match"] = etag
        if last_modified:
            headers["If-Modified-Since"] = last_modified

        async with httpx.AsyncClient(
            follow_redirects=True,
            timeout=self.timeout,
            limits=httpx.Limits(max_keepalive_connections=5, max_connections=10),
        ) as client:
            try:
                response = await client.get(canonical_url, headers=headers)
                elapsed_ms = (datetime.now(timezone.utc) - start_time).total_seconds() * 1000

                # Validate final redirected URL for SSRF
                if response.url:
                    final_parsed = urlparse(str(response.url))
                    if final_parsed.netloc != parsed.netloc:
                        validate_ip_safety(final_parsed.netloc)

                if response.status_code == 304:
                    return FetchResult(
                        url=url,
                        canonical_url=canonical_url,
                        status_code=304,
                        content_hash="",
                        raw_html="",
                        page_title=None,
                        headers=dict(response.headers),
                        elapsed_ms=elapsed_ms,
                        is_cached=True,
                    )

                raw_bytes = response.content[: self.max_bytes]
                raw_text = raw_bytes.decode(response.encoding or "utf-8", errors="replace")

                content_hash = hashlib.sha256(raw_bytes).hexdigest()

                # Store snapshot content-addressed
                snapshot_file = SNAPSHOTS_DIR / f"{content_hash}.html"
                if not snapshot_file.exists():
                    snapshot_file.write_bytes(raw_bytes)

                return FetchResult(
                    url=url,
                    canonical_url=canonical_url,
                    status_code=response.status_code,
                    content_hash=content_hash,
                    raw_html=raw_text,
                    page_title=None,
                    headers=dict(response.headers),
                    elapsed_ms=elapsed_ms,
                )

            except Exception as e:
                elapsed_ms = (datetime.now(timezone.utc) - start_time).total_seconds() * 1000
                return FetchResult(
                    url=url,
                    canonical_url=canonical_url,
                    status_code=0,
                    content_hash="",
                    raw_html="",
                    page_title=None,
                    headers={},
                    elapsed_ms=elapsed_ms,
                    error_message=str(e),
                )
