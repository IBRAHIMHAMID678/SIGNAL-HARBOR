import React, { useRef, useState } from "react";
import { Player, type PlayerRef } from "@remotion/player";
import { SignalHarborAd } from "../video/SignalHarborAd";
import { X } from "../Icons";

interface AdCinemaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdCinemaModal: React.FC<AdCinemaModalProps> = ({
  isOpen,
  onClose,
}) => {
  const playerRef = useRef<PlayerRef>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleJumpTo = (frame: number) => {
    if (playerRef.current) {
      playerRef.current.seekTo(frame);
      playerRef.current.play();
    }
  };

  const copyCommand = () => {
    navigator.clipboard.writeText(
      "npx remotion render src/video/index.ts SignalHarborAd out/signalharbor_ad.mp4"
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        backgroundColor: "rgba(3, 4, 7, 0.88)",
        backdropFilter: "blur(24px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        animation: "fadeIn 0.25s ease-out",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 1240,
          background: "#080B12",
          border: "1px solid rgba(0, 240, 255, 0.2)",
          borderRadius: 24,
          overflow: "hidden",
          boxShadow:
            "0 30px 100px rgba(0,0,0,0.95), 0 0 80px rgba(0, 240, 255, 0.15)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: "18px 24px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "rgba(10, 14, 24, 0.6)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                backgroundColor: "#00F0FF",
                boxShadow: "0 0 10px #00F0FF",
              }}
            />
            <div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  color: "#FFFFFF",
                  letterSpacing: "-0.01em",
                }}
              >
                SignalHarbor — 3D Motion Commercial
              </div>
              <div style={{ fontSize: 12, color: "#9CA3AF" }}>
                Programmatic Video rendered with Remotion (1920x1080 @ 30 FPS • 30s)
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <a
              href="/signalharbor_ad.mp4"
              download="signalharbor_ad.mp4"
              target="_blank"
              rel="noreferrer"
              style={{
                padding: "8px 14px",
                borderRadius: 10,
                backgroundColor: "rgba(0, 240, 255, 0.15)",
                border: "1px solid rgba(0, 240, 255, 0.4)",
                color: "#00F0FF",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "monospace",
                display: "flex",
                alignItems: "center",
                gap: 6,
                textDecoration: "none",
                boxShadow: "0 0 15px rgba(0, 240, 255, 0.2)",
              }}
            >
              ⬇ Download MP4 (38.9MB)
            </a>
            <button
              onClick={copyCommand}
              style={{
                padding: "8px 14px",
                borderRadius: 10,
                backgroundColor: "rgba(255, 255, 255, 0.06)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                color: copied ? "#10B981" : "#D1D5DB",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "monospace",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {copied ? "✓ Copied Render Command" : "Copy MP4 Render CLI"}
            </button>
            <button
              onClick={onClose}
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: "rgba(255, 255, 255, 0.06)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                color: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Remotion Player Container */}
        <div
          style={{
            position: "relative",
            width: "100%",
            aspectRatio: "16 / 9",
            backgroundColor: "#050608",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Player
            ref={playerRef}
            component={SignalHarborAd}
            durationInFrames={900}
            compositionWidth={1920}
            compositionHeight={1080}
            fps={30}
            style={{
              width: "100%",
              height: "100%",
            }}
            controls
            autoPlay
            loop
            acknowledgeRemotionLicense
          />
        </div>

        {/* Scene Jump Bar */}
        <div
          style={{
            padding: "14px 20px",
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "rgba(10, 14, 24, 0.8)",
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <div style={{ fontSize: 13, color: "#9CA3AF", fontWeight: 600 }}>
            Jump to Scene:
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[
              { label: "0:00 The Crisis Hook", frame: 0, color: "#EF4444" },
              { label: "0:05 3D Spatial Harvest", frame: 145, color: "#00F0FF" },
              { label: "0:13 Evidence & Confidence", frame: 380, color: "#10B981" },
              { label: "0:20 Relationship Graph", frame: 615, color: "#8B5CF6" },
              { label: "0:25 Climax & Outro", frame: 750, color: "#00F0FF" },
            ].map((scene) => (
              <button
                key={scene.frame}
                onClick={() => handleJumpTo(scene.frame)}
                style={{
                  padding: "6px 14px",
                  borderRadius: 8,
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  border: `1px solid ${scene.color}40`,
                  color: "#FFFFFF",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  transition: "all 0.15s ease",
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    backgroundColor: scene.color,
                  }}
                />
                {scene.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
