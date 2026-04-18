import { Line, OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useMemo } from "react";
import * as THREE from "three";
import {
  CONE_SLOPE,
  type ConicAnalysis,
  sampleConicWorld,
} from "../math/conics";

type Props = {
  analysis: ConicAnalysis;
  coneHeight: number;
};

function SceneContent({ analysis, coneHeight }: Props) {
  const R = CONE_SLOPE * coneHeight;
  const quat = useMemo(() => {
    const n = new THREE.Vector3(...analysis.normal).normalize();
    return new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 0, 1),
      n,
    );
  }, [analysis.normal]);

  const planeEdges = useMemo(
    () => new THREE.EdgesGeometry(new THREE.PlaneGeometry(14, 14)),
    [],
  );

  const lineBranches = useMemo(() => {
    const buf = sampleConicWorld(analysis, 160);
    const out: THREE.Vector3[] = [];
    for (let i = 0; i < buf.length; i += 3) {
      out.push(new THREE.Vector3(buf[i], buf[i + 1], buf[i + 2]));
    }
    if (analysis.kind !== "hyperbola" || out.length < 4) {
      return [out];
    }
    // Two equal-length branches in `sampleConicUV`; do not use mid+1 or the
    // first Line includes the other's start point and draws a chord between arms.
    const firstLen = out.length / 2;
    return [out.slice(0, firstLen), out.slice(firstLen)];
  }, [analysis]);

  return (
    <>
      <color attach="background" args={["#0b1020"]} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[6, 10, 4]} intensity={1.1} />
      <directionalLight position={[-4, 2, -6]} intensity={0.35} />

      <group>
        <mesh position={[0, -coneHeight / 2, 0]}>
          <coneGeometry args={[R, coneHeight, 64, 1, false]} />
          <meshStandardMaterial
            color="#3b5bdb"
            metalness={0.15}
            roughness={0.45}
            transparent
            opacity={0.88}
          />
        </mesh>
        <mesh position={[0, coneHeight / 2, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[R, coneHeight, 64, 1, false]} />
          <meshStandardMaterial
            color="#4c6ef5"
            metalness={0.12}
            roughness={0.48}
            transparent
            opacity={0.88}
          />
        </mesh>
      </group>

      <mesh position={analysis.p0} quaternion={quat}>
        <planeGeometry args={[14, 14]} />
        <meshStandardMaterial
          color="#e7f5ff"
          transparent
          opacity={0.28}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {lineBranches.map((pts: THREE.Vector3[], i: number) => (
        <Line key={i} points={pts} color="#5ce1e6" lineWidth={2} />
      ))}

      <lineSegments
        position={analysis.p0}
        quaternion={quat}
        geometry={planeEdges}
      >
        <lineBasicMaterial color="#a5d8ff" transparent opacity={0.65} />
      </lineSegments>

      <OrbitControls
        enablePan
        minDistance={4}
        maxDistance={22}
        target={[0, 1.1, 0]}
      />
    </>
  );
}

export function ConePlaneScene({ analysis }: { analysis: ConicAnalysis }) {
  const coneHeight = 5.2;
  return (
    <Canvas
      camera={{ position: [6.2, 4.4, 7.2], fov: 48, near: 0.1, far: 80 }}
      gl={{ antialias: true }}
      dpr={[1, 2]}
    >
      <SceneContent analysis={analysis} coneHeight={coneHeight} />
    </Canvas>
  );
}
