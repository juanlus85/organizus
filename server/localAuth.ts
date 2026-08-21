import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import type { Express, Request, Response } from "express";
import { COOKIE_NAME, ONE_YEAR_MS } from "../shared/const";
import * as db from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { sdk } from "./_core/sdk";

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const digest = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${digest}`;
}

function verifyPassword(password: string, storedHash: string) {
  const [algorithm, salt, digest] = storedHash.split("$");
  if (algorithm !== "scrypt" || !salt || !digest) return false;
  const derived = scryptSync(password, salt, 64).toString("hex");
  return timingSafeEqual(Buffer.from(digest, "hex"), Buffer.from(derived, "hex"));
}

async function ensureInitialAdmin() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME?.trim() || "Administrador OrganizUS";
  if (!email || !password) {
    console.warn("[Local auth] Define ADMIN_EMAIL y ADMIN_PASSWORD para crear el acceso inicial.");
    return;
  }
  const existingUser = await db.getUserByEmail(email);
  if (existingUser) return;
  await db.upsertUser({
    openId: `local_${randomBytes(20).toString("hex")}`,
    name,
    email,
    loginMethod: "local",
    passwordHash: hashPassword(password),
    role: "admin",
    lastSignedIn: new Date(),
  });
  console.log(`[Local auth] Administrador inicial creado para ${email}`);
}

export function registerLocalAuthRoutes(app: Express) {
  void ensureInitialAdmin();

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const password = typeof req.body?.password === "string" ? req.body.password : "";
    if (!email || !password) {
      res.status(400).json({ error: "Email y contraseña son obligatorios." });
      return;
    }
    const user = await db.getUserByEmail(email);
    if (!user?.passwordHash || !verifyPassword(password, user.passwordHash)) {
      res.status(401).json({ error: "Credenciales incorrectas." });
      return;
    }
    const sessionToken = await sdk.createSessionToken(user.openId, {
      name: user.name || user.email || "Administrador",
      expiresInMs: ONE_YEAR_MS,
    });
    res.cookie(COOKIE_NAME, sessionToken, { ...getSessionCookieOptions(req), maxAge: ONE_YEAR_MS });
    await db.upsertUser({ openId: user.openId, lastSignedIn: new Date() });
    res.json({ success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  });
}
