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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { BRL } from "@/lib/format";
import { Plus, Pencil, Trash2, FileText, Link2, FileBox, Lock } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/conteudos")({
  component: Conteudos,
});

type F = {
  id?: string; name: string; description: string; price_reais: string;
  delivery_type: "text" | "link" | "file" | "private_area";
  delivery_payload: string; lifetime_access: boolean; access_duration_days: string; is_active: boolean;
};
const empty: F = { name: "", description: "", price_reais: "", delivery_type: "link", delivery_payload: "", lifetime_access: true, access_duration_days: "30", is_active: true };

const icons = { text: FileText, link: Link2, file: FileBox, private_area: Lock };
const labels = { text: "Texto", link: "Link", file: "Arquivo", private_area: "Área privada" };

function Conteudos() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<F>(empty);

  const q = useQuery({
    queryKey: ["contents"],
    queryFn: async () => (await supabase.from("contents").select("*").order("created_at", { ascending: false })).data ?? [],
  });

  function openNew() { setForm(empty); setOpen(true); }
  function openEdit(c: any) {
    setForm({
      id: c.id, name: c.name, description: c.description ?? "",
      price_reais: (c.price_cents / 100).toFixed(2),
      delivery_type: c.delivery_type, delivery_payload: c.delivery_payload ?? "",
      lifetime_access: c.lifetime_access, access_duration_days: String(c.access_duration_days ?? 30), is_active: c.is_active,
    });
    setOpen(true);
  }
  async function save() {
    const payload = {
      name: form.name, description: form.description || null,
      price_cents: Math.round(parseFloat(form.price_reais || "0") * 100),
      delivery_type: form.delivery_type, delivery_payload: form.delivery_payload || null,
      lifetime_access: form.lifetime_access,
      access_duration_days: form.lifetime_access ? null : parseInt(form.access_duration_days || "30", 10),
      is_active: form.is_active,
    };
    const res = form.id
      ? await supabase.from("contents").update(payload).eq("id", form.id)
      : await supabase.from("contents").insert(payload);
    if (res.error) return toast.error(res.error.message);
    toast.success("Salvo");
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["contents"] });
  }
  async function remove(id: string) {
    if (!confirm("Excluir?")) return;
    await supabase.from("contents").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["contents"] });
  }

  return (
    <div>
      <PageHeader title="Conteúdos" subtitle="Produtos digitais entregues automaticamente"
        actions={<Button onClick={openNew}><Plus className="h-4 w-4 mr-1"/>Novo conteúdo</Button>} />

      <Card className="bg-card border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Conteúdo</TableHead>
              <TableHead>Tipo de entrega</TableHead>
              <TableHead>Acesso</TableHead>
              <TableHead className="text-right">Preço</TableHead>
              <TableHead>Status</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(q.data ?? []).map((c: any) => {
              const Icon = icons[c.delivery_type as keyof typeof icons];
              return (
                <TableRow key={c.id}>
                  <TableCell>
                    <div className="font-medium">{c.name}</div>
                    <div className="text-xs text-muted-foreground line-clamp-1">{c.description}</div>
                  </TableCell>
                  <TableCell><span className="inline-flex items-center gap-2 text-sm"><Icon className="h-4 w-4 text-primary"/>{labels[c.delivery_type as keyof typeof labels]}</span></TableCell>
                  <TableCell className="text-sm">{c.lifetime_access ? "Vitalício" : `${c.access_duration_days} dias`}</TableCell>
                  <TableCell className="text-right font-semibold">{BRL(c.price_cents)}</TableCell>
                  <TableCell><StatusBadge status={c.is_active ? "active" : "inactive"} /></TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(c)}><Pencil className="h-4 w-4"/></Button>
                    <Button size="icon" variant="ghost" onClick={() => remove(c.id)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                  </TableCell>
                </TableRow>
              );
            })}
            {!q.isLoading && (q.data?.length ?? 0) === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-10">Nenhum conteúdo cadastrado.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{form.id ? "Editar conteúdo" : "Novo conteúdo"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nome interno</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}/></div>
            <div><Label>Descrição</Label><Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}/></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Preço (R$)</Label><Input type="number" step="0.01" value={form.price_reais} onChange={(e) => setForm({ ...form, price_reais: e.target.value })}/></div>
              <div>
                <Label>Tipo de entrega</Label>
                <Select value={form.delivery_type} onValueChange={(v: any) => setForm({ ...form, delivery_type: v })}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Texto</SelectItem>
                    <SelectItem value="link">Link</SelectItem>
                    <SelectItem value="file">Arquivo</SelectItem>
                    <SelectItem value="private_area">Área privada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Conteúdo de entrega</Label><Textarea rows={3} value={form.delivery_payload} onChange={(e) => setForm({ ...form, delivery_payload: e.target.value })} placeholder="URL, texto, nome do arquivo..."/></div>
            <div className="flex items-center justify-between p-3 rounded bg-muted">
              <Label>Acesso vitalício</Label>
              <Switch checked={form.lifetime_access} onCheckedChange={(v) => setForm({ ...form, lifetime_access: v })}/>
            </div>
            {!form.lifetime_access && (
              <div><Label>Prazo de acesso (dias)</Label><Input type="number" value={form.access_duration_days} onChange={(e) => setForm({ ...form, access_duration_days: e.target.value })}/></div>
            )}
            <div className="flex items-center justify-between p-3 rounded bg-muted">
              <Label>Conteúdo ativo</Label>
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
