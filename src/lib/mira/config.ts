/**
 * Central, editable configuration for the Mira prototype.
 * Model names, plans, limits and credit costs live ONLY here (and can be
 * overridden at runtime from the Admin Panel). Nothing else hardcodes them.
 */

export type PlanId = "free" | "plus" | "pro";
export type ProviderId = "openai" | "anthropic" | "google" | "mira";
export type ModelKind = "chat" | "reasoning" | "code" | "image" | "video" | "web";
export type TaskType = "chat" | "reasoning" | "code" | "image" | "video" | "web" | "artifact";

export const PLAN_ORDER: PlanId[] = ["free", "plus", "pro"];
export const planRank = (p: PlanId) => PLAN_ORDER.indexOf(p);

export interface ProviderDef {
  id: ProviderId;
  name: string;
}

export const PROVIDERS: Record<ProviderId, ProviderDef> = {
  openai: { id: "openai", name: "OpenAI" },
  anthropic: { id: "anthropic", name: "Anthropic" },
  google: { id: "google", name: "Google" },
  mira: { id: "mira", name: "Mira" },
};

export interface ModelDef {
  id: string;
  provider: ProviderId;
  /** Exact display name — placeholder until real models are chosen. */
  name: string;
  kinds: ModelKind[];
  minPlan: PlanId;
  /** Credit cost key, see CREDIT_COSTS. */
  cost: keyof typeof CREDIT_COSTS;
  /** Higher = preferred by Auto when the plan allows it. */
  quality: number;
}

export const MODELS: ModelDef[] = [
  { id: "openai-standard", provider: "openai", name: "GPT-5 mini", kinds: ["chat", "code"], minPlan: "free", cost: "standard", quality: 2 },
  { id: "openai-advanced", provider: "openai", name: "GPT-5", kinds: ["chat", "reasoning", "code"], minPlan: "plus", cost: "complex", quality: 5 },
  { id: "openai-pro", provider: "openai", name: "GPT-5 Pro", kinds: ["reasoning", "code"], minPlan: "pro", cost: "premium", quality: 8 },
  { id: "google-standard", provider: "google", name: "Gemini 2.5 Flash", kinds: ["chat", "reasoning"], minPlan: "free", cost: "standard", quality: 3 },
  { id: "google-advanced", provider: "google", name: "Gemini 2.5 Pro", kinds: ["chat", "reasoning", "code"], minPlan: "plus", cost: "complex", quality: 6 },
  { id: "anthropic-standard", provider: "anthropic", name: "Claude Sonnet 4.5", kinds: ["chat", "code", "reasoning"], minPlan: "plus", cost: "complex", quality: 7 },
  { id: "anthropic-advanced", provider: "anthropic", name: "Claude Opus 4.1", kinds: ["code", "reasoning"], minPlan: "pro", cost: "premium", quality: 9 },
  { id: "google-image", provider: "google", name: "Imagen 4 Fast", kinds: ["image"], minPlan: "free", cost: "image", quality: 2 },
  { id: "openai-image", provider: "openai", name: "GPT Image 1", kinds: ["image"], minPlan: "plus", cost: "image", quality: 6 },
  { id: "google-video", provider: "google", name: "Veo 3 Fast", kinds: ["video"], minPlan: "plus", cost: "video", quality: 4 },
  { id: "google-video-pro", provider: "google", name: "Veo 3", kinds: ["video"], minPlan: "pro", cost: "video", quality: 8 },
  { id: "mira-search", provider: "mira", name: "Mira Search", kinds: ["web"], minPlan: "free", cost: "web", quality: 5 },
];

export const CREDIT_COSTS = {
  standard: 1,
  complex: 2,
  premium: 4,
  web: 1,
  image: 5,
  video: 12,
  artifact: 4,
} as const;

export type Level = "non" | "très limité" | "limité" | "basique" | "oui" | "élevé" | "très élevé" | "avancé" | "avancé/premium";

export interface PlanDef {
  id: PlanId;
  name: string;
  priceMonthly: number; // EUR, placeholder
  creditsPerHour: number;
  fairUse: boolean;
  features: Record<string, Level>;
  maxProjects: number;
}

export const DEFAULT_PLANS: Record<PlanId, PlanDef> = {
  free: {
    id: "free", name: "Free", priceMonthly: 0, creditsPerHour: 20, fairUse: true, maxProjects: 2,
    features: { Chats: "oui", Auto: "très limité", "Modèles standards": "oui", "Modèles premium": "non", Claude: "non", "Génération d’images": "limité", "Génération vidéo": "non", "Recherche web": "très élevé", Fichiers: "limité", Artifacts: "basique", Code: "basique", Projets: "limité", Historique: "oui" },
  },
  plus: {
    id: "plus", name: "Plus", priceMonthly: 20, creditsPerHour: 150, fairUse: true, maxProjects: 50,
    features: { Chats: "oui", Auto: "élevé", "Modèles standards": "oui", "Modèles premium": "limité", Claude: "oui", "Génération d’images": "élevé", "Génération vidéo": "élevé", "Recherche web": "oui", Fichiers: "élevé", Artifacts: "avancé", Code: "avancé", Projets: "oui", Historique: "oui" },
  },
  pro: {
    id: "pro", name: "Pro", priceMonthly: 60, creditsPerHour: 600, fairUse: true, maxProjects: 500,
    features: { Chats: "oui", Auto: "très élevé", "Modèles standards": "oui", "Modèles premium": "oui", Claude: "oui", "Génération d’images": "très élevé", "Génération vidéo": "très élevé", "Recherche web": "très élevé", Fichiers: "très élevé", Artifacts: "avancé", Code: "avancé/premium", Projets: "très élevé", Historique: "oui" },
  },
};

export const SUGGESTIONS = [
  "Écris une landing page pour un café",
  "Génère une image d’un phare au crépuscule",
  "Explique la relativité simplement",
  "Recherche les dernières actus IA",
];
