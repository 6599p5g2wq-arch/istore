export function safeLink(value:unknown,fallback="/products"):string {
 if(typeof value!=="string")return fallback;
 const s=value.trim();if(/[\u0000-\u0020\\]/.test(s))return fallback;
 if(/^\/(?!\/)/.test(s))return s;
 try {const u=new URL(s);if(["https:","http:"].includes(u.protocol))return s;}catch{}
 return fallback;
}
