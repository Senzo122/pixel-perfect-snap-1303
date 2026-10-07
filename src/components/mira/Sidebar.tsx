import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { CalendarClock, FileSearch, FolderOpen, Library, MoreHorizontal, Pencil, Pin, PinOff, Plug, Settings, SquarePen, Trash2, User } from "lucide-react";
import type { ReactNode } from "react";
import { currentPlan, currentUser, deleteConversation, renameConversation, togglePin, useMira } from "@/lib/mira/store";
import type { Conversation } from "@/lib/mira/types";
import { MiraMark } from "./ProviderLogo";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const navItem = "flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground";
const active = { className: "bg-sidebar-accent text-sidebar-accent-foreground" };

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mt-5">
      <div className="px-2.5 pb-1.5 text-xs text-muted-foreground">{title}</div>
      {children}
    </div>
  );
}

function ChatRow({ c }: { c: Conversation }) {
  const path = useRouterState({ select: (r) => r.location.pathname });
  const nav = useNavigate();
  const isActive = path === `/chat/${c.id}`;
  return (
    <div className={cn("group flex items-center rounded-lg pr-1 hover:bg-sidebar-accent", isActive && "bg-sidebar-accent")}>
      <Link to="/chat/$id" params={{ id: c.id }} className="flex-1 truncate px-2.5 py-2 text-sm text-sidebar-foreground">{c.title}</Link>
      <DropdownMenu>
        <DropdownMenuTrigger className="grid size-6 place-items-center rounded text-muted-foreground opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100 focus-visible:opacity-100" aria-label="Options">
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={() => togglePin(c.id)}>{c.pinned ? <PinOff className="size-4" /> : <Pin className="size-4" />}{c.pinned ? "Désépingler" : "Épingler"}</DropdownMenuItem>
          <DropdownMenuItem onClick={() => { const t = prompt("Renommer", c.title); if (t?.trim()) renameConversation(c.id, t.trim()); }}><Pencil className="size-4" /> Renommer</DropdownMenuItem>
          <DropdownMenuItem className="text-destructive" onClick={() => { deleteConversation(c.id); if (isActive) nav({ to: "/" }); }}><Trash2 className="size-4" /> Supprimer</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function Sidebar() {
  const convs = useMira((s) => s.conversations);
  const projects = useMira((s) => s.projects);
  const user = useMira(currentUser);
  const plan = useMira(currentPlan);
  const plans = useMira((s) => s.plans);
  const credits = useMira((s) => s.credits.balance);
  const sorted = [...convs].filter((c) => c.messages.length > 0).sort((a, b) => b.updatedAt - a.updatedAt);
  const pinned = sorted.filter((c) => c.pinned);
  const recent = sorted.filter((c) => !c.pinned && !c.projectId);

  return (
    <aside className="flex h-full w-64 flex-col border-r border-sidebar-border bg-sidebar p-3">
      <Link to="/" className="flex items-center gap-2 px-2.5 py-2 text-[15px] font-semibold tracking-tight">
        <MiraMark /> Mira
      </Link>
      <nav className="mt-3 space-y-0.5">
        <Link to="/" className={navItem} activeOptions={{ exact: true }} activeProps={active}><SquarePen className="size-4" /> Nouveau chat</Link>
        <Link to="/scheduled" className={navItem} activeProps={active}><CalendarClock className="size-4" /> Planifié</Link>
        <Link to="/library" className={navItem} activeProps={active}><Library className="size-4" /> Bibliothèque</Link>
        <Link to="/ask" className={navItem} activeProps={active}><FileSearch className="size-4" /> Questions fichiers</Link>
        <Link to="/plugins" className={navItem} activeProps={active}><Plug className="size-4" /> Plugins</Link>
      </nav>
      <div className="mt-4 h-px bg-sidebar-border" />
      <div className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1 thin-scroll">
        {pinned.length > 0 && <Section title="Épinglés">{pinned.map((c) => <ChatRow key={c.id} c={c} />)}</Section>}
        <Section title="Projets">
          {projects.length === 0 ? (
            <Link to="/projects" className="block px-2.5 py-2 text-sm text-muted-foreground hover:text-foreground">Créer un premier projet</Link>
          ) : (
            <>
              {projects.slice(0, 5).map((p) => (
                <Link key={p.id} to="/projects/$id" params={{ id: p.id }} className={navItem} activeProps={active}><FolderOpen className="size-4" /><span className="truncate">{p.name}</span></Link>
              ))}
              <Link to="/projects" className="block px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground">Tous les projets</Link>
            </>
          )}
        </Section>
        <Section title="Chats">
          {recent.length === 0 ? <p className="px-2.5 py-2 text-sm text-muted-foreground">Aucune conversation</p> : recent.map((c) => <ChatRow key={c.id} c={c} />)}
        </Section>
      </div>
      <div className="mt-2 space-y-0.5 border-t border-sidebar-border pt-2">
        <Link to="/settings" search={{ tab: "general" }} className={navItem} activeProps={active}><Settings className="size-4" /> Paramètres</Link>
        <Link to="/settings" search={{ tab: "subscription" }} className={cn(navItem, "h-auto py-2")}>
          <User className="size-4" />
          <div className="min-w-0 flex-1">
            <div className="truncate">{user?.name}</div>
            <div className="text-xs text-muted-foreground">{plans[plan].name} · {credits} crédits</div>
          </div>
        </Link>
      </div>
    </aside>
  );
}
