import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useRef } from "react";
import { Code2, FileText, MessageSquare, Plus, Upload } from "lucide-react";
import { addProjectFile, createConversation, setProjectContext, useMira } from "@/lib/mira/store";
import { Page, btnGhost, btnPrimary } from "@/components/mira/Page";

export const Route = createFileRoute("/projects/$id")({
  head: () => ({ meta: [{ title: "Projet — Mira" }, { name: "robots", content: "noindex" }] }),
  component: ProjectPage,
});

function ProjectPage() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const project = useMira((s) => s.projects.find((p) => p.id === id));
  const convs = useMira((s) => s.conversations.filter((c) => c.projectId === id && c.messages.length));
  const files = useMira((s) => s.files.filter((f) => f.projectId === id));
  const artifacts = useMira((s) => s.artifacts.filter((a) => s.conversations.find((c) => c.id === a.conversationId)?.projectId === id));
  if (!project) return <Page title="Projet introuvable"><Link to="/projects" className="text-sm underline">Retour aux projets</Link></Page>;

  const block = "rounded-xl border";
  return (
    <Page title={project.name} actions={<button className={btnPrimary} onClick={() => { const cid = createConversation(id); nav({ to: "/chat/$id", params: { id: cid } }); }}><Plus className="size-4" /> Nouveau chat</button>}>
      <section className="mb-8">
        <h2 className="mb-2 text-sm font-medium">Contexte</h2>
        <textarea defaultValue={project.context} onBlur={(e) => setProjectContext(id, e.target.value)} placeholder="Instructions partagées par toutes les conversations de ce projet…" className="min-h-24 w-full rounded-xl border bg-background p-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
      </section>
      <div className="grid gap-6 md:grid-cols-2">
        <section>
          <h2 className="mb-2 text-sm font-medium">Conversations</h2>
          <div className={`${block} divide-y`}>
            {convs.length ? convs.map((c) => <Link key={c.id} to="/chat/$id" params={{ id: c.id }} className="flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-accent/50"><MessageSquare className="size-4 text-muted-foreground" />{c.title}</Link>) : <p className="p-3 text-sm text-muted-foreground">Aucune conversation</p>}
          </div>
        </section>
        <section>
          <div className="mb-2 flex items-center"><h2 className="flex-1 text-sm font-medium">Fichiers</h2>
            <input ref={fileRef} type="file" hidden multiple onChange={(e) => { Array.from(e.target.files ?? []).forEach((f) => addProjectFile(id, { id: crypto.randomUUID(), name: f.name, size: f.size })); e.target.value = ""; }} />
            <button className={`${btnGhost} h-7 px-2 text-xs`} onClick={() => fileRef.current?.click()}><Upload className="size-3.5" /> Ajouter</button>
          </div>
          <div className={`${block} divide-y`}>
            {files.length ? files.map((f) => <div key={f.id} className="flex items-center gap-2 px-3 py-2.5 text-sm"><FileText className="size-4 text-muted-foreground" />{f.name}</div>) : <p className="p-3 text-sm text-muted-foreground">Aucun fichier</p>}
          </div>
        </section>
        <section className="md:col-span-2">
          <h2 className="mb-2 text-sm font-medium">Artifacts</h2>
          <div className={`${block} divide-y`}>
            {artifacts.length ? artifacts.map((a) => <Link key={a.id} to="/chat/$id" params={{ id: a.conversationId }} className="flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-accent/50"><Code2 className="size-4 text-muted-foreground" />{a.title}</Link>) : <p className="p-3 text-sm text-muted-foreground">Aucun artifact</p>}
          </div>
        </section>
      </div>
    </Page>
  );
}
