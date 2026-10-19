# SignalHarbor — Complete End-to-End Product Blueprint

**Document type:** Final-state product and engineering blueprint  
**Status:** Architecture target for the complete production product; implementation should proceed through verified gates  
**Working name:** SignalHarbor (placeholder only; name, trademark, and domain availability have not been checked)  
**Non-goals:** No Docker or container platform; no Serper dependency; no LinkedIn scraping or paid LinkedIn data; no paid email-finder dependency; no residential-proxy dependency.

---

## 1. Executive summary

SignalHarbor is a B2B prospect discovery and evidence platform. A customer describes the types of organizations they want to reach. The system discovers candidate organizations from permitted public sources, crawls eligible company and directory pages, extracts company facts and published business-contact channels, corroborates important fields, checks contact-domain health, removes duplicates, scores fit and evidence quality, and produces an auditable list of actionable prospects.

**The differentiator is not raw lead volume. It is evidence-backed accuracy.** Every important field must have provenance. The system must distinguish “found on an official page,” “corroborated,” “technically plausible,” “unknown,” and “not verified.” It must never quietly turn an inferred email, an LLM guess, a search snippet, or an MX record into a “verified email.”

The final system includes the entire pipeline:

1. Customer search intent / ideal-customer-profile builder.
2. Query planning and source selection.
3. Seed discovery and the harvester.
4. Permission-aware crawl scheduling and fetching.
5. Page parsing, entity extraction, and evidence storage.
6. Company/domain/entity resolution and deduplication.
7. Public contact discovery and contact-channel validation.
8. ICP matching, confidence scoring, and qualification.
9. Review queues, exports, integrations, and customer workspace.
10. Monitoring, source health, audits, deletion/suppression, and controlled refresh.
11. Native deployment, backups, security, billing/usage controls, and operations without Docker.
12. Ground-truth datasets, regression tests, production acceptance thresholds, and ongoing quality monitoring.

Delivery phases later in this document are a sequence for constructing and proving the complete product. They are **not** a reduced MVP definition or a list of features to omit from the final product.

## 2. Product principles and non-negotiable rules

### 2.1 Evidence before claims

- Every exported lead must include the source URLs and observation timestamps behind its critical fields.
- Every extracted email, phone number, name, title, company-domain relationship, address, and social URL must retain its own evidence record.
- Store the exact page URL, page title, retrieval time, extraction method, supporting text or DOM location, and a content hash. Store page snapshots when permitted and appropriate.
- AI may help interpret messy public text, but may not invent missing facts. Any AI-produced field remains a candidate until tied to source evidence and passed through normal validators.
- When evidence conflicts, preserve both claims and mark the field disputed. Do not silently choose the more convenient value.

### 2.2 “Unknown” is a valid result

The system must represent `unknown`, `not_found`, `blocked`, `not_applicable`, `stale`, and `conflicting` distinctly. It must not treat an empty field as success, guess a contact to fill the gap, or count an attempted crawl as a successful extraction.

### 2.3 No access-control evasion

- Do not use residential proxies, CAPTCHA-solving, fake accounts, session-cookie theft, login-gated scraping, or fingerprint rotation to defeat a block.
- Respect the source’s terms, published API limits, robots directives as an operational rule, and applicable laws. RFC 9309 describes robots.txt behavior and notes that the protocol is not itself access authorization; it is still a required input to the crawler’s policy engine.
- LinkedIn is not a crawler target. Do not automate profile or page scraping or profile/contact export. Store a public LinkedIn URL only when encountered as a link on a permitted first-party page or from another permitted source, and retain the URL as a reference—not as permission to harvest the platform.
- Stop and quarantine a source when it persistently blocks requests, presents a CAPTCHA, returns repeated 403/429 responses, or changes its access rules. Do not route around the block.

### 2.4 Separate lead fit from data confidence

A company can be a perfect ICP fit but have weak contact evidence. A page can be trustworthy but describe the wrong kind of company. Store separate dimensions for `fit_score`, `company_identity_confidence`, `contact_confidence`, `freshness`, and `evidence_completeness`. Do not hide these behind one opaque AI score.

### 2.5 Accuracy gates precede scale

The monthly volume target is a capacity objective, not a promise of discoverable supply. Discovery volume depends on accessible sources, search coverage, crawl permissions, and source behavior. A run must not loosen acceptance rules merely to fill a quota.

## 3. Product scope: complete final state

### Customer-facing capabilities

- Signup, login, password reset, optional MFA, workspace/team membership, and role-based access.
- Search campaign builder with ICP constraints: industry, geography, company size, keywords, website/domain, business type, allowed source types, exclusions, and required contact channels.
- Save and rerun searches; schedule refreshes; see source coverage and confidence before exporting.
- Search results with filters, sorting, pagination, custom columns, and saved views.
- Prospect detail page showing company profile, contact channels, qualification explanation, source citations/evidence, last-observed dates, conflicts, and audit trail.
- Review queue for ambiguous company matches, conflicting evidence, uncertain contacts, or borderline ICP fit.
- Deduplicated CSV and JSON exports; spreadsheet export can be added behind the same export abstraction. Exports include evidence columns and field-status values.
- Workspace suppression / do-not-contact lists, deletion requests, export history, usage limits, and audit logs.
- Source-health dashboard, harvest-run dashboard, failure categories, retry state, and per-source coverage.
- API and webhook interface for customer systems; CRM integrations can be implemented through a connector interface without coupling the pipeline to one CRM.
- Subscription/usage entitlement layer. Payment provider implementation should be selected only after merchant eligibility, payout support, fees, and regional requirements are confirmed.
- Internal operations console for source policy, crawl budgets, parser versions, incidents, queue depth, data-quality metrics, and emergency pause controls.

### Internal/data-platform capabilities

- Pluggable source registry and source adapters.
- Durable work queue with retries, leases, idempotency, priority, and dead-letter handling.
- Host-level crawl budgets, robots/terms policy, concurrency limits, and backoff.
- Deterministic parsers and structured-data extraction.
- Optional AI-assisted extraction with strict evidence validation and budget limits.
- Versioned normalization, entity resolution, scoring rules, and extraction schema.
- Immutable provenance trail and reversible merge decisions.
- Source and field-level freshness policies.
- Reproducible runs, sampling, ground-truth evaluation, regression fixtures, and alerting.

## 4. Recommended architecture (no Docker)

### 4.1 Stack

