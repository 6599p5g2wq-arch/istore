import {NextRequest,NextResponse} from 'next/server';
import {cookies} from 'next/headers';
import {getControlSession,verifyControlPassword,controlPrincipal} from '@/lib/control-auth';
import {changeCredentials} from '@/lib/control-credentials';
import {sameOrigin,totpEnabled,verifyTotp,authLocked,authFailure,authSuccess,authLog,revokePrincipal} from '@/lib/security';
export const dynamic='force-dynamic';
export async function POST(req:NextRequest){
 if(!sameOrigin(req.headers.get('origin'),req.headers.get('host')))return NextResponse.json({error:'طلب غير مسموح'},{status:403});
 if(!(await getControlSession()))return NextResponse.json({error:'غير مصرح'},{status:401});
 const b=await req.json().catch(()=>null);if(!b||['password','newUsername','newPassword','confirmation','code'].some(k=>b[k]!==undefined&&typeof b[k]!=='string'))return NextResponse.json({error:'بيانات غير صالحة'},{status:400});
 const username=(b.newUsername||'').trim(),password=b.newPassword||'',id=controlPrincipal(),ip=(req.headers.get('x-forwarded-for')||'local').split(',')[0].trim();
 if(!username&&!password)return NextResponse.json({error:'غيّر اسم المستخدم أو كلمة المرور على الأقل'},{status:400});
 if(username.length>100||(password&&(password.length<16||password.length>1024||password!==b.confirmation))||String(b.password||'').length>1024)return NextResponse.json({error:'تحقق من الاسم وكلمة المرور الجديدة وتأكيدها (16 حرفاً على الأقل)'},{status:400});
 if(authLocked('control','control',ip))return NextResponse.json({error:'تم إيقاف المحاولات مؤقتاً'},{status:429});
 if(!verifyControlPassword(b.password||'')||(totpEnabled('control',id)&&!verifyTotp('control',id,b.code||''))){authFailure('control','control',ip);return NextResponse.json({error:'تعذر تأكيد هويتك. تحقق من كلمة المرور الحالية ورمز المصادقة، ثم حاول مجدداً.'},{status:401});}
 try{changeCredentials(username,password);revokePrincipal('control',id);authSuccess('control','control',ip);authLog('control','control',req.headers.get('user-agent')||'','credentials_changed');(await cookies()).delete('control_session');return NextResponse.json({ok:true,relogin:true},{headers:{'Cache-Control':'no-store'}});}catch{return NextResponse.json({error:'تعذر حفظ البيانات. تحقق من صلاحية كتابة ملف البصمات'},{status:503});}
}
