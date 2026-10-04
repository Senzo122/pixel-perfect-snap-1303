/**
 * Simulated data layer (prototype). Persists to localStorage and mirrors the
 * future backend entities. Swap these actions for server calls later.
 */
import { useSyncExternalStore } from "react";
import { CREDIT_COSTS, DEFAULT_PLANS, MODELS, type PlanId } from "./config";
import { classify, isAllowed, pickModel, taskForModel } from "./ai/router";
import { getProvider } from "./ai/provider";
import { moderate } from "./moderation";
import type { Attachment, Conversation, MiraState, User } from "./types";

const KEY = "mira-prototype-v1";
const uid = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2));
const now = () => Date.now();
const HOUR = 3600_000;
const DAY = 24 * HOUR;

function seedUsers(): User[] {
  const names = ["Léa Martin", "Hugo Bernard", "Chloé Petit", "Nathan Roux", "Inès Moreau", "Tom Garnier", "Sarah Lambert", "Yanis Faure"];
  const plans: PlanId[] = ["free", "plus", "free", "pro", "free", "plus", "free", "free"];
  return names.map((n, i) => ({
    id: `seed-${i}`, name: n, email: `${(n.split(" ")[0] ?? n).toLowerCase()}@exemple.fr`, role: "user", provider: ["google", "apple", "email", "discord"][i % 4] ?? "email",
    plan: plans[i] ?? "free", status: i === 6 ? "suspended" : "active", createdAt: now() - (i + 2) * 5 * DAY, lastActive: now() - i * 7 * HOUR,
  }));
}

function initial(): MiraState {
  const t = now();
  return {
    sessionUserId: null, users: seedUsers(), theme: "dark", manualMode: false,
    credits: { balance: DEFAULT_PLANS.free.creditsPerHour, lastRefill: t }, usage: [],
    conversations: [], projects: [], artifacts: [], files: [],
    giftCodes: [
      { code: "MIRA-PLUS-2026", plan: "plus", days: 30, expiresAt: t + 90 * DAY },
      { code: "MIRA-PRO0-DEMO", plan: "pro", days: 7, expiresAt: t + 30 * DAY },
      { code: "MIRA-OLD0-CODE", plan: "plus", days: 30, expiresAt: t - DAY },
    ],
    offers: [], autoOffer: { enabled: true, afterMessages: 15, percent: 20, hours: 24 }, shownOfferUntil: 0,
    moderation: [
      { id: uid(), userId: "seed-1", conversationId: "—", excerpt: "comment pirater le compte de…", risk: 0.88, reason: "Contenu potentiellement dangereux", status: "open", action: "—", createdAt: t - 3 * HOUR },
      { id: uid(), userId: "seed-4", conversationId: "—", excerpt: "message contenant une insulte", risk: 0.45, reason: "Sujet sensible", status: "resolved", action: "Avertissement", createdAt: t - 2 * DAY },
    ],
    adminLogs: [], plans: DEFAULT_PLANS, messagesSent: 0,
  };
}

let state: MiraState = initial();
let hydrated = false;
const listeners = new Set<() => void>();

function load() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) state = { ...initial(), ...JSON.parse(raw) };
  } catch { /* ignore */ }
}

function set(fn: (s: MiraState) => Partial<MiraState>) {
  state = { ...state, ...fn(state) };
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* quota */ }
  listeners.forEach((l) => l());
}

const subscribe = (l: () => void) => { load(); listeners.add(l); return () => listeners.delete(l); };
const serverState = initial();

export function useMira<T>(selector: (s: MiraState) => T): T {
  return useSyncExternalStore(subscribe, () => { load(); return selector(state); }, () => selector(serverState));
}
export const getState = () => state;

// ---------- derived ----------
export const currentUser = (s: MiraState) => s.users.find((u) => u.id === s.sessionUserId) ?? null;
export const currentPlan = (s: MiraState): PlanId => currentUser(s)?.plan ?? "free";

function refillIfNeeded() {
  const s = state;
  const plan = s.plans[currentPlan(s)];
  if (now() - s.credits.lastRefill >= HOUR) set(() => ({ credits: { balance: plan.creditsPerHour, lastRefill: now() } }));
}