| Layer | Recommended choice | Why |
|---|---|---|
| Web app | Next.js + TypeScript | Customer dashboard, search, detail pages, admin console |
| API | Python + FastAPI | Typed contracts, crawler integration, validation and pipeline orchestration |
| Harvester/workers | Python worker processes using the same domain packages as the API | Shared validation logic without putting long-running crawl tasks inside HTTP request handlers |
| Primary database | PostgreSQL | Durable relational records, unique constraints, transactions, evidence relationships, JSONB where appropriate |
| Queue | PostgreSQL-backed work queue using row locking / `SKIP LOCKED`, leases, and retry state | Avoids a mandatory message-broker dependency at the beginning; enough for a moderate pipeline when correctly designed |
| Page/snapshot storage | Content-addressed filesystem storage with a documented storage interface | Can run natively on the server; store hashes and metadata in PostgreSQL; later switch to object storage without redesigning evidence records |
| Cache | Start with process-level caching plus PostgreSQL; add a cache service only if metrics justify it | Fewer moving parts; don't add a cache merely by habit |
| Search broker | Provider/source adapter interface; optionally operate a self-hosted SearXNG instance natively, without containers | Search providers can change without changing the pipeline; no single provider is a hard dependency |
| Extraction | HTTP client + HTML parser + boilerplate removal; browser rendering only for specifically justified pages | Static HTML is cheaper and easier to test; JS rendering is a controlled fallback, not the default |
| Observability | Structured JSON logs, health endpoints, DB-backed run metrics, rotating files, and alert notifications | Low-cost and inspectable on a single server |
| Native process management | OS services/process supervisor (e.g. systemd on Linux or an appropriate Windows service wrapper) | Restarts, startup ordering, logs, and health management without containers |

Pin tested runtime and dependency versions in lock files. Choose currently supported stable versions when implementation begins rather than hard-coding a version in this architecture document. Keep frontend, API, worker, scheduler, and migration commands runnable directly on the host.

### 4.2 Runtime processes

Run these as separate native processes, even if they initially share one physical machine:

1. `web`: Next.js frontend.
2. `api`: FastAPI HTTP API.
3. `scheduler`: creates scheduled harvest/refresh jobs and checks stale records.
4. `harvester-worker`: discovers and fetches eligible URLs.
5. `parse-worker`: parses fetched pages and emits evidence-backed candidates.
6. `resolve-worker`: resolves organizations/domains/contacts and handles duplicates.
7. `validation-worker`: validates fields and assigns confidence/statuses.
8. `export-worker`: builds exports and tracks download permissions/usage.
9. `maintenance`: applies retention, cleanup, source-health checks, and backup verification jobs.

Worker types may share one codebase and run at different concurrency settings. They must not share mutable in-memory state as their source of truth. PostgreSQL is authoritative; workers claim work using transactions and expiring leases.

### 4.3 Network layout

- Expose only HTTPS on the public edge. Keep PostgreSQL and internal worker endpoints private.
- Place the app behind a reverse proxy or equivalent HTTPS edge. A Cloudflare Tunnel can be used if it suits the server environment, but it is not required by the product architecture.
- Do not expose database ports publicly. Use firewall allowlists, separate application and database credentials, TLS where connections cross hosts, and least-privilege roles.
- Separate development, test, and production configuration and credentials. `.env` files are acceptable for local development; production secrets must be kept out of the repository and restricted to the relevant service account.

## 5. High-level data flow

1. Customer defines the target buyer / ICP and acceptable channels.
2. Query planner turns inputs into structured search intents, query variants, country/source scopes, and exclusions.
3. Seed discovery collects candidate company domains and pages from permitted public indexes, official/open registries, allowed business directories, sitemaps, partner datasets, and user-provided seeds.
4. The harvester validates each URL, checks policy and host budgets, fetches eligible pages, and records fetch results.
5. Parsers extract candidate organization facts, contact channels, external links, and source evidence.
6. Entity resolution joins repeated mentions into organizations, sites, locations, people, and contact channels while retaining reversible links to raw observations.
7. Validators corroborate high-value fields and classify contact status without overstating certainty.
8. ICP matching scores fit separately from evidence quality.
9. Qualification rules either accept, hold for review, suppress, or reject a prospect.
10. Search results, evidence, exports, usage records, and feedback appear in the customer workspace.
11. Scheduled refresh rechecks only eligible/stale records using source-specific budgets. Metrics feed quality gates and parser/source maintenance.

## 6. Source discovery and the harvester

The harvester is a first-class subsystem, not a script that runs once. It must manage discovery, policy, fetching, parsing handoff, retries, deduplication, scheduling, and source health.

### 6.1 Source registry

Every source has a record containing:

- `source_id`, display name, source type, base URL/API endpoint, owner/operator, and source documentation URL.
- Allowed use and license/terms notes, permitted data categories, attribution requirements, and jurisdiction notes.
- Authentication method, if any, kept in secrets storage and never logged.
- robots/terms policy status; permitted paths; disallowed paths; user-agent identification; and the last policy review time.
- Per-host request rate, concurrency, daily budget, response-size cap, retry policy, and backoff ceiling.
- Available fields, update cadence, historical reliability, known failure patterns, and parser version.
- State: `active`, `limited`, `paused`, `blocked`, `needs_review`, or `retired`.
- A kill switch to suspend a source immediately without a code deployment.

Source-policy records should be reviewed when site terms or APIs change. A successful HTTP response is not evidence that the use is permitted.

### 6.2 Source classes

Implement adapters for the following source classes, enabling each only after its rules are reviewed:

**A. Official company websites** — About, contact, locations, products/services, team pages, footer links, structured metadata, careers pages, and press/news pages. Usually the best source for the official domain and public contact details.

**B. Official company registries and government datasets** — Use available official APIs, downloadable datasets, or open-data portals. Coverage is country-specific; registry records often confirm legal identity/status but do not provide sales contacts. Track registry IDs and jurisdiction explicitly.

**C. Professional associations, chambers, supplier/member directories, and trade-show/exhibitor lists** — Only where terms/license permit reuse. Store the directory's own record URL and date.

**D. Public business directories and sector catalogs** — Use source adapters with configurable policies, low host-level rates, and source-specific parsing. Do not assume that publicly visible means unrestricted for bulk reuse.

