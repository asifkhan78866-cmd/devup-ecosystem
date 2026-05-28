"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

function OrbitNode({ position, size = 0.15, color = "#c8f135" }: { position: [number, number, number]; size?: number; color?: string }) {
  const meshRef = useRef<THREE.Mesh>(null);

  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
      <mesh ref={meshRef} position={position}>
        <dodecahedronGeometry args={[size, 0]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.3}
          roughness={0.4}
          metalness={0.6}
        />
      </mesh>
    </Float>
  );
}

function OrbitRing({ radius, speed, nodeCount, color }: { radius: number; speed: number; nodeCount: number; color: string }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * speed;
    }
  });

  const nodes = useMemo(() => {
    const arr: [number, number, number][] = [];
    for (let i = 0; i < nodeCount; i++) {
      const angle = (i / nodeCount) * Math.PI * 2;
      arr.push([
        Math.cos(angle) * radius,
        (Math.sin(angle * 2) * 0.3),
        Math.sin(angle) * radius,
      ]);
    }
    return arr;
  }, [radius, nodeCount]);

  return (
    <group ref={groupRef}>
      {/* Ring line */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius, 0.005, 8, 64]} />
        <meshBasicMaterial color={color} transparent opacity={0.15} />
      </mesh>
      {/* Nodes */}
      {nodes.map((pos, i) => (
        <OrbitNode key={i} position={pos} size={0.08 + Math.random() * 0.08} color={color} />
      ))}
    </group>
  );
}

function CentralCore() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.3;
      meshRef.current.rotation.x += delta * 0.1;
    }
  });

  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[0.3, 1]} />
      <meshStandardMaterial
        color="#c8f135"
        emissive="#c8f135"
        emissiveIntensity={0.5}
        wireframe
        transparent
        opacity={0.8}
      />
    </mesh>
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[5, 5, 5]} intensity={0.8} color="#ffffff" />
      <pointLight position={[-3, -3, 2]} intensity={0.4} color="#c8f135" />

      <CentralCore />

      <OrbitRing radius={1.2} speed={0.15} nodeCount={6} color="#c8f135" />
      <OrbitRing radius={2.0} speed={-0.1} nodeCount={8} color="#ffffff" />
      <OrbitRing radius={2.8} speed={0.08} nodeCount={10} color="#6b6b6b" />

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.5}
        maxPolarAngle={Math.PI / 1.8}
        minPolarAngle={Math.PI / 3}
      />
    </>
  );
}

export default function ServiceOrbit3D() {
  return (
    <div style={{ width: "100%", height: "100%", position: "absolute", inset: 0 }}>
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 2, 5], fov: 45 }}
        style={{ background: "transparent" }}
      >
        <Scene />
      </Canvas>
    </div>
  );
}
