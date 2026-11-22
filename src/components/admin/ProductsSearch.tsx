"use client";

// بحث حي في جدول المنتجات: يفلتر مع كل حرف بدون Enter، وتفريغ الحقل يعيد كل المنتجات
export default function ProductsSearch({ initialQ }: { initialQ: string }) {
  const filter = (value: string) => {
    const q = value.trim().toLowerCase();
    let visible = 0;
    document.querySelectorAll<HTMLElement>(".js-product-row").forEach((row) => {
      const show = !q || (row.dataset.name || "").includes(q);
      row.style.display = show ? "" : "none";
      if (show) visible++;
    });
    const count = document.getElementById("products-count");
    if (count) count.textContent = String(visible);
    const empty = document.getElementById("products-empty");
    if (empty) empty.style.display = visible === 0 ? "" : "none";
  };

  return (
    <input
      name="q"
      defaultValue={initialQ}
      onInput={(e) => filter(e.currentTarget.value)}
      placeholder="ابحث عن منتج…"
      autoComplete="off"
      className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white px-4 py-3 outline-none focus:border-black"
    />
  );
}
