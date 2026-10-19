import React, { useEffect, useRef } from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import * as THREE from "three";

interface ThreeGlobeAdProps {
  progress?: number;
}

export const ThreeGlobeAd: React.FC<ThreeGlobeAdProps> = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const globeGroupRef = useRef<THREE.Group | null>(null);
  const arcsGroupRef = useRef<THREE.Group | null>(null);
  const beaconsRef = useRef<THREE.Mesh[]>([]);

  // Camera angles driven by Remotion frame
  // Orbit around globe and pitch up/down
  const rotY = interpolate(frame, [0, 250], [0, Math.PI * 1.5], {
    extrapolateRight: "clamp",
  });
  const rotX = interpolate(frame, [0, 100, 250], [0.35, 0.15, 0.45], {
    extrapolateRight: "clamp",
  });
  const cameraZ = interpolate(frame, [0, 80, 250], [280, 220, 190], {
    extrapolateRight: "clamp",
  });
  const cameraY = interpolate(frame, [0, 120, 250], [40, 10, -20], {
    extrapolateRight: "clamp",
  });

  const entranceScale = spring({
    frame,
    fps,
    config: { damping: 14, mass: 0.9, stiffness: 100 },
  });

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const width = 960;
    const height = 960;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 1000);
    camera.position.set(0, 30, 240);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    rendererRef.current = renderer;

    const globeGroup = new THREE.Group();
    globeGroupRef.current = globeGroup;
    scene.add(globeGroup);

    // 1. Core Obsidian Sphere
    const sphereGeo = new THREE.SphereGeometry(80, 48, 48);
    const sphereMat = new THREE.MeshBasicMaterial({
      color: 0x050811,
      transparent: true,
      opacity: 0.9,
    });
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    globeGroup.add(sphere);

    // 2. Wireframe / Latitude Longitude Rings
    const wireGeo = new THREE.SphereGeometry(80.5, 32, 24);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      wireframe: true,
      transparent: true,
      opacity: 0.15,
    });
    const wireSphere = new THREE.Mesh(wireGeo, wireMat);
    globeGroup.add(wireSphere);

    // 3. Equatorial & Orbital Glowing Rings
    const ringGeo = new THREE.RingGeometry(95, 96, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.4,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2.3;
    globeGroup.add(ring);

    const ring2 = new THREE.Mesh(
      new THREE.RingGeometry(110, 110.8, 64),
      new THREE.MeshBasicMaterial({
        color: 0x10b981,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.35,
      })
    );
    ring2.rotation.x = Math.PI / 3.2;
    ring2.rotation.y = 0.5;
    globeGroup.add(ring2);

    // 4. Dot Matrix Particles on landmasses
    const particleCount = 1800;
    const pGeo = new THREE.BufferGeometry();
    const pPositions = new Float32Array(particleCount * 3);
    const pColors = new Float32Array(particleCount * 3);

    const cyan = new THREE.Color(0x00f0ff);
    const emerald = new THREE.Color(0x10b981);
    const purple = new THREE.Color(0x8b5cf6);

    for (let i = 0; i < particleCount; i++) {
      const phi = Math.acos(-1 + (2 * i) / particleCount);
      const theta = Math.sqrt(particleCount * Math.PI) * phi;
      const r = 81;

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      pPositions[i * 3] = x;
      pPositions[i * 3 + 1] = y;
      pPositions[i * 3 + 2] = z;

      const mixedColor = i % 3 === 0 ? emerald : i % 5 === 0 ? purple : cyan;
      pColors[i * 3] = mixedColor.r;
      pColors[i * 3 + 1] = mixedColor.g;
      pColors[i * 3 + 2] = mixedColor.b;
    }

    pGeo.setAttribute("position", new THREE.BufferAttribute(pPositions, 3));
    pGeo.setAttribute("color", new THREE.BufferAttribute(pColors, 3));

    const pMat = new THREE.PointsMaterial({
      size: 2.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(pGeo, pMat);
    globeGroup.add(particles);

    // 5. Active Target Beacons (San Francisco, New York, London, Tokyo, Singapore, Berlin)
    const cities = [
      { lat: 37.7749, lon: -122.4194, label: "SF Bay Area" },
      { lat: 40.7128, lon: -74.006, label: "New York" },
      { lat: 51.5074, lon: -0.1278, label: "London" },
      { lat: 35.6762, lon: 139.6503, label: "Tokyo" },
      { lat: 1.3521, lon: 103.8198, label: "Singapore" },
      { lat: 52.52, lon: 13.405, label: "Berlin" },
    ];

    const beaconsGroup = new THREE.Group();
    beaconsRef.current = [];

    cities.forEach((city) => {
      const phi = (90 - city.lat) * (Math.PI / 180);
      const theta = (city.lon + 180) * (Math.PI / 180);
      const r = 82;

      const x = -(r * Math.sin(phi) * Math.cos(theta));
      const z = r * Math.sin(phi) * Math.sin(theta);
      const y = r * Math.cos(phi);

      // Pin
      const pinGeo = new THREE.CylinderGeometry(0.5, 0.1, 14, 8);
      const pinMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
      const pin = new THREE.Mesh(pinGeo, pinMat);
      pin.position.set(x, y, z);
      pin.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(x, y, z).normalize()
      );
      beaconsGroup.add(pin);

      // Glowing Beacon Top
      const bGeo = new THREE.SphereGeometry(2.5, 16, 16);
      const bMat = new THREE.MeshBasicMaterial({
        color: 0x10b981,
        transparent: true,
        opacity: 0.9,
      });
      const beaconMesh = new THREE.Mesh(bGeo, bMat);
      beaconMesh.position.set(x * 1.08, y * 1.08, z * 1.08);
      beaconsGroup.add(beaconMesh);
      beaconsRef.current.push(beaconMesh);
    });

    globeGroup.add(beaconsGroup);

    // 6. Arc Beams connecting cities
    const arcsGroup = new THREE.Group();
    arcsGroupRef.current = arcsGroup;
    globeGroup.add(arcsGroup);

    return () => {
      renderer.dispose();
    };
  }, []);

  // Update Three.js scene state on each Remotion frame
  useEffect(() => {
    if (
      !globeGroupRef.current ||
      !cameraRef.current ||
      !rendererRef.current ||
      !sceneRef.current
    )
      return;

    globeGroupRef.current.rotation.y = rotY;
    globeGroupRef.current.rotation.x = rotX;
    globeGroupRef.current.scale.set(
      entranceScale,
      entranceScale,
      entranceScale
    );

    cameraRef.current.position.z = cameraZ;
    cameraRef.current.position.y = cameraY;
    cameraRef.current.lookAt(0, 0, 0);

    // Pulse beacon tops
    beaconsRef.current.forEach((beacon, i) => {
      const pulse = 1 + Math.sin(frame * 0.15 + i) * 0.35;
      beacon.scale.set(pulse, pulse, pulse);
    });

    rendererRef.current.render(sceneRef.current, cameraRef.current);
  }, [frame, rotY, rotX, cameraZ, cameraY, entranceScale]);

  return (
    <div
      style={{
        width: 960,
        height: 960,
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transform: `scale(${entranceScale})`,
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: 960,
          height: 960,
          filter: "drop-shadow(0 0 60px rgba(0, 240, 255, 0.25))",
        }}
      />
    </div>
  );
};
