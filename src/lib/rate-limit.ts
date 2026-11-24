import type { NextRequest } from "next/server";
import crypto from "crypto";
import { getDb } from "./db";
export function clientIp(req: NextRequest): string {
  return (req.headers.get("x-forwarded-for") || "").split(",")[0].trim().slice(0, 100) || "local";
}
// Persistent, bounded counters. Deployment's trusted proxy must own forwarding headers.
function store() { const db=getDb();db.exec("CREATE TABLE IF NOT EXISTS public_rate_limits (k TEXT PRIMARY KEY, count INTEGER NOT NULL, reset_at INTEGER NOT NULL)");return db; }
const digest=(key:string)=>crypto.createHash("sha256").update(key).digest("hex");
export function tooMany(key:string,max=8,windowMs=15*60*1000):boolean {
 const db=store(),now=Date.now(),k=digest(key);
 return db.transaction(()=>{
  db.prepare("DELETE FROM public_rate_limits WHERE reset_at < ?").run(now);
  const row=db.prepare("INSERT INTO public_rate_limits(k,count,reset_at) VALUES(?,1,?) ON CONFLICT(k) DO UPDATE SET count=count+1 RETURNING count").get(k,now+windowMs) as {count:number};
  return row.count>max;
 })();
}
export function resetLimit(key:string){store().prepare("DELETE FROM public_rate_limits WHERE k=?").run(digest(key));}
