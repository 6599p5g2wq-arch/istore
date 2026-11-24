import {NextRequest,NextResponse} from 'next/server';
import {requireAdmin,bad} from '@/lib/admin-api';
import {getDb} from '@/lib/db';
import {ordersCsv,STATUS_LABELS,validDate,EXPORT_COLUMNS} from '@/lib/orders-export';
export const dynamic='force-dynamic';
export async function GET(req:NextRequest){
 const auth=requireAdmin();if(auth)return auth;
 const p=req.nextUrl.searchParams,from=p.get('from')||'',to=p.get('to')||'',status=p.get('status')||'';
 if((from&&!validDate(from))||(to&&!validDate(to)))return bad('تاريخ غير صالح');
 if(from&&to&&from>to)return bad('تاريخ البداية يجب ألا يتجاوز النهاية');
 if(status&&!STATUS_LABELS[status])return bad('حالة غير صالحة');
 const selected=p.has('columns')?(p.get('columns')||'').split(','):EXPORT_COLUMNS.map(c=>c[0]);
 if(!selected.length||selected.some(k=>!EXPORT_COLUMNS.some(c=>c[0]===k)))return bad('اختر عموداً واحداً على الأقل، بأسماء صحيحة');
 const cond:string[]=[],args:string[]=[];
 if(from){cond.push("date(o.created_at,'+2 hours')>=?");args.push(from);}
 if(to){cond.push("date(o.created_at,'+2 hours')<=?");args.push(to);}
 if(status){cond.push('o.status=?');args.push(status);}
 const rows=getDb().prepare(`SELECT o.*,o.id order_id,datetime(o.created_at,'+2 hours') date,i.id item_id,i.product_id,i.variant_id,i.name,i.variant_label,i.qty,i.price,(i.qty*i.price) line_total,(SELECT group_concat(entry,' | ') FROM (SELECT status||' @ '||created_at entry FROM order_status_log WHERE order_id=o.id ORDER BY id)) status_history FROM orders o JOIN order_items i ON i.order_id=o.id ${cond.length?'WHERE '+cond.join(' AND '):''} ORDER BY o.id DESC,i.id ASC`).all(...args) as Record<string,unknown>[];
 for(const r of rows){r.status_label=STATUS_LABELS[String(r.status)]||r.status;r.payment='الدفع عند الاستلام';}
 return new NextResponse(ordersCsv(rows,selected),{headers:{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="orders-export.csv"','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
}
