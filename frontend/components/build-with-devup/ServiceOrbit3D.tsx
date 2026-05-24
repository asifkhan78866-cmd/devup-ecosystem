"use client";

import { useRef, useMemo, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Points, PointMaterial, Text, Sphere, Line, Torus } from "@react-three/drei";
import * as THREE from "three";

// Starfield particles
function Particles() {
  const count = 500;
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    return pos;
  }, [count]);

  const ref = useRef<THREE.Points>(null!);

  useFrame((state, delta) => {
    ref.current.rotation.x -= delta / 10;
    ref.current.rotation.y -= delta / 15;
  });

  return (
    <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial transparent color="#ffffff" size={0.05} sizeAttenuation={true} depthWrite={false} opacity={0.4} />
    </Points>
  );
}

// DevUp Core Sphere
function CoreSphere() {
  const ref = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    ref.current.rotation.y += 0.005;
  });

  return (
    <Sphere ref={ref} args={[1, 64, 64]} position={[0, 0, 0]}>
      <meshPhysicalMaterial
        color="#000000"
        emissive="#00E5FF" // Using accent-primary equivalent
        emissiveIntensity={0.5}
        roughness={0.1}
        metalness={0.9}
        clearcoat={1}
        clearcoatRoughness={0.1}
      />
      {/* Glow effect */}
      <Sphere args={[1.1, 32, 32]} position={[0, 0, 0]}>
        <meshBasicMaterial color="#00E5FF" transparent opacity={0.1} blending={THREE.AdditiveBlending} />
      </Sphere>
    </Sphere>
  );
}

// Orbiting Rings
function Rings() {
  const rings = [
    { radius: 3, rotation: [Math.PI / 2, 0.2, 0] as [number, number, number], speed: 0.5 },
    { radius: 5, rotation: [Math.PI / 2, -0.4, 0] as [number, number, number], speed: -0.3 },
    { radius: 7, rotation: [Math.PI / 2, 0.6, Math.PI / 4] as [number, number, number], speed: 0.2 },
  ];

  const groupRef = useRef<THREE.Group>(null!);

  useFrame((state, delta) => {
    groupRef.current.children.forEach((ring, i) => {
      ring.rotation.z += delta * rings[i].speed;
    });
  });

  return (
    <group ref={groupRef}>
      {rings.map((ring, i) => (
        <group key={i} rotation={ring.rotation}>
          <Torus args={[ring.radius, 0.01, 16, 100]}>
            <meshBasicMaterial color="#ffffff" transparent opacity={0.1} />
          </Torus>
        </group>
      ))}
    </group>
  );
}

// Satellite Nodes
interface SatelliteProps {
  radius: number;
  angle: number;
  tilt: number;
  speed: number;
  label: string;
  color: string;
}

function Satellite({ radius, angle, tilt, speed, label, color }: SatelliteProps) {
  const ref = useRef<THREE.Group>(null!);
  const initialAngle = useRef(angle);

  useFrame((state) => {
    const currentAngle = initialAngle.current + state.clock.elapsedTime * speed;
    const x = Math.cos(currentAngle) * radius;
    const z = Math.sin(currentAngle) * radius;

    // Apply tilt logic manually to compute position
    ref.current.position.x = x;
    ref.current.position.y = Math.sin(currentAngle) * radius * tilt;
    ref.current.position.z = z;
  });

  return (
    <group ref={ref}>
      <Sphere args={[0.2, 32, 32]}>
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} />
      </Sphere>
      <Text
        position={[0, 0.4, 0]}
        fontSize={0.25}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#000000"
      >
        {label}
      </Text>
    </group>
  );
}

const satellites = [
  { radius: 3, angle: 0, tilt: 0.2, speed: 0.5, label: "GPU Cloud", color: "#00E5FF" },
  { radius: 3, angle: Math.PI, tilt: 0.2, speed: 0.5, label: "Design", color: "#FF00E5" },

  { radius: 5, angle: Math.PI / 2, tilt: -0.4, speed: -0.3, label: "Legal", color: "#00FF66" },
  { radius: 5, angle: (Math.PI * 3) / 2, tilt: -0.4, speed: -0.3, label: "Growth", color: "#FFaa00" },
  { radius: 5, angle: Math.PI / 4, tilt: -0.4, speed: -0.3, label: "Mobile Apps", color: "#00E5FF" },

  { radius: 7, angle: 0, tilt: 0.6, speed: 0.2, label: "AI Models", color: "#7700FF" },
  { radius: 7, angle: (Math.PI * 2) / 3, tilt: 0.6, speed: 0.2, label: "Backend", color: "#FF0055" },
  { radius: 7, angle: (Math.PI * 4) / 3, tilt: 0.6, speed: 0.2, label: "Pitch Decks", color: "#0055FF" },
];

function Scene() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} />

      <Particles />
      <CoreSphere />
      <Rings />

      {satellites.map((sat, i) => (
        <Satellite key={i} {...sat} />
      ))}
    </>
  );
}

export default function ServiceOrbit3D() {
  return (
    <div className="w-full h-[600px] relative pointer-events-none">
      {/* We use pointer-events-none so it doesn't block scrolling on mobile */}
      <Canvas
        camera={{ position: [0, 4, 12], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
            <Scene />
          </Float>
        </Suspense>
      </Canvas>
    </div>
  );
}
