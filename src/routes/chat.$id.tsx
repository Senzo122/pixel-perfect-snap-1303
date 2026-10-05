import { createFileRoute } from "@tanstack/react-router";
import { ChatView } from "@/components/mira/ChatView";

export const Route = createFileRoute("/chat/$id")({
  head: () => ({ meta: [{ title: "Conversation — Mira" }, { name: "robots", content: "noindex" }] }),
  component: ChatPage,
});

function ChatPage() {
  const { id } = Route.useParams();
  return <ChatView conversationId={id} />;
}
