import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from "remotion";
import { KineticTitle } from "../components/KineticTitle";

export const Scene5ClimaxOutro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entrance spring
  const entrance = spring({
    frame,
    fps,
    config: { damping: 14, mass: 0.9, stiffness: 100 },
  });

  // Logo scale and luminous pulse
  const logoScale = interpolate(entrance, [0, 1], [0.6, 1]);
  const pulseRings = (frame % 45) / 45;

  // CTA button spring
  const ctaProgress = spring({
    frame: frame - 30,
    fps,
    config: { damping: 12, mass: 0.7, stiffness: 120 },
  });

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "#050608",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Background Volumetric Core Glow */}
      <div
        style={{
          position: "absolute",
          width: 1200,
          height: 1200,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(0, 240, 255, 0.2) 0%, rgba(16, 185, 129, 0.1) 40%, transparent 70%)",
          filter: "blur(120px)",
          transform: `scale(${1 + Math.sin(frame * 0.1) * 0.08})`,
        }}
      />

      {/* Luminous Concentric Radar Waves */}
      <div
        style={{
          position: "absolute",
          width: 500 * (1 + pulseRings * 1.5),
          height: 500 * (1 + pulseRings * 1.5),
          borderRadius: "50%",
          border: "2px solid rgba(0, 240, 255, 0.35)",
          opacity: 1 - pulseRings,
          filter: "blur(2px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 500 * (1 + ((pulseRings + 0.5) % 1) * 1.5),
          height: 500 * (1 + ((pulseRings + 0.5) % 1) * 1.5),
          borderRadius: "50%",
          border: "2px solid rgba(16, 185, 129, 0.35)",
          opacity: 1 - ((pulseRings + 0.5) % 1),
          filter: "blur(2px)",
        }}
      />

      {/* Center Brand Icon Lockup */}
      <div
        style={{
          transform: `scale(${logoScale})`,
          opacity: entrance,
          marginBottom: 32,
          position: "relative",
          zIndex: 10,
        }}
      >
        <div
          style={{
            width: 110,
            height: 110,
            borderRadius: 32,
            background:
              "linear-gradient(135deg, rgba(0, 240, 255, 0.25) 0%, rgba(16, 185, 129, 0.25) 100%)",
            border: "1px solid rgba(0, 240, 255, 0.5)",
            backdropFilter: "blur(30px)",
            boxShadow:
              "0 0 80px rgba(0, 240, 255, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Lighthouse / Radar SVG */}
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="url(#brandGrad)"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <defs>
              <linearGradient id="brandGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#00F0FF" />
                <stop offset="100%" stopColor="#10B981" />
              </linearGradient>
            </defs>
            <circle cx="12" cy="12" r="10" />
            <path d="M12 2a10 10 0 0 1 10 10" />
            <path d="M12 12 19 5" />
            <circle cx="12" cy="12" r="3" fill="#00F0FF" />
          </svg>
        </div>
      </div>

      {/* Brand Title */}
      <div style={{ zIndex: 10, textAlign: "center" }}>
        <KineticTitle
          words={["SIGNALHARBOR"]}
          startFrame={5}
          highlightIndices={[0]}
          highlightColor="#FFFFFF"
          fontSize={76}
          letterSpacing="0.1em"
        />
        <div style={{ height: 12 }} />
        <KineticTitle
          words={["Discovery", "Meets", "Mathematical", "Proof."]}
          startFrame={15}
          highlightIndices={[2, 3]}
          highlightColor="#00F0FF"
          fontSize={38}
          letterSpacing="-0.02em"
        />
      </div>

      {/* Double-Bezel CTA Pill Button */}
      <div
        style={{
          marginTop: 48,
          zIndex: 10,
          transform: `scale(${ctaProgress}) translateY(${interpolate(ctaProgress, [0, 1], [30, 0])}px)`,
          opacity: ctaProgress,
        }}
      >
        {/* Outer Shell */}
        <div
          style={{
            padding: 4,
            borderRadius: 9999,
            background:
              "linear-gradient(135deg, rgba(0, 240, 255, 0.6) 0%, rgba(16, 185, 129, 0.6) 100%)",
            boxShadow:
              "0 20px 50px rgba(0, 240, 255, 0.35), 0 0 80px rgba(16, 185, 129, 0.25)",
          }}
        >
          {/* Inner Core */}
          <div
            style={{
              padding: "18px 44px",
              borderRadius: 9999,
              background: "#080B11",
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            <span
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: "#FFFFFF",
                letterSpacing: "-0.01em",
              }}
            >
              Get 50 Verified Signals Free
            </span>
            {/* Button-in-Button Arrow */}
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #00F0FF 0%, #10B981 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#050609",
                fontWeight: 900,
                fontSize: 18,
              }}
            >
              →
            </div>
          </div>
        </div>
      </div>

      {/* Website URL lockup */}
      <div
        style={{
          marginTop: 28,
          zIndex: 10,
          fontSize: 18,
          fontFamily: "monospace",
          letterSpacing: "0.15em",
          color: "#9CA3AF",
          opacity: ctaProgress,
        }}
      >
        <span style={{ color: "#00F0FF" }}>https://</span>signalharbor.com
      </div>
    </div>
  );
};
