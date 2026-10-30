"use client";

import { useState } from "react";
import { Minimap } from "./Minimap";
import { TERRAIN_LABEL, Tile } from "./terrain";
import { WorldScene } from "./WorldScene";

// Placeholder values until the API contract for settlement resources exists.
const RESOURCES = [
  { label: "Gold", value: "1,240", rate: "+120/h", color: "text-gold" },
  { label: "Wood", value: "850", rate: "+60/h", color: "text-amber-600" },
  { label: "Stone", value: "620", rate: "+45/h", color: "text-slate-300" },
  { label: "Grain", value: "910", rate: "+35/h", color: "text-yellow-500" },
  { label: "Pop", value: "24/30", rate: "", color: "text-foreground" },
  { label: "Army", value: "3/5", rate: "", color: "text-foreground" },
];

const TOOLBAR = ["Build", "Town", "Research", "Council", "Army"];
const RAIL = ["Home", "Chronicle", "Council", "Scout", "Settings"];

const btn =
  "border border-gold/40 bg-black/60 text-xs text-muted backdrop-blur transition-colors hover:border-gold hover:text-gold";

export function WorldView() {
  const [selected, setSelected] = useState<Tile | null>(null);

  return (
    <div className="fixed inset-x-0 bottom-0 top-[61px] z-0 bg-background">
      <WorldScene
        selected={selected}
        onSelect={setSelected}
        onClear={() => setSelected(null)}
      />

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(4,6,8,0.75)_100%)]" />
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-3 top-3 flex items-start gap-3">
          <div
            className="flex h-20 w-14 items-center justify-center border border-gold/50 bg-[#0f2a22]/90 pb-3 text-xs font-semibold tracking-widest text-gold"
            style={{ clipPath: "polygon(0 0, 100% 0, 100% 80%, 50% 100%, 0 80%)" }}
          >
            AH
          </div>
          <ul className="pointer-events-auto hidden gap-2 pt-1 md:flex">
            {TOOLBAR.map((l) => (
              <li key={l}>
                <button type="button" className={`${btn} h-11 min-w-16 rounded px-2`}>
                  {l}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <ul className="pointer-events-auto absolute left-1/2 top-3 flex max-w-[60vw] -translate-x-1/2 flex-wrap justify-center gap-x-5 gap-y-1 rounded border border-gold/40 bg-black/65 px-4 py-2 text-sm backdrop-blur">
          {RESOURCES.map((r) => (
            <li key={r.label} className="flex items-baseline gap-1.5">
              <span className="text-xs text-muted">{r.label}</span>
              <span className={`font-medium ${r.color}`}>{r.value}</span>
              {r.rate && <span className="text-xs text-emerald-400">{r.rate}</span>}
            </li>
          ))}
        </ul>

        <div className="absolute right-3 top-3 hidden flex-col items-end gap-2 sm:flex">
          <Minimap selected={selected} />
          <div className="rounded border border-gold/40 bg-black/60 px-3 py-1 text-[10px] tracking-[0.3em] text-gold">
            N · E · S · W
          </div>
        </div>

        <ul className="pointer-events-auto absolute left-3 top-1/2 hidden -translate-y-1/2 flex-col gap-2 sm:flex">
          {RAIL.map((l) => (
            <li key={l}>
              <button type="button" className={`${btn} h-11 w-20 rounded`}>
                {l}
              </button>
            </li>
          ))}
        </ul>

        <div className="absolute bottom-3 left-3 max-w-xs rounded border border-gold/40 bg-black/65 p-3 text-sm backdrop-blur">
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
    </div>
  );
}
