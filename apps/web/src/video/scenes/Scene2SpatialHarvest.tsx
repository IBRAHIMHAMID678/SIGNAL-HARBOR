import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from "remotion";
import { ThreeGlobeAd } from "../components/ThreeGlobeAd";

export const Scene2SpatialHarvest: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Scene entrance & exit
  const sceneEntrance = spring({
    frame,
    fps,
    config: { damping: 13, mass: 0.8, stiffness: 120 },
  });

  const sceneOpacity = interpolate(frame, [0, 18, 225, 250], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Camera 3D pan & sweep
  const camX = interpolate(frame, [0, 120, 250], [100, 0, -60]);

  // Telemetry HUD animation
  const hudProgress = spring({
    frame: frame - 15,
    fps,
    config: { damping: 12, mass: 0.7, stiffness: 130 },
  });

  // Live counter
  const recordCount = Math.floor(
    interpolate(frame, [15, 190], [1200, 48290], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );

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
      {/* Background Deep Space Cyan / Neon Nebula */}
      <div
        style={{
          position: "absolute",
          width: 1400,
          height: 1400,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(0, 240, 255, 0.16) 0%, rgba(121, 40, 202, 0.08) 45%, transparent 70%)",
          filter: "blur(100px)",
          transform: `scale(${1 + Math.sin(frame * 0.08) * 0.08})`,
        }}
      />

      {/* Cybernetic Radial Grid Floor */}
      <div
        style={{
          position: "absolute",
          bottom: -220,
          width: "240%",
          height: 800,
          background:
            "linear-gradient(to top, rgba(0, 240, 255, 0.15) 1px, transparent 1px), linear-gradient(to right, rgba(0, 240, 255, 0.15) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          transform: "rotateX(75deg)",
          transformOrigin: "bottom center",
          opacity: 0.5,
          maskImage: "linear-gradient(to top, black 25%, transparent 95%)",
          WebkitMaskImage: "linear-gradient(to top, black 25%, transparent 95%)",
        }}
      />

      {/* Main 3D Stage */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 90px",
          transform: `translateX(${camX}px)`,
        }}
      >
        {/* Left: Cinematic Title & Tactical Specs */}
        <div
          style={{
            zIndex: 10,
            maxWidth: 640,
            transform: `translateY(${interpolate(sceneEntrance, [0, 1], [40, 0])}px)`,
          }}
        >
          {/* Tactical Badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "7px 16px",
              borderRadius: 100,
              backgroundColor: "rgba(0, 240, 255, 0.12)",
              border: "1px solid rgba(0, 240, 255, 0.45)",
              boxShadow: "0 0 25px rgba(0, 240, 255, 0.25)",
              marginBottom: 20,
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: "#00F0FF",
                boxShadow: "0 0 10px #00F0FF",
              }}
            />
            <span
              style={{
                fontFamily: "monospace",
                fontSize: 12,
                fontWeight: 800,
                color: "#00F0FF",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
              }}
            >
              AUTONOMOUS SPATIAL HARVEST
            </span>
          </div>

          {/* Heading */}
          <div
            style={{
              fontSize: 64,
              fontWeight: 950,
              letterSpacing: "-0.035em",
              color: "#FFFFFF",
              lineHeight: 1.05,
              textTransform: "uppercase",
              marginBottom: 16,
              textShadow: "0 0 40px rgba(0, 240, 255, 0.25)",
            }}
          >
            Global Recon. <br />
            <span
              style={{
                background: "linear-gradient(90deg, #00F0FF 0%, #00FF88 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Real-Time Signals.
            </span>
          </div>

          <div
            style={{
              fontSize: 18,
              color: "rgba(255, 255, 255, 0.7)",
              lineHeight: 1.6,
              marginBottom: 32,
            }}
          >
            Our autonomous constellation continuously crawls 400M+ global
            records, catching buying triggers the millisecond they happen.
          </div>

          {/* Target Lock Tickers */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { city: "TOKYO // ASIA-PACIFIC", count: "4,820 DECISION-MAKERS", status: "LOCKED" },
              { city: "LONDON // EMEA CORE", count: "8,340 INTENT TRIPPED", status: "LOCKED" },
              { city: "SAN FRANCISCO // US WEST", count: "12,980 BUDGET REVEALED", status: "LOCKED" },
            ].map((node, i) => {
              const nodeSpring = spring({
                frame: frame - 30 - i * 15,
                fps,
                config: { damping: 12 },
              });
              return (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 16px",
                    background: "rgba(10, 16, 28, 0.75)",
                    border: "1px solid rgba(0, 240, 255, 0.2)",
                    borderRadius: 10,
                    fontFamily: "monospace",
                    fontSize: 12,
                    transform: `translateX(${interpolate(nodeSpring, [0, 1], [-30, 0])}px)`,
                    opacity: nodeSpring,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        backgroundColor: "#00FF88",
                        boxShadow: "0 0 8px #00FF88",
                      }}
                    />
                    <span style={{ color: "#FFFFFF", fontWeight: 700 }}>{node.city}</span>
                  </div>
                  <span style={{ color: "#00F0FF" }}>{node.count}</span>
                  <span
                    style={{
                      padding: "2px 8px",
                      borderRadius: 4,
                      backgroundColor: "rgba(0, 255, 136, 0.15)",
                      color: "#00FF88",
                      fontWeight: 800,
                    }}
                  >
                    {node.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Center: Three.js 3D Interactive Cyber Globe */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            transform: "translateX(-45%)",
            zIndex: 5,
          }}
        >
          <ThreeGlobeAd />
        </div>

        {/* Right: Holographic Telemetry HUD Box */}
        <div
          style={{
            zIndex: 10,
            background:
              "linear-gradient(135deg, rgba(8, 16, 32, 0.85) 0%, rgba(3, 5, 12, 0.95) 100%)",
            border: "1px solid rgba(0, 240, 255, 0.35)",
            borderRadius: 24,
            padding: "36px 32px",
            boxShadow:
              "0 30px 80px rgba(0,0,0,0.85), 0 0 50px rgba(0, 240, 255, 0.15)",
            backdropFilter: "blur(24px)",
            width: 380,
            transform: `translateY(${interpolate(hudProgress, [0, 1], [60, 0])}px) scale(${hudProgress})`,
            opacity: hudProgress,
          }}
        >
          <div
            style={{
              fontFamily: "monospace",
              fontSize: 11,
              fontWeight: 800,
              color: "#00F0FF",
              letterSpacing: "0.2em",
              marginBottom: 12,
            }}
          >
            [LIVE SIGNAL FEED]
          </div>

          <div
            style={{
              fontSize: 56,
              fontWeight: 950,
              color: "#00FF88",
              fontFamily: "monospace",
              letterSpacing: "-0.03em",
              textShadow: "0 0 35px rgba(0, 255, 136, 0.5)",
              lineHeight: 1,
              marginBottom: 8,
            }}
          >
            {recordCount.toLocaleString()}
          </div>

          <div
            style={{
              fontSize: 13,
              color: "rgba(255, 255, 255, 0.6)",
              marginBottom: 24,
              fontFamily: "monospace",
            }}
          >
            VERIFIED PROFILES HARVESTED / HR
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
              borderTop: "1px solid rgba(255, 255, 255, 0.1)",
              paddingTop: 20,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontFamily: "monospace",
                fontSize: 12,
              }}
            >
              <span style={{ color: "rgba(255, 255, 255, 0.5)" }}>STREAM LATENCY:</span>
              <span style={{ color: "#00F0FF", fontWeight: 700 }}>&lt; 14ms (EDGE)</span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontFamily: "monospace",
                fontSize: 12,
              }}
            >
              <span style={{ color: "rgba(255, 255, 255, 0.5)" }}>SPAM TRAP DETECTION:</span>
              <span style={{ color: "#00FF88", fontWeight: 700 }}>100% BLOCKED</span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontFamily: "monospace",
                fontSize: 12,
              }}
            >
              <span style={{ color: "rgba(255, 255, 255, 0.5)" }}>ACCURACY INDEX:</span>
              <span style={{ color: "#00FF88", fontWeight: 700 }}>99.8% VERIFIED</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