**E. Search discovery providers** — Use an interface, not hard-coded provider assumptions. A provider may be a permitted API, a self-hosted search broker, or an allowed source's own search endpoint. Persist search queries, provider, result rank, returned URL, and retrieval timestamp so discovery is reproducible.

**F. Sitemaps, RSS/Atom feeds, public catalogs, and website link graphs** — Efficient ways to discover new pages and changes from domains already identified.

**G. Customer-provided seeds/imports** — Domains, URLs, lists, and inclusion/exclusion files. Validate inputs, retain the customer/source-of-data metadata, and isolate each tenant's private imports.

**H. First-party content and signals** — Public announcements, product launch news, published locations, hiring pages, certifications, and expansion signals. Preserve the actual announcement date and observation date separately.

### 6.3 Search provider plan without Serper

Do not make one search API indispensable. Use a `SearchProvider` interface with methods for query execution, provider health, rate-limit handling, and normalization. Implement source adapters one by one, beginning with reliable official/open sources and an optional self-hosted search broker such as SearXNG where its configured engines and usage are appropriate.

Important operational reality: without a paid search API or residential proxies, search coverage may be less predictable, and some engines will throttle or block server-originated automated traffic. The correct response is to back off, pause, rotate to a permitted source, or mark the provider unavailable—not to evade access controls. A provider abstraction lets another source be added later without rewriting company resolution and lead scoring.

Do not base the architecture on retired or sunset APIs. Microsoft's Bing Search APIs were retired on 11 August 2025. Google's Custom Search JSON API documentation says existing customers have until 1 January 2027 to transition, so it should not be a new product's long-term dependency. Provider availability, pricing, and terms must be checked before enabling any adapter.

### 6.4 Query planner

Input fields include target industries, business descriptions, geographic scope, language, company-size range, company-type requirements, keyword inclusion/exclusion, source types, desired contact type, and freshness requirements.

The planner produces explicit query objects such as:

- broad category + geography;
- product/service phrase + region;
- source-restricted query for a directory or registry;
- official-site/contact-page discovery queries;
- known company/domain expansions;
- signal-specific queries for an event, new location, new product, or hiring signal.

Each query has a deterministic ID, normalized query text, source adapter, purpose, time window, expected fields, and budget. The planner must cap near-duplicate query variants so the system does not waste its crawl budget on paraphrases.

### 6.5 URL normalization and crawl eligibility

Before enqueueing any URL:

- Parse and normalize scheme, hostname, default ports, path, percent encoding, and trailing slashes conservatively.
- Remove known tracking parameters but preserve parameters that identify actual records or content.
- Resolve redirects within configured limits; record every redirect hop.
- Reject unsupported schemes, localhost/private-network IPs, link-local addresses, credentials embedded in URLs, oversized URLs, and unsafe file types. Defend against SSRF by validating resolved IPs both before and after redirects and by revalidating DNS at connection time where feasible.
- Normalize internationalized hostnames and store both canonical form and display form.
- Deduplicate canonical URLs, while preserving discovered aliases and source references.
- Check per-source scope, robots policy, crawl delay/limits if applicable, and host budget before fetching.

### 6.6 Fetcher behavior

Each fetch task must support:

- Explicit user-agent and contact/purpose information where appropriate.
- Connect/read/overall timeouts, maximum response bytes, maximum redirect count, and accepted content types.
- Conditional GET with `ETag` and `Last-Modified` when supported; retain `304 Not Modified` as a successful check, not a parse failure.
- Per-host token bucket/concurrency limits; jittered exponential backoff; honoring `Retry-After`; circuit breaker after repeated failures.
- Clear classification for DNS failure, timeout, TLS failure, 401/403, 404, 410, 429, 5xx, CAPTCHA/block page, unsupported content, oversized response, robots disallow, and parser failure.
- No repeated retries for permanent failures or sources marked blocked. No retries that bypass a source's limit.
- Cache and content-hash comparison before reparsing unchanged pages.
- A host-level pause and global emergency pause.

### 6.7 Crawling strategy

Crawl shallow before crawling deep. Prioritize `about`, `contact`, `locations`, `team`, `company`, `services`, and relevant catalog record pages, then inspect additional pages only when they can add required fields or useful signals. Use sitemaps and internal link graphs when permitted.

Set configurable caps by source/domain: pages per company, maximum depth, maximum bytes, time budget, and number of external domains discovered per page. Never turn the harvester into an unrestricted internet crawler. Keep per-domain politeness limits and honor all explicit restrictions.

Static HTML is the default. A browser-rendering fallback may be used only for eligible pages where important content is demonstrably client-rendered. Browser workers must have strict time/resource limits and must not log in, solve challenges, imitate human actions to evade controls, or continue after access is denied.

### 6.8 Scheduling, priority, retries, and dead letters

Queue priorities:

1. User-triggered high-relevance search.
2. Official company and registry pages needed to verify identity.
3. Contact/about/location pages likely to add actionable channels.
4. Freshness checks for previously accepted leads.
5. Low-confidence discovery and general crawl expansion.

A job record needs status, priority, not-before time, attempts, lease owner/expiry, last error category, idempotency key, source ID, URL/domain, payload, creation/start/finish timestamps, and correlation ID. Use expiring leases so a worker crash does not strand tasks. Permanent failures go to dead-letter/review state; transient errors receive bounded retries. Operators need a safe replay action with an audit record.

## 7. Parsing and evidence extraction

### 7.1 Page-processing pipeline

1. Detect content type and encoding.
2. Decode HTML safely and remove scripts/styles/navigation boilerplate where appropriate.
3. Extract metadata: title, canonical URL, language, description, Open Graph, JSON-LD, microdata, and page timestamps if available.
4. Extract structured data (e.g. schema.org `Organization`, `LocalBusiness`, `Person`, `PostalAddress`, `ContactPoint`) while preserving the original JSON-LD block or its hash.
5. Extract visible text, links, `mailto:` values, `tel:` values, `href` URLs, and selected accessible attributes.
6. Detect likely business sections (About, Contact, Locations, Team, Legal, Careers) and preserve the section heading/context.
7. Produce candidate claims, each linked to the page evidence and extraction method.
8. Run deterministic validators and entity resolution.
9. Optionally ask an LLM to classify ambiguous text or map fields to a schema—but require exact supporting quotations or DOM locations, reject claims without evidence, and validate the output against a strict schema.
10. Store parser version and test fixture ID for reproducibility.

### 7.2 Claim/evidence model

