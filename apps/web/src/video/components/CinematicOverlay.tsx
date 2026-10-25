import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";

export const CinematicOverlay: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Timecode calculation
  const totalSeconds = Math.floor(frame / fps);
  const framesMod = frame % fps;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const timecode = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}:${String(framesMod).padStart(2, "0")}`;

  // Glitch flash on scene cut frames
  const isCutFrame = [0, 145, 380, 615, 750].some(
    (cut) => frame >= cut && frame <= cut + 4
  );
  const cutGlitch = isCutFrame ? (frame % 2 === 0 ? 0.35 : 0.7) : 0;

  // Scanline sweep
  const scanlineY = (frame * 12) % 1080;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 100,
        overflow: "hidden",
      }}
    >
      {/* Glitch Cut Flash */}
      {cutGlitch > 0 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: "#00F0FF",
            opacity: cutGlitch * 0.25,
            mixBlendMode: "screen",
          }}
        />
      )}

      {/* Subtle CRT Scanline */}
      <div
        style={{
          position: "absolute",
          top: scanlineY,
          left: 0,
          right: 0,
          height: 3,
          background:
            "linear-gradient(90deg, transparent, rgba(0, 240, 255, 0.4), transparent)",
          opacity: 0.6,
        }}
      />

      {/* Top Anamorphic Cinema Bar & Mission HUD */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 64,
          background: "linear-gradient(180deg, #020306 80%, transparent)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 48px",
          borderBottom: "1px solid rgba(0, 240, 255, 0.15)",
        }}
      >
        {/* Left Telemetry */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "4px 10px",
              borderRadius: 4,
              backgroundColor: "rgba(255, 0, 85, 0.15)",
              border: "1px solid rgba(255, 0, 85, 0.4)",
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: "#FF0055",
                boxShadow: "0 0 10px #FF0055",
                opacity: frame % 30 < 15 ? 1 : 0.3,
              }}
            />
            <span
              style={{
                fontFamily: "monospace",
                fontSize: 11,
                fontWeight: 800,
                color: "#FF3366",
                letterSpacing: "0.1em",
              }}
            >
              REC ● {timecode}
            </span>
          </div>

          <span
            style={{
              fontFamily: "monospace",
              fontSize: 12,
              fontWeight: 700,
              color: "rgba(255, 255, 255, 0.6)",
              letterSpacing: "0.15em",
            }}
          >
            SIGNAL_HARBOR // DEEP_RECON_V4
          </span>
        </div>

        {/* Center Live Threat / Signal Monitor */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontFamily: "monospace",
            fontSize: 11,
            color: "#00F0FF",
            letterSpacing: "0.1em",
          }}
        >
          <span style={{ color: "rgba(255, 255, 255, 0.4)" }}>
            [SPECTRAL DENSITY:
          </span>
          <div
            style={{
              display: "flex",
              gap: 2,
              alignItems: "center",
              height: 12,
            }}
          >
            {[4, 8, 12, 10, 6, 14, 18, 9, 15, 7, 11].map((h, i) => (
              <div
                key={i}
                style={{
                  width: 3,
                  height: Math.max(
                    2,
                    (h + Math.sin(frame * 0.2 + i) * 6) % 16
                  ),
                  backgroundColor: i > 7 ? "#FF0055" : "#00F0FF",
                  borderRadius: 1,
                }}
              />
            ))}
          </div>
          <span style={{ color: "rgba(255, 255, 255, 0.4)" }}>]</span>
        </div>

        {/* Right System Status */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            fontFamily: "monospace",
            fontSize: 11,
            letterSpacing: "0.1em",
          }}
        >
          <span style={{ color: "rgba(255, 255, 255, 0.5)" }}>
            SATELLITE_FEED:{" "}
            <strong style={{ color: "#00FF88" }}>LOCKED</strong>
          </span>
          <span style={{ color: "rgba(255, 255, 255, 0.5)" }}>
            LATENCY: <strong style={{ color: "#00F0FF" }}>11ms</strong>
          </span>
        </div>
      </div>

      {/* Bottom Anamorphic Cinema Bar */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 56,
          background: "linear-gradient(0deg, #020306 85%, transparent)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 48px",
          borderTop: "1px solid rgba(0, 240, 255, 0.12)",
        }}
      >
        <div
          style={{
            fontFamily: "monospace",
            fontSize: 11,
            color: "rgba(255, 255, 255, 0.45)",
            letterSpacing: "0.15em",
          }}
        >
          TARGET_COORDINATES:{" "}
          <span style={{ color: "#00F0FF" }}>
            37.7749° N, 122.4194° W [GLOBAL_MESH]
          </span>
        </div>

        {/* Timeline progress line */}
        <div
          style={{
            width: 320,
            height: 4,
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            borderRadius: 2,
            overflow: "hidden",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              height: "100%",
              width: `${(frame / durationInFrames) * 100}%`,
              background: "linear-gradient(90deg, #00F0FF, #00FF88)",
              boxShadow: "0 0 10px #00F0FF",
            }}
          />
        </div>

        <div
          style={{
            fontFamily: "monospace",
            fontSize: 11,
            color: "rgba(255, 255, 255, 0.45)",
            letterSpacing: "0.15em",
          }}
        >
          SECURITY: <span style={{ color: "#00FF88" }}>ZERO-LEAK VERIFIED</span>
        </div>
      </div>

      {/* Corner HUD Brackets */}
      {/* Top Left */}
      <div
        style={{
          position: "absolute",
          top: 80,
          left: 48,
          width: 24,
          height: 24,
          borderTop: "2px solid rgba(0, 240, 255, 0.7)",
          borderLeft: "2px solid rgba(0, 240, 255, 0.7)",
        }}
      />
      {/* Top Right */}
      <div
        style={{
          position: "absolute",
          top: 80,
          right: 48,
          width: 24,
          height: 24,
          borderTop: "2px solid rgba(0, 240, 255, 0.7)",
          borderRight: "2px solid rgba(0, 240, 255, 0.7)",
        }}
      />
      {/* Bottom Left */}
      <div
        style={{
          position: "absolute",
          bottom: 72,
          left: 48,
          width: 24,
          height: 24,
          borderBottom: "2px solid rgba(0, 240, 255, 0.7)",
          borderLeft: "2px solid rgba(0, 240, 255, 0.7)",
        }}
      />
      {/* Bottom Right */}
      <div
        style={{
          position: "absolute",
          bottom: 72,
          right: 48,
          width: 24,
          height: 24,
          borderBottom: "2px solid rgba(0, 240, 255, 0.7)",
          borderRight: "2px solid rgba(0, 240, 255, 0.7)",
        }}
      />
    </div>
  );
};
