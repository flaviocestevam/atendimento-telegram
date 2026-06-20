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
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/respostas-rapidas")({ component: QuickRepliesPage });

const CATEGORIES = [
  "boas_vindas","como_funciona","preco","pagamento","checkout_cakto",
  "acesso_grupo","entrega_conteudo","suporte","pix_pendente",
  "pos_compra","renovacao","upsell","objecao","outro",
];

function QuickRepliesPage() {
  const qc = useQueryClient();
  const { profileId } = useActiveProfile();
  const list = useQuery({
    enabled: !!profileId,
    queryKey: ["quick_replies", profileId],
    queryFn: async () => (await supabase.from("quick_replies").select("*").eq("seller_profile_id", profileId!).order("category")).data ?? [],
  });
  const [open, setOpen] = useState(false);
  const [f, setF] = useState<any>({ title: "", body: "", category: "outro", type: "text", active: true });

  function newOne() { setF({ title: "", body: "", category: "outro", type: "text", active: true }); setOpen(true); }
  function edit(r: any) { setF(r); setOpen(true); }
  async function save() {
    if (!profileId) return toast.error("Selecione um perfil");
    const payload = { title: f.title, body: f.body, category: f.category, type: f.type, active: f.active };
    const res = f.id
      ? await supabase.from("quick_replies").update(payload).eq("id", f.id).eq("seller_profile_id", profileId)
      : await supabase.from("quick_replies").insert({ ...payload, seller_profile_id: profileId });
    if (res.error) return toast.error(res.error.message);
    setOpen(false); toast.success("Salvo");
    qc.invalidateQueries({ queryKey: ["quick_replies"] });
  }
  async function remove(id: string) {
    if (!confirm("Excluir?")) return;
    await supabase.from("quick_replies").delete().eq("id", id).eq("seller_profile_id", profileId!);
    qc.invalidateQueries({ queryKey: ["quick_replies"] });
  }

  return (
    <div>
      <PageHeader title="Respostas rápidas" subtitle="Mensagens prontas que o admin envia em 1 clique e que a IA pode reaproveitar." actions={<Button onClick={newOne}><Plus className="h-4 w-4 mr-1" />Nova resposta</Button>} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(list.data ?? []).map((r: any) => (
          <Card key={r.id} className="p-5 bg-card border-border">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-semibold">{r.title}</h3>
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground mt-0.5">{r.category}</p>
              </div>
              <StatusBadge status={r.active ? "active" : "inactive"} />
            </div>
            <p className="text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap">{r.body}</p>
            <div className="flex items-center justify-between mt-4">
              <span className="text-[11px] text-muted-foreground">{r.usage_count ?? 0} usos · {r.conversions ?? 0} conversões</span>
              <div className="flex gap-1">
                <Button size="sm" variant="outline" onClick={() => edit(r)}><Pencil className="h-3 w-3" /></Button>
                <Button size="sm" variant="outline" onClick={() => remove(r.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{f.id ? "Editar resposta" : "Nova resposta"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Título</Label><Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Categoria</Label>
                <Select value={f.category} onValueChange={(v) => setF({ ...f, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tipo</Label>
                <Select value={f.type} onValueChange={(v) => setF({ ...f, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["text","link","oferta","suporte","pagamento","pos_compra","objecao","renovacao","upsell"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Corpo da mensagem</Label><Textarea rows={6} value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} /></div>
            <div className="flex items-center justify-between p-3 rounded bg-muted"><Label>Ativa</Label><Switch checked={f.active} onCheckedChange={(v) => setF({ ...f, active: v })} /></div>
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
