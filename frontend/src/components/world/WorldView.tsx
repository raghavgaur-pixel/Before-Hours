"use client";

import { useEffect, useState } from "react";
import {
  HERO_NAME,
  SPECIALS,
  WEAPONS,
  cooldownLeft,
  currentWeapon,
  cycleWeapon,
  engine,
  heroAct,
  selectHero,
  selectWeapon,
  toggleAuto,
  toggleHero,
  useBattle,
  type HeroId,
  type WeaponId,
} from "./battleEngine";
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

const GLYPH: Record<WeaponId | "special", string> = {
  blade: "⚔",
  staff: "✦",
  bow: "➶",
  hammer: "⚒",
  cannon: "◉",
  shield: "⛨",
  special: "★",
};

const HERO_COLOR: Record<HeroId, { text: string; bar: string; border: string }> = {
  warden: { text: "text-teal-300", bar: "bg-teal-400", border: "border-teal-400" },
  sentinel: { text: "text-orange-300", bar: "bg-orange-400", border: "border-orange-400" },
};

const btn =
  "border border-gold/40 bg-black/60 text-xs text-muted backdrop-blur transition-colors hover:border-gold hover:text-gold";

const KEYS = [
  ["Space / click monster", "Attack with the selected weapon"],
  ["1 · 2 · 3", "Switch weapon"],
  ["Q · E", "Previous / next weapon"],
  ["F", "Special ability"],
  ["Tab / click hero", "Swap hero"],
  ["T", "Auto-battle"],
  ["C", "Focus camera on battle"],
  ["Drag · scroll", "Rotate · zoom the camera"],
  ["H", "Show / hide this help"],
];

type Slot = { key: string; glyph: string; label: string; cd: number; cdTotal: number; active: boolean; info: Info; onClick: () => void };
type Info = { name: string; tag: string; damage: number; cooldown: number; desc: string };

