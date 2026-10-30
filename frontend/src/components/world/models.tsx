"use client";

import { useAnimations, useGLTF } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import { Color, Group, Mesh, MeshBasicMaterial, MeshStandardMaterial, type Material, type Object3D } from "three";
import { SkeletonUtils } from "three-stdlib";

/** Clone a loaded scene and make its materials safe for this lighting setup. */
function prepare(scene: Object3D, opts: { flat?: boolean; opacity?: number } = {}) {
  const clone = SkeletonUtils.clone(scene);
  clone.traverse((o) => {
    const m = o as Mesh;
    if (!m.isMesh) return;
    const mat = (Array.isArray(m.material) ? m.material[0] : m.material).clone() as MeshStandardMaterial;
    // Glass materials need an extra render pass; fake them with plain transparency.
    if ("transmission" in mat && (mat as { transmission: number }).transmission > 0) {
      (mat as { transmission: number }).transmission = 0;
      mat.transparent = true;
      mat.opacity = Math.min(mat.opacity, 0.75);
    }
    if (opts.opacity !== undefined) {
      mat.transparent = true;
      mat.opacity = opts.opacity;
    }
    if (opts.flat) m.material = new MeshBasicMaterial({ map: mat.map ?? null, color: mat.color ?? new Color("#fff"), transparent: true, opacity: opts.opacity ?? 1, toneMapped: false, depthWrite: false });
    else m.material = mat as Material;
    m.castShadow = false;
    m.receiveShadow = false;
  });
  return clone;
}

/** A static, scanned character mesh that replaces the code-built body. */
export function SkinModel({ url, scale, y, rotY }: { url: string; scale: number; y: number; rotY: number }) {
  const { scene } = useGLTF(url);
  const obj = useMemo(() => prepare(scene), [scene]);
  return (
    <group rotation={[0, rotY, 0]} position={[0, y, 0]} scale={scale}>
      <primitive object={obj} />
    </group>
  );
}

/**
 * An animated effect model (orbs, bursts, flask). Its baked animation loops;
 * `visible`, `scale` and `spin` are driven by the parent through the returned group.
 */
export function EffectModel({
  url,
  scale = 1,
  group,
  opacity,
  additive = false,
}: {
  url: string;
  scale?: number;
  group: React.RefObject<Group | null>;
  opacity?: number;
  additive?: boolean;
}) {
  const { scene, animations } = useGLTF(url);
  const obj = useMemo(() => prepare(scene, { opacity }), [scene, opacity]);
  const holder = useRef<Group>(null);
  const { actions } = useAnimations(animations, holder);
  useEffect(() => {
    Object.values(actions).forEach((a) => a?.reset().play());
  }, [actions]);
  useEffect(() => {
    if (!additive) return;
    obj.traverse((o) => {
      const m = o as Mesh;
      if (m.isMesh) (m.material as MeshStandardMaterial).blending = 2;
    });
  }, [obj, additive]);
  return (
    <group ref={group} visible={false}>
      <group ref={holder} scale={scale}>
        <primitive object={obj} />
      </group>
    </group>
  );
}
