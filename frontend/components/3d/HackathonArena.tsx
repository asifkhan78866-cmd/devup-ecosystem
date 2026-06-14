"use client";

import { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { useIsMobile } from "@/lib/hooks/useIsMobile";

const HEX_RADIUS = 0.4;
const HEX_HEIGHT = 0.05;

// Classic honeycomb math
const HEX_WIDTH = Math.sqrt(3) * HEX_RADIUS;
const HEX_Y_OFFSET = 3/2 * HEX_RADIUS;

function generateGrid() {
  const hexes = [];
  const rows = 6;
  const cols = 8;
  
  // Center offset
  const cx = ((cols - 1) * HEX_WIDTH) / 2;
  const cz = ((rows - 1) * HEX_Y_OFFSET) / 2;

  let idCounter = 0;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const isOdd = row % 2 !== 0;
      const x = col * HEX_WIDTH + (isOdd ? HEX_WIDTH / 2 : 0) - cx;
      const z = row * HEX_Y_OFFSET - cz;
      
      // Determine type randomly for visual
      const r = Math.random();
      let type = "default";
      if (r > 0.95) type = "featured";
      else if (r > 0.85) type = "active";
      else if (r > 0.6) type = "past";
      
      hexes.push({
        id: idCounter++,
        x,
        y: 0,
        z,
        type,
        pulseValue: 0
      });
    }
  }
  
  // Ensure exactly one featured
  const featured = hexes.filter(h => h.type === "featured");
  if (featured.length > 1) {
    featured.slice(1).forEach(h => h.type = "active");
  } else if (featured.length === 0) {
    hexes[Math.floor(hexes.length / 2)].type = "featured";
  }

  return hexes;
}

function Hexagon({ hex, onPulse }: { hex: any, onPulse: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  
  const isInteractive = hex.type === "active" || hex.type === "featured";
  
  const baseColor = 
    hex.type === "featured" ? "#ffffff" : 
    hex.type === "active" ? "#c8f135" : 
    hex.type === "past" ? "#1a1a1a" : "#111111";
    
  const baseEmissive = 
    hex.type === "featured" ? 0.8 : 
    hex.type === "active" ? 0.4 : 0;
    
  const baseScale = hex.type === "featured" ? 1.3 : 1.0;
  
  // For pulsing inactive hexes
  const pulseRef = useRef(0);
  
  useEffect(() => {
    if (onPulse && hex.type === "default") {
      pulseRef.current = 1.0;
    }
  }, [onPulse, hex.type]);

  useFrame((_, delta) => {
    if (meshRef.current) {
      // Hover scale
      const targetScale = hovered && isInteractive ? baseScale * 1.4 : baseScale;
      meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.2);
      
      // Pulse material
      if (hex.type === "default" && pulseRef.current > 0) {
        pulseRef.current = Math.max(0, pulseRef.current - delta * 0.5); // fade out over 2 seconds
        const material = meshRef.current.material as THREE.MeshStandardMaterial;
        material.opacity = 0.3 + (pulseRef.current * 0.4);
      }
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={[hex.x, hex.y, hex.z]}
      rotation={[Math.PI / 2, 0, Math.PI / 6]} // Flat on XZ plane, pointed top
      onPointerOver={(e) => {
        if (isInteractive) {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = "pointer";
        }
      }}
      onPointerOut={() => {
        if (isInteractive) {
          setHovered(false);
          document.body.style.cursor = "auto";
        }
      }}
    >
      {/* 6 radial segments creates a hexagon from a cylinder */}
      <cylinderGeometry args={[HEX_RADIUS * 0.95, HEX_RADIUS * 0.95, HEX_HEIGHT, 6]} />
      <meshStandardMaterial 
        color={baseColor} 
        emissive={baseColor}
        emissiveIntensity={baseEmissive}
        transparent
        opacity={hex.type === "default" ? 0.3 : 1}
      />
      
      {hovered && isInteractive && (
        <Html center distanceFactor={15} style={{ pointerEvents: "none", zIndex: 10 }}>
          <div 
            style={{
              background: "#111111",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: "8px",
              padding: "8px 12px",
              width: "max-content",
              boxShadow: "0 10px 30px rgba(0,0,0,0.5)"
            }}
          >
            <div style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "14px", fontWeight: 700, color: "#fff" }}>
              {hex.type === "featured" ? "Global Hackathon '26" : "Weekend Build Sprint"}
            </div>
            <div style={{ fontSize: "12px", color: "#c8f135", fontFamily: "var(--font-inter), sans-serif", marginTop: "4px" }}>
              {hex.type === "featured" ? "₹2,00,000 Prize" : "₹50,000 Prize"}
            </div>
          </div>
        </Html>
      )}
    </mesh>
  );
}

function ArenaGroup() {
  const groupRef = useRef<THREE.Group>(null);
  const hexes = useMemo(() => generateGrid(), []);
  const [pulseIndex, setPulseIndex] = useState(-1);

  // Trigger random pulse every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const defaultHexes = hexes.filter(h => h.type === "default");
      if (defaultHexes.length > 0) {
        const randomHex = defaultHexes[Math.floor(Math.random() * defaultHexes.length)];
        setPulseIndex(randomHex.id);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [hexes]);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.001;
    }
  });

  return (
    <group ref={groupRef} rotation={[0.2, 0, 0]}>
      {hexes.map(hex => (
        <Hexagon key={hex.id} hex={hex} onPulse={pulseIndex === hex.id} />
      ))}
    </group>
  );
}

export default function HackathonArena() {
  const isMobile = useIsMobile();
  return (
    <div className="w-full h-[200px] md:h-[320px] relative pointer-events-auto">
      <Canvas
        camera={{ position: [0, 4, 8], fov: 45 }}
        dpr={[1, 2]}
      >
        <ambientLight intensity={0.2} />
        <pointLight position={[0, 5, 0]} intensity={1} color="#ffffff" />
        <pointLight position={[5, 2, 5]} intensity={0.5} color="#c8f135" />
        <ArenaGroup />
      </Canvas>
    </div>
  );
}
