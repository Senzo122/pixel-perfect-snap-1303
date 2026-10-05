import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Code2, FileText, Globe, ImageIcon } from "lucide-react";
import { useMira } from "@/lib/mira/store";
import { Page, input } from "@/components/mira/Page";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/library")({
  head: () => ({
    meta: [
      { title: "Bibliothèque — Mira" },
      { name: "description", content: "Retrouvez vos artifacts, fichiers et créations Mira au même endroit." },
      { property: "og:title", content: "Bibliothèque — Mira" },
      { property: "og:description", content: "Retrouvez vos artifacts, fichiers et créations Mira au même endroit." },
    ],
  }),
  component: Library,
});

type F = "all" | "artifacts" | "files" | "images";

function Library() {
  const artifacts = useMira((s) => s.artifacts);
  const files = useMira((s) => s.files);
  const convs = useMira((s) => s.conversations);
  const [q, setQ] = useState("");
  const [f, setF] = useState<F>("all");
  const images = convs.flatMap((c) => c.messages.filter((m) => m.image).map((m) => ({ id: m.id, convId: c.id, title: c.title, src: m.image!, ts: m.createdAt })));
  const items = [
    ...(f === "all" || f === "artifacts" ? artifacts.map((a) => ({ id: a.id, convId: a.conversationId, title: a.title, kind: a.kind === "web" ? "Page web" : "Code", icon: a.kind === "web" ? Globe : Code2, ts: a.createdAt, src: undefined as string | undefined })) : []),
    ...(f === "all" || f === "files" ? files.map((x) => ({ id: x.id, convId: x.conversationId, title: x.name, kind: "Fichier", icon: FileText, ts: x.createdAt, src: undefined })) : []),
    ...(f === "all" || f === "images" ? images.map((x) => ({ id: x.id, convId: x.convId, title: x.title, kind: "Image", icon: ImageIcon, ts: x.ts, src: x.src })) : []),
  ].filter((i) => i.title.toLowerCase().includes(q.toLowerCase())).sort((a, b) => b.ts - a.ts);

  return (
    <Page title="Bibliothèque">
      <div className="mb-6 flex flex-wrap gap-3">
        <input className={`${input} max-w-xs`} placeholder="Rechercher" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="flex gap-1">
          {([["all", "Tout"], ["artifacts", "Artifacts"], ["files", "Fichiers"], ["images", "Créations"]] as const).map(([k, l]) => (
            <button key={k} onClick={() => setF(k)} className={cn("rounded-full px-3 py-1.5 text-sm", f === k ? "bg-accent" : "text-muted-foreground hover:text-foreground")}>{l}</button>
          ))}
        </div>
      </div>
      {items.length === 0 ? (
        <p className="py-20 text-center text-sm text-muted-foreground">Rien ici pour l’instant. Vos créations apparaîtront automatiquement.</p>
      ) : (
        <div className="divide-y rounded-xl border">
          {items.map((i) => {
            const body = (
              <div className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/50">
                {i.src ? <img src={i.src} alt="" className="size-10 rounded-md object-cover" /> : <span className="grid size-10 place-items-center rounded-md bg-muted"><i.icon className="size-4" /></span>}
                <div className="min-w-0 flex-1"><div className="truncate text-sm">{i.title}</div><div className="text-xs text-muted-foreground">{i.kind} · {new Date(i.ts).toLocaleDateString("fr-FR")}</div></div>
              </div>
            );
            return i.convId ? <Link key={i.id} to="/chat/$id" params={{ id: i.convId }} className="block">{body}</Link> : <div key={i.id}>{body}</div>;
          })}
        </div>
      )}
    </Page>
  );
}
