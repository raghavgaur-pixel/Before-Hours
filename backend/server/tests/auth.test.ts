import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { buildApp } from "../src/app.js";
import { authService } from "../src/modules/auth/auth.service.js";

describe("Authentication API", () => {
  const app = buildApp({ logger: false });

  beforeEach(() => {
    authService.clearMemoryStore();
  });

  afterAll(async () => {
    await app.close();
  });

  describe("Health Check", () => {
    it("should return ok status", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/health",
      });

      expect(response.statusCode).toBe(200);
      const json = response.json();
      expect(json.status).toBe("ok");
      expect(json.game).toBe("AFTERHOURS");
    });
  });

  describe("POST /api/auth/register", () => {
    it("should register a new user successfully", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/auth/register",
        payload: {
          email: "player1@afterhours.game",
          username: "shadowblade",
          password: "password123",
          archetype: "warrior",
        },
      });

      expect(response.statusCode).toBe(201);
      const data = response.json();
      expect(data.success).toBe(true);
      expect(data.token).toBeDefined();
      expect(data.user.email).toBe("player1@afterhours.game");
      expect(data.user.username).toBe("shadowblade");
      expect(data.user.character).toBeDefined();
      expect(data.user.character.archetype).toBe("warrior");
      expect(data.user.settlement).toBeDefined();
      expect(data.user.settlement.wood).toBe(100);
      expect(response.headers["set-cookie"]).toBeDefined();
    });

    it("should fail validation if password is too short", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/auth/register",
        payload: {
          email: "player2@afterhours.game",
          username: "validuser",
          password: "123",
        },
      });

      expect(response.statusCode).toBe(400);
      const data = response.json();
      expect(data.error).toBe("Bad Request");
      expect(data.message).toBe("Validation failed");
    });

    it("should fail validation if username has invalid characters", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/auth/register",
        payload: {
          email: "player3@afterhours.game",
          username: "invalid user with spaces!",
          password: "password123",
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it("should reject duplicate email", async () => {
      await app.inject({
        method: "POST",
        url: "/api/auth/register",
        payload: {
          email: "duplicate@afterhours.game",
          username: "userone",
          password: "password123",
        },
      });

      const response = await app.inject({
        method: "POST",
        url: "/api/auth/register",
        payload: {
          email: "duplicate@afterhours.game",
          username: "usertwo",
          password: "password123",
        },
      });

      expect(response.statusCode).toBe(409);
      const data = response.json();
      expect(data.message).toContain("Email is already registered");
    });

    it("should reject duplicate username", async () => {
      await app.inject({
        method: "POST",
        url: "/api/auth/register",
        payload: {
          email: "first@afterhours.game",
          username: "warlord",
          password: "password123",
        },
      });

      const response = await app.inject({
        method: "POST",
        url: "/api/auth/register",
        payload: {
          email: "second@afterhours.game",
          username: "warlord",
          password: "password123",
        },
      });

      expect(response.statusCode).toBe(409);
      const data = response.json();
      expect(data.message).toContain("Username is already taken");
    });
  });

  describe("POST /api/auth/login", () => {
    beforeEach(async () => {
      await app.inject({
        method: "POST",
        url: "/api/auth/register",
        payload: {
          email: "loginuser@afterhours.game",
          username: "gunslinger01",
          password: "correctpassword",
          archetype: "gunslinger",
        },
      });
    });

    it("should login successfully using email", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/auth/login",
        payload: {
          login: "loginuser@afterhours.game",
          password: "correctpassword",
        },
      });

      expect(response.statusCode).toBe(200);
      const data = response.json();
      expect(data.success).toBe(true);
      expect(data.token).toBeDefined();
      expect(data.user.email).toBe("loginuser@afterhours.game");
      expect(data.user.username).toBe("gunslinger01");
    });

    it("should login successfully using username", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/auth/login",
        payload: {
          login: "gunslinger01",
          password: "correctpassword",
        },
      });

      expect(response.statusCode).toBe(200);
      const data = response.json();
      expect(data.success).toBe(true);
      expect(data.token).toBeDefined();
      expect(data.user.username).toBe("gunslinger01");
    });

    it("should reject invalid password", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/auth/login",
        payload: {
          login: "gunslinger01",
          password: "wrongpassword",
        },
      });

      expect(response.statusCode).toBe(401);
      const data = response.json();
      expect(data.message).toContain("Invalid email/username or password");
    });

    it("should reject nonexistent user", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/auth/login",
        payload: {
          login: "ghostuser",
          password: "somepassword",
        },
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe("GET /api/auth/me", () => {
    it("should reject unauthenticated request", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/api/auth/me",
      });

      expect(response.statusCode).toBe(401);
    });

    it("should return profile with valid Bearer token", async () => {
      const reg = await app.inject({
        method: "POST",
        url: "/api/auth/register",
        payload: {
          email: "me_user@afterhours.game",
          username: "arcanist_supreme",
          password: "password123",
          archetype: "arcanist",
        },
      });

      const { token } = reg.json();

      const response = await app.inject({
        method: "GET",
        url: "/api/auth/me",
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const data = response.json();
      expect(data.success).toBe(true);
      expect(data.user.email).toBe("me_user@afterhours.game");
      expect(data.user.username).toBe("arcanist_supreme");
      expect(data.user.character.archetype).toBe("arcanist");
    });
  });

  describe("POST /api/auth/logout", () => {
    it("should return success and clear cookie", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/auth/logout",
      });

      expect(response.statusCode).toBe(200);
      const data = response.json();
      expect(data.success).toBe(true);
      expect(data.message).toContain("Logged out");
    });
  });
});
