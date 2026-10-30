"use client";

import type { ComponentType } from "react";

/**
 * Slots for visual effects. The scene already renders a placeholder for each
 * attack; to plug in a real effect, register a component here and it will be
 * mounted at that slot's position. Effect components can read the shared battle
 * clock with `battlePhase(clock.elapsedTime)` from "./battle" inside `useFrame`.
 *
 *   wardenCast     – at the Warden's raised hand (the spell charge-up)
 *   wardenBolt     – at the monster, where each arcane bolt lands
 *   sentinelMuzzle – at the Sentinel's cannon muzzle
 *   shellImpact    – at the monster, where the ember shell lands
 *   monsterRoar    – at the monster's head
 *   hitSpark       – at the monster's chest on any hit
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

export function Effect({ name, position }: { name: EffectName } & EffectProps) {
  const Component = effectRegistry[name];
  return Component ? <Component position={position} /> : null;
}
