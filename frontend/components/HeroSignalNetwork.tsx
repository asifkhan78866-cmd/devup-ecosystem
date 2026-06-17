'use client'
import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import Canvas3DWrapper from '@/components/3d/Canvas3DWrapper'

const DOMAIN_COLORS = [
  '#c8f135', '#6366f1', '#ec4899', 
  '#22c55e', '#38bdf8', '#f97316',
]

function SignalCore() {
  const coreRef = useRef<THREE.Mesh>(null)
  const groupRef = useRef<THREE.Group>(null)

  const nodes = useMemo(() => {
    return Array.from({ length: 8 }, (_, i) => {
      const angle = (i / 8) * Math.PI * 2
      const radius = 1.6
      const tilt = (i % 3) * 0.6 - 0.6
      return {
        position: [
          Math.cos(angle) * radius,
          Math.sin(angle) * radius * 0.5 + tilt,
          Math.sin(angle) * radius,
        ] as [number, number, number],
        color: DOMAIN_COLORS[i % DOMAIN_COLORS.length],
        speed: 0.3 + (i % 4) * 0.15,
      }
    })
  }, [])

  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    if (coreRef.current) {
      const pulse = 1 + Math.sin(t * 2.1) * 0.06
      coreRef.current.scale.setScalar(pulse)
    }
    if (groupRef.current) {
      groupRef.current.rotation.y = t * 0.06
    }
  })

  return (
    <group ref={groupRef}>
      {/* Core */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[0.32, 32, 32]} />
        <meshStandardMaterial
          color="#c8f135"
          emissive="#c8f135"
          emissiveIntensity={0.5}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial
          color="#c8f135"
          transparent
          opacity={0.05}
        />
      </mesh>

      {/* Orbit rings */}
      {[0, 1, 2].map(i => (
        <mesh key={i} rotation={[i * 0.9, 0, i * 0.5]}>
          <torusGeometry args={[1.6, 0.003, 8, 128]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.07} />
        </mesh>
      ))}

      {/* Orbiting nodes + connecting lines */}
      {nodes.map((node, i) => (
        <OrbitNode key={i} {...node} />
      ))}
    </group>
  )
}

function OrbitNode({ position, color, speed }: {
  position: [number, number, number]
  color: string
  speed: number
}) {
  const ref = useRef<THREE.Mesh>(null)
  const basePos = useRef(new THREE.Vector3(...position))

  useFrame((state) => {
    const t = state.clock.getElapsedTime() * speed
    if (ref.current) {
      const angle = t
      const r = basePos.current.length()
      ref.current.position.x = Math.cos(angle) * r * 0.6
      ref.current.position.z = Math.sin(angle) * r * 0.6
      ref.current.position.y = basePos.current.y + Math.sin(t * 1.3) * 0.15
    }
  })

  const linePoints = useMemo(() => [
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(...position),
  ], [position])

  return (
    <>
      <mesh ref={ref} position={position}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.6}
        />
      </mesh>
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array(
              linePoints.flatMap(p => [p.x, p.y, p.z])
            ), 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color={color} transparent opacity={0.12} />
      </line>
    </>
  )
}

export default function HeroSignalNetwork() {
  return (
    <Canvas3DWrapper
      camera={{ position: [0, 0, 4.5], fov: 50 }}
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 2]}
    >
      <ambientLight intensity={0.25} />
      <pointLight position={[3, 3, 3]} color="#c8f135" intensity={2} />
      <pointLight position={[-3, -2, -3]} color="#6366f1" intensity={1.2} />
      <SignalCore />
    </Canvas3DWrapper>
  )
}
