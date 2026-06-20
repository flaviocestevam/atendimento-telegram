import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useActiveProfile } from "@/lib/active-profile";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BRL, relTime } from "@/lib/format";
import {
  Users, DollarSign, CreditCard, MessagesSquare, AlertTriangle, Package,
  Plus, FileBox, Bot, Send, ArrowUp, ArrowDown, Sparkles, ThumbsUp, Clock,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

const DAY = 86_400_000;
const startOfToday = () => { const d = new Date(); d.setHours(0,0,0,0); return d; };
const pct = (cur: number, prev: number) => {
  if (!prev) return cur ? 100 : 0;
  return ((cur - prev) / prev) * 100;
};

function StatCard({
  icon: Icon, label, value, accent, delta, deltaLabel,
}: {
  icon: any; label: string; value: string | number; accent: string;
  delta?: number | null; deltaLabel?: string;
}) {
  const showDelta = typeof delta === "number" && isFinite(delta);
  const up = (delta ?? 0) >= 0;
  return (
    <Card className="p-5 bg-card border-border relative overflow-hidden">
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-10" style={{ background: accent }} />
      <div className="flex items-start justify-between relative">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold mt-1 truncate">{value}</p>
          {showDelta && (
            <p className={`text-xs mt-2 flex items-center gap-1 ${up ? "text-emerald-400" : "text-red-400"}`}>
              {up ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
              {Math.abs(delta!).toFixed(1)}% <span className="text-muted-foreground">{deltaLabel ?? "vs período anterior"}</span>
            </p>
          )}
        </div>
        <div className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: accent }}>
          <Icon className="h-5 w-5 text-primary-foreground" />
        </div>
      </div>
    </Card>
  );
}

