import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import starter from './control-starter.json' with {type:'json'};
export const credentialPath=()=>process.env.CONTROL_CREDENTIAL_FILE||path.join(process.cwd(),'.private','control-credentials.json');
export function hashValue(value){const salt=crypto.randomBytes(16).toString('hex');return `scrypt$131072$8$1$${salt}$${crypto.scryptSync(value,salt,32,{N:131072,r:8,p:1,maxmem:160*1024*1024}).toString('hex')}`;}
export function verifyValue(value,encoded){if(typeof value!=='string'||value.length>1024||typeof encoded!=='string')return false;const m=/^scrypt\$131072\$8\$1\$([a-f0-9]{32})\$([a-f0-9]{64})$/.exec(encoded);if(!m)return false;const actual=crypto.scryptSync(value,m[1],32,{N:131072,r:8,p:1,maxmem:160*1024*1024});return crypto.timingSafeEqual(actual,Buffer.from(m[2],'hex'));}
function credentialDb(){const db=new Database(process.env.DB_PATH||path.join(process.cwd(),'istore.db'));db.exec('CREATE TABLE IF NOT EXISTS control_credentials(id INTEGER PRIMARY KEY CHECK(id=1),record TEXT NOT NULL)');return db;}
export function readCredentials(){let db;try{db=credentialDb();const row=db.prepare('SELECT record FROM control_credentials WHERE id=1').get();let c;if(row)c=JSON.parse(row.record);else{const file=credentialPath();const text=fs.existsSync(file)?fs.readFileSync(file,'utf8'):process.env.CONTROL_CREDENTIAL_HASHES;if(text)c=JSON.parse(text);else c=starter;if(!c||c.version!==1||!/^[a-f0-9]{32}$/.test(c.id))return null;db.prepare('INSERT OR IGNORE INTO control_credentials VALUES(1,?)').run(JSON.stringify(c));c=JSON.parse(db.prepare('SELECT record FROM control_credentials WHERE id=1').get().record);}return c&&c.version===1&&/^[a-f0-9]{32}$/.test(c.id)&&typeof c.username_hash==='string'&&typeof c.password_hash==='string'?c:null;}catch{return null;}finally{db?.close();}}
export function saveCredentials(c){const db=credentialDb();try{db.prepare('INSERT OR REPLACE INTO control_credentials VALUES(1,?)').run(JSON.stringify(c));}finally{db.close();}}
export function verifyCredentials(username,password){const c=readCredentials();if(!c)return false;const a=verifyValue(username.trim(),c.username_hash),b=verifyValue(password,c.password_hash);return a&&b;}
export function changeCredentials(username,password){const old=readCredentials();if(!old)throw Error('Not configured');const c={...old,username_hash:username?hashValue(username):old.username_hash,password_hash:password?hashValue(password):old.password_hash,starter:false};saveCredentials(c);}
