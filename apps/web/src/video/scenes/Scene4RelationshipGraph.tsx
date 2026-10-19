import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from "remotion";
import { KineticTitle } from "../components/KineticTitle";

export const Scene4RelationshipGraph: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Scene transition
  const sceneOpacity = interpolate(frame, [0, 20, 135, 150], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // 3D Perspective rotation & pan
  const camRotateX = interpolate(frame, [0, 75, 150], [15, 0, -10]);
  const camRotateY = interpolate(frame, [0, 150], [-18, 12]);
  const camScale = interpolate(frame, [0, 75, 150], [0.92, 1, 1.08]);

  // Graph nodes animation
  const nodeCompany = spring({ frame: frame - 5, fps, config: { damping: 12 } });
  const node1 = spring({ frame: frame - 18, fps, config: { damping: 12 } });
  const node2 = spring({ frame: frame - 28, fps, config: { damping: 12 } });
  const node3 = spring({ frame: frame - 38, fps, config: { damping: 12 } });
  const node4 = spring({ frame: frame - 48, fps, config: { damping: 12 } });

  // Floating sync card
  const syncCardProgress = spring({
    frame: frame - 60,
    fps,
    config: { damping: 14, mass: 0.8, stiffness: 100 },
  });

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
      {/* Background ambient lighting */}
      <div
        style={{
          position: "absolute",
          width: 900,
          height: 900,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, rgba(0, 240, 255, 0.08) 50%, transparent 70%)",
          filter: "blur(100px)",
        }}
      />

      {/* Top Headline */}
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
            backgroundColor: "rgba(139, 92, 246, 0.12)",
            border: "1px solid rgba(139, 92, 246, 0.35)",
            color: "#A78BFA",
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            marginBottom: 16,
            boxShadow: "0 0 30px rgba(139, 92, 246, 0.25)",
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor: "#A78BFA",
              boxShadow: "0 0 10px #A78BFA",
            }}
          />
          GRAPH-BASED ENTITY INTELLIGENCE
        </div>
        <KineticTitle
          words={["Uncover", "Entire", "Buying", "Committees", "Instantly."]}
          startFrame={5}
          highlightIndices={[2, 3, 4]}
          highlightColor="#A78BFA"
          fontSize={52}
        />
      </div>

      {/* 3D Graph Container */}
      <div
        style={{
          position: "relative",
          width: 1000,
          height: 600,
          marginTop: 60,
          transformStyle: "preserve-3d",
          transform: `rotateX(${camRotateX}deg) rotateY(${camRotateY}deg) scale(${camScale})`,
        }}
      >
        {/* SVG Bezier Lines connecting nodes */}
        <svg
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
          }}
        >
          {/* Company (500, 300) to Node 1 (220, 160) */}
          <line
            x1="500"
            y1="300"
            x2="220"
            y2="160"
            stroke="rgba(0, 240, 255, 0.4)"
            strokeWidth="2"
            strokeDasharray="6 6"
          />
          {/* Company (500, 300) to Node 2 (780, 160) */}
          <line
            x1="500"
            y1="300"
            x2="780"
            y2="160"
            stroke="rgba(16, 185, 129, 0.4)"
            strokeWidth="2"
            strokeDasharray="6 6"
          />
          {/* Company (500, 300) to Node 3 (260, 440) */}
          <line
            x1="500"
            y1="300"
            x2="260"
            y2="440"
            stroke="rgba(139, 92, 246, 0.4)"
            strokeWidth="2"
            strokeDasharray="6 6"
          />
          {/* Company (500, 300) to Node 4 (740, 440) */}
          <line
            x1="500"
            y1="300"
            x2="740"
            y2="440"
            stroke="rgba(0, 240, 255, 0.4)"
            strokeWidth="2"
            strokeDasharray="6 6"
          />

          {/* Traveling Pulse Circle along line 1 */}
          <circle
            cx={interpolate(frame % 30, [0, 30], [500, 220])}
            cy={interpolate(frame % 30, [0, 30], [300, 160])}
            r="4"
            fill="#00F0FF"
            filter="drop-shadow(0 0 8px #00F0FF)"
          />
          {/* Traveling Pulse Circle along line 2 */}
          <circle
            cx={interpolate((frame + 12) % 30, [0, 30], [500, 780])}
            cy={interpolate((frame + 12) % 30, [0, 30], [300, 160])}
            r="4"
            fill="#10B981"
            filter="drop-shadow(0 0 8px #10B981)"
          />
        </svg>

        {/* Central Company Node */}
        <div
          style={{
            position: "absolute",
            left: 500,
            top: 300,
            transform: `translate(-50%, -50%) translateZ(40px) scale(${nodeCompany})`,
            padding: "20px 32px",
            borderRadius: 24,
            background: "rgba(10, 16, 28, 0.9)",
            border: "2px solid #00F0FF",
            boxShadow:
              "0 0 50px rgba(0, 240, 255, 0.4), inset 0 1px 1px rgba(255,255,255,0.2)",
            textAlign: "center",
            zIndex: 10,
          }}
        >
          <div style={{ fontSize: 12, color: "#00F0FF", fontWeight: 700, letterSpacing: "0.15em" }}>
            ACCOUNT ENTITY
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#FFFFFF", marginTop: 4 }}>
            Scale AI
          </div>
          <div style={{ fontSize: 13, color: "#9CA3AF", marginTop: 2 }}>
            $7.3B Valuation • 850 Employees
          </div>
        </div>

        {/* Node 1: Sarah Chen (VP Engineering) */}
        <div
          style={{
            position: "absolute",
            left: 220,
            top: 160,
            transform: `translate(-50%, -50%) translateZ(20px) scale(${node1})`,
            padding: "14px 22px",
            borderRadius: 18,
            background: "rgba(9, 13, 20, 0.85)",
            border: "1px solid rgba(0, 240, 255, 0.35)",
            boxShadow: "0 15px 35px rgba(0,0,0,0.7)",
          }}
        >
          <div style={{ fontSize: 11, color: "#10B981", fontWeight: 700 }}>99.4% CONFIDENCE</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#FFFFFF" }}>Sarah Chen</div>
          <div style={{ fontSize: 12, color: "#9CA3AF" }}>VP Platform Eng</div>
        </div>

        {/* Node 2: CTO */}
        <div
          style={{
            position: "absolute",
            left: 780,
            top: 160,
            transform: `translate(-50%, -50%) translateZ(20px) scale(${node2})`,
            padding: "14px 22px",
            borderRadius: 18,
            background: "rgba(9, 13, 20, 0.85)",
            border: "1px solid rgba(16, 185, 129, 0.35)",
            boxShadow: "0 15px 35px rgba(0,0,0,0.7)",
          }}
        >
          <div style={{ fontSize: 11, color: "#10B981", fontWeight: 700 }}>98.8% CONFIDENCE</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#FFFFFF" }}>David Thorne</div>
          <div style={{ fontSize: 12, color: "#9CA3AF" }}>Chief Technology Officer</div>
        </div>

        {/* Node 3: Head of Infra */}
        <div
          style={{
            position: "absolute",
            left: 260,
            top: 440,
            transform: `translate(-50%, -50%) translateZ(20px) scale(${node3})`,
            padding: "14px 22px",
            borderRadius: 18,
            background: "rgba(9, 13, 20, 0.85)",
            border: "1px solid rgba(139, 92, 246, 0.35)",
            boxShadow: "0 15px 35px rgba(0,0,0,0.7)",
          }}
        >
          <div style={{ fontSize: 11, color: "#A78BFA", fontWeight: 700 }}>96.2% CONFIDENCE</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#FFFFFF" }}>Elena Rostova</div>
          <div style={{ fontSize: 12, color: "#9CA3AF" }}>Head of Infrastructure</div>
        </div>

        {/* Node 4: SecOps Lead */}
        <div
          style={{
            position: "absolute",
            left: 740,
            top: 440,
            transform: `translate(-50%, -50%) translateZ(20px) scale(${node4})`,
            padding: "14px 22px",
            borderRadius: 18,
            background: "rgba(9, 13, 20, 0.85)",
            border: "1px solid rgba(0, 240, 255, 0.35)",
            boxShadow: "0 15px 35px rgba(0,0,0,0.7)",
          }}
        >
          <div style={{ fontSize: 11, color: "#00F0FF", fontWeight: 700 }}>97.5% CONFIDENCE</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#FFFFFF" }}>Marcus Vance</div>
          <div style={{ fontSize: 12, color: "#9CA3AF" }}>Staff SecOps Lead</div>
        </div>
      </div>

      {/* Floating 1-Click Export Success Notification */}
      <div
        style={{
          position: "absolute",
          bottom: "7%",
          padding: "16px 32px",
          borderRadius: 20,
          background: "rgba(16, 185, 129, 0.15)",
          border: "1px solid rgba(16, 185, 129, 0.4)",
          backdropFilter: "blur(20px)",
          boxShadow:
            "0 20px 40px rgba(0,0,0,0.8), 0 0 50px rgba(16, 185, 129, 0.3)",
          display: "flex",
          alignItems: "center",
          gap: 20,
          transform: `translateY(${interpolate(syncCardProgress, [0, 1], [60, 0])}px) scale(${syncCardProgress})`,
          opacity: syncCardProgress,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            backgroundColor: "#10B981",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#050609",
            fontWeight: 900,
            fontSize: 20,
          }}
        >
          ✓
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#FFFFFF" }}>
            Sync Complete: 1,420 Verified Records Pushed to CRM
          </div>
          <div style={{ fontSize: 13, color: "#6EE7B7", fontFamily: "monospace" }}>
            Projected Bounce Rate: <strong style={{ color: "#FFFFFF" }}>0.0%</strong> • Sender Score
            Protected
          </div>
        </div>
      </div>
    </div>
  );
};
