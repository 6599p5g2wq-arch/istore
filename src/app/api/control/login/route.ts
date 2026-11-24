import {NextRequest} from 'next/server';
import {loginHandler} from '@/lib/login-handler';
export const dynamic='force-dynamic';
export async function POST(req:NextRequest){return loginHandler(req,'control');}
