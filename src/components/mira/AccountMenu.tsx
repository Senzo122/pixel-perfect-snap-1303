import { useNavigate } from "@tanstack/react-router";
import { BarChart3, CreditCard, Gift, LogOut, Settings, Shield, User } from "lucide-react";
import { currentPlan, currentUser, signOut, useMira } from "@/lib/mira/store";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const initials = (n: string) => n.split(/\s+/).map((x) => x[0]).join("").slice(0, 2).toUpperCase();

export function AccountMenu() {
  const user = useMira(currentUser);
  const plan = useMira(currentPlan);
  const plans = useMira((s) => s.plans);
  const nav = useNavigate();
  if (!user) return null;
  const go = (tab: "general" | "profile" | "subscription" | "usage") => nav({ to: "/settings", search: { tab } });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 transition-colors hover:bg-accent focus-visible:outline-none">
        <span className="grid size-7 place-items-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">{initials(user.name)}</span>
        <span className="hidden text-sm sm:inline">{user.name}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="font-normal">
          <div className="text-sm">{user.name}</div>
          <div className="text-xs text-muted-foreground">{user.email} · {plans[plan].name}</div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => go("profile")}><User className="size-4" /> Profil</DropdownMenuItem>
        <DropdownMenuItem onClick={() => go("general")}><Settings className="size-4" /> Paramètres</DropdownMenuItem>
        <DropdownMenuItem onClick={() => go("subscription")}><CreditCard className="size-4" /> Abonnement</DropdownMenuItem>
        <DropdownMenuItem onClick={() => go("usage")}><BarChart3 className="size-4" /> Utilisation</DropdownMenuItem>
        <DropdownMenuItem onClick={() => go("subscription")}><Gift className="size-4" /> Codes cadeaux</DropdownMenuItem>
        {user.role === "admin" && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => nav({ to: "/admin" })}><Shield className="size-4" /> Admin Panel</DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => { signOut(); nav({ to: "/login" }); }}><LogOut className="size-4" /> Déconnexion</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
