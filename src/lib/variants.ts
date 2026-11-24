import type Database from "better-sqlite3";
import type { ProductOption, ProductVariant } from "./types";

/** Parse the products.options JSON column into a clean option list. */
export function parseOptions(json: string | null | undefined): ProductOption[] {
  try {
    const a = JSON.parse(json || "[]");
    if (!Array.isArray(a)) return [];
    return a
      .map((o) => ({
        name: String(o?.name ?? "").trim(),
        values: (Array.isArray(o?.values) ? o.values : []).map((v: unknown) => String(v).trim()).filter(Boolean),
      }))
      .filter((o) => o.name && o.values.length > 0)
      .slice(0, 3);
  } catch {
    return [];
  }
}

/** All combinations of the given options, in stable order. */
export function combos(options: ProductOption[]): Record<string, string>[] {
  let acc: Record<string, string>[] = [{}];
  for (const o of options) {
    const next: Record<string, string>[] = [];
    for (const base of acc) for (const v of o.values) next.push({ ...base, [o.name]: v });
    acc = next;
  }
  return acc;
}

export function comboLabel(combo: Record<string, string>, options: ProductOption[]): string {
  return options.map((o) => combo[o.name]).filter(Boolean).join(" / ");
}

export function getVariants(db: Database.Database, productId: number | string): ProductVariant[] {
  return db.prepare("SELECT * FROM product_variants WHERE product_id = ? ORDER BY sort_order, id").all(productId) as ProductVariant[];
}

type VariantInput = { options?: Record<string, string>; price?: number | null; stock?: number; image?: string };

/**
 * Replace a product's variants from admin input. The server recomputes the
 * combination list from the option definitions; client rows only supply
 * price/stock/image per combination. Keeps products.stock synced to the
 * variant total while variants exist.
 */
export function replaceVariants(db: Database.Database, productId: number, optionsJson: string, inputs: VariantInput[]) {
  const options = parseOptions(optionsJson);
  const existing = db.prepare("SELECT id,label FROM product_variants WHERE product_id=?").all(productId) as {id:number;label:string}[];
  if (options.length === 0) {db.prepare("DELETE FROM product_variants WHERE product_id=?").run(productId);return;}
  const kept = new Set<number>();
  const byLabel = new Map<string, VariantInput>();
  for (const inp of Array.isArray(inputs) ? inputs : []) {
    if (!inp || typeof inp !== "object") continue;
    const clean: Record<string, string> = {};
    for (const o of options) {
      const v = String(inp.options?.[o.name] ?? "").trim();
      if (o.values.includes(v)) clean[o.name] = v;
    }
    byLabel.set(comboLabel(clean, options), { ...inp, options: clean });
  }
  const ins = db.prepare("INSERT INTO product_variants (product_id, label, options, price, stock, image, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)");
  let sort = 0;
  for (const combo of combos(options)) {
    const label = comboLabel(combo, options);
    const inp = byLabel.get(label);
    const price = inp?.price != null && Number(inp.price) > 0 ? Number(inp.price) : null;
    const stock = Math.max(0, Math.floor(Number(inp?.stock) || 0));
    const image = String(inp?.image || "").slice(0, 500);
    const old = existing.find(v=>v.label===label);
    if(old){db.prepare("UPDATE product_variants SET options=?,price=?,stock=?,image=?,sort_order=? WHERE id=?").run(JSON.stringify(combo),price,stock,image,sort++,old.id);kept.add(old.id);}
    else {const r=ins.run(productId,label,JSON.stringify(combo),price,stock,image,sort++);kept.add(Number(r.lastInsertRowid));}
  }
  for(const old of existing)if(!kept.has(old.id))db.prepare("DELETE FROM product_variants WHERE id=?").run(old.id);
  syncProductStock(db, productId);
}

/** products.stock mirrors the variant total while the product has variants. */
export function syncProductStock(db: Database.Database, productId: number | string) {
  const row = db.prepare("SELECT COUNT(*) AS n, COALESCE(SUM(stock), 0) AS s FROM product_variants WHERE product_id = ?").get(productId) as { n: number; s: number };
  if (row.n > 0) db.prepare("UPDATE products SET stock = ? WHERE id = ?").run(row.s, productId);
}
