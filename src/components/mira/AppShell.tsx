import { useEffect, useState, type ReactNode } from "react";
import { Navigate, useRouterState } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { currentUser, maybeTriggerAutoOffer, useMira } from "@/lib/mira/store";
import { Sidebar } from "./Sidebar";
import { AccountMenu } from "./AccountMenu";
import { OfferBanner } from "./OfferBanner";

export function AppShell({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const user = useMira(currentUser);
  const theme = useMira((s) => s.theme);
  const sent = useMira((s) => s.messagesSent);
  const path = useRouterState({ select: (r) => r.location.pathname });
  const [open, setOpen] = useState(false);

  useEffect(() => setReady(true), []);
  useEffect(() => { document.documentElement.classList.toggle("dark", theme === "dark"); }, [theme]);
  useEffect(() => { maybeTriggerAutoOffer(); }, [sent]);
  useEffect(() => setOpen(false), [path]);

  if (!ready) return <div className="min-h-screen bg-background" />;
  if (path === "/login") return user ? <Navigate to="/" /> : <>{children}</>;
  if (!user) return <Navigate to="/login" />;

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-background">
      <div className="hidden md:flex"><Sidebar /></div>
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button aria-label="Fermer" className="absolute inset-0 bg-background/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative h-full w-72 animate-rise"><Sidebar /></div>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-2 px-3 md:px-5">
          <button className="grid size-9 place-items-center rounded-lg text-muted-foreground hover:bg-accent md:hidden" onClick={() => setOpen(true)} aria-label="Menu">
            <Menu className="size-5" />
          </button>
          <div className="ml-auto"><AccountMenu /></div>
        </header>
        <OfferBanner />
        <main className="min-h-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
