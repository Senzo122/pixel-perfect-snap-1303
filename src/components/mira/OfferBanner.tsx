import { Link } from "@tanstack/react-router";
import { X } from "lucide-react";
import { dismissOffer, useMira } from "@/lib/mira/store";

export function OfferBanner() {
  const until = useMira((s) => s.shownOfferUntil);
  const cfg = useMira((s) => s.autoOffer);
  if (until <= Date.now()) return null;
  const h = Math.max(1, Math.round((until - Date.now()) / 3600_000));
  return (
    <div className="mx-auto mb-2 flex w-full max-w-3xl items-center gap-3 rounded-full border bg-card px-4 py-2 text-sm animate-rise">
      <span className="flex-1">
        <strong className="font-medium">-{cfg.percent} %</strong> sur Plus pendant encore {h} h.
      </span>
      <Link to="/settings" search={{ tab: "subscription" }} className="font-medium underline-offset-4 hover:underline">Voir l’offre</Link>
      <button onClick={dismissOffer} aria-label="Fermer" className="text-muted-foreground hover:text-foreground"><X className="size-4" /></button>
    </div>
  );
}
