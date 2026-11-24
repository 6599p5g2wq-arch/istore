import {NextRequest,NextResponse} from 'next/server';
import {getSessionAdmin} from '@/lib/auth';
import {getControlSession} from '@/lib/control-auth';
import {authConfig,sameOrigin} from '@/lib/security';
export const dynamic='force-dynamic';
export async function POST(req:NextRequest){if(!sameOrigin(req.headers.get('origin'),req.headers.get('host')))return NextResponse.json({ok:false},{status:403});const ok=req.nextUrl.searchParams.get('panel')==='control'?(await getControlSession()):(await getSessionAdmin());return NextResponse.json({ok:!!ok,idleMinutes:authConfig().idleMinutes},{status:ok?200:401});}
