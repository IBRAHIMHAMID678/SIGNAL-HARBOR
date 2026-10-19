import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";

interface KineticTitleProps {
  words: string[];
  startFrame?: number;
  highlightIndices?: number[];
  highlightColor?: string;
  fontSize?: number;
  letterSpacing?: string;
  textAlign?: "center" | "left" | "right";
}

export const KineticTitle: React.FC<KineticTitleProps> = ({
  words,
  startFrame = 0,
  highlightIndices = [],
  highlightColor = "#00f0ff",
  fontSize = 64,
  letterSpacing = "-0.03em",
  textAlign = "center",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: textAlign === "center" ? "center" : textAlign === "right" ? "flex-end" : "flex-start",
        gap: "0.3em",
        textAlign,
        maxWidth: 1400,
        margin: "0 auto",
      }}
    >
      {words.map((word, i) => {
        const wordDelay = startFrame + i * 4;
        const progress = spring({
          frame: frame - wordDelay,
          fps,
          config: { damping: 12, mass: 0.6, stiffness: 140 },
        });

        const translateY = interpolate(progress, [0, 1], [40, 0]);
        const opacity = interpolate(progress, [0, 1], [0, 1]);
        const scale = interpolate(progress, [0, 1], [0.85, 1]);
        const blur = interpolate(progress, [0, 1], [10, 0]);

        const isHighlighted = highlightIndices.includes(i);

        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              fontSize,
              fontWeight: 800,
              letterSpacing,
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Outfit", sans-serif',
              color: isHighlighted ? highlightColor : "#FFFFFF",
              transform: `translateY(${translateY}px) scale(${scale})`,
              opacity,
              filter: `blur(${blur}px)`,
              textShadow: isHighlighted
                ? `0 0 40px ${highlightColor}88, 0 0 80px ${highlightColor}44`
                : "0 4px 20px rgba(0,0,0,0.8)",
              willChange: "transform, opacity, filter",
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
};
