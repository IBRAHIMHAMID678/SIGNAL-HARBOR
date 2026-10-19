import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from "remotion";
import { KineticTitle } from "../components/KineticTitle";

export const Scene3EvidenceEngine: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Scene transition
  const sceneOpacity = interpolate(frame, [0, 20, 230, 250], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // 3D Card tilt and camera macro zoom
  const cardProgress = spring({
    frame,
    fps,
    config: { damping: 15, mass: 0.9, stiffness: 90 },
  });

  const cardRotateX = interpolate(frame, [0, 80, 240], [25, 8, -4]);
  const cardRotateY = interpolate(frame, [0, 120, 240], [-20, -5, 10]);
  const cardTranslateZ = interpolate(frame, [0, 100, 240], [-150, 60, 120]);

  // Confidence score animation (0 -> 99.4%)
  const scoreProgress = spring({
    frame: frame - 25,
    fps,
    config: { damping: 18, mass: 0.8, stiffness: 80 },
  });
  const displayedScore = (scoreProgress * 99.4).toFixed(1);

  // SVG ring stroke dashoffset (circumference = 2 * PI * 34 ≈ 213.6)
  const ringCircumference = 213.6;
  const strokeDashoffset = ringCircumference * (1 - scoreProgress * 0.994);

  // Verification badges staggered entrance
  const badge1 = spring({ frame: frame - 40, fps, config: { damping: 12 } });
  const badge2 = spring({ frame: frame - 55, fps, config: { damping: 12 } });
  const badge3 = spring({ frame: frame - 70, fps, config: { damping: 12 } });
  const badge4 = spring({ frame: frame - 85, fps, config: { damping: 12 } });

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "#050609",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        perspective: 1200,
        opacity: sceneOpacity,
      }}
    >
      {/* Background radial glow */}
      <div
        style={{
          position: "absolute",
          width: 1000,
          height: 1000,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, rgba(0, 240, 255, 0.05) 50%, transparent 70%)",
          filter: "blur(100px)",
        }}
      />

      {/* Top Headline Banner */}
      <div
        style={{
          position: "absolute",
          top: "8%",
          left: 0,
          right: 0,
          textAlign: "center",
          zIndex: 30,
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 20px",
            borderRadius: 9999,
            backgroundColor: "rgba(16, 185, 129, 0.12)",
            border: "1px solid rgba(16, 185, 129, 0.35)",
            color: "#10B981",
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            marginBottom: 16,
            boxShadow: "0 0 30px rgba(16, 185, 129, 0.25)",
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor: "#10B981",
              boxShadow: "0 0 10px #10B981",
            }}
          />
          DETERMINISTIC PROVENANCE ENGINE
        </div>
        <KineticTitle
          words={["Every", "Single", "Lead", "Backed", "By", "Verifiable", "Proof."]}
          startFrame={5}
          highlightIndices={[3, 5, 6]}
          highlightColor="#10B981"
          fontSize={52}
        />
      </div>

      {/* 3D Floating Double-Bezel Prospect Evidence Card */}
      <div
        style={{
          marginTop: 90,
          width: 860,
          transformStyle: "preserve-3d",
          transform: `translateZ(${cardTranslateZ}px) rotateX(${cardRotateX}deg) rotateY(${cardRotateY}deg) scale(${cardProgress})`,
          transition: "transform 0.1s ease-out",
        }}
      >
        {/* Outer Bezel (Doppelrand Architecture) */}
        <div
          style={{
            padding: 8,
            borderRadius: 36,
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(16,185,129,0.2) 50%, rgba(0,240,255,0.1) 100%)",
            boxShadow:
              "0 40px 100px rgba(0,0,0,0.9), 0 0 80px rgba(16,185,129,0.25)",
          }}
        >
          {/* Inner Core */}
          <div
            style={{
              background: "rgba(9, 13, 20, 0.95)",
              backdropFilter: "blur(30px)",
              borderRadius: 28,
              padding: "36px 44px",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            {/* Prospect Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "1px solid rgba(255,255,255,0.08)",
                paddingBottom: 24,
                marginBottom: 28,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                {/* Avatar with glowing ring */}
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: "50%",
                    background:
                      "linear-gradient(135deg, #00F0FF 0%, #10B981 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 900,
                    fontSize: 24,
                    color: "#050609",
                    boxShadow: "0 0 25px rgba(0,240,255,0.4)",
                  }}
                >
                  SC
                </div>
                <div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: "#FFFFFF", letterSpacing: "-0.02em" }}>
                    Sarah Chen
                  </div>
                  <div style={{ fontSize: 16, color: "#9CA3AF", marginTop: 4 }}>
                    VP of Platform Engineering @{" "}
                    <span style={{ color: "#00F0FF", fontWeight: 600 }}>Scale AI</span>
                  </div>
                </div>
              </div>

              {/* Confidence Ring Gauge */}
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ position: "relative", width: 84, height: 84 }}>
                  <svg width="84" height="84" style={{ transform: "rotate(-90deg)" }}>
                    <circle
                      cx="42"
                      cy="42"
                      r="34"
                      stroke="rgba(255,255,255,0.1)"
                      strokeWidth="6"
                      fill="transparent"
                    />
                    <circle
                      cx="42"
                      cy="42"
                      r="34"
                      stroke="#10B981"
                      strokeWidth="6"
                      fill="transparent"
                      strokeDasharray={213.6}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      style={{
                        filter: "drop-shadow(0 0 10px rgba(16,185,129,0.8))",
                      }}
                    />
                  </svg>
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 16,
                      fontWeight: 800,
                      fontFamily: "monospace",
                      color: "#10B981",
                    }}
                  >
                    {Math.round(scoreProgress * 99)}%
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "#9CA3AF", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                    Confidence Index
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: "#10B981", fontFamily: "monospace" }}>
                    {displayedScore}%
                  </div>
                </div>
              </div>
            </div>

            {/* Verification Proof Items (Staggered Grid) */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {/* Proof 1: Live MX */}
              <div
                style={{
                  padding: "16px 20px",
                  borderRadius: 16,
                  background: "rgba(16, 185, 129, 0.08)",
                  border: "1px solid rgba(16, 185, 129, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  transform: `scale(${badge1})`,
                  opacity: badge1,
                }}
              >
                <div>
                  <div style={{ fontSize: 12, color: "#6EE7B7", fontWeight: 700 }}>
                    ✓ SMTP Handshake Verified
                  </div>
                  <div style={{ fontSize: 14, color: "#FFFFFF", fontFamily: "monospace", marginTop: 2 }}>
                    schen@scale.com
                  </div>
                </div>
                <span style={{ fontSize: 12, color: "#10B981", fontWeight: 700, fontFamily: "monospace" }}>
                  18ms
                </span>
              </div>

              {/* Proof 2: DOM Cryptographic Hash */}
              <div
                style={{
                  padding: "16px 20px",
                  borderRadius: 16,
                  background: "rgba(0, 240, 255, 0.08)",
                  border: "1px solid rgba(0, 240, 255, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  transform: `scale(${badge2})`,
                  opacity: badge2,
                }}
              >
                <div>
                  <div style={{ fontSize: 12, color: "#67E8F9", fontWeight: 700 }}>
                    ✓ Content-Addressed DOM Snapshot
                  </div>
                  <div style={{ fontSize: 13, color: "#9CA3AF", fontFamily: "monospace", marginTop: 2 }}>
                    SHA256: e4a1...98f2
                  </div>
                </div>
                <span style={{ fontSize: 12, color: "#00F0FF", fontWeight: 700 }}>HTTP 200</span>
              </div>

              {/* Proof 3: Identity Resolution */}
              <div
                style={{
                  padding: "16px 20px",
                  borderRadius: 16,
                  background: "rgba(139, 92, 246, 0.08)",
                  border: "1px solid rgba(139, 92, 246, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  transform: `scale(${badge3})`,
                  opacity: badge3,
                }}
              >
                <div>
                  <div style={{ fontSize: 12, color: "#C4B5FD", fontWeight: 700 }}>
                    ✓ Multi-Point Identity Resolution
                  </div>
                  <div style={{ fontSize: 13, color: "#9CA3AF", fontFamily: "monospace", marginTop: 2 }}>
                    GitHub + SEC 10-K + LinkedIn
                  </div>
                </div>
                <span style={{ fontSize: 12, color: "#8B5CF6", fontWeight: 700 }}>MATCH</span>
              </div>

              {/* Proof 4: Zero Bounce Guarantee */}
              <div
                style={{
                  padding: "16px 20px",
                  borderRadius: 16,
                  background: "rgba(16, 185, 129, 0.08)",
                  border: "1px solid rgba(16, 185, 129, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  transform: `scale(${badge4})`,
                  opacity: badge4,
                }}
              >
                <div>
                  <div style={{ fontSize: 12, color: "#6EE7B7", fontWeight: 700 }}>
                    ✓ Disposable / Catch-All Check
                  </div>
                  <div style={{ fontSize: 13, color: "#FFFFFF", fontFamily: "monospace", marginTop: 2 }}>
                    Zero Catch-All Risk
                  </div>
                </div>
                <span style={{ fontSize: 12, color: "#10B981", fontWeight: 800 }}>PASS</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
