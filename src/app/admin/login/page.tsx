import React from 'react';
import {redirect} from 'next/navigation';
import {getSessionAdmin} from '@/lib/auth';
import {getSettings} from '@/lib/settings';
import SecureLogin from '@/components/admin/SecureLogin';
export const dynamic='force-dynamic';
export default function Page(){if(getSessionAdmin())redirect('/admin');const s=getSettings();return <SecureLogin panel="admin" storeName={s.store_name||'آي ستور'} logo={s.intro_logo?'/api/logo':undefined}/>;}
