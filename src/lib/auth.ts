import crypto from "crypto";
import { cookies } from "next/headers";
import { getDb } from "./db";
import {makeAuthSession,readAuthSession,revokeAuthSession} from "./security";

export function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString("hex");
}

export function createAdmin(username: string, password: string) {
  const db = getDb();
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = hashPassword(password, salt);
  db.prepare("INSERT INTO admin_users (username, pass_hash, salt) VALUES (?, ?, ?)").run(username, hash, salt);
}

export function verifyAdmin(username: string, password: string): number | null {
  const db = getDb();
  const row = db.prepare("SELECT id, pass_hash, salt FROM admin_users WHERE username = ?").get(username) as
    | { id: number; pass_hash: string; salt: string }
    | undefined;
  if (!row) return null;
  const hash = hashPassword(password, row.salt);
  const a = Buffer.from(hash, "hex");
  const b = Buffer.from(row.pass_hash, "hex");
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  return row.id;
}

export function createSession(adminId:number,remember=false):string {const row=getDb().prepare('SELECT username FROM admin_users WHERE id=?').get(adminId) as {username:string};return makeAuthSession('admin',String(adminId),row.username,remember);}
export function getSessionAdmin():{id:number;username:string}|null {const token=cookies().get('admin_session')?.value;if(!token)return null;const session=readAuthSession('admin',token);if(!session)return null;return (getDb().prepare('SELECT id,username FROM admin_users WHERE id=?').get(session.principal) as {id:number;username:string}|undefined)||null;}
export function destroySession(token:string){revokeAuthSession(token);getDb().prepare('DELETE FROM sessions WHERE token=?').run(token);}
