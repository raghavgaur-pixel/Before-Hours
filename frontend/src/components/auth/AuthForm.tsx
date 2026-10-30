"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { login, register } from "@/lib/api";

type AuthFormProps = {
  mode: "login" | "register";
};

const archetypes = [
  { value: "warrior", label: "Warrior", description: "Durable and strong" },
  {
    value: "gunslinger",
    label: "Gunslinger",
    description: "Fast and precise",
  },
  { value: "arcanist", label: "Arcanist", description: "Master of magic" },
  {
    value: "battlemage",
    label: "Battlemage",
    description: "Steel and spellcraft",
  },
] as const;

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const isRegister = mode === "register";
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [archetype, setArchetype] = useState<
    (typeof archetypes)[number]["value"]
  >("warrior");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (isRegister) {
        await register({ email, username, password, archetype });
      } else {
        await login({ login: loginIdentifier, password });
      }
      router.replace("/world");
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Unable to complete authentication.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="mx-auto w-full max-w-md py-8 sm:py-14">
      <div className="mb-8">
        <p className="mb-3 text-sm uppercase tracking-[0.3em] text-accent">
          {isRegister ? "Begin your chronicle" : "Return to the world"}
        </p>
        <h1 className="text-3xl font-semibold text-gold sm:text-4xl">
          {isRegister ? "Create your account" : "Welcome back"}
        </h1>
        <p className="mt-3 text-muted">
          {isRegister
            ? "Found a settlement and leave a mark on the world."
            : "The world kept moving while you were away."}
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded border border-border bg-surface p-5 sm:p-6"
        aria-describedby={error ? "auth-error" : undefined}
      >
        {isRegister ? (
          <>
            <div>
              <label htmlFor="email" className="mb-2 block text-sm text-foreground">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded border border-border bg-background px-3 py-2.5 text-foreground placeholder:text-muted"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label htmlFor="username" className="mb-2 block text-sm text-foreground">
                Username
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                required
                minLength={3}
                maxLength={20}
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="w-full rounded border border-border bg-background px-3 py-2.5 text-foreground placeholder:text-muted"
                placeholder="shadowblade"
              />
            </div>
          </>
        ) : (
          <div>
            <label htmlFor="login" className="mb-2 block text-sm text-foreground">
              Email or username
            </label>
            <input
              id="login"
              type="text"
              autoComplete="username"
              required
              value={loginIdentifier}
              onChange={(event) => setLoginIdentifier(event.target.value)}
              className="w-full rounded border border-border bg-background px-3 py-2.5 text-foreground placeholder:text-muted"
              placeholder="you@example.com"
            />
          </div>
        )}

        <div>
          <label htmlFor="password" className="mb-2 block text-sm text-foreground">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete={isRegister ? "new-password" : "current-password"}
            required
            minLength={isRegister ? 8 : 1}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded border border-border bg-background px-3 py-2.5 text-foreground placeholder:text-muted"
            placeholder={isRegister ? "At least 8 characters" : "Your password"}
          />
        </div>

        {isRegister && (
          <fieldset>
            <legend className="mb-2 text-sm text-foreground">Choose an archetype</legend>
            <div className="grid grid-cols-2 gap-2">
              {archetypes.map((option) => (
                <label
                  key={option.value}
                  className={`cursor-pointer rounded border p-3 transition-colors ${
                    archetype === option.value
                      ? "border-accent bg-surface-raised"
                      : "border-border hover:border-muted"
                  }`}
                >
                  <input
                    type="radio"
                    name="archetype"
                    value={option.value}
                    checked={archetype === option.value}
                    onChange={() => setArchetype(option.value)}
                    className="sr-only"
                  />
                  <span className="block text-sm text-foreground">{option.label}</span>
                  <span className="mt-1 block text-xs text-muted">{option.description}</span>
                </label>
              ))}
            </div>
          </fieldset>
        )}

        {error && (
          <p id="auth-error" role="alert" className="rounded border border-red-900 bg-red-950/40 px-3 py-2 text-sm text-red-200">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded bg-accent px-4 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting
            ? isRegister
              ? "Creating account..."
              : "Signing in..."
            : isRegister
              ? "Create account"
              : "Sign in"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-muted">
        {isRegister ? "Already have an account? " : "New to AFTERHOURS? "}
        <Link
          href={isRegister ? "/login" : "/register"}
          className="text-accent underline-offset-4 hover:underline"
        >
          {isRegister ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </section>
  );
}
