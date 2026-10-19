import React, { useEffect, useState } from "react";

interface ConfidenceRingProps {
  percentage?: number;
  value?: number;
  label: string;
  size?: number;
  strokeWidth?: number;
  color?: string;
}

export const ConfidenceRing: React.FC<ConfidenceRingProps> = ({
  percentage,
  value,
  label,
  size = 54,
  strokeWidth = 4,
  color = "var(--teal)",
}) => {
  const targetVal = value !== undefined ? value : (percentage !== undefined ? percentage : 0);
  const [currentVal, setCurrentVal] = useState(0);

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setCurrentVal(targetVal);
      return;
    }
    const timer = setTimeout(() => {
      setCurrentVal(targetVal);
    }, 50);
    return () => clearTimeout(timer);
  }, [targetVal]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (currentVal / 100) * circumference;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          {/* Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth={strokeWidth}
          />
          {/* Animated Indicator */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="rgba(0, 240, 168, 0.02)"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{
              transition: "stroke-dashoffset 800ms cubic-bezier(0.16, 1, 0.3, 1)",
              filter: `drop-shadow(0 0 5px ${color})`,
            }}
          />
        </svg>

        {/* Center Percentage */}
        <div
          className="font-mono tabular-nums"
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "11px",
            fontWeight: 700,
            color: "var(--text)",
          }}
        >
          {Math.round(currentVal)}%
        </div>
      </div>

      <div
        style={{
          fontSize: "10px",
          color: "var(--muted)",
          textAlign: "center",
          fontWeight: 500,
          maxWidth: "75px",
          lineHeight: 1.2,
        }}
      >
        {label}
      </div>
    </div>
  );
};
