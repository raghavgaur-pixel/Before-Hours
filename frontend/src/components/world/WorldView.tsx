"use client";

import { useEffect, useRef, useState } from "react";
import {
  GESTURES,
  HERO_NAME,
  ITEM_DEFS,
  SPECIALS,
  WEAPONS,
  chargeFrac,
  cooldownLeft,
  currentWeapon,
  cycleItem,
  cycleWeapon,
  doGesture,
  engine,
  heroAct,
  interact,
  parry,
  releaseCharge,
  selectHero,
  selectWeapon,
  setBlock,
  startCharge,
  startRoll,
  switchTarget,
  toggleAuto,
  toggleHero,
  toggleLock,
  toggleTwoHand,
  useBattle,
  consumeItem,
  type HeroId,
  type WeaponId,
} from "./battleEngine";
import { Minimap } from "./Minimap";
import { view } from "./playerControl";
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

/** The control scheme. */
const CONTROLS: [string, string][] = [
  ["Move Forward / Backward", "W / S"],
  ["Move Left / Right", "A / D"],
  ["Camera Control", "Mouse Movement"],
  ["Light Attack", "Left Mouse Button"],
  ["Heavy Attack", "Shift + Left Mouse Button"],
  ["Strong Attack / Charge", "Hold Shift + Left Mouse Button"],
  ["Block / Guard", "Right Mouse Button"],
  ["Parry", "Q"],
  ["Dodge / Roll", "Space"],
  ["Sprint", "Left Shift"],
  ["Lock On / Unlock Target", "Middle Mouse Button"],
  ["Switch Target", "V"],
  ["Interact", "F"],
  ["Use Quick Item", "R"],
  ["Previous / Next Quick Item", "Mouse Wheel Down / Up"],
  ["Weapon Skill", "E"],
  ["Two-Hand Weapon", "C"],
  ["Inventory", "I"],
  ["Character Status", "Tab"],
  ["Equipment", "K"],
  ["Map", "M"],
  ["Gestures", "G"],
  ["Pause / Settings", "Esc"],
  ["Switch weapon", "1 · 2 · 3"],
  ["Swap hero", "X"],
  ["Auto-battle · Overview camera", "T · O"],
];

type Panel = null | "inventory" | "status" | "equipment" | "map" | "gestures" | "pause";

function Bar({ value, max, color, label }: { value: number; max: number; color: string; label?: string }) {
  return (
    <div>
      {label && (
        <div className="flex justify-between text-[10px] text-muted">
          <span>{label}</span>
          <span>{Math.round(value)}</span>
        </div>
      )}
      <div className="h-1.5 rounded bg-white/10">
        <div className={`h-full rounded ${color}`} style={{ width: `${Math.max(0, Math.min(100, (value / max) * 100))}%` }} />
      </div>
    </div>
  );
}

type Info = { name: string; tag: string; damage: number; cooldown: number; desc: string };

