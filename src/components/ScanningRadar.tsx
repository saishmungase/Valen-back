import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Torus, Sphere } from "@react-three/drei";
import * as THREE from "three";

const RotatingRings = () => {
    const ring1Ref = useRef<any>();
    const ring2Ref = useRef<any>();
    const coreRef = useRef<any>();

    useFrame((state, delta) => {
        if (ring1Ref.current) {
            ring1Ref.current.rotation.z += delta * 0.5;
            ring1Ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.2;
        }
        if (ring2Ref.current) {
            ring2Ref.current.rotation.z -= delta * 0.3;
            ring2Ref.current.rotation.y = Math.cos(state.clock.elapsedTime * 0.4) * 0.2;
        }
        if (coreRef.current) {
            coreRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 2) * 0.1);
        }
    });

    return (
        <group>
            {/* Outer Ring */}
            <Torus ref={ring1Ref} args={[2, 0.05, 16, 100]} rotation={[Math.PI / 2, 0, 0]}>
                <meshBasicMaterial color="#ff1b6b" transparent opacity={0.6} />
            </Torus>

            {/* Inner Ring */}
            <Torus ref={ring2Ref} args={[1.5, 0.03, 16, 100]} rotation={[Math.PI / 3, 0, 0]}>
                <meshBasicMaterial color="#00ff88" transparent opacity={0.4} />
            </Torus>

            {/* Core Pulse */}
            <Sphere ref={coreRef} args={[0.5, 32, 32]}>
                <meshBasicMaterial color="#ff1b6b" transparent opacity={0.8} wireframe />
            </Sphere>

            {/* Scanning Particles */}
            <points>
                <sphereGeometry args={[2.5, 64, 64]} />
                <pointsMaterial color="#ff1b6b" size={0.015} transparent opacity={0.3} sizeAttenuation />
            </points>
        </group>
    );
};

const ScanningRadar = () => {
    return (
        <div className="w-full h-[400px] flex items-center justify-center overflow-hidden relative">
            <div className="absolute inset-0 z-0">
                <Canvas camera={{ position: [0, 0, 6] }}>
                    <ambientLight intensity={0.5} />
                    <RotatingRings />
                </Canvas>
            </div>
            <div className="relative z-10 text-center pointer-events-none">
                <p className="font-pixel text-primary animate-pulse tracking-widest text-xs mt-32">
                    SCANNING FOR MATCHES...
                </p>
            </div>
        </div>
    );
};

export default ScanningRadar;
