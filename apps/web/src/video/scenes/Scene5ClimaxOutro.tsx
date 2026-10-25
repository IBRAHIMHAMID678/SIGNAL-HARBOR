import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from "remotion";

export const Scene5ClimaxOutro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entrance spring
  const entrance = spring({
    frame,
    fps,
    config: { damping: 12, mass: 0.7, stiffness: 130 },
  });

  // Massive logo scale & 3D forward push
  const logoScale = interpolate(entrance, [0, 1], [0.65, 1]);
  const logoTranslateZ = interpolate(frame, [0, 150], [0, 60]);

  // Expanding shockwave ring
  const shockwave = interpolate(frame, [0, 80], [0, 1400], {
    extrapolateRight: "clamp",
  });
  const shockwaveOpacity = interpolate(frame, [0, 40, 80], [0.8, 0.4, 0]);

  // CTA button spring
  const ctaProgress = spring({
    frame: frame - 25,
    fps,
    config: { damping: 11, mass: 0.6, stiffness: 140 },
  });

  // Metric pills spring
  const pill1 = spring({ frame: frame - 40, fps, config: { damping: 12 } });
  const pill2 = spring({ frame: frame - 52, fps, config: { damping: 12 } });
  const pill3 = spring({ frame: frame - 64, fps, config: { damping: 12 } });

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "#030408",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        perspective: 1200,
      }}
    >
      {/* Background Volumetric Core Glow */}
      <div
        style={{
          position: "absolute",
          width: 1300,
          height: 1300,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(0, 240, 255, 0.22) 0%, rgba(0, 255, 136, 0.12) 35%, transparent 70%)",
          filter: "blur(120px)",
          transform: `scale(${1 + Math.sin(frame * 0.1) * 0.08})`,
        }}
      />

      {/* Explosive Shockwave Ring */}
      <div
        style={{
          position: "absolute",
          width: shockwave,
          height: shockwave,
          borderRadius: "50%",
          border: "2px solid #00F0FF",
          boxShadow: "0 0 60px #00F0FF, inset 0 0 40px #00F0FF",
          opacity: shockwaveOpacity,
          pointerEvents: "none",
        }}
      />

      {/* Cyber Grid Floor */}
      <div
        style={{
          position: "absolute",
          bottom: -200,
          width: "240%",
          height: 700,
          background:
            "linear-gradient(to top, rgba(0, 240, 255, 0.15) 1px, transparent 1px), linear-gradient(to right, rgba(0, 240, 255, 0.15) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          transform: "rotateX(75deg)",
          transformOrigin: "bottom center",
          opacity: 0.5,
        }}
      />

      {/* Main 3D Container */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          transform: `translateZ(${logoTranslateZ}px) scale(${logoScale})`,
          transformStyle: "preserve-3d",
        }}
      >
        {/* Tactical Classification Pill */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            padding: "8px 22px",
            borderRadius: 100,
            backgroundColor: "rgba(0, 240, 255, 0.12)",
            border: "1px solid rgba(0, 240, 255, 0.45)",
            boxShadow: "0 0 30px rgba(0, 240, 255, 0.25)",
            marginBottom: 24,
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
              fontSize: 13,
              fontWeight: 800,
              color: "#00FF88",
              letterSpacing: "0.25em",
              textTransform: "uppercase",
            }}
          >
            DEPLOY AUTONOMOUS DISCOVERY NOW
          </span>
        </div>

        {/* Massive 3D Brand Logo Title */}
        <div
          style={{
            fontSize: 108,
            fontWeight: 950,
            letterSpacing: "-0.045em",
            color: "#FFFFFF",
            textAlign: "center",
            textTransform: "uppercase",
            lineHeight: 0.95,
            marginBottom: 20,
            textShadow:
              "0 0 50px rgba(0, 240, 255, 0.5), 0 0 100px rgba(0, 255, 136, 0.25)",
          }}
        >
          Signal{" "}
          <span
            style={{
              background:
                "linear-gradient(135deg, #00F0FF 0%, #00FF88 50%, #FFFFFF 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Harbor
          </span>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 26,
            fontWeight: 800,
            letterSpacing: "0.08em",
            color: "rgba(255, 255, 255, 0.85)",
            textTransform: "uppercase",
            textAlign: "center",
            marginBottom: 44,
            fontFamily: "monospace",
          }}
        >
          STOP GUESSING. START HARVESTING.
        </div>

        {/* 3 Metric Pills */}
        <div
          style={{
            display: "flex",
            gap: 20,
            marginBottom: 44,
          }}
        >
          {[
            { metric: "10X", label: "Pipeline Velocity", springVal: pill1 },
            { metric: "99.8%", label: "Verified Intent Accuracy", springVal: pill2 },
            { metric: "0%", label: "Domain Burnout Risk", springVal: pill3 },
          ].map((item, i) => (
            <div
              key={i}
              style={{
                background: "rgba(10, 18, 28, 0.75)",
                border: "1px solid rgba(0, 240, 255, 0.25)",
                borderRadius: 16,
                padding: "16px 28px",
                textAlign: "center",
                boxShadow: "0 10px 30px rgba(0,0,0,0.6)",
                transform: `scale(${item.springVal})`,
                opacity: item.springVal,
              }}
            >
              <div
                style={{
                  fontSize: 32,
                  fontWeight: 950,
                  color: "#00F0FF",
                  fontFamily: "monospace",
                }}
              >
                {item.metric}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "rgba(255, 255, 255, 0.65)",
                  marginTop: 4,
                  fontWeight: 700,
                }}
              >
                {item.label}
              </div>
            </div>
          ))}
        </div>

        {/* High-Voltage CTA Command Box */}
        <div
          style={{
            transform: `scale(${ctaProgress})`,
            opacity: ctaProgress,
            position: "relative",
          }}
        >
          <div
            style={{
              padding: "20px 48px",
              borderRadius: 100,
              background:
                "linear-gradient(90deg, #00F0FF 0%, #00FF88 100%)",
              boxShadow:
                "0 0 50px rgba(0, 240, 255, 0.6), 0 0 100px rgba(0, 255, 136, 0.3)",
              display: "flex",
              alignItems: "center",
              gap: 16,
              cursor: "pointer",
            }}
          >
            <span
              style={{
                fontSize: 20,
                fontWeight: 950,
                color: "#030810",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              LAUNCH SIGNAL HARBOR // REQUEST ACCESS
            </span>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                backgroundColor: "#030810",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#00FF88",
                fontWeight: 900,
              }}
            >
              →
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
