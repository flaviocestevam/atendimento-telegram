import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/admin/PageHeader";
import { Check, AlertCircle, Bot, CreditCard, Send, Sparkles, Link2 } from "lucide-react";
import { mask } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/configuracoes")({
  component: Configuracoes,
});

type Item = { key: string; label: string; icon: any; description: string; configured: boolean; value?: string };

function Configuracoes() {
  // Valores nunca aparecem no frontend — apenas o status (configurado/não configurado)
  const items: Item[] = [
    { key: "TELEGRAM_BOT_TOKEN", label: "Telegram Bot Token", icon: Send, description: "Token do BotFather para enviar e receber mensagens", configured: false },
    { key: "MERCADOPAGO_ACCESS_TOKEN", label: "Mercado Pago Access Token", icon: CreditCard, description: "Access token para criar e consultar pagamentos Pix", configured: false },
    { key: "XAI_API_KEY", label: "xAI API Key (Grok)", icon: Sparkles, description: "Chave da API xAI para respostas automáticas do bot", configured: false },
    { key: "TELEGRAM_WEBHOOK", label: "Webhook do Telegram", icon: Link2, description: "Endpoint público que recebe updates do Telegram", configured: false, value: "https://seu-projeto.lovable.app/api/public/telegram/webhook" },
    { key: "MERCADOPAGO_WEBHOOK", label: "Webhook do Mercado Pago", icon: Link2, description: "Endpoint público para notificações de pagamento", configured: false, value: "https://seu-projeto.lovable.app/api/public/mercadopago/webhook" },
    { key: "APP_PUBLIC_URL", label: "URL pública do app", icon: Link2, description: "URL onde o painel está hospedado", configured: true, value: typeof window !== "undefined" ? window.location.origin : "" },
  ];

  return (
    <div>
      <PageHeader title="Configurações" subtitle="Checklist de integrações e variáveis de ambiente" />

      <Card className="p-5 bg-card border-border mb-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-warning shrink-0 mt-0.5"/>
          <div className="text-sm">
            <p className="font-semibold">Segurança</p>
            <p className="text-muted-foreground">Os tokens são armazenados em variáveis de ambiente do servidor e nunca aparecem no frontend. Use o painel da Lovable Cloud para adicioná-los.</p>
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
                    <Icon className="h-5 w-5"/>
                  </div>
                  <div>
                    <p className="font-semibold">{it.label}</p>
                    <p className="text-xs text-muted-foreground">{it.description}</p>
                  </div>
                </div>
                {it.configured ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs bg-success/15 text-success border border-success/30">
                    <Check className="h-3 w-3"/>OK
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs bg-warning/15 text-warning border border-warning/30">
                    <AlertCircle className="h-3 w-3"/>Pendente
                  </span>
                )}
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Valor</Label>
                <Input readOnly value={it.value ? (it.configured ? it.value : mask(it.value)) : "não configurado"} className="font-mono text-xs mt-1"/>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="p-5 bg-card border-border mt-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Bot className="h-6 w-6 text-primary"/>
            <div>
              <p className="font-semibold">Pronto para conectar?</p>
              <p className="text-xs text-muted-foreground">Adicione os tokens nas variáveis de ambiente para ativar as integrações reais.</p>
            </div>
          </div>
          <Button onClick={() => toast.info("Adicione os tokens via Lovable Cloud → Backend → Secrets")}>Adicionar tokens</Button>
        </div>
      </Card>
    </div>
  );
}
