import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { ProspectEntity } from "../data/mockData";
import { Play, Pause, Compass, Layers } from "../Icons";

interface Globe3DProps {
  entities: ProspectEntity[];
  onSelectEntity?: (entity: ProspectEntity) => void;
}

// Landmass bounding check (determines if lat/lon falls on continental masses)
function isLandmass(lat: number, lon: number): boolean {
  // North America
  if (lat >= 15 && lat <= 72 && lon >= -168 && lon <= -52) {
    if (lat < 30 && lon < -105) return false;
    return true;
  }
  // South America
  if (lat >= -56 && lat <= 13 && lon >= -82 && lon <= -34) {
    return true;
  }
  // Europe
  if (lat >= 36 && lat <= 71 && lon >= -10 && lon <= 45) {
    return true;
  }
  // Africa
  if (lat >= -35 && lat <= 37 && lon >= -18 && lon <= 51) {
    if (lat > 20 && lon > 35) return false; // Red Sea region
    return true;
  }
  // Asia
  if (lat >= 5 && lat <= 75 && lon >= 45 && lon <= 150) {
    if (lat < 10 && lon < 95) return false; // Indian ocean
    return true;
  }
  // Japan & East Coast islands
  if (lat >= 30 && lat <= 46 && lon >= 129 && lon <= 146) {
    return true;
  }
  // Australia & New Zealand
  if (lat >= -44 && lat <= -10 && lon >= 112 && lon <= 178) {
    if (lat > -38 && lat < -30 && lon > 155 && lon < 165) return false;
    return true;
  }
  // UK & Ireland
  if (lat >= 50 && lat <= 59 && lon >= -11 && lon <= 2) {
    return true;
  }
  return false;
}

// Convert spherical Lat/Lon to 3D Cartesian coordinates
function latLonToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

