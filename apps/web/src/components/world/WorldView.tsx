"use client";

import { useState } from "react";
import { TERRAIN_LABEL, Tile } from "./terrain";
import { WorldScene } from "./WorldScene";

// Placeholder values until the API contract for settlement resources exists.
const RESOURCES = [
  { label: "Gold", value: "1,240", rate: "+120/h", color: "text-gold" },
  { label: "Wood", value: "850", rate: "+60/h", color: "text-amber-600" },
  { label: "Stone", value: "620", rate: "+45/h", color: "text-slate-300" },
  { label: "Grain", value: "910", rate: "+35/h", color: "text-yellow-500" },
  { label: "Population", value: "24/30", rate: "", color: "text-foreground" },
];

const RAIL = ["Settlement", "Chronicle", "Council", "Scout", "Settings"];

export function WorldView() {
  const [selected, setSelected] = useState<Tile | null>(null);

  return (
    <div className="relative h-[calc(100vh-9rem)] min-h-[480px] overflow-hidden rounded-lg border border-border bg-background">
      <WorldScene
        selected={selected}
        onSelect={setSelected}
        onClear={() => setSelected(null)}
      />

      <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center p-3">
        <ul className="pointer-events-auto flex flex-wrap justify-center gap-x-5 gap-y-1 rounded border border-border bg-surface/85 px-4 py-2 text-sm backdrop-blur">
          {RESOURCES.map((r) => (
            <li key={r.label} className="flex items-baseline gap-1.5">
              <span className="text-xs text-muted">{r.label}</span>
              <span className={`font-medium ${r.color}`}>{r.value}</span>
              {r.rate && <span className="text-xs text-emerald-400">{r.rate}</span>}
            </li>
          ))}
        </ul>
      </div>

      <ul className="absolute left-3 top-1/2 hidden -translate-y-1/2 flex-col gap-2 sm:flex">
        {RAIL.map((label) => (
          <li key={label}>
            <button
              type="button"
              className="w-24 rounded border border-border bg-surface/85 px-2 py-2 text-xs text-muted backdrop-blur transition-colors hover:text-gold"
            >
              {label}
            </button>
          </li>
        ))}
      </ul>

      <div className="pointer-events-none absolute bottom-3 left-3 max-w-xs rounded border border-border bg-surface/85 p-3 text-sm backdrop-blur">
        {selected ? (
          <>
            <p className="font-medium text-gold">{TERRAIN_LABEL[selected.terrain]}</p>
            <p className="text-xs text-muted">
              Tile ({selected.q}, {selected.r}) · distance {selected.ring} from the keep
            </p>
          </>
        ) : (
          <p className="text-xs text-muted">
            Drag to rotate · scroll to zoom · right-drag to pan · click a tile
          </p>
        )}
      </div>
    </div>
  );
}