function log(action: string, target: string) {
  const admin = currentUser(state);
  set((s) => ({ adminLogs: [{ id: uid(), ts: now(), adminId: admin?.id ?? "?", action, target }, ...s.adminLogs] }));
}

// ---------- auth (simulated) ----------
export function signIn(provider: string, email: string, name?: string) {
  const existing = state.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    if (existing.status === "suspended") throw new Error("Ce compte est suspendu.");
    set(() => ({ sessionUserId: existing.id }));
    return;
  }
  // Simulated backend rule: the first account created on this instance owns it (admin).
  const isFirstReal = !state.users.some((u) => !u.id.startsWith("seed-"));
  const user: User = { id: uid(), name: name || email.split("@")[0] || email, email, role: isFirstReal ? "admin" : "user", provider, plan: "free", status: "active", createdAt: now(), lastActive: now() };
  set((s) => ({ users: [...s.users, user], sessionUserId: user.id, credits: { balance: s.plans.free.creditsPerHour, lastRefill: now() } }));
}
export const signOut = () => set(() => ({ sessionUserId: null }));
export const updateProfile = (name: string) => set((s) => ({ users: s.users.map((u) => (u.id === s.sessionUserId ? { ...u, name } : u)) }));

// ---------- settings ----------
export const setTheme = (theme: "dark" | "light") => set(() => ({ theme }));
export const setManualMode = (manualMode: boolean) => set(() => ({ manualMode }));
export function setPlan(plan: PlanId) {
  set((s) => ({ users: s.users.map((u) => (u.id === s.sessionUserId ? { ...u, plan } : u)), credits: { balance: s.plans[plan].creditsPerHour, lastRefill: now() } }));
}
export function redeemCode(raw: string): { ok: boolean; message: string } {
  const code = raw.trim().toUpperCase();
  const gc = state.giftCodes.find((g) => g.code === code);
  if (!gc) return { ok: false, message: "Code introuvable." };
  if (gc.usedBy) return { ok: false, message: "Ce code a déjà été utilisé." };
  if (gc.expiresAt < now()) return { ok: false, message: "Ce code a expiré." };
  const me = currentUser(state);
  set((s) => ({ giftCodes: s.giftCodes.map((g) => (g.code === code ? { ...g, usedBy: me?.id, usedAt: now() } : g)) }));
  setPlan(gc.plan);
  return { ok: true, message: `Plan ${state.plans[gc.plan].name} activé pour ${gc.days} jours.` };
}

// ---------- conversations ----------
export function createConversation(projectId?: string): string {
  const c: Conversation = { id: uid(), title: "Nouveau chat", pinned: false, projectId, createdAt: now(), updatedAt: now(), messages: [] };
  set((s) => ({ conversations: [c, ...s.conversations] }));
  return c.id;
}
const patchConv = (id: string, fn: (c: Conversation) => Conversation) =>
  set((s) => ({ conversations: s.conversations.map((c) => (c.id === id ? fn(c) : c)) }));
export const togglePin = (id: string) => patchConv(id, (c) => ({ ...c, pinned: !c.pinned }));
export const renameConversation = (id: string, title: string) => patchConv(id, (c) => ({ ...c, title }));
export const deleteConversation = (id: string) => set((s) => ({ conversations: s.conversations.filter((c) => c.id !== id), artifacts: s.artifacts.filter((a) => a.conversationId !== id) }));

export interface SendOptions { modelId?: string | null; files?: Attachment[]; forceTask?: "image" }

