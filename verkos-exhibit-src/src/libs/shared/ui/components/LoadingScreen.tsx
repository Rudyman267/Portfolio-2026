export function LoadingScreen() {
  return (
    <div
      className="flex flex-col gap-4 items-center justify-center h-screen"
      style={{ backgroundColor: '#0C0C0E', color: '#ffffff' }}
    >
      <div className="w-8 h-8 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
      <span className="text-sm text-white/60">Loading</span>
    </div>
  );
}
