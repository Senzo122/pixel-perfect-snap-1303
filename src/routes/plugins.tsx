import { createFileRoute } from "@tanstack/react-router";
import { Calendar, FileSpreadsheet, Github, Mail, Music, NotebookPen } from "lucide-react";
import { Page } from "@/components/mira/Page";

const PLUGINS = [
  { name: "Gmail", desc: "Lire et rédiger vos e-mails", icon: Mail, soon: false },
  { name: "Google Agenda", desc: "Planifier et consulter vos événements", icon: Calendar, soon: false },
  { name: "GitHub", desc: "Explorer vos dépôts et issues", icon: Github, soon: true },
  { name: "Notion", desc: "Chercher dans vos pages", icon: NotebookPen, soon: true },
  { name: "Sheets", desc: "Analyser vos tableaux", icon: FileSpreadsheet, soon: true },
  { name: "Spotify", desc: "Créer des playlists", icon: Music, soon: true },
];

export const Route = createFileRoute("/plugins")({
  head: () => ({
    meta: [
      { title: "Plugins — Mira" },
      { name: "description", content: "Connectez Mira à vos outils : e-mail, agenda, code et documents." },
      { property: "og:title", content: "Plugins — Mira" },
      { property: "og:description", content: "Connectez Mira à vos outils : e-mail, agenda, code et documents." },
    ],
  }),
  component: () => (
    <Page title="Plugins" subtitle="Donnez à Mira accès à vos outils, en toute transparence.">
      <div className="grid gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-2">
        {PLUGINS.map((p) => (
          <div key={p.name} className="flex items-center gap-3 bg-background p-4">
            <span className="grid size-10 place-items-center rounded-lg bg-muted"><p.icon className="size-5" /></span>
            <div className="flex-1">
              <div className="text-sm font-medium">{p.name}</div>
              <div className="text-xs text-muted-foreground">{p.desc}</div>
            </div>
            <span className="text-xs text-muted-foreground">{p.soon ? "Bientôt disponible" : "Aperçu"}</span>
          </div>
        ))}
      </div>
    </Page>
  ),
});