export async function sendMessage(convId: string, text: string, opts: SendOptions = {}): Promise<{ error?: string }> {
  refillIfNeeded();
  const s = state;
  const plan = currentPlan(s);
  const files = opts.files ?? [];
  let model = opts.modelId ? MODELS.find((m) => m.id === opts.modelId) ?? null : null;
  let task = opts.forceTask ?? (model ? taskForModel(model, text, files.length > 0) : classify(text, files.length > 0));
  const conv = s.conversations.find((c) => c.id === convId);
  const lastArtifact = [...s.artifacts].reverse().find((a) => a.conversationId === convId);
  if (lastArtifact && task === "chat") task = "artifact";
  if (!model) model = pickModel(task, plan);
  if (!model || !isAllowed(model, plan)) {
    return { error: task === "video" ? "La génération vidéo est disponible à partir du plan Plus." : "Ce modèle n’est pas inclus dans votre plan." };
  }
  const cost = (task === "artifact" && !lastArtifact ? CREDIT_COSTS.artifact : 0) + CREDIT_COSTS[model.cost];
  if (s.credits.balance < cost) return { error: "Vous avez atteint votre limite pour le moment. Vos crédits se rechargent bientôt." };

  const mod = moderate(text);
  const userMsg = { id: uid(), role: "user" as const, content: text, files, createdAt: now(), moderation: mod.verdict };
  const pendingId = uid();
  patchConv(convId, (c) => ({
    ...c,
    title: c.messages.length === 0 ? (text || files[0]?.name || "Nouveau chat").slice(0, 48) : c.title,
    updatedAt: now(),
    messages: [...c.messages, userMsg, { id: pendingId, role: "assistant", content: "", createdAt: now(), pending: true, modelId: model.id, task }],
  }));
  set((st) => ({
    credits: { ...st.credits, balance: st.credits.balance - cost },
    usage: [{ id: uid(), ts: now(), feature: featureLabel(task), modelId: model!.id, cost }, ...st.usage].slice(0, 300),
    files: [...files.map((f) => ({ ...f, conversationId: convId, projectId: conv?.projectId, createdAt: now() })), ...st.files],
    messagesSent: st.messagesSent + 1,
    moderation: mod.verdict === "normal" ? st.moderation : [{ id: uid(), userId: st.sessionUserId ?? "?", conversationId: convId, excerpt: text.slice(0, 80), risk: mod.risk, reason: mod.reason ?? "", status: "open", action: "—", createdAt: now() }, ...st.moderation],
  }));
  if (mod.verdict === "flagged") {
    patchConv(convId, (c) => ({ ...c, messages: c.messages.map((m) => (m.id === pendingId ? { ...m, pending: false, content: "Je ne peux pas aider avec cette demande. Si vous pensez qu’il s’agit d’une erreur, reformulez votre message." } : m)) }));
    return {};
  }

  const result = await getProvider(model.provider).generate({
    model, task, prompt: text, files: files.map((f) => f.name),
    artifact: lastArtifact && task === "artifact" ? { kind: lastArtifact.kind, title: lastArtifact.title, content: lastArtifact.versions.at(-1)! } : undefined,
  });

  let artifactId: string | undefined;
  if (result.artifact) {
    const r = result.artifact;
    if (r.isEdit && lastArtifact) {
      artifactId = lastArtifact.id;
      set((st) => ({ artifacts: st.artifacts.map((a) => (a.id === lastArtifact.id ? { ...a, versions: [...a.versions, r.content] } : a)) }));
    } else {
      artifactId = uid();
      set((st) => ({ artifacts: [...st.artifacts, { id: artifactId!, conversationId: convId, kind: r.kind, title: r.title, language: r.language, versions: [r.content], createdAt: now() }] }));
    }
  }
  patchConv(convId, (c) => ({ ...c, updatedAt: now(), messages: c.messages.map((m) => (m.id === pendingId ? { ...m, pending: false, content: result.text, image: result.image, video: result.video, artifactId } : m)) }));
  return {};
}

export function featureLabel(task: string) {
  return ({ chat: "Chat", reasoning: "Raisonnement", code: "Code", image: "Images", video: "Vidéo", web: "Recherche web", artifact: "Artifacts" } as Record<string, string>)[task] ?? task;
}

export const editArtifact = (id: string, content: string) => set((s) => ({ artifacts: s.artifacts.map((a) => (a.id === id ? { ...a, versions: [...a.versions, content] } : a)) }));

