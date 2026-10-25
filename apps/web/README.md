# SignalHarbor — Web Workspace (`apps/web`)

The official frontend web intelligence console for **SignalHarbor**, built with **React 19**, **TypeScript**, **Vite**, and **Remotion 4.0**.

---

## 🌟 Overview

The `apps/web` workspace delivers a high-density, mission-critical operations console inspired by Palantir and Linear. It allows revenue operations teams, B2B intelligence researchers, and SDR leaders to orchestrate autonomous web harvesting runs, inspect cryptographic prospect evidence, adjust ICP weighting models, manage suppressions, and preview/render 3D programmatic marketing trailers.

---

## 🗂 Directory Structure

```
apps/web/
├── public/                      # Static assets and rendered video distribution
│   └── signalharbor_ad.mp4      # Rendered 1080p commercial file for direct streaming
│
├── src/
│   ├── components/              # Modular UI components
│   │   ├── AdCinemaModal.tsx    # Remotion <Player /> modal with scene jump controls & download
│   │   ├── ConfidenceRing.tsx   # SVG radial score visualizer with neon glow
│   │   ├── CountUp.tsx          # Animated metric counters with spring easing
│   │   ├── Globe3D.tsx          # Three.js interactive recon globe
│   │   ├── RelationshipGraph.tsx# Neural SVG synapse and entity relationship network
│   │   └── TiltCard.tsx         # 3D perspective tilt cards with specular lighting
│   │
│   ├── data/
│   │   └── mockData.ts          # High-fidelity B2B enterprise entities & evidence records
│   │
│   ├── video/                   # Remotion 3D Video Composition Engine
│   │   ├── components/
│   │   │   ├── CinematicOverlay.tsx # 2.39:1 Anamorphic framing & live HUD telemetry
│   │   │   ├── KineticTitle.tsx     # Staggered 3D typography with chromatic aberration
│   │   │   └── ThreeGlobeAd.tsx     # 3D Three.js WebGL globe with orbital gimbal rings
│   │   ├── scenes/
│   │   │   ├── Scene1Crisis.tsx     # Outbound Deliverability Crisis & 3D Hazard Cards
│   │   │   ├── Scene2SpatialHarvest.tsx # Spatial Reconnaissance & Target Lock Telemetry
│   │   │   ├── Scene3EvidenceEngine.tsx # Quantum Holographic Decryption & Proof vectors
│   │   │   ├── Scene4RelationshipGraph.tsx # Volumetric Buying Committee Synapse
│   │   │   └── Scene5ClimaxOutro.tsx   # Explosive Shockwave & Brand Climax
│   │   ├── Root.tsx             # Remotion Composition configuration (1920x1080 @ 30fps)
│   │   ├── SignalHarborAd.tsx   # Master 30s sequence container
│   │   └── index.ts             # Remotion entry point
│   │
│   ├── App.tsx                  # Master application orchestrator with all tabs & modals
│   ├── Icons.tsx                # Clean lightweight SVG icon library
│   ├── index.css                # Dark-mode design system & typography tokens
│   └── main.tsx                 # React 19 root mount
│
├── out/                         # Local render destination for Remotion MP4s & PNG stills
├── remotion.config.ts           # Remotion CLI config (ANGLE GPU, 1x concurrency, JPEG buffers)
├── package.json                 # Web dependencies and Remotion scripts
├── tsconfig.json                # TypeScript compiler configuration
└── vite.config.ts               # Vite bundler configuration with React plugin
```

---

## 🛠 Available NPM Scripts

From the `apps/web` directory:

| Script | Command | Description |
| :--- | :--- | :--- |
| `npm run dev` | `vite` | Starts local Vite dev server at `http://localhost:5173/` with HMR |
| `npm run build` | `tsc -b && vite build` | Typechecks with `tsc` and bundles production assets into `dist/` |
| `npm run lint` | `oxlint` | Runs fast Oxlint static analysis on all source code |
| `npm run preview` | `vite preview` | Serves the production build locally |
| `npm run video:preview` | `remotion preview src/video/index.ts` | Opens Remotion Studio in your browser for timeline scrubbing |
| `npm run video:render` | `remotion render src/video/index.ts SignalHarborAd out/signalharbor_ad.mp4` | Renders the full 1080p MP4 commercial headlessly |

---

## 🎬 Remotion 3D Motion Commercial

The application includes an agency-grade 30-second commercial composition (`SignalHarborAd`):

- **Resolution**: 1920x1080 (16:9 Full HD)
- **Framerate**: 30 FPS (900 Total Frames)
- **Format**: H.264 / AAC MP4

### Scenes Breakdown
1. **Frames 0–160 (Scene 1: The Crisis)**: Shockwave title drop, camera screen shake, and floating 3D hazard cards detailing burned domain deliverability traps.
2. **Frames 145–395 (Scene 2: Spatial Recon)**: High-altitude Three.js WebGL globe with rotating dual-gimbal orbital rings, dense surface particle mesh, and live targeting reticles locking onto Tokyo, London, and San Francisco.
3. **Frames 380–630 (Scene 3: Evidence Decryption)**: Quantum holographic dossier with real-time cryptographic hex hash unscrambling and a 99.8% circular accuracy gauge.
4. **Frames 615–765 (Scene 4: Buyer Synapse)**: 3D neural constellation graph mapping live buying signals to C-suite decision-makers with animated energy pulses.
5. **Frames 750–900 (Scene 5: Trailer Climax)**: Expanding shockwave blast, extruded liquid chrome typography, 10X metric pills, and high-voltage CTA command bar.
6. **Persistent Overlay**: 2.39:1 Anamorphic cinema letterboxing, live timecode `REC ● [00:00:xx]`, and real-time spectral frequency HUD telemetry.

### Viewing the Video
- **Inside the Web App**: Open [http://localhost:5173/](http://localhost:5173/) and click **"Watch 3D Film"** in the top header.
- **Direct MP4 Stream**: Open [http://localhost:5173/signalharbor_ad.mp4](http://localhost:5173/signalharbor_ad.mp4) in any browser or media player.

---

## 🧩 Tech Stack Highlights

- **React 19**: Modern concurrency, hooks, and clean state primitives.
- **Three.js 0.186**: Hardware-accelerated WebGL sphere, particles, and gimbal matrices.
- **Remotion 4.0**: Programmatic video framework uniting React components, frame-driven motion, and headless Chromium MP4 encoding.
- **Vite 8**: Sub-millisecond HMR and lightning-fast developer experience.
