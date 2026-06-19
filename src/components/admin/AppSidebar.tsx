import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard, MessagesSquare, Users, Package, FileBox,
  CreditCard, Send, Bot, Workflow, Settings, LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const items = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/conversas", label: "Conversas", icon: MessagesSquare },
  { to: "/assinantes", label: "Assinantes", icon: Users },
  { to: "/planos", label: "Planos", icon: Package },
  { to: "/conteudos", label: "Conteúdos", icon: FileBox },
  { to: "/pagamentos", label: "Pagamentos", icon: CreditCard },
  { to: "/grupos", label: "Grupos Telegram", icon: Send },
  { to: "/ia", label: "IA do Bot", icon: Bot },
  { to: "/automacao", label: "Automação", icon: Workflow },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
] as const;

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const qc = useQueryClient();

  async function handleSignOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    toast.success("Sessão encerrada");
    navigate({ to: "/auth", replace: true });
  }

  return (
    <aside className="w-64 shrink-0 bg-sidebar border-r border-sidebar-border flex flex-col h-screen sticky top-0">
      <div className="p-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: "var(--gradient-brand)", boxShadow: "var(--shadow-glow)" }}>
            <Bot className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <div className="font-bold text-sidebar-foreground leading-tight">BotMaster</div>
            <div className="text-xs text-muted-foreground">Pix Telegram</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {items.map((it) => {
          const active = pathname === it.to || pathname.startsWith(it.to + "/");
          const Icon = it.icon;
          return (
            <Link
              key={it.to}
              to={it.to}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium border border-sidebar-border"
                  : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
              )}
            >
              <Icon className={cn("h-4 w-4", active && "text-primary")} />
              {it.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-sidebar-border">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </div>
    </aside>
  );
}
