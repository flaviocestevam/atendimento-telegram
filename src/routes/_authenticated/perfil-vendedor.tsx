import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/admin/PageHeader";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/perfil-vendedor")({ component: PerfilPage });

function PerfilPage() {
  const profile = useQuery({
    queryKey: ["seller_profile"],
    queryFn: async () => (await supabase.from("seller_profile").select("*").limit(1).maybeSingle()).data,
  });
  const [f, setF] = useState<any>(null);
  useEffect(() => { if (profile.data && !f) setF(profile.data); }, [profile.data, f]);

  async function save() {
    if (!f) return;
    const { error } = await supabase.from("seller_profile").update({
      display_name: f.display_name, avatar_url: f.avatar_url, bio: f.bio,
      public_description: f.public_description, voice_tone: f.voice_tone,
      informality: f.informality, use_slang: f.use_slang, short_messages: f.short_messages,
      split_messages: f.split_messages, use_pauses: f.use_pauses, allow_typos: f.allow_typos,
      typo_rate: f.typo_rate, away_message: f.away_message, return_message: f.return_message,
      commercial_rules: f.commercial_rules, emotional_rules: f.emotional_rules,
      language: f.language,
    }).eq("id", f.id);
    if (error) return toast.error(error.message);
    toast.success("Perfil salvo. O Grok vai usar essas regras quando estiver ligado.");
  }

  if (!f) return <div>Carregando...</div>;

  return (
    <div>
      <PageHeader title="Perfil do vendedor" subtitle="A IA atende como extensão de você — defina o tom, regras e estilo." actions={<Button onClick={save}>Salvar</Button>} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5 bg-card border-border space-y-4">
          <h3 className="font-semibold">Identidade pública</h3>
          <div><Label>Nome exibido</Label><Input value={f.display_name ?? ""} onChange={(e) => setF({ ...f, display_name: e.target.value })} /></div>
          <div><Label>Avatar (URL)</Label><Input value={f.avatar_url ?? ""} onChange={(e) => setF({ ...f, avatar_url: e.target.value })} /></div>
          <div><Label>Bio curta</Label><Input value={f.bio ?? ""} onChange={(e) => setF({ ...f, bio: e.target.value })} /></div>
          <div><Label>Descrição pública</Label><Textarea rows={3} value={f.public_description ?? ""} onChange={(e) => setF({ ...f, public_description: e.target.value })} /></div>
          <div><Label>Idioma</Label><Input value={f.language ?? "pt-BR"} onChange={(e) => setF({ ...f, language: e.target.value })} /></div>
        </Card>

        <Card className="p-5 bg-card border-border space-y-4">
          <h3 className="font-semibold">Tom e estilo</h3>
          <div><Label>Tom de voz</Label><Input value={f.voice_tone ?? ""} onChange={(e) => setF({ ...f, voice_tone: e.target.value })} placeholder="natural, próximo, direto, sedutor, etc." /></div>
          <div>
            <Label>Nível de informalidade ({f.informality}/10)</Label>
            <input type="range" min={0} max={10} value={f.informality ?? 5} onChange={(e) => setF({ ...f, informality: parseInt(e.target.value, 10) })} className="w-full" />
          </div>
          {[
            ["use_slang", "Usar gírias"],
            ["short_messages", "Mensagens curtas"],
            ["split_messages", "Dividir resposta em várias mensagens"],
            ["use_pauses", "Usar pausas entre mensagens"],
            ["allow_typos", "Permitir pequenos erros ocasionais"],
          ].map(([k, label]) => (
            <div key={k} className="flex items-center justify-between p-2 rounded bg-muted">
              <Label>{label}</Label>
              <Switch checked={!!f[k as string]} onCheckedChange={(v) => setF({ ...f, [k as string]: v })} />
            </div>
          ))}
          {f.allow_typos && (
            <div><Label>Frequência de erros ({f.typo_rate}%)</Label>
              <input type="range" min={0} max={20} value={f.typo_rate ?? 0} onChange={(e) => setF({ ...f, typo_rate: parseInt(e.target.value, 10) })} className="w-full" />
            </div>
          )}
        </Card>

        <Card className="p-5 bg-card border-border space-y-4 lg:col-span-2">
          <h3 className="font-semibold">Ausência e retorno</h3>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Mensagem de ausência</Label><Textarea rows={3} value={f.away_message ?? ""} onChange={(e) => setF({ ...f, away_message: e.target.value })} /></div>
            <div><Label>Mensagem de retorno</Label><Textarea rows={3} value={f.return_message ?? ""} onChange={(e) => setF({ ...f, return_message: e.target.value })} /></div>
          </div>
        </Card>

        <Card className="p-5 bg-card border-border space-y-4 lg:col-span-2">
          <h3 className="font-semibold">Regras (alimentam o Grok)</h3>
          <div><Label>Regras comerciais</Label><Textarea rows={5} value={f.commercial_rules ?? ""} onChange={(e) => setF({ ...f, commercial_rules: e.target.value })} placeholder="Quando oferecer, quando esperar, quais produtos priorizar..." /></div>
          <div><Label>Regras emocionais</Label><Textarea rows={5} value={f.emotional_rules ?? ""} onChange={(e) => setF({ ...f, emotional_rules: e.target.value })} placeholder="Como tratar, assuntos sensíveis, quando puxar memória..." /></div>
        </Card>
      </div>
    </div>
  );
}
