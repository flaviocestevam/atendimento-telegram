import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useActiveProfile } from "@/lib/active-profile";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Plus, Trash2, CalendarClock } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/postagens")({ component: PostagensPage });

function toLocalInputValue(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function PostagensPage() {
  const qc = useQueryClient();
  const { profileId } = useActiveProfile();

  const posts = useQuery({
    enabled: !!profileId,
    queryKey: ["scheduled_posts", profileId],
    queryFn: async () =>
      (await supabase
        .from("scheduled_posts")
        .select("*, telegram_groups(name)")
        .eq("seller_profile_id", profileId!)
        .order("scheduled_at", { ascending: false })
        .limit(200)).data ?? [],
  });

  const groups = useQuery({
    enabled: !!profileId,
    queryKey: ["telegram_groups_active", profileId],
    queryFn: async () =>
      (await supabase
        .from("telegram_groups")
        .select("id, name, status")
        .eq("seller_profile_id", profileId!)
        .order("name")).data ?? [],
  });

  const [open, setOpen] = useState(false);
  const emptyForm = { message: "", scheduled_at: toLocalInputValue(new Date(Date.now() + 30 * 60_000).toISOString()), telegram_group_id: "" as string | "" };
  const [form, setForm] = useState(emptyForm);

  async function save() {
    if (!profileId) return toast.error("Selecione um perfil");
    if (!form.message.trim()) return toast.error("Mensagem obrigatória");
    const iso = new Date(form.scheduled_at).toISOString();
    const { error } = await supabase.from("scheduled_posts").insert({
      seller_profile_id: profileId,
      telegram_group_id: form.telegram_group_id || null,
      message: form.message,
      scheduled_at: iso,
      status: "scheduled",
    });
    if (error) return toast.error(error.message);
    setOpen(false);
    setForm(emptyForm);
    toast.success("Postagem agendada");
    qc.invalidateQueries({ queryKey: ["scheduled_posts"] });
  }

  async function remove(id: string) {
    if (!confirm("Excluir esta postagem?")) return;
    await supabase.from("scheduled_posts").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["scheduled_posts"] });
  }

  async function cancel(id: string) {
    await supabase.from("scheduled_posts").update({ status: "canceled" }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["scheduled_posts"] });
  }

  return (
    <div>
      <PageHeader
        title="Postagens agendadas"
        subtitle="Envie mensagens automáticas para os grupos do Telegram no horário certo."
        actions={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" />Nova postagem</Button>}
      />

      <Card className="bg-card border-border overflow-hidden">
        <div className="divide-y divide-border">
          {(posts.data ?? []).map((p: any) => (
            <div key={p.id} className="p-4 grid grid-cols-12 gap-3 items-center">
              <div className="col-span-4 min-w-0">
                <p className="text-sm line-clamp-2">{p.message}</p>
              </div>
              <div className="col-span-3 text-xs">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <CalendarClock className="h-3 w-3" />
                  {new Date(p.scheduled_at).toLocaleString("pt-BR")}
                </div>
                {p.sent_at && <div className="text-muted-foreground mt-1">Enviado: {new Date(p.sent_at).toLocaleString("pt-BR")}</div>}
              </div>
              <div className="col-span-2 text-xs text-muted-foreground">{p.telegram_groups?.name ?? "Todos os grupos ativos"}</div>
              <div className="col-span-2"><StatusBadge status={p.status} />{p.error && <div className="text-[11px] text-destructive mt-1">{p.error}</div>}</div>
              <div className="col-span-1 flex justify-end gap-1">
                {p.status === "scheduled" && (
                  <Button size="sm" variant="outline" onClick={() => cancel(p.id)}>Cancelar</Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => remove(p.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
              </div>
            </div>
          ))}
          {(posts.data?.length ?? 0) === 0 && (
            <div className="p-8 text-center text-sm text-muted-foreground">Nenhuma postagem agendada ainda.</div>
          )}
        </div>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova postagem agendada</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Mensagem</Label>
              <Textarea rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="O que enviar no grupo..." />
            </div>
            <div>
              <Label>Data e hora</Label>
              <Input type="datetime-local" value={form.scheduled_at} onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })} />
            </div>
            <div>
              <Label>Grupo de destino</Label>
              <Select value={form.telegram_group_id || "all"} onValueChange={(v) => setForm({ ...form, telegram_group_id: v === "all" ? "" : v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os grupos ativos</SelectItem>
                  {(groups.data ?? []).map((g: any) => (
                    <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">
              O sistema verifica postagens vencidas a cada minuto e envia usando o bot deste perfil.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save}>Agendar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