function FunnelChart({ rows }: { rows: { label: string; value: number; color: string }[] }) {
  const top = rows[0]?.value || 1;
  const W = 220;
  const H = 220;
  const minW = 60; // bottom width floor so tiny values still render
  const sliceH = H / rows.length;
  // Compute trapezoid widths per row based on value relative to top
  const widths = rows.map(r => {
    const ratio = Math.max(0, Math.min(1, r.value / top));
    return Math.max(minW, W * (0.35 + 0.65 * ratio));
  });
  // Each slice's top width = previous bottom width (so trapezoids connect)
  return (
    <div className="flex items-center gap-6">
      <svg viewBox={`0 0 ${W} ${H}`} className="shrink-0" style={{ width: 200, height: 200 }}>
        {rows.map((r, i) => {
          const topW = i === 0 ? W : widths[i - 1];
          const botW = widths[i];
          const y1 = i * sliceH;
          const y2 = y1 + sliceH - 2;
          const cx = W / 2;
          const points = [
            `${cx - topW / 2},${y1}`,
            `${cx + topW / 2},${y1}`,
            `${cx + botW / 2},${y2}`,
            `${cx - botW / 2},${y2}`,
          ].join(" ");
          return <polygon key={i} points={points} fill={r.color} />;
        })}
      </svg>
      <div className="flex-1 space-y-3">
        {rows.map((r, i) => {
          const p = top ? (r.value / top) * 100 : 0;
          return (
            <div key={i} className="flex items-center justify-between text-sm gap-3">
              <span className="text-muted-foreground truncate">{r.label}</span>
              <span className="tabular-nums whitespace-nowrap">
                <span className="font-semibold">{r.value.toLocaleString("pt-BR")}</span>{" "}
                <span className="text-xs text-muted-foreground">{p.toFixed(1)}%</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}


function Dashboard() {
  const { profiles } = useActiveProfile();
  const [scope, setScope] = useState<string>("all"); // "all" | profileId
  const sp = scope === "all" ? null : scope;
  const scopeKey = scope;

  const applyScope = <T extends { eq: (k: string, v: any) => T }>(q: T) =>
    sp ? q.eq("seller_profile_id", sp) : q;


  const stats = useQuery({
    queryKey: ["dashboard-stats", scopeKey],
    queryFn: async () => {
      const todayISO = startOfToday().toISOString();
      const yesterdayISO = new Date(startOfToday().getTime() - DAY).toISOString();
      const last30ISO = new Date(Date.now() - 30 * DAY).toISOString();
      const prev30ISO = new Date(Date.now() - 60 * DAY).toISOString();
      const in7ISO = new Date(Date.now() + 7 * DAY).toISOString();
      const nowISO = new Date().toISOString();

      const [
        grants, grantsPrev,
        ordersMonth, ordersPrev,
        ordersToday, ordersYesterday,
        pending,
        convsToday, convsYesterday,
        expiring,
        contentsSold, contentsSoldPrev,
        leadsTotal, leadsResponded, leadsActive, leadsPaid,
      ] = await Promise.all([
        applyScope(supabase.from("access_grants").select("id", { count: "exact", head: true }).eq("status", "active")),
        applyScope(supabase.from("access_grants").select("id", { count: "exact", head: true }).eq("status", "active").lte("created_at", last30ISO)),
        applyScope(supabase.from("orders").select("amount_cents,paid_at").eq("status", "paid").gte("paid_at", last30ISO)),
        applyScope(supabase.from("orders").select("amount_cents").eq("status", "paid").gte("paid_at", prev30ISO).lt("paid_at", last30ISO)),
        applyScope(supabase.from("orders").select("amount_cents").eq("status", "paid").gte("paid_at", todayISO)),
        applyScope(supabase.from("orders").select("amount_cents").eq("status", "paid").gte("paid_at", yesterdayISO).lt("paid_at", todayISO)),
        applyScope(supabase.from("payments").select("id", { count: "exact", head: true }).eq("status", "pending")),
        applyScope(supabase.from("messages").select("id", { count: "exact", head: true }).gte("created_at", todayISO)),
        applyScope(supabase.from("messages").select("id", { count: "exact", head: true }).gte("created_at", yesterdayISO).lt("created_at", todayISO)),
        applyScope(supabase.from("access_grants").select("id", { count: "exact", head: true }).eq("status", "active").lte("expires_at", in7ISO).gte("expires_at", nowISO)),
        applyScope(supabase.from("orders").select("id", { count: "exact", head: true }).eq("item_type", "content").eq("status", "paid").gte("paid_at", last30ISO)),
        applyScope(supabase.from("orders").select("id", { count: "exact", head: true }).eq("item_type", "content").eq("status", "paid").gte("paid_at", prev30ISO).lt("paid_at", last30ISO)),
        applyScope(supabase.from("leads").select("id", { count: "exact", head: true })),
        applyScope(supabase.from("leads").select("id", { count: "exact", head: true }).not("last_message_at", "is", null)),
        applyScope(supabase.from("access_grants").select("id", { count: "exact", head: true }).eq("status", "active")),
        applyScope(supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "paid")),
      ]);

      const receitaMes = (ordersMonth.data ?? []).reduce((s, r) => s + (r.amount_cents ?? 0), 0);
      const receitaPrev = (ordersPrev.data ?? []).reduce((s, r) => s + (r.amount_cents ?? 0), 0);
      const receitaHoje = (ordersToday.data ?? []).reduce((s, r) => s + (r.amount_cents ?? 0), 0);
      const receitaOntem = (ordersYesterday.data ?? []).reduce((s, r) => s + (r.amount_cents ?? 0), 0);

      const byDay = new Map<string, number>();
      for (let i = 29; i >= 0; i--) {
        const d = new Date(Date.now() - i * DAY);
        byDay.set(d.toISOString().slice(5, 10), 0);
      }
      (ordersMonth.data ?? []).forEach(r => {
        if (!r.paid_at) return;
        const k = new Date(r.paid_at).toISOString().slice(5, 10);
        if (byDay.has(k)) byDay.set(k, (byDay.get(k) ?? 0) + (r.amount_cents ?? 0));
      });
      const chart = Array.from(byDay, ([day, value]) => ({ day, value: value / 100 }));

      return {
        ativos: grants.count ?? 0,
        ativosDelta: pct(grants.count ?? 0, grantsPrev.count ?? 0),
        receitaMes, receitaMesDelta: pct(receitaMes, receitaPrev),
        receitaHoje, receitaHojeDelta: pct(receitaHoje, receitaOntem),
        pendentes: pending.count ?? 0,
        conversas: convsToday.count ?? 0, conversasDelta: pct(convsToday.count ?? 0, convsYesterday.count ?? 0),
        vencendo: expiring.count ?? 0,
        conteudos: contentsSold.count ?? 0, conteudosDelta: pct(contentsSold.count ?? 0, contentsSoldPrev.count ?? 0),
        chart,
        funnel: {
          visitantes: leadsTotal.count ?? 0,
          interessados: leadsResponded.count ?? 0,
          assinaram: leadsActive.count ?? 0,
          pagaram: leadsPaid.count ?? 0,
        },
      };
    },
  });

  const recent = useQuery({
    queryKey: ["recent-activity", scopeKey],
    queryFn: async () => {
      let q = supabase.from("activity_logs")
        .select("id,type,description,created_at,telegram_user_id,telegram_users(first_name,username)")
        .order("created_at", { ascending: false }).limit(6);
      if (sp) q = q.eq("seller_profile_id", sp);
      const { data } = await q;
      return data ?? [];
    },
  });

  const recentPayments = useQuery({
    queryKey: ["recent-payments", scopeKey],
    queryFn: async () => {
      let q = supabase.from("orders")
        .select("id,amount_cents,status,paid_at,created_at,item_type,item_id,telegram_users(first_name,username,avatar_url)")
        .order("created_at", { ascending: false }).limit(5);
      if (sp) q = q.eq("seller_profile_id", sp);
      const { data } = await q;
      return data ?? [];
    },
  });

  const aiToday = useQuery({
    queryKey: ["ai-today", scopeKey],
    queryFn: async () => {
      let q = supabase.from("messages").select("id", { count: "exact", head: true })
        .eq("direction", "outbound").gte("created_at", startOfToday().toISOString());
      if (sp) q = q.eq("seller_profile_id", sp);
      const { count } = await q;
      return { atendidas: count ?? 0 };
    },
  });

  const s = stats.data;
  const f = s?.funnel ?? { visitantes: 0, interessados: 0, assinaram: 0, pagaram: 0 };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle="Visão geral do desempenho do seu bot no Telegram."
        actions={
          <div className="flex items-center gap-2">
            <Select value={scope} onValueChange={setScope}>
              <SelectTrigger className="w-[220px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os perfis ({profiles?.length ?? 0})</SelectItem>
                {(profiles ?? []).map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.display_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button asChild><Link to="/ia"><Bot className="h-4 w-4 mr-1"/>Configurar IA</Link></Button>
          </div>
        }
      />

      {/* Top stat row — 6 cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard icon={Users} label="Assinantes ativos" value={(s?.ativos ?? 0).toLocaleString("pt-BR")}
          accent="linear-gradient(135deg,oklch(0.62 0.22 295),oklch(0.55 0.22 280))"
          delta={s?.ativosDelta} deltaLabel="vs últimos 30 dias" />
        <StatCard icon={DollarSign} label="Receita mensal" value={BRL(s?.receitaMes ?? 0)}
          accent="linear-gradient(135deg,oklch(0.70 0.18 155),oklch(0.55 0.18 160))"
          delta={s?.receitaMesDelta} deltaLabel="vs últimos 30 dias" />
        <StatCard icon={CreditCard} label="Pagamentos hoje" value={BRL(s?.receitaHoje ?? 0)}
          accent="linear-gradient(135deg,oklch(0.65 0.20 240),oklch(0.55 0.20 250))"
          delta={s?.receitaHojeDelta} deltaLabel="vs ontem" />
        <StatCard icon={MessagesSquare} label="Conversas hoje" value={(s?.conversas ?? 0).toLocaleString("pt-BR")}
          accent="linear-gradient(135deg,oklch(0.65 0.18 200),oklch(0.55 0.18 220))"
          delta={s?.conversasDelta} deltaLabel="vs ontem" />
        <StatCard icon={AlertTriangle} label="Assinaturas vencendo" value={(s?.vencendo ?? 0).toLocaleString("pt-BR")}
          accent="linear-gradient(135deg,oklch(0.78 0.16 80),oklch(0.65 0.22 30))"
          delta={null} deltaLabel="próx. 7 dias" />
        <StatCard icon={Package} label="Conteúdos vendidos" value={(s?.conteudos ?? 0).toLocaleString("pt-BR")}
          accent="linear-gradient(135deg,oklch(0.62 0.22 320),oklch(0.55 0.22 300))"
          delta={s?.conteudosDelta} deltaLabel="vs últimos 30 dias" />
      </div>

      {/* Revenue chart + Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5 bg-card border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Receita nos últimos 30 dias</h3>
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
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Funil de conversão</h3>
            <span className="text-xs text-muted-foreground">Últimos 30 dias</span>
          </div>
          <FunnelChart
            rows={[
              { label: "Visitantes / Iniciaram conversa", value: f.visitantes, color: "oklch(0.62 0.22 295)" },
              { label: "Interessados", value: f.interessados, color: "oklch(0.65 0.20 250)" },
              { label: "Assinaram", value: f.assinaram, color: "oklch(0.65 0.18 200)" },
              { label: "Pagaram", value: f.pagaram, color: "oklch(0.75 0.16 60)" },
            ]}
          />
        </Card>
      </div>

      {/* Recent activity + Quick actions + Recent payments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-5 bg-card border-border">
          <h3 className="font-semibold mb-4">Atividade recente</h3>
          <ul className="space-y-3">
            {(recent.data ?? []).map((a: any) => (
              <li key={a.id} className="flex items-start gap-3 text-sm">
                <div className="h-2 w-2 rounded-full mt-2 bg-primary shrink-0" />
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
          <Link to="/conversas" className="text-xs text-primary hover:underline mt-4 inline-block">
            Ver todas as atividades
          </Link>
        </Card>

        <Card className="p-5 bg-card border-border">
          <h3 className="font-semibold mb-4">Ações rápidas</h3>
          <div className="grid grid-cols-2 gap-3">
            <Link to="/planos" className="p-4 rounded-lg border border-border hover:bg-muted/40 transition flex flex-col gap-2">
              <Plus className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Criar plano</p>
                <p className="text-xs text-muted-foreground">Adicione um novo plano</p>
              </div>
            </Link>
            <Link to="/conteudos" className="p-4 rounded-lg border border-border hover:bg-muted/40 transition flex flex-col gap-2">
              <FileBox className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Novo conteúdo</p>
                <p className="text-xs text-muted-foreground">Publique conteúdos</p>
              </div>
            </Link>
            <Link to="/automacao" className="p-4 rounded-lg border border-border hover:bg-muted/40 transition flex flex-col gap-2">
              <Send className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Enviar mensagem</p>
                <p className="text-xs text-muted-foreground">Envie para assinantes</p>
              </div>
            </Link>
            <Link to="/conversas" className="p-4 rounded-lg border border-border hover:bg-muted/40 transition flex flex-col gap-2">
              <MessagesSquare className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Ver conversas</p>
                <p className="text-xs text-muted-foreground">Acompanhe em tempo real</p>
              </div>
            </Link>
          </div>
        </Card>

        <Card className="p-5 bg-card border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Últimos pagamentos</h3>
            <Link to="/pagamentos" className="text-xs text-primary hover:underline">Ver todos</Link>
          </div>
          <ul className="space-y-3">
            {(recentPayments.data ?? []).map((p: any) => (
              <li key={p.id} className="flex items-center gap-3 text-sm">
                <div className="h-8 w-8 rounded-full bg-muted shrink-0 overflow-hidden flex items-center justify-center">
                  {p.telegram_users?.avatar_url ? (
                    <img src={p.telegram_users.avatar_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <Users className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{p.telegram_users?.first_name ?? "Lead"}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {p.item_type === "plan" ? "Plano" : "Conteúdo"} · {relTime(p.paid_at ?? p.created_at)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold tabular-nums">{BRL(p.amount_cents)}</p>
                  <StatusBadge status={p.status === "paid" ? "approved" : "pending"} />
                </div>
              </li>
            ))}
            {!recentPayments.isLoading && (recentPayments.data?.length ?? 0) === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum pagamento ainda.</p>
            )}
          </ul>
        </Card>
      </div>

      {/* AI status bar */}
      <Card className="p-5 bg-card border-border">
        <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">IA do Bot em ação</h3>
                <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" /> Ativo
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Sua IA atendeu {aiToday.data?.atendidas ?? 0} conversas hoje.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="px-4 py-3 rounded-lg border border-border flex items-center gap-3">
              <MessagesSquare className="h-4 w-4 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Conversas atendidas</p>
                <p className="font-semibold">{aiToday.data?.atendidas ?? 0}</p>
              </div>
            </div>
            <div className="px-4 py-3 rounded-lg border border-border flex items-center gap-3">
              <ThumbsUp className="h-4 w-4 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Satisfação média</p>
                <p className="font-semibold">—</p>
              </div>
            </div>
            <div className="px-4 py-3 rounded-lg border border-border flex items-center gap-3">
              <Clock className="h-4 w-4 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Tempo médio resposta</p>
                <p className="font-semibold">—</p>
              </div>
            </div>
            <Button variant="outline" asChild><Link to="/ia">Configurar IA</Link></Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
