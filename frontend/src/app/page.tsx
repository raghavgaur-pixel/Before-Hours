import { AuthScreen } from "@/components/auth/AuthScreen";

const features = [
  {
    icon: "⚔️",
    title: "Choose Your Archetype",
    body: "Warrior, Gunslinger, Arcanist, or Battlemage — your class shapes your stats and your story.",
  },
  {
    icon: "🏰",
    title: "Found a Settlement",
    body: "Claim a tile on the persistent world map. Build, upgrade, and defend your stronghold.",
  },
  {
    icon: "🌑",
    title: "The World Never Sleeps",
    body: "Production ticks and construction continues while you are away. Log back in and claim what grew.",
  },
  {
    icon: "🗺️",
    title: "Shared Persistent World",
    body: "Every player exists on the same map. Form alliances, trade resources, or wage war.",
  },
];

const stats = [
  { value: "4", label: "Archetypes" },
  { value: "8", label: "Building Types" },
  { value: "∞", label: "Persistence" },
  { value: "1", label: "Shared World" },
];

export default function Home() {
  return (
    <div className="relative -mx-4 -my-8 overflow-hidden">
      {/* ── Atmospheric background layers ──────────────────────────────── */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(139,124,246,0.12) 0%, transparent 70%), radial-gradient(ellipse 60% 40% at 80% 80%, rgba(201,162,75,0.06) 0%, transparent 60%)",
        }}
      />

      {/* Subtle grid lines */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "linear-gradient(var(--foreground) 1px, transparent 1px), linear-gradient(90deg, var(--foreground) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative z-10 flex min-h-[88vh] flex-col items-center justify-center px-4 text-center">
        {/* Eyebrow */}
        <p className="mb-4 text-xs font-medium uppercase tracking-[0.5em] text-accent opacity-80">
          A dark-fantasy persistent world
        </p>

        {/* Title */}
        <h1
          className="mb-6 font-semibold tracking-[0.15em] text-gold"
          style={{ fontSize: "clamp(2.8rem, 8vw, 6rem)", lineHeight: 1.05 }}
        >
          AFTER
          <br />
          HOURS
        </h1>

        {/* Ornamental divider */}
        <div className="mb-6 flex items-center gap-3" aria-hidden>
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-border" />
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
            <path d="M9 1L10.8 7.2H17L12 11.1L13.8 17.3L9 13.4L4.2 17.3L6 11.1L1 7.2H7.2L9 1Z" fill="var(--gold)" opacity="0.6"/>
          </svg>
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-border" />
        </div>

        {/* Tagline */}
        <p className="mb-10 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
          Build something that remains after you leave. Found a settlement,
          gather resources, and raise buildings in a shared persistent world.
          Production and construction continue while you are away.
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/register"
            className="rounded border border-accent/40 bg-accent/10 px-7 py-3 text-sm font-semibold tracking-widest text-accent transition-all hover:bg-accent/20 hover:border-accent"
          >
            BEGIN YOUR CHRONICLE
          </Link>
          <Link
            href="/login"
            className="rounded border border-border px-7 py-3 text-sm font-semibold tracking-widest text-muted transition-all hover:border-foreground/40 hover:text-foreground"
          >
            RETURN TO THE WORLD
          </Link>
        </div>

        {/* Scroll cue */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 opacity-30" aria-hidden>
          <div className="h-6 w-px bg-foreground" />
          <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
            <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
      </section>

      {/* ── Stats bar ─────────────────────────────────────────────────── */}
      <section className="relative z-10 border-y border-border bg-surface/60 backdrop-blur-sm">
        <div className="mx-auto grid max-w-4xl grid-cols-2 divide-x divide-y divide-border sm:grid-cols-4 sm:divide-y-0">
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col items-center px-8 py-6">
              <span className="text-3xl font-semibold text-gold">{s.value}</span>
              <span className="mt-1 text-xs uppercase tracking-widest text-muted">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features grid ─────────────────────────────────────────────── */}
      <section className="relative z-10 mx-auto max-w-5xl px-4 py-24">
        <p className="mb-2 text-center text-xs font-medium uppercase tracking-[0.4em] text-accent opacity-70">
          Core Pillars
        </p>
        <h2 className="mb-14 text-center text-2xl font-semibold text-foreground sm:text-3xl">
          What awaits you
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          {features.map((f) => (
            <article
              key={f.title}
              className="group rounded border border-border bg-surface p-6 transition-colors hover:border-accent/40 hover:bg-surface-raised"
            >
              <div className="mb-4 text-3xl">{f.icon}</div>
              <h3 className="mb-2 text-base font-semibold text-foreground">{f.title}</h3>
              <p className="text-sm leading-relaxed text-muted">{f.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────────── */}
      <section className="relative z-10 border-t border-border">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            background:
              "radial-gradient(ellipse 70% 80% at 50% 100%, rgba(139,124,246,0.15) 0%, transparent 70%)",
          }}
        />
        <div className="relative mx-auto max-w-2xl px-4 py-24 text-center">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.4em] text-muted">
            Ready to leave your mark?
          </p>
          <h2 className="mb-6 text-2xl font-semibold text-gold sm:text-3xl">
            Your stronghold awaits
          </h2>
          <p className="mb-8 text-sm leading-relaxed text-muted">
            Every great empire began with a single tile. The world is already
            turning — will you be part of it?
          </p>
          <Link
            href="/register"
            className="inline-block rounded border border-gold/30 bg-gold/10 px-8 py-3 text-sm font-semibold tracking-widest text-gold transition-all hover:bg-gold/20 hover:border-gold/60"
          >
            FOUND YOUR SETTLEMENT
          </Link>
        </div>
      </section>
    </div>
  );
}
