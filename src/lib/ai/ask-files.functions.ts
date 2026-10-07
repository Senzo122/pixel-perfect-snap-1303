import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({
  question: z.string().trim().min(1).max(4000),
  files: z
    .array(z.object({ name: z.string().max(300), mimeType: z.string().max(200), base64: z.string().optional(), text: z.string().optional() }))
    .min(1)
    .max(10),
});

export const askFiles = createServerFn({ method: "POST" })
  .inputValidator((d) => schema.parse(d))
  .handler(async ({ data }) => {
    const { answerFromFiles, AskError } = await import("./ask-files.server");
    try {
      return { ok: true as const, answer: await answerFromFiles(data.question, data.files) };
    } catch (e) {
      if (e instanceof AskError) return { ok: false as const, status: e.status, error: e.message };
      console.error(e);
      return { ok: false as const, status: 500, error: "Une erreur est survenue." };
    }
  });
