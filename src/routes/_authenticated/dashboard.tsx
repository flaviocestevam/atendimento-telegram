import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useActiveProfile } from "@/lib/active-profile";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { BRL, relTime } from "@/lib/format";
import {
  Users, DollarSign, TrendingUp, Clock, MessagesSquare, AlertTriangle,
  Package, Plus, FileBox, Bot
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function StatCard({ icon: Icon, label, value, accent, sub }: any) {
  return (
    <Card className="p-5 bg-card border-border relative overflow-hidden">
      <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full opacity-10" style={{ background: accent }} />
      <div className="flex items-start justify-between relative">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
        </div>
        <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{ background: accent }}>
          <Icon className="h-5 w-5 text-primary-foreground" />
        </div>
      </div>
    </Card>
  );
}

function Dashboard() {
  const { profileId } = useActiveProfile();
  const stats = useQuery({
    enabled: !!profileId,
    queryKey: ["dashboard-stats", profileId],
    queryFn: async () => {
      const sp = profileId!;
      const [grants, ordersToday, ordersMonth, pending, convsToday, expiring, contents] = await Promise.all([
        supabase.from("access_grants").select("id", { count: "exact", head: true }).eq("seller_profile_id", sp).eq("status", "active"),
        supabase.from("orders").select("amount_cents").eq("seller_profile_id", sp).eq("status", "paid").gte("paid_at", new Date(new Date().setHours(0,0,0,0)).toISOString()),
        supabase.from("orders").select("amount_cents,paid_at").eq("seller_profile_id", sp).eq("status", "paid").gte("paid_at", new Date(Date.now()-30*864e5).toISOString()),
        supabase.from("payments").select("id", { count: "exact", head: true }).eq("seller_profile_id", sp).eq("status", "pending"),
        supabase.from("messages").select("id", { count: "exact", head: true }).eq("seller_profile_id", sp).gte("created_at", new Date(new Date().setHours(0,0,0,0)).toISOString()),
        supabase.from("access_grants").select("id", { count: "exact", head: true }).eq("seller_profile_id", sp).eq("status","active").lte("expires_at", new Date(Date.now()+3*864e5).toISOString()).gte("expires_at", new Date().toISOString()),
        supabase.from("orders").select("id", { count: "exact", head: true }).eq("seller_profile_id", sp).eq("item_type", "content").eq("status", "paid"),
      ]);
      const receitaHoje = (ordersToday.data ?? []).reduce((s, r) => s + (r.amount_cents ?? 0), 0);
      const receitaMes = (ordersMonth.data ?? []).reduce((s, r) => s + (r.amount_cents ?? 0), 0);

      // Chart bucketed per day
      const byDay = new Map<string, number>();
      for (let i = 29; i >= 0; i--) {
        const d = new Date(Date.now() - i*864e5);
        const k = d.toISOString().slice(5,10);
        byDay.set(k, 0);
      }
      (ordersMonth.data ?? []).forEach(r => {
        if (!r.paid_at) return;
        const k = new Date(r.paid_at).toISOString().slice(5,10);
        if (byDay.has(k)) byDay.set(k, (byDay.get(k) ?? 0) + r.amount_cents);
      });
      const chart = Array.from(byDay, ([day, value]) => ({ day, value: value/100 }));

      return {
        ativos: grants.count ?? 0,
        receitaHoje, receitaMes,
        pixPendentes: pending.count ?? 0,
        conversas: convsToday.count ?? 0,
        vencendo: expiring.count ?? 0,
        conteudos: contents.count ?? 0,
        chart,
      };
    },
  });

  const recent = useQuery({
    enabled: !!profileId,
    queryKey: ["recent-activity", profileId],
    queryFn: async () => {
      const { data } = await supabase
        .from("activity_logs")
        .select("id,type,description,created_at,telegram_user_id,telegram_users(first_name,username)")
        .eq("seller_profile_id", profileId!)
        .order("created_at", { ascending: false })
        .limit(8);
      return data ?? [];
    },
  });

  const s = stats.data;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Visão geral do BotMaster Pix Telegram"
        actions={
          <>
            <Button variant="outline" asChild><Link to="/planos"><Plus className="h-4 w-4 mr-1"/>Criar plano</Link></Button>
            <Button variant="outline" asChild><Link to="/conteudos"><FileBox className="h-4 w-4 mr-1"/>Novo conteúdo</Link></Button>
            <Button variant="outline" asChild><Link to="/conversas"><MessagesSquare className="h-4 w-4 mr-1"/>Ver conversas</Link></Button>
            <Button asChild><Link to="/ia"><Bot className="h-4 w-4 mr-1"/>Configurar IA</Link></Button>
          </>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Users} label="Assinantes ativos" value={s?.ativos ?? "—"} accent="var(--gradient-brand)" />
        <StatCard icon={DollarSign} label="Receita hoje" value={BRL(s?.receitaHoje ?? 0)} accent="var(--gradient-success)" />
        <StatCard icon={TrendingUp} label="Receita mensal" value={BRL(s?.receitaMes ?? 0)} accent="var(--gradient-brand)" />
        <StatCard icon={Clock} label="Pix pendentes" value={s?.pixPendentes ?? "—"} accent="linear-gradient(135deg,oklch(0.78 0.16 80),oklch(0.62 0.22 25))" />
        <StatCard icon={MessagesSquare} label="Conversas hoje" value={s?.conversas ?? "—"} accent="var(--gradient-brand)" />
        <StatCard icon={AlertTriangle} label="Acessos vencendo" value={s?.vencendo ?? "—"} accent="linear-gradient(135deg,oklch(0.78 0.16 80),oklch(0.65 0.22 30))" />
        <StatCard icon={Package} label="Conteúdos vendidos" value={s?.conteudos ?? "—"} accent="var(--gradient-success)" />
        <StatCard icon={DollarSign} label="Ticket médio" value={BRL(((s?.receitaMes ?? 0) / Math.max(1, s?.ativos ?? 1)))} accent="var(--gradient-brand)" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-5 bg-card border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Receita — últimos 30 dias</h3>
            <span className="text-xs text-muted-foreground">em R$</span>
          </div>
          <div className="h-72">
            <ResponsiveContainer>
              <AreaChart data={s?.chart ?? []}>
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.62 0.22 295)" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="oklch(0.62 0.22 295)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="oklch(0.28 0.02 270)" strokeDasharray="3 3" />
                <XAxis dataKey="day" stroke="oklch(0.70 0.02 270)" fontSize={11} />
                <YAxis stroke="oklch(0.70 0.02 270)" fontSize={11} />
                <Tooltip contentStyle={{ background: "oklch(0.20 0.02 270)", border: "1px solid oklch(0.28 0.02 270)", borderRadius: 8 }} />
                <Area type="monotone" dataKey="value" stroke="oklch(0.62 0.22 295)" strokeWidth={2} fill="url(#grad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5 bg-card border-border">
          <h3 className="font-semibold mb-4">Atividades recentes</h3>
          <ul className="space-y-3">
            {(recent.data ?? []).map((a: any) => (
              <li key={a.id} className="flex items-start gap-3 text-sm">
                <div className="h-2 w-2 rounded-full mt-2 bg-primary" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{a.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {a.telegram_users?.first_name ?? "Sistema"} · {relTime(a.created_at)}
                  </p>
                </div>
                <StatusBadge status={a.type === "payment_approved" ? "approved" : "active"} />
              </li>
            ))}
            {!recent.isLoading && (recent.data?.length ?? 0) === 0 && (
              <p className="text-sm text-muted-foreground">Nenhuma atividade ainda.</p>
            )}
          </ul>
        </Card>
      </div>
    </div>
  );
}