A claim is a statement about an entity or channel, such as “official domain is `example.com`” or “sales email is `sales@example.com`.” Each claim must store:

- Entity ID (or unresolved candidate ID), field name, normalized value, and raw value.
- Source ID, source URL, canonical URL, page title, retrieval timestamp, and claimed/observed date where distinct.
- Evidence excerpt or DOM locator, content hash, parser version, extraction method, and confidence components.
- Status: `candidate`, `supported`, `corroborated`, `disputed`, `rejected`, `stale`, or `superseded`.
- Review/decision history and reason codes.

A URL reference alone is not sufficient evidence for every field: the saved evidence should make it possible to see what on the page supports the field, subject to source licensing and privacy constraints.

### 7.3 Field normalization

- Company name: Unicode normalization, whitespace cleanup, legal suffix recognized separately, preserve legal and trading names as aliases.
- Domain: lowercase/punycode canonical domain; strip `www` only for comparison, retain the observed hostname.
- Email: lowercase domain, preserve original local part for display where needed; trim punctuation from extraction boundaries; validate syntax without over-normalizing valid plus-addresses.
- Phone: retain raw formatted value, normalized E.164 where country inference is justified, country/inference confidence, extension, and source.
- Address: structured components plus untouched raw display; country/region inferred only when supported.
- Person: name parts only where possible, original display name, title as a time-bound observation, association to organization with evidence, and minimal collection.
- Industry: taxonomy ID + original source wording + mapping confidence.
- Date: preserve timezone and distinguish publication date, page update date, retrieval date, and inferred date.

## 8. Organization identity resolution and deduplication

### 8.1 Entity types

Maintain separate but related records for:

- `Organization` — legal/business entity.
- `OrganizationBrand` or `TradingName` — brand aliases where useful.
- `OrganizationLocation` — branch or office.
- `Domain` — website hostname and observed ownership/association.
- `Person` — public professional identity only where needed.
- `ContactChannel` — email, phone, contact form, or other permitted route.
- `SourceRecord` — record from a registry/directory.
- `Signal` — event such as opening a location or publishing a relevant announcement.

Do not merge a parent, subsidiary, franchise, and branch into one entity merely because they share a name or domain.

### 8.2 Matching tiers

**Strong match:** same jurisdiction + official registration number; canonical official domain plus multiple matching business attributes; exact official source ID.

**Likely match:** normalized company name plus compatible address/phone, or a redirected/rebranded official domain with corroboration.

**Possible match:** fuzzy name/domain/address match with incomplete evidence. Keep separate and send to review rather than auto-merge.

Every merge must be recorded as a reversible `entity_link`/merge decision with source entities, method, score, evidence, and timestamp. Recomputing identity links must be possible when matching rules change.

### 8.3 Idempotency and duplicate prevention

- Unique canonical URLs and source-record identifiers within their source namespace.
- Domain normalization and alias table.
- Stable entity IDs that do not change whenever new evidence arrives.
- Contact uniqueness based on normalized channel + tenant policy, while preserving multiple observations and sources.
- Run-level idempotency keys and uniqueness constraints in the database—not just Python-level checks.
- Duplicate reports and a test that reprocessing the same data does not create additional organizations, channels, or export rows.

## 9. Public contact discovery and validation

This subsystem must optimize for real, traceable channels—not maximum email count.

### 9.1 Contact discovery order

1. Official contact page and footer.
2. Official team/sales/support page, where it actually publishes business contact details.
3. Official location pages and structured ContactPoint data.
4. Official public registry/directory entry where the data-use terms permit it.
5. A public business directory or association record with source provenance.
6. An official contact form URL when email/phone is unavailable.
7. A public company-profile URL discovered through an allowed source, stored as a reference only; do not scrape the restricted platform.

Do not generate first.last@domain or other patterned addresses and present them as discovered. If a future feature offers pattern hypotheses, they must remain `predicted_unverified`, hidden from verified exports by default, and excluded from counts of verified contacts.

### 9.2 Email state machine

Email is not a simple boolean. Store the individual checks and a final status:

- `published_on_official_source`: exact email was present in an approved official/company source.
- `published_on_third_party_source`: exact email was present in a permitted directory; source type is visible.
- `syntax_valid` / `syntax_invalid`.
- `domain_dns_ok` / `domain_dns_missing` / `dns_unknown`.
- `mx_present` / `mx_missing` / `mx_unknown`.
- `disposable_provider_suspected`.
- `role_address` / `named_address` / `unknown_type`.
- `catch_all_possible` only when a justified check supports it.
- `mailbox_status_unknown` unless there is a permitted, reliable basis to say otherwise.
- `bounced_confirmed` only from a real delivery/bounce event with a suitable retention policy.
- `suppressed` / `opted_out` / `stale`.

DNS/MX checks prove domain mail-routing configuration, not mailbox existence or inbox placement. Do not use invasive SMTP recipient probing by default. The product should clearly label what it did and did not verify.

### 9.3 Phone and form validation

- Validate phone syntax and country plausibility without claiming the number is answered or belongs to a specific person unless corroborated.
- Preserve click-to-call links and extensions where public.
- For contact forms, store the page URL and form context, not form submissions. Do not auto-submit forms or send outreach as part of harvesting.
- Validate contact URLs for redirects, dead links, and domain association.

### 9.4 LinkedIn handling

No LinkedIn scraper or data subscription is assumed. Do not scrape profiles, run automated logins, extract member contact lists, or automate platform actions. If a company website links to a company or professional profile, retain only the observed link and provenance where use is appropriate. Mark profile details as unavailable unless they are independently sourced from an allowed public page.

## 10. Qualification, scoring, and routing

### 10.1 Separate scoring dimensions

1. **ICP fit (0–100):** match to industry, geography, size, services, and customer-defined criteria.
2. **Company identity confidence (0–100):** official-domain association, registry IDs, corroboration, entity-match confidence.
3. **Contact confidence (0–100):** source type, exactness of published channel, role/person association, validation state.
4. **Freshness (0–100):** age of the source claim against field-specific expiry policies.
5. **Evidence completeness (0–100):** proportion of critical claims with usable evidence.
6. **Risk flags:** conflict, suppression, restricted source, stale source, possible duplicate, legal/policy concern.

Show why the scores were assigned, including positive and negative reason codes. Never let an LLM output directly determine the score without recorded facts and deterministic rules.

### 10.2 Final dispositions

