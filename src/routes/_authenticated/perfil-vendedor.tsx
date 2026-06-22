import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/admin/PageHeader";
import { Sparkles, Lock } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/perfil-vendedor")({ component: PerfilPage });

function formatWhen(v?: string | null) {
  if (!v) return "ainda não atualizado pelo Grok";
  try {
    return new Date(v).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return v;
  }
}

function PerfilPage() {
  const qc = useQueryClient();
  const profile = useQuery({
    queryKey: ["seller_profile"],
    queryFn: async () => (await supabase.from("seller_profile").select("*").limit(1).maybeSingle()).data,
  });
  const platform = useQuery({
    queryKey: ["seller_platform_settings"],
    queryFn: async () => (await supabase.from("seller_platform_settings").select("*").limit(1).maybeSingle()).data,
  });

  const [f, setF] = useState<any>(null);
  const [defaultLanguage, setDefaultLanguage] = useState<string>("pt-BR");

  useEffect(() => { if (profile.data && !f) setF(profile.data); }, [profile.data, f]);
  useEffect(() => { if (platform.data?.default_language) setDefaultLanguage(platform.data.default_language); }, [platform.data]);

  async function save() {
    if (!f) return;
    const { error } = await supabase.from("seller_profile").update({
      display_name: f.display_name, avatar_url: f.avatar_url, bio: f.bio,
      public_description: f.public_description,
      away_message: f.away_message, return_message: f.return_message,
      language: defaultLanguage,
    }).eq("id", f.id);
    if (error) return toast.error(error.message);

    if (platform.data?.id) {
      const { error: pErr } = await supabase
        .from("seller_platform_settings")
        .update({ default_language: defaultLanguage })
        .eq("id", platform.data.id);
      if (pErr) return toast.error(pErr.message);
    }
    toast.success("Perfil salvo.");
    qc.invalidateQueries({ queryKey: ["seller_profile"] });
    qc.invalidateQueries({ queryKey: ["seller_platform_settings"] });
  }

  if (profile.isLoading) return <div className="p-6 text-muted-foreground">Carregando...</div>;
  if (!f) return <div className="p-6 text-muted-foreground">Perfil não encontrado.</div>;

  return (
    <div>
      <PageHeader
        title="Perfil do vendedor"
        subtitle="O Grok atende como extensão de você — tom, estilo e regras são aprendidos automaticamente."
        actions={<Button onClick={save}>Salvar</Button>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5 bg-card border-border space-y-4">
          <h3 className="font-semibold">Identidade pública</h3>
          <div><Label>Nome exibido</Label><Input value={f.display_name ?? ""} onChange={(e) => setF({ ...f, display_name: e.target.value })} /></div>
          <div><Label>Avatar (URL)</Label><Input value={f.avatar_url ?? ""} onChange={(e) => setF({ ...f, avatar_url: e.target.value })} /></div>
          <div><Label>Bio curta</Label><Input value={f.bio ?? ""} onChange={(e) => setF({ ...f, bio: e.target.value })} /></div>
          <div><Label>Descrição pública</Label><Textarea rows={3} value={f.public_description ?? ""} onChange={(e) => setF({ ...f, public_description: e.target.value })} /></div>
          <div>
            <Label>Idioma padrão do perfil</Label>
            <Select value={defaultLanguage} onValueChange={setDefaultLanguage}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                <SelectItem value="en">Inglês</SelectItem>
                <SelectItem value="es">Espanhol</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground mt-1">
              O Grok só mudará o idioma de uma conversa após o lead confirmar — nunca por uma palavra solta.
            </p>
          </div>
        </Card>

        <Card className="p-5 bg-card border-border space-y-4">
          <h3 className="font-semibold">Ausência e retorno</h3>
          <div><Label>Mensagem de ausência</Label><Textarea rows={3} value={f.away_message ?? ""} onChange={(e) => setF({ ...f, away_message: e.target.value })} /></div>
          <div><Label>Mensagem de retorno</Label><Textarea rows={3} value={f.return_message ?? ""} onChange={(e) => setF({ ...f, return_message: e.target.value })} /></div>
        </Card>

        <Card className="p-5 bg-card border-border space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h3 className="font-semibold">Regras (mantidas pelo Grok)</h3>
            </div>
            <span className="text-[11px] uppercase tracking-wide text-muted-foreground flex items-center gap-1">
              <Lock className="h-3 w-3" /> Somente leitura
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            O Grok preenche e atualiza essas regras conforme aprende com suas conversas. Você não precisa escrever nada.
          </p>

          <div>
            <div className="flex items-center justify-between mb-1">
              <Label>Regras comerciais</Label>
              <span className="text-[11px] text-muted-foreground">
                Última atualização: {formatWhen(f.commercial_rules_updated_at)}
                {f.commercial_rules_updated_by ? ` · por ${f.commercial_rules_updated_by}` : ""}
              </span>
            </div>
            <Textarea
              rows={5}
              readOnly
              value={f.commercial_rules ?? ""}
              placeholder="O Grok ainda não escreveu regras comerciais. Conforme as conversas acontecerem, ele vai registrar o que funciona aqui."
              className="bg-muted/50 cursor-not-allowed"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <Label>Regras emocionais</Label>
              <span className="text-[11px] text-muted-foreground">
                Última atualização: {formatWhen(f.emotional_rules_updated_at)}
                {f.emotional_rules_updated_by ? ` · por ${f.emotional_rules_updated_by}` : ""}
              </span>
            </div>
            <Textarea
              rows={5}
              readOnly
              value={f.emotional_rules ?? ""}
              placeholder="O Grok ainda não escreveu regras emocionais. Elas aparecem aqui assim que ele identificar padrões nas conversas."
              className="bg-muted/50 cursor-not-allowed"
            />
          </div>
        </Card>
      </div>
    </div>
  );
}