export const Globe3D: React.FC<Globe3DProps> = ({ entities, onSelectEntity }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredEntity, setHoveredEntity] = useState<ProspectEntity | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [isAutoRotating, setIsAutoRotating] = useState(true);
  const [showArcs, setShowArcs] = useState(true);

  // References to communicate with Three.js loop
  const autoRotateRef = useRef(true);
  autoRotateRef.current = isAutoRotating;

  const showArcsRef = useRef(true);
  showArcsRef.current = showArcs;

  const onSelectEntityRef = useRef(onSelectEntity);
  onSelectEntityRef.current = onSelectEntity;

  const resetCameraRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 680;
    const height = container.clientHeight || 420;

    // 1. Scene, Camera, Renderer
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
    } catch (e) {
      console.warn("WebGL initialization failed:", e);
      return;
    }

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.setClearColor(0xf8fafc, 1);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, width / Math.max(height, 1), 0.1, 1000);
    camera.position.set(0, 0.4, 5.2);

    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    const GLOBE_RADIUS = 1.95;

    // 2. Atmosphere Horizon Halo (Executive Light Cyan/Blue)
    const atmosphereVertexShader = `
      varying vec3 vNormal;
      varying vec3 vPosition;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const atmosphereFragmentShader = `
      varying vec3 vNormal;
      varying vec3 vPosition;
      uniform vec3 uColor;
      void main() {
        vec3 viewDir = normalize(-vPosition);
        float intensity = pow(1.0 - max(dot(vNormal, viewDir), 0.0), 4.0) * 0.6;
        gl_FragColor = vec4(uColor, intensity);
      }
    `;

    const atmosphereMat = new THREE.ShaderMaterial({
      vertexShader: atmosphereVertexShader,
      fragmentShader: atmosphereFragmentShader,
      uniforms: {
        uColor: { value: new THREE.Color(0x2563eb) },
      },
      blending: THREE.NormalBlending,
      side: THREE.FrontSide,
      transparent: true,
      depthWrite: false,
    });

    const atmosphereMesh = new THREE.Mesh(
      new THREE.SphereGeometry(GLOBE_RADIUS * 1.02, 48, 48),
      atmosphereMat
    );
    globeGroup.add(atmosphereMesh);

    // 4. Core Light Porcelain Sphere
    const coreSphereGeo = new THREE.SphereGeometry(GLOBE_RADIUS, 54, 54);
    const coreSphereMat = new THREE.MeshBasicMaterial({
      color: 0xedf2f7,
      transparent: true,
      opacity: 0.96,
    });
    const coreSphere = new THREE.Mesh(coreSphereGeo, coreSphereMat);
    globeGroup.add(coreSphere);

    // 5. Continental Dot-Matrix Point Cloud (Executive Royal Blue & Slate)
    const DOTS_COUNT = 4500;
    const dotPositions: number[] = [];
    const dotColors: number[] = [];
    const royalBlue = new THREE.Color(0x2563eb);
    const skyBlue = new THREE.Color(0x0284c7);
    const slateColor = new THREE.Color(0x94a3b8);

    // Generate Fibonacci spiral distribution on sphere surface
    for (let i = 0; i < DOTS_COUNT; i++) {
      const phi = Math.acos(1 - (2 * (i + 0.5)) / DOTS_COUNT);
      const theta = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5);

      const lat = 90 - (phi * 180) / Math.PI;
      const lon = ((theta * 180) / Math.PI) % 360 - 180;

      // Filter dots: only keep if they land on Earth's continental masses
      if (isLandmass(lat, lon)) {
        const v = latLonToVector3(lat, lon, GLOBE_RADIUS + 0.006);
        dotPositions.push(v.x, v.y, v.z);

        // Subtly vary color between royal blue, sky blue and slate
        const rVal = Math.random();
        if (rVal > 0.7) {
          dotColors.push(royalBlue.r, royalBlue.g, royalBlue.b);
        } else if (rVal > 0.4) {
          dotColors.push(skyBlue.r, skyBlue.g, skyBlue.b);
        } else {
          dotColors.push(slateColor.r, slateColor.g, slateColor.b);
        }
      }
    }

    const continentGeo = new THREE.BufferGeometry();
    continentGeo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(dotPositions, 3)
    );
    continentGeo.setAttribute(
      "color",
      new THREE.Float32BufferAttribute(dotColors, 3)
    );

    const continentMat = new THREE.PointsMaterial({
      size: 0.042,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      blending: THREE.NormalBlending,
    });
    const continentPointCloud = new THREE.Points(continentGeo, continentMat);
    globeGroup.add(continentPointCloud);

    // 6. Equatorial & Orbital Holographic Telemetry Rings
    const orbitalGroup = new THREE.Group();
    globeGroup.add(orbitalGroup);

    // Equatorial Ring
    const ringGeo1 = new THREE.RingGeometry(GLOBE_RADIUS * 1.25, GLOBE_RADIUS * 1.255, 64);
    const ringMat1 = new THREE.MeshBasicMaterial({
      color: 0x94a3b8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.35,
    });
    const ring1 = new THREE.Mesh(ringGeo1, ringMat1);
    ring1.rotation.x = Math.PI / 2;
    orbitalGroup.add(ring1);

    // Tilted Orbital Scanner Ring
    const ringGeo2 = new THREE.RingGeometry(GLOBE_RADIUS * 1.35, GLOBE_RADIUS * 1.354, 64);
    const ringMat2 = new THREE.MeshBasicMaterial({
      color: 0x00d8f6,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.18,
      blending: THREE.AdditiveBlending,
    });
    const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
    ring2.rotation.x = Math.PI / 3;
    ring2.rotation.y = Math.PI / 6;
    orbitalGroup.add(ring2);

    // Radar Scanning Beam Fan (Sweeps around the equator)
    const scanGeo = new THREE.BufferGeometry();
    const scanPoints: THREE.Vector3[] = [];
    const SCAN_SEGMENTS = 16;
    for (let i = 0; i <= SCAN_SEGMENTS; i++) {
      const angle = (i / SCAN_SEGMENTS) * 0.45;
      scanPoints.push(new THREE.Vector3(0, 0, 0));
      scanPoints.push(
        new THREE.Vector3(
          Math.cos(angle) * GLOBE_RADIUS * 1.28,
          0,
          Math.sin(angle) * GLOBE_RADIUS * 1.28
        )
      );
    }
    scanGeo.setFromPoints(scanPoints);
    const scanMat = new THREE.LineBasicMaterial({
      color: 0x00f0a8,
      transparent: true,
      opacity: 0.25,
      blending: THREE.AdditiveBlending,
    });
    const scanBeam = new THREE.LineSegments(scanGeo, scanMat);
    globeGroup.add(scanBeam);

    // 7. Entity Nodes & Dynamic Radar Beacon Waves
    const markers: { mesh: THREE.Mesh; entity: ProspectEntity }[] = [];
    const beaconRings: { mesh: THREE.Mesh; maxScale: number; phase: number }[] = [];
    const markerGeo = new THREE.SphereGeometry(0.042, 16, 16);
    const ringBeaconGeo = new THREE.RingGeometry(0.02, 0.035, 24);

    entities.forEach((ent, index) => {
      const pos = latLonToVector3(ent.lat, ent.lon, GLOBE_RADIUS + 0.022);
      const isQualified = ent.disposition === "Qualified";
      const isReview = ent.disposition === "Review";

      const nodeColor = isQualified ? 0x059669 : isReview ? 0xd97706 : 0xe11d48;

      // Solid central beacon core
      const markerMat = new THREE.MeshBasicMaterial({
        color: nodeColor,
      });
      const markerMesh = new THREE.Mesh(markerGeo, markerMat);
      markerMesh.position.copy(pos);
      globeGroup.add(markerMesh);
      markers.push({ mesh: markerMesh, entity: ent });

      // Pulsing radar shockwave ring for Qualified & Review hubs
      if (isQualified || isReview) {
        const ringMat = new THREE.MeshBasicMaterial({
          color: nodeColor,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.7,
          blending: THREE.NormalBlending,
          depthWrite: false,
        });
        const beaconMesh = new THREE.Mesh(ringBeaconGeo, ringMat);
        beaconMesh.position.copy(pos.clone().multiplyScalar(1.002));
        beaconMesh.lookAt(new THREE.Vector3(0, 0, 0));
        globeGroup.add(beaconMesh);

        beaconRings.push({
          mesh: beaconMesh,
          maxScale: isQualified ? 2.6 : 1.9,
          phase: (index * 0.3) % (Math.PI * 2),
        });
      }
    });

    // 8. Luminescent Bezier Signal Flight Arcs with Traveling Photon Pulses
    const qualifiedEntities = entities
      .filter((e) => e.disposition === "Qualified")
      .slice(0, 12);

    const arcGroup = new THREE.Group();
    globeGroup.add(arcGroup);

    interface PhotonPulse {
      curve: THREE.QuadraticBezierCurve3;
      progress: number;
      speed: number;
      mesh: THREE.Mesh;
    }
    const photonPulses: PhotonPulse[] = [];
    const photonGeo = new THREE.SphereGeometry(0.034, 8, 8);
    const photonMat = new THREE.MeshBasicMaterial({
      color: 0x1d4ed8,
    });

    for (let i = 0; i < qualifiedEntities.length - 1; i += 2) {
      const p1 = latLonToVector3(
        qualifiedEntities[i].lat,
        qualifiedEntities[i].lon,
        GLOBE_RADIUS
      );
      const p2 = latLonToVector3(
        qualifiedEntities[i + 1].lat,
        qualifiedEntities[i + 1].lon,
        GLOBE_RADIUS
      );

      const distance = p1.distanceTo(p2);
      const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
      mid.normalize().multiplyScalar(GLOBE_RADIUS + Math.min(distance * 0.42, 0.95));

      const curve = new THREE.QuadraticBezierCurve3(p1, mid, p2);
      const arcPoints = curve.getPoints(42);
      const arcGeo = new THREE.BufferGeometry().setFromPoints(arcPoints);

      const arcMat = new THREE.LineBasicMaterial({
        color: 0x2563eb,
        transparent: true,
        opacity: 0.45,
      });

      const arcLine = new THREE.Line(arcGeo, arcMat);
      arcGroup.add(arcLine);

      // Add animated photon packet traveling along this arc
      const pulseMesh = new THREE.Mesh(photonGeo, photonMat);
      arcGroup.add(pulseMesh);
      photonPulses.push({
        curve,
        progress: Math.random(),
        speed: 0.004 + Math.random() * 0.003,
        mesh: pulseMesh,
      });
    }

    // 9. Interactive Orbit Controls with Physics Momentum & Raycasting
    let isDragging = false;
    let prevMousePos = { x: 0, y: 0 };
    let velX = 0;
    let velY = 0;
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      velX = 0;
      velY = 0;
      prevMousePos = { x: e.clientX, y: e.clientY };
      try {
        container.setPointerCapture(e.pointerId);
      } catch (_) {}
    };

    const onPointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      mouse.x = (mouseX / Math.max(rect.width, 1)) * 2 - 1;
      mouse.y = -(mouseY / Math.max(rect.height, 1)) * 2 + 1;

      if (isDragging) {
        const deltaX = e.clientX - prevMousePos.x;
        const deltaY = e.clientY - prevMousePos.y;
        if (Number.isFinite(deltaX) && Number.isFinite(deltaY)) {
          velX = deltaX * 0.0055;
          velY = deltaY * 0.0055;
          globeGroup.rotation.y += velX;
          globeGroup.rotation.x += velY;
        }
        prevMousePos = { x: e.clientX, y: e.clientY };
      } else {
        // Raycasting for entity tooltips
        raycaster.setFromCamera(mouse, camera);
        const markerMeshes = markers.map((m) => m.mesh);
        const intersects = raycaster.intersectObjects(markerMeshes);

        if (intersects.length > 0) {
          const hit = markers.find((m) => m.mesh === intersects[0].object);
          if (hit) {
            setHoveredEntity(hit.entity);
            setTooltipPos({ x: mouseX + 16, y: mouseY - 24 });
            container.style.cursor = "pointer";
            return;
          }
        }
        setHoveredEntity(null);
        setTooltipPos(null);
        container.style.cursor = "grab";
      }
    };

    const onPointerUp = (e?: PointerEvent) => {
      isDragging = false;
      if (e) {
        try {
          container.releasePointerCapture(e.pointerId);
        } catch (_) {}
      }
    };

    const onClick = () => {
      if (hoveredEntity && onSelectEntityRef.current) {
        onSelectEntityRef.current(hoveredEntity);
      }
    };

    // Reset camera function exposed
    resetCameraRef.current = () => {
      globeGroup.rotation.set(0.1, 0.4, 0);
      velX = 0;
      velY = 0;
    };

    container.addEventListener("pointerdown", onPointerDown);
    container.addEventListener("pointermove", onPointerMove);
    container.addEventListener("pointerup", onPointerUp);
    container.addEventListener("pointercancel", onPointerUp);
    window.addEventListener("pointerup", onPointerUp);
    container.addEventListener("click", onClick);

    // 10. High-Performance Render Loop
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Atmospheric rotation & auto-spin with smooth dampening
      if (!isDragging) {
        // Apply momentum friction
        velX *= 0.92;
        velY *= 0.92;
        if (Number.isFinite(velX)) globeGroup.rotation.y += velX;
        if (Number.isFinite(velY)) globeGroup.rotation.x += velY;

        // Auto-orbit if enabled
        if (autoRotateRef.current) {
          globeGroup.rotation.y += 0.0018;
        }
      }

      // Orbital Rings Rotation
      orbitalGroup.rotation.y = elapsedTime * 0.08;
      scanBeam.rotation.y = elapsedTime * 0.75;

      // Pulse Radar Beacon Waves
      beaconRings.forEach((b) => {
        const wave = (Math.sin(elapsedTime * 2.8 + b.phase) + 1) / 2;
        const scale = 1.0 + wave * (b.maxScale - 1.0);
        b.mesh.scale.set(scale, scale, 1);
        (b.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(
          0.05,
          (1 - wave) * 0.75
        );
      });

      // Travel photon energy packets across flight arcs
      arcGroup.visible = showArcsRef.current;
      if (showArcsRef.current) {
        photonPulses.forEach((p) => {
          p.progress = (p.progress + p.speed) % 1;
          const point = p.curve.getPoint(p.progress);
          p.mesh.position.copy(point);
        });
      }

      renderer.render(scene, camera);
    };

    animate();

    // 11. Window Resize
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / Math.max(h, 1);
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      container.removeEventListener("pointerdown", onPointerDown);
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerup", onPointerUp);
      container.removeEventListener("pointercancel", onPointerUp);
      window.removeEventListener("pointerup", onPointerUp);
      container.removeEventListener("click", onClick);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [entities]);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        minHeight: "380px",
        overflow: "hidden",
        borderRadius: "var(--radius)",
      }}
    >
      {/* Three.js Canvas Container */}
      <div
        ref={containerRef}
        style={{
          width: "100%",
          height: "100%",
          cursor: "grab",
          touchAction: "none",
        }}
      />

      {/* Top Holographic Telemetry HUD Bar */}
      <div
        style={{
          position: "absolute",
          top: "14px",
          left: "16px",
          right: "16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          pointerEvents: "none",
          zIndex: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              padding: "4px 12px",
              background: "#FFFFFF",
              border: "1px solid #CBD5E1",
              borderRadius: "var(--radius-pill)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 2px 6px rgba(0, 0, 0, 0.05)",
            }}
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "#059669",
                boxShadow: "0 0 6px #059669",
                display: "inline-block",
              }}
            />
            <span
              className="font-mono"
              style={{
                fontSize: "10.5px",
                fontWeight: 700,
                letterSpacing: "0.06em",
                color: "#0F172A",
                textTransform: "uppercase",
              }}
            >
              GEOSPATIAL MATRIX
            </span>
          </div>

          <div
            style={{
              padding: "4px 10px",
              background: "#FFFFFF",
              border: "1px solid #E2E8F0",
              borderRadius: "var(--radius-pill)",
              fontSize: "11px",
              fontWeight: 500,
              color: "#475569",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
            }}
          >
            <span className="font-mono tabular-nums" style={{ color: "#2563EB", fontWeight: 700 }}>
              {entities.length}
            </span>{" "}
            Active Target Nodes
          </div>
        </div>

        {/* Interactive HUD Control Pills (Clickable) */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            pointerEvents: "auto",
          }}
        >
          <button
            onClick={() => setIsAutoRotating(!isAutoRotating)}
            title={isAutoRotating ? "Pause Orbit" : "Auto Orbit"}
            style={{
              background: isAutoRotating ? "#EFF6FF" : "#FFFFFF",
              border: `1px solid ${isAutoRotating ? "#93C5FD" : "#CBD5E1"}`,
              borderRadius: "var(--radius-pill)",
              padding: "5px 12px",
              color: isAutoRotating ? "#1D4ED8" : "#334155",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "11px",
              fontWeight: 600,
              boxShadow: "0 1px 2px rgba(0, 0, 0, 0.04)",
              transition: "all 140ms ease",
            }}
          >
            {isAutoRotating ? <Pause size={12} /> : <Play size={12} />}
            <span className="font-mono" style={{ fontSize: "10px", fontWeight: 600 }}>
              {isAutoRotating ? "ORBITING" : "LOCKED"}
            </span>
          </button>

          <button
            onClick={() => setShowArcs(!showArcs)}
            title="Toggle Signal Flight Arcs"
            style={{
              background: showArcs ? "#F0FDF4" : "#FFFFFF",
              border: `1px solid ${showArcs ? "#86EFAC" : "#CBD5E1"}`,
              borderRadius: "var(--radius-pill)",
              padding: "5px 12px",
              color: showArcs ? "#15803D" : "#334155",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "11px",
              fontWeight: 600,
              boxShadow: "0 1px 2px rgba(0, 0, 0, 0.04)",
              transition: "all 140ms ease",
            }}
          >
            <Layers size={12} />
            <span className="font-mono" style={{ fontSize: "10px", fontWeight: 600 }}>
              ARCS
            </span>
          </button>

          <button
            onClick={() => resetCameraRef.current?.()}
            title="Reset Globe Orientation"
            style={{
              background: "#FFFFFF",
              border: "1px solid #CBD5E1",
              borderRadius: "var(--radius-pill)",
              padding: "5px 12px",
              color: "#334155",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "11px",
              fontWeight: 600,
              boxShadow: "0 1px 2px rgba(0, 0, 0, 0.04)",
              transition: "all 140ms ease",
            }}
          >
            <Compass size={12} />
            <span className="font-mono" style={{ fontSize: "10px", fontWeight: 600 }}>
              CENTER
            </span>
          </button>
        </div>
      </div>

      {/* Bottom Telemetry Legend */}
      <div
        style={{
          position: "absolute",
          bottom: "14px",
          left: "16px",
          right: "16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          pointerEvents: "none",
          fontSize: "11px",
          color: "#475569",
          zIndex: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span
            className="font-mono"
            style={{
              padding: "3px 8px",
              background: "#FFFFFF",
              border: "1px solid #CBD5E1",
              borderRadius: "var(--radius-pill)",
              color: "#0F172A",
              fontSize: "10px",
              fontWeight: 600,
              boxShadow: "0 1px 2px rgba(0, 0, 0, 0.04)",
            }}
          >
            DRAG TO ROTATE • WHEEL TO ZOOM
          </span>

          <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "#FFFFFF", padding: "3px 8px", borderRadius: "var(--radius-pill)", border: "1px solid #E2E8F0" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#059669" }} />
            <span style={{ fontWeight: 600, color: "#0F172A" }}>Qualified</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "#FFFFFF", padding: "3px 8px", borderRadius: "var(--radius-pill)", border: "1px solid #E2E8F0" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#D97706" }} />
            <span style={{ fontWeight: 600, color: "#0F172A" }}>Review</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "#FFFFFF", padding: "3px 8px", borderRadius: "var(--radius-pill)", border: "1px solid #E2E8F0" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#E11D48" }} />
            <span style={{ fontWeight: 600, color: "#0F172A" }}>Suppressed</span>
          </div>
        </div>

        <div className="font-mono tabular-nums" style={{ fontSize: "10px", color: "var(--faint)" }}>
          PROJECTION: WGS-84 // HOLOGRAPHIC DOT-MATRIX
        </div>
      </div>

      {/* Cybernetic HUD Tooltip on Hover */}
      {hoveredEntity && tooltipPos && (
        <div
          style={{
            position: "absolute",
            left: `${tooltipPos.x}px`,
            top: `${tooltipPos.y}px`,
            background: "rgba(10, 14, 22, 0.94)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(0, 240, 168, 0.4)",
            borderRadius: "8px",
            padding: "10px 14px",
            pointerEvents: "none",
            zIndex: 40,
            boxShadow: "0 12px 32px rgba(0, 0, 0, 0.85), 0 0 16px rgba(0, 240, 168, 0.2)",
            minWidth: "210px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <div
              className="font-brand"
              style={{
                fontWeight: 700,
                fontSize: "13px",
                color: "var(--text)",
                letterSpacing: "-0.01em",
              }}
            >
              {hoveredEntity.name}
            </div>
            <span
              className="font-mono tabular-nums"
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "var(--mint)",
              }}
            >
              {hoveredEntity.fitScore}%
            </span>
          </div>

          <div
            className="font-mono"
            style={{
              fontSize: "10.5px",
              color: "var(--cyan)",
              marginTop: "2px",
            }}
          >
            {hoveredEntity.domain}
          </div>

          <div
            style={{
              fontSize: "10.5px",
              color: "var(--muted)",
              marginTop: "4px",
            }}
          >
            {hoveredEntity.city}, {hoveredEntity.geo} • {hoveredEntity.industry}
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "8px",
              paddingTop: "6px",
              borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            <span
              className={`badge-${
                hoveredEntity.disposition === "Qualified"
                  ? "qualified"
                  : hoveredEntity.disposition === "Review"
                  ? "review"
                  : "suppressed"
              }`}
            >
              {hoveredEntity.disposition}
            </span>

            <span
              className="font-mono"
              style={{
                fontSize: "9px",
                color: "var(--muted)",
                letterSpacing: "0.06em",
              }}
            >
              CLICK TO INSPECT DOSSIER →
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
