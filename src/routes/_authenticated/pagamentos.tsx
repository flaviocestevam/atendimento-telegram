import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { BRL, dateTimeBR } from "@/lib/format";
import { Eye, Search, Check, Clock, Circle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/pagamentos")({
  component: Pagamentos,
});

function Pagamentos() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<any>(null);

  const q = useQuery({
    queryKey: ["payments", filter, search],
    queryFn: async () => {
      let qb = supabase
        .from("payments")
        .select("*,orders(id,item_type,plans(name),contents(name),telegram_users(first_name,last_name,username))")
        .order("created_at", { ascending: false })
        .limit(200);
      if (filter !== "all") qb = qb.eq("status", filter);
      const { data } = await qb;
      let list = data ?? [];
      if (search) {
        const s = search.toLowerCase();
        list = list.filter((p: any) =>
          (p.orders?.telegram_users?.first_name ?? "").toLowerCase().includes(s) ||
          (p.provider_payment_id ?? "").toLowerCase().includes(s)
        );
      }
      return list;
    },
  });

  return (
    <div>
      <PageHeader title="Pagamentos" subtitle="Pagamentos Pix recebidos via Mercado Pago" />

      <Card className="p-4 bg-card border-border mb-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <Tabs value={filter} onValueChange={setFilter}>
            <TabsList>
              <TabsTrigger value="all">Todos</TabsTrigger>
              <TabsTrigger value="pending">Pendente</TabsTrigger>
              <TabsTrigger value="approved">Aprovado</TabsTrigger>
              <TabsTrigger value="expired">Vencido</TabsTrigger>
              <TabsTrigger value="cancelled">Cancelado</TabsTrigger>
              <TabsTrigger value="refunded">Reembolsado</TabsTrigger>
              <TabsTrigger value="failed">Falhou</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="relative w-72">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/>
            <Input placeholder="Buscar..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)}/>
          </div>
        </div>
      </Card>

      <Card className="bg-card border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuário</TableHead>
              <TableHead>Item</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>MP Payment ID</TableHead>
              <TableHead>Criado</TableHead>
              <TableHead>Aprovado</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(q.data ?? []).map((p: any) => {
              const item = p.orders?.plans?.name ?? p.orders?.contents?.name ?? "—";
              const user = p.orders?.telegram_users;
              return (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{user?.first_name} {user?.last_name}</TableCell>
                  <TableCell>{item}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{p.orders?.item_type === "plan" ? "Plano" : "Conteúdo"}</TableCell>
                  <TableCell className="text-right font-semibold">{BRL(p.amount_cents)}</TableCell>
                  <TableCell><StatusBadge status={p.status}/></TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{p.provider_payment_id}</TableCell>
                  <TableCell className="text-xs">{dateTimeBR(p.created_at)}</TableCell>
                  <TableCell className="text-xs">{dateTimeBR(p.approved_at)}</TableCell>
                  <TableCell><Button size="icon" variant="ghost" onClick={() => setSelected(p)}><Eye className="h-4 w-4"/></Button></TableCell>
                </TableRow>
              );
            })}
            {!q.isLoading && (q.data?.length ?? 0) === 0 && (
              <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-10">Nenhum pagamento.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>Detalhes do pagamento</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-xs text-muted-foreground">Valor</p><p className="font-semibold text-lg">{BRL(selected.amount_cents)}</p></div>
                <div><p className="text-xs text-muted-foreground">Status</p><StatusBadge status={selected.status}/></div>
                <div><p className="text-xs text-muted-foreground">Provider</p><p>{selected.provider}</p></div>
                <div><p className="text-xs text-muted-foreground">MP ID</p><p className="font-mono text-xs">{selected.provider_payment_id}</p></div>
                <div className="col-span-2"><p className="text-xs text-muted-foreground">Pix copia e cola</p>
                  <Input readOnly value={selected.pix_qr_code ?? ""} className="font-mono text-xs"/></div>
              </div>

              <div>
                <p className="text-sm font-semibold mb-3">Linha do tempo</p>
                <Timeline status={selected.status} approvedAt={selected.approved_at} createdAt={selected.created_at}/>
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
    { label: "Pix gerado", done: true, at: createdAt },
    { label: "Aguardando pagamento", done: status !== "pending", at: createdAt, current: status === "pending" },
    { label: "Pagamento aprovado", done: status === "approved", at: approvedAt },
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
            {s.done ? <Check className="h-3 w-3"/> : s.current ? <Clock className="h-3 w-3"/> : <Circle className="h-3 w-3"/>}
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
