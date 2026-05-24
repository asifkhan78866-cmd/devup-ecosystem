"use client";

import dynamic from "next/dynamic";

const ServiceOrbit3D = dynamic(
  () => import("@/components/build-with-devup/ServiceOrbit3D"),
  { ssr: false, loading: () => <div className="w-full h-[600px] bg-black/50 animate-pulse" /> }
);

export function ServiceOrbitWrapper() {
  return <ServiceOrbit3D />;
}
