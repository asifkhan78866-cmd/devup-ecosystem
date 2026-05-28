"use client";

import { useRef, useMemo, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html, CatmullRomLine, Line } from "@react-three/drei";
import * as THREE from "three";

const NODES = [
  { id: "tech", label: "Tech", color: "#6366f1", ring: 0, angle: 0 },
  { id: "ai", label: "AI & Compute", color: "#c8f135", ring: 1, angle: Math.PI / 4 },
  { id: "design", label: "Design", color: "#ec4899", ring: 2, angle: Math.PI / 2 },
  { id: "marketing", label: "Marketing", color: "#22c55e", ring: 0, angle: Math.PI },
  { id: "legal", label: "Legal", color: "#94a3b8", ring: 1, angle: Math.PI * 1.25 },
  { id: "mission", label: "Mission", color: "#f97316", ring: 2, angle: Math.PI * 1.5 },
  { id: "cloud", label: "Cloud", color: "#38bdf8", ring: 0, angle: Math.PI * 1.75 },
  { id: "startup", label: "Startup", color: "#ffffff", ring: 1, angle: Math.PI * 0.75 },
];

function ParticleField() {
  const pointsRef = useRef<THREE.Points>(null);
  
  const particles = useMemo(() => {
    const temp = new Float32Array(2000 * 3);
    for (let i = 0; i < 2000; i++) {
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(Math.random() * 2 - 1);
      const r = 8 * Math.cbrt(Math.random());
      
      temp[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      temp[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      temp[i * 3 + 2] = r * Math.cos(phi);
    }
    return temp;
  }, []);

  useFrame(() => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y -= 0.0005;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[particles, 3]}
        />
      </bufferGeometry>
      <pointsMaterial size={0.015} color="white" transparent opacity={0.15} />
    </points>
  );
}

function OrbitalRing({ index, tilt, speed, nodes }: { index: number, tilt: number, speed: number, nodes: typeof NODES }) {
  const groupRef = useRef<THREE.Group>(null);
  const ringRadius = 1.8;

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += speed;
    }
  });

  return (
    <group rotation={[tilt, 0, 0]}>
      <group ref={groupRef}>
        <mesh>
          <torusGeometry args={[ringRadius, 0.003, 8, 128]} />
          <meshBasicMaterial color="white" transparent opacity={0.08} />
        </mesh>
        
        {nodes.filter(n => n.ring === index).map((node) => {
          const x = Math.cos(node.angle) * ringRadius;
          const z = Math.sin(node.angle) * ringRadius;
          return <OrbitalNode key={node.id} position={[x, 0, z]} node={node} />;
        })}
      </group>
    </group>
  );
}

function OrbitalNode({ position, node }: { position: [number, number, number], node: typeof NODES[0] }) {
  const [hovered, setHovered] = useState(false);
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Need to calculate global position for connection line
  // We will simplify and draw curved lines from center to nodes
  // However, since the node is inside a rotated group, getting its world position dynamically is complex
  // For this aesthetic, we'll draw lines in the top level instead if needed, but since it's rotating, we can draw lines from center (0,0,0) to [x,0,z] INSIDE the rotating group!
  
  useFrame(() => {
    if (meshRef.current) {
      const targetScale = hovered ? 1.6 : 1.0;
      meshRef.current.scale.setScalar(
        THREE.MathUtils.lerp(meshRef.current.scale.x, targetScale, 0.1)
      );
    }
  });

  // Calculate curve points for the connection line inside the local group
  const curvePoints = useMemo(() => {
    const p1 = new THREE.Vector3(0, 0, 0);
    const p3 = new THREE.Vector3(...position);
    // Control point for a slight curve
    const p2 = new THREE.Vector3(position[0] * 0.5, position[1] * 0.5 + 0.3, position[2] * 0.5);
    const curve = new THREE.CatmullRomCurve3([p1, p2, p3]);
    return curve.getPoints(20);
  }, [position]);

  return (
    <group>
      {/* Node Sphere */}
      <mesh
        ref={meshRef}
        position={position}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
        onPointerOut={(e) => { setHovered(false); }}
      >
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshStandardMaterial color={node.color} emissive={node.color} emissiveIntensity={0.5} />
        
        <pointLight color={node.color} intensity={0.5} distance={2} />
        
        {hovered && (
          <Html center distanceFactor={10} style={{ pointerEvents: 'none' }}>
            <div style={{
              background: '#111',
              border: '1px solid #333',
              padding: '6px 10px',
              borderRadius: '6px',
              fontFamily: 'Inter, sans-serif',
              fontSize: '12px',
              color: 'white',
              whiteSpace: 'nowrap'
            }}>
              {node.label}
            </div>
          </Html>
        )}
      </mesh>

      {/* Connection Line */}
      <Line points={curvePoints} color="white" transparent opacity={0.03} lineWidth={1} />
      
      {/* Travelling pulse */}
      <PulsingDot curvePoints={curvePoints} color={node.color} offset={node.angle} />
    </group>
  );
}

function PulsingDot({ curvePoints, color, offset }: { curvePoints: THREE.Vector3[], color: string, offset: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame(({ clock }) => {
    if (meshRef.current) {
      const t = ((clock.elapsedTime * 0.25) + (offset / (Math.PI * 2))) % 1; // 4s period staggered
      
      // Interpolate position along the pre-calculated curve points
      const pointCount = curvePoints.length - 1;
      const index = t * pointCount;
      const lower = Math.floor(index);
      const upper = Math.ceil(index);
      const fract = index - lower;
      
      if (upper < curvePoints.length) {
        meshRef.current.position.lerpVectors(curvePoints[lower], curvePoints[upper], fract);
      }
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.02, 8, 8]} />
      <meshBasicMaterial color={color} />
    </mesh>
  );
}

function CentralNode() {
  const coreRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (coreRef.current) {
      const t = clock.elapsedTime;
      coreRef.current.scale.setScalar(1 + Math.sin(t * 2.1) * 0.04);
    }
  });

  return (
    <group>
      {/* Core solid sphere */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[0.35, 32, 32]} />
        <meshStandardMaterial color="#c8f135" emissive="#c8f135" emissiveIntensity={0.4} />
      </mesh>
      
      {/* Outer halo */}
      <mesh>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshBasicMaterial color="#c8f135" transparent opacity={0.06} />
      </mesh>
    </group>
  );
}

export default function EcosystemOrbit3D() {
  return (
    <div className="w-full h-full min-h-[700px] relative cursor-pointer">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.2} />
        <pointLight position={[3, 3, 3]} color="#6366f1" intensity={3} />
        <pointLight position={[-3, -3, -3]} color="#c8f135" intensity={2} />
        
        <CentralNode />
        
        {/* Ring 1 (equatorial) */}
        <OrbitalRing index={0} tilt={0} speed={0.004} nodes={NODES} />
        {/* Ring 2 (60 deg tilt) */}
        <OrbitalRing index={1} tilt={Math.PI / 3} speed={-0.003} nodes={NODES} />
        {/* Ring 3 (-45 deg tilt) */}
        <OrbitalRing index={2} tilt={-Math.PI / 4} speed={0.002} nodes={NODES} />

        <ParticleField />
        
        <OrbitControls enableZoom={false} enablePan={false} enableDamping dampingFactor={0.05} autoRotate={false} />
      </Canvas>
    </div>
  );
}
