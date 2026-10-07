import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PLAN_ORDER } from "@/lib/mira/config";
import {
  adminCreateOffer, adminGenerateCodes, adminSetAutoOffer, adminSetUserStatus, adminToggleOffer, adminUpdateFlag, adminUpdatePlan, currentUser, demoTriggerOffer, useMira,
} from "@/lib/mira/store";
import { Page, btnGhost, btnPrimary, input } from "@/components/mira/Page";
import { cn } from "@/lib/utils";

const TABS = ["dashboard", "users", "plans", "offers", "codes", "moderation", "logs"] as const;
type Tab = (typeof TABS)[number];
const LABEL: Record<Tab, string> = { dashboard: "Dashboard", users: "Utilisateurs", plans: "Abonnements", offers: "Offres", codes: "Codes cadeaux", moderation: "Modération", logs: "Journal" };

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — Mira" }, { name: "robots", content: "noindex" }] }),
  component: Admin,
});

function Admin() {
  const me = useMira(currentUser);
  const [tab, setTab] = useState<Tab>("dashboard");
  if (me?.role !== "admin") return <Page title="Accès refusé"><Link to="/" className="text-sm underline">Retour</Link></Page>;
  return (
    <Page title="Admin Panel">
      <div className="mb-6 flex flex-wrap gap-1 border-b">
        {TABS.map((t) => <button key={t} onClick={() => setTab(t)} className={cn("-mb-px border-b-2 px-3 py-2 text-sm", tab === t ? "border-foreground" : "border-transparent text-muted-foreground")}>{LABEL[t]}</button>)}
      </div>
      {tab === "dashboard" && <Dashboard />}
      {tab === "users" && <Users />}
      {tab === "plans" && <Plans />}
      {tab === "offers" && <Offers />}
      {tab === "codes" && <Codes />}
      {tab === "moderation" && <Moderation />}
      {tab === "logs" && <Logs />}
    </Page>
  );
}

const th = "px-3 py-2 text-left text-xs font-normal text-muted-foreground";
const td = "px-3 py-2 text-sm";

function Dashboard() {
  const users = useMira((s) => s.users);
  const usage = useMira((s) => s.usage);
  const stats = [
    ["Utilisateurs", users.length],
    ["Actifs (24 h)", users.filter((u) => Date.now() - u.lastActive < 86400_000).length],
    ["Abonnés payants", users.filter((u) => u.plan !== "free").length],
    ["Crédits consommés", usage.reduce((a, u) => a + u.cost, 0)],
  ];
  return <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border bg-border md:grid-cols-4">{stats.map(([k, v]) => <div key={k} className="bg-background p-5"><div className="text-xs text-muted-foreground">{k}</div><div className="mt-1 text-2xl font-medium">{v}</div></div>)}</div>;
}

function Users() {
  const users = useMira((s) => s.users);
  const flags = useMira((s) => s.moderation);
  const [q, setQ] = useState("");
  return (
    <>
      <input className={`${input} mb-4 max-w-xs`} placeholder="Rechercher" value={q} onChange={(e) => setQ(e.target.value)} />
      <table className="w-full rounded-xl border"><thead><tr className="border-b"><th className={th}>Nom</th><th className={th}>Plan</th><th className={th}>Statut</th><th className={th}>Signalements</th><th className={th} /></tr></thead>
        <tbody>{users.filter((u) => `${u.name} ${u.email}`.toLowerCase().includes(q.toLowerCase())).map((u) => (
          <tr key={u.id} className="border-b last:border-0"><td className={td}>{u.name}<div className="text-xs text-muted-foreground">{u.email}</div></td><td className={td}>{u.plan}</td><td className={td}>{u.status === "active" ? "Actif" : "Suspendu"}</td><td className={td}>{flags.filter((f) => f.userId === u.id).length}</td>
            <td className={td}>{u.role !== "admin" && <button className={btnGhost} onClick={() => adminSetUserStatus(u.id, u.status === "active" ? "suspended" : "active")}>{u.status === "active" ? "Suspendre" : "Réactiver"}</button>}</td></tr>
        ))}</tbody></table>
    </>
  );
}