// ---------- projects ----------
export function createProject(name: string): string | null {
  const s = state;
  if (s.projects.length >= s.plans[currentPlan(s)].maxProjects) return null;
  const p = { id: uid(), name, context: "", createdAt: now() };
  set((st) => ({ projects: [p, ...st.projects] }));
  return p.id;
}
export const renameProject = (id: string, name: string) => set((s) => ({ projects: s.projects.map((p) => (p.id === id ? { ...p, name } : p)) }));
export const setProjectContext = (id: string, context: string) => set((s) => ({ projects: s.projects.map((p) => (p.id === id ? { ...p, context } : p)) }));
export const deleteProject = (id: string) => set((s) => ({ projects: s.projects.filter((p) => p.id !== id), conversations: s.conversations.map((c) => (c.projectId === id ? { ...c, projectId: undefined } : c)) }));
export const addProjectFile = (projectId: string, f: Attachment) => set((s) => ({ files: [{ ...f, projectId, createdAt: now() }, ...s.files] }));

// ---------- offers ----------
export const dismissOffer = () => set(() => ({ shownOfferUntil: -1 }));
export function maybeTriggerAutoOffer() {
  const s = state;
  if (!s.autoOffer.enabled || s.shownOfferUntil !== 0 || currentPlan(s) !== "free") return;
  if (s.messagesSent >= s.autoOffer.afterMessages) set((st) => ({ shownOfferUntil: now() + st.autoOffer.hours * HOUR }));
}
export const demoTriggerOffer = () => set((st) => ({ shownOfferUntil: now() + st.autoOffer.hours * HOUR }));

// ---------- admin ----------
export function adminSetUserStatus(id: string, status: "active" | "suspended") {
  set((s) => ({ users: s.users.map((u) => (u.id === id ? { ...u, status } : u)) }));
  log(status === "suspended" ? "Suspension du compte" : "Réactivation du compte", id);
}
export function adminUpdatePlan(id: PlanId, patch: { creditsPerHour?: number; maxProjects?: number; priceMonthly?: number; fairUse?: boolean }) {
  set((s) => ({ plans: { ...s.plans, [id]: { ...s.plans[id], ...patch } } }));
  log("Modification du plan", id);
}
export function adminCreateOffer(o: { name: string; percent: number; hours: number; plan: "plus" | "pro"; expiresAt: number }) {
  set((s) => ({ offers: [{ id: uid(), active: true, ...o }, ...s.offers] }));
  log("Création d’une offre", o.name);
}
export const adminToggleOffer = (id: string) => set((s) => ({ offers: s.offers.map((o) => (o.id === id ? { ...o, active: !o.active } : o)) }));
export const adminSetAutoOffer = (patch: Partial<MiraState["autoOffer"]>) => { set((s) => ({ autoOffer: { ...s.autoOffer, ...patch } })); log("Offre automatique modifiée", "config"); };
export function adminGenerateCodes(plan: "plus" | "pro", days: number, count: number, expiresInDays: number) {
  const seg = () => Math.random().toString(36).slice(2, 6).toUpperCase().padEnd(4, "X");
  const codes = Array.from({ length: count }, () => ({ code: `MIRA-${seg()}-${seg()}`, plan, days, expiresAt: now() + expiresInDays * DAY }));
  set((s) => ({ giftCodes: [...codes, ...s.giftCodes] }));
  log(`Génération de ${count} code(s) ${plan}`, `${days} jours`);
}
export function adminUpdateFlag(id: string, status: "open" | "reviewing" | "resolved", action?: string) {
  set((s) => ({ moderation: s.moderation.map((f) => (f.id === id ? { ...f, status, action: action ?? f.action } : f)) }));
  log(`Signalement → ${status}${action ? ` (${action})` : ""}`, id);
}
/** Access to a conversation is only granted through a flag, and always logged. */
export function adminOpenFlaggedConversation(flagId: string) {
  const f = state.moderation.find((x) => x.id === flagId);
  if (!f) return null;
  log("Accès à une conversation signalée", f.conversationId);
  return state.conversations.find((c) => c.id === f.conversationId) ?? null;
}
