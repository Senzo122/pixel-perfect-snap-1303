import { createOpenAI } from "@ai-sdk/openai";
import { streamText, type ModelMessage, type UserContent } from "ai";
import { createLovableAiGatewayRunIdFetch } from "./run-id.server";

export interface AskFile { name: string; mimeType: string; base64?: string | undefined; text?: string | undefined }

const MODEL = "openai/gpt-6-astra";
const BASE_URL = "https://ai.gateway.lovable.dev/v1";

export async function answerFromFiles(question: string, files: AskFile[]) {
  const apiKey = process.env['LOVABLE_API_KEY'];
  if (!apiKey) throw new AskError(401, "La clé AI n’est pas configurée.");

  const content: UserContent = [{ type: "text", text: `Question : ${question}` }];
  for (const f of files) {
    if (f.mimeType.startsWith("image/") && f.base64) {
      content.push({ type: "image", image: `data:${f.mimeType};base64,${f.base64}` });
    } else if (f.mimeType === "application/pdf" && f.base64) {
      content.push({ type: "file", filename: f.name, data: f.base64, mediaType: "application/pdf" });
    } else if (f.text?.trim()) {
      content.push({ type: "text", text: `--- Fichier : ${f.name} ---\n${f.text.slice(0, 200_000)}` });
    }
  }
  const messages: ModelMessage[] = [{ role: "user", content }];

  const runIdFetch = createLovableAiGatewayRunIdFetch();
  const provider = createOpenAI({
    baseURL: BASE_URL,
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runIdFetch.fetch,
  });

  let failure: unknown;
  const result = streamText({
    model: provider.responses(MODEL),
    system:
      "Tu es Mira. Réponds en français, uniquement à partir des fichiers fournis. Cite le nom du fichier concerné. Si l’information n’y figure pas, dis-le clairement.",
    messages,
    maxRetries: 0,
    onError: ({ error }) => { failure = error; },
    providerOptions: {
      openai: {
        forceReasoning: true,
        reasoningEffort: "medium",
        reasoningSummary: "auto",
        store: false,
        include: ["reasoning.encrypted_content"],
      },
    },
  });

  let text = "";
  try {
    text = await result.text;
  } catch (e) {
    failure = failure ?? e;
  }
  if (failure) throw toAskError(failure);
  if (!text.trim()) throw new AskError(422, "Le modèle n’a pas pu répondre à cette demande.");
  return text;
}

export class AskError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

function toAskError(e: unknown): AskError {
  const status = (e as { statusCode?: number })?.statusCode ?? 500;
  const messages: Record<number, string> = {
    400: "Requête invalide (fichier trop volumineux ou format non pris en charge).",
    401: "Configuration AI invalide.",
    402: "Crédits AI épuisés. Ajoutez des crédits dans les paramètres de facturation de l’espace de travail.",
    403: "Accès au modèle refusé pour cet espace de travail.",
    429: "Trop de demandes. Réessayez dans un instant.",
  };
  return new AskError(status, messages[status] ?? "Le service AI est momentanément indisponible.");
}
