import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, MessagesSquare, Users, Package, FileBox,
  CreditCard, Send, Bot, Workflow, Settings, UserCircle,
  GitBranch, BookOpen, Zap, X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const groups: { label: string; items: { to: string; label: string; icon: any }[] }[] = [
  {
    label: "Operação",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/conversas", label: "Conversas", icon: MessagesSquare },
      { to: "/leads", label: "Leads", icon: Users },
      { to: "/pagamentos", label: "Pagamentos", icon: CreditCard },
    ],
  },
  {
    label: "Catálogo",
    items: [
      { to: "/planos", label: "Planos", icon: Package },
      { to: "/conteudos", label: "Conteúdos", icon: FileBox },
      { to: "/assinantes", label: "Assinantes", icon: Users },
      { to: "/grupos", label: "Grupos Telegram", icon: Send },
    ],
  },
  {
    label: "Inteligência",
    items: [
      { to: "/ia", label: "IA / Grok", icon: Bot },
      { to: "/perfil-vendedor", label: "Perfil da influenciadora", icon: UserCircle },
      { to: "/respostas-rapidas", label: "Respostas rápidas", icon: Zap },
      { to: "/automacao", label: "Automações", icon: Workflow },
      { to: "/funis", label: "Funis", icon: GitBranch },
      { to: "/historias", label: "Histórias", icon: BookOpen },
    ],
  },
  {
    label: "Sistema",
    items: [
      { to: "/perfis", label: "Perfis / Influenciadoras", icon: UserCircle },
      { to: "/configuracoes", label: "Configurações", icon: Settings },
    ],
  },
];

export function AppSidebar({ mobileOpen = false, onClose }: { mobileOpen?: boolean; onClose?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <>
      {/* Backdrop mobile */}
      <div
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-30 bg-black/60 backdrop-blur-sm transition-opacity lg:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-sidebar border-r border-sidebar-border flex flex-col h-screen transition-transform duration-200",
          "lg:sticky lg:top-0 lg:translate-x-0 lg:z-auto lg:shrink-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="p-5 border-b border-sidebar-border flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 shrink-0 rounded-xl flex items-center justify-center" style={{ background: "var(--gradient-brand)", boxShadow: "var(--shadow-glow)" }}>
              <Bot className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-sidebar-foreground leading-tight truncate">BotMaster</div>
              <div className="text-xs text-muted-foreground truncate">Telegram Suite</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden h-8 w-8 rounded-md hover:bg-sidebar-accent flex items-center justify-center text-sidebar-foreground/70"
            aria-label="Fechar menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-4">
          {groups.map((g) => (
            <div key={g.label}>
              <p className="px-3 mb-1.5 text-[10px] uppercase tracking-wider text-muted-foreground/70 font-semibold">{g.label}</p>
              <div className="space-y-1">
                {g.items.map((it) => {
                  const active = pathname === it.to || pathname.startsWith(it.to + "/");
                  const Icon = it.icon;
                  return (
                    <Link
                      key={it.to}
                      to={it.to}
                      onClick={onClose}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                        active
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium border border-sidebar-border"
                          : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                      )}
                    >
                      <Icon className={cn("h-4 w-4 shrink-0", active && "text-primary")} />
                      <span className="truncate">{it.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-sidebar-border">
          <div className="px-3 py-2 text-[11px] text-muted-foreground">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-success mr-1.5" />
            Admin autenticado
          </div>
        </div>
      </aside>
    </>
  );
}
