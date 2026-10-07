import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import { FileText, Loader2, Upload, X } from "lucide-react";
import { askFiles } from "@/lib/ai/ask-files.functions";
import { Page, btnGhost, btnPrimary } from "@/components/mira/Page";
import { MiraMark } from "@/components/mira/ProviderLogo";

export const Route = createFileRoute("/ask")({
  head: () => ({
    meta: [
      { title: "Questions sur vos fichiers — Mira" },
      { name: "description", content: "Posez une question et Mira y répond à partir de vos documents, PDF et images." },
      { property: "og:title", content: "Questions sur vos fichiers — Mira" },
      { property: "og:description", content: "Posez une question et Mira y répond à partir de vos documents, PDF et images." },
    ],
  }),
  component: AskPage,
});

const MAX_SIZE = 8 * 1024 * 1024;
const TEXT_EXT = /\.(txt|md|csv|json|xml|html?|ya?ml|log|js|ts|tsx|py|css)$/i;

async function toPayload(f: File) {
  const mimeType = f.type || "text/plain";
  if (mimeType.startsWith("image/") || mimeType === "application/pdf") {
    const buf = new Uint8Array(await f.arrayBuffer());
    let bin = "";
    for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
    return { name: f.name, mimeType, base64: btoa(bin) };
  }
  return { name: f.name, mimeType, text: await f.text() };
}

function AskPage() {
  const ask = useServerFn(askFiles);
  const fileRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");

  const add = (list: FileList | null) => {
    setError("");
    const next = Array.from(list ?? []).filter((f) => {
      const ok = f.type.startsWith("image/") || f.type === "application/pdf" || f.type.startsWith("text/") || TEXT_EXT.test(f.name);
      if (!ok) setError(`Format non pris en charge : ${f.name} (PDF, images ou texte).`);
      else if (f.size > MAX_SIZE) setError(`${f.name} dépasse 8 Mo.`);
      return ok && f.size <= MAX_SIZE;
    });
    setFiles((x) => [...x, ...next].slice(0, 10));
  };

  const submit = async () => {
    if (!question.trim() || !files.length || loading) return;
    setLoading(true); setError(""); setAnswer("");
    try {
      const payload = await Promise.all(files.map(toPayload));
      const res = await ask({ data: { question, files: payload } });
      if (res.ok) setAnswer(res.answer);
      else setError(res.error);
    } catch {
      setError("Impossible d’envoyer la demande. Vérifiez la taille des fichiers.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page title="Questions sur vos fichiers" subtitle="Ajoutez des documents, posez votre question : Mira répond en s’appuyant uniquement sur leur contenu.">
      <div className="space-y-4">
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); add(e.dataTransfer.files); }}
          className="rounded-2xl border border-dashed p-6 text-center"
        >
          <input ref={fileRef} type="file" multiple hidden accept="image/*,application/pdf,text/*,.md,.csv,.json" onChange={(e) => { add(e.target.files); e.target.value = ""; }} />
          <button className={btnGhost} onClick={() => fileRef.current?.click()}><Upload className="size-4" /> Ajouter des fichiers</button>
          <p className="mt-2 text-xs text-muted-foreground">PDF, images ou fichiers texte · 10 fichiers, 8 Mo max chacun</p>
          {files.length > 0 && (
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {files.map((f, i) => (
                <span key={`${f.name}-${i}`} className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-2.5 py-1 text-xs">
                  <FileText className="size-3.5 text-muted-foreground" />
                  <span className="max-w-[12rem] truncate">{f.name}</span>
                  <button aria-label="Retirer" onClick={() => setFiles((x) => x.filter((_, j) => j !== i))}><X className="size-3" /></button>
                </span>
              ))}
            </div>
          )}
        </div>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit(); }}
          placeholder="Votre question sur ces fichiers…"
          className="min-h-28 w-full rounded-2xl border bg-card p-4 text-[15px] focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <div className="flex justify-end">
          <button className={btnPrimary} disabled={loading || !question.trim() || !files.length} onClick={submit}>
            {loading && <Loader2 className="size-4 animate-spin" />} {loading ? "Analyse…" : "Demander à Mira"}
          </button>
        </div>
        {error && <p className="rounded-xl border border-destructive/40 px-4 py-3 text-sm text-destructive">{error}</p>}
        {answer && (
          <div className="flex gap-3 rounded-2xl border p-5 animate-rise">
            <MiraMark className="mt-1 size-5 shrink-0" />
            <div className="whitespace-pre-wrap text-[15px] leading-7">{answer}</div>
          </div>
        )}
      </div>
    </Page>
  );
}
