import React from "react";
import { Composition } from "remotion";
import { SignalHarborAd } from "./SignalHarborAd";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* Primary Landscape 16:9 Ad (YouTube, Twitter/X, LinkedIn, Desktop) */}
      <Composition
        id="SignalHarborAd"
        component={SignalHarborAd}
        durationInFrames={900}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{}}
      />
    </>
  );
};
