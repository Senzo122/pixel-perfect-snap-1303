/** Simulated automatic moderator. Replace with a real classifier later. */
export type ModerationVerdict = "normal" | "watch" | "flagged";

const FLAG = [/\b(bombe|explosif|arme artisanale|tuer quelqu)/i, /\b(pirater le compte|voler des donn)/i];
const WATCH = [/\b(hack|arnaque|insulte|haine|drogue)/i];

export function moderate(text: string): { verdict: ModerationVerdict; risk: number; reason?: string } {
  if (FLAG.some((r) => r.test(text))) return { verdict: "flagged", risk: 0.9, reason: "Contenu potentiellement dangereux" };
  if (WATCH.some((r) => r.test(text))) return { verdict: "watch", risk: 0.5, reason: "Sujet sensible" };
  return { verdict: "normal", risk: 0.02 };
}