function Plans() {
  const plans = useMira((s) => s.plans);
  return (
    <div className="space-y-4">{PLAN_ORDER.map((id) => (
      <div key={id} className="flex flex-wrap items-end gap-3 rounded-xl border p-4">
        <div className="w-20 text-sm font-medium">{plans[id].name}</div>
        <label className="text-xs text-muted-foreground">Crédits / h<input type="number" className={`${input} mt-1 w-28`} defaultValue={plans[id].creditsPerHour} onBlur={(e) => adminUpdatePlan(id, { creditsPerHour: Number(e.target.value) })} /></label>
        <label className="text-xs text-muted-foreground">Prix €<input type="number" className={`${input} mt-1 w-24`} defaultValue={plans[id].priceMonthly} onBlur={(e) => adminUpdatePlan(id, { priceMonthly: Number(e.target.value) })} /></label>
        <label className="text-xs text-muted-foreground">Projets max<input type="number" className={`${input} mt-1 w-24`} defaultValue={plans[id].maxProjects} onBlur={(e) => adminUpdatePlan(id, { maxProjects: Number(e.target.value) })} /></label>
      </div>
    ))}</div>
  );
}

function Offers() {
  const offers = useMira((s) => s.offers);
  const auto = useMira((s) => s.autoOffer);
  const [o, setO] = useState({ name: "", percent: 20, hours: 24, plan: "plus" as "plus" | "pro", days: 30 });
  return (
    <div className="space-y-8">
      <div className="rounded-xl border p-4">
        <h2 className="mb-3 text-sm font-medium">Offre automatique</h2>
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-xs text-muted-foreground"><input type="checkbox" checked={auto.enabled} onChange={(e) => adminSetAutoOffer({ enabled: e.target.checked })} /> Activée</label>
          <label className="text-xs text-muted-foreground">Après N messages<input type="number" className={`${input} mt-1 w-24`} defaultValue={auto.afterMessages} onBlur={(e) => adminSetAutoOffer({ afterMessages: Number(e.target.value) })} /></label>
          <label className="text-xs text-muted-foreground">Réduction %<input type="number" className={`${input} mt-1 w-24`} defaultValue={auto.percent} onBlur={(e) => adminSetAutoOffer({ percent: Number(e.target.value) })} /></label>
          <label className="text-xs text-muted-foreground">Durée h<input type="number" className={`${input} mt-1 w-24`} defaultValue={auto.hours} onBlur={(e) => adminSetAutoOffer({ hours: Number(e.target.value) })} /></label>
          <button className={btnGhost} onClick={demoTriggerOffer}>Démo</button>
        </div>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <input className={`${input} w-48`} placeholder="Nom de l’offre" value={o.name} onChange={(e) => setO({ ...o, name: e.target.value })} />
        <input type="number" className={`${input} w-20`} value={o.percent} onChange={(e) => setO({ ...o, percent: Number(e.target.value) })} />
        <select className={`${input} w-24`} value={o.plan} onChange={(e) => setO({ ...o, plan: e.target.value as "plus" | "pro" })}><option value="plus">Plus</option><option value="pro">Pro</option></select>
        <input type="number" className={`${input} w-20`} value={o.days} onChange={(e) => setO({ ...o, days: Number(e.target.value) })} title="Expire dans (jours)" />
        <button className={btnPrimary} disabled={!o.name} onClick={() => { adminCreateOffer({ name: o.name, percent: o.percent, hours: o.hours, plan: o.plan, expiresAt: Date.now() + o.days * 86400_000 }); setO({ ...o, name: "" }); }}>Créer</button>
      </div>
      <div className="divide-y rounded-xl border">{offers.length === 0 ? <p className="p-3 text-sm text-muted-foreground">Aucune offre.</p> : offers.map((x) => (
        <div key={x.id} className="flex items-center gap-3 p-3 text-sm"><span className="flex-1">{x.name} · -{x.percent} % · {x.plan} · expire le {new Date(x.expiresAt).toLocaleDateString("fr-FR")}</span><button className={btnGhost} onClick={() => adminToggleOffer(x.id)}>{x.active ? "Désactiver" : "Activer"}</button></div>
      ))}</div>
    </div>
  );
}

