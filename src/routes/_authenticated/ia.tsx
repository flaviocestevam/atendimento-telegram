import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useActiveProfile } from "@/lib/active-profile";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Bot, Sparkles, Plus, Pencil, Trash2, AlertCircle, CheckCircle2, Search } from "lucide-react";
import { toast } from "sonner";
import { SECRETS_STATUS } from "@/lib/config";

export const Route = createFileRoute("/_authenticated/ia")({ component: IAPage });

const GROK_MODES = [
  { v: "off", label: "Desligado", help: "Sistema 100% manual. Grok não é chamado." },
  { v: "suggest", label: "Apenas sugerir", help: "Grok gera sugestões dentro da conversa; admin decide enviar." },
  { v: "auto_per_funnel", label: "Automático por funil", help: "Grok só responde sozinho nos funis com IA habilitada." },
  { v: "auto_all", label: "Automático total", help: "Grok responde sozinho em todas as conversas permitidas." },
];

function IAPage() {
  const qc = useQueryClient();
  const { profileId } = useActiveProfile();
  const settings = useQuery({
    enabled: !!profileId,
    queryKey: ["ai_settings", profileId],
    queryFn: async () => (await supabase.from("ai_settings").select("*").eq("seller_profile_id", profileId!).limit(1).maybeSingle()).data,
  });
  const kb = useQuery({
    enabled: !!profileId,
    queryKey: ["knowledge_base", profileId],
    queryFn: async () => (await supabase.from("knowledge_base").select("*").eq("seller_profile_id", profileId!).order("created_at", { ascending: false })).data ?? [],
  });
  const objections = useQuery({
    enabled: !!profileId,
    queryKey: ["objections", profileId],
    queryFn: async () => (await supabase.from("objections").select("*, leads(display_name, telegram_user_id, telegram_users(username))").eq("seller_profile_id", profileId!).order("created_at", { ascending: false }).limit(50)).data ?? [],
  });
  const learnings = useQuery({
    enabled: !!profileId,
    queryKey: ["ai_learnings", profileId],
    queryFn: async () => (await supabase.from("ai_learnings").select("*").eq("seller_profile_id", profileId!).eq("status", "pending").order("created_at", { ascending: false })).data ?? [],
  });

  const [form, setForm] = useState<any>(null);
  useEffect(() => { setForm(settings.data ?? null); }, [settings.data, profileId]);

  const xaiConfigured = SECRETS_STATUS.xai;

  async function saveGrokMode(mode: string) {
    if (!form) return;
    setForm({ ...form, grok_global_mode: mode });
    const { error } = await supabase.from("ai_settings").update({ grok_global_mode: mode as any }).eq("id", form.id);
    if (error) return toast.error(error.message);
    toast.success("Modo do Grok atualizado");
  }

  async function saveSettings() {
    if (!form) return;
    const { error } = await supabase.from("ai_settings").update({
      provider: form.provider, model: form.model, system_prompt: form.system_prompt,
      tone: form.tone, fallback_message: form.fallback_message,
      enable_ai: form.enable_ai, max_messages_per_user_per_day: form.max_messages_per_user_per_day,
    }).eq("id", form.id);
    if (error) return toast.error(error.message);
    toast.success("Configurações da IA atualizadas");
  }

  // Knowledge base CRUD
  const [kbOpen, setKbOpen] = useState(false);
  const [kbForm, setKbForm] = useState<{ id?: string; title: string; content: string; is_active: boolean }>({ title: "", content: "", is_active: true });
  function newKb() { setKbForm({ title: "", content: "", is_active: true }); setKbOpen(true); }
  function editKb(k: any) { setKbForm(k); setKbOpen(true); }
  async function saveKb() {
    if (!profileId) return toast.error("Selecione um perfil");
    const res = kbForm.id
      ? await supabase.from("knowledge_base").update({ title: kbForm.title, content: kbForm.content, is_active: kbForm.is_active }).eq("id", kbForm.id).eq("seller_profile_id", profileId)
      : await supabase.from("knowledge_base").insert({ title: kbForm.title, content: kbForm.content, is_active: kbForm.is_active, seller_profile_id: profileId });
    if (res.error) return toast.error(res.error.message);
    setKbOpen(false); toast.success("Salvo");
    qc.invalidateQueries({ queryKey: ["knowledge_base"] });
  }
  async function removeKb(id: string) {
    if (!confirm("Excluir?")) return;
    await supabase.from("knowledge_base").delete().eq("id", id).eq("seller_profile_id", profileId!);
    qc.invalidateQueries({ queryKey: ["knowledge_base"] });
  }

  if (settings.isLoading) return <div className="p-6 text-muted-foreground">Carregando...</div>;
  if (!form) return <div className="p-6 text-muted-foreground">Nenhuma configuração de IA encontrada para este perfil.</div>;

  return (
    <div>
      <PageHeader title="IA / Grok" subtitle="A IA é opcional. O sistema funciona completo mesmo com o Grok desligado." />

      {/* Status do Grok — sempre visível */}
      <Card className="p-5 bg-card border-border mb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl flex items-center justify-center" style={{ background: "var(--gradient-brand)", boxShadow: "var(--shadow-glow)" }}>
              <Bot className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <p className="font-semibold">Atendimento automático com Grok</p>
              <p className="text-xs text-muted-foreground">{GROK_MODES.find((m) => m.v === form.grok_global_mode)?.help}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Select value={form.grok_global_mode} onValueChange={saveGrokMode}>
              <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
              <SelectContent>
                {GROK_MODES.map((m) => <SelectItem key={m.v} value={m.v}>{m.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
          <div className="p-3 rounded-lg bg-muted">
            <p className="text-[11px] uppercase text-muted-foreground mb-1">Chave xAI</p>
            <div className="flex items-center gap-2 text-sm font-semibold">
              {xaiConfigured ? <><CheckCircle2 className="h-4 w-4 text-success" />Configurada</> : <><AlertCircle className="h-4 w-4 text-warning" />Não configurada</>}
            </div>
          </div>
          <div className="p-3 rounded-lg bg-muted">
            <p className="text-[11px] uppercase text-muted-foreground mb-1">Mensagens hoje</p>
            <p className="text-lg font-semibold">{form.messages_today ?? 0}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted">
            <p className="text-[11px] uppercase text-muted-foreground mb-1">Custo estimado</p>
            <p className="text-lg font-semibold">R$ {((form.cost_estimate_cents ?? 0) / 100).toFixed(2)}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted">
            <p className="text-[11px] uppercase text-muted-foreground mb-1">Modelo</p>
            <p className="text-sm font-semibold">{form.model ?? "grok-2"}</p>
          </div>
        </div>

        {!xaiConfigured && form.grok_global_mode !== "off" && (
          <div className="mt-4 p-3 rounded-lg bg-warning/10 border border-warning/30 text-sm text-warning flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5" />
            <div>O Grok está ligado mas a chave xAI não foi configurada. As respostas automáticas ficarão pausadas até a chave ser adicionada nos segredos do projeto.</div>
          </div>
        )}
      </Card>

      <Tabs defaultValue="settings">
        <TabsList>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
          <TabsTrigger value="objections">Objeções</TabsTrigger>
          <TabsTrigger value="learnings">Aprendizado</TabsTrigger>
          <TabsTrigger value="kb">Base de conhecimento</TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2 p-5 bg-card border-border space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Provedor</Label>
                  <Select value={form.provider} onValueChange={(v) => setForm({ ...form, provider: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="xai">xAI / Grok</SelectItem></SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Modelo</Label>
                  <Select value={form.model} onValueChange={(v) => setForm({ ...form, model: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="grok-2">grok-2</SelectItem>
                      <SelectItem value="grok-3">grok-3</SelectItem>
                      <SelectItem value="grok-4">grok-4</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label>Prompt do sistema</Label>
                <Textarea rows={10} value={form.system_prompt ?? ""} onChange={(e) => setForm({ ...form, system_prompt: e.target.value })} className="font-mono text-xs" />
              </div>
              <div><Label>Mensagem de fallback</Label><Textarea rows={2} value={form.fallback_message ?? ""} onChange={(e) => setForm({ ...form, fallback_message: e.target.value })} /></div>
              <div><Label>Máx. mensagens por usuário/dia</Label><Input type="number" value={form.max_messages_per_user_per_day} onChange={(e) => setForm({ ...form, max_messages_per_user_per_day: parseInt(e.target.value || "0", 10) })} /></div>
              <div className="flex justify-end"><Button onClick={saveSettings}>Salvar configurações</Button></div>
            </Card>

            <Card className="p-5 bg-card border-border">
              <p className="font-semibold mb-3">Regras obrigatórias da IA</p>
              <ul className="text-xs text-muted-foreground space-y-2 list-disc pl-4">
                <li>Nunca liberar acesso sem pagamento aprovado.</li>
                <li>Nunca entregar conteúdo pago sem confirmação de pagamento.</li>
                <li>Nunca dizer que o Pix foi pago sem consultar o sistema.</li>
                <li>Nunca inventar desconto, garantia, prova social, benefício, produto ou preço.</li>
                <li>Nunca prometer resultado.</li>
                <li>Se perguntarem se é IA, responder com transparência.</li>
                <li>Se detectar necessidade humana, marcar conversa como "precisa de humano".</li>
                <li>Respeitar tom, idioma e regras do perfil da influenciadora.</li>
              </ul>
              <p className="text-[11px] text-muted-foreground mt-3">Essas regras são aplicadas antes de cada resposta automática.</p>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="objections" className="mt-4">
          <Card className="bg-card border-border overflow-hidden">
            <div className="p-4 border-b border-border"><p className="text-sm text-muted-foreground">Objeções detectadas em conversas reais. A IA usa esses padrões para preparar respostas melhores.</p></div>
            <div className="divide-y divide-border">
              {(objections.data ?? []).map((o: any) => (
                <div key={o.id} className="p-4 grid grid-cols-12 gap-3 items-center">
                  <div className="col-span-3">
                    {(() => {
                      const username = o.leads?.telegram_users?.username as string | undefined;
                      const name = o.leads?.display_name as string | undefined;
                      const searchTerm = username || name || "";
                      const label = name || (username ? `@${username}` : "Lead");
                      return searchTerm ? (
                        <Link
                          to="/conversas"
                          search={{ user: searchTerm }}
                          className="font-medium text-primary hover:underline"
                        >
                          {label}
                        </Link>
                      ) : (
                        <div className="font-medium">Lead</div>
                      );
                    })()}
                    <div className="text-xs text-muted-foreground">@{o.leads?.telegram_users?.username ?? "—"}</div>
                  </div>


                  <div className="col-span-2"><StatusBadge status={o.status} /></div>
                  <div className="col-span-2 text-xs"><span className="text-muted-foreground">Tipo:</span> <span className="font-medium">{o.type}</span></div>
                  <div className="col-span-2 text-xs"><span className="text-muted-foreground">Confiança:</span> {Math.round((o.confidence ?? 0) * 100)}%</div>
                  <div className="col-span-3 text-xs text-muted-foreground line-clamp-2">{o.suggested_reply ?? "—"}</div>
                </div>
              ))}
              {(objections.data?.length ?? 0) === 0 && <div className="p-8 text-center text-sm text-muted-foreground">Nenhuma objeção registrada ainda.</div>}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="learnings" className="mt-4">
          <Card className="bg-card border-border overflow-hidden">
            <div className="p-4 border-b border-border"><p className="text-sm text-muted-foreground">Sugestões da IA esperando aprovação. Você decide quais virar regra.</p></div>
            <div className="divide-y divide-border">
              {(learnings.data ?? []).map((l: any) => (
                <div key={l.id} className="p-4 flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{l.kind}</p>
                    <p className="text-sm mt-1">{l.content}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={async () => { await supabase.from("ai_learnings").update({ status: "approved" }).eq("id", l.id); qc.invalidateQueries({ queryKey: ["ai_learnings"] }); }}>Aprovar</Button>
                    <Button size="sm" variant="outline" onClick={async () => { await supabase.from("ai_learnings").update({ status: "rejected" }).eq("id", l.id); qc.invalidateQueries({ queryKey: ["ai_learnings"] }); }}>Descartar</Button>
                  </div>
                </div>
              ))}
              {(learnings.data?.length ?? 0) === 0 && <div className="p-8 text-center text-sm text-muted-foreground">Nenhum aprendizado pendente.</div>}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="kb" className="mt-4">
          <div className="flex justify-end mb-3"><Button onClick={newKb}><Plus className="h-4 w-4 mr-1" />Nova entrada</Button></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(kb.data ?? []).map((k: any) => (
              <Card key={k.id} className="p-5 bg-card border-border">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold">{k.title}</h3>
                  <StatusBadge status={k.is_active ? "active" : "inactive"} />
                </div>
                <p className="text-sm text-muted-foreground line-clamp-3">{k.content}</p>
                <div className="flex gap-2 mt-4">
                  <Button size="sm" variant="outline" onClick={() => editKb(k)}><Pencil className="h-3 w-3 mr-1" />Editar</Button>
                  <Button size="sm" variant="outline" onClick={() => removeKb(k.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={kbOpen} onOpenChange={setKbOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{kbForm.id ? "Editar entrada" : "Nova entrada"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Título</Label><Input value={kbForm.title} onChange={(e) => setKbForm({ ...kbForm, title: e.target.value })} /></div>
            <div><Label>Conteúdo</Label><Textarea rows={6} value={kbForm.content} onChange={(e) => setKbForm({ ...kbForm, content: e.target.value })} /></div>
            <div className="flex items-center justify-between p-3 rounded bg-muted">
              <Label>Ativa</Label>
              <Switch checked={kbForm.is_active} onCheckedChange={(v) => setKbForm({ ...kbForm, is_active: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setKbOpen(false)}>Cancelar</Button>
            <Button onClick={saveKb}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
