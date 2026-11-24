import crypto from "crypto";
import {makeAuthSession,readAuthSession,revokeAuthSession,cookieOptions} from "./security";
import { cookies } from "next/headers";

// Standalone site-settings console auth - fully independent of the admin panel.
// Credentials come from env vars so they survive redeploys (Render has an ephemeral DB).
// Local dev defaults: control / control123 (override with SETTINGS_USERNAME / SETTINGS_PASSWORD).
const COOKIE = "control_session";

function creds() {
  return {
    username: process.env.SETTINGS_USERNAME || "control",
    password: process.env.SETTINGS_PASSWORD || "control123",
  };
}

export function verifyControl(username: string, password: string): boolean {
  const c = creds();
  const a = crypto.createHash("sha256").update(`${username}:${password}`).digest();
  const b = crypto.createHash("sha256").update(`${c.username}:${c.password}`).digest();
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function createControlSession(remember=false):string {const c=creds();return makeAuthSession('control',c.username,c.username,remember);}
export async function getControlSession():Promise<boolean> {const token=(await cookies()).get(COOKIE)?.value;if(!token)return false;const s=readAuthSession('control',token);return !!s&&s.principal===creds().username;}
export async function setControlCookie(remember=false){(await cookies()).set(COOKIE,createControlSession(remember),cookieOptions(remember));}
export async function clearControlCookie(){const token=(await cookies()).get(COOKIE)?.value;if(token)revokeAuthSession(token);(await cookies()).delete(COOKIE);}
