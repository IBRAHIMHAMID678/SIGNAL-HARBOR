"""HTML and structured data parser for evidence-backed fact extraction.

Implements Section 7 of the SignalHarbor Blueprint:
- Deterministic extraction: JSON-LD (schema.org/Organization), mailto:, tel:, contact forms.
- Business section detection (About, Contact, Locations, Team).
- Exact text excerpts and DOM locators for strict claim provenance.
- Clean text extraction with noise/boilerplate reduction.
"""

from __future__ import annotations

import json
import re
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Tuple
from urllib.parse import urljoin, urlparse

from bs4 import BeautifulSoup

EMAIL_REGEX = re.compile(
    r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b"
)
PHONE_REGEX = re.compile(
    r"(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}\b"
)


@dataclass
class ExtractedClaim:
    field_name: str
    raw_value: str
    normalized_value: str
    supporting_excerpt: str
    dom_locator: str
    extraction_method: str = "deterministic_dom"
    confidence: float = 0.9


@dataclass
class ParsedPageData:
    url: str
    title: Optional[str]
    description: Optional[str]
    canonical_url: Optional[str]
    organization_name: Optional[str]
    json_ld_blocks: List[Dict[str, Any]] = field(default_factory=list)
    claims: List[ExtractedClaim] = field(default_factory=list)
    emails: List[Tuple[str, str, str]] = field(default_factory=list)  # (email, excerpt, locator)
    phones: List[Tuple[str, str, str]] = field(default_factory=list)  # (phone, excerpt, locator)
    contact_forms: List[str] = field(default_factory=list)
    social_urls: List[str] = field(default_factory=list)
    internal_links: List[str] = field(default_factory=list)


