"use client";

import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { Suspense, useRef } from "react";
import type { Group } from "three";
import { hold } from "./battle";
import { engine, progress, specialHit } from "./battleEngine";
import { EffectModel } from "./models";
import { heroPoint, targetPoint } from "./Projectiles";
import { MODEL_URLS } from "./skins";

Object.values(MODEL_URLS).forEach((u) => useGLTF.preload(u));

/** Magic orb that swells at the Warden's raised hand while he channels the Hexstaff. */
export function CastOrb() {
  const g = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (!g.current) return;
    const h = hold(progress("warden", "staff"));
    g.current.visible = h > 0.02;
    g.current.scale.setScalar(h * (1 + Math.sin(clock.elapsedTime * 18) * 0.08));
    g.current.rotation.y = clock.elapsedTime * 2;
  });
  return (
    <Suspense fallback={null}>
      <EffectModel url={MODEL_URLS.orb} scale={0.13} group={g} additive opacity={0.9} />
    </Suspense>
  );
}

/** A spinning star that pops on whatever was hit last. */
export function HitStar() {
  const g = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (!g.current) return;
    const imp = engine.impacts[engine.impacts.length - 1];
    const age = imp ? engine.now - imp.t : 9;
    g.current.visible = age >= 0 && age < 0.5;
    if (!g.current.visible || !imp) return;
    const k = 1 - Math.pow(1 - age / 0.5, 2);
    g.current.scale.setScalar(0.03 * (0.4 + k) * (1 - age / 0.5 + 0.2) * (0.8 + imp.power * 0.5));
    g.current.rotation.set(clock.elapsedTime * 3, clock.elapsedTime * 5, 0);
  });
  return (
    <Suspense fallback={null}>
      <EffectModel url={MODEL_URLS.star} scale={1} group={g} additive opacity={0.95} />
    </Suspense>
  );
}

/** The big magic burst that detonates when Soul Rend or Earthshatter lands. */
export function SpecialBurst() {
  const g = useRef<Group>(null);
  useFrame(() => {
    if (!g.current) return;
    const s = specialHit();
    g.current.visible = !!s;
    if (!s) return;
    const k = Math.min(1, s.age / 0.5);
    g.current.scale.setScalar(0.4 + k * 1.3);
    g.current.rotation.y = s.age * 2.5;
  });
  return (
    <Suspense fallback={null}>
      <EffectModel url={MODEL_URLS.magnitude} scale={1} group={g} additive opacity={0.85} />
    </Suspense>
  );
}

/** The thrown Ember Flask: flies in an arc, tumbling, its flame glowing. */
export function FlaskThrow() {
  const g = useRef<Group>(null);
  useFrame(() => {
    if (!g.current) return;
    const f = engine.flask;
    const u = f ? (engine.now - f.start) / 0.55 : -1;
    g.current.visible = !!f && u >= 0 && u <= 1;
    if (!f || u < 0 || u > 1) return;
    const from = heroPoint(f.hero, 1.1, [0.3, 0.9, 0.3]);
    const to = targetPoint(f.hero);
    g.current.position.set(
      from[0] + (to[0] - from[0]) * u,
      from[1] + (to[1] - from[1]) * u + Math.sin(u * Math.PI) * 0.8,
      from[2] + (to[2] - from[2]) * u,
    );
    g.current.rotation.set(u * 14, u * 6, 0);
  });
  return (
    <Suspense fallback={null}>
      <EffectModel url={MODEL_URLS.flask} scale={0.22} group={g} />
    </Suspense>
  );
}
