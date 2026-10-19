# SignalHarbor — B2B Prospect Discovery and Evidence Platform

SignalHarbor is an evidence-first prospect discovery and verification platform.

## Architecture
- **Web App**: Next.js + TypeScript (Palantir/Linear mid-tone theme)
- **API**: FastAPI (Python 3.11+)
- **Storage**: PostgreSQL / SQLite with SQLAlchemy 2.0 async
- **Evidence Engine**: Deterministic DOM / JSON-LD extraction, content-addressed snapshots, strict provenance tracking
- **Contact State Machine**: RFC syntax, disposable checks, live/offline MX validation, transparent semantics
- **Multi-Dimensional Scoring**: Separate Fit, Identity Confidence, Contact Confidence, Freshness, and Evidence Completeness
- **Native Operations**: No Docker dependency; native OS supervision and background workers
