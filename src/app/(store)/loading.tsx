export default function StoreLoading() {
  return (
    <div className="fixed inset-x-0 top-0 z-[100] h-0.5 overflow-hidden bg-transparent" aria-hidden>
      <div className="h-full w-1/3 animate-[loading-bar_1s_ease-in-out_infinite] rounded-full bg-[var(--accent)]" />
      <style>{`@keyframes loading-bar { 0% { transform: translateX(100%);} 100% { transform: translateX(-300%);} }`}</style>
    </div>
  );
}
