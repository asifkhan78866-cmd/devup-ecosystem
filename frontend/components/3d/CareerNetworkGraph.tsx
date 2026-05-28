"use client";

import { useRef, useMemo, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html, Line } from "@react-three/drei";
import * as THREE from "three";

const DOMAINS = {
  "AI/ML": "#c8f135",
  "Fintech": "#22c55e",
  "HealthTech": "#38bdf8",
  "DevTools": "#a78bfa",
};

const COMPANY_NAMES = ["NexusAI", "FinEdge", "MedFlow", "BuildSpace", "Synth", "AeroDynamics"];

function generateGraphData() {
  const companies = [];
  const jobs = [];
  const links = [];

  const domainsList = Object.keys(DOMAINS) as Array<keyof typeof DOMAINS>;

  // Create 12 companies
  for (let i = 0; i < 12; i++) {
    const domain = domainsList[i % domainsList.length];
    const name = COMPANY_NAMES[i % COMPANY_NAMES.length];
    
    // Spread them out horizontally mainly, slightly vertically
    const targetX = (Math.random() - 0.5) * 12;
    const targetY = (Math.random() - 0.5) * 4;
    const targetZ = (Math.random() - 0.5) * 2;
    
    companies.push({
      id: `c-${i}`,
      name,
      domain,
      color: DOMAINS[domain],
      targetPos: new THREE.Vector3(targetX, targetY, targetZ),
      currPos: new THREE.Vector3(targetX + Math.random(), targetY + Math.random(), targetZ + Math.random()),
      openRoles: Math.floor(Math.random() * 5) + 1
    });
  }

  // Create 30 jobs
  for (let i = 0; i < 30; i++) {
    // Assign to a random company
    const companyIdx = Math.floor(Math.random() * companies.length);
    const company = companies[companyIdx];
    
    // Position jobs near their company
    const offsetX = (Math.random() - 0.5) * 2;
    const offsetY = (Math.random() - 0.5) * 2;
    const offsetZ = (Math.random() - 0.5) * 2;
    
    jobs.push({
      id: `j-${i}`,
      companyId: company.id,
      targetOffset: new THREE.Vector3(offsetX, offsetY, offsetZ),
      currPos: new THREE.Vector3()
    });
    
    links.push({ sourceId: company.id, targetId: `j-${i}` });
  }

  return { companies, jobs, links };
}

