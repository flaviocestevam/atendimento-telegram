import { createFileRoute, Outlet, Link, useRouterState, redirect } from "@tanstack/react-router";
import { AppSidebar } from "@/components/admin/AppSidebar";
import { ChevronRight, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// Login ativo: primeiro usuário cadastrado vira admin automaticamente (trigger handle_new_user).
export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: { id: data.user.id, email: data.user.email ?? "", role: "admin" as const } };
  },
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
            <span className="hidden md:inline-flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-md bg-success/10 text-success border border-success/30">
              <ShieldCheck className="h-3 w-3" />
              Admin autenticado
            </span>
            <span className="text-xs text-muted-foreground hidden sm:inline">{user.email}</span>
            <button
              onClick={async () => { await supabase.auth.signOut(); window.location.href = "/auth"; }}
              className="h-8 px-3 rounded-md bg-card border border-border text-xs hover:bg-muted"
            >
              Sair
            </button>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-x-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
