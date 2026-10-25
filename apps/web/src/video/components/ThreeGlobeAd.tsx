import React, { useEffect, useRef } from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import * as THREE from "three";

export const ThreeGlobeAd: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const globeGroupRef = useRef<THREE.Group | null>(null);
  const ringsGroupRef = useRef<THREE.Group | null>(null);
  const beaconsRef = useRef<THREE.Mesh[]>([]);

  // Smooth cinematic camera orbit
  const rotY = interpolate(frame, [0, 260], [-0.4, Math.PI * 1.8], {
    extrapolateRight: "clamp",
  });
  const rotX = interpolate(frame, [0, 120, 260], [0.4, 0.2, 0.35], {
    extrapolateRight: "clamp",
  });
  const cameraZ = interpolate(frame, [0, 80, 260], [300, 220, 195], {
    extrapolateRight: "clamp",
  });
  const cameraY = interpolate(frame, [0, 130, 260], [35, 10, -15], {
    extrapolateRight: "clamp",
  });

  const entranceScale = spring({
    frame,
    fps,
    config: { damping: 13, mass: 0.8, stiffness: 110 },
  });

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const width = 1000;
    const height = 1000;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1200);
    camera.position.set(0, 25, 230);
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

    // 1. Dark Core Obsidian Sphere
    const sphereGeo = new THREE.SphereGeometry(78, 48, 48);
    const sphereMat = new THREE.MeshBasicMaterial({
      color: 0x05070f,
    });
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    globeGroup.add(sphere);

    // 2. Glowing Cyan Wireframe Hex / Grid Outer Shell
    const wireGeo = new THREE.SphereGeometry(79, 36, 36);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      wireframe: true,
      transparent: true,
      opacity: 0.22,
    });
    const wireSphere = new THREE.Mesh(wireGeo, wireMat);
    globeGroup.add(wireSphere);

    // 3. Dense Surface Data Particle Constellation
    const pCount = 1800;
    const pPositions = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 79.5 + Math.random() * 2.5;

      const sinPhi = Math.sin(phi);
      pPositions[i * 3] = r * sinPhi * Math.cos(theta);
      pPositions[i * 3 + 1] = r * Math.cos(phi);
      pPositions[i * 3 + 2] = r * sinPhi * Math.sin(theta);
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.BufferAttribute(pPositions, 3));
    const pMat = new THREE.PointsMaterial({
      color: 0x00ff88,
      size: 1.8,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(pGeo, pMat);
    globeGroup.add(particles);

    // 4. Orbital Gimbal Rings with tick marks
    const ringsGroup = new THREE.Group();
    ringsGroupRef.current = ringsGroup;

    // Ring 1 (Equatorial Cyan Ring)
    const ring1Geo = new THREE.TorusGeometry(105, 0.6, 8, 120);
    const ring1Mat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
    });
    const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
    ring1.rotation.x = Math.PI / 2.3;
    ringsGroup.add(ring1);

    // Ring 2 (Polar Magenta / Purple Orbital Ring)
    const ring2Geo = new THREE.TorusGeometry(118, 0.5, 8, 120);
    const ring2Mat = new THREE.MeshBasicMaterial({
      color: 0xa855f7,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
    });
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2.rotation.y = Math.PI / 3;
    ring2.rotation.x = Math.PI / 6;
    ringsGroup.add(ring2);

    globeGroup.add(ringsGroup);

    // 5. Global Recon Beacons with Light Columns
    const cities = [
      { lat: 37.7749, lon: -122.4194, label: "SF Bay Area", color: 0x00ff88 },
      { lat: 40.7128, lon: -74.006, label: "New York", color: 0x00f0ff },
      { lat: 51.5074, lon: -0.1278, label: "London", color: 0x00f0ff },
      { lat: 35.6762, lon: 139.6503, label: "Tokyo", color: 0x00ff88 },
      { lat: 1.3521, lon: 103.8198, label: "Singapore", color: 0x00f0ff },
      { lat: 52.52, lon: 13.405, label: "Berlin", color: 0xa855f7 },
    ];

    const beaconsGroup = new THREE.Group();
    beaconsRef.current = [];

    cities.forEach((city) => {
      const phi = (90 - city.lat) * (Math.PI / 180);
      const theta = (city.lon + 180) * (Math.PI / 180);
      const r = 80;

      const x = -(r * Math.sin(phi) * Math.cos(theta));
      const z = r * Math.sin(phi) * Math.sin(theta);
      const y = r * Math.cos(phi);

      // Light column
      const colGeo = new THREE.CylinderGeometry(0.6, 0.1, 20, 8);
      const colMat = new THREE.MeshBasicMaterial({
        color: city.color,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
      });
      const col = new THREE.Mesh(colGeo, colMat);
      col.position.set(x * 1.08, y * 1.08, z * 1.08);
      col.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(x, y, z).normalize()
      );
      beaconsGroup.add(col);

      // Top Pulsing Beacon Sphere
      const bGeo = new THREE.SphereGeometry(3, 16, 16);
      const bMat = new THREE.MeshBasicMaterial({
        color: city.color,
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending,
      });
      const beaconMesh = new THREE.Mesh(bGeo, bMat);
      beaconMesh.position.set(x * 1.18, y * 1.18, z * 1.18);
      beaconsGroup.add(beaconMesh);
      beaconsRef.current.push(beaconMesh);
    });

    globeGroup.add(beaconsGroup);

    // 6. Deep Space Background Starfield
    const starCount = 800;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      starPositions[i * 3] = (Math.random() - 0.5) * 800;
      starPositions[i * 3 + 1] = (Math.random() - 0.5) * 800;
      starPositions[i * 3 + 2] = (Math.random() - 0.5) * 800;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0x88ccff,
      size: 1.2,
      transparent: true,
      opacity: 0.6,
    });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    return () => {
      renderer.dispose();
    };
  }, []);

  // Update frame animation
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
    globeGroupRef.current.scale.set(entranceScale, entranceScale, entranceScale);

    if (ringsGroupRef.current) {
      ringsGroupRef.current.rotation.z = frame * 0.015;
    }

    cameraRef.current.position.z = cameraZ;
    cameraRef.current.position.y = cameraY;
    cameraRef.current.lookAt(0, 0, 0);

    // Pulse beacon heads
    beaconsRef.current.forEach((beacon, i) => {
      const pulse = 1 + Math.sin(frame * 0.18 + i * 1.2) * 0.4;
      beacon.scale.set(pulse, pulse, pulse);
    });

    rendererRef.current.render(sceneRef.current, cameraRef.current);
  }, [frame, rotY, rotX, cameraZ, cameraY, entranceScale]);

  return (
    <div
      style={{
        width: 1000,
        height: 1000,
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: 1000,
          height: 1000,
          filter:
            "drop-shadow(0 0 80px rgba(0, 240, 255, 0.35)) drop-shadow(0 0 120px rgba(0, 255, 136, 0.15))",
        }}
      />
    </div>
  );
};
