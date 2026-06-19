import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
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
import { Bot, Sparkles, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/ia")({
  component: IAPage,
});

function IAPage() {
  const qc = useQueryClient();
  const settings = useQuery({
    queryKey: ["ai_settings"],
    queryFn: async () => (await supabase.from("ai_settings").select("*").limit(1).maybeSingle()).data,
  });
  const kb = useQuery({
    queryKey: ["knowledge_base"],
    queryFn: async () => (await supabase.from("knowledge_base").select("*").order("created_at", { ascending: false })).data ?? [],
  });

  const [form, setForm] = useState<any>(null);
  useEffect(() => { if (settings.data && !form) setForm(settings.data); }, [settings.data, form]);

  const [testInput, setTestInput] = useState("Quais são os planos disponíveis?");
  const [testOutput, setTestOutput] = useState("");

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

  function runTest() {
    setTestOutput(form?.enable_ai
      ? "Para responder com a IA real, configure a XAI_API_KEY em Configurações. Esta é uma resposta de preview baseada no prompt configurado."
      : form?.fallback_message ?? "IA desativada.");
  }

  // Knowledge base CRUD
  const [kbOpen, setKbOpen] = useState(false);
  const [kbForm, setKbForm] = useState<{ id?: string; title: string; content: string; is_active: boolean }>({ title: "", content: "", is_active: true });
  function newKb() { setKbForm({ title: "", content: "", is_active: true }); setKbOpen(true); }
  function editKb(k: any) { setKbForm(k); setKbOpen(true); }
  async function saveKb() {
    const res = kbForm.id
      ? await supabase.from("knowledge_base").update({ title: kbForm.title, content: kbForm.content, is_active: kbForm.is_active }).eq("id", kbForm.id)
      : await supabase.from("knowledge_base").insert({ title: kbForm.title, content: kbForm.content, is_active: kbForm.is_active });
    if (res.error) return toast.error(res.error.message);
    setKbOpen(false); toast.success("Salvo");
    qc.invalidateQueries({ queryKey: ["knowledge_base"] });
  }
  async function removeKb(id: string) {
    if (!confirm("Excluir?")) return;
    await supabase.from("knowledge_base").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["knowledge_base"] });
  }

  return (
    <div>
      <PageHeader title="IA do Bot" subtitle="Comportamento do assistente automático no Telegram" />

      <Tabs defaultValue="settings">
        <TabsList>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
          <TabsTrigger value="kb">Base de conhecimento</TabsTrigger>
          <TabsTrigger value="test">Teste rápido</TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="mt-4">
          {form && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card className="lg:col-span-2 p-5 bg-card border-border space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Provedor</Label>
                    <Select value={form.provider} onValueChange={(v) => setForm({ ...form, provider: v })}>
                      <SelectTrigger><SelectValue/></SelectTrigger>
                      <SelectContent><SelectItem value="xai">xAI / Grok</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Modelo</Label>
                    <Select value={form.model} onValueChange={(v) => setForm({ ...form, model: v })}>
                      <SelectTrigger><SelectValue/></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="grok-2">grok-2</SelectItem>
                        <SelectItem value="grok-3">grok-3</SelectItem>
                        <SelectItem value="grok-4">grok-4</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div><Label>Tom de voz</Label><Input value={form.tone ?? ""} onChange={(e) => setForm({ ...form, tone: e.target.value })}/></div>
                <div>
                  <Label>Prompt do sistema</Label>
                  <Textarea rows={10} value={form.system_prompt ?? ""} onChange={(e) => setForm({ ...form, system_prompt: e.target.value })} className="font-mono text-xs"/>
                </div>
                <div><Label>Mensagem de fallback</Label><Textarea rows={2} value={form.fallback_message ?? ""} onChange={(e) => setForm({ ...form, fallback_message: e.target.value })}/></div>
                <div><Label>Máx. mensagens por usuário/dia</Label><Input type="number" value={form.max_messages_per_user_per_day} onChange={(e) => setForm({ ...form, max_messages_per_user_per_day: parseInt(e.target.value || "0", 10) })}/></div>
                <div className="flex justify-end"><Button onClick={saveSettings}>Salvar configurações</Button></div>
              </Card>

              <div className="space-y-4">
                <Card className="p-5 bg-card border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{ background: "var(--gradient-brand)" }}>
                        <Bot className="h-5 w-5 text-primary-foreground"/>
                      </div>
                      <div>
                        <p className="font-semibold">IA ativa</p>
                        <p className="text-xs text-muted-foreground">Responde automaticamente no bot</p>
                      </div>
                    </div>
                    <Switch checked={!!form.enable_ai} onCheckedChange={(v) => setForm({ ...form, enable_ai: v })}/>
                  </div>
                </Card>
                <Card className="p-5 bg-card border-border">
                  <p className="font-semibold mb-2">Regras obrigatórias</p>
                  <ul className="text-xs text-muted-foreground space-y-1.5 list-disc pl-4">
                    <li>Nunca liberar acesso sem pagamento aprovado.</li>
                    <li>Nunca inventar links.</li>
                    <li>Nunca afirmar pagamento aprovado sem consultar o sistema.</li>
                    <li>Transferir para humano quando solicitado.</li>
                    <li>Responder com fallback se não souber.</li>
                  </ul>
                </Card>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="kb" className="mt-4">
          <div className="flex justify-end mb-3"><Button onClick={newKb}><Plus className="h-4 w-4 mr-1"/>Nova entrada</Button></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(kb.data ?? []).map((k: any) => (
              <Card key={k.id} className="p-5 bg-card border-border">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold">{k.title}</h3>
                  <StatusBadge status={k.is_active ? "active" : "inactive"}/>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-3">{k.content}</p>
                <div className="flex gap-2 mt-4">
                  <Button size="sm" variant="outline" onClick={() => editKb(k)}><Pencil className="h-3 w-3 mr-1"/>Editar</Button>
                  <Button size="sm" variant="outline" onClick={() => removeKb(k.id)}><Trash2 className="h-3 w-3 text-destructive"/></Button>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="test" className="mt-4">
          <Card className="p-5 bg-card border-border max-w-2xl">
            <Label>Pergunta do usuário</Label>
            <Textarea rows={3} value={testInput} onChange={(e) => setTestInput(e.target.value)} className="mt-1"/>
            <Button className="mt-3" onClick={runTest}><Sparkles className="h-4 w-4 mr-1"/>Simular resposta</Button>
            {testOutput && (
              <div className="mt-4 p-4 rounded-lg bg-primary/10 border border-primary/20">
                <p className="text-xs uppercase tracking-wide text-primary mb-1">Resposta do bot</p>
                <p className="text-sm">{testOutput}</p>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={kbOpen} onOpenChange={setKbOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{kbForm.id ? "Editar entrada" : "Nova entrada"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Título</Label><Input value={kbForm.title} onChange={(e) => setKbForm({ ...kbForm, title: e.target.value })}/></div>
            <div><Label>Conteúdo</Label><Textarea rows={6} value={kbForm.content} onChange={(e) => setKbForm({ ...kbForm, content: e.target.value })}/></div>
            <div className="flex items-center justify-between p-3 rounded bg-muted">
              <Label>Ativa</Label>
              <Switch checked={kbForm.is_active} onCheckedChange={(v) => setKbForm({ ...kbForm, is_active: v })}/>
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
