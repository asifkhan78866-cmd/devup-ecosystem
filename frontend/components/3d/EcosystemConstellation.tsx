"use client";

import { useRef, useMemo, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Html, Line } from "@react-three/drei";
import { useRouter } from "next/navigation";
import * as THREE from "three";
import { useIsMobile } from "@/lib/hooks/useIsMobile";

// Pre-define domains and colors
const DOMAINS = {
  "AI/ML": "#c8f135",
  "Fintech": "#22c55e",
  "HealthTech": "#38bdf8",
  "DevTools": "#a78bfa",
  "SaaS": "#fb923c",
  "EdTech": "#f472b6",
  "Web3": "#818cf8",
};

// Generate 23 fake startups
const generateStartups = () => {
  const domains = Object.keys(DOMAINS) as Array<keyof typeof DOMAINS>;
  const stages = ["Idea", "MVP", "Pre-seed", "Seed", "Series A"];
  const radiuses = [0.06, 0.07, 0.08, 0.1, 0.12];
  
  return Array.from({ length: 23 }).map((_, i) => {
    const domain = domains[i % domains.length];
    const stageIdx = Math.floor(Math.random() * stages.length);
    const radius = radiuses[stageIdx];
    
    // Random position in a spherical volume
    const theta = Math.random() * 2 * Math.PI;
    const phi = Math.acos(Math.random() * 2 - 1);
    const r = 3 + Math.random() * 3;
    
    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta);
    const z = r * Math.cos(phi);
    
    return {
      id: `startup-${i}`,
      name: `Startup ${i + 1}`,
      domain,
      stage: stages[stageIdx],
      radius,
      position: new THREE.Vector3(x, y, z),
      color: DOMAINS[domain]
    };
  });
};

function Node({ startup, onClick }: { startup: any, onClick: () => void }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame(() => {
    if (meshRef.current) {
      const targetScale = hovered ? 2.5 : 1.0;
      meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.15);
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={startup.position}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={(e) => {
        setHovered(false);
        document.body.style.cursor = "auto";
      }}
    >
      <sphereGeometry args={[startup.radius, 16, 16]} />
      <meshStandardMaterial color={startup.color} emissive={startup.color} emissiveIntensity={0.5} />
      
      {hovered && (
        <Html center distanceFactor={15} style={{ pointerEvents: "none" }}>
          <div 
            style={{
              background: "#111111",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: "8px",
              padding: "8px 12px",
              width: "max-content",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.5)"
            }}
          >
            <div style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "14px", fontWeight: 700, color: "#fff" }}>
              {startup.name}
            </div>
            <div className="flex items-center gap-2">
              <span style={{ fontSize: "10px", color: startup.color, fontFamily: "var(--font-inter), sans-serif" }}>
                {startup.domain}
              </span>
              <span style={{ color: "#6b6b6b" }}>·</span>
              <span style={{ fontSize: "10px", color: "#a1a1a1", fontFamily: "var(--font-inter), sans-serif" }}>
                {startup.stage}
              </span>
            </div>
          </div>
        </Html>
      )}
    </mesh>
  );
}

function ConstellationGroup() {
  const router = useRouter();
  const groupRef = useRef<THREE.Group>(null);
  const startups = useMemo(() => generateStartups(), []);

  // Generate lines between nodes of the same domain
  const lines = useMemo(() => {
    const l = [];
    const domains = Object.keys(DOMAINS);
    for (const d of domains) {
      const domainStartups = startups.filter(s => s.domain === d);
      for (let i = 0; i < domainStartups.length; i++) {
        for (let j = i + 1; j < domainStartups.length; j++) {
          // Connect if distance is somewhat close to avoid crazy long lines, or just connect all in domain
          const dist = domainStartups[i].position.distanceTo(domainStartups[j].position);
          if (dist < 6) {
            l.push([domainStartups[i].position, domainStartups[j].position]);
          }
        }
      }
    }
    return l;
  }, [startups]);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.001;
    }
  });

  return (
    <group ref={groupRef}>
      {startups.map((s) => (
        <Node 
          key={s.id} 
          startup={s} 
          onClick={() => router.push(`/ecosystem/${s.id}`)} 
        />
      ))}
      
      {lines.map((pts, i) => (
        <Line 
          key={`line-${i}`} 
          points={pts} 
          color="white" 
          transparent 
          opacity={0.04} 
          lineWidth={1} 
        />
      ))}
    </group>
  );
}

export default function EcosystemConstellation() {
  const isMobile = useIsMobile();

  return (
    <div className={`w-full relative ${isMobile ? 'h-[220px]' : 'h-[340px]'}`}>
      <Canvas
        camera={{ position: [0, 0, 8], fov: 60 }}
        dpr={isMobile ? [1, 1.5] : [1, 2]}
      >
        <ambientLight intensity={0.2} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <ConstellationGroup />
        <OrbitControls enableZoom={false} enablePan={false} enableRotate={!isMobile} enableDamping dampingFactor={0.05} />
      </Canvas>
    </div>
  );
}