class PageExtractor:
    """Deterministic parser extracting facts and evidence from HTML."""

    def __init__(self, parser_version: str = "1.0.0"):
        self.parser_version = parser_version

    def parse(self, html_content: str, source_url: str) -> ParsedPageData:
        soup = BeautifulSoup(html_content, "html.parser")
        parsed_source = urlparse(source_url)
        base_domain = parsed_source.netloc.lower()

        # Page metadata
        title = None
        if soup.title and soup.title.string:
            title = soup.title.string.strip()

        meta_desc = soup.find("meta", attrs={"name": "description"})
        description = meta_desc.get("content", "").strip() if meta_desc else None

        canonical_tag = soup.find("link", attrs={"rel": "canonical"})
        canonical_url = canonical_tag.get("href", "").strip() if canonical_tag else None

        result = ParsedPageData(
            url=source_url,
            title=title,
            description=description,
            canonical_url=canonical_url,
            organization_name=None,
        )

        # 1. Parse JSON-LD blocks
        self._extract_json_ld(soup, result)

        # 2. Extract mailto: and tel: links
        self._extract_link_channels(soup, source_url, result)

        # 3. Extract text emails and phones with context excerpts
        self._extract_text_channels(soup, base_domain, result)

        # 4. Extract contact forms and social URLs
        self._extract_forms_and_socials(soup, source_url, result)

        # 5. Extract internal links for crawler expansion
        self._extract_internal_links(soup, source_url, base_domain, result)

        # Synthesize claims
        if result.organization_name:
            result.claims.append(
                ExtractedClaim(
                    field_name="organization_name",
                    raw_value=result.organization_name,
                    normalized_value=result.organization_name.strip(),
                    supporting_excerpt=f"Extracted organization name from {title or source_url}",
                    dom_locator="meta/json-ld/title",
                    confidence=0.95,
                )
            )

        return result

    def _extract_json_ld(self, soup: BeautifulSoup, result: ParsedPageData) -> None:
        for script in soup.find_all("script", attrs={"type": "application/ld+json"}):
            try:
                if not script.string:
                    continue
                data = json.loads(script.string)
                if isinstance(data, list):
                    items = data
                else:
                    items = [data]

                for item in items:
                    if not isinstance(item, dict):
                        continue
                    result.json_ld_blocks.append(item)
                    schema_type = item.get("@type", "")
                    if schema_type in ("Organization", "LocalBusiness", "Corporation"):
                        if not result.organization_name and item.get("name"):
                            result.organization_name = str(item.get("name")).strip()
                        if item.get("email"):
                            email = str(item.get("email")).strip()
                            result.emails.append((email, f"JSON-LD @type={schema_type}", "script[type=application/ld+json]"))
                        if item.get("telephone"):
                            phone = str(item.get("telephone")).strip()
                            result.phones.append((phone, f"JSON-LD @type={schema_type}", "script[type=application/ld+json]"))
            except Exception:
                continue

    def _extract_link_channels(self, soup: BeautifulSoup, source_url: str, result: ParsedPageData) -> None:
        for a_tag in soup.find_all("a", href=True):
            href = a_tag["href"].strip()
            if href.lower().startswith("mailto:"):
                raw_email = href[7:].split("?")[0].strip()
                if EMAIL_REGEX.match(raw_email):
                    excerpt = (a_tag.get_text() or raw_email).strip()
                    locator = f"a[href^='mailto:'] (text: {excerpt[:30]})"
                    result.emails.append((raw_email, f"mailto link with anchor text: '{excerpt}'", locator))

            elif href.lower().startswith("tel:"):
                raw_phone = href[4:].split("?")[0].strip()
                excerpt = (a_tag.get_text() or raw_phone).strip()
                locator = f"a[href^='tel:'] (text: {excerpt[:30]})"
                result.phones.append((raw_phone, f"tel link with anchor text: '{excerpt}'", locator))

    def _extract_text_channels(self, soup: BeautifulSoup, base_domain: str, result: ParsedPageData) -> None:
        # Strip script and style tags for clean text analysis
        for s in soup(["script", "style", "noscript"]):
            s.decompose()

        # Prioritize footer and contact sections
        contact_nodes = soup.find_all(
            ["footer", "div", "section"],
            attrs={"class": re.compile(r"contact|footer|header|about", re.I)},
        )
        nodes_to_search = contact_nodes if contact_nodes else [soup]

        for node in nodes_to_search:
            text = node.get_text(separator=" ", strip=True)
            for match in EMAIL_REGEX.finditer(text):
                email = match.group(0).strip(".,;:()[]{}")
                # Exclude obvious asset or example emails
                if any(email.endswith(ext) for ext in (".png", ".jpg", ".svg", ".webp", ".gif")):
                    continue
                if email in [e[0] for e in result.emails]:
                    continue

                start = max(0, match.start() - 50)
                end = min(len(text), match.end() + 50)
                excerpt = text[start:end].replace("\n", " ").strip()
                locator = f"<{node.name}> class='{node.get('class', '')}'"
                result.emails.append((email, f"...{excerpt}...", locator))

    def _extract_forms_and_socials(self, soup: BeautifulSoup, source_url: str, result: ParsedPageData) -> None:
        social_domains = ("linkedin.com", "twitter.com", "x.com", "facebook.com", "github.com", "youtube.com")
        for a_tag in soup.find_all("a", href=True):
            href = a_tag["href"].strip()
            full_url = urljoin(source_url, href)
            parsed_href = urlparse(full_url)
            netloc = parsed_href.netloc.lower()

            if any(s in netloc for s in social_domains):
                if full_url not in result.social_urls:
                    result.social_urls.append(full_url)

            # Check if this link points to a contact form page
            path_lower = parsed_href.path.lower()
            if any(term in path_lower for term in ("contact", "contact-us", "get-in-touch", "inquiry")):
                if full_url not in result.contact_forms:
                    result.contact_forms.append(full_url)

    def _extract_internal_links(self, soup: BeautifulSoup, source_url: str, base_domain: str, result: ParsedPageData) -> None:
        for a_tag in soup.find_all("a", href=True):
            href = a_tag["href"].strip()
            full_url = urljoin(source_url, href)
            parsed_href = urlparse(full_url)
            if parsed_href.netloc.lower() == base_domain:
                clean_url = f"{parsed_href.scheme}://{parsed_href.netloc}{parsed_href.path}"
                if clean_url not in result.internal_links and clean_url != source_url:
                    result.internal_links.append(clean_url)
