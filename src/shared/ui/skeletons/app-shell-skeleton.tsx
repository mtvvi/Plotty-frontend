export function AppShellSkeleton() {
  return (
    <div className="plotty-page-shell animate-pulse">
      <div className="plotty-frame h-[520px] bg-white/40" />
      <div className="plotty-frame h-[300px] bg-white/30" />
    </div>
  );
}

export function PageContentSkeleton() {
  return (
    <div className="plotty-frame-inner animate-pulse pb-6 pt-4 lg:pb-8 lg:pt-7">
      <div className="mb-6 space-y-3">
        <div className="h-4 w-28 rounded-full bg-white/60" />
        <div className="h-10 w-full max-w-[28rem] rounded-[var(--plotty-radius-sm)] bg-white/70" />
        <div className="h-4 w-full max-w-[38rem] rounded-full bg-white/50" />
      </div>
      <div className="grid gap-4">
        <div className="h-40 rounded-[var(--plotty-radius-lg)] bg-white/50" />
        <div className="h-40 rounded-[var(--plotty-radius-lg)] bg-white/40" />
      </div>
    </div>
  );
}