function Codes() {
  const codes = useMira((s) => s.giftCodes);
  const [c, setC] = useState({ plan: "plus" as "plus" | "pro", days: 30, count: 5, exp: 90 });
  const status = (g: (typeof codes)[number]) => (g.usedBy ? "utilisé" : g.expiresAt < Date.now() ? "expiré" : "disponible");
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <select className={`${input} w-24`} value={c.plan} onChange={(e) => setC({ ...c, plan: e.target.value as "plus" | "pro" })}><option value="plus">Plus</option><option value="pro">Pro</option></select>
        <label className="text-xs text-muted-foreground">Durée (j)<input type="number" className={`${input} mt-1 w-20`} value={c.days} onChange={(e) => setC({ ...c, days: Number(e.target.value) })} /></label>
        <label className="text-xs text-muted-foreground">Nombre<input type="number" className={`${input} mt-1 w-20`} value={c.count} onChange={(e) => setC({ ...c, count: Number(e.target.value) })} /></label>
        <label className="text-xs text-muted-foreground">Expire (j)<input type="number" className={`${input} mt-1 w-20`} value={c.exp} onChange={(e) => setC({ ...c, exp: Number(e.target.value) })} /></label>
        <button className={btnPrimary} onClick={() => adminGenerateCodes(c.plan, c.days, Math.min(100, c.count), c.exp)}>Générer</button>
      </div>
      <div className="divide-y rounded-xl border">{codes.map((g) => <div key={g.code} className="flex gap-3 p-3 font-mono text-sm"><span className="flex-1">{g.code}</span><span className="text-muted-foreground">{g.plan} · {g.days} j · {status(g)}</span></div>)}</div>
    </div>
  );
}

function Moderation() {
  const flags = useMira((s) => s.moderation);
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">Seuls les messages signalés par le modérateur automatique apparaissent ici. Chaque action est journalisée.</p>
      <div className="divide-y rounded-xl border">{flags.map((f) => (
        <div key={f.id} className="flex flex-wrap items-center gap-3 p-3 text-sm">
          <span className="w-12 tabular-nums">{Math.round(f.risk * 100)} %</span>
          <span className="min-w-0 flex-1"><span className="block truncate">{f.excerpt}</span><span className="text-xs text-muted-foreground">{f.reason} · {f.userId} · {f.status} · {f.action}</span></span>
          <button className={btnGhost} onClick={() => adminUpdateFlag(f.id, "reviewing")}>Examiner</button>
          <button className={btnGhost} onClick={() => adminUpdateFlag(f.id, "resolved", "Avertissement")}>Avertir</button>
          <button className={btnGhost} onClick={() => adminUpdateFlag(f.id, "resolved", "Aucune action")}>Classer</button>
        </div>
      ))}</div>
    </div>
  );
}

function Logs() {
  const logs = useMira((s) => s.adminLogs);
  return <div className="divide-y rounded-xl border">{logs.length === 0 ? <p className="p-3 text-sm text-muted-foreground">Aucune action.</p> : logs.map((l) => <div key={l.id} className="flex gap-3 p-3 text-sm"><span className="text-muted-foreground">{new Date(l.ts).toLocaleString("fr-FR")}</span><span className="flex-1">{l.action}</span><span className="text-muted-foreground">{l.target}</span></div>)}</div>;
}
