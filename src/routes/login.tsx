import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { signIn } from "@/lib/mira/store";
import { MiraMark } from "@/components/mira/ProviderLogo";
import { btnGhost, btnPrimary, input } from "@/components/mira/Page";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Connexion — Mira" },
      { name: "description", content: "Connectez-vous à Mira avec Google, Apple, Discord ou votre e-mail." },
      { property: "og:title", content: "Connexion — Mira" },
      { property: "og:description", content: "Connectez-vous à Mira avec Google, Apple, Discord ou votre e-mail." },
    ],
  }),
  component: Login,
});

function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const go = (provider: string, mail: string, name?: string) => {
    try { signIn(provider, mail, name); nav({ to: "/" }); } catch (e) { toast((e as Error).message); }
  };
  const social = (p: string, label: string) => (
    <button className={`${btnGhost} h-11 w-full justify-center`} onClick={() => go(p, `demo.${p}@mira.local`, `Utilisateur ${label}`)}>Continuer avec {label}</button>
  );
  return (
    <div className="grid min-h-dvh place-items-center bg-background px-4">
      <div className="w-full max-w-sm animate-rise">
        <div className="mb-10 flex flex-col items-center gap-3">
          <MiraMark className="size-8" />
          <h1 className="text-2xl font-medium tracking-tight">Bienvenue sur Mira</h1>
          <p className="text-sm text-muted-foreground">Une seule IA. Le bon moteur, à chaque fois.</p>
        </div>
        <div className="space-y-2">
          {social("google", "Google")}
          {social("apple", "Apple")}
          {social("discord", "Discord")}
        </div>
        <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />ou<span className="h-px flex-1 bg-border" /></div>
        <form className="space-y-2" onSubmit={(e) => { e.preventDefault(); if (!/.+@.+\..+/.test(email) || pw.length < 6) return toast("E-mail valide et mot de passe de 6 caractères minimum."); go("email", email); }}>
          <input className={`${input} h-11`} type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className={`${input} h-11`} type="password" placeholder="Mot de passe" value={pw} onChange={(e) => setPw(e.target.value)} />
          <button className={`${btnPrimary} h-11 w-full justify-center`}>Continuer</button>
        </form>
        <p className="mt-6 text-center text-xs text-muted-foreground">Prototype : la connexion est simulée.</p>
      </div>
    </div>
  );
}