function ActionBar({ hero }: { hero: HeroId }) {
  const [hover, setHover] = useState<Info | null>(null);
  const w = currentWeapon(hero);
  const sp = SPECIALS[hero];
  const c = HERO_COLOR[hero];
  const p = engine.p;
  const item = engine.items[p.itemIdx];

  const slots = [
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
      key: "LMB",
      glyph: "⚡",
      label: "Light attack",
      cd: cooldownLeft(w.id),
      cdTotal: w.cooldown,
      active: false,
      info: {
        name: `Light attack · ${w.name}`,
        tag: w.type,
        damage: w.damage,
        cooldown: w.cooldown,
        desc: `${w.desc} Shift+click is a heavy attack (×1.6); hold Shift+click to charge a strong attack.`,
      },
      onClick: () => heroAct(hero, "light"),
    },
    {
      key: "E",
      glyph: GLYPH.special,
      label: sp.name,
      cd: cooldownLeft(`${hero}-special`),
      cdTotal: sp.cooldown,
      active: false,
      info: { name: sp.name, tag: "Weapon skill", damage: sp.damage, cooldown: sp.cooldown, desc: sp.desc },
      onClick: () => heroAct(hero, "skill"),
    },
  ];

  const shown: Info = hover ?? { name: w.name, tag: w.type, damage: w.damage, cooldown: w.cooldown, desc: w.desc };

  return (
    <div className="pointer-events-auto flex flex-col items-center gap-2">
      <div className="w-[min(92vw,430px)] rounded border border-gold/40 bg-black/75 px-3 py-2 backdrop-blur">
        <div className="flex items-baseline justify-between gap-3">
          <p className="font-medium text-gold">{shown.name}</p>
          <p className="text-[10px] uppercase tracking-widest text-muted">{shown.tag}</p>
        </div>
        <p className="mt-0.5 text-xs text-muted">{shown.desc}</p>
        <p className="mt-1 flex gap-4 text-[11px]">
          <span>
            <span className="text-muted">Damage </span>
            <span className="text-red-300">{Math.round(shown.damage * (p.twoHand ? 1.3 : 1))}</span>
          </span>
          <span>
            <span className="text-muted">Cooldown </span>
            <span className="text-foreground">{(shown.cooldown * (p.twoHand ? 1.25 : 1)).toFixed(1)}s</span>
          </span>
        </p>
      </div>

      <div className="flex w-[min(92vw,430px)] gap-3">
        <div className="flex-1 space-y-1">
          <Bar value={engine.hp[hero]} max={engine.maxHp[hero]} color={c.bar} label={`${HERO_NAME[hero]} HP`} />
          <Bar value={p.stamina} max={p.maxStamina} color="bg-emerald-400" label="Stamina" />
          {p.charging && <Bar value={chargeFrac()} max={1} color="bg-amber-400" label="Charge" />}
        </div>
      </div>

      <div className="flex items-end gap-2">
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
                  <span className="absolute inset-x-0 bottom-0 bg-black/70" style={{ height: `${Math.min(100, (s.cd / s.cdTotal) * 100)}%` }} />
                  <span className="absolute inset-0 flex items-center justify-center text-xs text-foreground">{s.cd.toFixed(1)}</span>
                </>
              )}
            </button>
          );
        })}
        <button
          type="button"
          aria-label="Two-hand weapon (C)"
          onClick={toggleTwoHand}
          className={`relative h-14 w-14 rounded border bg-black/70 backdrop-blur ${
            p.twoHand ? "border-gold text-gold" : "border-gold/40 text-muted hover:text-gold"
          }`}
          title="Two-hand grip"
        >
          <span className="text-lg leading-none">✋✋</span>
          <span className="absolute left-1 top-0.5 text-[9px] text-muted">C</span>
        </button>
        <button
          type="button"
          aria-label="Quick item (R)"
          onClick={consumeItem}
          className="relative h-14 w-14 rounded border border-gold/40 bg-black/70 text-muted backdrop-blur hover:border-gold hover:text-gold"
          title={`${ITEM_DEFS[item.id].name}: ${ITEM_DEFS[item.id].desc}`}
        >
          <span className="text-xl leading-none">{ITEM_DEFS[item.id].glyph}</span>
          <span className="absolute left-1 top-0.5 text-[9px] text-muted">R</span>
          <span className="absolute bottom-0.5 right-1 text-[10px] text-foreground">×{item.count}</span>
        </button>
      </div>
    </div>
  );
}

function HeroCard({ id }: { id: HeroId }) {
  const c = HERO_COLOR[id];
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
        <span className="text-muted">{Math.round(engine.hp[id])}</span>
      </div>
      <div className="mt-1 h-1.5 rounded bg-white/10">
        <div className={`h-full rounded ${c.bar}`} style={{ width: `${(engine.hp[id] / engine.maxHp[id]) * 100}%` }} />
      </div>
    </button>
  );
}

