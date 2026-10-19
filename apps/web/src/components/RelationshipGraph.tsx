import React from "react";
import type { ProspectEntity } from "../data/mockData";

interface RelationshipGraphProps {
  entity: ProspectEntity;
}

export const RelationshipGraph: React.FC<RelationshipGraphProps> = ({ entity }) => {
  const primaryContact = entity.contacts[0];
  const primarySource = entity.provenance[0];

  return (
    <div
      className="double-bezel"
      style={{
        position: "relative",
      }}
    >
      <div
        className="double-bezel-inner"
        style={{
          padding: "16px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "var(--cyan)",
                boxShadow: "0 0 8px var(--cyan)",
              }}
            />
            <span className="section-header">VERIFIED GRAPH CORROBORATION MATRIX</span>
          </div>
          <span className="eyebrow-pill" style={{ color: "var(--teal)", borderColor: "var(--teal-border)" }}>
            Depth: 4 Tiers • Cryptographic Trail
          </span>
        </div>

        <div
          style={{
            position: "relative",
            minHeight: "100px",
          }}
        >
          {/* Glowing Synapse Connection Line */}
          <svg
            style={{
              position: "absolute",
              top: "50%",
              left: "40px",
              right: "40px",
              width: "calc(100% - 80px)",
              height: "4px",
              transform: "translateY(-50%)",
              zIndex: 0,
              pointerEvents: "none",
            }}
          >
            <line
              x1="0"
              y1="2"
              x2="100%"
              y2="2"
              stroke="rgba(0, 240, 168, 0.2)"
              strokeWidth="2"
              strokeDasharray="4 4"
            />
          </svg>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "12px",
              position: "relative",
              alignItems: "center",
              zIndex: 1,
            }}
          >
            {/* Tier 1: Target Organization Node */}
            <div
              style={{
                padding: "12px 14px",
                background: "rgba(16, 24, 38, 0.95)",
                border: "1px solid rgba(0, 240, 168, 0.4)",
                borderRadius: "var(--radius-sm)",
                boxShadow: "0 8px 24px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.12), 0 0 16px rgba(0, 240, 168, 0.1)",
                transition: "all 180ms var(--ease-spring)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "9px", textTransform: "uppercase", color: "var(--muted)", fontWeight: 700, letterSpacing: "0.1em" }}>
                  TARGET ENTITY
                </span>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--mint)", boxShadow: "0 0 6px var(--mint)" }} />
              </div>
              <div className="font-brand" style={{ fontSize: "12px", fontWeight: 700, color: "var(--text)", marginTop: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {entity.name}
              </div>
              <div className="font-mono tabular-nums" style={{ fontSize: "10px", color: "var(--mint)", fontWeight: 700, marginTop: "4px" }}>
                Score {entity.fitScore}%
              </div>
            </div>

            {/* Tier 2: Canonical Domain Node */}
            <div
              style={{
                padding: "12px 14px",
                background: "rgba(14, 21, 34, 0.9)",
                border: "1px solid rgba(0, 216, 246, 0.3)",
                borderRadius: "var(--radius-sm)",
                boxShadow: "0 8px 20px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.08)",
                transition: "all 180ms var(--ease-spring)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "9px", textTransform: "uppercase", color: "var(--muted)", fontWeight: 700, letterSpacing: "0.1em" }}>
                  CANONICAL HOST
                </span>
                <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "var(--cyan)" }} />
              </div>
              <div className="font-mono" style={{ fontSize: "11px", color: "var(--cyan)", marginTop: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {entity.domain}
              </div>
              <div className="badge-qualified" style={{ fontSize: "8.5px", padding: "1px 6px", marginTop: "4px", display: "inline-flex" }}>
                CORROBORATED
              </div>
            </div>

            {/* Tier 3: Contact Node */}
            <div
              style={{
                padding: "12px 14px",
                background: "rgba(14, 21, 34, 0.85)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-sm)",
                boxShadow: "0 8px 20px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.08)",
                transition: "all 180ms var(--ease-spring)",
              }}
            >
              <div style={{ fontSize: "9px", textTransform: "uppercase", color: "var(--muted)", fontWeight: 700, letterSpacing: "0.1em" }}>
                DIRECT ROUTE
              </div>
              <div className="font-mono" style={{ fontSize: "10.5px", color: "var(--text)", marginTop: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {primaryContact ? primaryContact.value.split("@")[0] + "@..." : "No Route"}
              </div>
              <div
                className={primaryContact?.status === "Verified Route" ? "badge-qualified" : "badge-review"}
                style={{ fontSize: "8.5px", padding: "1px 6px", marginTop: "4px", display: "inline-flex" }}
              >
                {primaryContact?.status || "Unprobed"}
              </div>
            </div>

            {/* Tier 4: Provenance Source Anchor */}
            <div
              style={{
                padding: "12px 14px",
                background: "rgba(10, 16, 26, 0.8)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-sm)",
                boxShadow: "0 6px 16px rgba(0, 0, 0, 0.3)",
                transition: "all 180ms var(--ease-spring)",
              }}
            >
              <div style={{ fontSize: "9px", textTransform: "uppercase", color: "var(--muted)", fontWeight: 700, letterSpacing: "0.1em" }}>
                SOURCE ANCHOR
              </div>
              <div className="font-mono" style={{ fontSize: "10px", color: "var(--muted)", marginTop: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {primarySource?.sourceUrl ? primarySource.sourceUrl.replace("https://", "") : "First-Party Registry"}
              </div>
              <div className="font-mono" style={{ fontSize: "8.5px", color: "var(--faint)", marginTop: "4px" }}>
                SHA256: {primarySource?.contentHash ? primarySource.contentHash.slice(0, 10) + "..." : "verified"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
