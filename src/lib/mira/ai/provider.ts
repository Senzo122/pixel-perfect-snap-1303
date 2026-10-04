import type { ModelDef, ProviderId, TaskType } from "../config";
import type { ArtifactKind } from "../types";

/** Provider-agnostic contract. Swap the mock for real API clients later. */
export interface AIRequest {
  model: ModelDef;
  task: TaskType;
  prompt: string;
  files: string[];
  /** Current artifact content when the user is iterating on it. */
  artifact?: { kind: ArtifactKind | undefined; content: string; title: string };
}

export interface AIResult {
  text: string;
  image?: string | undefined;
  video?: boolean | undefined;
  artifact?: { kind: ArtifactKind | undefined; title: string; language: string; content: string; isEdit: boolean };
}

export interface AIProvider {
  id: ProviderId;
  generate(req: AIRequest): Promise<AIResult>;
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

function fakeImage(prompt: string) {
  let h = 0;
  for (const c of prompt) h = (h * 31 + c.charCodeAt(0)) % 360;
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='768' height='512'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='hsl(${h},45%,22%)'/><stop offset='1' stop-color='hsl(${(h + 60) % 360},55%,62%)'/></linearGradient><radialGradient id='s' cx='.7' cy='.35' r='.25'><stop offset='0' stop-color='hsl(${(h + 30) % 360},90%,85%)'/><stop offset='1' stop-color='transparent'/></radialGradient></defs><rect width='768' height='512' fill='url(#g)'/><rect width='768' height='512' fill='url(#s)'/><path d='M0 400 Q 200 320 384 380 T 768 360 V512 H0Z' fill='hsla(${h},40%,10%,.6)'/></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const LANDING = (title: string) => `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<title>${title}</title>
<style>
  body { margin:0; font-family: system-ui, sans-serif; background:#faf7f2; color:#1c1917; }
  header { padding: 24px 48px; display:flex; justify-content:space-between; }
  main { padding: 96px 48px; max-width: 720px; }
  h1 { font-size: 56px; line-height:1; margin:0 0 16px; }
  p { font-size: 18px; color:#57534e; }
</style>
</head>
<body>
  <header><strong>${title}</strong><span>Menu · Visite</span></header>
  <main>
    <h1>Le café du coin, en mieux.</h1>
    <p>Grains torréfiés sur place, pâtisseries du matin et un comptoir où l’on prend son temps.</p>
  </main>
</body>
</html>`;

const CODE_SAMPLE = `export function debounce<T extends (...args: any[]) => void>(fn: T, ms = 250) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

// Usage
const onResize = debounce(() => console.log(window.innerWidth), 200);
window.addEventListener("resize", onResize);`;

function editHtml(html: string, prompt: string) {
  const p = prompt.toLowerCase();
  const color = /rouge/.test(p) ? "#dc2626" : /vert/.test(p) ? "#16a34a" : /noir/.test(p) ? "#111" : "#2563eb";
  if (/bouton/.test(p)) {
    const btn = `    <button style="margin-top:24px;padding:14px 28px;border:0;border-radius:10px;background:${color};color:#fff;font-size:16px;cursor:pointer">Réserver une table</button>\n  </main>`;
    return html.replace("  </main>", btn);
  }
  if (/fond|background/.test(p)) return html.replace(/background:#[0-9a-f]+;/, `background:${color}10;`);
  if (/titre/.test(p)) return html.replace(/<h1>(.*?)<\/h1>/, "<h1>Bienvenue chez nous.</h1>");
  return html.replace("  </main>", `    <p><em>${prompt.replace(/</g, "&lt;")}</em></p>\n  </main>`);
}

/** Mock provider — the same for every vendor in the prototype. */
export class MockProvider implements AIProvider {
  constructor(public id: ProviderId) {}

  async generate(req: AIRequest): Promise<AIResult> {
    await wait(600 + Math.random() * 700);
    const { task, prompt, artifact } = req;

    if (artifact && task !== "image" && task !== "video") {
      if (artifact.kind === "web") {
        return { text: "C’est fait. J’ai mis à jour la page — jetez un œil à l’aperçu.", artifact: { kind: "web", title: artifact.title, language: "html", content: editHtml(artifact.content, prompt), isEdit: true } };
      }
      return { text: "J’ai ajusté le code selon votre demande.", artifact: { kind: "code", title: artifact.title, language: "typescript", content: `${artifact.content}\n\n// ${prompt}`, isEdit: true } };
    }

    switch (task) {
      case "image":
        return { text: "Voici une proposition. Je peux varier le cadrage, la lumière ou le style.", image: fakeImage(prompt) };
      case "video":
        return { text: "La vidéo est prête (simulation). Dans la version finale, elle s’affichera ici.", video: true };
      case "artifact":
        return { text: "J’ai préparé une première version de la page. Dites-moi ce que vous voulez changer.", artifact: { kind: "web", title: "Landing page", language: "html", content: LANDING("Café Lumen"), isEdit: false } };
      case "code":
        return { text: "Voici une implémentation simple et typée. Elle limite les appels répétés d’une fonction.", artifact: { kind: "code", title: "debounce.ts", language: "typescript", content: CODE_SAMPLE, isEdit: false } };
      case "web":
        return { text: `D’après mes recherches (simulées) sur « ${prompt} » :\n\n1. Plusieurs sources récentes convergent sur le sujet.\n2. Les avis divergent sur l’impact à long terme.\n3. Je peux approfondir un point précis si vous le souhaitez.\n\nSources : exemple.com · journal.example · blog.example` };
      case "reasoning":
        return { text: `Prenons cela étape par étape.\n\n**1. Le problème.** ${prompt.slice(0, 120)}${prompt.length > 120 ? "…" : ""}\n\n**2. Les hypothèses.** On distingue ce qui est connu de ce qui doit être vérifié.\n\n**3. La conclusion.** Une réponse argumentée apparaîtra ici une fois les vrais modèles connectés.${req.files.length ? `\n\nJ’ai pris en compte ${req.files.length} fichier(s) joint(s).` : ""}` };
      default:
        return { text: `Bonne question. ${prompt.endsWith("?") ? "Voici ce que je peux en dire :" : "Avec plaisir."} Ceci est une réponse simulée — dans la version finale, Mira répondra avec le moteur le plus adapté.` };
    }
  }
}

const registry: Record<ProviderId, AIProvider> = {
  openai: new MockProvider("openai"),
  anthropic: new MockProvider("anthropic"),
  google: new MockProvider("google"),
  mira: new MockProvider("mira"),
};

export const getProvider = (id: ProviderId) => registry[id];
