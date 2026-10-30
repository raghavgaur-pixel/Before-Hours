"use client";

import { Sparkles } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useRef } from "react";
import type { DirectionalLight, Group, Mesh, MeshBasicMaterial, PointLight } from "three";
import { SkinModel } from "@/components/world/models";

const ease = (t: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);
/** Two lightning strikes, matching the white flash on the page (1.25s–2.2s). */
const lightning = (t: number) => Math.max(Math.exp(-Math.pow((t - 1.33) * 18, 2)), 0.7 * Math.exp(-Math.pow((t - 1.5) * 16, 2)));

function Cinematic({ skip }: { skip: boolean }) {
  const t0 = useRef<number | null>(null);
  const bolt = useRef<DirectionalLight>(null);
  const ember = useRef<PointLight>(null);
  const runes = useRef<Group>(null);
  const runeGlow = useRef<Mesh>(null);
  const eyes = useRef<Group>(null);
  const hero = useRef<Group>(null);

  useFrame(({ clock, camera, size }) => {
    const aspectSide = size.width > 900 ? 1.45 : 0;
    if (t0.current === null) t0.current = clock.elapsedTime;
    let t = clock.elapsedTime - t0.current;
    if (skip) t = Math.max(t, 6);

    // Camera: a slow push-in from the dark, then a gentle drift around the hero.
    const k = ease((t - 0.4) / 3.2);
    const sway = Math.sin(Math.max(0, t - 3.6) * 0.25) * 0.35;
    const dist = 9.5 - 4.6 * k;
    // On wide screens the hero settles left of centre, leaving room for the sign-in card.
    const side = aspectSide * ease((t - 2.8) / 1.6);
    camera.position.set(Math.sin(sway) * dist + side, 0.7 + 0.7 * k, Math.cos(sway) * dist);
    camera.lookAt(side, 1.15, 0);

    const flash = lightning(t);
    if (bolt.current) bolt.current.intensity = 0.2 + flash * 9;
    if (ember.current) ember.current.intensity = (2.2 + Math.sin(t * 7) * 0.4 + Math.sin(t * 13) * 0.25) * ease(t / 1.5);
    if (runes.current) runes.current.rotation.y = t * 0.15;
    if (runeGlow.current) (runeGlow.current.material as MeshBasicMaterial).opacity = 0.25 + 0.55 * ease((t - 2.4) / 1.4) + flash * 0.3;
    // The final boss's eyes burn in the fog once the lightning has shown him.
    if (eyes.current) eyes.current.scale.setScalar(Math.max(0.001, ease((t - 1.4) / 1.2)) * (1 + Math.sin(t * 2) * 0.05));
    if (hero.current) hero.current.position.y = 0.42 + Math.sin(t * 1.3) * 0.01;
  });

  return (
    <>
      <color attach="background" args={["#05070a"]} />
      <fog attach="fog" args={["#05070a", 6, 26]} />
      <ambientLight intensity={0.25} color="#8fa0c8" />
      <directionalLight ref={bolt} position={[-4, 9, -6]} color="#cfe0ff" intensity={0.2} />
      <spotLight position={[0, 5, -4]} angle={0.5} penumbra={0.8} intensity={60} color="#9fc4ff" distance={14} />
      <pointLight ref={ember} position={[0, 0.4, 1.6]} color="#ff8a3d" intensity={0} distance={7} />

      {/* Moon behind the fog. */}
      <mesh position={[7, 10, -40]}>
        <circleGeometry args={[2.2, 48]} />
        <meshBasicMaterial color="#e8eeff" fog={false} transparent opacity={0.28} />
      </mesh>
      <mesh position={[7, 10, -40.1]}>
        <circleGeometry args={[3.4, 48]} />
        <meshBasicMaterial color="#9fb4ff" fog={false} transparent opacity={0.06} />
      </mesh>

      {/* The Grafted King's eyes, far away in the dark. */}
      <group ref={eyes} position={[1.4, 2.1, -20]}>
        {[-0.32, 0.32].map((x) => (
          <group key={x} position={[x, 0, 0]}>
            <mesh>
              <sphereGeometry args={[0.07, 10, 10]} />
              <meshBasicMaterial color="#ffd27a" fog={false} toneMapped={false} />
            </mesh>
            <mesh>
              <sphereGeometry args={[0.2, 12, 12]} />
              <meshBasicMaterial color="#ff8a2a" fog={false} transparent opacity={0.18} toneMapped={false} depthWrite={false} />
            </mesh>
          </group>
        ))}
      </group>

      {/* Ground, rock pedestal and the rotating rune circle. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[40, 48]} />
        <meshStandardMaterial color="#0b0e12" roughness={1} />
      </mesh>
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[1.25, 1.55, 0.42, 9]} />
        <meshStandardMaterial color="#2a2c31" roughness={1} flatShading />
      </mesh>
      <group ref={runes} position={[0, 0.02, 0]}>
        <mesh ref={runeGlow} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[2.1, 2.2, 64]} />
          <meshBasicMaterial color="#c9a24b" transparent opacity={0.25} toneMapped={false} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, Math.PI / 6]}>
          <ringGeometry args={[2.45, 2.5, 6]} />
          <meshBasicMaterial color="#c9a24b" transparent opacity={0.4} toneMapped={false} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[2.75, 2.78, 3]} />
          <meshBasicMaterial color="#c9a24b" transparent opacity={0.3} toneMapped={false} />
        </mesh>
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i / 12) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(a) * 2.32, 0.01, Math.sin(a) * 2.32]} rotation={[-Math.PI / 2, 0, a]}>
              <planeGeometry args={[0.12, 0.28]} />
              <meshBasicMaterial color="#ffd27a" transparent opacity={0.6} toneMapped={false} />
            </mesh>
          );
        })}
      </group>

      {/* Your hero: the Stoneguard. */}
      <group ref={hero} position={[0, 0.42, 0]}>
        <Suspense fallback={null}>
          <SkinModel url="/models/stoneguard.glb" scale={0.9} y={0.86} rotY={0} />
        </Suspense>
      </group>

      <Sparkles count={120} scale={[10, 6, 10]} position={[0, 2, 0]} size={3} speed={0.45} color="#ff9a4d" opacity={0.85} />
      <Sparkles count={80} scale={[14, 7, 14]} position={[0, 3, -2]} size={2} speed={0.15} color="#9aa3ad" opacity={0.4} />
    </>
  );
}

/** Full-screen 3D backdrop for the home page's start animation. */
export function IntroScene({ skip }: { skip: boolean }) {
  return (
    <Canvas camera={{ position: [0, 0.7, 9.5], fov: 35 }} dpr={[1, 2]}>
      <Cinematic skip={skip} />
    </Canvas>
  );
}
