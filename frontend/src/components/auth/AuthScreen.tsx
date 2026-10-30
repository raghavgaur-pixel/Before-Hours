"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { logout, useSession } from "@/lib/auth";
import { AuthForm } from "./AuthForm";
import { IntroScene } from "./IntroScene";

const TITLE = "AFTERHOURS";
const GRAIN =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.55'/></svg>\")";

/**
 * The home page: a cinematic start animation that lands on sign-in / create
 * account. Any key or click skips straight to the form.
 */
export function AuthScreen() {
  const session = useSession();
  const [skip, setSkip] = useState(false);

  useEffect(() => {
    const done = () => setSkip(true);
    const timer = setTimeout(done, 5200); // the intro is over; stop listening
    window.addEventListener("keydown", done, { once: true });
    window.addEventListener("pointerdown", done, { once: true });
    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", done);
      window.removeEventListener("pointerdown", done);
    };
  }, []);

  return (
    <div data-skip={skip} className="fixed inset-0 z-40 overflow-hidden bg-[#05070a]">
      <div className="absolute inset-0">
        <IntroScene skip={skip} />
      </div>

      {/* Atmosphere: vignette and film grain. */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(0,0,0,0.85)_100%)]" />
      <div className="ah-grain pointer-events-none absolute -inset-[10%] opacity-[0.07] mix-blend-screen" style={{ backgroundImage: GRAIN }} />

      {/* Start: out of total darkness, then the lightning. */}
      <div className="ah-step ah-blackout pointer-events-none absolute inset-0 bg-black" />
      <div className="ah-step ah-flash pointer-events-none absolute inset-0 bg-[#e8f0ff]" />

      <div className="relative flex h-full flex-col items-center justify-end px-4 pb-[8vh] sm:justify-center sm:pb-0">
        <div className="relative sm:mb-[34vh] lg:mb-[52vh]">
          <h1 aria-label={TITLE} className="ah-step ah-title-glow relative overflow-hidden px-2 text-center text-4xl font-semibold tracking-[0.35em] text-gold sm:text-6xl">
            {TITLE.split("").map((ch, i) => (
              <span key={i} aria-hidden className="ah-step ah-letter" style={{ "--i": i } as React.CSSProperties}>
                {ch}
              </span>
            ))}
            <span aria-hidden className="ah-step ah-slash pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-[#fff3c4] to-transparent mix-blend-screen" />
          </h1>
          <p className="ah-step ah-sub mt-3 text-center text-[11px] uppercase tracking-[0.5em] text-muted sm:text-xs">A world that never sleeps</p>
        </div>

        <div className="ah-step ah-rise w-full max-w-sm sm:absolute sm:bottom-[9vh] lg:bottom-auto lg:right-[9vw] lg:top-[30vh]">
          <div className="relative overflow-hidden rounded-lg p-[1.5px]">
            <div className="ah-spin absolute -inset-[60%] bg-[conic-gradient(from_0deg,transparent_0deg,#c9a24b_60deg,transparent_120deg,transparent_200deg,#8b7cf6_260deg,transparent_320deg)]" />
            <div className="relative rounded-lg bg-black/85 p-5 backdrop-blur">
              {session === undefined ? null : session ? (
                <div className="space-y-3 text-center">
                  <p className="text-sm text-muted">Welcome back,</p>
                  <p className="text-2xl text-gold">{session.username}</p>
                  {session.mode === "offline" && <p className="text-[11px] text-muted">Offline account on this device</p>}
                  <Link
                    href="/world"
                    className="block w-full rounded border border-gold bg-gold/15 py-2.5 text-sm font-medium tracking-widest text-gold hover:bg-gold/25"
                  >
                    ENTER THE WORLD
                  </Link>
                  <button type="button" onClick={() => logout()} className="text-xs text-muted hover:text-gold">
                    Not you? Sign out
                  </button>
                </div>
              ) : (
                <AuthForm />
              )}
            </div>
          </div>
        </div>
      </div>

      {!skip && (
        <button type="button" onClick={() => setSkip(true)} className="ah-hint absolute bottom-4 right-4 text-[11px] uppercase tracking-[0.3em] text-muted hover:text-gold">
          Press any key to skip
        </button>
      )}
    </div>
  );
}
