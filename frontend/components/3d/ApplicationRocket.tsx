"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface ApplicationRocketProps {
  isLaunched: boolean;
}

function Rocket({ isLaunched }: { isLaunched: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  
  // Exhaust particles
  const particlesCount = 20;
  const particles = useMemo(() => {
    return Array.from({ length: particlesCount }).map((_, i) => ({
      id: i,
      x: (Math.random() - 0.5) * 0.2,
      y: -0.6 - Math.random() * 1.5, // Start below rocket
      z: (Math.random() - 0.5) * 0.2,
      speed: 0.05 + Math.random() * 0.05,
      isLime: Math.random() > 0.5
    }));
  }, []);
  
  const particlesRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      const t = clock.elapsedTime;
      
      if (!isLaunched) {
        // Idle animation
        groupRef.current.position.y = Math.sin(t * 2) * 0.1;
        groupRef.current.rotation.z = Math.sin(t) * 0.05;
        groupRef.current.position.x = 0;
      } else {
        // Launch animation
        groupRef.current.position.y += 0.15;
        groupRef.current.rotation.z = 0; // Straighten up
      }
      
      // Update exhaust particles
      if (particlesRef.current) {
        particles.forEach((p, i) => {
          // Move particle down
          p.y -= isLaunched ? p.speed * 4 : p.speed;
          
          // Respawn near base if it goes too low
          if (p.y < -2.5) {
            p.y = -0.6;
            p.x = (Math.random() - 0.5) * 0.2;
            p.z = (Math.random() - 0.5) * 0.2;
          }
          
          dummy.position.set(p.x, p.y, p.z);
          
          // Shrink as it falls
          const scale = Math.max(0, 1 - ((-0.6 - p.y) / 1.5));
          dummy.scale.setScalar(scale);
          
          dummy.updateMatrix();
          particlesRef.current!.setMatrixAt(i, dummy.matrix);
          
          // Set color based on isLime
          const color = p.isLime ? new THREE.Color("#c8f135") : new THREE.Color("#ffffff");
          particlesRef.current!.setColorAt(i, color);
        });
        
        particlesRef.current.instanceMatrix.needsUpdate = true;
        if (particlesRef.current.instanceColor) {
          particlesRef.current.instanceColor.needsUpdate = true;
        }
      }
    }
  });

  return (
    <group ref={groupRef}>
      {/* Body */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.15, 0.25, 1, 16]} />
        <meshStandardMaterial color="#e4e4e4" />
      </mesh>
      
      {/* Nose */}
      <mesh position={[0, 0.7, 0]}>
        <coneGeometry args={[0.15, 0.4, 16]} />
        <meshStandardMaterial color="#c8f135" />
      </mesh>
      
      {/* Window */}
      <mesh position={[0, 0.2, 0.14]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[0, 0.2, 0.13]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color="#333333" />
      </mesh>
      
      {/* Fins */}
      {[0, 1, 2].map((i) => {
        const angle = (i * Math.PI * 2) / 3;
        return (
          <mesh 
            key={i} 
            position={[Math.cos(angle) * 0.25, -0.3, Math.sin(angle) * 0.25]}
            rotation={[0, -angle, Math.PI / 8]}
          >
            <cylinderGeometry args={[0.02, 0.08, 0.4, 4]} />
            <meshStandardMaterial color="#c8f135" />
          </mesh>
        );
      })}
      
      {/* Engine Nozzle */}
      <mesh position={[0, -0.55, 0]}>
        <cylinderGeometry args={[0.15, 0.1, 0.1, 16]} />
        <meshStandardMaterial color="#333333" />
      </mesh>
      
      {/* Exhaust Particles (Instanced) */}
      <instancedMesh ref={particlesRef} args={[undefined, undefined, particlesCount]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshBasicMaterial transparent opacity={0.6} />
      </instancedMesh>
    </group>
  );
}

function StarField({ isLaunched }: { isLaunched: boolean }) {
  const pointsRef = useRef<THREE.Points>(null);
  
  const { positions, originalPositions } = useMemo(() => {
    const count = 1500;
    const pos = new Float32Array(count * 3);
    const orig = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 40;
      const y = (Math.random() - 0.5) * 40;
      const z = (Math.random() - 0.5) * 20 - 10;
      
      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;
      
      orig[i * 3] = x;
      orig[i * 3 + 1] = y;
      orig[i * 3 + 2] = z;
    }
    return { positions: pos, originalPositions: orig };
  }, []);

  useFrame((_, delta) => {
    if (pointsRef.current) {
      if (isLaunched) {
        // Move stars down to simulate upward rocket movement
        const pos = pointsRef.current.geometry.attributes.position.array as Float32Array;
        for (let i = 0; i < pos.length / 3; i++) {
          pos[i * 3 + 1] -= 30 * delta; // fast fall
          
          if (pos[i * 3 + 1] < -20) {
            pos[i * 3 + 1] = 20; // reset to top
          }
        }
        pointsRef.current.geometry.attributes.position.needsUpdate = true;
        
        // Elongate stars (hack: scale points material on Y if possible, but PointsMaterial only takes size. We just leave size, the speed creates a blur effect visually if fast enough)
      } else {
        // Just slow drift
        pointsRef.current.position.y -= delta * 0.2;
        if (pointsRef.current.position.y < -20) {
          pointsRef.current.position.y = 0;
        }
      }
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial 
        size={isLaunched ? 0.2 : 0.05} 
        color="#ffffff" 
        transparent 
        opacity={isLaunched ? 0.3 : 0.6} 
        sizeAttenuation={true} 
      />
    </points>
  );
}

export default function ApplicationRocket({ isLaunched = false }: ApplicationRocketProps) {
  return (
    <div className="w-full h-full min-h-[400px] relative pointer-events-none">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        dpr={[1, 2]}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 5, 5]} intensity={1} color="#ffffff" />
        <directionalLight position={[-5, 0, 5]} intensity={0.5} color="#c8f135" />
        
        <Rocket isLaunched={isLaunched} />
        <StarField isLaunched={isLaunched} />
      </Canvas>
    </div>
  );
}
