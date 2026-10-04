import { Check, ChevronDown, Lock, Wand2 } from "lucide-react";
import { MODELS, PROVIDERS, type ProviderId } from "@/lib/mira/config";
import { isAllowed } from "@/lib/mira/ai/router";
import { currentPlan, getState, useMira } from "@/lib/mira/store";
import { ProviderLogo } from "./ProviderLogo";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ModelPicker({ value, onChange }: { value: string | null; onChange: (id: string | null) => void }) {
  const plan = useMira(currentPlan);
  const plans = useMira((s) => s.plans);
  const selected = MODELS.find((m) => m.id === value);
  const groups = (["openai", "anthropic", "google", "mira"] as ProviderId[]).map((p) => ({ p, models: MODELS.filter((m) => m.provider === p) }));

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none">
        {selected ? <ProviderLogo provider={selected.provider} /> : <Wand2 className="size-3.5" />}
        <span className="max-w-[9rem] truncate">{selected ? selected.name : "Auto"}</span>
        <ChevronDown className="size-3.5 opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64 max-h-[60vh] overflow-y-auto thin-scroll">
        <DropdownMenuItem onClick={() => onChange(null)} className="gap-2">
          <Wand2 className="size-4" />
          <div className="flex-1">
            <div>Auto</div>
            <div className="text-xs text-muted-foreground">Mira choisit le meilleur moteur</div>
          </div>
          {!value && <Check className="size-4" />}
        </DropdownMenuItem>
        {groups.map(({ p, models }) => (
          <div key={p}>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">{PROVIDERS[p].name}</DropdownMenuLabel>
            {models.map((m) => {
              const ok = isAllowed(m, plan);
              return (
                <DropdownMenuItem key={m.id} disabled={!ok} onClick={() => ok && onChange(m.id)} className="gap-2">
                  <ProviderLogo provider={m.provider} />
                  <span className="flex-1">{m.name}</span>
                  {!ok ? (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground"><Lock className="size-3" />{plans[m.minPlan].name}</span>
                  ) : value === m.id ? <Check className="size-4" /> : null}
                </DropdownMenuItem>
              );
            })}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export const modelName = (id?: string) => MODELS.find((m) => m.id === id);
export const _unused = getState;
