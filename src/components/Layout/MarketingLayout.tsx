import type { ReactNode } from 'react';

export function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh w-full bg-[#0a0f10] text-zinc-50 selection:bg-teal-500/25">
      {children}
    </div>
  );
}
