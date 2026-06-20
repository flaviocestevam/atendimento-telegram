import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useActiveProfile } from "@/lib/active-profile";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { BuyerTierBadge } from "@/components/admin/BuyerTierBadge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BRL, dateTimeBR } from "@/lib/format";
import { Search } from "lucide-react";

export const Route = createFileRoute("/_authenticated/leads")({ component: LeadsPage });

const statusFilters = [
  { id: "all", label: "Todos" },
  { id: "new", label: "Novos" },
  { id: "in_conversation", label: "Em conversa" },
  { id: "checkout_sent", label: "Checkout enviado" },
  { id: "pix_pending", label: "Pix pendente" },
  { id: "buyer", label: "Compradores" },
  { id: "subscriber_active", label: "Assinantes" },
  { id: "ready_upsell", label: "Pronto p/ upsell" },
  { id: "inactive", label: "Inativos" },
  { id: "blocked", label: "Bloqueados" },
];

function LeadsPage() {
  const { profileId } = useActiveProfile();
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const leads = useQuery({
    enabled: !!profileId,
    queryKey: ["leads", profileId, filter, search],
    queryFn: async () => {
      let q = supabase
        .from("telegram_users")
        .select("id,first_name,last_name,username,telegram_id,status,temperature,score_buy,total_spent,tags,last_interaction:updated_at,last_purchase_at")
        .eq("seller_profile_id", profileId!)
        .order("updated_at", { ascending: false })
        .limit(100);
      if (filter !== "all") q = q.eq("status", filter as any);
      const { data } = await q;
      const list = data ?? [];
      if (!search) return list;
      const s = search.toLowerCase();
      return list.filter((l: any) =>
        (l.first_name ?? "").toLowerCase().includes(s) ||
        (l.username ?? "").toLowerCase().includes(s) ||
        String(l.telegram_id ?? "").includes(s)
      );
    },
  });

  return (
    <div>
      <PageHeader title="Leads" subtitle="CRM de todos os contatos que passaram pelo bot" />

      <div className="flex items-center justify-between mb-3 gap-3">
        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList className="flex-wrap h-auto">
            {statusFilters.map((f) => <TabsTrigger key={f.id} value={f.id}>{f.label}</TabsTrigger>)}
          </TabsList>
        </Tabs>
        <div className="relative w-64">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Nome, @user, ID..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      <Card className="bg-card border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Lead</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Temperatura</TableHead>
              <TableHead className="text-right">Score</TableHead>
              <TableHead className="text-right">Total gasto</TableHead>
              <TableHead>Última compra</TableHead>
              <TableHead>Tags</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(leads.data ?? []).map((l: any) => (
              <TableRow key={l.id} className="cursor-pointer hover:bg-muted/40">
                <TableCell>
                  <Link to="/conversas" className="block">
                    <div className="font-medium">{l.first_name} {l.last_name}</div>
                    <div className="text-xs text-muted-foreground">@{l.username ?? l.telegram_id}</div>
                  </Link>
                </TableCell>
                <TableCell><StatusBadge status={l.status} /></TableCell>
                <TableCell><StatusBadge status={l.temperature} /></TableCell>
                <TableCell className="text-right font-mono">{l.score_buy ?? 0}</TableCell>
                <TableCell className="text-right">{BRL((l.total_spent ?? 0) * 100)}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{l.last_purchase_at ? dateTimeBR(l.last_purchase_at) : "—"}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{(l.tags ?? []).join(", ") || "—"}</TableCell>
              </TableRow>
            ))}
            {!leads.isLoading && (leads.data?.length ?? 0) === 0 && (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nenhum lead ainda.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
