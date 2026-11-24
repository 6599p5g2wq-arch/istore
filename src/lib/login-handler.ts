import {NextRequest,NextResponse} from 'next/server';
import {cookies} from 'next/headers';
import {verifyAdmin,createSession} from './auth';
import {verifyControl,setControlCookie} from './control-auth';
import {Panel,authLocked,authFailure,authLog,authSuccess,cookieOptions,totpEnabled,makeChallenge,readChallenge,challengeAttempt,verifyTotp,deleteChallenge,sameOrigin} from './security';
export async function loginHandler(req:NextRequest,panel:Panel){
 const origin=req.headers.get('origin');if(origin&&!sameOrigin(origin,req.headers.get('host')))return NextResponse.json({error:'طلب غير مسموح'},{status:403});
 const b=await req.json().catch(()=>({}));const ip=(req.headers.get('x-forwarded-for')||'local').split(',')[0].trim(),device=req.headers.get('user-agent')||'Unknown';
 let username=String(b.username||'').trim().slice(0,120),principal='',remember=b.remember===true;
 const reject=(seconds:number)=>NextResponse.json({error:'تم إيقاف المحاولات مؤقتا، حاول لاحقا',retry_after:seconds},{status:429,headers:{'Retry-After':String(seconds)}});
 if(b.challenge){const c=readChallenge(panel,String(b.challenge));if(!c)return NextResponse.json({error:'انتهت خطوة التحقق، سجل الدخول مجددا'},{status:401});username=c.username;principal=c.principal;remember=!!c.remember;const locked=authLocked(panel,username,ip);if(locked)return reject(locked);challengeAttempt(String(b.challenge));if(!verifyTotp(panel,principal,String(b.code||''))){const secs=authFailure(panel,username,ip);authLog(panel,username,device,'totp_failed');return secs?reject(secs):NextResponse.json({error:'رمز التحقق غير صحيح أو سبق استخدامه'},{status:401});}deleteChallenge(String(b.challenge));
 }else{if(!username||!b.password)return NextResponse.json({error:'أدخل اسم المستخدم وكلمة المرور'},{status:400});const locked=authLocked(panel,username,ip);if(locked)return reject(locked);
 if(panel==='admin'){const id=verifyAdmin(username,String(b.password));if(id)principal=String(id);}else if(verifyControl(username,String(b.password)))principal=username;
 if(!principal){const secs=authFailure(panel,username,ip);authLog(panel,username,device,'failed');return secs?reject(secs):NextResponse.json({error:'بيانات الدخول غير صحيحة'},{status:401});}
 if(totpEnabled(panel,principal))return NextResponse.json({requires_totp:true,challenge:makeChallenge(panel,principal,username,remember)});
 }
 authSuccess(panel,username,ip);if(panel==='admin')(await cookies()).set('admin_session',createSession(Number(principal),remember),cookieOptions(remember));else (await setControlCookie(remember));authLog(panel,username,device,'success');return NextResponse.json({ok:true});
}
