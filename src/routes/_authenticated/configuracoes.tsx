import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/admin/PageHeader";
import { Check, AlertCircle, Bot, CreditCard, Send, Sparkles, Link2, Lock } from "lucide-react";
import { toast } from "sonner";
import { AUTH_ENABLED, SECRETS_STATUS } from "@/lib/config";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/configuracoes")({ component: Configuracoes });

function Configuracoes() {
  const settings = useQuery({
    queryKey: ["ai_settings"],
    queryFn: async () => (await supabase.from("ai_settings").select("grok_global_mode,messages_today").limit(1).maybeSingle()).data,
  });

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  const items = [
    { key: "TELEGRAM_API_KEY", label: "Telegram (via conector)", icon: Send, description: "Token gerenciado pelo conector da Lovable. Necessário para enviar e receber mensagens.", configured: SECRETS_STATUS.telegram },
    { key: "CAKTO_WEBHOOK_SECRET", label: "Cakto — segredo do webhook", icon: CreditCard, description: "Usado para validar a assinatura dos eventos recebidos da Cakto.", configured: SECRETS_STATUS.cakto },
    { key: "XAI_API_KEY", label: "xAI / Grok", icon: Sparkles, description: "Chave da API xAI para o atendimento automático. Opcional — o sistema funciona sem.", configured: SECRETS_STATUS.xai },
    { key: "TELEGRAM_WEBHOOK_URL", label: "Webhook do Telegram", icon: Link2, description: "URL pública para registrar no BotFather.", configured: true, value: `${origin}/api/public/telegram/webhook` },
    { key: "CAKTO_WEBHOOK_URL", label: "Webhook da Cakto", icon: Link2, description: "URL pública para configurar nas ofertas da Cakto.", configured: true, value: `${origin}/api/public/cakto/webhook` },
  ];

  return (
    <div>
      <PageHeader title="Configurações" subtitle="Integrações, segurança e estado da plataforma" />

      <Card className="p-5 bg-card border-border mb-4">
        <div className="flex items-start gap-3">
          <Lock className="h-5 w-5 text-warning shrink-0 mt-0.5" />
          <div className="text-sm flex-1">
            <p className="font-semibold">Modo desenvolvimento</p>
            <p className="text-muted-foreground">
              {AUTH_ENABLED
                ? "Autenticação ativa. Apenas usuários autorizados podem acessar."
                : "Login/cadastro desativados — o painel abre direto em modo admin. O Supabase Auth está preparado para ser reativado quando quiser."}
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-5 bg-card border-border mb-4">
        <div className="flex items-start gap-3">
          <Bot className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="text-sm flex-1">
            <p className="font-semibold">Atendimento automático com Grok</p>
            <p className="text-muted-foreground">Modo atual: <span className="font-medium text-foreground">{settings.data?.grok_global_mode ?? "off"}</span> · Mensagens hoje: {settings.data?.messages_today ?? 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Ajuste o modo global em "IA / Grok". O sistema funciona completo mesmo com o Grok desligado.</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <Card key={it.key} className="p-5 bg-card border-border">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-primary/15 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold">{it.label}</p>
                    <p className="text-xs text-muted-foreground">{it.description}</p>
                  </div>
                </div>
                {it.configured ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs bg-success/15 text-success border border-success/30">
                    <Check className="h-3 w-3" />OK
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs bg-warning/15 text-warning border border-warning/30">
                    <AlertCircle className="h-3 w-3" />Pendente
                  </span>
                )}
              </div>
              {it.value && (
                <div>
                  <Label className="text-xs text-muted-foreground">URL pública</Label>
                  <Input readOnly value={it.value} className="font-mono text-xs mt-1" />
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <Card className="p-5 bg-card border-border mt-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Bot className="h-6 w-6 text-primary" />
            <div>
              <p className="font-semibold">Pronto para conectar de verdade?</p>
              <p className="text-xs text-muted-foreground">Solicite ao Lovable a adição dos secrets (Cakto, Telegram, xAI) para ativar as integrações reais.</p>
            </div>
          </div>
          <Button onClick={() => toast.info("Peça ao chat do Lovable para adicionar os secrets que faltam.")}>Configurar secrets</Button>
        </div>
      </Card>
    </div>
  );
}
