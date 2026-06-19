import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/admin/PageHeader";
import { Check, AlertCircle, Bot, CreditCard, Send, Sparkles, Lock, Copy, Play, Pause } from "lucide-react";
import { toast } from "sonner";
import { AUTH_ENABLED, SECRETS_STATUS, GROK_OPTIONAL_NOTE } from "@/lib/config";
import { supabase } from "@/integrations/supabase/client";
import { testTelegramBot } from "@/lib/telegram.functions";
import { sendCaktoTestEvent } from "@/lib/cakto.functions";
import { grokStatus } from "@/lib/grok.functions";

export const Route = createFileRoute("/_authenticated/configuracoes")({ component: Configuracoes });

function StatusPill({ ok, labelOk = "Configurado", labelMissing = "Pendente" }: { ok: boolean; labelOk?: string; labelMissing?: string }) {
  return ok ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs bg-success/15 text-success border border-success/30">
      <Check className="h-3 w-3" />{labelOk}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs bg-warning/15 text-warning border border-warning/30">
      <AlertCircle className="h-3 w-3" />{labelMissing}
    </span>
  );
}

function CopyUrl({ value }: { value: string }) {
  return (
    <div className="flex gap-2 items-center">
      <Input readOnly value={value} className="font-mono text-xs" />
      <Button size="sm" variant="outline" onClick={() => {
        navigator.clipboard.writeText(value);
        toast.success("URL copiada");
      }}>
        <Copy className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

function Configuracoes() {
  const aiQ = useQuery({
    queryKey: ["ai_settings"],
    queryFn: async () => (await supabase.from("ai_settings").select("grok_global_mode, messages_today, model").limit(1).maybeSingle()).data,
  });

  const lastCakto = useQuery({
    queryKey: ["last_cakto_event"],
    queryFn: async () => (await supabase.from("cakto_webhook_events").select("event_type, processed, processing_error, created_at").order("created_at", { ascending: false }).limit(1).maybeSingle()).data,
  });

  const lastTgMsg = useQuery({
    queryKey: ["last_tg_msg"],
    queryFn: async () => (await supabase.from("messages").select("created_at, sender").eq("direction", "inbound").order("created_at", { ascending: false }).limit(1).maybeSingle()).data,
  });

  const testBot = useMutation({
    mutationFn: useServerFn(testTelegramBot),
    onSuccess: (r: any) => {
      if (r?.ok) toast.success(`Bot ok: @${r.data?.result?.username ?? "?"}`);
      else toast.error(r?.error ?? "Falha ao testar bot");
    },
    onError: (e: any) => toast.error(e?.message ?? "Erro"),
  });

  const sendTest = useMutation({
    mutationFn: useServerFn(sendCaktoTestEvent),
    onSuccess: (r: any) => {
      toast.success(`Evento de teste enviado (${r.fakeId})`);
      lastCakto.refetch();
    },
  });

  const grok = useQuery({
    queryKey: ["grok_status"],
    queryFn: useServerFn(grokStatus),
  });

  const setGlobalMode = async (mode: string) => {
    await supabase.from("ai_settings").update({ grok_global_mode: mode } as any).neq("id", "00000000-0000-0000-0000-000000000000");
    aiQ.refetch();
    toast.success(`Modo: ${mode}`);
  };

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const telegramWebhook = `${origin}/api/public/telegram/webhook`;
  const caktoWebhook = `${origin}/api/public/cakto/webhook`;

  return (
    <div className="space-y-4">
      <PageHeader title="Configurações" subtitle="Integrações, segurança e estado da plataforma" />

      {/* Modo Desenvolvimento */}
      <Card className="p-5 bg-card border-border">
        <div className="flex items-start gap-3">
          <Lock className="h-5 w-5 text-warning shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <p className="font-semibold">Modo Desenvolvimento</p>
              <StatusPill ok={!AUTH_ENABLED} labelOk="Ativo" labelMissing="Inativo" />
            </div>
            <ul className="text-sm text-muted-foreground mt-2 space-y-1">
              <li>• Login desativado: <strong className="text-foreground">{AUTH_ENABLED ? "não" : "sim"}</strong></li>
              <li>• Admin demo: <strong className="text-foreground">ativo</strong></li>
              <li>• O Supabase Auth está pronto para reativação quando você quiser ligar login/cadastro.</li>
            </ul>
            <Button size="sm" variant="outline" disabled className="mt-3">Ativar login depois</Button>
          </div>
        </div>
      </Card>

      {/* Telegram */}
      <Card className="p-5 bg-card border-border">
        <div className="flex items-start gap-3">
          <Send className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <p className="font-semibold">Telegram</p>
              <StatusPill ok={SECRETS_STATUS.telegram} />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Conector da Lovable (`TELEGRAM_API_KEY`). Necessário para enviar/receber mensagens e gerar invite links.</p>
            <div className="mt-3 space-y-2">
              <Label className="text-xs text-muted-foreground">Webhook URL</Label>
              <CopyUrl value={telegramWebhook} />
              <div className="flex gap-2 flex-wrap mt-2">
                <Button size="sm" onClick={() => testBot.mutate({} as any)} disabled={testBot.isPending}>
                  <Play className="h-3.5 w-3.5 mr-1" />Testar bot
                </Button>
                <span className="text-xs text-muted-foreground self-center">
                  Último update: {lastTgMsg.data?.created_at ? new Date(lastTgMsg.data.created_at).toLocaleString("pt-BR") : "—"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Cakto */}
      <Card className="p-5 bg-card border-border">
        <div className="flex items-start gap-3">
          <CreditCard className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <p className="font-semibold">Cakto</p>
              <StatusPill ok={SECRETS_STATUS.caktoWebhookSecret} />
            </div>
            <ul className="text-xs text-muted-foreground mt-2 grid grid-cols-2 gap-1">
              <li>CAKTO_API_KEY: <StatusPill ok={SECRETS_STATUS.caktoApiKey} /></li>
              <li>CAKTO_CLIENT_ID: <StatusPill ok={SECRETS_STATUS.caktoClientId} /></li>
              <li>CAKTO_CLIENT_SECRET: <StatusPill ok={SECRETS_STATUS.caktoClientSecret} /></li>
              <li>CAKTO_WEBHOOK_SECRET: <StatusPill ok={SECRETS_STATUS.caktoWebhookSecret} /></li>
            </ul>
            <div className="mt-3 space-y-2">
              <Label className="text-xs text-muted-foreground">Webhook URL</Label>
              <CopyUrl value={caktoWebhook} />
              <div className="flex gap-2 flex-wrap mt-2">
                <Button size="sm" onClick={() => sendTest.mutate({} as any)} disabled={sendTest.isPending}>
                  Enviar evento de teste
                </Button>
                <span className="text-xs text-muted-foreground self-center">
                  Último webhook: {lastCakto.data?.created_at ? new Date(lastCakto.data.created_at).toLocaleString("pt-BR") : "—"}
                  {lastCakto.data?.processing_error ? <span className="text-destructive ml-2">{lastCakto.data.processing_error}</span> : null}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Grok / xAI */}
      <Card className="p-5 bg-card border-border">
        <div className="flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <p className="font-semibold">Grok / xAI</p>
              <StatusPill ok={!!grok.data?.available} labelOk="Disponível" labelMissing="Desligado" />
            </div>
            <ul className="text-xs text-muted-foreground mt-2 space-y-1">
              <li>XAI_API_KEY: <StatusPill ok={!!grok.data?.hasKey} /></li>
              <li>GROK_ENABLED: <strong className="text-foreground">{grok.data?.enabled ? "true" : "false"}</strong></li>
              <li>Modelo: <strong className="text-foreground">{grok.data?.model ?? aiQ.data?.model ?? "—"}</strong></li>
              <li>Modo global atual: <strong className="text-foreground">{aiQ.data?.grok_global_mode ?? "off"}</strong></li>
            </ul>

            <div className="mt-3">
              <Label className="text-xs text-muted-foreground">Atendimento automático</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {(["off", "suggest", "auto_per_funnel", "auto_all"] as const).map((m) => (
                  <Button
                    key={m}
                    size="sm"
                    variant={aiQ.data?.grok_global_mode === m ? "default" : "outline"}
                    onClick={() => setGlobalMode(m)}
                  >
                    {m === "off" ? "Desligado" : m === "suggest" ? "Apenas sugerir" : m === "auto_per_funnel" ? "Auto por funil" : "Auto total"}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-3">
              <Button size="sm" variant="outline" disabled={!grok.data?.hasKey}>
                <Play className="h-3.5 w-3.5 mr-1" />Testar Grok
              </Button>
              <Button size="sm" variant="outline" onClick={() => setGlobalMode("off")}>
                <Pause className="h-3.5 w-3.5 mr-1" />Pausar Grok globalmente
              </Button>
              <Button size="sm" variant="outline" onClick={() => setGlobalMode("auto_per_funnel")}>
                <Play className="h-3.5 w-3.5 mr-1" />Ativar Grok globalmente
              </Button>
            </div>

            <div className="mt-3 p-3 rounded-lg bg-muted/40 border border-border">
              <div className="flex gap-2">
                <Bot className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">{GROK_OPTIONAL_NOTE}</p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
