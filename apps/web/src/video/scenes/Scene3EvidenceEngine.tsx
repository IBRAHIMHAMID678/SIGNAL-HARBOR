import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from "remotion";

export const Scene3EvidenceEngine: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Scene transition
  const sceneOpacity = interpolate(frame, [0, 18, 230, 250], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // 3D Card tilt and camera macro zoom
  const cardProgress = spring({
    frame,
    fps,
    config: { damping: 14, mass: 0.8, stiffness: 100 },
  });

  const cardRotateX = interpolate(frame, [0, 80, 240], [22, 6, -3]);
  const cardRotateY = interpolate(frame, [0, 120, 240], [-18, -4, 8]);
  const cardTranslateZ = interpolate(frame, [0, 100, 240], [-120, 40, 90]);

  // Confidence score animation (0 -> 99.8%)
  const scoreProgress = spring({
    frame: frame - 25,
    fps,
    config: { damping: 16, mass: 0.7, stiffness: 90 },
  });
  const displayedScore = (scoreProgress * 99.8).toFixed(1);

  // SVG ring stroke dashoffset (circumference = 2 * PI * 40 ≈ 251.3)
  const ringCircumference = 251.3;
  const strokeDashoffset = ringCircumference * (1 - scoreProgress * 0.998);

  // Verification badges staggered entrance
  const badge1 = spring({ frame: frame - 35, fps, config: { damping: 12 } });
  const badge2 = spring({ frame: frame - 50, fps, config: { damping: 12 } });
  const badge3 = spring({ frame: frame - 65, fps, config: { damping: 12 } });
  const badge4 = spring({ frame: frame - 80, fps, config: { damping: 12 } });

  // Cryptographic hash scrambling effect
  const hashChars = "0123456789ABCDEF";
  const scrambledHash = Array.from({ length: 24 })
    .map((_, i) => (frame > 60 + i * 2 ? "7F9A2B4E10C839F6D5"[i % 18] : hashChars[(frame + i) % 16]))
    .join("");

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "#030408",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        perspective: 1200,
        opacity: sceneOpacity,
      }}
    >
      {/* Background Emerald / Cyber Green Quantum Halo */}
      <div
        style={{
          position: "absolute",
          width: 1300,
          height: 1300,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(0, 255, 136, 0.16) 0%, rgba(0, 240, 255, 0.08) 45%, transparent 70%)",
          filter: "blur(110px)",
          transform: `scale(${1 + Math.sin(frame * 0.09) * 0.08})`,
        }}
      />

      {/* Cyber Grid Plane */}
      <div
        style={{
          position: "absolute",
          bottom: -200,
          width: "240%",
          height: 700,
          background:
            "linear-gradient(to top, rgba(0, 255, 136, 0.12) 1px, transparent 1px), linear-gradient(to right, rgba(0, 255, 136, 0.12) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          transform: "rotateX(75deg)",
          transformOrigin: "bottom center",
          opacity: 0.45,
        }}
      />

      {/* Main 3D Dossier Container */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10,
          transform: `translateZ(${cardTranslateZ}px) rotateX(${cardRotateX}deg) rotateY(${cardRotateY}deg) scale(${cardProgress})`,
          transformStyle: "preserve-3d",
          width: 1100,
        }}
      >
        {/* Tactical Classification Pill */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            padding: "8px 20px",
            borderRadius: 100,
            backgroundColor: "rgba(0, 255, 136, 0.12)",
            border: "1px solid rgba(0, 255, 136, 0.45)",
            boxShadow: "0 0 25px rgba(0, 255, 136, 0.2)",
            marginBottom: 20,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor: "#00FF88",
              boxShadow: "0 0 10px #00FF88",
            }}
          />
          <span
            style={{
              fontFamily: "monospace",
              fontSize: 12,
              fontWeight: 800,
              color: "#00FF88",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
            }}
          >
            ZERO-HALLUCINATION VERIFICATION PROTOCOL
          </span>
        </div>

        {/* Section Heading */}
        <div
          style={{
            fontSize: 60,
            fontWeight: 950,
            letterSpacing: "-0.035em",
            color: "#FFFFFF",
            textAlign: "center",
            textTransform: "uppercase",
            marginBottom: 32,
            lineHeight: 1.1,
          }}
        >
          100% Mathematical Proof. <br />
          <span
            style={{
              background: "linear-gradient(90deg, #00FF88 0%, #00F0FF 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Zero Fabricated Claims.
          </span>
        </div>

        {/* Holographic Quantum Evidence Card */}
        <div
          style={{
            width: "100%",
            background:
              "linear-gradient(135deg, rgba(8, 20, 24, 0.88) 0%, rgba(2, 6, 12, 0.95) 100%)",
            border: "1px solid rgba(0, 255, 136, 0.35)",
            borderRadius: 24,
            padding: "36px 44px",
            boxShadow:
              "0 30px 100px rgba(0,0,0,0.9), 0 0 60px rgba(0, 255, 136, 0.15)",
            backdropFilter: "blur(24px)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Specular Light Sweep */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: -500,
              width: 400,
              height: "100%",
              background:
                "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.08), transparent)",
              transform: `skewX(-25deg) translateX(${frame * 12}px)`,
              pointerEvents: "none",
            }}
          />

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 32,
              borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
              paddingBottom: 24,
            }}
          >
            {/* Target Executive Info */}
            <div>
              <div
                style={{
                  fontFamily: "monospace",
                  fontSize: 12,
                  color: "#00FF88",
                  letterSpacing: "0.15em",
                  marginBottom: 6,
                }}
              >
                PROVEN_IDENTITY // ENTERPRISE DECISION MAKER
              </div>
              <div
                style={{
                  fontSize: 32,
                  fontWeight: 900,
                  color: "#FFFFFF",
                  letterSpacing: "-0.02em",
                }}
              >
                Alexander Vance — VP of Cloud Infrastructure
              </div>
              <div
                style={{
                  fontFamily: "monospace",
                  fontSize: 13,
                  color: "rgba(255, 255, 255, 0.5)",
                  marginTop: 4,
                }}
              >
                HASH: <span style={{ color: "#00F0FF" }}>0x{scrambledHash}</span>
              </div>
            </div>

            {/* Circular Gauge 99.8% */}
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <div style={{ position: "relative", width: 90, height: 90 }}>
                <svg width="90" height="90" viewBox="0 0 90 90">
                  <circle
                    cx="45"
                    cy="45"
                    r="40"
                    fill="none"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="6"
                  />
                  <circle
                    cx="45"
                    cy="45"
                    r="40"
                    fill="none"
                    stroke="#00FF88"
                    strokeWidth="6"
                    strokeDasharray={ringCircumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    style={{
                      transform: "rotate(-90deg)",
                      transformOrigin: "center",
                      filter: "drop-shadow(0 0 10px #00FF88)",
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
                    fontFamily: "monospace",
                    fontSize: 18,
                    fontWeight: 900,
                    color: "#FFFFFF",
                  }}
                >
                  {displayedScore}%
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontFamily: "monospace",
                    fontSize: 11,
                    color: "#00FF88",
                    fontWeight: 800,
                    letterSpacing: "0.1em",
                  }}
                >
                  ACCURACY CONFIDENCE
                </div>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: "rgba(255,255,255,0.75)",
                  }}
                >
                  Deterministic Lock
                </div>
              </div>
            </div>
          </div>

          {/* 4 Staggered Verification Vector Badges */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
            }}
          >
            {[
              {
                title: "01 // DNS MX & SMTP Handshake",
                desc: "Live zero-bounce protocol verification confirmed active mailbox response without tripping spam filters.",
                color: "#00FF88",
                springVal: badge1,
              },
              {
                title: "02 // Multi-Source Triangulation",
                desc: "Cross-correlated across SEC EDGAR, GitHub repositories, and patent filings for executive authority.",
                color: "#00F0FF",
                springVal: badge2,
              },
              {
                title: "03 // Buying Intent Spike (+340%)",
                desc: "Target company published 14 open DevOps reqs and spiked search volume for cloud database migration.",
                color: "#A855F7",
                springVal: badge3,
              },
              {
                title: "04 // Provable Evidence Trail",
                desc: "Every lead exports with raw timestamped evidence JSON. No black-box AI fabrications or guesses.",
                color: "#00FF88",
                springVal: badge4,
              },
            ].map((badge, i) => (
              <div
                key={i}
                style={{
                  background: "rgba(12, 22, 34, 0.65)",
                  border: `1px solid ${badge.color}40`,
                  borderRadius: 14,
                  padding: "16px 20px",
                  transform: `translateY(${interpolate(badge.springVal, [0, 1], [30, 0])}px)`,
                  opacity: badge.springVal,
                }}
              >
                <div
                  style={{
                    fontFamily: "monospace",
                    fontSize: 11,
                    fontWeight: 800,
                    color: badge.color,
                    letterSpacing: "0.15em",
                    marginBottom: 6,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      backgroundColor: badge.color,
                      boxShadow: `0 0 8px ${badge.color}`,
                    }}
                  />
                  {badge.title}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: "rgba(255, 255, 255, 0.7)",
                    lineHeight: 1.5,
                  }}
                >
                  {badge.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
