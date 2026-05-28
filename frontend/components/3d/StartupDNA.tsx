"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import * as THREE from "three";

interface StartupDNAProps {
  color?: string;
}

function DNAHelix({ color = "#c8f135" }: { color: string }) {
  const groupRef = useRef<THREE.Group>(null);
  
  const nodeCount = 20;
  const height = 4;
  const radius = 0.8;
  const turns = 2;

  // Generate node positions for both strands
  const { nodes1, nodes2, lines } = useMemo(() => {
    const n1 = [];
    const n2 = [];
    const l = [];

    for (let i = 0; i < nodeCount; i++) {
      const t = i / (nodeCount - 1);
      const y = (t - 0.5) * height;
      
      // Strand 1 (phase 0)
      const angle1 = t * turns * Math.PI * 2;
      const x1 = Math.cos(angle1) * radius;
      const z1 = Math.sin(angle1) * radius;
      const p1 = new THREE.Vector3(x1, y, z1);
      n1.push(p1);

      // Strand 2 (phase PI)
      const angle2 = angle1 + Math.PI;
      const x2 = Math.cos(angle2) * radius;
      const z2 = Math.sin(angle2) * radius;
      const p2 = new THREE.Vector3(x2, y, z2);
      n2.push(p2);
      
      // Cross connection
      l.push([p1, p2]);
    }
    
    return { nodes1: n1, nodes2: n2, lines: l };
  }, [nodeCount, height, radius, turns]);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      const t = clock.elapsedTime;
      groupRef.current.rotation.y += 0.008;
      groupRef.current.position.y = Math.sin(t) * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      {nodes1.map((p, i) => (
        <mesh key={`n1-${i}`} position={p}>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshStandardMaterial 
            color={i % 2 === 0 ? color : "#ffffff"} 
            emissive={i % 2 === 0 ? color : "#ffffff"} 
            emissiveIntensity={0.5} 
          />
        </mesh>
      ))}
      
      {nodes2.map((p, i) => (
        <mesh key={`n2-${i}`} position={p}>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshStandardMaterial 
            color={i % 2 === 0 ? "#ffffff" : color} 
            emissive={i % 2 === 0 ? "#ffffff" : color} 
            emissiveIntensity={0.5} 
          />
        </mesh>
      ))}

      {lines.map((pts, i) => (
        <Line 
          key={`line-${i}`} 
          points={pts} 
          color="white" 
          transparent 
          opacity={0.1} 
          lineWidth={1} 
        />
      ))}
    </group>
  );
}

export default function StartupDNA({ color = "#c8f135" }: StartupDNAProps) {
  return (
    <div className="w-full h-[500px] relative pointer-events-none">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        dpr={[1, 2]}
      >
        <ambientLight intensity={0.2} />
        <pointLight position={[3, 3, 3]} color={color} intensity={1.5} />
        <DNAHelix color={color} />
      </Canvas>
    </div>
  );
}