- `qualified`: meets customer ICP and evidence/contact requirements.
- `review`: plausible fit but has a resolvable ambiguity or conflicting field.
- `rejected`: clearly outside scope, unsupported, inactive where activity is required, or poor fit.
- `suppressed`: do-not-contact, deletion, source-policy restriction, or tenant/global exclusion.
- `stale`: previously qualified but needs refresh before it can be exported again.

### 10.3 Default export gate

A lead may enter the normal export only if:

- It has a stable organization identity and a relevant official domain or a clearly explained approved alternative.
- The company meets the configured ICP threshold.
- It has at least one **actionable, source-backed contact route** permitted by the customer’s criteria (email, phone, or official contact form; company social link only if the customer explicitly accepts it).
- The contact route has a source URL, observation timestamp, and visible validation state.
- It is not suppressed, blocked, disputed on a critical field, or a known duplicate.
- All required geography/industry claims are supported at the configured threshold.

Do not export a company-only record with no actionable contact channel by default. A customer may choose a separate discovery-only view, but it must be visually and programmatically distinct from qualified leads.

## 11. PostgreSQL data model

Core tables (split further if implementation needs it):

- `users`, `workspaces`, `workspace_members`, `roles`, `sessions`, `api_keys`.
- `icp_profiles`, `search_campaigns`, `search_queries`, `search_runs`.
- `sources`, `source_policies`, `source_health_events`, `source_credentials_ref`.
- `crawl_jobs`, `fetch_attempts`, `pages`, `page_snapshots`, `parse_jobs`, `parse_runs`.
- `organizations`, `organization_aliases`, `organization_locations`, `domains`, `domain_observations`.
- `people`, `person_organization_links`, `contact_channels`, `contact_observations`.
- `source_records`, `signals`, `entity_links`, `merge_decisions`.
- `claims`, `evidence_records`, `validation_results`, `quality_scores`, `qualification_decisions`.
- `suppressions`, `deletion_requests`, `feedback_events`, `review_tasks`.
- `exports`, `export_items`, `usage_ledger`, `audit_events`, `webhook_endpoints`, `webhook_deliveries`.
- `schema_versions`, `parser_versions`, `ruleset_versions`, `worker_heartbeats`, `system_metrics`.

Data model rules:

- Use UUID/ULID stable primary keys and UTC timestamps.
- Enforce uniqueness and foreign keys at the database level.
- Store claims/evidence as normalized relational records; use JSONB for source-specific payloads, not as the only database structure.
- Keep raw observations separate from the current “best known” view so corrections do not destroy history.
- Version scoring and normalization rules.
- Use tenant scoping for customer-owned campaigns, notes, imports, exports, and suppressions. Define whether a suppression is workspace-level or global and enforce it consistently.
- Add retention policies for raw page content, logs, failed fetch data, and personal contact information.
- Never store passwords, API secrets, or session tokens in evidence payloads or logs.

## 12. API design

Use versioned endpoints (`/api/v1/...`) and OpenAPI contracts. Long-running work must return a run/job ID and status endpoint rather than hold an HTTP request open.

Core resources:

- `POST /icp-profiles`, `GET/PATCH /icp-profiles/{id}`
- `POST /search-runs`, `GET /search-runs/{id}`, `POST /search-runs/{id}/cancel`
- `GET /prospects`, `GET /prospects/{id}`, `POST /prospects/{id}/feedback`
- `GET /prospects/{id}/evidence`
- `GET /review-tasks`, `POST /review-tasks/{id}/decision`
- `POST /imports`, `GET /imports/{id}`
- `POST /exports`, `GET /exports/{id}`, `GET /exports/{id}/download`
- `GET /sources`, `GET /sources/{id}/health` (admin-only where appropriate)
- `POST /webhooks`, `GET /webhook-deliveries`
- `GET /usage`, `GET /audit-events`
- Admin-only controls for pausing a source, replaying a job, changing a ruleset, and managing retention.

API requirements: pagination, filtering, request validation, consistent errors, request IDs, rate limits, tenant authorization, idempotency keys for write operations, and explicit export permission checks. Never expose internal raw snapshots or cross-tenant records through guessable IDs.

## 13. Frontend experience

### Main application pages

1. **Dashboard:** recent runs, new qualified prospects, review backlog, source health, freshness warnings, and quality metrics.
2. **ICP builder:** structured criteria, exclusions, required contact type, geography, source restrictions, and preview of how filters affect coverage.
3. **Discovery run page:** queries used, sources consulted, pages processed, candidates found, reasons for rejection, errors, and current queue state.
4. **Prospects table:** sortable/filterable leads, field-status badges, score breakdown, contact route, source freshness, duplicate state, and evidence completeness.
5. **Prospect detail:** company identity, address/location, website, public contacts, company signals, evidence links/excerpts, validation checks, conflicts, history, and refresh action.
6. **Review queue:** side-by-side evidence, competing entity matches, accept/reject/merge/suppress actions, and reviewer rationale.
7. **Saved searches and refresh rules:** schedules, change detection, notifications, and pause/resume.
8. **Exports/integrations:** file creation, evidence inclusion, field selection, CRM/webhook configuration, download history, and usage limits.
9. **Settings:** members, roles, retention, exclusions, source policy, API keys, and audit history.
10. **Admin operations:** job queue, dead letters, source health, parser performance, version rollouts, and emergency pause.

### UX rules

- Label every validation status in plain English; do not show only a numeric score.
- Make source links and observed dates easy to inspect.
- Distinguish company fit from contact certainty.
- Explain why a lead was excluded or held for review.
- Do not use a green “verified” indicator unless the exact stated property was proven by its defined check.
- Make exports reflect the visible filters and show the count of excluded/review-only rows.

## 14. Quality assurance and accuracy evaluation

Accuracy cannot be established by a successful run, a large row count, or an LLM self-assessment. It requires a manually reviewed evaluation set.

### 14.1 Build the gold dataset

Create a stratified sample across target geographies, industries, source types, small/large companies, difficult names, multiple locations, redirected/rebranded domains, catch-all email domains, dead sites, and duplicate-looking companies. Manually inspect source pages and record expected values plus evidence. Keep a stable test subset that is never used to tune parser rules.

At the start, label at least 300–500 examples across the most important categories; expand the set as real errors are discovered. This is a proposed initial test size, not a claim that it proves quality for every country or industry.

### 14.2 Metrics

