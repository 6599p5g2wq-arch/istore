import { NextRequest,NextResponse } from "next/server";
import { getDb } from "@/lib/db";
export async function GET(req:NextRequest){const ids=(req.nextUrl.searchParams.get("ids")||"").split(",").map(Number).filter(n=>Number.isSafeInteger(n)&&n>0).slice(0,100);if(!ids.length)return NextResponse.json({products:[]});const products=getDb().prepare(`SELECT p.*,c.name AS category_name FROM products p LEFT JOIN categories c ON c.id=p.category_id WHERE p.active=1 AND p.id IN (${ids.map(()=>"?").join(",")})`).all(...ids);return NextResponse.json({products});}
