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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Plus, Pencil, Trash2, Workflow } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/automacao")({
  component: Automacao,
});

const typeLabels: Record<string, string> = {
  expiry_reminder: "Lembrete antes do vencimento",
  expiry_today: "Lembrete no dia do vencimento",
  revoke_access: "Remover do grupo após vencimento",
  pix_pending: "Lembrete de Pix pendente",
  pix_expiring: "Aviso antes do Pix expirar",
};

type F = { id?: string; name: string; type: string; timing_value: string; timing_unit: string; message: string; is_active: boolean };
const empty: F = { name: "", type: "expiry_reminder", timing_value: "1", timing_unit: "days", message: "", is_active: true };

function Automacao() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<F>(empty);
  const q = useQuery({
    queryKey: ["automation_rules"],
    queryFn: async () => (await supabase.from("automation_rules").select("*").order("created_at", { ascending: false })).data ?? [],
  });

  function openNew() { setForm(empty); setOpen(true); }
  function openEdit(r: any) {
    setForm({ ...r, timing_value: String(r.timing_value ?? "") });
    setOpen(true);
  }
  async function save() {
    const payload = { ...form, timing_value: parseInt(form.timing_value || "0", 10) };
    delete (payload as any).id;
    const res = form.id
      ? await supabase.from("automation_rules").update(payload).eq("id", form.id)
      : await supabase.from("automation_rules").insert(payload);
    if (res.error) return toast.error(res.error.message);
    setOpen(false); toast.success("Salvo");
    qc.invalidateQueries({ queryKey: ["automation_rules"] });
  }
  async function remove(id: string) {
    if (!confirm("Excluir regra?")) return;
    await supabase.from("automation_rules").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["automation_rules"] });
  }
  async function toggle(r: any) {
    await supabase.from("automation_rules").update({ is_active: !r.is_active }).eq("id", r.id);
    qc.invalidateQueries({ queryKey: ["automation_rules"] });
  }

  return (
    <div>
      <PageHeader title="Automação" subtitle="Regras automáticas para lembretes e revogação de acesso"
        actions={<Button onClick={openNew}><Plus className="h-4 w-4 mr-1"/>Nova regra</Button>} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(q.data ?? []).map((r: any) => (
          <Card key={r.id} className="p-5 bg-card border-border">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-primary/15 text-primary">
                  <Workflow className="h-5 w-5"/>
                </div>
                <div>
                  <h3 className="font-semibold">{r.name}</h3>
                  <p className="text-xs text-muted-foreground">{typeLabels[r.type] ?? r.type}</p>
                </div>
              </div>
              <Switch checked={r.is_active} onCheckedChange={() => toggle(r)}/>
            </div>
            <p className="text-sm mt-3 text-muted-foreground line-clamp-2">{r.message}</p>
            <div className="flex items-center justify-between mt-4">
              <StatusBadge status={r.is_active ? "active" : "inactive"}/>
              <div>
                <Button size="sm" variant="ghost" onClick={() => openEdit(r)}><Pencil className="h-3 w-3 mr-1"/>Editar</Button>
                <Button size="sm" variant="ghost" onClick={() => remove(r.id)}><Trash2 className="h-3 w-3 text-destructive"/></Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{form.id ? "Editar regra" : "Nova regra"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}/></div>
            <div>
              <Label>Tipo</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>
                  {Object.entries(typeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Tempo</Label><Input type="number" value={form.timing_value} onChange={(e) => setForm({ ...form, timing_value: e.target.value })}/></div>
              <div>
                <Label>Unidade</Label>
                <Select value={form.timing_unit} onValueChange={(v) => setForm({ ...form, timing_unit: v })}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minutes">Minutos</SelectItem>
                    <SelectItem value="hours">Horas</SelectItem>
                    <SelectItem value="days">Dias</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Mensagem</Label><Textarea rows={3} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}/></div>
            <div className="flex items-center justify-between p-3 rounded bg-muted">
              <Label>Ativa</Label>
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })}/>
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
