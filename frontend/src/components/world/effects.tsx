"use client";

import { useFrame } from "@react-three/fiber";
import { useRef, type ComponentType } from "react";
import type { Group } from "three";
import { actorPoint, heroPoint, targetPoint } from "./Projectiles";

/**
 * Slots for visual effects. To plug in a real effect, register a component here
 * and it is mounted at that slot's anchor, which follows the hero or enemy
 * automatically. Effect components can read the shared battle state with
 * `engine` / `progress` / `hitFlash` from "./battleEngine" inside `useFrame`.
 *
 *   wardenCast     – at the Warden's raised hand (the spell charge-up)
 *   wardenBolt     – on the Warden's current target, where bolts and arrows land
 *   sentinelMuzzle – at the Sentinel's cannon muzzle
 *   shellImpact    – on the Sentinel's current target, where the shell lands
 *   monsterRoar    – at the monster's head
 *   hitSpark       – on the monster's chest
 */
export type EffectName =
  | "wardenCast"
  | "wardenBolt"
  | "sentinelMuzzle"
  | "shellImpact"
  | "monsterRoar"
  | "hitSpark";

export type EffectProps = { position: [number, number, number] };

export const effectRegistry: Partial<Record<EffectName, ComponentType<EffectProps>>> = {};

const anchor = (name: EffectName): [number, number, number] => {
  switch (name) {
    case "wardenCast":
      return heroPoint("warden", 1.1, [-0.4, 1.0, 0.15]);
    case "wardenBolt":
      return targetPoint("warden");
    case "sentinelMuzzle":
      return heroPoint("sentinel", 1.15, [0.3, 0.86, 0.36]);
    case "shellImpact":
      return targetPoint("sentinel");
    case "monsterRoar": {
      const p = actorPoint("monster");
      return [p[0], p[1] + 0.65, p[2]];
    }
    default:
      return actorPoint("monster");
  }
};

export function Effect({ name }: { name: EffectName }) {
  const ref = useRef<Group>(null);
  const Component = effectRegistry[name];
  useFrame(() => {
    if (Component && ref.current) ref.current.position.set(...anchor(name));
  });
  return Component ? (
    <group ref={ref}>
      <Component position={[0, 0, 0]} />
    </group>
  ) : null;
}
