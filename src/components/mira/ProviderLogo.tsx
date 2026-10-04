import type { ProviderId } from "@/lib/mira/config";
import { cn } from "@/lib/utils";

/** Simplified provider marks (placeholders — replace with official brand assets). */
export function ProviderLogo({ provider, className }: { provider: ProviderId; className?: string }) {
  const c = cn("size-4 shrink-0", className);
  switch (provider) {
    case "openai":
      return (
        <svg viewBox="0 0 24 24" className={c} fill="none" stroke="currentColor" strokeWidth="1.6" aria-label="OpenAI">
          {[0, 60, 120, 180, 240, 300].map((r) => (
            <ellipse key={r} cx="12" cy="8" rx="3.2" ry="5" transform={`rotate(${r} 12 12)`} />
          ))}
        </svg>
      );
    case "anthropic":
      return (
        <svg viewBox="0 0 24 24" className={c} fill="currentColor" aria-label="Anthropic">
          <path d="M13.8 4h3.1L22 20h-3.1zM7.1 4h3.2l5.1 16h-3.1l-1.1-3.4H6l-1.1 3.4H1.8zm-.2 9.9h3.9L8.9 7.7z" />
        </svg>
      );
    case "google":
      return (
        <svg viewBox="0 0 24 24" className={c} aria-label="Google Gemini">
          <defs>
            <linearGradient id="gem" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="oklch(0.65 0.17 250)" />
              <stop offset="1" stopColor="oklch(0.7 0.15 300)" />
            </linearGradient>
          </defs>
          <path fill="url(#gem)" d="M12 2c.6 5.2 4.8 9.4 10 10-5.2.6-9.4 4.8-10 10-.6-5.2-4.8-9.4-10-10 5.2-.6 9.4-4.8 10-10z" />
        </svg>
      );
    default:
      return <MiraMark className={c} />;
  }
}

export function MiraMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("size-4", className)} fill="none" stroke="currentColor" strokeWidth="1.8" aria-label="Mira">
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="3" fill="currentColor" />
    </svg>
  );
}
