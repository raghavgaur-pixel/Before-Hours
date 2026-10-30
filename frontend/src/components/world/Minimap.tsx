"use client";

import { useEffect, useRef } from "react";
import { engine } from "./battleEngine";
import { HEX_SIZE, TILES, Terrain, Tile } from "./terrain";

const COLOR: Record<Terrain, string> = {
  village: "#d6a24b",
  grass: "#4a6a34",
  farm: "#8a7a2c",
  forest: "#25402b",
  mountain: "#4a4f58",
  water: "#1f7a82",
};

export function Minimap({ selected, scale = 1, tick = 0 }: { selected: Tile | null; scale?: number; tick?: number }) {
  const W = Math.round(190 * scale);
  const H = Math.round(130 * scale);
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (!ctx) return;
    const maxX = Math.max(...TILES.map((t) => Math.abs(t.x))) + HEX_SIZE;
    const maxZ = Math.max(...TILES.map((t) => Math.abs(t.z))) + HEX_SIZE;
    const k = Math.min((W / 2 - 4) / maxX, (H / 2 - 4) / maxZ);
    const rad = HEX_SIZE * k * 1.02;

    ctx.clearRect(0, 0, W, H);
    const hex = (cx: number, cy: number, stroke?: string) => {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i + Math.PI / 6;
        const px = cx + Math.cos(a) * rad;
        const py = cy + Math.sin(a) * rad;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      if (stroke) {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      } else ctx.fill();
    };
    for (const t of TILES) {
      ctx.fillStyle = COLOR[t.terrain];
      hex(W / 2 + t.x * k, H / 2 + t.z * k);
    }
    if (selected) hex(W / 2 + selected.x * k, H / 2 + selected.z * k, "#f3d98b");
    const dot = (x: number, z: number, color: string, r: number) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(W / 2 + x * k, H / 2 + z * k, r, 0, Math.PI * 2);
      ctx.fill();
    };
    const EDOT: Record<string, [string, number]> = {
      monster: ["#ff4a3a", 3.5],
      zombie: ["#9be36b", 2],
      villain: ["#ffb347", 2.2],
      boss: ["#ffd24a", 5],
    };
    for (const e of Object.values(engine.enemies)) {
      if (!e.alive) continue;
      const [c, r] = EDOT[e.kind];
      dot(e.x, e.z, c, r * scale);
    }
    dot(engine.pos.warden.x, engine.pos.warden.z, "#34e0c0", 3 * scale);
    dot(engine.pos.sentinel.x, engine.pos.sentinel.z, "#ff9a3c", 3 * scale);
  }, [selected, scale, tick, W, H]);

  return (
    <canvas
      ref={ref}
      width={W}
      height={H}
      aria-label="World minimap"
      className="rounded border border-gold/40 bg-black/60"
    />
  );
}
