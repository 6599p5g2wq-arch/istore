import React from 'react';
import {redirect} from 'next/navigation';
import {getControlSession} from '@/lib/control-auth';
import {getSettings} from '@/lib/settings';
import SecureLogin from '@/components/admin/SecureLogin';
export const dynamic='force-dynamic';
export default function Page(){if(getControlSession())redirect('/control');const s=getSettings();return <SecureLogin panel="control" storeName={s.store_name||'آي ستور'} logo={s.intro_logo?'/api/logo':undefined}/>;}
