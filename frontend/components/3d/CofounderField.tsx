"use client";

import { useRef, useMemo, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { useIsMobile } from "@/lib/hooks/useIsMobile";

const ROLES = [
  { label: "Developer", color: "#a78bfa", bg: "rgba(99,102,241,0.1)", border: "rgba(99,102,241,0.2)" },
  { label: "Designer", color: "#f472b6", bg: "rgba(236,72,153,0.1)", border: "rgba(236,72,153,0.2)" },
  { label: "Marketing", color: "#4ade80", bg: "rgba(34,197,94,0.1)", border: "rgba(34,197,94,0.2)" },
  { label: "Operator", color: "#fb923c", bg: "rgba(251,146,60,0.1)", border: "rgba(251,146,60,0.2)" },
];

const STAGES = ["Idea Phase", "Building MVP", "Launched"];
const NAMES = ["Rahul S.", "Sneha M.", "Felix B.", "Arjun K.", "Priya T.", "Sam D."];

function generateProfiles(count: number) {
  const profiles = [];
  for (let i = 0; i < count; i++) {
    const roleIdx = Math.floor(Math.random() * ROLES.length);
    const role = ROLES[roleIdx];
    
    // Some profiles have 2 roles
    const role2 = Math.random() > 0.7 ? ROLES[(roleIdx + 1) % ROLES.length] : null;
    
    profiles.push({
      id: `profile-${i}`,
      name: NAMES[i % NAMES.length],
      seed: NAMES[i % NAMES.length].replace(" ", ""),
      roles: role2 ? [role, role2] : [role],
      stage: STAGES[Math.floor(Math.random() * STAGES.length)],
      basePos: new THREE.Vector3(
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 3,
        (Math.random() - 0.5) * 4
      ),
      currPos: new THREE.Vector3()
    });
  }
  return profiles;
}

function ProfileCard({ profile, index }: { profile: any, index: number }) {
  const groupRef = useRef<THREE.Group>(null);
  
  const timeRef = useRef(0);
  useFrame(({ camera }, delta) => {
    timeRef.current += delta;
    if (groupRef.current) {
      const t = timeRef.current;
      // Oscillate Y and drift slightly X
      groupRef.current.position.x = profile.basePos.x + Math.sin(t * 0.5 + index) * 0.5;
      groupRef.current.position.y = profile.basePos.y + Math.sin(t + index * 0.7) * 0.3;
      groupRef.current.position.z = profile.basePos.z + Math.cos(t * 0.3 + index) * 0.5;
      
      // Update global ref position for lines to use
      profile.currPos.copy(groupRef.current.position);
      
      // Billboard behavior
      groupRef.current.lookAt(camera.position);
    }
  });

  return (
    <group ref={groupRef}>
      {/* Invisible plane for proper layout sizing/hitbox if needed */}
      <mesh visible={false}>
        <planeGeometry args={[1.5, 0.9]} />
      </mesh>
      
      <Html transform distanceFactor={5} style={{ pointerEvents: "none" }}>
        <div 
          style={{
            background: "rgba(17,17,17,0.9)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: "12px",
            padding: "12px",
            width: "180px",
            backdropFilter: "blur(8px)",
            boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
            display: "flex",
            flexDirection: "column",
            gap: "8px"
          }}
        >
          <div className="flex items-center gap-3">
            <img 
              src={`https://api.dicebear.com/7.x/notionists/svg?seed=${profile.seed}&backgroundColor=0a0a0a`}
              style={{ width: "32px", height: "32px", borderRadius: "50%", border: "1px solid rgba(255,255,255,0.1)" }}
              alt="avatar"
            />
            <div style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "14px", fontWeight: 700, color: "#fff" }}>
              {profile.name}
            </div>
          </div>
          
          <div className="flex flex-wrap gap-1">
            {profile.roles.map((r: any, i: number) => (
              <div 
                key={i}
                style={{
                  background: r.bg,
                  border: `1px solid ${r.border}`,
                  color: r.color,
                  padding: "2px 6px",
                  borderRadius: "100px",
                  fontSize: "9px",
                  fontFamily: "var(--font-inter), sans-serif",
                  fontWeight: 500
                }}
              >
                {r.label}
              </div>
            ))}
          </div>
          
          <div 
            style={{ 
              fontSize: "10px", 
              color: "#a1a1a1", 
              fontFamily: "var(--font-inter), sans-serif",
              borderTop: "1px solid rgba(255,255,255,0.05)",
              paddingTop: "6px"
            }}
          >
            {profile.stage}
          </div>
        </div>
      </Html>
    </group>
  );
}

