import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "../../lib/prisma.js";
import { supabase } from "../../lib/supabase.js";
import { env } from "../../config/env.js";
import { RegisterInput, LoginInput } from "./auth.schema.js";

export interface UserResponse {
  id: string;
  email: string;
  username: string;
  createdAt: Date;
  character?: {
    id: string;
    name: string;
    archetype: string;
    level: number;
    health: number;
    maxHealth: number;
    strength: number;
    agility: number;
    magic: number;
    endurance: number;
  } | null;
  settlement?: {
    id: string;
    name: string;
    wood: number;
    stone: number;
    food: number;
    iron: number;
  } | null;
}

interface StoredUser {
  id: string;
  email: string;
  username: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
  character?: any;
  settlement?: any;
}

// In-memory fallback store used when DATABASE_URL is not set (useful for unit testing and offline dev)
const memoryUsers = new Map<string, StoredUser>();

export class HttpError extends Error {
  statusCode: number;
  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

export class AuthService {
  private usePrisma: boolean;

  constructor() {
    this.usePrisma = Boolean(env.DATABASE_URL);
  }

  async register(input: RegisterInput): Promise<UserResponse> {
    const email = input.email.toLowerCase().trim();
    const username = input.username.trim();

    // Check existing email & username
    if (this.usePrisma) {
      const existingEmail = await prisma.user.findUnique({ where: { email } });
      if (existingEmail) {
        throw new HttpError(409, "Email is already registered");
      }

      const existingUsername = await prisma.user.findUnique({ where: { username } });
      if (existingUsername) {
        throw new HttpError(409, "Username is already taken");
      }
    } else {
      for (const u of memoryUsers.values()) {
        if (u.email.toLowerCase() === email) {
          throw new HttpError(409, "Email is already registered");
        }
        if (u.username.toLowerCase() === username.toLowerCase()) {
          throw new HttpError(409, "Username is already taken");
        }
      }
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(input.password, salt);

    const archetype = input.archetype || "warrior";
    const initialStats = {
      strength: archetype === "warrior" ? 14 : archetype === "battlemage" ? 12 : 8,
      agility: archetype === "gunslinger" ? 14 : 10,
      magic: archetype === "arcanist" ? 15 : archetype === "battlemage" ? 12 : 5,
      endurance: 10,
      health: 100,
      maxHealth: 100,
    };

    if (this.usePrisma) {
      const user = await prisma.user.create({
        data: {
          email,
          username,
          passwordHash,
          character: {
            create: {
              name: username,
              archetype,
              ...initialStats,
            },
          },
          settlement: {
            create: {
              name: `${username}'s Stronghold`,
              wood: 100,
              stone: 100,
              food: 100,
              iron: 50,
            },
          },
        },
        include: {
          character: true,
          settlement: true,
        },
      });

      // Optionally sync to Supabase Auth if service role is configured
      if (supabase && env.SUPABASE_SERVICE_ROLE_KEY) {
        try {
          await supabase.auth.admin.createUser({
            email,
            password: input.password,
            user_metadata: { username },
            email_confirm: true,
          });
        } catch {
          // Non-blocking sync attempt
        }
      }

      return {
        id: user.id,
        email: user.email,
        username: user.username,
        createdAt: user.createdAt,
        character: user.character,
        settlement: user.settlement,
      };
    } else {
      const id = crypto.randomUUID();
      const now = new Date();
      const character = {
        id: crypto.randomUUID(),
        name: username,
        archetype,
        level: 1,
        ...initialStats,
      };
      const settlement = {
        id: crypto.randomUUID(),
        name: `${username}'s Stronghold`,
        wood: 100,
        stone: 100,
        food: 100,
        iron: 50,
      };

      const storedUser: StoredUser = {
        id,
        email,
        username,
        passwordHash,
        createdAt: now,
        updatedAt: now,
        character,
        settlement,
      };

      memoryUsers.set(id, storedUser);

      return {
        id,
        email,
        username,
        createdAt: now,
        character,
        settlement,
      };
    }
  }

  async login(input: LoginInput): Promise<UserResponse> {
    const rawIdentifier = input.login || input.email || input.username;
    if (!rawIdentifier) {
      throw new HttpError(400, "Login identifier is required");
    }

    const identifier = rawIdentifier.trim();
    const isEmail = identifier.includes("@");

    let user: StoredUser | null = null;

    if (this.usePrisma) {
      const dbUser = isEmail
        ? await prisma.user.findUnique({
            where: { email: identifier.toLowerCase() },
            include: { character: true, settlement: true },
          })
        : await prisma.user.findUnique({
            where: { username: identifier },
            include: { character: true, settlement: true },
          });

      if (dbUser) {
        user = dbUser as unknown as StoredUser;
      }
    } else {
      for (const u of memoryUsers.values()) {
        if (
          isEmail
            ? u.email.toLowerCase() === identifier.toLowerCase()
            : u.username.toLowerCase() === identifier.toLowerCase()
        ) {
          user = u;
          break;
        }
      }
    }

    if (!user) {
      throw new HttpError(401, "Invalid email/username or password");
    }

    const isValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!isValid) {
      throw new HttpError(401, "Invalid email/username or password");
    }

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      createdAt: user.createdAt,
      character: user.character,
      settlement: user.settlement,
    };
  }

  async getProfile(userId: string): Promise<UserResponse> {
    if (this.usePrisma) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          character: true,
          settlement: true,
        },
      });

      if (!user) {
        throw new HttpError(404, "User not found");
      }

      return {
        id: user.id,
        email: user.email,
        username: user.username,
        createdAt: user.createdAt,
        character: user.character,
        settlement: user.settlement,
      };
    } else {
      const user = memoryUsers.get(userId);
      if (!user) {
        throw new HttpError(404, "User not found");
      }

      return {
        id: user.id,
        email: user.email,
        username: user.username,
        createdAt: user.createdAt,
        character: user.character,
        settlement: user.settlement,
      };
    }
  }

  // Clear memory store for tests
  clearMemoryStore() {
    memoryUsers.clear();
  }
}

export const authService = new AuthService();
