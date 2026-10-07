import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { FolderOpen, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createProject, deleteProject, renameProject, useMira } from "@/lib/mira/store";
import { Page, btnPrimary } from "@/components/mira/Page";

export const Route = createFileRoute("/projects/")({
  head: () => ({
    meta: [
      { title: "Projets — Mira" },
      { name: "description", content: "Regroupez conversations, fichiers et artifacts dans des projets Mira." },
      { property: "og:title", content: "Projets — Mira" },
      { property: "og:description", content: "Regroupez conversations, fichiers et artifacts dans des projets Mira." },
    ],
  }),
  component: Projects,
});

function Projects() {
  const projects = useMira((s) => s.projects);
  const convs = useMira((s) => s.conversations);
  const nav = useNavigate();
  const create = () => {
    const name = prompt("Nom du projet");
    if (!name?.trim()) return;
    const id = createProject(name.trim());
    if (!id) { toast("Limite de projets atteinte pour votre plan."); return; }
    nav({ to: "/projects/$id", params: { id } });
  };
  return (
    <Page title="Projets" actions={<button className={btnPrimary} onClick={create}><Plus className="size-4" /> Nouveau projet</button>}>
      {projects.length === 0 ? (
        <div className="flex flex-col items-center py-24 text-center">
          <FolderOpen className="size-8 text-muted-foreground" />
          <h2 className="mt-4 text-lg font-medium">Aucun projet</h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">Un projet garde ensemble vos conversations, fichiers, artifacts et un contexte partagé.</p>
        </div>
      ) : (
        <div className="divide-y rounded-xl border">
          {projects.map((p) => (
            <div key={p.id} className="group flex items-center gap-3 px-4 py-3">
              <FolderOpen className="size-4 text-muted-foreground" />
              <Link to="/projects/$id" params={{ id: p.id }} className="flex-1 text-sm hover:underline">{p.name}</Link>
              <span className="text-xs text-muted-foreground">{convs.filter((c) => c.projectId === p.id).length} chats</span>
              <button aria-label="Renommer" className="text-muted-foreground hover:text-foreground" onClick={() => { const n = prompt("Renommer", p.name); if (n?.trim()) renameProject(p.id, n.trim()); }}><Pencil className="size-4" /></button>
              <button aria-label="Supprimer" className="text-muted-foreground hover:text-destructive" onClick={() => confirm("Supprimer ce projet ?") && deleteProject(p.id)}><Trash2 className="size-4" /></button>
            </div>
          ))}
        </div>
      )}
    </Page>
  );
}