Measure separately:

- Organization identity precision and recall.
- Official-domain association precision.
- Precision of each critical field (industry, location, company status, contact email, phone, title, social URL).
- Contact-channel source accuracy and contactability status accuracy.
- False-positive and false-negative rates for ICP qualification.
- Duplicate organization rate and false entity-merge rate.
- Evidence coverage: percentage of critical fields with usable, direct provenance.
- Staleness rate and source freshness.
- Source-level success, block, parse, and extraction rates.
- Cost in compute and requests per qualified lead (even when cash cost is zero).

Always publish sample size and confidence interval where meaningful. Segment results by source and country so a high-performing source does not hide a weak one.

### 14.3 Initial production gates (proposed thresholds)

These are acceptance targets to validate, not existing results:

- 100% of exported critical fields have source provenance and observation timestamps.
- 0 inferred/pattern-generated emails appear in the verified-contact export.
- At least 95% precision on the manually audited accepted organization-domain associations and supported contact channels, evaluated on a representative sample.
- At least 99% of duplicate records in the held-out test set are caught by deterministic IDs/canonical URLs, with the fuzzy-match false-merge rate measured independently and kept below 0.5% before auto-merging fuzzy matches.
- 0 cross-tenant data leakage in authorization tests.
- 0 repeated job creation when an identical idempotent job is retried.
- A source returning repeated 429/403/CAPTCHA/block signals is paused according to policy and does not trigger infinite retries.
- A second run over unchanged seed data does not create duplicate qualified leads or overwrite stronger evidence with weaker evidence.
- Exports exclude suppressed, deleted, unresolved, and blocked records.

If an accuracy gate fails, affected records/source adapters must be held or disabled; the system must not lower the bar to preserve throughput.

## 15. Testing strategy

### Unit tests

- URL/domain/email/phone normalization.
- robots and source-policy decisions.
- redirect limits, IP/SSRF protections, content-type and byte limits.
- parser outputs for structured data, mailto/tel, multilingual pages, malformed HTML, and missing fields.
- entity similarity and merge thresholds.
- email state transitions, freshness calculations, scoring and qualification rules.
- suppression precedence and deletion propagation.
- export eligibility and tenant scoping.

### Integration tests

- API → database → queue → worker → evidence → qualification → export.
- transient HTTP failure, rate limiting, Retry-After, lease expiry, worker crash, replay, and dead-letter flows.
- source-specific parsers against saved fixtures and approved test endpoints.
- migrations from an empty database and from the previous schema version.
- backup restore to a clean environment.
- authentication/authorization and cross-tenant attempts.

### Regression and adversarial tests

- misleading snippets, hidden page text, copied directory records, contact details belonging to another branch, stale cached pages, false company-name matches, email typos, catch-all domains, parked domains, invalid certificates, compressed response bombs, malicious HTML, prompt injection in page text, and source pages containing instructions to the AI.
- AI extraction must treat website content as untrusted data and must never execute its instructions or modify system policy.
- repeated and concurrent runs against the same candidates.
- parser and scoring upgrades tested against the frozen gold set before rollout.

### End-to-end scenarios

1. Official website with clear address and published business email becomes eligible with direct evidence.
2. Company appears in a registry but has no usable contact route; it remains discovery-only and is excluded from the default qualified export.
3. Two similar names with different domains/locations are not merged automatically.
4. Email is published but domain has no usable MX; export clearly shows the conflict or blocks the channel.
5. Domain uses catch-all behavior or mailbox status cannot be determined; the system never calls it mailbox-verified.
6. Source returns 429 and then remains blocked; crawler respects backoff and pauses instead of evading.
7. Company is opted out or suppressed; it disappears from subsequent exports and refresh jobs according to policy.
8. One workspace attempts to access another workspace’s record/export and is denied.
9. A parser update improves one source but causes a regression in another; deployment is blocked by fixture tests.

## 16. Monitoring and operational controls

Dashboards and alerts must cover:

- Queue depth and oldest-job age by job type/priority.
- Worker heartbeats, crash/restart count, lease expiry, retries, and dead letters.
- Requests/page fetches per source and domain, latency, 2xx/3xx/4xx/5xx, 403/429, blocked/CAPTCHA classification, and bytes fetched.
- Parsed pages, candidate claims, validated claims, qualified prospects, review rate, and rejection reasons.
- Source-level extraction precision from reviewed samples, not just parse success.
- Duplicate creation, merge reversals, suppression propagation, and stale lead count.
- Export counts, usage thresholds, failed webhooks, API latency, database capacity, and snapshot-storage growth.
- Backup completion and last successful restore test.

Required operator controls: pause/resume source, pause global harvesting, lower host concurrency, drain/cancel a run, replay a failed job, disable a parser version, roll back a ruleset, invalidate stale exports, and mark a source as restricted. Every manual intervention has an audit event.

## 17. Security, privacy, and lawful-use controls

This is a product design requirement, not a post-launch checklist.

- Document lawful and permitted use by source, field type, country, and customer purpose. Public availability alone does not guarantee unrestricted bulk collection or marketing use.
- Collect only business/professional data needed for the stated prospecting purpose. Do not collect sensitive personal data or private account information.
- Preserve opt-out and suppression events; ensure they override all qualification rules and re-appearances from later harvests.
- Provide workspace-level deletion and data-access processes, retention windows, and a path for source correction requests.
- Keep per-field provenance so the operator can locate and delete/correct a claim without deleting unrelated evidence.
- Minimize raw page content retention according to source rights and legal review; evidence excerpts and hashes may be preferable where full copies are not permitted.
- Enforce password hashing, secure sessions, CSRF protections where applicable, input validation, safe file uploads, SSRF prevention, output encoding, query parameterization, secret rotation, rate limits, and audit logging.
- Treat all scraped text as untrusted input, especially when sent to an LLM. No page text can authorize code execution, secret access, policy changes, network access, or tool use.
- Use data processing agreements and vendor reviews for any third-party model or hosting service. Avoid sending unnecessary personal data/page content to external AI services.
- Maintain a policy and takedown contact; review applicable privacy and marketing laws for target countries. As examples, EU personal-data processing requires an appropriate legal basis and may require a balancing assessment; US commercial email has CAN-SPAM obligations, including business-to-business mail. The exact obligations depend on deployment, customers, recipients, and activity, so obtain qualified legal review before enabling outreach or selling bulk personal data.
- Do not include cold-email sending as part of the harvesting pipeline. If outreach is added in a future product scope, make it a separate consent/compliance-controlled module with suppression checks, unsubscribe handling, sender authentication, and rate limits.

