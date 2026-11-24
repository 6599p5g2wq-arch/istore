// Column definitions are kept here so a local-system import template can be mapped without a schema change.
import columns from './orders-export-columns.json';
export const EXPORT_COLUMNS=columns as [string,string][];
export const STATUS_LABELS:Record<string,string>={new:'جديد',confirmed:'مؤكد',shipped:'تم الشحن',delivered:'تم التوصيل',cancelled:'ملغي'};
export function validDate(s:string){return /^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s+'T00:00:00Z'))&&new Date(s+'T00:00:00Z').toISOString().slice(0,10)===s;}
export function csvCell(v:unknown){let s=String(v??'');if(/^[\s\u0000-\u001f]*[=+@-]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';}
export function ordersCsv(rows:Record<string,unknown>[],selected=EXPORT_COLUMNS.map(c=>c[0])){return '\uFEFF'+[EXPORT_COLUMNS.filter(c=>selected.includes(c[0])).map(c=>c[0]),...rows.map(r=>EXPORT_COLUMNS.filter(c=>selected.includes(c[0])).map(c=>r[c[0]]))].map(r=>r.map(csvCell).join(',')).join('\r\n')+'\r\n';}
