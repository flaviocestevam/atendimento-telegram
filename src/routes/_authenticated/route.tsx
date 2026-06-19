import { createFileRoute, redirect, Outlet, Link, useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AppSidebar } from "@/components/admin/AppSidebar";
import { ChevronRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AuthenticatedLayout,
});

const labels: Record<string, string> = {
  dashboard: "Dashboard",
  conversas: "Conversas",
  assinantes: "Assinantes",
  planos: "Planos",
  conteudos: "Conteúdos",
  pagamentos: "Pagamentos",
  grupos: "Grupos Telegram",
  ia: "IA do Bot",
  automacao: "Automação",
  configuracoes: "Configurações",
};

function AuthenticatedLayout() {
  const { user } = Route.useRouteContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const segs = pathname.split("/").filter(Boolean);
  const current = labels[segs[0]] ?? "Painel";

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
            <span className="text-xs text-muted-foreground hidden sm:inline">{user.email}</span>
            <div className="h-8 w-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-xs font-semibold text-primary">
              {user.email?.[0]?.toUpperCase() ?? "A"}
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
