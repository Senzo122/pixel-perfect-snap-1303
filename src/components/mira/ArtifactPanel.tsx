import { useEffect, useState } from "react";
import { Check, Copy, Download, Lock, X } from "lucide-react";
import { toast } from "sonner";
import { currentPlan, editArtifact, useMira } from "@/lib/mira/store";
import { cn } from "@/lib/utils";

type Tab = "code" | "preview";

export function ArtifactPanel({ id, onClose }: { id: string; onClose: () => void }) {
  const a = useMira((s) => s.artifacts.find((x) => x.id === id));
  const plan = useMira(currentPlan);
  const advanced = plan !== "free";
  const [tab, setTab] = useState<Tab>("code");
  const [version, setVersion] = useState<number | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => { setVersion(null); if (a?.kind === "web" && advanced) setTab("preview"); }, [id, a?.versions.length, a?.kind, advanced]);
  if (!a) return null;
  const idx = version ?? a.versions.length - 1;
  const content = a.versions[idx] ?? "";

  const copy = async () => { await navigator.clipboard.writeText(content); setCopied(true); setTimeout(() => setCopied(false), 1200); };
  const download = () => {
    const url = URL.createObjectURL(new Blob([content], { type: "text/plain" }));
    const el = document.createElement("a"); el.href = url; el.download = a.kind === "web" ? "page.html" : a.title; el.click(); URL.revokeObjectURL(url);
  };

  const tabBtn = (t: Tab, label: string, locked = false) => (
    <button
      onClick={() => (locked ? toast("La prévisualisation est disponible avec Plus.") : setTab(t))}
      className={cn("flex items-center gap-1 rounded-md px-2.5 py-1 text-sm transition-colors", tab === t ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground")}
    >
      {label}{locked && <Lock className="size-3" />}
    </button>
  );

  return (
    <div className="flex h-full flex-col bg-card">
      <div className="flex h-12 shrink-0 items-center gap-2 border-b px-3">
        <span className="truncate text-sm font-medium">{a.title}</span>
        <div className="ml-2 flex gap-0.5">
          {tabBtn("code", "Code")}
          {a.kind === "web" && tabBtn("preview", "Preview", !advanced)}
        </div>
        <div className="ml-auto flex items-center gap-0.5 text-muted-foreground">
          {advanced && a.versions.length > 1 && (
            <select value={idx} onChange={(e) => setVersion(Number(e.target.value))} className="mr-1 rounded-md border bg-background px-1.5 py-1 text-xs text-foreground">
              {a.versions.map((_, i) => <option key={i} value={i}>v{i + 1}</option>)}
            </select>
          )}
          <button onClick={copy} className="grid size-8 place-items-center rounded-md hover:bg-accent hover:text-foreground" aria-label="Copier">{copied ? <Check className="size-4" /> : <Copy className="size-4" />}</button>
          <button onClick={download} className="grid size-8 place-items-center rounded-md hover:bg-accent hover:text-foreground" aria-label="Télécharger"><Download className="size-4" /></button>
          <button onClick={onClose} className="grid size-8 place-items-center rounded-md hover:bg-accent hover:text-foreground" aria-label="Fermer"><X className="size-4" /></button>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-auto thin-scroll">
        {tab === "preview" && a.kind === "web" ? (
          <iframe title="Aperçu" srcDoc={content} sandbox="" className="h-full w-full bg-white" />
        ) : editing ? (
          <textarea value={draft} onChange={(e) => setDraft(e.target.value)} className="h-full w-full resize-none bg-transparent p-4 font-mono text-[13px] leading-relaxed focus:outline-none" />
        ) : (
          <pre className="p-4 font-mono text-[13px] leading-relaxed"><code>{content}</code></pre>
        )}
      </div>
      <div className="flex items-center gap-2 border-t px-3 py-2 text-xs text-muted-foreground">
        <span>Version {idx + 1} / {a.versions.length}</span>
        <span className="ml-auto" />
        {advanced ? (
          editing ? (
            <>
              <button onClick={() => setEditing(false)} className="rounded-md px-2 py-1 hover:text-foreground">Annuler</button>
              <button onClick={() => { editArtifact(a.id, draft); setEditing(false); }} className="rounded-md bg-primary px-2.5 py-1 text-primary-foreground">Enregistrer</button>
            </>
          ) : (
            <button onClick={() => { setDraft(content); setEditing(true); setTab("code"); }} className="rounded-md px-2 py-1 hover:text-foreground">Modifier</button>
          )
        ) : (
          <span className="flex items-center gap-1"><Lock className="size-3" /> Modification et versions avec Plus</span>
        )}
      </div>
    </div>
  );
}
