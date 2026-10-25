import React from "react";
import { Sequence, AbsoluteFill } from "remotion";
import { Scene1Crisis } from "./scenes/Scene1Crisis";
import { Scene2SpatialHarvest } from "./scenes/Scene2SpatialHarvest";
import { Scene3EvidenceEngine } from "./scenes/Scene3EvidenceEngine";
import { Scene4RelationshipGraph } from "./scenes/Scene4RelationshipGraph";
import { Scene5ClimaxOutro } from "./scenes/Scene5ClimaxOutro";
import { CinematicOverlay } from "./components/CinematicOverlay";

export const SignalHarborAd: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#030408",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Outfit", sans-serif',
      }}
    >
      {/* Scene 1: The Crisis & Blacklist Hook (Frames 0 - 160) */}
      <Sequence from={0} durationInFrames={160}>
        <Scene1Crisis />
      </Sequence>

      {/* Scene 2: 3D Spatial Harvest with Three.js Globe (Frames 145 - 395) */}
      <Sequence from={145} durationInFrames={250}>
        <Scene2SpatialHarvest />
      </Sequence>

      {/* Scene 3: Evidence Engine & Mathematical Proof Card (Frames 380 - 630) */}
      <Sequence from={380} durationInFrames={250}>
        <Scene3EvidenceEngine />
      </Sequence>

      {/* Scene 4: 3D Relationship Network & Entity Discovery (Frames 615 - 765) */}
      <Sequence from={615} durationInFrames={150}>
        <Scene4RelationshipGraph />
      </Sequence>

      {/* Scene 5: Volumetric Climax & SignalHarbor Brand Outro (Frames 750 - 900) */}
      <Sequence from={750} durationInFrames={150}>
        <Scene5ClimaxOutro />
      </Sequence>

      {/* Persistent Cinematic Mission HUD & Anamorphic Letterbox Overlays */}
      <CinematicOverlay />
    </AbsoluteFill>
  );
};
