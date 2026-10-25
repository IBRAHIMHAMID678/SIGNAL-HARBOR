import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from "remotion";

export const Scene1Crisis: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Camera 3D forward dolly & impact shake
  const cameraZ = interpolate(frame, [0, 40, 160], [-80, 0, 180], {
    extrapolateRight: "clamp",
  });
  const cameraPitch = interpolate(frame, [0, 30, 160], [12, 4, -2]);

  // Impact screen shake on title drop (frames 15-30)
  const shakeIntensity = interpolate(frame, [14, 18, 32], [0, 8, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const shakeX = Math.sin(frame * 45) * shakeIntensity;
  const shakeY = Math.cos(frame * 35) * shakeIntensity;

  // Staggered Title Animations
  const title1Spring = spring({
    frame: frame - 6,
    fps,
    config: { damping: 10, mass: 0.6, stiffness: 180 },
  });
  const title2Spring = spring({
    frame: frame - 18,
    fps,
    config: { damping: 9, mass: 0.5, stiffness: 220 },
  });

  // Staggered Hazard Cards
  const card1Progress = spring({
    frame: frame - 38,
    fps,
    config: { damping: 12, mass: 0.7, stiffness: 140 },
  });
  const card2Progress = spring({
    frame: frame - 52,
    fps,
    config: { damping: 12, mass: 0.7, stiffness: 140 },
  });
  const card3Progress = spring({
    frame: frame - 66,
    fps,
    config: { damping: 12, mass: 0.7, stiffness: 140 },
  });

  // Scene exit fade
  const sceneOpacity = interpolate(frame, [142, 160], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "#030407",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        perspective: 1100,
        opacity: sceneOpacity,
        transform: `translate(${shakeX}px, ${shakeY}px)`,
      }}
    >
      {/* Background Volumetric Hazard Nebula */}
      <div
        style={{
          position: "absolute",
          width: 1300,
          height: 1300,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(255, 0, 85, 0.22) 0%, rgba(255, 77, 0, 0.08) 40%, transparent 70%)",
          filter: "blur(90px)",
          transform: `scale(${1 + Math.sin(frame * 0.1) * 0.08})`,
        }}
      />

      {/* 3D Cyberpunk Horizon Grid */}
      <div
        style={{
          position: "absolute",
          bottom: -160,
          width: "250%",
          height: 700,
          background:
            "linear-gradient(to top, rgba(255, 0, 85, 0.18) 1px, transparent 1px), linear-gradient(to right, rgba(255, 0, 85, 0.18) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          transform: "rotateX(78deg)",
          transformOrigin: "bottom center",
          opacity: 0.5,
          maskImage: "linear-gradient(to top, black 30%, transparent 95%)",
          WebkitMaskImage: "linear-gradient(to top, black 30%, transparent 95%)",
        }}
      />

      {/* Floating Warning Ticker Ribbon (Tilted Across Background) */}
      <div
        style={{
          position: "absolute",
          top: "30%",
          width: "120%",
          transform: "rotate(-3deg) translateY(-50%)",
          backgroundColor: "rgba(255, 0, 85, 0.12)",
          borderTop: "1px solid rgba(255, 0, 85, 0.3)",
          borderBottom: "1px solid rgba(255, 0, 85, 0.3)",
          padding: "8px 0",
          overflow: "hidden",
          whiteSpace: "nowrap",
          opacity: 0.45,
          display: "flex",
          gap: 32,
        }}
      >
        <div
          style={{
            fontFamily: "monospace",
            fontSize: 14,
            fontWeight: 800,
            color: "#FF3366",
            letterSpacing: "0.25em",
            transform: `translateX(-${(frame * 3) % 400}px)`,
          }}
        >
          /// CRITICAL OUTBOUND DEGRADATION DETECTED /// DOMAIN BURN ACCELERATING /// 94.2% SCRAPED EMAILS EXPIRED /// SPAM TRAP TRIPPED ///
        </div>
      </div>

      {/* Main 3D Stage Container */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          transform: `translateZ(${cameraZ}px) rotateX(${cameraPitch}deg)`,
          transformStyle: "preserve-3d",
          width: 1400,
        }}
      >
        {/* Tactical Status Pill */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            padding: "8px 18px",
            borderRadius: 100,
            backgroundColor: "rgba(255, 0, 85, 0.15)",
            border: "1px solid rgba(255, 0, 85, 0.5)",
            boxShadow: "0 0 30px rgba(255, 0, 85, 0.3)",
            marginBottom: 24,
            transform: `scale(${interpolate(title1Spring, [0, 1], [0.7, 1])})`,
            opacity: interpolate(title1Spring, [0, 1], [0, 1]),
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor: "#FF0055",
              boxShadow: "0 0 10px #FF0055",
            }}
          />
          <span
            style={{
              fontFamily: "monospace",
              fontSize: 13,
              fontWeight: 800,
              color: "#FFA3B8",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
            }}
          >
            HAZARD PROTOCOL // B2B BLINDSPOT ACTIVE
          </span>
        </div>

        {/* Massive Kinetic Typography */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          {/* Line 1 */}
          <div
            style={{
              fontSize: 68,
              fontWeight: 900,
              letterSpacing: "-0.03em",
              color: "#FFFFFF",
              textTransform: "uppercase",
              transform: `translateY(${interpolate(title1Spring, [0, 1], [40, 0])}px) scale(${interpolate(title1Spring, [0, 1], [0.9, 1])})`,
              opacity: interpolate(title1Spring, [0, 1], [0, 1]),
              filter: `blur(${interpolate(title1Spring, [0, 1], [10, 0])}px)`,
              textShadow: "0 4px 30px rgba(0,0,0,0.8)",
            }}
          >
            Your Outbound Machine Is
          </div>

          {/* Line 2 with Glitch RGB Split */}
          <div
            style={{
              fontSize: 88,
              fontWeight: 950,
              letterSpacing: "-0.04em",
              color: "#FF0055",
              textTransform: "uppercase",
              transform: `translateY(${interpolate(title2Spring, [0, 1], [50, 0])}px) scale(${interpolate(title2Spring, [0, 1], [0.85, 1])})`,
              opacity: interpolate(title2Spring, [0, 1], [0, 1]),
              filter: `blur(${interpolate(title2Spring, [0, 1], [14, 0])}px)`,
              textShadow:
                "0 0 40px rgba(255, 0, 85, 0.7), -3px 0 #00F0FF, 3px 0 #FF0055",
            }}
          >
            FLYING BLIND.
          </div>
        </div>

        {/* 3 Floating 3D Holographic Hazard Glass Cards */}
        <div
          style={{
            display: "flex",
            gap: 28,
            width: "100%",
            maxWidth: 1280,
            justifyContent: "center",
          }}
        >
          {/* Card 1 */}
          <div
            style={{
              flex: 1,
              background:
                "linear-gradient(135deg, rgba(255, 0, 85, 0.12) 0%, rgba(15, 7, 12, 0.85) 100%)",
              border: "1px solid rgba(255, 0, 85, 0.4)",
              borderRadius: 20,
              padding: "28px 24px",
              boxShadow:
                "0 20px 50px rgba(0,0,0,0.8), 0 0 35px rgba(255, 0, 85, 0.15)",
              backdropFilter: "blur(20px)",
              transform: `translateY(${interpolate(card1Progress, [0, 1], [80, 0])}px) rotateY(${interpolate(card1Progress, [0, 1], [-15, -4])}deg) scale(${card1Progress})`,
              opacity: card1Progress,
            }}
          >
            <div
              style={{
                fontFamily: "monospace",
                fontSize: 12,
                fontWeight: 800,
                color: "#FF3366",
                letterSpacing: "0.15em",
                marginBottom: 10,
              }}
            >
              [TRAP 01 // DELIVERABILITY]
            </div>
            <div
              style={{
                fontSize: 38,
                fontWeight: 900,
                color: "#FFFFFF",
                marginBottom: 8,
              }}
            >
              Domain Burned
            </div>
            <div
              style={{
                fontSize: 14,
                color: "rgba(255, 255, 255, 0.65)",
                lineHeight: 1.5,
                marginBottom: 16,
              }}
            >
              Sending cold sequences to unverified lists destroys your sender
              reputation in days.
            </div>
            <div
              style={{
                fontFamily: "monospace",
                fontSize: 22,
                fontWeight: 800,
                color: "#FF0055",
                backgroundColor: "rgba(255, 0, 85, 0.12)",
                padding: "8px 14px",
                borderRadius: 8,
                border: "1px solid rgba(255, 0, 85, 0.3)",
                display: "inline-block",
              }}
            >
              48.2% Bouncetrap Rate
            </div>
          </div>

          {/* Card 2 */}
          <div
            style={{
              flex: 1,
              background:
                "linear-gradient(135deg, rgba(255, 102, 0, 0.12) 0%, rgba(15, 8, 5, 0.85) 100%)",
              border: "1px solid rgba(255, 102, 0, 0.4)",
              borderRadius: 20,
              padding: "28px 24px",
              boxShadow:
                "0 20px 50px rgba(0,0,0,0.8), 0 0 35px rgba(255, 102, 0, 0.15)",
              backdropFilter: "blur(20px)",
              transform: `translateY(${interpolate(card2Progress, [0, 1], [80, 0])}px) scale(${card2Progress})`,
              opacity: card2Progress,
            }}
          >
            <div
              style={{
                fontFamily: "monospace",
                fontSize: 12,
                fontWeight: 800,
                color: "#FF7700",
                letterSpacing: "0.15em",
                marginBottom: 10,
              }}
            >
              [TRAP 02 // STALE DATA]
            </div>
            <div
              style={{
                fontSize: 38,
                fontWeight: 900,
                color: "#FFFFFF",
                marginBottom: 8,
              }}
            >
              Static Lists Lie
            </div>
            <div
              style={{
                fontSize: 14,
                color: "rgba(255, 255, 255, 0.65)",
                lineHeight: 1.5,
                marginBottom: 16,
              }}
            >
              ZoomInfo & Apollo contact databases are weeks stale. Prospects
              have already moved on.
            </div>
            <div
              style={{
                fontFamily: "monospace",
                fontSize: 22,
                fontWeight: 800,
                color: "#FF7700",
                backgroundColor: "rgba(255, 102, 0, 0.12)",
                padding: "8px 14px",
                borderRadius: 8,
                border: "1px solid rgba(255, 102, 0, 0.3)",
                display: "inline-block",
              }}
            >
              -$2.4M Lost Pipeline
            </div>
          </div>

          {/* Card 3 */}
          <div
            style={{
              flex: 1,
              background:
                "linear-gradient(135deg, rgba(255, 0, 85, 0.12) 0%, rgba(15, 7, 12, 0.85) 100%)",
              border: "1px solid rgba(255, 0, 85, 0.4)",
              borderRadius: 20,
              padding: "28px 24px",
              boxShadow:
                "0 20px 50px rgba(0,0,0,0.8), 0 0 35px rgba(255, 0, 85, 0.15)",
              backdropFilter: "blur(20px)",
              transform: `translateY(${interpolate(card3Progress, [0, 1], [80, 0])}px) rotateY(${interpolate(card3Progress, [0, 1], [15, 4])}deg) scale(${card3Progress})`,
              opacity: card3Progress,
            }}
          >
            <div
              style={{
                fontFamily: "monospace",
                fontSize: 12,
                fontWeight: 800,
                color: "#FF3366",
                letterSpacing: "0.15em",
                marginBottom: 10,
              }}
            >
              [TRAP 03 // HALLUCINATIONS]
            </div>
            <div
              style={{
                fontSize: 38,
                fontWeight: 900,
                color: "#FFFFFF",
                marginBottom: 8,
              }}
            >
              Zero Evidence
            </div>
            <div
              style={{
                fontSize: 14,
                color: "rgba(255, 255, 255, 0.65)",
                lineHeight: 1.5,
                marginBottom: 16,
              }}
            >
              AI scraping engines guess email patterns and fabricate titles. Zero
              provable proof.
            </div>
            <div
              style={{
                fontFamily: "monospace",
                fontSize: 22,
                fontWeight: 800,
                color: "#FF0055",
                backgroundColor: "rgba(255, 0, 85, 0.12)",
                padding: "8px 14px",
                borderRadius: 8,
                border: "1px solid rgba(255, 0, 85, 0.3)",
                display: "inline-block",
              }}
            >
              0.4% Reply Conversion
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
