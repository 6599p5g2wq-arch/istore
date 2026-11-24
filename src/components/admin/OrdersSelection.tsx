"use client";
import React,{createContext,useContext,useState,useEffect} from 'react';
const Selection=createContext<{ids:number[];selected:number[];setSelected:(n:number[])=>void}>({ids:[],selected:[],setSelected:()=>{}});
export function OrdersSelection({ids,children}:{ids:number[];children:React.ReactNode}){const [selected,setSelected]=useState<number[]>([]);useEffect(()=>setSelected([]),[ids.join(',')]);return <Selection.Provider value={{ids,selected,setSelected}}>{children}</Selection.Provider>;}
export const useOrderSelection=()=>useContext(Selection);
export function OrderCheckbox({id,code}:{id:number;code:string}){let {selected,setSelected}=useOrderSelection();return <input type="checkbox" aria-label={`تحديد الطلب ${code}`} checked={selected.includes(id)} onChange={e=>setSelected(e.target.checked?[...selected,id]:selected.filter(n=>n!==id))} className="relative z-10 h-4 w-4 shrink-0 accent-black"/>;}
export function OrdersSelectAll(){let {ids,selected,setSelected}=useOrderSelection();return <label className="flex items-center gap-2 text-xs font-bold"><input type="checkbox" aria-label="تحديد كل طلبات الصفحة" disabled={!ids.length} checked={ids.length>0&&selected.length===ids.length} onChange={e=>setSelected(e.target.checked?ids:[])} className="h-4 w-4 accent-black"/>تحديد كل طلبات الصفحة ({ids.length})</label>;}
