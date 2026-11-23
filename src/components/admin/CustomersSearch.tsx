"use client";

// بحث حي في جدول الزبائن (اسم/هاتف/بريد) بدون Enter
export default function CustomersSearch() {
  const filter = (value: string) => {
    const q = value.trim().toLowerCase();
    let visible = 0;
    document.querySelectorAll<HTMLElement>(".js-customer-row").forEach((row) => {
      const show = !q || (row.dataset.search || "").includes(q);
      row.style.display = show ? "" : "none";
      if (show) visible++;
    });
    const empty = document.getElementById("customers-empty");
    if (empty) empty.style.display = visible === 0 ? "" : "none";
  };
  return (
    <input onInput={(e) => filter(e.currentTarget.value)} placeholder="ابحث بالاسم أو الهاتف أو البريد…" autoComplete="off"
      className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white px-4 py-3 outline-none focus:border-black" />
  );
}