// Draw dynamic arcs between close profiles
function ConnectionArcs({ profiles }: { profiles: any[] }) {
  const linesRef = useRef<THREE.LineSegments>(null);
  const materialRef = useRef<THREE.LineBasicMaterial>(null);

  // Pre-allocate a large buffer for lines
  // Max connections for 12 nodes is 12*11/2 = 66 connections. 
  // Each bezier curve needs ~20 points = 1320 line segments, meaning 2640 vertices max.
  const MAX_POINTS = 3000;
  const positions = useMemo(() => new Float32Array(MAX_POINTS * 3), []);
  const colors = useMemo(() => new Float32Array(MAX_POINTS * 3), []); // For fading
  
  useFrame(() => {
    if (!linesRef.current) return;
    
    let ptIndex = 0;
    
    // Check distances
    for (let i = 0; i < profiles.length; i++) {
      for (let j = i + 1; j < profiles.length; j++) {
        const p1 = profiles[i].currPos;
        const p2 = profiles[j].currPos;
        
        const dist = p1.distanceTo(p2);
        
        if (dist < 3.0 && dist > 0) {
          // Calculate curve
          const mid = p1.clone().lerp(p2, 0.5);
          // Arch upward
          mid.y += dist * 0.2;
          
          const curve = new THREE.QuadraticBezierCurve3(p1, mid, p2);
          const points = curve.getPoints(10);
          
          // Calculate opacity based on distance (closer = more opaque, up to max)
          // distance 3 = 0 opacity, distance 1 = max opacity
          const rawOpacity = 1 - ((dist - 1) / 2);
          const intensity = Math.max(0, Math.min(1, rawOpacity)) * 0.4;
          
          for (let k = 0; k < points.length - 1; k++) {
            if (ptIndex * 6 + 5 >= positions.length) break;
            
            // Start point
            positions[ptIndex * 6] = points[k].x;
            positions[ptIndex * 6 + 1] = points[k].y;
            positions[ptIndex * 6 + 2] = points[k].z;
            
            colors[ptIndex * 6] = 0.78;     // R (c8 = 200/255)
            colors[ptIndex * 6 + 1] = 0.94; // G (f1 = 241/255)
            colors[ptIndex * 6 + 2] = 0.21; // B (35 = 53/255)
            // Can't do vertex alpha easily with basic material, so we modulate color to black (additive blending or transparent)
            // But LineBasicMaterial doesn't support vertexColors alpha. We will just use the geometry.setDrawRange to draw only active lines
            // and use a fixed opacity for all visible lines to keep it simple and performant.
            
            // End point
            positions[ptIndex * 6 + 3] = points[k+1].x;
            positions[ptIndex * 6 + 4] = points[k+1].y;
            positions[ptIndex * 6 + 5] = points[k+1].z;
            
            colors[ptIndex * 6 + 3] = 0.78;
            colors[ptIndex * 6 + 4] = 0.94;
            colors[ptIndex * 6 + 5] = 0.21;
            
            ptIndex++;
          }
        }
      }
    }
    
    // Update geometry
    const geo = linesRef.current.geometry;
    geo.attributes.position.needsUpdate = true;
    geo.setDrawRange(0, ptIndex * 2); // 2 vertices per segment
  });

  return (
    <lineSegments ref={linesRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <lineBasicMaterial ref={materialRef} vertexColors transparent opacity={0.3} color="#c8f135" />
    </lineSegments>
  );
}

export default function CofounderField() {
  const isMobile = useIsMobile();
  const profiles = useMemo(() => generateProfiles(12), []);
  
  return (
    <div className="w-full h-[220px] md:h-[360px] relative pointer-events-none">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 55 }}
        dpr={[1, 2]}
      >
        <ambientLight intensity={0.5} />
        <group>
          {profiles.map((p, i) => (
            <ProfileCard key={p.id} profile={p} index={i} />
          ))}
          <ConnectionArcs profiles={profiles} />
        </group>
      </Canvas>
    </div>
  );
}
