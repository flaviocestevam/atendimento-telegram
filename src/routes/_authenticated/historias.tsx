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
import { Plus, Pencil, Trash2, BookOpen } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/historias")({ component: HistoriasPage });

const CATEGORIES = [
  "curiosidade","proximidade","bastidores","transformacao","confianca",
  "urgencia_natural","reativacao","upsell","educacao","relacionamento",
];

function HistoriasPage() {
  const qc = useQueryClient();
  const { profileId } = useActiveProfile();
  const list = useQuery({
    enabled: !!profileId,
    queryKey: ["stories", profileId],
    queryFn: async () => (await supabase.from("stories").select("*").eq("seller_profile_id", profileId!).order("created_at", { ascending: false })).data ?? [],
  });

  const [open, setOpen] = useState(false);
  const [f, setF] = useState<any>({ name: "", category: "curiosidade", description: "", main_angle: "", emotional_angle: "", commercial_goal: "", ia_mode: "off", status: "active", steps: [] });

  function newOne() { setF({ name: "", category: "curiosidade", description: "", main_angle: "", emotional_angle: "", commercial_goal: "", ia_mode: "off", status: "active", steps: [] }); setOpen(true); }
  function edit(r: any) { setF({ ...r, steps: r.steps ?? [] }); setOpen(true); }
  async function save() {
    if (!profileId) return toast.error("Selecione um perfil");
    const payload = {
      name: f.name, category: f.category, description: f.description,
      main_angle: f.main_angle, emotional_angle: f.emotional_angle, commercial_goal: f.commercial_goal,
      ia_mode: f.ia_mode, status: f.status, steps: f.steps,
    };
    const res = f.id
      ? await supabase.from("stories").update(payload).eq("id", f.id).eq("seller_profile_id", profileId)
      : await supabase.from("stories").insert({ ...payload, seller_profile_id: profileId });
    if (res.error) return toast.error(res.error.message);
    setOpen(false); toast.success("História salva"); qc.invalidateQueries({ queryKey: ["stories"] });
  }
  async function remove(id: string) {
    if (!confirm("Excluir?")) return;
    await supabase.from("stories").delete().eq("id", id).eq("seller_profile_id", profileId!);
    qc.invalidateQueries({ queryKey: ["stories"] });
  }
  function addStep() { setF({ ...f, steps: [...f.steps, { message: "", delay_minutes: 0, offer_moment: false }] }); }
  function updateStep(i: number, patch: any) { const s = [...f.steps]; s[i] = { ...s[i], ...patch }; setF({ ...f, steps: s }); }
  function removeStep(i: number) { setF({ ...f, steps: f.steps.filter((_: any, idx: number) => idx !== i) }); }

  return (
    <div>
      <PageHeader title="Histórias" subtitle="Funis narrativos: você conta uma história, a oferta entra no momento certo." actions={<Button onClick={newOne}><Plus className="h-4 w-4 mr-1" />Nova história</Button>} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(list.data ?? []).map((r: any) => (
          <Card key={r.id} className="p-5 bg-card border-border">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-lg flex items-center justify-center" style={{ background: "var(--gradient-brand)" }}>
                  <BookOpen className="h-4 w-4 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold">{r.name}</h3>
                  <p className="text-xs text-muted-foreground capitalize">{r.category.replace("_", " ")}</p>
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
          <Card className="p-8 bg-card border-border col-span-full text-center text-sm text-muted-foreground">Nenhuma história criada. Boas histórias vendem sem parecer venda.</Card>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{f.id ? "Editar história" : "Nova história"}</DialogTitle></DialogHeader>
          <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Nome</Label><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
              <div>
                <Label>Categoria</Label>
                <Select value={f.category} onValueChange={(v) => setF({ ...f, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Descrição</Label><Textarea rows={2} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Ângulo principal</Label><Input value={f.main_angle} onChange={(e) => setF({ ...f, main_angle: e.target.value })} /></div>
              <div><Label>Ângulo emocional</Label><Input value={f.emotional_angle} onChange={(e) => setF({ ...f, emotional_angle: e.target.value })} /></div>
            </div>
            <div><Label>Objetivo comercial</Label><Input value={f.commercial_goal} onChange={(e) => setF({ ...f, commercial_goal: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>IA nesta história</Label>
                <Select value={f.ia_mode} onValueChange={(v) => setF({ ...f, ia_mode: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="off">Desligada</SelectItem>
                    <SelectItem value="suggest">Sugerir</SelectItem>
                    <SelectItem value="auto">Automática</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={f.status} onValueChange={(v) => setF({ ...f, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="active">Ativa</SelectItem><SelectItem value="inactive">Inativa</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2"><Label>Etapas narrativas</Label><Button size="sm" variant="outline" onClick={addStep}><Plus className="h-3 w-3 mr-1" />Etapa</Button></div>
              <div className="space-y-2">
                {f.steps.map((s: any, i: number) => (
                  <div key={i} className="p-3 rounded border border-border bg-muted/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold">Etapa {i + 1}{s.offer_moment ? " · momento da oferta" : ""}</span>
                      <Button size="sm" variant="ghost" onClick={() => removeStep(i)}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                    <Textarea rows={2} placeholder="Mensagem da etapa" value={s.message ?? ""} onChange={(e) => updateStep(i, { message: e.target.value })} />
                    <div className="grid grid-cols-2 gap-2">
                      <Input type="number" placeholder="Delay (min)" value={s.delay_minutes ?? 0} onChange={(e) => updateStep(i, { delay_minutes: parseInt(e.target.value || "0", 10) })} />
                      <label className="flex items-center gap-2 text-xs px-2"><input type="checkbox" checked={!!s.offer_moment} onChange={(e) => updateStep(i, { offer_moment: e.target.checked })} />Momento da oferta</label>
                    </div>
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
