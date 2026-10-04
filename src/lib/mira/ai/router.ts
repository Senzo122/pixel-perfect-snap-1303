import { MODELS, planRank, type ModelDef, type ModelKind, type PlanId, type TaskType } from "../config";

/** Simulated Auto routing. Replace `classify` with a real classifier later. */
export function classify(text: string, hasFiles: boolean): TaskType {
  const t = text.toLowerCase();
  if (/(vid[ée]o|clip|anime|animation)/.test(t)) return "video";
  if (/(image|dessine|illustr|photo|logo|g[ée]n[èe]re une? (image|photo))/.test(t)) return "image";
  if (/(landing|page web|site|html|interface|composant|app )/.test(t)) return "artifact";
  if (/(code|fonction|script|bug|python|javascript|typescript|sql|regex|api)/.test(t)) return "code";
  if (/(recherche|actu|news|aujourd|derni[èe]res?|prix de|m[ée]t[ée]o)/.test(t)) return "web";
  if (hasFiles || t.length > 280 || /(pourquoi|d[ée]montre|analyse|compare|raisonne|strat[ée]gie)/.test(t)) return "reasoning";
  return "chat";
}

const kindFor = (task: TaskType): ModelKind => (task === "artifact" ? "code" : task);

export const isAllowed = (m: ModelDef, plan: PlanId) => planRank(plan) >= planRank(m.minPlan);

export function pickModel(task: TaskType, plan: PlanId): ModelDef | null {
  const kind = kindFor(task);
  const candidates = MODELS.filter((m) => m.kinds.includes(kind) && isAllowed(m, plan));
  if (!candidates.length) return null;
  // Simple tasks prefer cheaper models; heavier tasks prefer the best allowed.
  if (task === "chat") return [...candidates].sort((a, b) => a.quality - b.quality)[0];
  return [...candidates].sort((a, b) => b.quality - a.quality)[0];
}

export const taskForModel = (m: ModelDef, text: string, hasFiles: boolean): TaskType => {
  const auto = classify(text, hasFiles);
  if (m.kinds.includes(kindFor(auto))) return auto;
  return m.kinds[0] === "code" ? "code" : (m.kinds[0] as TaskType);
};
