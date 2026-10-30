"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthError, login, register, validate, type Session } from "@/lib/auth";

type Mode = "login" | "register";

/** Sign in / create account. The username becomes your character's name. */
export function AuthForm({ onDone }: { onDone?: (s: Session) => void }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const problem = validate(mode, { email, username, password });
    if (problem) return setError(problem);
    setBusy(true);
    setError(null);
    try {
      const s = mode === "register" ? await register({ email, username, password }) : await login({ login: username, password });
      onDone?.(s);
      router.push("/world");
    } catch (err) {
      setError(err instanceof AuthError ? err.message : "Could not reach the server. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const input =
    "w-full rounded border border-white/15 bg-black/50 px-3 py-2.5 text-sm text-foreground placeholder:text-muted/70 outline-none transition-colors focus:border-gold/70";

  return (
    <form onSubmit={submit} className="space-y-3" noValidate>
      <div role="tablist" className="grid grid-cols-2 rounded border border-white/10 p-1 text-sm">
        {(["login", "register"] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            onClick={() => {
              setMode(m);
              setError(null);
            }}
            className={`rounded py-1.5 transition-colors ${mode === m ? "bg-gold/15 text-gold" : "text-muted hover:text-foreground"}`}
          >
            {m === "login" ? "Sign in" : "Create account"}
          </button>
        ))}
      </div>

      {mode === "register" && (
        <label className="block text-xs text-muted">
          Email
          <input className={`${input} mt-1`} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </label>
      )}
      <label className="block text-xs text-muted">
        {mode === "register" ? "Username · your character's name" : "Username or email"}
        <input
          className={`${input} mt-1`}
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder={mode === "register" ? "e.g. Mohit" : "Your username"}
          maxLength={mode === "register" ? 20 : 80}
        />
      </label>
      <label className="block text-xs text-muted">
        Password
        <span className="relative mt-1 block">
          <input
            className={`${input} pr-14`}
            type={show ? "text" : "password"}
            autoComplete={mode === "register" ? "new-password" : "current-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={mode === "register" ? "At least 8 characters" : "••••••••"}
          />
          <button type="button" onClick={() => setShow((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-muted hover:text-gold">
            {show ? "Hide" : "Show"}
          </button>
        </span>
      </label>

      {error && (
        <p role="alert" className="rounded border border-red-900/70 bg-red-950/40 px-3 py-2 text-xs text-red-300">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded border border-gold bg-gold/15 py-2.5 text-sm font-medium tracking-widest text-gold transition-colors hover:bg-gold/25 disabled:opacity-60"
      >
        {busy ? "…" : mode === "login" ? "ENTER THE NIGHT" : "FORGE YOUR LEGEND"}
      </button>
    </form>
  );
}
