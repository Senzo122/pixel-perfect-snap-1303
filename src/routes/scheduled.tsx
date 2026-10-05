import { createFileRoute } from "@tanstack/react-router";
import { CalendarClock } from "lucide-react";
import { toast } from "sonner";
import { Page, btnGhost } from "@/components/mira/Page";

export const Route = createFileRoute("/scheduled")({
  head: () => ({
    meta: [
      { title: "Planifié — Mira" },
      { name: "description", content: "Programmez des tâches récurrentes que Mira exécute pour vous." },
      { property: "og:title", content: "Planifié — Mira" },
      { property: "og:description", content: "Programmez des tâches récurrentes que Mira exécute pour vous." },
    ],
  }),
  component: () => (
    <Page title="Planifié">
      <div className="flex flex-col items-center py-24 text-center">
        <CalendarClock className="size-8 text-muted-foreground" />
        <h2 className="mt-4 text-lg font-medium">Aucune tâche planifiée</h2>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">Bientôt, Mira pourra exécuter des tâches à heure fixe : résumé quotidien, veille, rappels.</p>
        <button className={`${btnGhost} mt-6`} onClick={() => toast("Les tâches planifiées arrivent bientôt.")}>Découvrir la fonctionnalité</button>
      </div>
    </Page>
  ),
});
