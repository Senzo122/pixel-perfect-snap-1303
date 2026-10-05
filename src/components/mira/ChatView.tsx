import { useEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Code2, FileText, Film, Globe } from "lucide-react";
import { toast } from "sonner";
import { SUGGESTIONS } from "@/lib/mira/config";
import { createConversation, sendMessage, useMira } from "@/lib/mira/store";
import type { Message } from "@/lib/mira/types";
import { Composer, type ComposerSubmit } from "./Composer";
import { ArtifactPanel } from "./ArtifactPanel";
import { MiraMark } from "./ProviderLogo";
import { cn } from "@/lib/utils";

function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((p, i) => (p.startsWith("**") ? <strong key={i} className="font-semibold">{p.slice(2, -2)}</strong> : p));
}
function Prose({ text }: { text: string }) {
  return <div className="space-y-3 text-[15px] leading-7">{text.split(/\n\n+/).map((b, i) => <p key={i} className="whitespace-pre-wrap">{inline(b)}</p>)}</div>;
}

function MessageRow({ m, onOpenArtifact }: { m: Message; onOpenArtifact: (id: string) => void }) {
  const artifact = useMira((s) => (m.artifactId ? s.artifacts.find((a) => a.id === m.artifactId) : undefined));
  if (m.role === "user") {
    return (
      <div className="flex flex-col items-end gap-2 animate-rise">
        {m.files?.length ? (
          <div className="flex flex-wrap justify-end gap-1.5">
            {m.files.map((f) => <span key={f.id} className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs"><FileText className="size-3.5" />{f.name}</span>)}
          </div>
        ) : null}
        {m.content && <div className="max-w-[85%] rounded-2xl bg-user-bubble px-4 py-2.5 text-[15px] leading-7 text-user-bubble-foreground whitespace-pre-wrap">{m.content}</div>}
      </div>
    );
  }
  return (
    <div className="flex gap-3 animate-rise">
      <MiraMark className="mt-1.5 size-5 shrink-0" />
      <div className="min-w-0 flex-1 space-y-3">
        {m.pending ? (
          <div className="flex items-center gap-2 pt-2 text-sm text-muted-foreground">
            {m.task === "web" && <Globe className="size-4" />}
            <span className="animate-pulse">{m.task === "web" ? "Recherche…" : m.task === "image" ? "Création de l’image…" : "Réflexion…"}</span>
          </div>
        ) : (
          <>
            <Prose text={m.content} />
            {m.image && <img src={m.image} alt="Image générée" className="w-full max-w-lg rounded-xl border" />}
            {m.video && <div className="grid aspect-video w-full max-w-lg place-items-center rounded-xl border bg-muted text-muted-foreground"><Film className="size-6" /></div>}
            {artifact && (
              <button onClick={() => onOpenArtifact(artifact.id)} className="flex w-full max-w-sm items-center gap-3 rounded-xl border bg-card px-3.5 py-3 text-left transition-colors hover:bg-accent">
                <span className="grid size-9 place-items-center rounded-lg bg-muted">{artifact.kind === "web" ? <Globe className="size-4" /> : <Code2 className="size-4" />}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{artifact.title}</span>
                  <span className="block text-xs text-muted-foreground">{artifact.kind === "web" ? "Page web" : "Code"} · v{artifact.versions.length}</span>
                </span>
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export function ChatView({ conversationId, projectId }: { conversationId?: string | undefined; projectId?: string | undefined }) {
  const nav = useNavigate();
  const conv = useMira((s) => s.conversations.find((c) => c.id === conversationId));
  const lastArtifactId = useMira((s) => [...s.artifacts].reverse().find((a) => a.conversationId === conversationId)?.id);
  const [openArtifact, setOpenArtifact] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<"chat" | "artifact">("chat");
  const endRef = useRef<HTMLDivElement>(null);
  const pending = conv?.messages.some((m) => m.pending) ?? false;

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [conv?.messages.length, pending]);
  useEffect(() => { if (lastArtifactId) { setOpenArtifact(lastArtifactId); } }, [lastArtifactId, conv?.messages.length]);
  useEffect(() => { setOpenArtifact(null); setMobileTab("chat"); }, [conversationId]);

  const submit = async (v: ComposerSubmit) => {
    let id = conversationId;
    if (!id) {
      id = createConversation(projectId);
      nav({ to: "/chat/$id", params: { id } });
    }
    const res = await sendMessage(id, v.text, { modelId: v.modelId, files: v.files, forceTask: v.forceTask });
    if (res.error) toast(res.error);
  };

  const empty = !conv || conv.messages.length === 0;

  if (empty) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-4 pb-[12vh]">
        <h1 className="mb-8 text-center text-3xl font-medium tracking-tight md:text-4xl">Que voulez-vous créer ?</h1>
        <div className="w-full max-w-2xl"><Composer onSubmit={submit} autoFocus /></div>
        <div className="mt-5 flex max-w-2xl flex-wrap justify-center gap-2">
          {SUGGESTIONS.map((s) => (
            <button key={s} onClick={() => submit({ text: s, files: [], modelId: null })} className="rounded-full border px-3.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">{s}</button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0">
      <div className={cn("flex min-w-0 flex-1 flex-col", openArtifact && mobileTab === "artifact" && "hidden lg:flex")}>
        {openArtifact && (
          <div className="flex justify-center gap-1 pb-2 lg:hidden">
            {(["chat", "artifact"] as const).map((t) => (
              <button key={t} onClick={() => setMobileTab(t)} className={cn("rounded-full px-3 py-1 text-sm", mobileTab === t ? "bg-accent" : "text-muted-foreground")}>{t === "chat" ? "Chat" : "Artifact"}</button>
            ))}
          </div>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto thin-scroll">
          <div className="mx-auto max-w-3xl space-y-8 px-4 py-6">
            {conv.messages.map((m) => <MessageRow key={m.id} m={m} onOpenArtifact={(id) => { setOpenArtifact(id); setMobileTab("artifact"); }} />)}
            <div ref={endRef} />
          </div>
        </div>
        <div className="mx-auto w-full max-w-3xl px-4 pb-4">
          <Composer onSubmit={submit} disabled={pending} placeholder={openArtifact ? "Demandez une modification…" : undefined} />
          <p className="mt-2 text-center text-xs text-muted-foreground">Mira peut se tromper. Vérifiez les informations importantes.</p>
        </div>
      </div>
      {openArtifact && (
        <div className={cn("min-w-0 flex-1 border-l lg:max-w-[50%]", mobileTab === "chat" ? "hidden lg:block" : "block")}>
          {mobileTab === "artifact" && (
            <div className="flex justify-center gap-1 pb-2 lg:hidden">
              {(["chat", "artifact"] as const).map((t) => (
                <button key={t} onClick={() => setMobileTab(t)} className={cn("rounded-full px-3 py-1 text-sm", mobileTab === t ? "bg-accent" : "text-muted-foreground")}>{t === "chat" ? "Chat" : "Artifact"}</button>
              ))}
            </div>
          )}
          <ArtifactPanel id={openArtifact} onClose={() => { setOpenArtifact(null); setMobileTab("chat"); }} />
        </div>
      )}
    </div>
  );
}
