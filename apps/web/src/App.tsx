import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Compass,
  Shield,
  ShieldCheck,
  Search,
  SlidersHorizontal,
  FileSpreadsheet,
  AlertTriangle,
  Radio,
  Server,
  Layers,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  Plus,
  Building2,
  Mail,
  Phone,
  Fingerprint,
  Play,
  Pause,
  Download,
  Command,
  Globe,
  Copy,
  Check,
  BarChart3,
  ArrowUpRight,
  Clock,
  X,
} from "./Icons";
import { MOCK_COMPANIES } from "./data/mockData";
import type { ProspectEntity } from "./data/mockData";
import { Globe3D } from "./components/Globe3D";
import { RelationshipGraph } from "./components/RelationshipGraph";
import { CountUp } from "./components/CountUp";
import { ConfidenceRing } from "./components/ConfidenceRing";
import { TiltCard } from "./components/TiltCard";
import { AdCinemaModal } from "./components/AdCinemaModal";

type ViewTab =
  | "overview"
  | "prospects"
  | "discovery"
  | "review"
  | "icp"
  | "suppressions"
  | "exports"
  | "sources"
  | "analytics";

interface AuditLogEntry {
  id: string;
  actor: string;
  timestamp: string;
  rowCount: number;
  format: string;
  filtersUsed: string;
  hashDigest: string;
}

interface SourcePolicy {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  provenanceWeight: number;
  latencyMs: number;
  uptimePercent: number;
  errorRatePercent: number;
  lastHarvest: string;
}

interface ActivityEvent {
  id: string;
  type: "discovery" | "verification" | "disposition" | "corroboration";
  title: string;
  detail: string;
  timestamp: string;
  entityId?: string;
}

