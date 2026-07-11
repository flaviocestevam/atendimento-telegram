import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useActiveProfile } from "@/lib/active-profile";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { BRL, dateBR } from "@/lib/format";
import { MoreVertical, Search, Pause, TrendingDown, X, Heart } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { requestCancellation, recordRetentionOutcome } from "@/lib/cakto.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/assinantes")({
  component: Assinantes,
});

function Assinantes() {
  const { profileId } = useActiveProfile();
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const q = useQuery({
    enabled: !!profileId,
    queryKey: ["assinantes", profileId, filter, search],
    queryFn: async () => {
      const sp = profileId!;
      const { data: users } = await supabase
        .from("telegram_users")
        .select("*")
        .eq("seller_profile_id", sp)
        .order("created_at", { ascending: false });

      const { data: grants } = await supabase
        .from("access_grants")
        .select("telegram_user_id,expires_at,status,plans(name)")
        .eq("seller_profile_id", sp)
        .eq("status", "active");

      const { data: orders } = await supabase
        .from("orders")
        .select("telegram_user_id,amount_cents,status,paid_at")
        .eq("seller_profile_id", sp);

      const list = (users ?? []).map((u: any) => {
        const g = (grants ?? []).find((g: any) => g.telegram_user_id === u.id);
        const totalPago = (orders ?? []).filter((o: any) => o.telegram_user_id === u.id && o.status === "paid").reduce((s: number, o: any) => s + o.amount_cents, 0);
        const ultimo = (orders ?? []).filter((o: any) => o.telegram_user_id === u.id && o.paid_at).sort((a: any, b: any) => +new Date(b.paid_at) - +new Date(a.paid_at))[0];
        let status: string = "no_purchase";
        if (u.is_blocked) status = "blocked";
        else if (g) status = "active";
        else if (totalPago > 0) status = "expired";
        return { ...u, status, plano: g?.plans?.name ?? "—", vencimento: g?.expires_at, totalPago, ultimo: ultimo?.paid_at };
      });
      return list.filter((r: any) => {
        if (filter !== "all" && r.status !== filter) return false;
        if (search) {
          const s = search.toLowerCase();
          return (r.first_name ?? "").toLowerCase().includes(s) || (r.username ?? "").toLowerCase().includes(s) || r.telegram_id.includes(s);
        }
        return true;
      });
    },
  });

  return (
    <div>
      <PageHeader title="Assinantes" subtitle="Usuários do Telegram cadastrados no bot" />

      <Card className="p-4 bg-card border-border mb-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <Tabs value={filter} onValueChange={setFilter}>
            <TabsList>
              <TabsTrigger value="all">Todos</TabsTrigger>
              <TabsTrigger value="active">Ativo</TabsTrigger>
              <TabsTrigger value="expired">Vencido</TabsTrigger>
              <TabsTrigger value="blocked">Bloqueado</TabsTrigger>
              <TabsTrigger value="no_purchase">Sem compra</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="relative w-72">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar nome, @username, ID..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
        </div>
      </Card>

      <Card className="bg-card border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>@Username</TableHead>
              <TableHead>Telegram ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Plano</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead className="text-right">Total pago</TableHead>
              <TableHead>Último pagamento</TableHead>
              <TableHead>Cadastro</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(q.data ?? []).map((r: any) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.first_name} {r.last_name}</TableCell>
                <TableCell className="text-muted-foreground">@{r.username ?? "—"}</TableCell>
                <TableCell className="font-mono text-xs">{r.telegram_id}</TableCell>
                <TableCell><StatusBadge status={r.status === "no_purchase" ? "inactive" : r.status} /></TableCell>
                <TableCell>{r.plano}</TableCell>
                <TableCell>{dateBR(r.vencimento)}</TableCell>
                <TableCell className="text-right font-semibold">{BRL(r.totalPago)}</TableCell>
                <TableCell>{dateBR(r.ultimo)}</TableCell>
                <TableCell className="text-muted-foreground text-xs">{dateBR(r.created_at)}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4"/></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Ver perfil</DropdownMenuItem>
                      <DropdownMenuItem>Prorrogar acesso</DropdownMenuItem>
                      <DropdownMenuItem>Remover acesso</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">Bloquear</DropdownMenuItem>
                      <DropdownMenuItem>Ver pagamentos</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {!q.isLoading && (q.data?.length ?? 0) === 0 && (
              <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground py-10">Nenhum assinante encontrado.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
