import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { PLAN_ORDER, MODELS } from "@/lib/mira/config";
import { currentPlan, currentUser, redeemCode, setManualMode, setPlan, setTheme, updateProfile, useMira } from "@/lib/mira/store";
import { Page, btnGhost, btnPrimary, input } from "@/components/mira/Page";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

const TABS = ["general", "profile", "subscription", "usage"] as const;
type Tab = (typeof TABS)[number];
const LABEL: Record<Tab, string> = { general: "Général", profile: "Profil", subscription: "Abonnement", usage: "Utilisation" };

export const Route = createFileRoute("/settings")({
  validateSearch: (s: Record<string, unknown>): { tab: Tab } => ({ tab: TABS.includes(s["tab"] as Tab) ? (s["tab"] as Tab) : "general" }),
  head: () => ({
    meta: [
      { title: "Paramètres — Mira" },
      { name: "description", content: "Thème, profil, abonnement et utilisation de vos crédits Mira." },
      { property: "og:title", content: "Paramètres — Mira" },
      { property: "og:description", content: "Thème, profil, abonnement et utilisation de vos crédits Mira." },
    ],
  }),
  component: Settings,
});

function Row({ title, desc, children }: { title: string; desc?: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-4 py-4">
      <div className="flex-1"><div className="text-sm">{title}</div>{desc && <div className="text-xs text-muted-foreground">{desc}</div>}</div>
      {children}
    </div>
  );
}

function Settings() {
  const { tab } = Route.useSearch();
  return (
    <Page title="Paramètres">
      <div className="mb-6 flex gap-1 border-b">
        {TABS.map((t) => (
          <Link key={t} to="/settings" search={{ tab: t }} className={cn("-mb-px border-b-2 px-3 py-2 text-sm", tab === t ? "border-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}>{LABEL[t]}</Link>
        ))}
      </div>
      {tab === "general" && <General />}
      {tab === "profile" && <Profile />}
      {tab === "subscription" && <Subscription />}
      {tab === "usage" && <Usage />}
    </Page>
  );
}

function General() {
  const theme = useMira((s) => s.theme);
  const manual = useMira((s) => s.manualMode);
  return (
    <div className="divide-y">
      <Row title="Thème" desc="Sombre ou clair">
        <div className="flex gap-1">
          {(["dark", "light"] as const).map((t) => <button key={t} onClick={() => setTheme(t)} className={cn("rounded-md px-3 py-1.5 text-sm", theme === t ? "bg-accent" : "text-muted-foreground")}>{t === "dark" ? "Sombre" : "Clair"}</button>)}
        </div>
      </Row>
      <Row title="Mode manuel" desc="Afficher le sélecteur de modèle dans la barre de message">
        <Switch checked={manual} onCheckedChange={setManualMode} />
      </Row>
    </div>
  );
}

function Profile() {
  const user = useMira(currentUser);
  const [name, setName] = useState(user?.name ?? "");
  return (
    <div className="max-w-sm space-y-3">
      <label className="block text-sm">Nom<input className={`${input} mt-1`} value={name} onChange={(e) => setName(e.target.value)} /></label>
      <p className="text-sm text-muted-foreground">{user?.email} · connexion via {user?.provider}</p>
      <button className={btnPrimary} onClick={() => { updateProfile(name.trim() || name); toast("Profil enregistré."); }}>Enregistrer</button>
    </div>
  );
}

function Subscription() {
  const plan = useMira(currentPlan);
  const plans = useMira((s) => s.plans);
  const [code, setCode] = useState("");
  return (
    <div className="space-y-10">
      <div className="grid gap-px overflow-hidden rounded-xl border bg-border md:grid-cols-3">
        {PLAN_ORDER.map((id) => {
          const p = plans[id];
          return (
            <div key={id} className="flex flex-col bg-background p-5">
              <div className="text-sm font-medium">{p.name}</div>
              <div className="mt-1 text-2xl font-medium">{p.priceMonthly} €<span className="text-sm text-muted-foreground"> /mois</span></div>
              <div className="mt-1 text-xs text-muted-foreground">{p.creditsPerHour} crédits / heure{p.fairUse ? " · usage raisonnable" : ""}</div>
              <ul className="mt-4 flex-1 space-y-1 text-xs">
                {Object.entries(p.features).map(([k, v]) => <li key={k} className="flex justify-between gap-2"><span className="text-muted-foreground">{k}</span><span>{v}</span></li>)}
              </ul>
              <button className={cn("mt-5", plan === id ? btnGhost : btnPrimary)} disabled={plan === id} onClick={() => { setPlan(id); toast(`Plan ${p.name} activé (simulation).`); }}>{plan === id ? "Plan actuel" : `Passer à ${p.name}`}</button>
            </div>
          );
        })}
      </div>
      <div className="max-w-sm">
        <h2 className="mb-2 text-sm font-medium">Utiliser un code</h2>
        <div className="flex gap-2">
          <input className={input} placeholder="MIRA-XXXX-XXXX" value={code} onChange={(e) => setCode(e.target.value)} />
          <button className={btnPrimary} onClick={() => { const r = redeemCode(code); toast(r.message); if (r.ok) setCode(""); }}>Valider</button>
        </div>
      </div>
    </div>
  );
}

function Usage() {
  const credits = useMira((s) => s.credits);
  const usage = useMira((s) => s.usage);
  const plan = useMira(currentPlan);
  const plans = useMira((s) => s.plans);
  const byFeature = usage.reduce<Record<string, number>>((a, u) => ({ ...a, [u.feature]: (a[u.feature] ?? 0) + u.cost }), {});
  const next = new Date(credits.lastRefill + 3600_000);
  return (
    <div className="space-y-8">
      <div>
        <div className="text-3xl font-medium">{credits.balance}<span className="text-base text-muted-foreground"> / {plans[plan].creditsPerHour} crédits</span></div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary" style={{ width: `${Math.min(100, (credits.balance / plans[plan].creditsPerHour) * 100)}%` }} /></div>
        <p className="mt-2 text-xs text-muted-foreground">Recharge automatique toutes les heures · prochaine à {next.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</p>
      </div>
      <div>
        <h2 className="mb-2 text-sm font-medium">Par fonctionnalité</h2>
        {Object.keys(byFeature).length === 0 ? <p className="text-sm text-muted-foreground">Aucune utilisation.</p> : Object.entries(byFeature).map(([k, v]) => <div key={k} className="flex justify-between border-b py-2 text-sm"><span>{k}</span><span>{v} crédits</span></div>)}
      </div>
      <div>
        <h2 className="mb-2 text-sm font-medium">Utilisation récente</h2>
        {usage.slice(0, 15).map((u) => <div key={u.id} className="flex justify-between border-b py-2 text-sm"><span>{u.feature} <span className="text-muted-foreground">· {MODELS.find((m) => m.id === u.modelId)?.name}</span></span><span className="text-muted-foreground">{new Date(u.ts).toLocaleTimeString("fr-FR")} · {u.cost}</span></div>)}
      </div>
    </div>
  );
}
