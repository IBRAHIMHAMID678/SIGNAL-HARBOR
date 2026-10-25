import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from "remotion";

export const Scene4RelationshipGraph: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Scene transition
  const sceneOpacity = interpolate(frame, [0, 18, 135, 150], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // 3D Perspective rotation & pan
  const camRotateX = interpolate(frame, [0, 75, 150], [16, 2, -8]);
  const camRotateY = interpolate(frame, [0, 150], [-16, 10]);
  const camScale = interpolate(frame, [0, 75, 150], [0.94, 1.02, 1.06]);

  // Graph nodes entrance springs
  const nodeCompany = spring({ frame: frame - 4, fps, config: { damping: 11 } });
  const node1 = spring({ frame: frame - 18, fps, config: { damping: 11 } });
  const node2 = spring({ frame: frame - 28, fps, config: { damping: 11 } });
  const node3 = spring({ frame: frame - 38, fps, config: { damping: 11 } });
  const node4 = spring({ frame: frame - 48, fps, config: { damping: 11 } });

  // Floating deal score card
  const dealScoreProgress = spring({
    frame: frame - 55,
    fps,
    config: { damping: 14, mass: 0.8, stiffness: 110 },
  });

  // Synapse pulse travel (0 to 1)
  const pulseT = (frame % 45) / 45;

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
      {/* Background Volumetric Ultraviolet Nebula */}
      <div
        style={{
          position: "absolute",
          width: 1300,
          height: 1300,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(168, 85, 247, 0.18) 0%, rgba(0, 240, 255, 0.08) 45%, transparent 70%)",
          filter: "blur(110px)",
          transform: `scale(${1 + Math.sin(frame * 0.1) * 0.08})`,
        }}
      />

      {/* Cyber Grid Floor */}
      <div
        style={{
          position: "absolute",
          bottom: -220,
          width: "240%",
          height: 700,
          background:
            "linear-gradient(to top, rgba(168, 85, 247, 0.12) 1px, transparent 1px), linear-gradient(to right, rgba(168, 85, 247, 0.12) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          transform: "rotateX(75deg)",
          transformOrigin: "bottom center",
          opacity: 0.45,
        }}
      />

      {/* 3D Stage */}
      <div
        style={{
          position: "relative",
          width: 1400,
          height: 800,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          transform: `rotateX(${camRotateX}deg) rotateY(${camRotateY}deg) scale(${camScale})`,
          transformStyle: "preserve-3d",
        }}
      >
        {/* Tactical Badge & Heading */}
        <div
          style={{
            position: "absolute",
            top: 20,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            zIndex: 20,
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "7px 18px",
              borderRadius: 100,
              backgroundColor: "rgba(168, 85, 247, 0.14)",
              border: "1px solid rgba(168, 85, 247, 0.45)",
              boxShadow: "0 0 25px rgba(168, 85, 247, 0.25)",
              marginBottom: 14,
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: "#A855F7",
                boxShadow: "0 0 10px #A855F7",
              }}
            />
            <span
              style={{
                fontFamily: "monospace",
                fontSize: 12,
                fontWeight: 800,
                color: "#A855F7",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
              }}
            >
              MULTI-VECTOR BUYER SYNAPSE
            </span>
          </div>

          <div
            style={{
              fontSize: 52,
              fontWeight: 950,
              letterSpacing: "-0.035em",
              color: "#FFFFFF",
              textTransform: "uppercase",
              textAlign: "center",
            }}
          >
            Map Every Decision Maker. <br />
            <span
              style={{
                background: "linear-gradient(90deg, #A855F7 0%, #00F0FF 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Strike The Buying Committee.
            </span>
          </div>
        </div>

        {/* Neural Synapse SVG Connection Filaments */}
        <svg
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            zIndex: 5,
            pointerEvents: "none",
          }}
        >
          {/* Center (700, 440) to Node 1 (300, 310) */}
          <line
            x1="700"
            y1="440"
            x2="300"
            y2="310"
            stroke="rgba(0, 240, 255, 0.35)"
            strokeWidth="2"
            strokeDasharray="6 4"
          />
          {/* Animated Energy Pulse 1 */}
          <circle
            cx={700 + (300 - 700) * pulseT}
            cy={440 + (310 - 440) * pulseT}
            r="4"
            fill="#00F0FF"
            filter="drop-shadow(0 0 8px #00F0FF)"
          />

          {/* Center to Node 2 (1100, 310) */}
          <line
            x1="700"
            y1="440"
            x2="1100"
            y2="310"
            stroke="rgba(168, 85, 247, 0.35)"
            strokeWidth="2"
            strokeDasharray="6 4"
          />
          {/* Animated Energy Pulse 2 */}
          <circle
            cx={700 + (1100 - 700) * pulseT}
            cy={440 + (310 - 440) * pulseT}
            r="4"
            fill="#A855F7"
            filter="drop-shadow(0 0 8px #A855F7)"
          />

          {/* Center to Node 3 (300, 580) */}
          <line
            x1="700"
            y1="440"
            x2="300"
            y2="580"
            stroke="rgba(0, 255, 136, 0.35)"
            strokeWidth="2"
            strokeDasharray="6 4"
          />
          {/* Animated Energy Pulse 3 */}
          <circle
            cx={700 + (300 - 700) * pulseT}
            cy={440 + (580 - 440) * pulseT}
            r="4"
            fill="#00FF88"
            filter="drop-shadow(0 0 8px #00FF88)"
          />

          {/* Center to Node 4 (1100, 580) */}
          <line
            x1="700"
            y1="440"
            x2="1100"
            y2="580"
            stroke="rgba(0, 240, 255, 0.35)"
            strokeWidth="2"
            strokeDasharray="6 4"
          />
          {/* Animated Energy Pulse 4 */}
          <circle
            cx={700 + (1100 - 700) * pulseT}
            cy={440 + (580 - 440) * pulseT}
            r="4"
            fill="#00F0FF"
            filter="drop-shadow(0 0 8px #00F0FF)"
          />
        </svg>

        {/* Central Core Reactor Node */}
        <div
          style={{
            position: "absolute",
            left: 700,
            top: 440,
            transform: `translate(-50%, -50%) scale(${nodeCompany})`,
            zIndex: 15,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {/* Glowing Concentric Radar Rings */}
          <div
            style={{
              position: "absolute",
              width: 160,
              height: 160,
              borderRadius: "50%",
              border: "1px solid rgba(0, 240, 255, 0.4)",
              boxShadow: "0 0 40px rgba(0, 240, 255, 0.3)",
              transform: `scale(${1 + Math.sin(frame * 0.15) * 0.1})`,
            }}
          />
          <div
            style={{
              width: 110,
              height: 110,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, #00F0FF 0%, #0077B6 60%, #050E1A 100%)",
              boxShadow:
                "0 0 50px rgba(0, 240, 255, 0.7), inset 0 0 20px rgba(255,255,255,0.6)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              border: "2px solid #FFFFFF",
            }}
          >
            <div
              style={{
                fontFamily: "monospace",
                fontSize: 10,
                fontWeight: 900,
                color: "#030A14",
                letterSpacing: "0.15em",
              }}
            >
              CORE TARGET
            </div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 950,
                color: "#FFFFFF",
                letterSpacing: "-0.02em",
              }}
            >
              Apex AI Inc
            </div>
          </div>
          <div
            style={{
              marginTop: 10,
              padding: "4px 12px",
              borderRadius: 6,
              backgroundColor: "rgba(0, 240, 255, 0.15)",
              border: "1px solid rgba(0, 240, 255, 0.4)",
              fontFamily: "monospace",
              fontSize: 11,
              color: "#00F0FF",
              fontWeight: 800,
            }}
          >
            $140M REVENUE // EXPANDING
          </div>
        </div>

        {/* 4 Decision Maker Dossier Nodes */}
        {/* Node 1: CTO (Top Left) */}
        <div
          style={{
            position: "absolute",
            left: 300,
            top: 310,
            transform: `translate(-50%, -50%) scale(${node1})`,
            zIndex: 12,
            background: "rgba(9, 18, 28, 0.85)",
            border: "1px solid rgba(0, 240, 255, 0.4)",
            borderRadius: 18,
            padding: "16px 20px",
            boxShadow:
              "0 20px 40px rgba(0,0,0,0.8), 0 0 25px rgba(0, 240, 255, 0.2)",
            backdropFilter: "blur(18px)",
            width: 290,
          }}
        >
          <div
            style={{
              fontFamily: "monospace",
              fontSize: 10,
              fontWeight: 800,
              color: "#00F0FF",
              marginBottom: 4,
            }}
          >
            TECHNICAL BUYER [LOCK 100%]
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#FFFFFF" }}>
            Marcus Chen
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)" }}>
            Chief Technology Officer
          </div>
          <div
            style={{
              marginTop: 10,
              fontFamily: "monospace",
              fontSize: 11,
              color: "#00FF88",
              backgroundColor: "rgba(0, 255, 136, 0.12)",
              padding: "4px 8px",
              borderRadius: 4,
            }}
          >
            SIGNAL: Deploying Vector Pipelines
          </div>
        </div>

        {/* Node 2: VP Product (Top Right) */}
        <div
          style={{
            position: "absolute",
            left: 1100,
            top: 310,
            transform: `translate(-50%, -50%) scale(${node2})`,
            zIndex: 12,
            background: "rgba(18, 10, 28, 0.85)",
            border: "1px solid rgba(168, 85, 247, 0.4)",
            borderRadius: 18,
            padding: "16px 20px",
            boxShadow:
              "0 20px 40px rgba(0,0,0,0.8), 0 0 25px rgba(168, 85, 247, 0.2)",
            backdropFilter: "blur(18px)",
            width: 290,
          }}
        >
          <div
            style={{
              fontFamily: "monospace",
              fontSize: 10,
              fontWeight: 800,
              color: "#A855F7",
              marginBottom: 4,
            }}
          >
            EXECUTIVE SPONSOR [LOCK 100%]
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#FFFFFF" }}>
            Elena Rostova
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)" }}>
            VP of Product Engineering
          </div>
          <div
            style={{
              marginTop: 10,
              fontFamily: "monospace",
              fontSize: 11,
              color: "#A855F7",
              backgroundColor: "rgba(168, 85, 247, 0.12)",
              padding: "4px 8px",
              borderRadius: 4,
            }}
          >
            SIGNAL: $2.5M Q3 Budget Allocated
          </div>
        </div>

        {/* Node 3: Head of Procurement (Bottom Left) */}
        <div
          style={{
            position: "absolute",
            left: 300,
            top: 580,
            transform: `translate(-50%, -50%) scale(${node3})`,
            zIndex: 12,
            background: "rgba(8, 22, 18, 0.85)",
            border: "1px solid rgba(0, 255, 136, 0.4)",
            borderRadius: 18,
            padding: "16px 20px",
            boxShadow:
              "0 20px 40px rgba(0,0,0,0.8), 0 0 25px rgba(0, 255, 136, 0.2)",
            backdropFilter: "blur(18px)",
            width: 290,
          }}
        >
          <div
            style={{
              fontFamily: "monospace",
              fontSize: 10,
              fontWeight: 800,
              color: "#00FF88",
              marginBottom: 4,
            }}
          >
            COMMERCIAL GATEKEEPER
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#FFFFFF" }}>
            Sarah Jenkins
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)" }}>
            Head of Procurement & Vendor Ops
          </div>
          <div
            style={{
              marginTop: 10,
              fontFamily: "monospace",
              fontSize: 11,
              color: "#00FF88",
              backgroundColor: "rgba(0, 255, 136, 0.12)",
              padding: "4px 8px",
              borderRadius: 4,
            }}
          >
            SIGNAL: Legacy Contract Expires 45d
          </div>
        </div>

        {/* Node 4: CISO (Bottom Right) */}
        <div
          style={{
            position: "absolute",
            left: 1100,
            top: 580,
            transform: `translate(-50%, -50%) scale(${node4})`,
            zIndex: 12,
            background: "rgba(9, 18, 28, 0.85)",
            border: "1px solid rgba(0, 240, 255, 0.4)",
            borderRadius: 18,
            padding: "16px 20px",
            boxShadow:
              "0 20px 40px rgba(0,0,0,0.8), 0 0 25px rgba(0, 240, 255, 0.2)",
            backdropFilter: "blur(18px)",
            width: 290,
          }}
        >
          <div
            style={{
              fontFamily: "monospace",
              fontSize: 10,
              fontWeight: 800,
              color: "#00F0FF",
              marginBottom: 4,
            }}
          >
            SECURITY SIGN-OFF [LOCK 100%]
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#FFFFFF" }}>
            David Thorne
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)" }}>
            Chief Information Security Officer
          </div>
          <div
            style={{
              marginTop: 10,
              fontFamily: "monospace",
              fontSize: 11,
              color: "#00F0FF",
              backgroundColor: "rgba(0, 240, 255, 0.12)",
              padding: "4px 8px",
              borderRadius: 4,
            }}
          >
            SIGNAL: SOC2 Type II Audit Mandate
          </div>
        </div>

        {/* Floating Live Deal Readiness Score Pill */}
        <div
          style={{
            position: "absolute",
            bottom: 30,
            background:
              "linear-gradient(135deg, rgba(0, 240, 255, 0.18) 0%, rgba(168, 85, 247, 0.18) 100%)",
            border: "1px solid rgba(0, 240, 255, 0.45)",
            borderRadius: 100,
            padding: "10px 28px",
            boxShadow: "0 10px 30px rgba(0, 240, 255, 0.2)",
            backdropFilter: "blur(20px)",
            display: "flex",
            alignItems: "center",
            gap: 20,
            transform: `scale(${dealScoreProgress})`,
            opacity: dealScoreProgress,
            zIndex: 25,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: "#00FF88",
                boxShadow: "0 0 8px #00FF88",
              }}
            />
            <span
              style={{
                fontFamily: "monospace",
                fontSize: 12,
                fontWeight: 800,
                color: "#FFFFFF",
              }}
            >
              DEAL READINESS: <strong style={{ color: "#00FF88" }}>94.6%</strong>
            </span>
          </div>

          <div
            style={{
              width: 1,
              height: 16,
              backgroundColor: "rgba(255,255,255,0.2)",
            }}
          />

          <span
            style={{
              fontFamily: "monospace",
              fontSize: 12,
              fontWeight: 700,
              color: "rgba(255,255,255,0.7)",
            }}
          >
            OPTIMAL TIMING: <strong style={{ color: "#00F0FF" }}>IMMEDIATE (48H WINDOW)</strong>
          </span>
        </div>
      </div>
    </div>
  );
};
