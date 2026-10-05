import type { ReactNode } from "react";

export function Page({ title, subtitle, actions, children }: { title: string; subtitle?: string | undefined; actions?: ReactNode; children: ReactNode }) {
  return (
    <div className="h-full overflow-y-auto thin-scroll">
      <div className="mx-auto max-w-4xl px-4 py-8 md:px-8 md:py-12">
        <div className="mb-8 flex flex-wrap items-end gap-4">
          <div className="flex-1">
            <h1 className="text-2xl font-medium tracking-tight">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          {actions}
        </div>
        {children}
      </div>
    </div>
  );
}

export const btn = "inline-flex h-9 items-center gap-2 rounded-lg px-3.5 text-sm font-medium transition-colors disabled:opacity-40";
export const btnPrimary = `${btn} bg-primary text-primary-foreground hover:opacity-90`;
export const btnGhost = `${btn} border hover:bg-accent`;
export const input = "h-9 w-full rounded-lg border bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring";
