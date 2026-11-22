import crypto from "crypto";
import { cookies } from "next/headers";

// Standalone site-settings console auth - fully independent of the admin panel.
// Credentials come from env vars so they survive redeploys (Render has an ephemeral DB).
// Local dev defaults: control / control123 (override with SETTINGS_USERNAME / SETTINGS_PASSWORD).
const COOKIE = "control_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function creds() {
  return {
    username: process.env.SETTINGS_USERNAME || "control",
    password: process.env.SETTINGS_PASSWORD || "control123",
  };
}

function secret(): Buffer {
  return crypto.scryptSync(creds().password, "istore-control-salt", 32);
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", secret()).update(payload).digest("hex");
}

export function verifyControl(username: string, password: string): boolean {
  const c = creds();
  const a = crypto.createHash("sha256").update(`${username}:${password}`).digest();
  const b = crypto.createHash("sha256").update(`${c.username}:${c.password}`).digest();
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function createControlSession(): string {
  const ts = Date.now().toString();
  return `${ts}.${sign(ts)}`;
}

export function getControlSession(): boolean {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return false;
  const i = token.indexOf(".");
  if (i < 0) return false;
  const ts = token.slice(0, i);
  const sig = token.slice(i + 1);
  const expected = sign(ts);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  const age = Date.now() - Number(ts);
  return Number.isFinite(age) && age >= 0 && age < MAX_AGE * 1000;
}

export function setControlCookie() {
  cookies().set(COOKIE, createControlSession(), { httpOnly: true, sameSite: "lax", path: "/", maxAge: MAX_AGE });
}

export function clearControlCookie() {
  cookies().delete(COOKIE);
}
