import type { PlanDef, PlanId, TaskType } from "./config";
import type { ModerationVerdict } from "./moderation";

export type Role = "user" | "admin";
export type ArtifactKind = "code" | "web";

export interface User { id: string; name: string; email: string; role: Role; provider: string; plan: PlanId; status: "active" | "suspended"; createdAt: number; lastActive: number }
export interface Attachment { id: string; name: string; size: number }
export interface Message {
  id: string; role: "user" | "assistant"; content: string; createdAt: number;
  files?: Attachment[] | undefined; image?: string | undefined; video?: boolean | undefined; artifactId?: string | undefined;
  modelId?: string | undefined; task?: TaskType | undefined; pending?: boolean | undefined; moderation?: ModerationVerdict | undefined;
}
export interface Conversation { id: string; title: string; pinned: boolean; projectId?: string | undefined; createdAt: number; updatedAt: number; messages: Message[] }
export interface Project { id: string; name: string; context: string; createdAt: number }
export interface Artifact { id: string; conversationId: string; kind: ArtifactKind; title: string; language: string; versions: string[]; createdAt: number }
export interface FileItem { id: string; name: string; size: number; conversationId?: string | undefined; projectId?: string | undefined; createdAt: number }
export interface UsageEntry { id: string; ts: number; feature: string; modelId?: string | undefined; cost: number }
export interface GiftCode { code: string; plan: Exclude<PlanId, "free">; days: number; expiresAt: number; usedBy?: string | undefined; usedAt?: number }
export interface Offer { id: string; name: string; percent: number; hours: number; plan: Exclude<PlanId, "free">; expiresAt: number; active: boolean }
export interface AutoOfferConfig { enabled: boolean; afterMessages: number; percent: number; hours: number }
export interface ModerationFlag { id: string; userId: string; conversationId: string; excerpt: string; risk: number; reason: string; status: "open" | "reviewing" | "resolved"; action: string; createdAt: number }
export interface AdminLog { id: string; ts: number; adminId: string; action: string; target: string }

export interface MiraState {
  sessionUserId: string | null;
  users: User[];
  theme: "dark" | "light";
  manualMode: boolean;
  credits: { balance: number; lastRefill: number };
  usage: UsageEntry[];
  conversations: Conversation[];
  projects: Project[];
  artifacts: Artifact[];
  files: FileItem[];
  giftCodes: GiftCode[];
  offers: Offer[];
  autoOffer: AutoOfferConfig;
  shownOfferUntil: number;
  moderation: ModerationFlag[];
  adminLogs: AdminLog[];
  plans: Record<PlanId, PlanDef>;
  messagesSent: number;
}
