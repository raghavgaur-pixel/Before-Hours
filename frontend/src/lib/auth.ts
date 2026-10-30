/**
 * Accounts for the game. Talks to the AFTERHOURS auth API (backend/server,
 * POST /api/auth/register and /api/auth/login). If the API cannot be reached,
 * falls back to an offline account stored in this browser so the game is still
 * playable while the backend is not running. Offline accounts never leave the
 * device and are meant for local testing.
 */

import { useSyncExternalStore } from "react";

export type Session = { username: string; email: string; mode: "online" | "offline" };

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const SESSION_KEY = "afterhours.session";
const ACCOUNTS_KEY = "afterhours.accounts";
const EVENT = "afterhours-session";

export class AuthError extends Error {}
class OfflineError extends Error {}

/** Same rules as the backend's zod schema, so errors show before a round trip. */
export function validate(mode: "login" | "register", f: { email: string; username: string; password: string }) {
  if (mode === "register") {
    if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) return "Enter a valid email address";
    const u = f.username.trim();
    if (u.length < 3 || u.length > 20) return "Username must be 3–20 characters";
    if (!/^[a-zA-Z0-9_-]+$/.test(u)) return "Username may only use letters, numbers, _ and -";
    if (f.password.length < 8) return "Password must be at least 8 characters";
  } else {
    if (!f.username.trim()) return "Enter your username or email";
    if (!f.password) return "Enter your password";
  }
  return null;
}

async function api(path: string, body: unknown) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 3500);
  try {
    const res = await fetch(`${API}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, data };
  } catch {
    throw new OfflineError("API unreachable");
  } finally {
    clearTimeout(timer);
  }
}

const errorMessage = (data: { message?: string; details?: { message: string }[] }) =>
  data?.details?.[0]?.message ?? data?.message ?? "Something went wrong";

// ------------------------------------------------------------ offline accounts

type StoredAccount = { username: string; email: string; salt: string; hash: string };

function readAccounts(): Record<string, StoredAccount> {
  try {
    return JSON.parse(localStorage.getItem(ACCOUNTS_KEY) ?? "{}");
  } catch {
    return {};
  }
}

const hex = (buf: ArrayBuffer | Uint8Array) =>
  Array.from(buf instanceof Uint8Array ? buf : new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");

async function hashPassword(password: string, salt: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: new TextEncoder().encode(salt), iterations: 120_000 },
    key,
    256,
  );
  return hex(bits);
}

async function offlineRegister(f: { email: string; username: string; password: string }): Promise<Session> {
  const accounts = readAccounts();
  const key = f.username.trim().toLowerCase();
  if (accounts[key]) throw new AuthError("Username is already taken");
  if (Object.values(accounts).some((a) => a.email === f.email.trim().toLowerCase())) throw new AuthError("Email is already registered");
  const salt = hex(crypto.getRandomValues(new Uint8Array(16)));
  accounts[key] = { username: f.username.trim(), email: f.email.trim().toLowerCase(), salt, hash: await hashPassword(f.password, salt) };
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  return { username: accounts[key].username, email: accounts[key].email, mode: "offline" };
}

async function offlineLogin(login: string, password: string): Promise<Session> {
  const accounts = readAccounts();
  const id = login.trim().toLowerCase();
  const acc = accounts[id] ?? Object.values(accounts).find((a) => a.email === id);
  if (!acc) throw new AuthError("No account with that name on this device");
  if ((await hashPassword(password, acc.salt)) !== acc.hash) throw new AuthError("Wrong password");
  return { username: acc.username, email: acc.email, mode: "offline" };
}

// ------------------------------------------------------------------- session

function saveSession(s: Session | null) {
  try {
    if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s));
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    // Storage blocked (private mode): the session lasts for this page only.
  }
  window.dispatchEvent(new Event(EVENT));
}

export async function register(f: { email: string; username: string; password: string }) {
  let s: Session;
  try {
    const r = await api("/api/auth/register", { email: f.email, username: f.username, password: f.password, archetype: "warrior" });
    if (!r.ok) throw new AuthError(errorMessage(r.data));
    s = { username: r.data.user.username, email: r.data.user.email, mode: "online" };
  } catch (e) {
    if (!(e instanceof OfflineError)) throw e;
    s = await offlineRegister(f);
  }
  saveSession(s);
  return s;
}

export async function login(f: { login: string; password: string }) {
  let s: Session;
  try {
    const r = await api("/api/auth/login", { login: f.login, password: f.password });
    if (!r.ok) throw new AuthError(errorMessage(r.data));
    s = { username: r.data.user.username, email: r.data.user.email, mode: "online" };
  } catch (e) {
    if (!(e instanceof OfflineError)) throw e;
    s = await offlineLogin(f.login, f.password);
  }
  saveSession(s);
  return s;
}

export async function logout() {
  try {
    await api("/api/auth/logout", {});
  } catch {
    // Offline: nothing to tell the server.
  }
  saveSession(null);
}

const readRaw = () => {
  try {
    return localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
};

/** The signed-in player, or null. Re-renders on login/logout in any tab. */
export function useSession(): Session | null | undefined {
  const raw = useSyncExternalStore(
    (cb) => {
      window.addEventListener(EVENT, cb);
      window.addEventListener("storage", cb);
      return () => {
        window.removeEventListener(EVENT, cb);
        window.removeEventListener("storage", cb);
      };
    },
    readRaw,
    () => undefined as unknown as string | null,
  );
  if (raw === undefined) return undefined; // still on the server: unknown
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}
