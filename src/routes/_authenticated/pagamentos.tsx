import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useActiveProfile } from "@/lib/active-profile";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { BRL, dateTimeBR } from "@/lib/format";
import { Eye, Search, Check, Clock, Circle, Link2, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/pagamentos")({ component: Pagamentos });

function Pagamentos() {
  const qc = useQueryClient();
  const { profileId } = useActiveProfile();
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<any>(null);

  const payments = useQuery({
    enabled: !!profileId,
    queryKey: ["payments", profileId, filter, search],
    queryFn: async () => {
      let qb = supabase
        .from("payments")
        .select("*,orders(id,item_type,plans(name),contents(name),telegram_users(first_name,last_name,username))")
        .eq("seller_profile_id", profileId!)
        .order("created_at", { ascending: false })
        .limit(200);
      if (filter !== "all") qb = qb.eq("status", filter);
      const { data } = await qb;
      let list = data ?? [];
      if (search) {
        const s = search.toLowerCase();
        list = list.filter((p: any) =>
          (p.orders?.telegram_users?.first_name ?? "").toLowerCase().includes(s) ||
          (p.cakto_payment_id ?? "").toLowerCase().includes(s) ||
          (p.cakto_order_id ?? "").toLowerCase().includes(s)
        );
      }
      return list;
    },
  });

  const events = useQuery({
    enabled: !!profileId,
    queryKey: ["cakto_events_unlinked", profileId],
    queryFn: async () => (await supabase.from("cakto_events").select("*").eq("seller_profile_id", profileId!).eq("action", "pending").order("received_at", { ascending: false }).limit(100)).data ?? [],
  });

  async function ignoreEvent(id: string) {
    await supabase.from("cakto_events").update({ action: "ignored" }).eq("id", id).eq("seller_profile_id", profileId!);
    qc.invalidateQueries({ queryKey: ["cakto_events_unlinked"] });
  }
  async function reprocessEvent(id: string) {
    await supabase.from("cakto_events").update({ action: "reprocessed" }).eq("id", id).eq("seller_profile_id", profileId!);
    toast.info("Marcado para reprocessamento. Configure o webhook da Cakto para ativar reprocessamento automático.");
    qc.invalidateQueries({ queryKey: ["cakto_events_unlinked"] });
  }

  const [reconciling, setReconciling] = useState(false);
  async function reconcile() {
    if (!profileId) return;
    setReconciling(true);
    try {
      const { reconcileCakto } = await import("@/lib/cakto.functions");
      const res: any = await reconcileCakto({ data: { sellerProfileId: profileId, limit: 100 } });
      toast.success(`Reconciliação: ${res?.processed ?? 0} eventos processados`);
      qc.invalidateQueries({ queryKey: ["payments"] });
      qc.invalidateQueries({ queryKey: ["cakto_events_unlinked"] });
    } catch (e: any) {
      toast.error("Falha ao reconciliar: " + (e?.message ?? e));
    } finally {
      setReconciling(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Pagamentos"
        subtitle="Pagamentos recebidos via Cakto e eventos pendentes de vinculação"
        actions={<Button variant="outline" size="sm" onClick={reconcile} disabled={reconciling}><RefreshCw className={"h-4 w-4 mr-2 " + (reconciling ? "animate-spin" : "")} />Reconciliar Cakto</Button>}
      />


      <Tabs defaultValue="payments">
        <TabsList>
          <TabsTrigger value="payments">Pagamentos</TabsTrigger>
          <TabsTrigger value="events">
            Eventos Cakto não vinculados
            {(events.data?.length ?? 0) > 0 && (
              <span className="ml-2 px-1.5 py-0.5 text-[10px] rounded-md bg-warning/20 text-warning border border-warning/30">{events.data?.length}</span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="payments" className="mt-4">
          <Card className="p-4 bg-card border-border mb-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <Tabs value={filter} onValueChange={setFilter}>
                <TabsList>
                  <TabsTrigger value="all">Todos</TabsTrigger>
                  <TabsTrigger value="pending">Pendente</TabsTrigger>
                  <TabsTrigger value="checkout_sent">Checkout enviado</TabsTrigger>
                  <TabsTrigger value="approved">Aprovado</TabsTrigger>
                  <TabsTrigger value="expired">Vencido</TabsTrigger>
                  <TabsTrigger value="cancelled">Cancelado</TabsTrigger>
                  <TabsTrigger value="refunded">Reembolsado</TabsTrigger>
                  <TabsTrigger value="failed">Falhou</TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="relative w-72">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Nome, ID Cakto..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>
          </Card>

          <Card className="bg-card border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lead</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Cakto Payment</TableHead>
                  <TableHead>Criado</TableHead>
                  <TableHead>Aprovado</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(payments.data ?? []).map((p: any) => {
                  const item = p.orders?.plans?.name ?? p.orders?.contents?.name ?? "—";
                  const user = p.orders?.telegram_users;
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{user?.first_name} {user?.last_name}</TableCell>
                      <TableCell>{item}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{p.orders?.item_type === "plan" ? "Plano" : "Conteúdo"}</TableCell>
                      <TableCell className="text-right font-semibold">{BRL(p.amount_cents)}</TableCell>
                      <TableCell><StatusBadge status={p.status} /></TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{p.cakto_payment_id ?? p.provider_payment_id ?? "—"}</TableCell>
                      <TableCell className="text-xs">{dateTimeBR(p.created_at)}</TableCell>
                      <TableCell className="text-xs">{p.approved_at ? dateTimeBR(p.approved_at) : "—"}</TableCell>
                      <TableCell><Button size="icon" variant="ghost" onClick={() => setSelected(p)}><Eye className="h-4 w-4" /></Button></TableCell>
                    </TableRow>
                  );
                })}
                {!payments.isLoading && (payments.data?.length ?? 0) === 0 && (
                  <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-10">Nenhum pagamento.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="mt-4">
          <Card className="bg-card border-border overflow-hidden">
            <div className="p-4 border-b border-border text-sm text-muted-foreground">
              Eventos recebidos do webhook da Cakto que não foram automaticamente vinculados a um pagamento. Vincule manualmente, reprocesse ou ignore.
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Recebido em</TableHead>
                  <TableHead>Comprador</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Status Cakto</TableHead>
                  <TableHead>External ref</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(events.data ?? []).map((e: any) => (
                  <TableRow key={e.id}>
                    <TableCell className="text-xs">{dateTimeBR(e.received_at)}</TableCell>
                    <TableCell>{e.buyer_email ?? "—"}</TableCell>
                    <TableCell className="text-right">{e.amount ? BRL(Math.round(Number(e.amount) * 100)) : "—"}</TableCell>
                    <TableCell><StatusBadge status={e.status ?? "pending"} /></TableCell>
                    <TableCell className="font-mono text-xs">{e.external_reference ?? "—"}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" onClick={() => toast.info("Vincular: selecione o pedido manual quando a integração Cakto estiver ativa.") }><Link2 className="h-3 w-3 mr-1" />Vincular</Button>
                        <Button size="sm" variant="outline" onClick={() => reprocessEvent(e.id)}><RefreshCw className="h-3 w-3" /></Button>
                        <Button size="sm" variant="outline" onClick={() => ignoreEvent(e.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {(events.data?.length ?? 0) === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-10">Nenhum evento pendente.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>Detalhes do pagamento</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-xs text-muted-foreground">Valor</p><p className="font-semibold text-lg">{BRL(selected.amount_cents)}</p></div>
                <div><p className="text-xs text-muted-foreground">Status</p><StatusBadge status={selected.status} /></div>
                <div><p className="text-xs text-muted-foreground">Cakto Order</p><p className="font-mono text-xs">{selected.cakto_order_id ?? "—"}</p></div>
                <div><p className="text-xs text-muted-foreground">Cakto Payment</p><p className="font-mono text-xs">{selected.cakto_payment_id ?? "—"}</p></div>
                {selected.checkout_url && (
                  <div className="col-span-2"><p className="text-xs text-muted-foreground">Link de checkout</p>
                    <Input readOnly value={selected.checkout_url} className="font-mono text-xs" /></div>
                )}
              </div>

              <div>
                <p className="text-sm font-semibold mb-3">Linha do tempo</p>
                <Timeline status={selected.status} approvedAt={selected.approved_at} createdAt={selected.created_at} />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Timeline({ status, approvedAt, createdAt }: { status: string; approvedAt: string | null; createdAt: string }) {
  const steps = [
    { label: "Pedido criado", done: true, at: createdAt },
    { label: "Checkout Cakto enviado", done: ["checkout_sent", "approved", "expired", "cancelled", "refunded"].includes(status), at: createdAt, current: status === "checkout_sent" },
    { label: "Aguardando pagamento", done: status === "approved" || status === "refunded", at: createdAt, current: status === "pending" },
    { label: "Pagamento aprovado", done: status === "approved" || status === "refunded", at: approvedAt },
    { label: "Acesso liberado", done: status === "approved", at: approvedAt },
    { label: "Conteúdo entregue", done: status === "approved", at: approvedAt },
  ];
  return (
    <ol className="space-y-3">
      {steps.map((s, i) => (
        <li key={i} className="flex items-start gap-3">
          <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${
            s.done ? "bg-success/20 text-success border border-success/40" :
            s.current ? "bg-warning/20 text-warning border border-warning/40" :
            "bg-muted text-muted-foreground border border-border"
          }`}>
            {s.done ? <Check className="h-3 w-3" /> : s.current ? <Clock className="h-3 w-3" /> : <Circle className="h-3 w-3" />}
          </div>
          <div className="flex-1">
            <p className={`text-sm ${s.done ? "font-medium" : "text-muted-foreground"}`}>{s.label}</p>
            <p className="text-xs text-muted-foreground">{s.at ? dateTimeBR(s.at) : "—"}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
