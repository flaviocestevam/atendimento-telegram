import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { BRL } from "@/lib/format";
import { Plus, Pencil, Trash2, Package } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/planos")({
  component: Planos,
});

type Form = {
  id?: string;
  name: string; description: string;
  price_reais: string; duration_days: string;
  access_type: "group" | "channel";
  telegram_group_id: string | null;
  post_purchase_message: string; is_active: boolean;
};

const empty: Form = { name: "", description: "", price_reais: "", duration_days: "30", access_type: "group", telegram_group_id: null, post_purchase_message: "", is_active: true };

function Planos() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Form>(empty);

  const plans = useQuery({
    queryKey: ["plans"],
    queryFn: async () => (await supabase.from("plans").select("*,telegram_groups(name)").order("price_cents")).data ?? [],
  });
  const groups = useQuery({
    queryKey: ["telegram_groups-min"],
    queryFn: async () => (await supabase.from("telegram_groups").select("id,name,type")).data ?? [],
  });

  function openNew() { setForm(empty); setOpen(true); }
  function openEdit(p: any) {
    setForm({
      id: p.id, name: p.name, description: p.description ?? "",
      price_reais: (p.price_cents / 100).toFixed(2),
      duration_days: String(p.duration_days), access_type: p.access_type,
      telegram_group_id: p.telegram_group_id, post_purchase_message: p.post_purchase_message ?? "", is_active: p.is_active,
    });
    setOpen(true);
  }

  async function save() {
    const payload = {
      name: form.name,
      description: form.description || null,
      price_cents: Math.round(parseFloat(form.price_reais || "0") * 100),
      duration_days: parseInt(form.duration_days || "0", 10),
      access_type: form.access_type,
      telegram_group_id: form.telegram_group_id,
      post_purchase_message: form.post_purchase_message || null,
      is_active: form.is_active,
    };
    const res = form.id
      ? await supabase.from("plans").update(payload).eq("id", form.id)
      : await supabase.from("plans").insert(payload);
    if (res.error) return toast.error(res.error.message);
    toast.success(form.id ? "Plano atualizado" : "Plano criado");
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["plans"] });
  }

  async function remove(id: string) {
    if (!confirm("Excluir este plano?")) return;
    const { error } = await supabase.from("plans").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Plano excluído");
    qc.invalidateQueries({ queryKey: ["plans"] });
  }

  return (
    <div>
      <PageHeader
        title="Planos"
        subtitle="Planos de assinatura por dias com acesso a grupo ou canal"
        actions={<Button onClick={openNew}><Plus className="h-4 w-4 mr-1"/>Novo plano</Button>}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {(plans.data ?? []).map((p: any) => (
          <Card key={p.id} className="p-5 bg-card border-border relative overflow-hidden">
            <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-20" style={{ background: "var(--gradient-brand)" }}/>
            <div className="flex items-center justify-between relative">
              <Package className="h-5 w-5 text-primary" />
              <StatusBadge status={p.is_active ? "active" : "inactive"} />
            </div>
            <h3 className="font-bold text-lg mt-3">{p.name}</h3>
            <p className="text-xs text-muted-foreground line-clamp-2 min-h-[2rem]">{p.description}</p>
            <div className="mt-3">
              <div className="text-3xl font-bold" style={{ backgroundImage: "var(--gradient-brand)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                {BRL(p.price_cents)}
              </div>
              <div className="text-xs text-muted-foreground">{p.duration_days} dias · {p.access_type === "group" ? "Grupo" : "Canal"}</div>
            </div>
            <div className="text-xs text-muted-foreground mt-2 truncate">→ {p.telegram_groups?.name ?? "Sem grupo"}</div>
            <div className="flex gap-2 mt-4">
              <Button size="sm" variant="outline" className="flex-1" onClick={() => openEdit(p)}><Pencil className="h-3 w-3 mr-1"/>Editar</Button>
              <Button size="sm" variant="outline" onClick={() => remove(p.id)}><Trash2 className="h-3 w-3 text-destructive"/></Button>
            </div>
          </Card>
        ))}
        {!plans.isLoading && (plans.data?.length ?? 0) === 0 && (
          <Card className="p-10 col-span-full text-center bg-card border-border border-dashed">
            <Package className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">Nenhum plano cadastrado.</p>
            <Button className="mt-4" onClick={openNew}><Plus className="h-4 w-4 mr-1"/>Criar primeiro plano</Button>
          </Card>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{form.id ? "Editar plano" : "Novo plano"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}/></div>
            <div><Label>Descrição</Label><Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}/></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Preço (R$)</Label><Input type="number" step="0.01" value={form.price_reais} onChange={(e) => setForm({ ...form, price_reais: e.target.value })}/></div>
              <div><Label>Duração (dias)</Label><Input type="number" value={form.duration_days} onChange={(e) => setForm({ ...form, duration_days: e.target.value })}/></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tipo de acesso</Label>
                <Select value={form.access_type} onValueChange={(v: any) => setForm({ ...form, access_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="group">Grupo</SelectItem>
                    <SelectItem value="channel">Canal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Grupo/Canal</Label>
                <Select value={form.telegram_group_id ?? "none"} onValueChange={(v) => setForm({ ...form, telegram_group_id: v === "none" ? null : v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {(groups.data ?? []).map((g: any) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Mensagem pós-compra</Label><Textarea rows={2} value={form.post_purchase_message} onChange={(e) => setForm({ ...form, post_purchase_message: e.target.value })}/></div>
            <div className="flex items-center justify-between p-3 rounded bg-muted">
              <Label>Plano ativo</Label>
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