function GraphNetwork() {
  const { companies, jobs, links } = useMemo(() => generateGraphData(), []);
  const [hoveredCompany, setHoveredCompany] = useState<string | null>(null);
  
  // Create refs for fast position updates without React state overhead
  const companyRefs = useRef<(THREE.Mesh | null)[]>([]);
  const jobRefs = useRef<(THREE.Mesh | null)[]>([]);
  const jobPosRefs = useRef<THREE.Vector3[]>(jobs.map(() => new THREE.Vector3()));
  
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    
    // Update companies
    companies.forEach((comp, i) => {
      const mesh = companyRefs.current[i];
      if (!mesh) return;
      
      comp.currPos.x += (comp.targetPos.x - comp.currPos.x) * 0.02 + Math.sin(t + i) * 0.002;
      comp.currPos.y += (comp.targetPos.y - comp.currPos.y) * 0.02 + Math.cos(t + i) * 0.002;
      comp.currPos.z += (comp.targetPos.z - comp.currPos.z) * 0.02 + Math.sin(t + i * 0.5) * 0.002;
      
      mesh.position.copy(comp.currPos);
    });
    
    // Update jobs
    jobs.forEach((job, i) => {
      const mesh = jobRefs.current[i];
      if (!mesh) return;
      
      const comp = companies.find(c => c.id === job.companyId)!;
      const targetX = comp.currPos.x + job.targetOffset.x;
      const targetY = comp.currPos.y + job.targetOffset.y;
      const targetZ = comp.currPos.z + job.targetOffset.z;
      
      job.currPos.x += (targetX - job.currPos.x) * 0.05 + Math.sin(t * 2 + i) * 0.01;
      job.currPos.y += (targetY - job.currPos.y) * 0.05 + Math.cos(t * 2 + i) * 0.01;
      job.currPos.z += (targetZ - job.currPos.z) * 0.05;
      
      mesh.position.copy(job.currPos);
      jobPosRefs.current[i].copy(job.currPos);
    });
  });

  return (
    <group>
      {/* Links */}
      {/* Because lines need exact point updates per frame, React Drei Line is tricky to animate purely via refs inside useFrame without state triggers.
          For performance, we just draw them slightly static or we map them in a single frame update.
          For visual flair without killing performance, we can just use the Line component and let it trail slightly, 
          or we can accept that the lines will snap to the React re-render state.
          We will use a simpler approach: the jobs drift near the company, and the line just connects their logical centers.
      */}
      {links.map((link, i) => {
        const comp = companies.find(c => c.id === link.sourceId)!;
        const job = jobs.find(j => j.id === link.targetId)!;
        
        const isHoveredLine = hoveredCompany === comp.id;
        const opacity = hoveredCompany === null ? 0.04 : (isHoveredLine ? 0.15 : 0.01);
        
        return (
          <DynamicLine 
            key={`l-${i}`} 
            company={comp} 
            job={job} 
            opacity={opacity} 
          />
        );
      })}

      {/* Companies */}
      {companies.map((comp, i) => {
        const isHovered = hoveredCompany === comp.id;
        const opacity = hoveredCompany === null ? 1 : (isHovered ? 1 : 0.4);
        
        return (
          <mesh 
            key={comp.id}
            ref={(el) => { companyRefs.current[i] = el; }}
            onPointerOver={(e) => { e.stopPropagation(); setHoveredCompany(comp.id); document.body.style.cursor="pointer"; }}
            onPointerOut={() => { setHoveredCompany(null); document.body.style.cursor="auto"; }}
          >
            <sphereGeometry args={[0.15, 16, 16]} />
            <meshStandardMaterial color={comp.color} emissive={comp.color} emissiveIntensity={0.5} transparent opacity={opacity} />
            
            <Html center distanceFactor={15} style={{ pointerEvents: "none", opacity: isHovered ? 1 : 0.6, transition: 'opacity 0.2s' }}>
              <div 
                style={{
                  fontFamily: "var(--font-inter), sans-serif",
                  fontSize: "8px",
                  color: "#ffffff",
                  whiteSpace: "nowrap",
                  textShadow: "0 2px 4px rgba(0,0,0,0.8)"
                }}
              >
                {comp.name}
              </div>
              {isHovered && (
                <div 
                  style={{
                    background: "#c8f135",
                    color: "#000",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    fontSize: "10px",
                    fontWeight: "bold",
                    marginTop: "4px",
                    boxShadow: "0 4px 12px rgba(200,241,53,0.3)"
                  }}
                >
                  {comp.openRoles} open roles
                </div>
              )}
            </Html>
          </mesh>
        );
      })}

      {/* Jobs */}
      {jobs.map((job, i) => {
        const isHovered = hoveredCompany === job.companyId;
        const opacity = hoveredCompany === null ? 0.6 : (isHovered ? 0.8 : 0.2);
        
        return (
          <mesh 
            key={job.id}
            ref={(el) => { jobRefs.current[i] = el; }}
          >
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={opacity} />
          </mesh>
        );
      })}
    </group>
  );
}

// A component that updates a single line based on the object's current position refs
function DynamicLine({ company, job, opacity }: { company: any, job: any, opacity: number }) {
  const lineRef = useRef<any>(null);
  
  useFrame(() => {
    if (lineRef.current) {
      const positions = lineRef.current.geometry.attributes.position.array;
      positions[0] = company.currPos.x;
      positions[1] = company.currPos.y;
      positions[2] = company.currPos.z;
      
      positions[3] = job.currPos.x;
      positions[4] = job.currPos.y;
      positions[5] = job.currPos.z;
      
      lineRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <line ref={lineRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[new Float32Array(6), 3]}
        />
      </bufferGeometry>
      <lineBasicMaterial color="#ffffff" transparent opacity={opacity} />
    </line>
  );
}

export default function CareerNetworkGraph() {
  return (
    <div className="w-full h-[300px] relative pointer-events-auto">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 60 }}
        dpr={[1, 2]}
      >
        <ambientLight intensity={0.5} />
        <GraphNetwork />
      </Canvas>
    </div>
  );
}
