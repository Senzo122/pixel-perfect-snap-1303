import { useRef, useState } from "react";
import { ArrowUp, FileText, Files, ImageIcon, Paperclip, Plus, Video, X } from "lucide-react";
import { toast } from "sonner";
import type { Attachment } from "@/lib/mira/types";
import { useMira } from "@/lib/mira/store";
import { ModelPicker } from "./ModelPicker";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface ComposerSubmit { text: string; files: Attachment[]; modelId: string | null; forceTask?: "image" | undefined }

export function Composer({ onSubmit, disabled, autoFocus, placeholder = "Demandez n’importe quoi à Mira" }: {
  onSubmit: (v: ComposerSubmit) => void; disabled?: boolean | undefined; autoFocus?: boolean | undefined; placeholder?: string | undefined;
}) {
  const manual = useMira((s) => s.manualMode);
  const [text, setText] = useState("");
  const [files, setFiles] = useState<Attachment[]>([]);
  const [modelId, setModelId] = useState<string | null>(null);
  const [imageMode, setImageMode] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const pick = (multiple: boolean) => {
    if (!fileRef.current) return;
    fileRef.current.multiple = multiple;
    fileRef.current.click();
  };

  const submit = () => {
    if (disabled || (!text.trim() && !files.length)) return;
    onSubmit({ text: text.trim(), files, modelId: manual ? modelId : null, forceTask: imageMode ? "image" : undefined });
    setText(""); setFiles([]); setImageMode(false);
    if (taRef.current) taRef.current.style.height = "auto";
  };

  return (
    <div className="rounded-3xl border bg-card shadow-[0_1px_0_0_var(--color-border)] transition-colors focus-within:border-ring/50">
      {(files.length > 0 || imageMode) && (
        <div className="flex flex-wrap gap-2 px-4 pt-3">
          {imageMode && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs">
              <ImageIcon className="size-3.5" /> Image
              <button onClick={() => setImageMode(false)} aria-label="Retirer"><X className="size-3" /></button>
            </span>
          )}
          {files.map((f) => (
            <span key={f.id} className="inline-flex items-center gap-1.5 rounded-lg border bg-background px-2.5 py-1 text-xs">
              <FileText className="size-3.5 text-muted-foreground" />
              <span className="max-w-[10rem] truncate">{f.name}</span>
              <button onClick={() => setFiles((x) => x.filter((y) => y.id !== f.id))} aria-label="Retirer"><X className="size-3" /></button>
            </span>
          ))}
        </div>
      )}
      <textarea
        ref={taRef}
        autoFocus={autoFocus}
        rows={1}
        value={text}
        placeholder={imageMode ? "Décrivez l’image à générer" : placeholder}
        onChange={(e) => {
          setText(e.target.value);
          e.target.style.height = "auto";
          e.target.style.height = `${Math.min(e.target.scrollHeight, 240)}px`;
        }}
        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
        className="block w-full resize-none bg-transparent px-5 pt-4 pb-2 text-[15px] leading-relaxed placeholder:text-muted-foreground focus:outline-none"
      />
      <div className="flex items-center gap-1 px-2.5 pb-2.5">
        <input
          ref={fileRef} type="file" hidden
          onChange={(e) => {
            const list = Array.from(e.target.files ?? []).map((f) => ({ id: crypto.randomUUID(), name: f.name, size: f.size }));
            setFiles((x) => [...x, ...list]);
            e.target.value = "";
          }}
        />
        <DropdownMenu>
          <DropdownMenuTrigger className="grid size-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none" aria-label="Ajouter">
            <Plus className="size-[18px]" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem onClick={() => pick(false)}><Paperclip className="size-4" /> Ajouter un fichier</DropdownMenuItem>
            <DropdownMenuItem onClick={() => pick(true)}><Files className="size-4" /> Ajouter plusieurs fichiers</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => { setImageMode(true); taRef.current?.focus(); }}><ImageIcon className="size-4" /> Générer une image</DropdownMenuItem>
            <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Bientôt</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => toast("La vidéo s’active automatiquement en mode Auto (plan Plus).")}><Video className="size-4" /> Générer une vidéo</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {manual ? (
          <ModelPicker value={modelId} onChange={setModelId} />
        ) : (
          <span className="px-2 text-sm text-muted-foreground">Auto</span>
        )}
        <button
          onClick={submit}
          disabled={disabled || (!text.trim() && !files.length)}
          className="ml-auto grid size-8 place-items-center rounded-full bg-primary text-primary-foreground transition-opacity disabled:opacity-25"
          aria-label="Envoyer"
        >
          <ArrowUp className="size-4" />
        </button>
      </div>
    </div>
  );
}