## 18. Native deployment, without Docker

### 18.1 Environments

Maintain three isolated environments: development, staging/test, and production. Each uses its own database, credentials, domain/subdomain, storage path, email/notifier settings, and source budgets.

### 18.2 Host installation

- Install supported runtimes directly on the host.
- Install PostgreSQL natively or use a separately managed PostgreSQL service.
- Create a dedicated unprivileged OS account for each service group.
- Create virtual environments for Python; pin dependencies and use a lock file. Pin frontend dependencies with a package lock.
- Build the frontend as a normal application process and run FastAPI/worker/scheduler processes as native managed services.
- Use a reverse proxy/HTTPS edge; do not expose internal service ports directly.
- Use separate writable directories for logs, temporary downloads, and evidence snapshots. Apply storage quotas and cleanup policies.
- Apply OS security updates, firewall rules, SSH/key protections if applicable, and service restart limits.

### 18.3 Backups and recovery

- Automated PostgreSQL backups with encryption and defined retention.
- Separate backup of permitted page snapshots/configuration and source fixtures.
- Backups stored away from the main host; a local-only backup does not protect against disk/server loss.
- Monthly restore drills at minimum, with the schedule adjusted to the business's recovery objectives.
- Define and test RPO (maximum tolerable data loss) and RTO (maximum restoration time); do not claim a recovery target until measured.
- Database migrations must be versioned, reversible where possible, tested on staging, and backed up before production migration.

### 18.4 Release procedure

1. Code review and static/type checks.
2. Unit/integration/regression test suite.
3. Frozen gold-set score comparison.
4. Database migration rehearsal.
5. Staging smoke test and controlled sample run.
6. Deploy one service group at a time, preserving the previous release.
7. Verify health endpoints and pipeline outputs against acceptance criteria.
8. Roll back immediately if a quality, security, or source-policy regression is detected.

## 19. Performance and capacity planning

A target such as 60,000 qualified prospects per month averages about 2,000 per calendar day, but the number of pages requested can be many times larger. Cost and throughput are governed by accessible source inventory, pages per prospect, fetch size, parsing complexity, retries, and the percentage of candidates that pass quality gates.

Benchmark the following rather than guessing server requirements:

- URLs fetched per worker-hour at permitted rates.
- Average/95th-percentile page bytes and fetch latency.
- CPU/RAM per parser worker, especially browser rendering.
- Database writes and indexes per 1,000 pages.
- Storage per page snapshot and retention window.
- Candidates discovered per query, qualified rate, and evidence-backed contact rate by source.
- Cost per qualified prospect, including paid APIs if added later.

Use concurrency limits first, then add worker processes or a second host if measurements show a bottleneck. Avoid adding more worker concurrency when the actual limit is a source's access policy or a low-coverage search provider. Do not use volume as a reason to violate rate limits.

## 20. Suggested repository structure

```text
signalharbor/
  apps/
    web/                      # Next.js + TypeScript
    api/                      # FastAPI routes, auth, request schemas
  services/
    scheduler/                # scheduled run creation and freshness checks
    workers/                  # worker entrypoints / process configuration
  packages/
    domain/                   # entities, rules, reason codes, shared types
    db/                       # models, migrations, repositories
    queue/                    # job claiming, leases, retries, dead letters
    sources/                  # source registry and adapters
    search/                   # provider interfaces and query planner
    harvester/                # URL discovery, policy, fetch, crawl budgets
    parsing/                  # HTML, JSON-LD, contact and signal extractors
    evidence/                 # claims, snapshots, provenance
    identity/                 # domain normalization, entity resolution, dedupe
    validation/               # email/domain/phone/status checks
    scoring/                  # ICP fit, confidence, qualification rules
    exports/                  # CSV/JSON generation and access checks
    compliance/               # suppression, retention, deletion, audit
    observability/             # structured logs and metrics
  tests/
    unit/
    integration/
    fixtures/
    gold_set/
    end_to_end/
  ops/
    native-services/          # systemd/Windows service definitions and runbooks
    reverse-proxy/
    backup-restore/
    monitoring/
  docs/
    architecture/
    source-policies/
    data-dictionary/
    runbooks/
  scripts/
    db_migrate.*
    run_workers.*
    restore_check.*
  .env.example
  README.md
  SECURITY.md
  pyproject.toml
  lockfiles/
```

Do not put secrets, production databases, live customer data, raw sensitive exports, or unrestricted snapshots in the source repository.

## 21. Implementation sequence for the complete product

These stages are implementation order only. The end-state still includes every subsystem described in this blueprint.

### Stage 0 — Product contract and ground truth

Deliverables: target users, ICP schema, definition of a qualified prospect, required evidence, country/source scope, suppression/deletion policy, gold-set annotation guide, measurable acceptance gates, and source-policy review template.

Exit gate: two reviewers can apply the qualification rules to sample records and reach consistent decisions; unresolved definitions are recorded rather than left to the model.

### Stage 1 — Domain model, database, and job infrastructure

Deliverables: migrations, core entities, evidence/claim tables, source registry, durable queue, idempotency, job leases/retries/dead-letter behavior, audit logs, and native worker entrypoints.

Exit gate: tests prove repeat jobs are idempotent, leases recover from worker crashes, and provenance survives reprocessing.

### Stage 2 — Source registry, seed discovery, and harvester

Deliverables: source adapters, query planner, URL normalization, robots/source-policy checks, SSRF defenses, sitemap discovery, fetcher budgets, snapshots/hashes, conditional fetching, backoff, per-host limits, source pause, and source health.

Exit gate: the system can safely harvest permitted test sources, explain every fetch decision, and stop rather than evade when a host blocks it.

### Stage 3 — Parsing and evidence extraction

Deliverables: HTML/JSON-LD parser, structured candidate extraction, official contact/about/location discovery, evidence excerpts, parser-version tracking, and fixture suite.

Exit gate: extracted facts link to direct supporting evidence; malformed or ambiguous pages become review/unknown rather than fabricated facts.

### Stage 4 — Identity resolution, contact verification, and deduplication

Deliverables: domain-to-organization evidence, legal IDs/aliases, multi-location handling, contact-channel state machine, DNS/MX checks, suppression precedence, reversible matches, duplicate reports, and stale-state handling.