function AbilityBar({ hero }: { hero: HeroId }) {
  const [hover, setHover] = useState<Info | null>(null);
  const w = currentWeapon(hero);
  const sp = SPECIALS[hero];

  const slots: Slot[] = [
    ...WEAPONS[hero].map((x, i) => ({
      key: String(i + 1),
      glyph: GLYPH[x.id],
      label: x.name,
      cd: cooldownLeft(x.id),
      cdTotal: x.cooldown,
      active: x.id === w.id,
      info: { name: x.name, tag: x.type, damage: x.damage, cooldown: x.cooldown, desc: x.desc },
      onClick: () => selectWeapon(hero, i),
    })),
    {
      key: "Space",
      glyph: "⚡",
      label: "Attack",
      cd: cooldownLeft(w.id),
      cdTotal: w.cooldown,
      active: false,
      info: { name: `Attack · ${w.name}`, tag: w.type, damage: w.damage, cooldown: w.cooldown, desc: w.desc },
      onClick: () => heroAct(hero),
    },
    {
      key: "F",
      glyph: GLYPH.special,
      label: sp.name,
      cd: cooldownLeft(`${hero}-special`),
      cdTotal: sp.cooldown,
      active: false,
      info: { name: sp.name, tag: "Special", damage: sp.damage, cooldown: sp.cooldown, desc: sp.desc },
      onClick: () => heroAct(hero, true),
    },
  ];

  const shown: Info = hover ?? { name: w.name, tag: w.type, damage: w.damage, cooldown: w.cooldown, desc: w.desc };
  const c = HERO_COLOR[hero];

  return (
    <div className="pointer-events-auto flex flex-col items-center gap-2">
      <div className="w-[min(92vw,420px)] rounded border border-gold/40 bg-black/75 px-3 py-2 backdrop-blur">
        <div className="flex items-baseline justify-between gap-3">
          <p className="font-medium text-gold">{shown.name}</p>
          <p className="text-[10px] uppercase tracking-widest text-muted">{shown.tag}</p>
        </div>
        <p className="mt-0.5 text-xs text-muted">{shown.desc}</p>
        <p className="mt-1 flex gap-4 text-[11px]">
          <span>
            <span className="text-muted">Damage </span>
            <span className="text-red-300">{shown.damage}</span>
          </span>
          <span>
            <span className="text-muted">Cooldown </span>
            <span className="text-foreground">{shown.cooldown}s</span>
          </span>
        </p>
      </div>
      <div className="flex gap-2">
        {slots.map((s) => {
          const ready = s.cd <= 0;
          return (
            <button
              key={s.key}
              type="button"
              aria-label={`${s.label} (${s.key})`}
              onClick={s.onClick}
              onMouseEnter={() => setHover(s.info)}
              onMouseLeave={() => setHover(null)}
              className={`relative h-14 w-14 overflow-hidden rounded border bg-black/70 backdrop-blur transition-colors ${
                s.active ? `${c.border} ${c.text}` : "border-gold/40 text-muted hover:border-gold hover:text-gold"
              } ${ready ? "" : "opacity-80"}`}
            >
              <span className="text-xl leading-none">{s.glyph}</span>
              <span className="absolute left-1 top-0.5 text-[9px] text-muted">{s.key}</span>
              {!ready && (
                <>
                  <span
                    className="absolute inset-x-0 bottom-0 bg-black/70"
                    style={{ height: `${Math.min(100, (s.cd / s.cdTotal) * 100)}%` }}
                  />
                  <span className="absolute inset-0 flex items-center justify-center text-xs text-foreground">
                    {s.cd.toFixed(1)}
                  </span>
                </>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function HeroCard({ id }: { id: HeroId }) {
  const c = HERO_COLOR[id];
  const hp = engine.hp[id];
  const max = engine.maxHp[id];
  const sel = engine.selected === id;
  return (
    <button
      type="button"
      onClick={() => selectHero(id)}
      className={`w-full rounded border px-2 py-1.5 text-left transition-colors ${
        sel ? `${c.border} bg-white/5` : "border-white/10 hover:border-gold/50"
      }`}
    >
      <div className="flex justify-between text-[11px]">
        <span className={sel ? c.text : "text-muted"}>{HERO_NAME[id]}</span>
        <span className="text-muted">{Math.round(hp)}</span>
      </div>
      <div className="mt-1 h-1.5 rounded bg-white/10">
        <div className={`h-full rounded ${c.bar}`} style={{ width: `${(hp / max) * 100}%` }} />
      </div>
    </button>
  );
}

export function WorldView() {
  const [selected, setSelected] = useState<Tile | null>(null);
  const [focusKey, setFocusKey] = useState(0);
  const [help, setHelp] = useState(true);
  const [, setTick] = useState(0);
  useBattle();

  // Keep cooldown readouts moving.
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 100);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      const k = e.key.toLowerCase();
      if (k === "tab") toggleHero();
      else if (k >= "1" && k <= "3") selectWeapon(engine.selected, Number(k) - 1);
      else if (k === "q") cycleWeapon(-1);
      else if (k === "e") cycleWeapon(1);
      else if (k === " ") heroAct(engine.selected);
      else if (k === "f") heroAct(engine.selected, true);
      else if (k === "t") toggleAuto();
      else if (k === "c") setFocusKey((n) => n + 1);
      else if (k === "h" || k === "?") setHelp((v) => !v);
      else if (k === "escape") setHelp(false);
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const hero = engine.selected;
  const mHp = engine.hp.monster / engine.maxHp.monster;

  return (
    <div className="fixed inset-x-0 bottom-0 top-[61px] z-0 bg-background">
      <WorldScene
        selected={selected}
        onSelect={setSelected}
        onClear={() => setSelected(null)}
        focusKey={focusKey}
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

        <div className="absolute right-3 top-3 hidden w-[200px] flex-col items-end gap-2 sm:flex">
          <Minimap selected={selected} />
          <div className="pointer-events-auto w-full rounded border border-red-900/70 bg-black/70 p-3 text-xs backdrop-blur">
            <p className="flex items-center gap-2 font-medium text-red-300">
              <span className={`h-2 w-2 rounded-full ${engine.alive ? "animate-pulse bg-red-500" : "bg-slate-500"}`} />
              {engine.alive ? "Gravemaw" : "Gravemaw slain"}
            </p>
            <div className="mt-1.5 h-1.5 rounded bg-white/10">
              <div className="h-full rounded bg-red-500" style={{ width: `${mHp * 100}%` }} />
            </div>
            <div className="mt-2 flex flex-col gap-1.5">
              <HeroCard id="warden" />
              <HeroCard id="sentinel" />
            </div>
            <ul className="mt-2 min-h-[4.5rem] space-y-0.5 text-[10px] leading-tight text-muted">
              {engine.log.map((l, i) => (
                <li key={`${i}-${l}`} style={{ opacity: 1 - i * 0.18 }}>
                  {l}
                </li>
              ))}
            </ul>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={toggleAuto}
                className={`flex-1 rounded border py-1.5 transition-colors ${
                  engine.auto ? "border-gold bg-gold/15 text-gold" : "border-gold/50 text-gold hover:bg-gold/10"
                }`}
              >
                Auto {engine.auto ? "on" : "off"} (T)
              </button>
              <button
                type="button"
                onClick={() => setFocusKey((k) => k + 1)}
                className="flex-1 rounded border border-gold/50 py-1.5 text-gold transition-colors hover:bg-gold/10"
              >
                Focus (C)
              </button>
            </div>
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

        <div className="absolute inset-x-0 bottom-3 flex flex-col items-center">
          <AbilityBar hero={hero} />
          <p className="pointer-events-none mt-2 text-[11px] text-muted">
            <span className={HERO_COLOR[hero].text}>{HERO_NAME[hero]}</span> · Space attack · 1–3 weapons · F special · Tab swap hero · H help
          </p>
        </div>

        <div className="absolute bottom-3 left-3 max-w-[200px] rounded border border-gold/40 bg-black/65 p-3 text-sm backdrop-blur">
          {selected ? (
            <>
              <p className="font-medium text-gold">{TERRAIN_LABEL[selected.terrain]}</p>
              <p className="text-xs text-muted">
                Tile ({selected.q}, {selected.r}) · {selected.ring} from the keep
              </p>
            </>
          ) : (
            <p className="text-xs text-muted">Click a tile to inspect it</p>
          )}
        </div>

        {help && (
          <div className="pointer-events-auto absolute left-1/2 top-1/2 w-[min(92vw,440px)] -translate-x-1/2 -translate-y-1/2 rounded border border-gold/50 bg-black/85 p-4 backdrop-blur">
            <div className="flex items-center justify-between">
              <p className="font-medium text-gold">Controls</p>
              <button type="button" onClick={() => setHelp(false)} className="text-xs text-muted hover:text-gold">
                Close (Esc)
              </button>
            </div>
            <ul className="mt-2 space-y-1.5 text-xs">
              {KEYS.map(([k, d]) => (
                <li key={k} className="flex justify-between gap-4">
                  <span className="rounded border border-white/15 bg-white/5 px-1.5 py-0.5 text-foreground">{k}</span>
                  <span className="text-right text-muted">{d}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