function Modal({ title, onClose, children, wide = false }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div
      className={`pointer-events-auto absolute left-1/2 top-1/2 max-h-[80vh] -translate-x-1/2 -translate-y-1/2 overflow-auto rounded border border-gold/50 bg-black/90 p-4 backdrop-blur ${
        wide ? "w-[min(94vw,560px)]" : "w-[min(92vw,420px)]"
      }`}
    >
      <div className="mb-2 flex items-center justify-between">
        <p className="font-medium text-gold">{title}</p>
        <button type="button" onClick={onClose} className="text-xs text-muted hover:text-gold">
          Close
        </button>
      </div>
      {children}
    </div>
  );
}

export function WorldView() {
  const box = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<Tile | null>(null);
  const [mode, setMode] = useState<"play" | "overview">("play");
  const [active, setActive] = useState(false);
  const [panel, setPanel] = useState<Panel>(null);
  const [tick, setTick] = useState(0);
  const [sens, setSens] = useState(1);
  const panelRef = useRef<Panel>(null);
  useEffect(() => {
    panelRef.current = panel;
  }, [panel]);
  useBattle();

  const paused = panel === "pause";

  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 100);
    return () => clearInterval(id);
  }, []);

  const setModeBoth = (m: "play" | "overview") => {
    view.mode = m;
    setMode(m);
    if (m === "overview") {
      view.active = false;
      setActive(false);
      document.exitPointerLock?.();
    }
  };

  const takeControl = () => {
    setPanel(null);
    view.mode = "play";
    setMode("play");
    const el = box.current;
    if (!el?.requestPointerLock) {
      view.active = true;
      setActive(true);
      return;
    }
    el.requestPointerLock();
  };

  // Pointer lock bookkeeping + mouse look.
  useEffect(() => {
    const el = box.current;
    const onChange = () => {
      const locked = document.pointerLockElement === el;
      if (locked) {
        view.active = true;
        setActive(true);
      } else if (view.active && view.mode === "play") {
        view.active = false;
        setActive(false);
        setBlock(false);
        view.keys.clear();
        if (!panelRef.current) setPanel("pause");
      }
    };
    const onError = () => {
      // Browser refused the lock: still allow keyboard + click controls.
      view.active = true;
      setActive(true);
    };
    const onMove = (e: MouseEvent) => {
      if (document.pointerLockElement !== el || view.mode !== "play") return;
      view.yaw -= e.movementX * 0.0025 * view.sens;
      view.pitch = Math.min(1.15, Math.max(0.08, view.pitch + e.movementY * 0.002 * view.sens));
    };
    document.addEventListener("pointerlockchange", onChange);
    document.addEventListener("pointerlockerror", onError);
    document.addEventListener("mousemove", onMove);
    return () => {
      document.removeEventListener("pointerlockchange", onChange);
      document.removeEventListener("pointerlockerror", onError);
      document.removeEventListener("mousemove", onMove);
    };
  }, []);

  // Keyboard.
  useEffect(() => {
    const canAct = () => view.mode === "overview" || view.active;
    const moveDir = (): [number, number] => {
      const k = view.keys;
      const fw = (k.has("w") ? 1 : 0) - (k.has("s") ? 1 : 0);
      const rt = (k.has("d") ? 1 : 0) - (k.has("a") ? 1 : 0);
      const dx = -Math.sin(view.yaw) * fw + Math.cos(view.yaw) * rt;
      const dz = -Math.cos(view.yaw) * fw - Math.sin(view.yaw) * rt;
      if (Math.hypot(dx, dz) > 0.01) return [dx, dz];
      const yaw = engine.pos[engine.selected].yaw;
      return [-Math.sin(yaw), -Math.cos(yaw)]; // step back when standing still
    };
    const toggle = (p: Panel) => setPanel((cur) => (cur === p ? null : p));

    const onDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      const k = e.key.toLowerCase();

      if (k === "escape") {
        if (panelRef.current === "pause") return;
        if (panelRef.current) setPanel(null);
        else {
          // Some browsers swallow Esc while the pointer is locked and only fire pointerlockchange;
          // opening the menu here as well covers the rest.
          view.keys.clear();
          setBlock(false);
          setPanel("pause");
          document.exitPointerLock?.();
        }
        return;
      }
      if (["w", "a", "s", "d", "shift"].includes(k)) view.keys.add(k);

      if (panelRef.current === "gestures" && k >= "1" && k <= "4") {
        doGesture(GESTURES[Number(k) - 1]);
        setPanel(null);
        e.preventDefault();
        return;
      }
      if (panelRef.current === "equipment" && k >= "1" && k <= "3") {
        selectWeapon(engine.selected, Number(k) - 1);
        e.preventDefault();
        return;
      }

      // Panels work even before you have taken control.
      if (k === "i") toggle("inventory");
      else if (k === "tab") toggle("status");
      else if (k === "k") toggle("equipment");
      else if (k === "m") toggle("map");
      else if (k === "g") toggle("gestures");
      else if (k === "o") setModeBoth(view.mode === "play" ? "overview" : "play");
      else if (!canAct() || panelRef.current === "pause") return;
      else if (k === " ") {
        const [dx, dz] = moveDir();
        startRoll(dx, dz);
      } else if (k === "q") parry();
      else if (k === "e") heroAct(engine.selected, "skill");
      else if (k === "c") toggleTwoHand();
      else if (k === "f") interact();
      else if (k === "r") consumeItem();
      else if (k === "v") switchTarget();
      else if (k === "x") toggleHero();
      else if (k === "t") toggleAuto();
      else if (k === "[" || k === "pageup") cycleWeapon(-1);
      else if (k === "]" || k === "pagedown") cycleWeapon(1);
      else if (k >= "1" && k <= "3") selectWeapon(engine.selected, Number(k) - 1);
      else if (["w", "a", "s", "d", "shift"].includes(k)) return;
      else return;
      e.preventDefault();
    };
    const onUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      view.keys.delete(k);
      if (k === "shift") releaseCharge();
    };
    const onBlur = () => {
      view.keys.clear();
      setBlock(false);
    };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

  // Mouse buttons (play mode only).
  const onMouseDown = (e: React.MouseEvent) => {
    if (view.mode !== "play" || !view.active || panel === "pause") return;
    if (e.button === 0) {
      if (view.keys.has("shift")) startCharge();
      else heroAct(engine.selected, "light");
    } else if (e.button === 2) setBlock(true);
    else if (e.button === 1) {
      e.preventDefault();
      toggleLock();
    }
  };
  const onMouseUp = (e: React.MouseEvent) => {
    if (e.button === 0) releaseCharge();
    else if (e.button === 2) setBlock(false);
  };
  const onWheel = (e: React.WheelEvent) => {
    if (view.mode !== "play" || !view.active) return;
    cycleItem(e.deltaY > 0 ? -1 : 1); // wheel down = previous, wheel up = next
  };

  const hero = engine.selected;
  const enemy = engine.enemies.monster;
  const lockTarget = engine.p.lock && engine.p.target ? engine.enemies[engine.p.target] : null;
  const showOverlay = mode === "play" && !active && panel !== "pause";

  return (
    <div
      ref={box}
      className="fixed inset-x-0 bottom-0 top-[61px] z-0 bg-background"
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onWheel={onWheel}
      onContextMenu={(e) => e.preventDefault()}
    >
      <WorldScene
        selected={selected}
        onSelect={setSelected}
        onClear={() => setSelected(null)}
        focusKey={0}
        playMode={mode === "play"}
        paused={paused}
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

        {lockTarget && (
          <p className="absolute left-1/2 top-20 -translate-x-1/2 rounded border border-red-900/70 bg-black/70 px-3 py-1 text-xs text-red-300">
            Locked on · {lockTarget.kind === "monster" ? "Gravemaw" : "Husk"} ({Math.round(lockTarget.hp)}/{lockTarget.maxHp}) · V switch
          </p>
        )}

        <div className="absolute right-3 top-3 hidden w-[200px] flex-col items-end gap-2 sm:flex">
          <Minimap selected={selected} tick={tick} />
          <div className="pointer-events-auto w-full rounded border border-red-900/70 bg-black/70 p-3 text-xs backdrop-blur">
            <p className="flex items-center gap-2 font-medium text-red-300">
              <span className={`h-2 w-2 rounded-full ${enemy.alive ? "animate-pulse bg-red-500" : "bg-slate-500"}`} />
              {enemy.alive ? "Gravemaw" : "Gravemaw slain"}
            </p>
            <div className="mt-1.5">
              <Bar value={enemy.hp} max={enemy.maxHp} color="bg-red-500" />
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
                onClick={() => (mode === "play" ? setModeBoth("overview") : takeControl())}
                className="flex-1 rounded border border-gold/50 py-1.5 text-gold transition-colors hover:bg-gold/10"
              >
                {mode === "play" ? "Overview (O)" : "Play (O)"}
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
          {engine.p.prompt && (
            <p className="mb-2 rounded border border-gold/60 bg-black/80 px-3 py-1 text-sm text-gold">
              <span className="mr-2 rounded border border-white/20 px-1 text-xs">F</span>
              {engine.p.prompt}
            </p>
          )}
          <ActionBar hero={hero} />
          <p className="pointer-events-none mt-2 text-[11px] text-muted">
            <span className={HERO_COLOR[hero].text}>{HERO_NAME[hero]}</span> · WASD move · LMB attack · RMB block · Space roll · Esc menu
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
            <p className="text-xs text-muted">{mode === "overview" ? "Click a tile to inspect it" : "Press M for the map"}</p>
          )}
        </div>

        {showOverlay && (
          <button
            type="button"
            onClick={takeControl}
            className="pointer-events-auto absolute inset-0 flex items-center justify-center bg-black/45 backdrop-blur-[1px]"
          >
            <span className="rounded border border-gold/60 bg-black/80 px-6 py-4 text-center">
              <span className="block text-lg text-gold">Click to take control</span>
              <span className="mt-1 block text-xs text-muted">WASD to move · mouse to look · Esc for the menu</span>
            </span>
          </button>
        )}

        {panel === "inventory" && (
          <Modal title="Inventory" onClose={() => setPanel(null)}>
            <ul className="space-y-2 text-sm">
              {engine.items.map((it, i) => (
                <li key={it.id} className={`flex items-center justify-between rounded border px-3 py-2 ${i === engine.p.itemIdx ? "border-gold" : "border-white/10"}`}>
                  <span>
                    <span className="mr-2 text-gold">{ITEM_DEFS[it.id].glyph}</span>
                    {ITEM_DEFS[it.id].name}
                    <span className="block text-xs text-muted">{ITEM_DEFS[it.id].desc}</span>
                  </span>
                  <span className="text-foreground">×{it.count}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted">Use R to drink or throw the selected item. Mouse wheel changes it.</p>
          </Modal>
        )}

        {panel === "status" && (
          <Modal title="Character Status" onClose={() => setPanel(null)} wide>
            <div className="grid gap-3 sm:grid-cols-2">
              {(["warden", "sentinel"] as HeroId[]).map((h) => (
                <div key={h} className={`rounded border p-3 text-xs ${h === hero ? HERO_COLOR[h].border : "border-white/10"}`}>
                  <p className={`font-medium ${HERO_COLOR[h].text}`}>{HERO_NAME[h]}</p>
                  <div className="mt-2 space-y-1.5">
                    <Bar value={engine.hp[h]} max={engine.maxHp[h]} color={HERO_COLOR[h].bar} label="Health" />
                    {h === hero && <Bar value={engine.p.stamina} max={engine.p.maxStamina} color="bg-emerald-400" label="Stamina" />}
                  </div>
                  <p className="mt-2 text-muted">Weapon: <span className="text-foreground">{currentWeapon(h).name}</span></p>
                  <p className="text-muted">Skill: <span className="text-foreground">{SPECIALS[h].name}</span></p>
                  {h === hero && (
                    <>
                      <p className="text-muted">Grip: <span className="text-foreground">{engine.p.twoHand ? "Two-handed (+30% damage)" : "One-handed"}</span></p>
                      <p className="text-muted">Kills: <span className="text-foreground">{engine.p.kills}</span></p>
                      {engine.now < engine.p.wardUntil && <p className="text-emerald-300">Spirit Salve active</p>}
                    </>
                  )}
                </div>
              ))}
            </div>
          </Modal>
        )}

        {panel === "equipment" && (
          <Modal title={`Equipment · ${HERO_NAME[hero]}`} onClose={() => setPanel(null)} wide>
            <ul className="space-y-2 text-sm">
              {WEAPONS[hero].map((w, i) => (
                <li key={w.id}>
                  <button
                    type="button"
                    onClick={() => selectWeapon(hero, i)}
                    className={`w-full rounded border px-3 py-2 text-left ${w.id === engine.weapon[hero] ? `${HERO_COLOR[hero].border} bg-white/5` : "border-white/10 hover:border-gold/50"}`}
                  >
                    <span className="flex justify-between">
                      <span>
                        <span className="mr-2 text-gold">{GLYPH[w.id]}</span>
                        {w.name}
                      </span>
                      <span className="text-[10px] uppercase tracking-widest text-muted">{w.type} · {i + 1}</span>
                    </span>
                    <span className="block text-xs text-muted">{w.desc}</span>
                    <span className="block text-[11px] text-muted">
                      Damage <span className="text-red-300">{w.damage}</span> · Cooldown {w.cooldown}s
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </Modal>
        )}

        {panel === "map" && (
          <Modal title="Map" onClose={() => setPanel(null)} wide>
            <div className="flex justify-center">
              <Minimap selected={selected} scale={2.6} tick={tick} />
            </div>
            <p className="mt-2 text-center text-[11px] text-muted">
              <span className="text-teal-300">●</span> Warden · <span className="text-orange-300">●</span> Sentinel · <span className="text-red-400">●</span> Gravemaw · <span className="text-lime-300">●</span> Husks
            </p>
          </Modal>
        )}

        {panel === "gestures" && (
          <Modal title="Gestures" onClose={() => setPanel(null)}>
            <ul className="grid grid-cols-2 gap-2 text-sm">
              {GESTURES.map((g, i) => (
                <li key={g}>
                  <button
                    type="button"
                    onClick={() => {
                      doGesture(g);
                      setPanel(null);
                    }}
                    className="w-full rounded border border-white/15 px-3 py-3 capitalize hover:border-gold hover:text-gold"
                  >
                    <span className="mr-2 text-xs text-muted">{i + 1}</span>
                    {g}
                  </button>
                </li>
              ))}
            </ul>
          </Modal>
        )}

        {panel === "pause" && (
          <Modal title="Paused" onClose={takeControl} wide>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={takeControl} className="rounded border border-gold bg-gold/10 px-4 py-2 text-sm text-gold">
                Resume
              </button>
              <button
                type="button"
                onClick={() => {
                  setPanel(null);
                  setModeBoth(mode === "play" ? "overview" : "play");
                }}
                className="rounded border border-gold/50 px-4 py-2 text-sm text-gold hover:bg-gold/10"
              >
                {mode === "play" ? "Overview camera" : "Play camera"}
              </button>
              <label className="flex items-center gap-2 text-xs text-muted">
                Mouse sensitivity
                <input
                  type="range"
                  min={0.3}
                  max={2.5}
                  step={0.1}
                  value={sens}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setSens(v);
                    view.sens = v;
                  }}
                />
              </label>
            </div>
            <p className="mb-1 mt-4 text-xs uppercase tracking-widest text-muted">Keyboard &amp; mouse controls</p>
            <table className="w-full text-xs">
              <tbody>
                {CONTROLS.map(([a, k]) => (
                  <tr key={a} className="border-t border-white/10">
                    <td className="py-1 pr-3 text-muted">{a}</td>
                    <td className="py-1 text-right text-foreground">{k}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Modal>
        )}
      </div>
    </div>
  );
}