Exit gate: gold-set metrics meet the approved identity/contact thresholds; no pattern-generated email is allowed into the verified export.

### Stage 5 — ICP planner, scoring, and qualification

Deliverables: configurable ICP builder schema, query expansion, fit/confidence/freshness dimensions, explainable reason codes, qualify/review/reject/suppress routing, and export eligibility.

Exit gate: acceptance/rejection decisions can be reproduced from recorded rules and evidence, and review-only records never enter normal exports.

### Stage 6 — Customer web application and API

Deliverables: auth, workspaces, ICP campaigns, progress/status, prospect table/detail, evidence drawer, review queue, saved searches, run dashboard, feedback, exports, API keys, webhooks, and usage reporting.

Exit gate: real users can create a campaign, inspect evidence, review ambiguous records, export qualifying results, and understand why each record was included or excluded.

### Stage 7 — SaaS business controls and integrations

Deliverables: plans/entitlements, usage ledger, workspace/role administration, subscription-provider adapter, audit history, CRM/export connectors, account deletion, customer data export, and support workflows.

Exit gate: usage enforcement is server-side, customer data is tenant-isolated, deletion/suppression is respected throughout every processing stage, and billing behavior is testable without charging real customers.

### Stage 8 — Production hardening and operations

Deliverables: native deployment, HTTPS, service management, secret handling, backup/restore, health checks, alerting, release/rollback runbooks, incident process, source policy review schedule, and storage/retention automation.

Exit gate: a clean-host deployment and a restore drill succeed; a worker crash, blocked source, bad release, and database restoration have documented and tested procedures.

### Stage 9 — Controlled production qualification and growth

Deliverables: representative acceptance run, manual audits, per-source precision dashboard, usage/capacity benchmark, stale-record refresh, source adapter lifecycle, customer feedback loop, and versioned ruleset release process.

Exit gate: quality thresholds hold at the required sample size and across important source/geography segments. Increase source coverage and throughput only while precision, compliance, and freshness remain within threshold.

## 22. Definition of done — complete production product

The final product is not complete until all of the following are true:

- [ ] A new user can sign up, create a workspace, define an ICP, and launch a search.
- [ ] The query planner records the queries and source adapters it uses.
- [ ] The harvester can discover seeds, follow eligible links, use sitemaps, obey source/host budgets, handle redirects, and enforce SSRF and URL safety controls.
- [ ] Every request produces a classified fetch record, including failures and blocks.
- [ ] Parsing creates evidence-backed claims from HTML, structured data, and contact pages.
- [ ] Entity resolution handles legal names, aliases, branches, subsidiaries, multiple domains, and reversible merges.
- [ ] Email, phone, contact form, and social-link statuses have explicit and honest semantics.
- [ ] No inferred email is shown as discovered/verified; MX presence is never described as mailbox verification.
- [ ] ICP fit and evidence confidence are independently visible and explainable.
- [ ] Default exports contain no company-only/no-contact rows, unresolved critical claims, suppressed records, or accidental duplicates.
- [ ] Users can inspect the provenance and freshness for every critical claim.
- [ ] Repeated jobs are idempotent; queues survive worker crashes; permanent failures reach a review/dead-letter state.
- [ ] Source terms, robots/policy, rate limits, pause controls, and access denials are operationally enforced.
- [ ] All tenants, APIs, exports, snapshots, and feedback are access-controlled and audited.
- [ ] Suppression, correction, retention, and deletion propagate to active leads, future harvests, cached results, and exports.
- [ ] Gold-set accuracy targets and source-level regression tests pass before deployment.
- [ ] Monitoring shows queue health, source failure/blocking, field extraction quality, duplicate rate, freshness, storage, and backup status.
- [ ] The application, API, scheduler, and workers run as native services without Docker or another container orchestrator.
- [ ] A clean install, migration, rollback, backup, and restore are tested and documented.
- [ ] Throughput claims are based on measured qualified leads/hour and accuracy—not raw pages or discovered URLs.

## 23. Known constraints and explicit non-dependencies

- **No Serper:** search is provider-abstracted. Initial discovery uses permitted public sources, source-native search, open/official datasets, sitemaps, and any self-hosted search broker whose configured engines are usable under their policies.
- **No paid email finder:** extract only public source-backed channels and validate their syntax/domain signals. Missing email is a real outcome; provide an official contact form or phone when available.
- **No LinkedIn subscription:** no profile harvesting or automated access. Treat LinkedIn links as references only when encountered through allowed sources.
- **No residential proxies:** operate from a stable, identified environment with conservative per-domain limits; back off or disable sources that block automation.
- **No Docker:** install and supervise processes natively; the product must have documented host setup, service definitions, and restore procedure.
- **No guaranteed 60,000 qualified leads/month:** this remains a measured capacity goal dependent on source availability and pass rate, not an unconditional deliverable.
- **No fabricated contacts:** AI extraction, pattern guessing, stale cache values, and search snippets cannot silently become verified facts.

## 24. Official references to consult during implementation

These sources are reference points, not blanket authorization to reuse any specific website's data. Re-check terms, limits, and legal applicability when enabling each connector.

- IETF RFC 9309, Robots Exclusion Protocol: https://www.rfc-editor.org/rfc/rfc9309.html
- SearXNG Search API documentation: https://docs.searxng.org/dev/search_api.html
- Microsoft announcement: Bing Search APIs retired on 11 August 2025: https://learn.microsoft.com/en-us/lifecycle/announcements/bing-search-api-retirement
- Google Custom Search JSON API transition notice: https://developers.google.com/custom-search/v1/overview
- LinkedIn prohibited scraping software policy: https://www.linkedin.com/help/linkedin/answer/a1341387/prohibition-of-scraping-software
- Companies House API: https://developer.company-information.service.gov.uk/get-started
- European Commission overview of legal grounds for personal-data processing: https://commission.europa.eu/law/law-topic/data-protection/data-protection-eu/legal-grounds-processing-data_en
- US FTC CAN-SPAM compliance guide: https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business
- Gmail sender requirements, relevant if the product later sends email: https://support.google.com/mail/answer/81126

---

**Core engineering principle:** SignalHarbor should be able to explain where a prospect came from, why it believes the record is correct, what remains unknown, and why the record is allowed into an export. If it cannot do that, it should hold the record—not manufacture certainty.
