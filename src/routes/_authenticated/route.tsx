import { createFileRoute, Outlet, Link, useRouterState } from "@tanstack/react-router";
import { AppSidebar } from "@/components/admin/AppSidebar";
import { ChevronRight, AlertCircle } from "lucide-react";

// MODO DEMO: login desativado. Painel abre direto em modo admin.
// Quando ativar autenticação, reintroduzir o gate beforeLoad usando supabase.auth.getUser().
export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: () => ({
    user: { id: "demo-admin", email: "admin@demo.local", role: "admin" as const },
  }),
  component: AuthenticatedLayout,
});

const labels: Record<string, string> = {
  dashboard: "Dashboard",
  conversas: "Conversas",
  leads: "Leads",
  assinantes: "Assinantes",
  planos: "Planos",
  conteudos: "Conteúdos",
  pagamentos: "Pagamentos",
  grupos: "Grupos Telegram",
  ia: "IA / Grok",
  automacao: "Automações",
  funis: "Funis",
  historias: "Histórias",
  "respostas-rapidas": "Respostas rápidas",
  "perfil-vendedor": "Perfil do vendedor",
  configuracoes: "Configurações",
};

function AuthenticatedLayout() {
  const { user } = Route.useRouteContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const segs = pathname.split("/").filter(Boolean);
  const current = labels[segs[1] ?? segs[0]] ?? "Painel";

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-border bg-card/40 backdrop-blur flex items-center justify-between px-6 sticky top-0 z-10">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/dashboard" className="hover:text-foreground">Painel</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground font-medium">{current}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden md:inline-flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-md bg-warning/10 text-warning border border-warning/30">
              <AlertCircle className="h-3 w-3" />
              Modo desenvolvimento: login desativado
            </span>
            <span className="text-xs text-muted-foreground hidden sm:inline">{user.email}</span>
            <div className="h-8 w-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-xs font-semibold text-primary">
              A
            </div>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-x-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
