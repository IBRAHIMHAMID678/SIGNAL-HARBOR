import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from "remotion";
import { KineticTitle } from "../components/KineticTitle";

export const Scene1Crisis: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 3D Camera forward push & tilt
  const cameraZ = interpolate(frame, [0, 150], [0, 300], {
    extrapolateRight: "clamp",
  });
  const cameraRotateX = interpolate(frame, [0, 80, 150], [15, 6, 0]);
  const cameraRotateY = interpolate(frame, [0, 150], [-8, 6]);

  // Flash glitch on start
  const glitchOpacity = frame < 8 ? (frame % 2 === 0 ? 0.35 : 0.85) : 0;

  // Floating Warning Card 1 entrance
  const card1Progress = spring({
    frame: frame - 10,
    fps,
    config: { damping: 14, mass: 0.8, stiffness: 120 },
  });
  // Floating Warning Card 2 entrance
  const card2Progress = spring({
    frame: frame - 25,
    fps,
    config: { damping: 14, mass: 0.8, stiffness: 120 },
  });
  // Floating Warning Card 3 entrance
  const card3Progress = spring({
    frame: frame - 40,
    fps,
    config: { damping: 14, mass: 0.8, stiffness: 120 },
  });

  // Scene fade out at end
  const sceneOpacity = interpolate(frame, [135, 155], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
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
        perspective: 1000,
        opacity: sceneOpacity,
      }}
    >
      {/* Background radial gradient mesh */}
      <div
        style={{
          position: "absolute",
          width: 1400,
          height: 1400,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(239,68,68,0.18) 0%, rgba(220,38,38,0.05) 45%, transparent 70%)",
          filter: "blur(80px)",
          transform: `scale(${1 + Math.sin(frame * 0.08) * 0.1})`,
        }}
      />

      {/* Cyberpunk Grid floor */}
      <div
        style={{
          position: "absolute",
          bottom: -200,
          width: "200%",
          height: 800,
          background:
            "linear-gradient(to top, rgba(239,68,68,0.08) 1px, transparent 1px), linear-gradient(to right, rgba(239,68,68,0.08) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          transform: "rotateX(75deg)",
          transformOrigin: "bottom center",
          opacity: 0.6,
        }}
      />

      {/* Camera 3D Stage container */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          transformStyle: "preserve-3d",
          transform: `translateZ(${cameraZ}px) rotateX(${cameraRotateX}deg) rotateY(${cameraRotateY}deg)`,
        }}
      >
        {/* Eyebrow alert pill */}
        <div
          style={{
            transform: "translateZ(80px)",
            marginBottom: 28,
            padding: "8px 20px",
            borderRadius: 9999,
            backgroundColor: "rgba(239, 68, 68, 0.15)",
            border: "1px solid rgba(239, 68, 68, 0.4)",
            color: "#EF4444",
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            display: "flex",
            alignItems: "center",
            gap: 10,
            boxShadow: "0 0 30px rgba(239, 68, 68, 0.3)",
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor: "#EF4444",
              boxShadow: "0 0 12px #EF4444",
              display: "inline-block",
            }}
          />
          CRITICAL DATA DEGRADATION DETECTED
        </div>

        {/* Massive Kinetic Typography */}
        <div style={{ transform: "translateZ(120px)", zIndex: 10 }}>
          <KineticTitle
            words={["Your", "SDRs", "Aren't", "Booking", "Meetings."]}
            startFrame={10}
            highlightIndices={[1, 4]}
            highlightColor="#EF4444"
            fontSize={64}
          />
          <div style={{ height: 16 }} />
          <KineticTitle
            words={["They're", "Paying", "To", "Train", "Spam", "Filters."]}
            startFrame={35}
            highlightIndices={[4, 5]}
            highlightColor="#F87171"
            fontSize={54}
          />
        </div>

        {/* 3D Floating Error Cards */}
        {/* Card 1: Domain Blacklist */}
        <div
          style={{
            position: "absolute",
            left: "8%",
            top: "22%",
            width: 380,
            padding: 24,
            borderRadius: 20,
            background: "rgba(18, 9, 12, 0.75)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(239, 68, 68, 0.35)",
            boxShadow:
              "0 20px 50px rgba(0,0,0,0.8), inset 0 1px 1px rgba(255,255,255,0.1), 0 0 40px rgba(239,68,68,0.2)",
            transform: `translateZ(${interpolate(card1Progress, [0, 1], [-200, 60])}px) rotateY(18deg) rotateX(-8deg) scale(${card1Progress})`,
            opacity: card1Progress,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ color: "#EF4444", fontSize: 13, fontWeight: 700, letterSpacing: "0.1em" }}>
              SMTP FAILURE #550
            </span>
            <span style={{ fontSize: 12, color: "#9CA3AF", fontFamily: "monospace" }}>0.01s ago</span>
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#FFFFFF", marginBottom: 8 }}>
            Recipient Mailbox Disabled
          </div>
          <div style={{ fontSize: 13, color: "#9CA3AF", fontFamily: "monospace", lineHeight: 1.5 }}>
            user_id: <span style={{ color: "#FCA5A5" }}>alex.mercer@stale-corp.com</span>
            <br />
            MX lookup: <span style={{ color: "#EF4444" }}>NXDOMAIN</span>
          </div>
          <div
            style={{
              marginTop: 14,
              padding: "6px 12px",
              background: "rgba(239, 68, 68, 0.2)",
              borderRadius: 8,
              color: "#FCA5A5",
              fontSize: 12,
              fontWeight: 600,
              display: "inline-block",
            }}
          >
            42.8% Outbound Bounce Rate
          </div>
        </div>

        {/* Card 2: Domain Reputation Tanking */}
        <div
          style={{
            position: "absolute",
            right: "8%",
            top: "28%",
            width: 360,
            padding: 24,
            borderRadius: 20,
            background: "rgba(18, 9, 12, 0.75)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(239, 68, 68, 0.35)",
            boxShadow:
              "0 20px 50px rgba(0,0,0,0.8), inset 0 1px 1px rgba(255,255,255,0.1), 0 0 40px rgba(239,68,68,0.2)",
            transform: `translateZ(${interpolate(card2Progress, [0, 1], [-250, 40])}px) rotateY(-22deg) rotateX(10deg) scale(${card2Progress})`,
            opacity: card2Progress,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ color: "#EF4444", fontSize: 13, fontWeight: 700, letterSpacing: "0.1em" }}>
              DOMAIN HEALTH
            </span>
            <span style={{ color: "#EF4444", fontSize: 14, fontWeight: 800 }}>ALERT</span>
          </div>
          <div style={{ fontSize: 36, fontWeight: 900, color: "#EF4444", fontFamily: "monospace", marginBottom: 6 }}>
            24 / 100
          </div>
          <div style={{ fontSize: 13, color: "#F87171", lineHeight: 1.4 }}>
            Spamhaus Listing Imminent. Secondary sending pools suspended.
          </div>
        </div>

        {/* Card 3: Wasted SDR Hours */}
        <div
          style={{
            position: "absolute",
            bottom: "10%",
            width: 480,
            padding: "16px 28px",
            borderRadius: 16,
            background: "rgba(10, 10, 15, 0.85)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.1)",
            boxShadow: "0 20px 40px rgba(0,0,0,0.7)",
            transform: `translateZ(${interpolate(card3Progress, [0, 1], [-100, 100])}px) scale(${card3Progress})`,
            opacity: card3Progress,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                backgroundColor: "#EF4444",
                boxShadow: "0 0 14px #EF4444",
              }}
            />
            <div style={{ fontSize: 15, color: "#D1D5DB", fontWeight: 600 }}>
              Legacy Data Providers: <span style={{ color: "#FFFFFF" }}>$15,000 Contract</span>
            </div>
          </div>
          <div style={{ fontSize: 14, color: "#EF4444", fontWeight: 700, fontFamily: "monospace" }}>
            38% STALE LEADS
          </div>
        </div>
      </div>

      {/* Glitch Overlay */}
      {glitchOpacity > 0 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: "rgba(239, 68, 68, 0.15)",
            mixBlendMode: "overlay",
            pointerEvents: "none",
          }}
        />
      )}
    </div>
  );
};
