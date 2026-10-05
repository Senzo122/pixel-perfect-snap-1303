import { createFileRoute } from "@tanstack/react-router";
import { ChatView } from "@/components/mira/ChatView";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nouveau chat — Mira" },
      { name: "description", content: "Démarrez une conversation avec Mira, l’IA qui choisit le bon moteur pour chaque demande." },
      { property: "og:title", content: "Nouveau chat — Mira" },
      { property: "og:description", content: "Démarrez une conversation avec Mira, l’IA qui choisit le bon moteur pour chaque demande." },
    ],
  }),
  component: () => <ChatView />,
});
