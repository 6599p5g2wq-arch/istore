import {makeAuthSession,readAuthSession,revokeAuthSession,cookieOptions} from './security';
import {cookies} from 'next/headers';
import {readCredentials,verifyCredentials,verifyValue} from './control-credentials';
const COOKIE='control_session';
export const verifyControl=(username:string,password:string):boolean=>verifyCredentials(username,password);
export const controlPrincipal=():string=>readCredentials()?.id||'';
export const verifyControlPassword=(password:string):boolean=>{const c=readCredentials();return !!c&&verifyValue(password,c.password_hash);};
export function createControlSession(remember=false,username='control'):string{const id=controlPrincipal();if(!id)throw Error('Control credentials not configured');return makeAuthSession('control',id,'control',remember);}
export async function getControlSession():Promise<boolean>{const token=(await cookies()).get(COOKIE)?.value;if(!token)return false;const s=readAuthSession('control',token);return !!s&&!!controlPrincipal()&&s.principal===controlPrincipal();}
export async function setControlCookie(remember=false,username='control'){(await cookies()).set(COOKIE,createControlSession(remember,username),cookieOptions(remember));}
export async function clearControlCookie(){const token=(await cookies()).get(COOKIE)?.value;if(token)revokeAuthSession(token);(await cookies()).delete(COOKIE);}
