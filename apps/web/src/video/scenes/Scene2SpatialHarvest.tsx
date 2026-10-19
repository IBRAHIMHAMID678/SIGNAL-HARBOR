import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from "remotion";
import { ThreeGlobeAd } from "../components/ThreeGlobeAd";
import { KineticTitle } from "../components/KineticTitle";

export const Scene2SpatialHarvest: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Scene entrance & exit
  const sceneEntrance = spring({
    frame,
    fps,
    config: { damping: 14, mass: 0.9, stiffness: 100 },
  });

  const sceneOpacity = interpolate(frame, [0, 20, 220, 240], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Camera 3D pan & sweep
  const camX = interpolate(frame, [0, 120, 240], [120, 0, -80]);
  const camRotateY = interpolate(frame, [0, 240], [-15, 12]);
  const camScale = interpolate(frame, [0, 100, 240], [0.9, 1.05, 1.15]);

  // Telemetry HUD animation
  const hudProgress = spring({
    frame: frame - 15,
    fps,
    config: { damping: 12, mass: 0.7, stiffness: 120 },
  });

  // Live counter
  const recordCount = Math.floor(
    interpolate(frame, [15, 180], [1200, 48290], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "#06070a",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        perspective: 1200,
        opacity: sceneOpacity,
      }}
    >
      {/* Background ambient light orbs */}
      <div
        style={{
          position: "absolute",
          top: "15%",
          left: "20%",
          width: 800,
          height: 800,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(0,240,255,0.12) 0%, transparent 70%)",
          filter: "blur(90px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "10%",
          right: "15%",
          width: 900,
          height: 900,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 70%)",
          filter: "blur(100px)",
        }}
      />

      {/* 3D Moving Stage */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `translateX(${camX}px) rotateY(${camRotateY}deg) scale(${camScale})`,
          transformStyle: "preserve-3d",
        }}
      >
        {/* Central 3D Globe with Three.js */}
        <div
          style={{
            position: "absolute",
            right: "5%",
            top: "50%",
            transform: "translateY(-50%) translateZ(40px)",
          }}
        >
          <ThreeGlobeAd />
        </div>

        {/* Left Side Content & Kinetic Copy */}
        <div
          style={{
            position: "absolute",
            left: "6%",
            top: "20%",
            maxWidth: 720,
            transform: "translateZ(100px)",
            zIndex: 20,
          }}
        >
          {/* Eyebrow badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 18px",
              borderRadius: 9999,
              backgroundColor: "rgba(0, 240, 255, 0.1)",
              border: "1px solid rgba(0, 240, 255, 0.3)",
              color: "#00F0FF",
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              marginBottom: 24,
              boxShadow: "0 0 25px rgba(0, 240, 255, 0.25)",
              transform: `scale(${sceneEntrance})`,
              opacity: sceneEntrance,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: "#00F0FF",
                boxShadow: "0 0 10px #00F0FF",
              }}
            />
            AUTONOMOUS EVIDENCE HARVESTING
          </div>

          <KineticTitle
            words={["Stop", "Scraping", "Stale", "Databases."]}
            startFrame={10}
            highlightIndices={[1, 3]}
            highlightColor="#00F0FF"
            fontSize={58}
            textAlign="left"
          />
          <div style={{ height: 14 }} />
          <KineticTitle
            words={["Harvest", "Verifiable", "B2B", "Signals", "In", "Real-Time."]}
            startFrame={30}
            highlightIndices={[1, 3]}
            highlightColor="#10B981"
            fontSize={48}
            textAlign="left"
          />

          {/* Telemetry Metric Cards */}
          <div
            style={{
              display: "flex",
              gap: 20,
              marginTop: 40,
              transform: `translateY(${interpolate(hudProgress, [0, 1], [40, 0])}px)`,
              opacity: hudProgress,
            }}
          >
            {/* Metric 1 */}
            <div
              style={{
                padding: "18px 24px",
                borderRadius: 18,
                background: "rgba(10, 14, 24, 0.7)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(0, 240, 255, 0.25)",
                boxShadow: "0 15px 35px rgba(0,0,0,0.6)",
              }}
            >
              <div style={{ fontSize: 12, color: "#9CA3AF", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>
                Active Telemetry Nodes
              </div>
              <div style={{ fontSize: 36, fontWeight: 900, color: "#00F0FF", fontFamily: "monospace" }}>
                {recordCount.toLocaleString()}
              </div>
              <div style={{ fontSize: 12, color: "#10B981", marginTop: 4, display: "flex", alignItems: "center", gap: 6 }}>
                <span>●</span> 99.8% Sync Integrity
              </div>
            </div>

            {/* Metric 2 */}
            <div
              style={{
                padding: "18px 24px",
                borderRadius: 18,
                background: "rgba(10, 14, 24, 0.7)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(16, 185, 129, 0.25)",
                boxShadow: "0 15px 35px rgba(0,0,0,0.6)",
              }}
            >
              <div style={{ fontSize: 12, color: "#9CA3AF", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>
                Verification Protocol
              </div>
              <div style={{ fontSize: 32, fontWeight: 800, color: "#10B981" }}>
                RFC + MX Live
              </div>
              <div style={{ fontSize: 12, color: "#6EE7B7", marginTop: 6 }}>
                18ms Average Latency
              </div>
            </div>
          </div>
        </div>

        {/* Floating Telemetry Coordinates Tag */}
        <div
          style={{
            position: "absolute",
            bottom: "8%",
            left: "6%",
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontFamily: "monospace",
            fontSize: 13,
            color: "#6B7280",
            transform: "translateZ(80px)",
          }}
        >
          <span style={{ color: "#00F0FF" }}>&gt;&gt; ORBITAL SCAN</span>
          <span>LAT: 37.7749° N</span>
          <span>LON: -122.4194° W</span>
          <span>REGISTRY: SEC / DOM / JSON-LD</span>
          <span style={{ color: "#10B981" }}>[LIVE HARVEST ACTIVE]</span>
        </div>
      </div>
    </div>
  );
};