export function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<ViewTab>("overview");
  const [utcTime, setUtcTime] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      const pad = (n: number) => n.toString().padStart(2, "0");
      setUtcTime(`${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} UTC`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Core entities state
  const [entities, setEntities] = useState<ProspectEntity[]>(MOCK_COMPANIES);
  const [selectedEntity, setSelectedEntity] = useState<ProspectEntity | null>(
    MOCK_COMPANIES[0]
  );
  const [isDossierOpen, setIsDossierOpen] = useState(false);

  // Prospects Ledger Table State
  const [searchQuery, setSearchQuery] = useState("");
  const [dispositionFilter, setDispositionFilter] = useState<string>("all");
  const [minFitScore, setMinFitScore] = useState<number>(60);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<"name" | "fitScore" | "industry" | "geo">("fitScore");
  const [sortAsc, setSortAsc] = useState(false);

  // Review Backlog Queue State
  const [reviewIndex, setReviewIndex] = useState(0);

  // Discovery Run & Engine State
  const [isRunning, setIsRunning] = useState(true);
  const [runStage, setRunStage] = useState<number>(3); // 0: Crawl, 1: Parse, 2: Corroborate, 3: Score, 4: Qualify
  const [runProgress, setRunProgress] = useState(68);
  const [liveLogs, setLiveLogs] = useState<string[]>([
    "[16:42:01.104] ORCHESTRATOR: Target ICP #01 'B2B Enterprise Cloud & AI' activated.",
    "[16:42:03.220] CRAWLER: Seeded 42 domains across US and EMEA corporate registries.",
    "[16:42:07.412] PARSER: Extracted canonical metadata from sentrypeaklogistics.com (Hash 8f7a93).",
    "[16:42:11.890] RESOLVER: Identity corroborated with Colorado SoS filing #201814920.",
    "[16:42:15.304] VALIDATOR: E.164 and RFC 5322 syntax verified for marcus.vance@sentrypeaklogistics.com.",
    "[16:42:18.002] SCORER: Entity calculated with Fit Score 94. Dispatched to Ledger.",
  ]);

  // ICP Architect Builder State
  const [icpWeights, setIcpWeights] = useState({
    industry: 85,
    geography: 70,
    headcount: 65,
    techStack: 90,
    exclusionPenalty: 95,
  });
  const [icpIndustries] = useState<string[]>([
    "Cloud Infrastructure",
    "Cybersecurity",
    "DevTools",
    "Fintech",
  ]);
  const [icpGeos] = useState<string[]>(["United States", "United Kingdom", "Germany"]);
  const [icpTechKeywords, setIcpTechKeywords] = useState("Kubernetes, PostgreSQL, SOC 2, Python, TypeScript");
  const [icpExclusions, setIcpExclusions] = useState("AdTech, B2C, Gambling, Crypto Exchanges");

  // Suppressions State
  const [suppressedRecords, setSuppressedRecords] = useState<
    Array<{ id: string; target: string; type: "domain" | "contact"; reason: string; timestamp: string }>
  >([
    {
      id: "sup-1",
      target: "novacache.io",
      type: "domain",
      reason: "DNS NXDOMAIN / Inactive business registrar status",
      timestamp: "2026-10-12 11:20:00 UTC",
    },
    {
      id: "sup-2",
      target: "ceo@stratasphere.cloud",
      type: "contact",
      reason: "Hard bounce SMTP response (550 User Unknown)",
      timestamp: "2026-10-11 09:14:22 UTC",
    },
    {
      id: "sup-3",
      target: "hyperflow-analytics.com",
      type: "domain",
      reason: "Operator designated out of target ICP profile",
      timestamp: "2026-10-10 18:40:15 UTC",
    },
  ]);
  const [newSuppressionTarget, setNewSuppressionTarget] = useState("");
  const [newSuppressionReason, setNewSuppressionReason] = useState("");

  // Auditable Exports State
  const [exportColumns, setExportColumns] = useState<Record<string, boolean>>({
    name: true,
    domain: true,
    industry: true,
    geo: true,
    fitScore: true,
    contactRoute: true,
    provenanceHash: true,
    observedDate: true,
  });
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([
    {
      id: "aud-001",
      actor: "sec-ops@signalharbor.local",
      timestamp: "2026-10-13 14:10:22 UTC",
      rowCount: 28,
      format: "CSV",
      filtersUsed: "disposition=Qualified, min_fit=75",
      hashDigest: "sha256:4b9f029c78d5e1ba8920194091a18bc0192eef57",
    },
    {
      id: "aud-002",
      actor: "analyst-lead@signalharbor.local",
      timestamp: "2026-10-12 18:32:05 UTC",
      rowCount: 14,
      format: "CSV",
      filtersUsed: "industry=Cybersecurity, geo=United States",
      hashDigest: "sha256:7f10a82b99c011e4f48194a029c48821901abcf8",
    },
  ]);

  // Source Policies State
  const [sourcePolicies, setSourcePolicies] = useState<SourcePolicy[]>([
    {
      id: "src-1",
      name: "Corporate Registry Gateway",
      type: "Official Registry (SEC/EDGAR, SoS, UK Companies House)",
      enabled: true,
      provenanceWeight: 1.0,
      latencyMs: 142,
      uptimePercent: 99.98,
      errorRatePercent: 0.02,
      lastHarvest: "12s ago",
    },
    {
      id: "src-2",
      name: "DNS & RFC MX Validator",
      type: "DNS / WHOIS / RFC 5322 Mailbox Route Prober",
      enabled: true,
      provenanceWeight: 0.95,
      latencyMs: 84,
      uptimePercent: 99.99,
      errorRatePercent: 0.01,
      lastHarvest: "4s ago",
    },
    {
      id: "src-3",
      name: "Autonomous Web Harvester",
      type: "SSRF-Guarded Headless Crawler & Semantic Extractor",
      enabled: true,
      provenanceWeight: 0.85,
      latencyMs: 420,
      uptimePercent: 99.85,
      errorRatePercent: 0.12,
      lastHarvest: "18s ago",
    },
    {
      id: "src-4",
      name: "Engineering & Ecosystem Signals",
      type: "Public GitHub Repos, Developer Documentation, Job Filings",
      enabled: true,
      provenanceWeight: 0.8,
      latencyMs: 230,
      uptimePercent: 99.91,
      errorRatePercent: 0.05,
      lastHarvest: "35s ago",
    },
  ]);

  // Live Activity Stream
  const [activityFeed] = useState<ActivityEvent[]>([
    {
      id: "act-1",
      type: "verification",
      title: "Contact Corroborated",
      detail: "marcus.vance@sentrypeaklogistics.com confirmed via MX records",
      timestamp: "Just now",
      entityId: "ent-01",
    },
    {
      id: "act-2",
      type: "discovery",
      title: "New Target Extracted",
      detail: "Ironclad Cyber Systems (Fit 98%) processed from SEC filings",
      timestamp: "2m ago",
      entityId: "ent-02",
    },
    {
      id: "act-3",
      type: "disposition",
      title: "Promoted to Qualified",
      detail: "CloudMesh Fabric promoted with 100% provenance integrity",
      timestamp: "6m ago",
      entityId: "ent-03",
    },
    {
      id: "act-4",
      type: "corroboration",
      title: "Provenance Cryptographically Stamped",
      detail: "Hash e7a4b081... anchored for Synapse Data Labs",
      timestamp: "12m ago",
      entityId: "ent-04",
    },
  ]);

  // UI Feedback / Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  }, []);

  // Command Palette
  const [showCommandK, setShowCommandK] = useState(false);
  const [commandQuery, setCommandQuery] = useState("");

  // Modal: Schedule Run
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showAdModal, setShowAdModal] = useState(false);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setShowCommandK((prev) => !prev);
        return;
      }

      if (e.key === "Escape") {
        setShowCommandK(false);
        setIsDossierOpen(false);
        setShowScheduleModal(false);
        return;
      }

      const isInputFocused =
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA" ||
        document.activeElement?.tagName === "SELECT";

      if (activeTab === "review" && !isInputFocused && !showCommandK) {
        if (e.key.toLowerCase() === "a") {
          e.preventDefault();
          handleReviewAction("Qualified");
        } else if (e.key.toLowerCase() === "r") {
          e.preventDefault();
          handleReviewAction("Review");
        } else if (e.key.toLowerCase() === "s") {
          e.preventDefault();
          handleReviewAction("Suppressed");
        } else if (e.key === "ArrowRight" || e.key.toLowerCase() === "j") {
          e.preventDefault();
          setReviewIndex((prev) => Math.min(prev + 1, reviewBacklogEntities.length - 1));
        } else if (e.key === "ArrowLeft" || e.key.toLowerCase() === "k") {
          e.preventDefault();
          setReviewIndex((prev) => Math.max(prev - 1, 0));
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeTab, showCommandK]);

  // Discovery Run background simulation
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setRunProgress((prev) => {
        if (prev >= 98) {
          setRunStage((s) => (s + 1) % 5);
          return 15;
        }
        return prev + 1;
      });
    }, 450);
    return () => clearInterval(interval);
  }, [isRunning]);

  // Computed Entities for Review Backlog
  const reviewBacklogEntities = useMemo(() => {
    return entities.filter((e) => e.disposition === "Review");
  }, [entities]);

  const currentReviewEntity = reviewBacklogEntities[reviewIndex] || reviewBacklogEntities[0] || entities[0];

  // Filtered & Sorted Ledger Entities
  const filteredEntities = useMemo(() => {
    return entities
      .filter((ent) => {
        if (dispositionFilter !== "all" && ent.disposition !== dispositionFilter) return false;
        if (ent.fitScore < minFitScore) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = ent.name.toLowerCase().includes(q);
          const matchDomain = ent.domain.toLowerCase().includes(q);
          const matchIndustry = ent.industry.toLowerCase().includes(q);
          const matchGeo = ent.geo.toLowerCase().includes(q);
          if (!matchName && !matchDomain && !matchIndustry && !matchGeo) return false;
        }
        return true;
      })
      .sort((a, b) => {
        let valA: any = a[sortField];
        let valB: any = b[sortField];
        if (typeof valA === "string") valA = valA.toLowerCase();
        if (typeof valB === "string") valB = valB.toLowerCase();
        if (valA < valB) return sortAsc ? -1 : 1;
        if (valA > valB) return sortAsc ? 1 : -1;
        return 0;
      });
  }, [entities, dispositionFilter, minFitScore, searchQuery, sortField, sortAsc]);

  // Dynamic ICP Projected Matches
  const icpProjectedMatches = useMemo(() => {
    return entities.filter((ent) => {
      const matchesInd = icpIndustries.some((ind) => ent.industry.includes(ind));
      return matchesInd && ent.fitScore >= 70;
    });
  }, [entities, icpIndustries]);

  // Handlers
  const handleOpenDossier = useCallback((entity: ProspectEntity) => {
    setSelectedEntity(entity);
    setIsDossierOpen(true);
  }, []);

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredEntities.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredEntities.map((e) => e.id)));
    }
  };

  const handleBatchDisposition = (disposition: "Qualified" | "Suppressed") => {
    if (selectedIds.size === 0) return;
    setEntities((prev) =>
      prev.map((e) => (selectedIds.has(e.id) ? { ...e, disposition } : e))
    );
    showToast(`Updated ${selectedIds.size} entities to ${disposition}`);
    setSelectedIds(new Set());
  };

  const handleReviewAction = (decision: "Qualified" | "Review" | "Suppressed") => {
    if (!currentReviewEntity) return;
    const targetId = currentReviewEntity.id;
    setEntities((prev) =>
      prev.map((e) => (e.id === targetId ? { ...e, disposition: decision } : e))
    );
    showToast(`Entity '${currentReviewEntity.name}' marked as ${decision}`);
    if (reviewIndex < reviewBacklogEntities.length - 1) {
      setReviewIndex((prev) => prev + 1);
    } else {
      setReviewIndex(0);
    }
  };

  const handleRestoreSuppression = (id: string, target: string) => {
    setSuppressedRecords((prev) => prev.filter((r) => r.id !== id));
    setEntities((prev) =>
      prev.map((e) => (e.domain === target ? { ...e, disposition: "Review" } : e))
    );
    showToast(`Restored suppression rule for ${target}`);
  };

  const handleAddSuppression = () => {
    if (!newSuppressionTarget.trim()) return;
    const newEntry = {
      id: `sup-${Date.now()}`,
      target: newSuppressionTarget.trim(),
      type: (newSuppressionTarget.includes("@") ? "contact" : "domain") as "contact" | "domain",
      reason: newSuppressionReason.trim() || "Operator compliance manual entry",
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 19) + " UTC",
    };
    setSuppressedRecords((prev) => [newEntry, ...prev]);
    setEntities((prev) =>
      prev.map((e) =>
        e.domain === newSuppressionTarget.trim() ? { ...e, disposition: "Suppressed" } : e
      )
    );
    setNewSuppressionTarget("");
    setNewSuppressionReason("");
    showToast(`Added suppression rule: ${newEntry.target}`);
  };

  const handleExportCSV = (selectedOnly = false) => {
    const listToExport = selectedOnly
      ? entities.filter((e) => selectedIds.has(e.id))
      : filteredEntities;

    if (listToExport.length === 0) {
      showToast("No records match export criteria.");
      return;
    }

    const headers = [
      "Entity Name",
      "Canonical Domain",
      "Industry",
      "Geography",
      "Fit Score",
      "Disposition",
      "Primary Contact",
      "Contact Status",
      "Corroboration Hash",
    ];

    const rows = listToExport.map((e) => [
      `"${e.name.replace(/"/g, '""')}"`,
      `"${e.domain}"`,
      `"${e.industry}"`,
      `"${e.geo}"`,
      e.fitScore,
      `"${e.disposition}"`,
      `"${(e.contacts[0]?.value || "").replace(/"/g, '""')}"`,
      `"${e.contacts[0]?.status || ""}"`,
      `"${e.provenance[0]?.contentHash || ""}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `signalharbor_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    const newAudit: AuditLogEntry = {
      id: `aud-${Date.now().toString().slice(-4)}`,
      actor: "analyst@signalharbor.local",
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 19) + " UTC",
      rowCount: listToExport.length,
      format: "CSV",
      filtersUsed: selectedOnly
        ? `batch_selection (${listToExport.length} records)`
        : `disposition=${dispositionFilter}, min_fit=${minFitScore}`,
      hashDigest: `sha256:${Math.random().toString(16).substring(2)}${Math.random().toString(16).substring(2)}`,
    };
    setAuditLogs((prev) => [newAudit, ...prev]);

    showToast(`Exported ${listToExport.length} verified records with SHA-256 audit stamp.`);
  };

  const handleCopyOutreachBrief = (entity: ProspectEntity) => {
    const primaryContact = entity.contacts[0];
    const brief = `[SIGNAL HARBOR // OSINT OUTREACH BRIEF]
TARGET ENTITY: ${entity.name}
DOMAIN: ${entity.domain}
HEADQUARTERS: ${entity.city}, ${entity.geo}
FIT SCORE: ${entity.fitScore}% (ICP Corroborated)
PRIMARY ROUTE: ${primaryContact ? `${primaryContact.personName || "Direct Contact"} <${primaryContact.value}> (${primaryContact.status})` : "Unpublished"}
KEY SIGNALS:
- ${entity.positiveFactors.join("\n- ")}
EVIDENCE ANCHOR: ${entity.provenance[0]?.domLocator || "DOM Element"}
PROVENANCE HASH: ${entity.provenance[0]?.contentHash || "N/A"}
STATUS: ${entity.disposition.toUpperCase()}`;

    navigator.clipboard.writeText(brief);
    showToast("Outreach brief copied to clipboard.");
  };

  const pipelineStages = [
    { label: "Crawl", sub: "SSRF-Safe Ingest" },
    { label: "Parse", sub: "DOM & RFC Extractor" },
    { label: "Corroborate", sub: "Cross-Registry Match" },
    { label: "Score", sub: "Weighted ICP Matrix" },
    { label: "Qualify", sub: "Disposition & Seal" },
  ];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        backgroundColor: "var(--bg)",
        color: "var(--text)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: "fixed",
            top: "60px",
            right: "24px",
            zIndex: 9999,
            backgroundColor: "var(--panel-elevated)",
            border: "1px solid var(--teal)",
            borderRadius: "var(--radius-sm)",
            padding: "8px 16px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
            fontSize: "12px",
            fontWeight: 500,
            color: "var(--text)",
          }}
        >
          <CheckCircle2 size={16} style={{ color: "var(--teal)" }} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ================= FLOATING ISLAND AVIONICS DECK ================= */}
      <header className="island-header">
        {/* Left: Brand & Telemetry */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div className="brand-pod">
            <div className="brand-icon-box">
              <Compass size={17} />
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
              <span className="font-brand" style={{ fontSize: "14px", fontWeight: 800, letterSpacing: "-0.02em" }}>
                SIGNAL<span style={{ color: "var(--teal)" }}>HARBOR</span>
              </span>
              <span className="eyebrow-pill" style={{ color: "var(--teal)", borderColor: "var(--teal-border)" }}>
                OSINT v2.4-PRO
              </span>
            </div>
          </div>

          <div style={{ width: "1px", height: "18px", backgroundColor: "rgba(255, 255, 255, 0.08)" }} />

          {/* Engine Status Pills */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div className="telemetry-chip">
              <div
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  backgroundColor: "var(--teal)",
                  boxShadow: "0 0 8px var(--teal)",
                }}
              />
              <span className="font-mono" style={{ fontSize: "10.5px" }}>HOST: NATIVE ONLINE</span>
            </div>

            <div className="telemetry-chip">
              <Fingerprint size={12} style={{ color: "var(--cyan)" }} />
              <span className="font-mono" style={{ fontSize: "10.5px" }}>PROVENANCE: 100.0%</span>
            </div>

            <div className="telemetry-chip">
              <Radio size={12} style={{ color: "var(--teal)" }} />
              <span className="font-mono" style={{ fontSize: "10.5px" }}>
                FEEDS: {sourcePolicies.filter((s) => s.enabled).length}/{sourcePolicies.length} ACTIVE
              </span>
            </div>

            <div className="telemetry-chip font-mono tabular-nums" style={{ fontSize: "10.5px" }}>
              ⏱ {utcTime || "12:00:00 UTC"}
            </div>
          </div>
        </div>

        {/* Right: Actions & ⌘K Search */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            onClick={() => setShowCommandK(true)}
            className="btn-secondary"
            style={{ fontSize: "11px", padding: "5px 12px", height: "32px" }}
          >
            <Command size={13} style={{ color: "var(--muted)" }} />
            <span>Search Signals</span>
            <kbd
              className="font-mono"
              style={{
                fontSize: "9.5px",
                padding: "1.5px 5px",
                backgroundColor: "rgba(255,255,255,0.08)",
                borderRadius: "4px",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "var(--muted)",
              }}
            >
              ⌘K
            </kbd>
          </button>

          <button
            onClick={() => setShowAdModal(true)}
            className="btn-secondary"
            style={{
              height: "32px",
              fontSize: "11px",
              padding: "5px 12px",
              border: "1px solid rgba(0, 240, 255, 0.45)",
              background: "rgba(0, 240, 255, 0.08)",
              color: "#00F0FF",
              boxShadow: "0 0 15px rgba(0, 240, 255, 0.18)",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontWeight: 700,
            }}
          >
            <span style={{ fontSize: "13px" }}>🎬</span>
            <span>Watch 3D Film</span>
          </button>

          <button
            onClick={() => setShowScheduleModal(true)}
            className="btn-cta-island"
            style={{ height: "32px" }}
          >
            <div className="btn-icon-wrapper">
              <Play size={10} fill="currentColor" />
            </div>
            <span>Launch Discovery Run</span>
          </button>
        </div>
      </header>

      {/* ================= MAIN SPLIT WORKSPACE ================= */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden", padding: "0 16px 12px 0" }}>
        {/* ================= FLOATING TACTICAL GLASS DOCK ================= */}
        <nav className="floating-dock">
          <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
            <div
              className="section-header"
              style={{ padding: "6px 10px 4px 10px", marginBottom: "2px" }}
            >
              Intelligence Feeds
            </div>

            <button
              onClick={() => setActiveTab("overview")}
              className={`dock-item ${activeTab === "overview" ? "active" : ""}`}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                <Globe size={14} style={{ color: activeTab === "overview" ? "var(--teal)" : "inherit" }} />
                <span>Overview & 3D Globe</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab("prospects")}
              className={`dock-item ${activeTab === "prospects" ? "active" : ""}`}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                <Building2 size={14} style={{ color: activeTab === "prospects" ? "var(--teal)" : "inherit" }} />
                <span>Prospects Ledger</span>
              </div>
              <span
                className="font-mono"
                style={{
                  fontSize: "10px",
                  padding: "1.5px 6px",
                  borderRadius: "9999px",
                  backgroundColor: "rgba(255,255,255,0.06)",
                  color: "var(--muted)",
                }}
              >
                {entities.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("discovery")}
              className={`dock-item ${activeTab === "discovery" ? "active" : ""}`}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                <Radio size={14} style={{ color: activeTab === "discovery" ? "var(--teal)" : "inherit" }} />
                <span>Discovery Runs</span>
              </div>
              <div
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  backgroundColor: isRunning ? "var(--teal)" : "var(--faint)",
                  boxShadow: isRunning ? "0 0 6px var(--teal)" : "none",
                }}
              />
            </button>

            <button
              onClick={() => setActiveTab("review")}
              className={`dock-item ${activeTab === "review" ? "active" : ""}`}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                <Layers size={14} style={{ color: activeTab === "review" ? "var(--teal)" : "inherit" }} />
                <span>Review Backlog</span>
              </div>
              {reviewBacklogEntities.length > 0 && (
                <span
                  className="font-mono"
                  style={{
                    fontSize: "10px",
                    padding: "1.5px 6px",
                    borderRadius: "9999px",
                    backgroundColor: "var(--amber-subtle)",
                    color: "var(--amber)",
                    border: "1px solid var(--amber-border)",
                  }}
                >
                  {reviewBacklogEntities.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("icp")}
              className={`dock-item ${activeTab === "icp" ? "active" : ""}`}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                <SlidersHorizontal size={14} style={{ color: activeTab === "icp" ? "var(--teal)" : "inherit" }} />
                <span>ICP Architect</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab("suppressions")}
              className={`dock-item ${activeTab === "suppressions" ? "active" : ""}`}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                <Shield size={14} style={{ color: activeTab === "suppressions" ? "var(--teal)" : "inherit" }} />
                <span>Suppressions</span>
              </div>
              <span
                className="font-mono"
                style={{
                  fontSize: "10px",
                  padding: "1.5px 6px",
                  borderRadius: "9999px",
                  backgroundColor: "rgba(255,255,255,0.06)",
                  color: "var(--muted)",
                }}
              >
                {suppressedRecords.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("exports")}
              className={`dock-item ${activeTab === "exports" ? "active" : ""}`}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                <FileSpreadsheet size={14} style={{ color: activeTab === "exports" ? "var(--teal)" : "inherit" }} />
                <span>Auditable Exports</span>
              </div>
            </button>

            <div
              className="section-header"
              style={{ padding: "14px 10px 4px 10px", marginTop: "4px" }}
            >
              Configuration & Telemetry
            </div>

            <button
              onClick={() => setActiveTab("sources")}
              className={`dock-item ${activeTab === "sources" ? "active" : ""}`}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                <Server size={14} style={{ color: activeTab === "sources" ? "var(--teal)" : "inherit" }} />
                <span>Source Policies</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab("analytics")}
              className={`dock-item ${activeTab === "analytics" ? "active" : ""}`}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                <BarChart3 size={14} style={{ color: activeTab === "analytics" ? "var(--teal)" : "inherit" }} />
                <span>Analytics & Funnel</span>
              </div>
            </button>
          </div>

          {/* Bottom Audited Health Status Card with Double-Bezel styling */}
          <div
            style={{
              marginTop: "16px",
              padding: "10px 12px",
              backgroundColor: "#F8FAFC",
              border: "1px solid #E2E8F0",
              borderRadius: "var(--radius-sm)",
              boxShadow: "0 1px 2px rgba(0, 0, 0, 0.04)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span
                className="font-mono"
                style={{ fontSize: "9.5px", textTransform: "uppercase", color: "var(--muted)", letterSpacing: "0.08em" }}
              >
                Audited Health
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <div
                  style={{
                    width: "5px",
                    height: "5px",
                    borderRadius: "50%",
                    backgroundColor: "var(--teal)",
                    boxShadow: "0 0 6px var(--teal)",
                  }}
                />
                <span
                  className="font-mono"
                  style={{ fontSize: "9.5px", color: "var(--teal)", fontWeight: 700 }}
                >
                  ACTIVE
                </span>
              </div>
            </div>

            <div style={{ marginTop: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontSize: "10.5px", color: "var(--muted)" }}>Qualified Entities</span>
                <span className="font-mono" style={{ fontSize: "12px", fontWeight: 700, color: "var(--text)" }}>
                  {entities.filter((e) => e.disposition === "Qualified").length} / {entities.length}
                </span>
              </div>
              <div
                style={{
                  height: "4px",
                  backgroundColor: "#E2E8F0",
                  borderRadius: "2px",
                  marginTop: "6px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${(entities.filter((e) => e.disposition === "Qualified").length / entities.length) * 100}%`,
                    backgroundColor: "var(--teal)",
                    borderRadius: "2px",
                  }}
                />
              </div>
            </div>

            <div
              className="font-mono"
              style={{
                fontSize: "9px",
                color: "var(--faint)",
                marginTop: "8px",
                display: "flex",
                justifyContent: "space-between",
                borderTop: "1px solid #E2E8F0",
                paddingTop: "6px",
              }}
            >
              <span>Integrity: 100.0%</span>
              <span>P99: 142ms</span>
            </div>
          </div>
        </nav>

        {/* ================= MAIN CONTENT AREA ================= */}
        <main
          style={{
            flex: 1,
            backgroundColor: "var(--bg)",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            position: "relative",
          }}
        >
          {/* ================= VIEW 1: OVERVIEW ================= */}
          {activeTab === "overview" && (
            <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* KPI Header Row */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: "14px",
                }}
              >
                {/* Card 1: Qualified Leads */}
                <TiltCard>
                  <div className="double-bezel">
                    <div
                      className="double-bezel-inner"
                      style={{
                        padding: "16px",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span className="section-header">Qualified Leads</span>
                        <span className="eyebrow-pill" style={{ color: "var(--teal)", borderColor: "var(--teal-border)", background: "var(--teal-subtle)" }}>
                          <ArrowUpRight size={11} /> +14.2%
                        </span>
                      </div>

                      <div style={{ marginTop: "12px", display: "flex", alignItems: "baseline", gap: "8px" }}>
                        <span className="font-mono tabular-nums" style={{ fontSize: "28px", fontWeight: 800, color: "var(--text)", letterSpacing: "-0.03em" }}>
                          <CountUp value={entities.filter((e) => e.disposition === "Qualified").length} />
                        </span>
                        <span className="font-mono" style={{ fontSize: "11px", color: "var(--muted)" }}>
                          / {entities.length} total nodes
                        </span>
                      </div>

                      {/* Micro Sparkline */}
                      <div style={{ marginTop: "10px", height: "24px", width: "100%" }}>
                        <svg width="100%" height="24" viewBox="0 0 120 24" preserveAspectRatio="none">
                          <path d="M0,20 Q20,18 40,19 T80,10 T120,3" fill="none" stroke="var(--mint)" strokeWidth="1.8" />
                          <path d="M0,20 Q20,18 40,19 T80,10 T120,3 L120,24 L0,24 Z" fill="rgba(0, 240, 168, 0.08)" />
                        </svg>
                      </div>

                      <div style={{ fontSize: "10.5px", color: "var(--muted)", marginTop: "6px" }}>
                        Identity and multi-registry corroboration passed
                      </div>
                    </div>
                  </div>
                </TiltCard>

                {/* Card 2: Avg ICP Fit Score */}
                <TiltCard>
                  <div className="double-bezel">
                    <div
                      className="double-bezel-inner"
                      style={{
                        padding: "16px",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span className="section-header">Avg ICP Fit Score</span>
                        <span className="eyebrow-pill" style={{ color: "var(--cyan)", borderColor: "var(--cyan-border)", background: "var(--cyan-subtle)" }}>
                          <ArrowUpRight size={11} /> +3.8 pts
                        </span>
                      </div>

                      <div style={{ marginTop: "12px", display: "flex", alignItems: "baseline", gap: "6px" }}>
                        <span className="font-mono tabular-nums" style={{ fontSize: "28px", fontWeight: 800, color: "var(--text)", letterSpacing: "-0.03em" }}>
                          <CountUp
                            value={Math.round(
                              entities.reduce((acc, c) => acc + c.fitScore, 0) / entities.length
                            )}
                            suffix="%"
                          />
                        </span>
                      </div>

                      {/* Micro Sparkline */}
                      <div style={{ marginTop: "10px", height: "24px", width: "100%" }}>
                        <svg width="100%" height="24" viewBox="0 0 120 24" preserveAspectRatio="none">
                          <path d="M0,19 Q30,16 60,12 T120,5" fill="none" stroke="var(--cyan)" strokeWidth="1.8" />
                          <path d="M0,19 Q30,16 60,12 T120,5 L120,24 L0,24 Z" fill="rgba(0, 216, 246, 0.08)" />
                        </svg>
                      </div>

                      <div style={{ fontSize: "10.5px", color: "var(--muted)", marginTop: "6px" }}>
                        Weighted against active ICP architecture matrix
                      </div>
                    </div>
                  </div>
                </TiltCard>

                {/* Card 3: Verification Rate */}
                <TiltCard>
                  <div className="double-bezel">
                    <div
                      className="double-bezel-inner"
                      style={{
                        padding: "16px",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span className="section-header">Verification Rate</span>
                        <span className="eyebrow-pill" style={{ color: "var(--teal)", borderColor: "var(--teal-border)", background: "var(--teal-subtle)" }}>
                          94.2%
                        </span>
                      </div>

                      <div style={{ marginTop: "12px", display: "flex", alignItems: "baseline", gap: "6px" }}>
                        <span className="font-mono tabular-nums" style={{ fontSize: "28px", fontWeight: 800, color: "var(--mint)", letterSpacing: "-0.03em" }}>
                          <CountUp value={94.2} decimals={1} suffix="%" />
                        </span>
                      </div>

                      {/* Micro Sparkline */}
                      <div style={{ marginTop: "10px", height: "24px", width: "100%" }}>
                        <svg width="100%" height="24" viewBox="0 0 120 24" preserveAspectRatio="none">
                          <path d="M0,17 Q30,20 60,9 T120,3" fill="none" stroke="var(--mint)" strokeWidth="1.8" />
                          <path d="M0,17 Q30,20 60,9 T120,3 L120,24 L0,24 Z" fill="rgba(0, 240, 168, 0.08)" />
                        </svg>
                      </div>

                      <div style={{ fontSize: "10.5px", color: "var(--muted)", marginTop: "6px" }}>
                        RFC 5322 & E.164 direct routing corroborated
                      </div>
                    </div>
                  </div>
                </TiltCard>

                {/* Card 4: Provenance Coverage */}
                <TiltCard>
                  <div className="double-bezel">
                    <div
                      className="double-bezel-inner"
                      style={{
                        padding: "16px",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span className="section-header">Provenance Coverage</span>
                        <span className="eyebrow-pill" style={{ color: "var(--cyan)", borderColor: "var(--cyan-border)", background: "var(--cyan-subtle)" }}>
                          CRYPTOGRAPHIC
                        </span>
                      </div>

                      <div style={{ marginTop: "12px", display: "flex", alignItems: "baseline", gap: "6px" }}>
                        <span className="font-mono tabular-nums" style={{ fontSize: "28px", fontWeight: 800, color: "var(--text)", letterSpacing: "-0.03em" }}>
                          <CountUp value={100.0} decimals={1} suffix="%" />
                        </span>
                      </div>

                      {/* Micro Sparkline */}
                      <div style={{ marginTop: "10px", height: "24px", width: "100%" }}>
                        <svg width="100%" height="24" viewBox="0 0 120 24" preserveAspectRatio="none">
                          <line x1="0" y1="10" x2="120" y2="10" stroke="var(--cyan)" strokeWidth="1.8" strokeDasharray="3 3" />
                          <rect x="0" y="10" width="120" height="14" fill="rgba(0, 216, 246, 0.05)" />
                        </svg>
                      </div>

                      <div style={{ fontSize: "10.5px", color: "var(--muted)", marginTop: "6px" }}>
                        Zero unanchored claims • Full SHA-256 integrity
                      </div>
                    </div>
                  </div>
                </TiltCard>
              </div>

              {/* Middle Section: 3D Holographic Globe + Active Run Telemetry */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.9fr 1.1fr",
                  gap: "14px",
                  height: "460px",
                }}
              >
                {/* 3D Globe Panel */}
                <div className="double-bezel" style={{ display: "flex", flexDirection: "column" }}>
                  <div
                    className="double-bezel-inner"
                    style={{
                      flex: 1,
                      position: "relative",
                      display: "flex",
                      flexDirection: "column",
                      background: "#FFFFFF",
                      overflow: "hidden",
                    }}
                  >
                    <div style={{ flex: 1, position: "relative" }}>
                      <Globe3D entities={entities} onSelectEntity={handleOpenDossier} />
                    </div>
                  </div>
                </div>

                {/* Active Run Card + Live Stream */}
                <div className="double-bezel" style={{ display: "flex", flexDirection: "column" }}>
                  <div
                    className="double-bezel-inner"
                    style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      padding: "16px",
                      gap: "14px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--teal)", boxShadow: "0 0 8px var(--teal)" }} />
                        <span className="section-header">Active Discovery Run</span>
                      </div>
                      <button
                        onClick={() => setIsRunning(!isRunning)}
                        className="btn-secondary"
                        style={{ fontSize: "11px", padding: "4px 10px" }}
                      >
                        {isRunning ? <Pause size={11} /> : <Play size={11} />}
                        <span>{isRunning ? "Pause" : "Resume"}</span>
                      </button>
                    </div>

                    {/* Stage Progress Bar */}
                    <div
                      style={{
                        padding: "12px",
                        backgroundColor: "#F8FAFC",
                        border: "1px solid #E2E8F0",
                        borderRadius: "var(--radius-sm)",
                        boxShadow: "0 1px 2px rgba(0, 0, 0, 0.03)",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                        <span className="font-mono" style={{ fontSize: "11px", color: "var(--text)" }}>
                          Stage: <strong style={{ color: "var(--teal)" }}>{pipelineStages[runStage].label}</strong>
                        </span>
                        <span className="font-mono tabular-nums" style={{ fontSize: "11.5px", color: "var(--teal)", fontWeight: 700 }}>
                          {runProgress}%
                        </span>
                      </div>
                      <div
                        style={{
                          height: "5px",
                          backgroundColor: "#E2E8F0",
                          borderRadius: "3px",
                          marginTop: "8px",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${runProgress}%`,
                            background: "linear-gradient(90deg, #2563EB, #059669)",
                            borderRadius: "3px",
                            transition: "width 300ms ease",
                          }}
                        />
                      </div>
                      <div
                        style={{
                          fontSize: "10px",
                          color: "var(--muted)",
                          marginTop: "8px",
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <span>{pipelineStages[runStage].sub}</span>
                        <span className="font-mono" style={{ color: "var(--faint)" }}>8 workers</span>
                      </div>
                    </div>

                    {/* Live Activity Feed */}
                    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
                      <div className="section-header" style={{ marginBottom: "8px" }}>
                        Live Activity Telemetry
                      </div>
                      <div
                        style={{
                          flex: 1,
                          overflowY: "auto",
                          display: "flex",
                          flexDirection: "column",
                          gap: "6px",
                        }}
                      >
                        {activityFeed.map((evt) => (
                          <div
                            key={evt.id}
                            style={{
                              padding: "8px 10px",
                              backgroundColor: "#F8FAFC",
                              border: "1px solid #E2E8F0",
                              borderRadius: "var(--radius-xs)",
                              display: "flex",
                              flexDirection: "column",
                              gap: "2px",
                              transition: "all 140ms ease",
                              boxShadow: "0 1px 2px rgba(0, 0, 0, 0.02)",
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text)" }}>
                                {evt.title}
                              </span>
                              <span className="font-mono" style={{ fontSize: "9px", color: "var(--faint)" }}>
                                {evt.timestamp}
                              </span>
                            </div>
                            <div style={{ fontSize: "10.5px", color: "var(--muted)", lineHeight: 1.3 }}>
                              {evt.detail}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                            {/* Bottom Quick Jump Table Preview */}
              <div className="double-bezel">
                <div
                  className="double-bezel-inner"
                  style={{
                    padding: "16px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--teal)" }} />
                        <span className="section-header">Top Qualified Prospects (Quick View)</span>
                      </div>
                      <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "3px" }}>
                        Highest fit score entities with 100% verified route corroborate
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveTab("prospects")}
                      className="btn-secondary"
                      style={{ fontSize: "11px", padding: "4px 12px" }}
                    >
                      <span>Open Full Prospects Ledger</span>
                      <ChevronRight size={12} />
                    </button>
                  </div>

                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.08)", color: "var(--muted)", textAlign: "left" }}>
                          <th style={{ padding: "8px 12px", fontWeight: 600, fontSize: "10px", letterSpacing: "0.08em" }}>ORGANIZATION</th>
                          <th style={{ padding: "8px 12px", fontWeight: 600, fontSize: "10px", letterSpacing: "0.08em" }}>INDUSTRY & GEO</th>
                          <th style={{ padding: "8px 12px", fontWeight: 600, fontSize: "10px", letterSpacing: "0.08em" }}>FIT SCORE</th>
                          <th style={{ padding: "8px 12px", fontWeight: 600, fontSize: "10px", letterSpacing: "0.08em" }}>DISPOSITION</th>
                          <th style={{ padding: "8px 12px", fontWeight: 600, fontSize: "10px", letterSpacing: "0.08em" }}>VERIFIED ROUTE</th>
                          <th style={{ padding: "8px 12px", textAlign: "right", fontWeight: 600, fontSize: "10px", letterSpacing: "0.08em" }}>ACTION</th>
                        </tr>
                      </thead>
                      <tbody>
                        {entities.slice(0, 5).map((ent) => (
                          <tr
                            key={ent.id}
                            style={{
                              borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
                              cursor: "pointer",
                              transition: "all 140ms ease",
                            }}
                            className="table-row-hover"
                            onClick={() => handleOpenDossier(ent)}
                          >
                            <td style={{ padding: "10px 12px" }}>
                              <div style={{ fontWeight: 700, color: "var(--text)" }}>{ent.name}</div>
                              <div className="font-mono" style={{ fontSize: "11px", color: "var(--cyan)" }}>
                                {ent.domain}
                              </div>
                            </td>
                            <td style={{ padding: "10px 12px" }}>
                              <div>{ent.industry}</div>
                              <div style={{ fontSize: "11px", color: "var(--muted)" }}>{ent.geo}</div>
                            </td>
                            <td style={{ padding: "10px 12px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <span className="font-mono tabular-nums" style={{ fontWeight: 700, color: "var(--teal)" }}>
                                  {ent.fitScore}%
                                </span>
                                <div
                                  style={{
                                    width: "50px",
                                    height: "3px",
                                    backgroundColor: "rgba(255,255,255,0.08)",
                                    borderRadius: "2px",
                                    overflow: "hidden",
                                  }}
                                >
                                  <div
                                    style={{
                                      width: `${ent.fitScore}%`,
                                      height: "100%",
                                      backgroundColor: "var(--teal)",
                                      boxShadow: "0 0 6px var(--teal)",
                                    }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: "10px 12px" }}>
                              <span
                                className={
                                  ent.disposition === "Qualified"
                                    ? "badge-qualified"
                                    : ent.disposition === "Review"
                                    ? "badge-review"
                                    : "badge-suppressed"
                                }
                              >
                                {ent.disposition}
                              </span>
                            </td>
                            <td style={{ padding: "10px 12px" }}>
                              <div className="font-mono" style={{ fontSize: "11px", color: "var(--text)" }}>
                                {ent.contacts[0]?.value || "No route"}
                              </div>
                              <div style={{ fontSize: "10px", color: "var(--teal)" }}>
                                {ent.contacts[0]?.status || "Unprobed"}
                              </div>
                            </td>
                            <td style={{ padding: "10px 12px", textAlign: "right" }}>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenDossier(ent);
                                }}
                                className="btn-secondary"
                                style={{ fontSize: "10.5px", padding: "3px 10px" }}
                              >
                                Inspect Dossier
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>  </div>
            </div>
          )}

          {/* ================= VIEW 2: PROSPECTS LEDGER ================= */}
          {activeTab === "prospects" && (
            <div style={{ padding: "16px", display: "flex", flexDirection: "column", height: "100%", boxSizing: "border-box", gap: "12px" }}>
              {/* Filter and Control Bar */}
              <div
                className="panel"
                style={{
                  padding: "10px 14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px",
                  flexWrap: "wrap",
                }}
              >
                {/* Search query */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, minWidth: "220px" }}>
                  <Search size={14} style={{ color: "var(--muted)" }} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filter by organization, domain, industry, geo..."
                    className="input-base"
                    style={{ flex: 1, height: "28px", padding: "2px 8px" }}
                  />
                </div>

                {/* Disposition Filter */}
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span className="section-header" style={{ fontSize: "10px" }}>Disposition:</span>
                  <select
                    value={dispositionFilter}
                    onChange={(e) => setDispositionFilter(e.target.value)}
                    className="input-base"
                    style={{ height: "28px", padding: "2px 8px" }}
                  >
                    <option value="all">All Dispositions</option>
                    <option value="Qualified">Qualified Only</option>
                    <option value="Review">Review Backlog Only</option>
                    <option value="Suppressed">Suppressed Only</option>
                  </select>
                </div>

                {/* Min Fit Slider */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span className="section-header" style={{ fontSize: "10px" }}>Min Fit:</span>
                  <input
                    type="range"
                    min="50"
                    max="95"
                    value={minFitScore}
                    onChange={(e) => setMinFitScore(Number(e.target.value))}
                    style={{ width: "90px", accentColor: "var(--teal)" }}
                  />
                  <span className="font-mono" style={{ fontSize: "11px", fontWeight: 600, color: "var(--teal)", minWidth: "30px" }}>
                    {minFitScore}%
                  </span>
                </div>

                {/* Batch / Export Actions */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <button
                    onClick={() => handleExportCSV(false)}
                    className="btn-secondary"
                    style={{ fontSize: "11px", padding: "4px 10px", height: "28px" }}
                  >
                    <Download size={12} />
                    <span>Export CSV</span>
                  </button>
                </div>
              </div>

              {/* Bulk Actions Floating Bar (when rows selected) */}
              {selectedIds.size > 0 && (
                <div
                  style={{
                    backgroundColor: "var(--panel-elevated)",
                    border: "1px solid var(--teal)",
                    borderRadius: "var(--radius-sm)",
                    padding: "8px 14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    animation: "fadeIn 150ms ease",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span className="font-mono" style={{ fontSize: "12px", fontWeight: 600, color: "var(--teal)" }}>
                      {selectedIds.size} entities selected
                    </span>
                    <button
                      onClick={() => setSelectedIds(new Set())}
                      className="btn-ghost"
                      style={{ fontSize: "11px", padding: "2px 6px" }}
                    >
                      Clear selection
                    </button>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <button
                      onClick={() => handleBatchDisposition("Qualified")}
                      className="btn-primary"
                      style={{ fontSize: "11px", padding: "4px 10px" }}
                    >
                      <Check size={12} />
                      <span>Batch Approve (Qualified)</span>
                    </button>
                    <button
                      onClick={() => handleBatchDisposition("Suppressed")}
                      className="btn-secondary"
                      style={{ fontSize: "11px", padding: "4px 10px", color: "var(--red)" }}
                    >
                      <Shield size={12} />
                      <span>Batch Suppress</span>
                    </button>
                    <button
                      onClick={() => handleExportCSV(true)}
                      className="btn-secondary"
                      style={{ fontSize: "11px", padding: "4px 10px" }}
                    >
                      <Download size={12} />
                      <span>Export Selected CSV</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Dense Table */}
              <div
                className="panel"
                style={{
                  flex: 1,
                  overflow: "auto",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                  <thead style={{ position: "sticky", top: 0, backgroundColor: "var(--panel)", zIndex: 10 }}>
                    <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--muted)", textAlign: "left" }}>
                      <th style={{ padding: "8px 10px", width: "30px" }}>
                        <input
                          type="checkbox"
                          checked={selectedIds.size > 0 && selectedIds.size === filteredEntities.length}
                          onChange={handleSelectAll}
                          style={{ accentColor: "var(--teal)", cursor: "pointer" }}
                        />
                      </th>
                      <th
                        onClick={() => {
                          setSortField("name");
                          setSortAsc(!sortAsc);
                        }}
                        style={{ padding: "8px 10px", cursor: "pointer", fontWeight: 600 }}
                      >
                        ORGANIZATION & DOMAIN {sortField === "name" && (sortAsc ? "↑" : "↓")}
                      </th>
                      <th
                        onClick={() => {
                          setSortField("industry");
                          setSortAsc(!sortAsc);
                        }}
                        style={{ padding: "8px 10px", cursor: "pointer", fontWeight: 600 }}
                      >
                        INDUSTRY / GEO {sortField === "industry" && (sortAsc ? "↑" : "↓")}
                      </th>
                      <th style={{ padding: "8px 10px", fontWeight: 600 }}>DISPOSITION</th>
                      <th
                        onClick={() => {
                          setSortField("fitScore");
                          setSortAsc(!sortAsc);
                        }}
                        style={{ padding: "8px 10px", cursor: "pointer", fontWeight: 600 }}
                      >
                        FIT SCORE {sortField === "fitScore" && (sortAsc ? "↑" : "↓")}
                      </th>
                      <th style={{ padding: "8px 10px", fontWeight: 600 }}>ACTIONABLE CONTACT</th>
                      <th style={{ padding: "8px 10px", fontWeight: 600 }}>PROVENANCE</th>
                      <th style={{ padding: "8px 10px", textAlign: "right", fontWeight: 600 }}>DOSSIER</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEntities.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ padding: "40px", textAlign: "center", color: "var(--muted)" }}>
                          No entities match the current query and fit score threshold.
                        </td>
                      </tr>
                    ) : (
                      filteredEntities.map((ent) => {
                        const isSelected = selectedIds.has(ent.id);
                        return (
                          <tr
                            key={ent.id}
                            style={{
                              borderBottom: "1px solid var(--border)",
                              backgroundColor: isSelected ? "rgba(47, 214, 163, 0.04)" : "transparent",
                              cursor: "pointer",
                            }}
                            className="table-row-hover"
                            onClick={() => handleOpenDossier(ent)}
                          >
                            <td
                              style={{ padding: "8px 10px" }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleSelect(ent.id);
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {}}
                                style={{ accentColor: "var(--teal)", cursor: "pointer" }}
                              />
                            </td>
                            <td style={{ padding: "8px 10px" }}>
                              <div style={{ fontWeight: 600, color: "var(--text)" }}>{ent.name}</div>
                              <div
                                className="font-mono"
                                style={{ fontSize: "11px", color: "var(--muted)", display: "flex", alignItems: "center", gap: "4px" }}
                              >
                                <span>{ent.domain}</span>
                                <ExternalLink size={10} style={{ opacity: 0.5 }} />
                              </div>
                            </td>
                            <td style={{ padding: "8px 10px" }}>
                              <div>{ent.industry}</div>
                              <div style={{ fontSize: "11px", color: "var(--muted)" }}>
                                {ent.city}, {ent.geo}
                              </div>
                            </td>
                            <td style={{ padding: "8px 10px" }}>
                              <span
                                className={
                                  ent.disposition === "Qualified"
                                    ? "badge-qualified"
                                    : ent.disposition === "Review"
                                    ? "badge-review"
                                    : "badge-suppressed"
                                }
                              >
                                {ent.disposition}
                              </span>
                            </td>
                            <td style={{ padding: "8px 10px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <span className="font-mono" style={{ fontWeight: 700, color: "var(--teal)" }}>
                                  {ent.fitScore}%
                                </span>
                                <div
                                  style={{
                                    width: "60px",
                                    height: "5px",
                                    backgroundColor: "rgba(255,255,255,0.08)",
                                    borderRadius: "3px",
                                    overflow: "hidden",
                                  }}
                                >
                                  <div
                                    style={{
                                      width: `${ent.fitScore}%`,
                                      height: "100%",
                                      backgroundColor: "var(--teal)",
                                    }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: "8px 10px" }}>
                              {ent.contacts[0] ? (
                                <div>
                                  <div className="font-mono" style={{ fontSize: "11px", color: "var(--text)" }}>
                                    {ent.contacts[0].value}
                                  </div>
                                  <div style={{ fontSize: "10px", color: "var(--teal)" }}>
                                    {ent.contacts[0].status}
                                  </div>
                                </div>
                              ) : (
                                <span style={{ fontSize: "11px", color: "var(--faint)" }}>No route published</span>
                              )}
                            </td>
                            <td style={{ padding: "8px 10px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                                <ShieldCheck size={13} style={{ color: "var(--teal)" }} />
                                <span
                                  className="font-mono"
                                  style={{ fontSize: "10px", color: "var(--muted)" }}
                                  title={ent.provenance[0]?.contentHash || ""}
                                >
                                  {(ent.provenance[0]?.contentHash || "").substring(0, 10)}...
                                </span>
                              </div>
                            </td>
                            <td style={{ padding: "8px 10px", textAlign: "right" }}>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenDossier(ent);
                                }}
                                className="btn-secondary"
                                style={{ fontSize: "10px", padding: "3px 8px" }}
                              >
                                Inspect
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table Footer Telemetry */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: "11px",
                  color: "var(--muted)",
                  padding: "0 4px",
                }}
              >
                <span>
                  Showing <strong style={{ color: "var(--text)" }}>{filteredEntities.length}</strong> of{" "}
                  {entities.length} total crawled organizations
                </span>
                <span className="font-mono">RFC 4180 Stamped • Cryptographic Provenance Anchored</span>
              </div>
            </div>
          )}

          {/* ================= VIEW 3: DISCOVERY RUNS ================= */}
          {activeTab === "discovery" && (
            <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h1 style={{ fontSize: "16px", fontWeight: 700 }}>Discovery Runs & Pipeline Telemetry</h1>
                  <p style={{ fontSize: "12px", color: "var(--muted)", marginTop: "2px" }}>
                    Automated staged pipeline: Crawl → Parse → Corroborate → Score → Qualify
                  </p>
                </div>
                <button
                  onClick={() => setShowScheduleModal(true)}
                  className="btn-primary"
                  style={{ fontSize: "11px" }}
                >
                  <Plus size={12} />
                  <span>Configure New Run</span>
                </button>
              </div>

              {/* Pipeline Stepper Card */}
              <div className="panel" style={{ padding: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <span className="section-header">Live Pipeline Execution Stepper</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span className="font-mono" style={{ fontSize: "11px", color: "var(--teal)" }}>
                      RUN #SH-2026-8942
                    </span>
                    <button
                      onClick={() => setIsRunning(!isRunning)}
                      className="btn-secondary"
                      style={{ fontSize: "10px", padding: "2px 8px" }}
                    >
                      {isRunning ? "Pause Pipeline" : "Resume Pipeline"}
                    </button>
                  </div>
                </div>

                {/* 5-Step Visual Stepper */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(5, 1fr)",
                    gap: "12px",
                    position: "relative",
                  }}
                >
                  {pipelineStages.map((stg, idx) => {
                    const isDone = idx < runStage;
                    const isCurrent = idx === runStage;
                    return (
                      <div
                        key={stg.label}
                        style={{
                          backgroundColor: isCurrent ? "var(--panel-hover)" : "var(--panel-elevated)",
                          border: isCurrent
                            ? "1px solid var(--teal)"
                            : isDone
                            ? "1px solid var(--teal-border)"
                            : "1px solid var(--border)",
                          borderRadius: "var(--radius-sm)",
                          padding: "12px",
                          position: "relative",
                          boxShadow: isCurrent ? "0 0 12px rgba(47, 214, 163, 0.15)" : "none",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span
                            className="font-mono"
                            style={{
                              fontSize: "10px",
                              color: isCurrent ? "var(--teal)" : isDone ? "var(--teal)" : "var(--faint)",
                              fontWeight: 700,
                            }}
                          >
                            STEP 0{idx + 1}
                          </span>
                          {isDone ? (
                            <CheckCircle2 size={13} style={{ color: "var(--teal)" }} />
                          ) : isCurrent ? (
                            <RefreshCw size={13} className="animate-spin" style={{ color: "var(--teal)" }} />
                          ) : (
                            <Clock size={13} style={{ color: "var(--faint)" }} />
                          )}
                        </div>
                        <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)", marginTop: "6px" }}>
                          {stg.label}
                        </div>
                        <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "2px" }}>
                          {stg.sub}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Streaming Log Console */}
              <div className="panel" style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className="section-header">Realtime Execution Stream (Stdout)</span>
                  <button
                    onClick={() =>
                      setLiveLogs((prev) => [
                        ...prev,
                        `[${new Date().toISOString().substring(11, 23)}] HEARTBEAT: Corroboration engine healthy. Latency 142ms.`,
                      ])
                    }
                    className="btn-secondary"
                    style={{ fontSize: "10px", padding: "2px 8px" }}
                  >
                    Emit Ping
                  </button>
                </div>

                <div
                  className="font-mono"
                  style={{
                    backgroundColor: "#050709",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-sm)",
                    padding: "12px",
                    height: "180px",
                    overflowY: "auto",
                    fontSize: "11px",
                    color: "var(--text)",
                    lineHeight: 1.6,
                  }}
                >
                  {liveLogs.map((log, idx) => (
                    <div key={idx} style={{ opacity: 0.9 }}>
                      {log}
                    </div>
                  ))}
                </div>
              </div>

              {/* Prior Discovery Runs Ledger */}
              <div className="panel" style={{ padding: "16px" }}>
                <span className="section-header" style={{ marginBottom: "12px", display: "block" }}>
                  Prior Executions Audit Log
                </span>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--muted)", textAlign: "left" }}>
                      <th style={{ padding: "6px 10px" }}>RUN ID</th>
                      <th style={{ padding: "6px 10px" }}>TARGET ICP</th>
                      <th style={{ padding: "6px 10px" }}>HARVESTED</th>
                      <th style={{ padding: "6px 10px" }}>QUALIFIED</th>
                      <th style={{ padding: "6px 10px" }}>STATUS</th>
                      <th style={{ padding: "6px 10px" }}>DURATION</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: "1px solid var(--border)" }}>
                      <td className="font-mono" style={{ padding: "8px 10px", color: "var(--teal)" }}>
                        #SH-2026-8942
                      </td>
                      <td style={{ padding: "8px 10px" }}>Enterprise Cloud & AI</td>
                      <td className="font-mono" style={{ padding: "8px 10px" }}>42 entities</td>
                      <td className="font-mono" style={{ padding: "8px 10px", color: "var(--teal)" }}>
                        28 verified
                      </td>
                      <td style={{ padding: "8px 10px" }}>
                        <span className="badge-qualified">ACTIVE</span>
                      </td>
                      <td className="font-mono" style={{ padding: "8px 10px", color: "var(--muted)" }}>
                        04m 12s
                      </td>
                    </tr>
                    <tr style={{ borderBottom: "1px solid var(--border)" }}>
                      <td className="font-mono" style={{ padding: "8px 10px", color: "var(--muted)" }}>
                        #SH-2026-8931
                      </td>
                      <td style={{ padding: "8px 10px" }}>Fintech & Payments Infrastructure</td>
                      <td className="font-mono" style={{ padding: "8px 10px" }}>36 entities</td>
                      <td className="font-mono" style={{ padding: "8px 10px", color: "var(--teal)" }}>
                        22 verified
                      </td>
                      <td style={{ padding: "8px 10px" }}>
                        <span className="badge-qualified">COMPLETED</span>
                      </td>
                      <td className="font-mono" style={{ padding: "8px 10px", color: "var(--muted)" }}>
                        12m 45s
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= VIEW 4: REVIEW BACKLOG ================= */}
          {activeTab === "review" && (
            <div style={{ padding: "20px", display: "flex", flexDirection: "column", height: "100%", gap: "14px" }}>
              {/* Backlog Header & Shortcuts Banner */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "10px",
                }}
              >
                <div>
                  <h1 style={{ fontSize: "16px", fontWeight: 700 }}>Review Backlog Speed-Queue</h1>
                  <p style={{ fontSize: "12px", color: "var(--muted)", marginTop: "2px" }}>
                    High-density adjudication queue. Item {reviewIndex + 1} of {reviewBacklogEntities.length}
                  </p>
                </div>

                {/* Keyboard Shortcut Cheatsheet */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    backgroundColor: "var(--panel-elevated)",
                    border: "1px solid var(--border)",
                    padding: "4px 10px",
                    borderRadius: "var(--radius-sm)",
                    fontSize: "11px",
                  }}
                >
                  <span style={{ color: "var(--muted)" }}>Shortcuts:</span>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <span>
                      <kbd className="font-mono" style={{ background: "rgba(255,255,255,0.1)", padding: "1px 4px", borderRadius: "2px" }}>
                        A
                      </kbd>{" "}
                      Approve
                    </span>
                    <span>
                      <kbd className="font-mono" style={{ background: "rgba(255,255,255,0.1)", padding: "1px 4px", borderRadius: "2px" }}>
                        R
                      </kbd>{" "}
                      Reject
                    </span>
                    <span>
                      <kbd className="font-mono" style={{ background: "rgba(255,255,255,0.1)", padding: "1px 4px", borderRadius: "2px" }}>
                        S
                      </kbd>{" "}
                      Suppress
                    </span>
                    <span>
                      <kbd className="font-mono" style={{ background: "rgba(255,255,255,0.1)", padding: "1px 4px", borderRadius: "2px" }}>
                        ←/→
                      </kbd>{" "}
                      Navigate
                    </span>
                  </div>
                </div>
              </div>

              {/* Main Split Review Interface */}
              {reviewBacklogEntities.length === 0 ? (
                <div
                  className="panel"
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "12px",
                  }}
                >
                  <CheckCircle2 size={36} style={{ color: "var(--teal)" }} />
                  <div style={{ fontSize: "15px", fontWeight: 600 }}>Review Queue Clear</div>
                  <div style={{ fontSize: "12px", color: "var(--muted)", maxWidth: "340px", textAlign: "center" }}>
                    All candidate leads have been evaluated or verified. Launch a new discovery run to harvest more.
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.1fr 1.3fr",
                    gap: "14px",
                    flex: 1,
                    minHeight: 0,
                  }}
                >
                  {/* Left Column: Target Profile & Factors */}
                  <div className="panel" style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px", overflowY: "auto" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <div>
                        <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--text)" }}>
                          {currentReviewEntity.name}
                        </div>
                        <div className="font-mono" style={{ fontSize: "12px", color: "var(--teal)" }}>
                          {currentReviewEntity.domain}
                        </div>
                      </div>
                      <span className="badge-review">NEEDS REVIEW</span>
                    </div>

                    <div
                      style={{
                        padding: "10px",
                        backgroundColor: "var(--panel-elevated)",
                        borderRadius: "var(--radius-sm)",
                        border: "1px solid var(--border)",
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "8px",
                        fontSize: "11px",
                      }}
                    >
                      <div>
                        <span style={{ color: "var(--muted)" }}>Industry:</span>{" "}
                        <strong>{currentReviewEntity.industry}</strong>
                      </div>
                      <div>
                        <span style={{ color: "var(--muted)" }}>Location:</span>{" "}
                        <strong>{currentReviewEntity.city}, {currentReviewEntity.geo}</strong>
                      </div>
                      <div>
                        <span style={{ color: "var(--muted)" }}>Fit Score:</span>{" "}
                        <strong className="font-mono" style={{ color: "var(--teal)" }}>{currentReviewEntity.fitScore}%</strong>
                      </div>
                      <div>
                        <span style={{ color: "var(--muted)" }}>Headcount:</span>{" "}
                        <strong>{currentReviewEntity.employeeRange}</strong>
                      </div>
                    </div>

                    {/* Published Contacts */}
                    <div>
                      <span className="section-header" style={{ marginBottom: "6px", display: "block" }}>
                        Extracted Contact Routes
                      </span>
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        {currentReviewEntity.contacts.map((c) => (
                          <div
                            key={c.id}
                            style={{
                              padding: "8px 10px",
                              backgroundColor: "var(--panel-elevated)",
                              border: "1px solid var(--border)",
                              borderRadius: "var(--radius-sm)",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <div>
                              <div className="font-mono" style={{ fontSize: "11px", color: "var(--text)" }}>
                                {c.value}
                              </div>
                              <div style={{ fontSize: "10px", color: "var(--muted)" }}>
                                {c.personName ? `${c.personName} • ${c.personTitle}` : "Role Route"}
                              </div>
                            </div>
                            <span
                              className="font-mono"
                              style={{
                                fontSize: "10px",
                                color: c.status === "Verified Route" ? "var(--teal)" : "var(--amber)",
                              }}
                            >
                              {c.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div style={{ marginTop: "auto", display: "flex", gap: "8px" }}>
                      <button
                        onClick={() => handleReviewAction("Qualified")}
                        className="btn-primary"
                        style={{ flex: 1, justifyContent: "center" }}
                      >
                        <Check size={14} />
                        <span>Approve (A)</span>
                      </button>
                      <button
                        onClick={() => handleReviewAction("Review")}
                        className="btn-secondary"
                        style={{ flex: 1, justifyContent: "center" }}
                      >
                        <RefreshCw size={14} />
                        <span>Skip (R)</span>
                      </button>
                      <button
                        onClick={() => handleReviewAction("Suppressed")}
                        className="btn-secondary"
                        style={{ flex: 1, justifyContent: "center", color: "var(--red)" }}
                      >
                        <Shield size={14} />
                        <span>Suppress (S)</span>
                      </button>
                    </div>
                  </div>

                  {/* Right Column: Corroboration Evidence & DOM Anchors */}
                  <div className="panel" style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px", overflowY: "auto" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span className="section-header">Corroboration Evidence & Provenance</span>
                      <span className="font-mono" style={{ fontSize: "10px", color: "var(--muted)" }}>
                        SHA-256 Stamped
                      </span>
                    </div>

                    {currentReviewEntity.provenance.map((pr) => (
                      <div
                        key={pr.id}
                        style={{
                          padding: "10px",
                          backgroundColor: "var(--panel-elevated)",
                          border: "1px solid var(--border)",
                          borderRadius: "var(--radius-sm)",
                          display: "flex",
                          flexDirection: "column",
                          gap: "6px",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span className="font-mono" style={{ fontSize: "11px", fontWeight: 600, color: "var(--teal)" }}>
                            CLAIM: {pr.field}
                          </span>
                          <span
                            className="font-mono"
                            style={{
                              fontSize: "9px",
                              backgroundColor: "rgba(255,255,255,0.06)",
                              padding: "1px 5px",
                              borderRadius: "3px",
                            }}
                          >
                            {pr.status}
                          </span>
                        </div>

                        <div className="font-mono" style={{ fontSize: "10px", color: "var(--muted)" }}>
                          Source: {pr.sourceUrl}
                        </div>

                        <div
                          style={{
                            fontSize: "11px",
                            padding: "8px",
                            backgroundColor: "#080B0E",
                            borderRadius: "4px",
                            border: "1px solid rgba(255,255,255,0.05)",
                            fontStyle: "italic",
                          }}
                        >
                          "{pr.excerpt}"
                        </div>

                        <div className="font-mono" style={{ fontSize: "9px", color: "var(--faint)" }}>
                          DOM Locator: <code>{pr.domLocator}</code>
                          <br />
                          Content Hash: <code>{pr.contentHash}</code>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= VIEW 5: ICP ARCHITECT ================= */}
          {activeTab === "icp" && (
            <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <h1 style={{ fontSize: "16px", fontWeight: 700 }}>Ideal Customer Profile (ICP) Architect</h1>
                <p style={{ fontSize: "12px", color: "var(--muted)", marginTop: "2px" }}>
                  Define weighted scoring rules, industry taxonomy, tech stack criteria, and exclusion penalties.
                </p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "16px" }}>
                {/* Left: Criteria Weight Sliders */}
                <div className="panel" style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
                  <span className="section-header">Scoring Criteria Weights</span>

                  {/* Industry Weight */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                      <span style={{ fontSize: "12px", fontWeight: 600 }}>Industry Alignment</span>
                      <span className="font-mono" style={{ fontSize: "12px", color: "var(--teal)" }}>
                        {icpWeights.industry}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={icpWeights.industry}
                      onChange={(e) => setIcpWeights({ ...icpWeights, industry: Number(e.target.value) })}
                      style={{ width: "100%", accentColor: "var(--teal)" }}
                    />
                    <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "4px" }}>
                      Active: {icpIndustries.join(", ")}
                    </div>
                  </div>

                  {/* Geography Weight */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                      <span style={{ fontSize: "12px", fontWeight: 600 }}>Geography Target</span>
                      <span className="font-mono" style={{ fontSize: "12px", color: "var(--teal)" }}>
                        {icpWeights.geography}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={icpWeights.geography}
                      onChange={(e) => setIcpWeights({ ...icpWeights, geography: Number(e.target.value) })}
                      style={{ width: "100%", accentColor: "var(--teal)" }}
                    />
                    <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "4px" }}>
                      Active: {icpGeos.join(", ")}
                    </div>
                  </div>

                  {/* Headcount Weight */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                      <span style={{ fontSize: "12px", fontWeight: 600 }}>Headcount Bracket (50-2,000 employees)</span>
                      <span className="font-mono" style={{ fontSize: "12px", color: "var(--teal)" }}>
                        {icpWeights.headcount}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={icpWeights.headcount}
                      onChange={(e) => setIcpWeights({ ...icpWeights, headcount: Number(e.target.value) })}
                      style={{ width: "100%", accentColor: "var(--teal)" }}
                    />
                  </div>

                  {/* Tech Stack Keywords */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                      <span style={{ fontSize: "12px", fontWeight: 600 }}>Tech Stack Signals</span>
                      <span className="font-mono" style={{ fontSize: "12px", color: "var(--teal)" }}>
                        {icpWeights.techStack}%
                      </span>
                    </div>
                    <input
                      type="text"
                      value={icpTechKeywords}
                      onChange={(e) => setIcpTechKeywords(e.target.value)}
                      className="input-base"
                      style={{ width: "100%", fontSize: "11px" }}
                    />
                  </div>

                  {/* Exclusions */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                      <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--red)" }}>
                        Disqualification Exclusions
                      </span>
                      <span className="font-mono" style={{ fontSize: "12px", color: "var(--red)" }}>
                        -{icpWeights.exclusionPenalty}%
                      </span>
                    </div>
                    <input
                      type="text"
                      value={icpExclusions}
                      onChange={(e) => setIcpExclusions(e.target.value)}
                      className="input-base"
                      style={{ width: "100%", fontSize: "11px" }}
                    />
                  </div>
                </div>

                {/* Right: Live Projected Match Preview */}
                <div className="panel" style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "14px" }}>
                  <span className="section-header">Live Projected Match Simulation</span>

                  <div
                    style={{
                      padding: "14px",
                      backgroundColor: "var(--panel-elevated)",
                      border: "1px solid var(--teal-border)",
                      borderRadius: "var(--radius-sm)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <span style={{ fontSize: "12px", color: "var(--muted)" }}>Projected Qualifying Pool</span>
                      <span className="font-mono" style={{ fontSize: "24px", fontWeight: 700, color: "var(--teal)" }}>
                        {icpProjectedMatches.length} <span style={{ fontSize: "12px", color: "var(--muted)" }}>/ {entities.length}</span>
                      </span>
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "4px" }}>
                      Yield Rate: {Math.round((icpProjectedMatches.length / entities.length) * 100)}% of harvested corpus
                    </div>
                  </div>

                  <div>
                    <span className="section-header" style={{ marginBottom: "8px", display: "block" }}>
                      Top Projected Entity Matches
                    </span>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {icpProjectedMatches.slice(0, 4).map((m) => (
                        <div
                          key={m.id}
                          style={{
                            padding: "8px 10px",
                            backgroundColor: "var(--panel-elevated)",
                            border: "1px solid var(--border)",
                            borderRadius: "var(--radius-sm)",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <div>
                            <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text)" }}>{m.name}</div>
                            <div className="font-mono" style={{ fontSize: "10px", color: "var(--muted)" }}>
                              {m.industry}
                            </div>
                          </div>
                          <span className="font-mono" style={{ fontSize: "12px", fontWeight: 700, color: "var(--teal)" }}>
                            {m.fitScore}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => showToast("ICP Architecture profile saved and deployed to engine.")}
                    className="btn-primary"
                    style={{ marginTop: "auto", justifyContent: "center" }}
                  >
                    <span>Save & Deploy ICP Architecture</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================= VIEW 6: SUPPRESSIONS ================= */}
          {activeTab === "suppressions" && (
            <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h1 style={{ fontSize: "16px", fontWeight: 700 }}>Compliance & Suppression Ledger</h1>
                  <p style={{ fontSize: "12px", color: "var(--muted)", marginTop: "2px" }}>
                    Enforced do-not-contact domains, invalid role routes, and regulatory exclusion lists.
                  </p>
                </div>
              </div>

              {/* Add Suppression Inline Form */}
              <div className="panel" style={{ padding: "14px", display: "flex", gap: "10px", alignItems: "center" }}>
                <input
                  type="text"
                  placeholder="Target domain or email address (e.g. competitor.com or optout@org.com)..."
                  value={newSuppressionTarget}
                  onChange={(e) => setNewSuppressionTarget(e.target.value)}
                  className="input-base"
                  style={{ flex: 1 }}
                />
                <input
                  type="text"
                  placeholder="Compliance rationale / audit note..."
                  value={newSuppressionReason}
                  onChange={(e) => setNewSuppressionReason(e.target.value)}
                  className="input-base"
                  style={{ flex: 1 }}
                />
                <button onClick={handleAddSuppression} className="btn-primary" style={{ whiteSpace: "nowrap" }}>
                  <Plus size={12} />
                  <span>Enforce Suppression</span>
                </button>
              </div>

              {/* Suppressions Table */}
              <div className="panel" style={{ padding: "16px" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--muted)", textAlign: "left" }}>
                      <th style={{ padding: "6px 10px" }}>TARGET ARTIFACT</th>
                      <th style={{ padding: "6px 10px" }}>TYPE</th>
                      <th style={{ padding: "6px 10px" }}>REASON / RATIONALE</th>
                      <th style={{ padding: "6px 10px" }}>RECORDED TIMESTAMP</th>
                      <th style={{ padding: "6px 10px", textAlign: "right" }}>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {suppressedRecords.map((r) => (
                      <tr key={r.id} style={{ borderBottom: "1px solid var(--border)" }}>
                        <td className="font-mono" style={{ padding: "8px 10px", fontWeight: 600, color: "var(--text)" }}>
                          {r.target}
                        </td>
                        <td style={{ padding: "8px 10px" }}>
                          <span
                            className="font-mono"
                            style={{
                              fontSize: "10px",
                              backgroundColor: "rgba(255,255,255,0.06)",
                              padding: "2px 6px",
                              borderRadius: "3px",
                            }}
                          >
                            {r.type.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: "8px 10px", color: "var(--muted)" }}>{r.reason}</td>
                        <td className="font-mono" style={{ padding: "8px 10px", fontSize: "11px", color: "var(--muted)" }}>
                          {r.timestamp}
                        </td>
                        <td style={{ padding: "8px 10px", textAlign: "right" }}>
                          <button
                            onClick={() => handleRestoreSuppression(r.id, r.target)}
                            className="btn-secondary"
                            style={{ fontSize: "10px", padding: "2px 8px" }}
                          >
                            Restore Target
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= VIEW 7: AUDITABLE EXPORTS ================= */}
          {activeTab === "exports" && (
            <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h1 style={{ fontSize: "16px", fontWeight: 700 }}>Auditable Exports & Cryptographic Ledgers</h1>
                  <p style={{ fontSize: "12px", color: "var(--muted)", marginTop: "2px" }}>
                    RFC 4180 CSV generation with column picker and immutable SHA-256 audit log.
                  </p>
                </div>
                <button onClick={() => handleExportCSV(false)} className="btn-primary">
                  <Download size={13} />
                  <span>Download Qualified CSV</span>
                </button>
              </div>

              {/* Column Picker Card */}
              <div className="panel" style={{ padding: "16px" }}>
                <span className="section-header" style={{ marginBottom: "12px", display: "block" }}>
                  Export Column Selection
                </span>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
                  {Object.entries(exportColumns).map(([col, checked]) => (
                    <label
                      key={col}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        fontSize: "12px",
                        cursor: "pointer",
                        padding: "6px 8px",
                        backgroundColor: "var(--panel-elevated)",
                        borderRadius: "var(--radius-sm)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => setExportColumns({ ...exportColumns, [col]: !checked })}
                        style={{ accentColor: "var(--teal)" }}
                      />
                      <span className="font-mono">{col}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Immutable Audit Log Table */}
              <div className="panel" style={{ padding: "16px" }}>
                <span className="section-header" style={{ marginBottom: "12px", display: "block" }}>
                  Immutable Export Audit Trail
                </span>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--muted)", textAlign: "left" }}>
                      <th style={{ padding: "6px 10px" }}>ID</th>
                      <th style={{ padding: "6px 10px" }}>ACTOR</th>
                      <th style={{ padding: "6px 10px" }}>TIMESTAMP</th>
                      <th style={{ padding: "6px 10px" }}>ROWS</th>
                      <th style={{ padding: "6px 10px" }}>FILTERS APPLIED</th>
                      <th style={{ padding: "6px 10px" }}>SHA-256 HASH DIGEST</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log) => (
                      <tr key={log.id} style={{ borderBottom: "1px solid var(--border)" }}>
                        <td className="font-mono" style={{ padding: "8px 10px", color: "var(--teal)" }}>
                          {log.id}
                        </td>
                        <td className="font-mono" style={{ padding: "8px 10px" }}>
                          {log.actor}
                        </td>
                        <td className="font-mono" style={{ padding: "8px 10px", color: "var(--muted)" }}>
                          {log.timestamp}
                        </td>
                        <td className="font-mono" style={{ padding: "8px 10px" }}>
                          {log.rowCount} rows
                        </td>
                        <td style={{ padding: "8px 10px", color: "var(--muted)" }}>{log.filtersUsed}</td>
                        <td className="font-mono" style={{ padding: "8px 10px", fontSize: "10px", color: "var(--faint)" }}>
                          {log.hashDigest}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= VIEW 8: SOURCE POLICIES ================= */}
          {activeTab === "sources" && (
            <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <h1 style={{ fontSize: "16px", fontWeight: 700 }}>Source Policies & Harvester Health</h1>
                <p style={{ fontSize: "12px", color: "var(--muted)", marginTop: "2px" }}>
                  Configure feed provenance weighting, rate throttles, and operational uptime health.
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {sourcePolicies.map((sp) => (
                  <div
                    key={sp.id}
                    className="panel"
                    style={{
                      padding: "16px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "16px",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)" }}>
                          {sp.name}
                        </span>
                        <span
                          className="font-mono"
                          style={{
                            fontSize: "10px",
                            padding: "1px 6px",
                            borderRadius: "3px",
                            backgroundColor: sp.enabled ? "var(--teal-subtle)" : "rgba(255,255,255,0.06)",
                            color: sp.enabled ? "var(--teal)" : "var(--faint)",
                          }}
                        >
                          {sp.enabled ? "ACTIVE" : "PAUSED"}
                        </span>
                      </div>
                      <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "2px" }}>
                        {sp.type}
                      </div>
                    </div>

                    {/* Weight slider */}
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", width: "180px" }}>
                      <span className="font-mono" style={{ fontSize: "11px", color: "var(--muted)" }}>
                        Weight:
                      </span>
                      <input
                        type="range"
                        min="10"
                        max="100"
                        value={sp.provenanceWeight * 100}
                        onChange={(e) => {
                          const val = Number(e.target.value) / 100;
                          setSourcePolicies((prev) =>
                            prev.map((s) => (s.id === sp.id ? { ...s, provenanceWeight: val } : s))
                          );
                        }}
                        style={{ flex: 1, accentColor: "var(--teal)" }}
                      />
                      <span className="font-mono" style={{ fontSize: "11px", color: "var(--teal)", minWidth: "28px" }}>
                        {sp.provenanceWeight.toFixed(2)}x
                      </span>
                    </div>

                    {/* Health metrics */}
                    <div className="font-mono" style={{ fontSize: "11px", color: "var(--muted)", minWidth: "180px" }}>
                      <div>Latency: {sp.latencyMs}ms</div>
                      <div>Uptime: {sp.uptimePercent}%</div>
                      <div>Last sync: {sp.lastHarvest}</div>
                    </div>

                    {/* Toggle button */}
                    <button
                      onClick={() => {
                        setSourcePolicies((prev) =>
                          prev.map((s) => (s.id === sp.id ? { ...s, enabled: !s.enabled } : s))
                        );
                        showToast(`Source '${sp.name}' ${sp.enabled ? "paused" : "enabled"}`);
                      }}
                      className="btn-secondary"
                      style={{ fontSize: "11px", padding: "4px 10px" }}
                    >
                      {sp.enabled ? "Pause Feed" : "Enable Feed"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= VIEW 9: ANALYTICS ================= */}
          {activeTab === "analytics" && (
            <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <h1 style={{ fontSize: "16px", fontWeight: 700 }}>Conversion Funnel & Signal Analytics</h1>
                <p style={{ fontSize: "12px", color: "var(--muted)", marginTop: "2px" }}>
                  End-to-end intelligence funnel from raw crawl discovery to verified outreach export.
                </p>
              </div>

              {/* Conversion Funnel */}
              <div className="panel" style={{ padding: "18px" }}>
                <span className="section-header" style={{ marginBottom: "14px", display: "block" }}>
                  Corpus Conversion Funnel
                </span>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                      <span>1. Discovered Entities (Raw Ingest)</span>
                      <span className="font-mono" style={{ fontWeight: 600 }}>1,280</span>
                    </div>
                    <div style={{ height: "8px", backgroundColor: "rgba(255,255,255,0.08)", borderRadius: "4px", marginTop: "4px", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: "100%", backgroundColor: "var(--muted)" }} />
                    </div>
                  </div>

                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                      <span>2. Reviewed & Corroborated</span>
                      <span className="font-mono" style={{ fontWeight: 600 }}>840 (65.6%)</span>
                    </div>
                    <div style={{ height: "8px", backgroundColor: "rgba(255,255,255,0.08)", borderRadius: "4px", marginTop: "4px", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: "65.6%", backgroundColor: "#64748B" }} />
                    </div>
                  </div>

                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                      <span>3. Qualified Leads (ICP Passed)</span>
                      <span className="font-mono" style={{ fontWeight: 600, color: "var(--teal)" }}>412 (32.1%)</span>
                    </div>
                    <div style={{ height: "8px", backgroundColor: "rgba(255,255,255,0.08)", borderRadius: "4px", marginTop: "4px", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: "32.1%", backgroundColor: "var(--teal)" }} />
                    </div>
                  </div>

                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                      <span>4. Exported to Outreach CRM</span>
                      <span className="font-mono" style={{ fontWeight: 600, color: "var(--teal)" }}>186 (14.5%)</span>
                    </div>
                    <div style={{ height: "8px", backgroundColor: "rgba(255,255,255,0.08)", borderRadius: "4px", marginTop: "4px", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: "14.5%", backgroundColor: "var(--teal)" }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Source Performance Breakdown */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div className="panel" style={{ padding: "16px" }}>
                  <span className="section-header" style={{ marginBottom: "12px", display: "block" }}>
                    Source Yield Distribution
                  </span>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>Official Corporate Registries</span>
                      <span className="font-mono">48.2%</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>DNS & Direct Mailbox Probers</span>
                      <span className="font-mono">28.4%</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>Semantic Web Harvester</span>
                      <span className="font-mono">16.1%</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>Developer & Job Postings</span>
                      <span className="font-mono">7.3%</span>
                    </div>
                  </div>
                </div>

                <div className="panel" style={{ padding: "16px" }}>
                  <span className="section-header" style={{ marginBottom: "12px", display: "block" }}>
                    Verification Confidence Distribution
                  </span>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--teal)" }}>High Confidence (&gt;90%)</span>
                      <span className="font-mono">68.4%</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--amber)" }}>Medium Confidence (70-89%)</span>
                      <span className="font-mono">24.2%</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--red)" }}>Uncorroborated (&lt;70%)</span>
                      <span className="font-mono">7.4%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* ================= RIGHT SLIDE-IN DOSSIER DRAWER ================= */}
        {isDossierOpen && selectedEntity && (
          <aside
            style={{
              width: "420px",
              backgroundColor: "var(--panel)",
              borderLeft: "1px solid var(--border)",
              display: "flex",
              flexDirection: "column",
              overflowY: "auto",
              flexShrink: 0,
              zIndex: 50,
              animation: "slideInRight 180ms cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            {/* Dossier Header */}
            <div
              style={{
                padding: "16px",
                borderBottom: "1px solid var(--border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                backgroundColor: "var(--panel-elevated)",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <h2 style={{ fontSize: "15px", fontWeight: 700, color: "var(--text)" }}>
                    {selectedEntity.name}
                  </h2>
                  <span
                    className={
                      selectedEntity.disposition === "Qualified"
                        ? "badge-qualified"
                        : selectedEntity.disposition === "Review"
                        ? "badge-review"
                        : "badge-suppressed"
                    }
                  >
                    {selectedEntity.disposition}
                  </span>
                </div>
                <div
                  className="font-mono"
                  style={{
                    fontSize: "11px",
                    color: "var(--teal)",
                    marginTop: "3px",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <span>{selectedEntity.domain}</span>
                  <ExternalLink size={10} />
                </div>
                <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "2px" }}>
                  {selectedEntity.city}, {selectedEntity.geo} • {selectedEntity.employeeRange} staff
                </div>
              </div>

              <button
                onClick={() => setIsDossierOpen(false)}
                className="btn-ghost"
                style={{ padding: "4px" }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Dossier Body */}
            <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Intelligence Confidence Matrix */}
              <div
                style={{
                  padding: "14px",
                  backgroundColor: "var(--panel-elevated)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-sm)",
                }}
              >
                <span className="section-header" style={{ marginBottom: "12px", display: "block" }}>
                  Intelligence Confidence Matrix
                </span>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", justifyItems: "center" }}>
                  <ConfidenceRing value={selectedEntity.fitScore} label="ICP Fit Match" />
                  <ConfidenceRing value={selectedEntity.identityConfidence} label="Identity Corroboration" />
                  <ConfidenceRing value={selectedEntity.contactConfidence} label="Contact Confidence" />
                  <ConfidenceRing value={selectedEntity.evidenceCompleteness} label="Evidence Completeness" />
                </div>
              </div>

              {/* 2.5D Relationship Mini-Graph */}
              <RelationshipGraph entity={selectedEntity} />

              {/* Explainability Factors */}
              <div>
                <span className="section-header" style={{ marginBottom: "8px", display: "block" }}>
                  Explainability Factors
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {selectedEntity.positiveFactors.map((fact, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: "8px 10px",
                        backgroundColor: "var(--panel-elevated)",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--radius-sm)",
                        fontSize: "11px",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "8px",
                      }}
                    >
                      <CheckCircle2 size={13} style={{ color: "var(--teal)", marginTop: "2px", flexShrink: 0 }} />
                      <span style={{ color: "var(--text)" }}>{fact}</span>
                    </div>
                  ))}
                  {selectedEntity.negativeFactors.map((fact, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: "8px 10px",
                        backgroundColor: "var(--panel-elevated)",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--radius-sm)",
                        fontSize: "11px",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "8px",
                      }}
                    >
                      <AlertTriangle size={13} style={{ color: "var(--amber)", marginTop: "2px", flexShrink: 0 }} />
                      <span style={{ color: "var(--muted)" }}>{fact}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Published Contact Routes */}
              <div>
                <span className="section-header" style={{ marginBottom: "8px", display: "block" }}>
                  Published Contact Routes
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {selectedEntity.contacts.map((c) => (
                    <div
                      key={c.id}
                      style={{
                        padding: "10px",
                        backgroundColor: "var(--panel-elevated)",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--radius-sm)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          {c.type === "email" ? (
                            <Mail size={13} style={{ color: "var(--teal)" }} />
                          ) : (
                            <Phone size={13} style={{ color: "var(--teal)" }} />
                          )}
                          <span className="font-mono" style={{ fontSize: "11px", fontWeight: 600, color: "var(--text)" }}>
                            {c.value}
                          </span>
                        </div>
                        <span
                          className="font-mono"
                          style={{
                            fontSize: "10px",
                            color: c.status === "Verified Route" ? "var(--teal)" : "var(--amber)",
                          }}
                        >
                          {c.status}
                        </span>
                      </div>
                      {c.personName && (
                        <div style={{ fontSize: "11px", color: "var(--muted)" }}>
                          {c.personName} • {c.personTitle}
                        </div>
                      )}
                      <div style={{ fontSize: "10px", color: "var(--faint)", lineHeight: 1.3 }}>
                        {c.notes.join(" • ")}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Provenance Timeline */}
              <div>
                <span className="section-header" style={{ marginBottom: "8px", display: "block" }}>
                  Provenance Timeline & Content Hashes
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {selectedEntity.provenance.map((pr) => (
                    <div
                      key={pr.id}
                      style={{
                        padding: "10px",
                        backgroundColor: "var(--panel-elevated)",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--radius-sm)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span className="font-mono" style={{ fontSize: "10px", fontWeight: 600, color: "var(--teal)" }}>
                          CLAIM: {pr.field}
                        </span>
                        <span className="font-mono" style={{ fontSize: "9px", color: "var(--muted)" }}>
                          {pr.observedAt.substring(0, 10)}
                        </span>
                      </div>
                      <div className="font-mono" style={{ fontSize: "10px", color: "var(--muted)" }}>
                        {pr.sourceUrl}
                      </div>
                      <div
                        style={{
                          fontSize: "10px",
                          fontStyle: "italic",
                          padding: "6px",
                          backgroundColor: "#080B0E",
                          borderRadius: "4px",
                        }}
                      >
                        "{pr.excerpt}"
                      </div>
                      <div className="font-mono" style={{ fontSize: "9px", color: "var(--faint)" }}>
                        SHA-256: {pr.contentHash.substring(0, 24)}...
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dossier Bottom Action Bar */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  marginTop: "auto",
                  paddingTop: "12px",
                  borderTop: "1px solid var(--border)",
                }}
              >
                <button
                  onClick={() => handleCopyOutreachBrief(selectedEntity)}
                  className="btn-primary"
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  <Copy size={13} />
                  <span>Copy Outreach Brief</span>
                </button>

                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => {
                      setEntities((prev) =>
                        prev.map((e) =>
                          e.id === selectedEntity.id ? { ...e, disposition: "Qualified" } : e
                        )
                      );
                      setSelectedEntity({ ...selectedEntity, disposition: "Qualified" });
                      showToast(`Marked ${selectedEntity.name} as Qualified.`);
                    }}
                    className="btn-secondary"
                    style={{ flex: 1, justifyContent: "center" }}
                  >
                    <Check size={12} />
                    <span>Approve</span>
                  </button>
                  <button
                    onClick={() => {
                      setEntities((prev) =>
                        prev.map((e) =>
                          e.id === selectedEntity.id ? { ...e, disposition: "Suppressed" } : e
                        )
                      );
                      setSelectedEntity({ ...selectedEntity, disposition: "Suppressed" });
                      showToast(`Suppressed ${selectedEntity.name}.`);
                    }}
                    className="btn-secondary"
                    style={{ flex: 1, justifyContent: "center", color: "var(--red)" }}
                  >
                    <Shield size={12} />
                    <span>Suppress</span>
                  </button>
                </div>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* ================= COMMAND PALETTE (⌘K) ================= */}
      {showCommandK && (
        <div
          onClick={() => setShowCommandK(false)}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(2px)",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            paddingTop: "80px",
            zIndex: 9999,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "560px",
              backgroundColor: "var(--panel)",
              border: "1px solid var(--border-strong)",
              borderRadius: "var(--radius)",
              boxShadow: "0 16px 40px rgba(0, 0, 0, 0.8)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "12px 16px",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <Search size={16} style={{ color: "var(--teal)" }} />
              <input
                type="text"
                autoFocus
                placeholder="Search views, entities, domains, or commands..."
                value={commandQuery}
                onChange={(e) => setCommandQuery(e.target.value)}
                style={{
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: "var(--text)",
                  fontSize: "13px",
                  flex: 1,
                  fontFamily: "var(--font-ui)",
                }}
              />
              <kbd
                className="font-mono"
                style={{
                  fontSize: "10px",
                  padding: "1px 5px",
                  backgroundColor: "rgba(255,255,255,0.08)",
                  borderRadius: "3px",
                  color: "var(--muted)",
                }}
              >
                ESC
              </kbd>
            </div>

            <div style={{ maxHeight: "360px", overflowY: "auto", padding: "8px" }}>
              <div className="section-header" style={{ padding: "6px 8px 4px 8px" }}>
                Navigation & Views
              </div>
              {[
                { label: "Overview & 3D Globe", tab: "overview" },
                { label: "Prospects Ledger", tab: "prospects" },
                { label: "Discovery Runs Pipeline", tab: "discovery" },
                { label: "Review Backlog Speed-Queue", tab: "review" },
                { label: "ICP Architect Builder", tab: "icp" },
                { label: "Auditable CSV Exports", tab: "exports" },
                { label: "Compliance & Suppressions", tab: "suppressions" },
                { label: "Source Policies", tab: "sources" },
                { label: "Signal Analytics", tab: "analytics" },
              ]
                .filter((i) => i.label.toLowerCase().includes(commandQuery.toLowerCase()))
                .map((item) => (
                  <button
                    key={item.tab}
                    onClick={() => {
                      setActiveTab(item.tab as ViewTab);
                      setShowCommandK(false);
                    }}
                    className="btn-ghost"
                    style={{ width: "100%", justifyContent: "space-between", padding: "8px 10px" }}
                  >
                    <span>{item.label}</span>
                    <span className="font-mono" style={{ fontSize: "10px", color: "var(--muted)" }}>
                      Jump
                    </span>
                  </button>
                ))}

              <div className="section-header" style={{ padding: "10px 8px 4px 8px" }}>
                Matching Entities
              </div>
              {entities
                .filter((e) =>
                  e.name.toLowerCase().includes(commandQuery.toLowerCase()) ||
                  e.domain.toLowerCase().includes(commandQuery.toLowerCase())
                )
                .slice(0, 5)
                .map((ent) => (
                  <button
                    key={ent.id}
                    onClick={() => {
                      handleOpenDossier(ent);
                      setShowCommandK(false);
                    }}
                    className="btn-ghost"
                    style={{ width: "100%", justifyContent: "space-between", padding: "8px 10px" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <Building2 size={13} style={{ color: "var(--teal)" }} />
                      <span style={{ fontWeight: 600 }}>{ent.name}</span>
                      <span className="font-mono" style={{ fontSize: "11px", color: "var(--muted)" }}>
                        ({ent.domain})
                      </span>
                    </div>
                    <span className="font-mono" style={{ fontSize: "11px", color: "var(--teal)" }}>
                      Fit {ent.fitScore}%
                    </span>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: SCHEDULE DISCOVERY RUN ================= */}
      {showScheduleModal && (
        <div
          onClick={() => setShowScheduleModal(false)}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(2px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="panel"
            style={{
              width: "480px",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
              backgroundColor: "var(--panel)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: "15px", fontWeight: 700 }}>Launch Discovery Run</h2>
              <button onClick={() => setShowScheduleModal(false)} className="btn-ghost" style={{ padding: "4px" }}>
                <X size={15} />
              </button>
            </div>

            <div style={{ fontSize: "12px", color: "var(--muted)" }}>
              Initialize autonomous SSRF-safe crawling across official corporate registries, DNS lookups, and web endpoints.
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "11px", fontWeight: 600, color: "var(--text)" }}>Target ICP Architecture:</label>
              <select className="input-base" defaultValue="b2b_cloud">
                <option value="b2b_cloud">B2B Enterprise Cloud & AI Infrastructure (Active)</option>
                <option value="fintech">Fintech & Payments Infrastructure</option>
                <option value="cyber">Cybersecurity & Zero Trust Architecture</option>
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "11px", fontWeight: 600, color: "var(--text)" }}>Seed Domains / URLs (Optional):</label>
              <textarea
                rows={3}
                placeholder="https://example.com, https://targetdomain.org..."
                className="input-base"
                style={{ resize: "none" }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px", color: "var(--muted)" }}>
              <span>Concurrency: 8 workers</span>
              <span>Rate Limit: 2 req/sec per origin</span>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "8px" }}>
              <button onClick={() => setShowScheduleModal(false)} className="btn-secondary">
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowScheduleModal(false);
                  setIsRunning(true);
                  setRunStage(0);
                  setRunProgress(10);
                  showToast("Autonomous Discovery Run dispatched successfully.");
                }}
                className="btn-primary"
              >
                <Play size={12} fill="currentColor" />
                <span>Execute Run Now</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ================= REMOTION 3D AD CINEMA MODAL ================= */}
      <AdCinemaModal isOpen={showAdModal} onClose={() => setShowAdModal(false)} />
    </div>
  );
}

export default App;
