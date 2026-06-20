import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useActiveProfile } from "@/lib/active-profile";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Plus, Pencil, Trash2, Wifi, Link2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/grupos")({
  component: Grupos,
});

type F = { id?: string; name: string; chat_id: string; type: "group" | "channel"; bot_is_admin: boolean; status: string; default_invite_link: string };
const empty: F = { name: "", chat_id: "", type: "group", bot_is_admin: false, status: "active", default_invite_link: "" };

function Grupos() {
  const qc = useQueryClient();
  const { profileId } = useActiveProfile();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<F>(empty);
  const q = useQuery({
    enabled: !!profileId,
    queryKey: ["telegram_groups", profileId],
    queryFn: async () => (await supabase.from("telegram_groups").select("*").eq("seller_profile_id", profileId!).order("created_at", { ascending: false })).data ?? [],
  });

  function openNew() { setForm(empty); setOpen(true); }
  function openEdit(g: any) { setForm({ ...g, default_invite_link: g.default_invite_link ?? "" }); setOpen(true); }
  async function save() {
    if (!profileId) return toast.error("Selecione um perfil");
    const payload = { ...form, default_invite_link: form.default_invite_link || null };
    const res = form.id
      ? await supabase.from("telegram_groups").update(payload).eq("id", form.id).eq("seller_profile_id", profileId)
      : await supabase.from("telegram_groups").insert({ ...payload, seller_profile_id: profileId });
    if (res.error) return toast.error(res.error.message);
    toast.success("Salvo"); setOpen(false);
    qc.invalidateQueries({ queryKey: ["telegram_groups"] });
  }
  async function remove(id: string) {
    if (!confirm("Excluir grupo?")) return;
    await supabase.from("telegram_groups").delete().eq("id", id).eq("seller_profile_id", profileId!);
    qc.invalidateQueries({ queryKey: ["telegram_groups"] });
  }

  return (
    <div>
      <PageHeader title="Grupos Telegram" subtitle="Grupos e canais conectados ao bot"
        actions={<Button onClick={openNew}><Plus className="h-4 w-4 mr-1"/>Novo</Button>}/>

      <Card className="bg-card border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Chat ID</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Bot admin</TableHead>
              <TableHead>Status</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(q.data ?? []).map((g: any) => (
              <TableRow key={g.id}>
                <TableCell className="font-medium">{g.name}</TableCell>
                <TableCell className="font-mono text-xs">{g.chat_id}</TableCell>
                <TableCell className="capitalize">{g.type === "group" ? "Grupo" : "Canal"}</TableCell>
                <TableCell><StatusBadge status={g.bot_is_admin ? "active" : "inactive"}/></TableCell>
                <TableCell><StatusBadge status={g.status}/></TableCell>
                <TableCell className="text-right">
                  <Button size="icon" variant="ghost" title="Testar conexão" onClick={() => toast.info("Bot Telegram não conectado. Configure o token em Configurações.")}><Wifi className="h-4 w-4"/></Button>
                  <Button size="icon" variant="ghost" title="Gerar link" onClick={() => toast.info("Conecte o bot para gerar links de convite.")}><Link2 className="h-4 w-4"/></Button>
                  <Button size="icon" variant="ghost" onClick={() => openEdit(g)}><Pencil className="h-4 w-4"/></Button>
                  <Button size="icon" variant="ghost" onClick={() => remove(g.id)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                </TableCell>
              </TableRow>
            ))}
            {!q.isLoading && (q.data?.length ?? 0) === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-10">Nenhum grupo cadastrado.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{form.id ? "Editar grupo" : "Novo grupo / canal"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nome interno</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}/></div>
            <div><Label>Chat ID</Label><Input value={form.chat_id} onChange={(e) => setForm({ ...form, chat_id: e.target.value })} placeholder="-1001234567890" className="font-mono"/></div>
            <div>
              <Label>Tipo</Label>
              <Select value={form.type} onValueChange={(v: any) => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="group">Grupo</SelectItem>
                  <SelectItem value="channel">Canal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Link padrão (opcional)</Label><Input value={form.default_invite_link} onChange={(e) => setForm({ ...form, default_invite_link: e.target.value })}/></div>
            <div className="flex items-center justify-between p-3 rounded bg-muted">
              <Label>Bot é administrador</Label>
              <Switch checked={form.bot_is_admin} onCheckedChange={(v) => setForm({ ...form, bot_is_admin: v })}/>
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
