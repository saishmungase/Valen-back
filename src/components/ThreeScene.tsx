import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial, Float, MeshDistortMaterial, Icosahedron, Torus } from "@react-three/drei";
import * as THREE from "three";

// Particle field component
const ParticleField = (props: any) => {
    const ref = useRef<any>();

    // Generate random points in a sphere
    const sphere = useMemo(() => {
        // Generate 5000 points
        const count = 5000;
        const positions = new Float32Array(count * 3);
        const r = 1.5; // Radius

        for (let i = 0; i < count; i++) {
            const u = Math.random();
            const v = Math.random();
            const theta = 2 * Math.PI * u;
            const phi = Math.acos(2 * v - 1);

            const x = r * Math.sin(phi) * Math.cos(theta);
            const y = r * Math.sin(phi) * Math.sin(theta);
            const z = r * Math.cos(phi);

            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;
        }

        return positions;
    }, []);

    useFrame((state, delta) => {
        if (ref.current) {
            ref.current.rotation.x -= delta / 10;
            ref.current.rotation.y -= delta / 15;
        }
    });

    return (
        <group rotation={[0, 0, Math.PI / 4]}>
            <Points ref={ref} positions={sphere} stride={3} frustumCulled={false} {...props}>
                <PointMaterial
                    transparent
                    color="#ff1b6b" // Primary pink color
                    size={0.005} // Smaller size
                    sizeAttenuation={true}
                    depthWrite={false}
                />
            </Points>
        </group>
    );
};

const FloatingShapes = () => {
    return (
        <group>
            <Float speed={4} rotationIntensity={1} floatIntensity={2}>
                <Icosahedron args={[0.3, 0]} position={[1.2, 0.5, 0.5]}>
                    <MeshDistortMaterial
                        color="#ff1b6b"
                        attach="material"
                        distort={0.4}
                        speed={2}
                        roughness={0}
                        transparent
                        opacity={0.6}
                    />
                </Icosahedron>
            </Float>

            <Float speed={2} rotationIntensity={2} floatIntensity={1.5}>
                <Torus args={[0.2, 0.08, 16, 100]} position={[-1.2, -0.5, 0.5]}>
                    <meshStandardMaterial
                        color="#00ff88"
                        roughness={0}
                        transparent
                        opacity={0.5}
                        side={THREE.DoubleSide}
                    />
                </Torus>
            </Float>
            <Float speed={3} rotationIntensity={1.5} floatIntensity={2}>
                <Icosahedron args={[0.2, 0]} position={[-0.8, 0.8, 0]}>
                    <MeshDistortMaterial
                        color="#3300ff"
                        attach="material"
                        distort={0.6}
                        speed={3}
                        roughness={0}
                        transparent
                        opacity={0.4}
                    />
                </Icosahedron>
            </Float>
        </group>
    )
}

const ThreeScene = () => {
    return (
        <div className="absolute inset-0 -z-10 bg-background overflow-hidden w-full h-full">
            <Canvas camera={{ position: [0, 0, 2] }}>
                <ambientLight intensity={0.5} />
                <directionalLight position={[10, 10, 5]} intensity={1} />
                <ParticleField />
                <FloatingShapes />
            </Canvas>
        </div>
    );
};

export default ThreeScene;
