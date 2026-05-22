'use client'
import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Stars, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

function Globe() {
  const meshRef = useRef<THREE.Mesh>(null)
  const pointsRef = useRef<THREE.Points>(null)

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.002
    }
    if (pointsRef.current) {
      pointsRef.current.rotation.y += 0.002
    }
  })

  // Create dot positions on sphere surface using fibonacci sphere
  const dotPositions = (() => {
    const positions: number[] = []
    const count = 12
    const goldenRatio = (1 + Math.sqrt(5)) / 2
    for (let i = 0; i < count; i++) {
      const theta = Math.acos(1 - (2 * i) / count)
      const phi = (2 * Math.PI * i) / goldenRatio
      const r = 1.02
      positions.push(
        r * Math.sin(theta) * Math.cos(phi),
        r * Math.sin(theta) * Math.sin(phi),
        r * Math.cos(theta)
      )
    }
    return new Float32Array(positions)
  })()

  return (
    <>
      {/* Main wireframe sphere */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial
          color="#6366f1"
          wireframe={true}
          transparent={true}
          opacity={0.25}
        />
      </mesh>

      {/* Inner glow sphere */}
      <mesh>
        <sphereGeometry args={[0.98, 32, 32]} />
        <meshStandardMaterial
          color="#6366f1"
          transparent={true}
          opacity={0.04}
          side={THREE.BackSide}
        />
      </mesh>

      {/* City dots on surface */}
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[dotPositions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          color="#a855f7"
          size={0.06}
          sizeAttenuation={true}
          transparent={true}
          opacity={0.9}
        />
      </points>

      {/* Lighting */}
      <ambientLight intensity={0.3} />
      <pointLight position={[2, 2, 2]} color="#6366f1" intensity={2} />
      <pointLight position={[-2, -2, -2]} color="#a855f7" intensity={1} />
    </>
  )
}

export default function EcosystemGlobe() {
  return (
    <div className="w-[400px] h-[400px] relative max-w-full">
      {/* Outer glow ring */}
      <div className="absolute inset-0 rounded-full 
        bg-indigo-500/5 blur-3xl scale-110 pointer-events-none" />
      
      <Canvas
        camera={{ position: [0, 0, 2.8], fov: 45 }}
        gl={{ 
          antialias: true, 
          alpha: true,
          powerPreference: 'high-performance'
        }}
        style={{ background: 'transparent' }}
      >
        <Stars
          radius={80}
          depth={50}
          count={2000}
          factor={3}
          saturation={0}
          fade={true}
          speed={0.5}
        />
        <Globe />
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate={false}
          dampingFactor={0.08}
          enableDamping={true}
        />
      </Canvas>
    </div>
  )
}
