const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(
  /\/$/,
  "",
);

export type AuthUser = {
  id: string;
  email: string;
  username: string;
  createdAt: string;
  character?: {
    name: string;
    archetype: string;
    level: number;
    health: number;
    maxHealth: number;
  } | null;
  settlement?: {
    name: string;
    wood: number;
    stone: number;
    food: number;
    iron: number;
  } | null;
};

type AuthResponse = {
  success: boolean;
  message: string;
  user: AuthUser;
};

type ApiError = {
  message?: string;
  details?: Array<{ path?: string; message?: string }>;
};

async function request<T>(path: string, init: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...init.headers,
      },
    });
  } catch {
    throw new Error(
      "The server could not be reached. Make sure the backend is running.",
    );
  }

  const data = (await response.json().catch(() => ({}))) as T & ApiError;
  if (!response.ok) {
    const validationMessage = data.details
      ?.map((detail) => detail.message)
      .filter(Boolean)
      .join(" ");
    throw new Error(validationMessage || data.message || "Request failed.");
  }

  return data as T;
}

export function register(input: {
  email: string;
  username: string;
  password: string;
  archetype: "warrior" | "gunslinger" | "arcanist" | "battlemage";
}) {
  return request<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function login(input: { login: string; password: string }) {
  return request<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function logout() {
  return request<{ success: boolean; message: string }>("/api/auth/logout", {
    method: "POST",
  });
}

export function getCurrentUser() {
  return request<{ success: boolean; user: AuthUser }>("/api/auth/me", {
    method: "GET",
  });
}
