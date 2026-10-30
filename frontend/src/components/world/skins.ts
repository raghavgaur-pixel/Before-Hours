import type { HeroId } from "./battleEngine";

/** Colours the code-built hero models are painted with. */
export type Palette = { metal: string; cloak: string; glow: string; dark: string; trim: string };

export type Skin = {
  id: string;
  hero: HeroId;
  name: string;
  desc: string;
  /** "palette" repaints the built-in model; "model" swaps in a scanned character. */
  kind: "palette" | "model";
  palette: Palette;
  model?: { url: string; scale: number; y: number; rotY: number };
};

const WARDEN_BASE: Palette = { metal: "#434a56", cloak: "#242830", glow: "#34e0c0", dark: "#14161a", trim: "#2b2f36" };
const SENTINEL_BASE: Palette = { metal: "#3a3f47", cloak: "#2d3138", glow: "#ff9a3c", dark: "#2a1f18", trim: "#2d3138" };

export const SKINS: Record<HeroId, Skin[]> = {
  warden: [
    { id: "warden-classic", hero: "warden", name: "Ashen Hood", desc: "The default hooded warden with teal spirit-light.", kind: "palette", palette: WARDEN_BASE },
    {
      id: "warden-ember",
      hero: "warden",
      name: "Emberguard",
      desc: "Scorched plate and a cloak of cinders.",
      kind: "palette",
      palette: { metal: "#6b4a3d", cloak: "#3a1f1a", glow: "#ff7a3c", dark: "#1c1210", trim: "#8a5a3a" },
    },
    {
      id: "warden-veylorn",
      hero: "warden",
      name: "Veylorn, the Ashen Warden",
      desc: "The legendary dark-fantasy armour, fully modelled.",
      kind: "model",
      palette: WARDEN_BASE,
      model: { url: "/models/veylorn.glb", scale: 0.5, y: 0.48, rotY: 0 },
    },
  ],
  sentinel: [
    { id: "sentinel-classic", hero: "sentinel", name: "Iron Bastion", desc: "The default riveted iron golem with an ember core.", kind: "palette", palette: SENTINEL_BASE },
    {
      id: "sentinel-verdant",
      hero: "sentinel",
      name: "Mossbound",
      desc: "Overgrown iron with a living-green core.",
      kind: "palette",
      palette: { metal: "#4a5a44", cloak: "#2a3a2a", glow: "#7be07a", dark: "#1c2a1c", trim: "#3a4a34" },
    },
    {
      id: "sentinel-stoneguard",
      hero: "sentinel",
      name: "Stoneguard",
      desc: "A hulking stone sentinel carved with ancient runes.",
      kind: "model",
      palette: SENTINEL_BASE,
      model: { url: "/models/stoneguard.glb", scale: 0.52, y: 0.5, rotY: 0 },
    },
  ],
};

export const MODEL_URLS = {
  flask: "/models/fire_flask.glb",
  orb: "/models/magic_orb.glb",
  star: "/models/star_orb.glb",
  magnitude: "/models/magnitude.glb",
} as const;
