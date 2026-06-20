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
import { Plus, Pencil, Trash2, GitBranch } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/funis")({ component: FunisPage });

function FunisPage() {
  const qc = useQueryClient();
  const { profileId } = useActiveProfile();
  const list = useQuery({
    enabled: !!profileId,
    queryKey: ["funnels", profileId],
    queryFn: async () => (await supabase.from("funnels").select("*").eq("seller_profile_id", profileId!).order("created_at", { ascending: false })).data ?? [],
  });

  const [open, setOpen] = useState(false);
  const [f, setF] = useState<any>({ name: "", description: "", goal: "", type: "comercial", status: "active", ia_mode: "off", steps: [] });

  function newOne() { setF({ name: "", description: "", goal: "", type: "comercial", status: "active", ia_mode: "off", steps: [] }); setOpen(true); }
  function edit(r: any) { setF({ ...r, steps: r.steps ?? [] }); setOpen(true); }
  async function save() {
    if (!profileId) return toast.error("Selecione um perfil");
    const payload = { name: f.name, description: f.description, goal: f.goal, type: f.type, status: f.status, ia_mode: f.ia_mode, steps: f.steps };
    const res = f.id
      ? await supabase.from("funnels").update(payload).eq("id", f.id).eq("seller_profile_id", profileId)
      : await supabase.from("funnels").insert({ ...payload, seller_profile_id: profileId });
    if (res.error) return toast.error(res.error.message);
    setOpen(false); toast.success("Funil salvo"); qc.invalidateQueries({ queryKey: ["funnels"] });
  }
  async function remove(id: string) {
    if (!confirm("Excluir funil?")) return;
    await supabase.from("funnels").delete().eq("id", id).eq("seller_profile_id", profileId!);
    qc.invalidateQueries({ queryKey: ["funnels"] });
  }
  function addStep() { setF({ ...f, steps: [...f.steps, { message: "", delay_minutes: 0 }] }); }
  function updateStep(i: number, patch: any) { const s = [...f.steps]; s[i] = { ...s[i], ...patch }; setF({ ...f, steps: s }); }
  function removeStep(i: number) { setF({ ...f, steps: f.steps.filter((_: any, idx: number) => idx !== i) }); }

  return (
    <div>
      <PageHeader title="Funis" subtitle="Sequências comerciais manuais ou com IA opcional." actions={<Button onClick={newOne}><Plus className="h-4 w-4 mr-1" />Novo funil</Button>} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(list.data ?? []).map((r: any) => (
          <Card key={r.id} className="p-5 bg-card border-border">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-lg flex items-center justify-center" style={{ background: "var(--gradient-brand)" }}>
                  <GitBranch className="h-4 w-4 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold">{r.name}</h3>
                  <p className="text-xs text-muted-foreground">{r.type}</p>
                </div>
              </div>
              <StatusBadge status={r.status} />
            </div>
            <p className="text-sm text-muted-foreground mt-3 line-clamp-2">{r.description}</p>
            <div className="grid grid-cols-3 gap-2 text-xs mt-4">
              <div className="p-2 rounded bg-muted"><span className="text-muted-foreground">Etapas</span><div className="font-semibold">{r.steps?.length ?? 0}</div></div>
              <div className="p-2 rounded bg-muted"><span className="text-muted-foreground">IA</span><div className="font-semibold">{r.ia_mode}</div></div>
              <div className="p-2 rounded bg-muted"><span className="text-muted-foreground">Leads</span><div className="font-semibold">{r.metrics?.leads ?? 0}</div></div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button size="sm" variant="outline" className="flex-1" onClick={() => edit(r)}><Pencil className="h-3 w-3 mr-1" />Editar</Button>
              <Button size="sm" variant="outline" onClick={() => remove(r.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
            </div>
          </Card>
        ))}
        {!list.isLoading && (list.data?.length ?? 0) === 0 && (
          <Card className="p-8 bg-card border-border col-span-full text-center text-sm text-muted-foreground">Nenhum funil ainda. Crie o primeiro para começar a guiar leads automaticamente.</Card>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{f.id ? "Editar funil" : "Novo funil"}</DialogTitle></DialogHeader>
          <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Nome</Label><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
              <div><Label>Tipo</Label><Input value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })} /></div>
            </div>
            <div><Label>Objetivo</Label><Input value={f.goal} onChange={(e) => setF({ ...f, goal: e.target.value })} /></div>
            <div><Label>Descrição</Label><Textarea rows={2} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>IA nesse funil</Label>
                <Select value={f.ia_mode} onValueChange={(v) => setF({ ...f, ia_mode: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="off">Desligada</SelectItem>
                    <SelectItem value="suggest">Apenas sugerir</SelectItem>
                    <SelectItem value="auto">Automática</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={f.status} onValueChange={(v) => setF({ ...f, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2"><Label>Etapas</Label><Button size="sm" variant="outline" onClick={addStep}><Plus className="h-3 w-3 mr-1" />Etapa</Button></div>
              <div className="space-y-2">
                {f.steps.map((s: any, i: number) => (
                  <div key={i} className="p-3 rounded border border-border bg-muted/30 space-y-2">
                    <div className="flex items-center justify-between"><span className="text-xs font-semibold">Etapa {i + 1}</span><Button size="sm" variant="ghost" onClick={() => removeStep(i)}><Trash2 className="h-3 w-3" /></Button></div>
                    <Textarea rows={2} placeholder="Mensagem" value={s.message ?? ""} onChange={(e) => updateStep(i, { message: e.target.value })} />
                    <Input type="number" placeholder="Delay (minutos)" value={s.delay_minutes ?? 0} onChange={(e) => updateStep(i, { delay_minutes: parseInt(e.target.value || "0", 10) })} />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button onClick={save}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
