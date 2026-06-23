import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PageHeader } from "@/components/admin/PageHeader";
import { Check, AlertCircle, Bot, Copy, Play, Pause, Lock } from "lucide-react";
import { toast } from "sonner";
import { AUTH_ENABLED } from "@/lib/config";
import { supabase } from "@/integrations/supabase/client";
import { testTelegramBot } from "@/lib/telegram.functions";
import { sendCaktoTestEvent } from "@/lib/cakto.functions";
import { grokStatus, pingGrok } from "@/lib/grok.functions";
import { useActiveProfile } from "@/lib/active-profile";
import { useEffect, useState } from "react";

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
      <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(value); toast.success("URL copiada"); }}>
        <Copy className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

function maskKey(v: string | null | undefined) {
  if (!v) return "";
  if (v.length <= 8) return "•".repeat(v.length);
  return v.slice(0, 4) + "•".repeat(Math.max(4, v.length - 8)) + v.slice(-4);
}

function Configuracoes() {
  const { profileId, profile } = useActiveProfile();
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const telegramWebhookLegacy = `${origin}/api/public/telegram/webhook`;
  const caktoWebhookLegacy = `${origin}/api/public/cakto/webhook`;

  if (!profileId) {
    return (
      <div className="space-y-4">
        <PageHeader title="Configurações" subtitle="Selecione um perfil para configurar" />
        <Card className="p-6 text-sm text-muted-foreground">Nenhum perfil ativo. Use o seletor no topo do painel.</Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Configurações"
        subtitle={`Perfil ativo: ${profile?.display_name ?? "—"}`}
      />

      <Tabs defaultValue="perfil" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="perfil">Perfil</TabsTrigger>
          <TabsTrigger value="telegram">Telegram Bot</TabsTrigger>
          <TabsTrigger value="cakto">Cakto</TabsTrigger>
          <TabsTrigger value="grok">Grok / IA</TabsTrigger>
          <TabsTrigger value="voz">Voz / ElevenLabs</TabsTrigger>
          <TabsTrigger value="plataforma">Plataforma</TabsTrigger>
          <TabsTrigger value="seguranca">Segurança</TabsTrigger>
        </TabsList>

        <TabsContent value="perfil"><PerfilTab profileId={profileId} /></TabsContent>
        <TabsContent value="telegram"><TelegramTab profileId={profileId} webhookLegacy={telegramWebhookLegacy} origin={origin} /></TabsContent>
        <TabsContent value="cakto"><CaktoTab profileId={profileId} webhookLegacy={caktoWebhookLegacy} origin={origin} /></TabsContent>
        <TabsContent value="grok"><GrokTab profileId={profileId} /></TabsContent>
        <TabsContent value="voz"><VozTab profileId={profileId} /></TabsContent>
        <TabsContent value="plataforma"><PlataformaTab profileId={profileId} /></TabsContent>
        <TabsContent value="seguranca"><SegurancaTab /></TabsContent>
      </Tabs>
    </div>
  );
}

// ============ Perfil ============
function PerfilTab({ profileId }: { profileId: string }) {
  const q = useQuery({
    queryKey: ["seller_profile", profileId],
    queryFn: async () => (await supabase.from("seller_profiles").select("*").eq("id", profileId).maybeSingle()).data,
  });
  const [f, setF] = useState<any>({});
  useEffect(() => { if (q.data) setF(q.data); }, [q.data]);

  const save = async () => {
    const { error } = await supabase.from("seller_profiles").update({
      display_name: f.display_name,
      username: f.username,
      avatar_url: f.avatar_url,
      short_bio: f.short_bio,
      public_description: f.public_description,
      status: f.status,
      currency: f.currency,
      timezone: f.timezone,
      default_language: f.default_language,
    }).eq("id", profileId);
    if (error) toast.error(error.message); else toast.success("Perfil salvo");
  };

  return (
    <Card className="p-5 space-y-3">
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="space-y-1"><Label>Nome exibido</Label><Input value={f.display_name ?? ""} onChange={(e) => setF({ ...f, display_name: e.target.value })} /></div>
        <div className="space-y-1"><Label>Username (@)</Label><Input value={f.username ?? ""} onChange={(e) => setF({ ...f, username: e.target.value })} /></div>
        <div className="space-y-1 sm:col-span-2"><Label>Avatar URL</Label><Input value={f.avatar_url ?? ""} onChange={(e) => setF({ ...f, avatar_url: e.target.value })} /></div>
        <div className="space-y-1 sm:col-span-2"><Label>Bio curta</Label><Input value={f.short_bio ?? ""} onChange={(e) => setF({ ...f, short_bio: e.target.value })} /></div>
        <div className="space-y-1 sm:col-span-2"><Label>Descrição pública</Label><Textarea rows={3} value={f.public_description ?? ""} onChange={(e) => setF({ ...f, public_description: e.target.value })} /></div>
        <div className="space-y-1"><Label>Status</Label><Input value={f.status ?? "active"} onChange={(e) => setF({ ...f, status: e.target.value })} placeholder="active | paused | archived" /></div>
        <div className="space-y-1"><Label>Idioma</Label><Input value={f.default_language ?? "pt-BR"} onChange={(e) => setF({ ...f, default_language: e.target.value })} /></div>
        <div className="space-y-1"><Label>Moeda</Label><Input value={f.currency ?? "BRL"} onChange={(e) => setF({ ...f, currency: e.target.value })} /></div>
        <div className="space-y-1"><Label>Fuso horário</Label><Input value={f.timezone ?? "America/Sao_Paulo"} onChange={(e) => setF({ ...f, timezone: e.target.value })} /></div>
      </div>
      <Button onClick={save} size="sm">Salvar perfil</Button>
    </Card>
  );
}

// ============ Telegram Bot ============
function TelegramTab({ profileId, webhookLegacy, origin }: { profileId: string; webhookLegacy: string; origin: string }) {
  const q = useQuery({
    queryKey: ["seller_bot", profileId],
    queryFn: async () => (await supabase.from("seller_bots").select("*").eq("seller_profile_id", profileId).maybeSingle()).data,
  });
  const [f, setF] = useState<any>({});
  const [showToken, setShowToken] = useState(false);
  useEffect(() => { if (q.data) setF(q.data); }, [q.data]);

  const save = async () => {
    if (!q.data) {
      const { error } = await supabase.from("seller_bots").insert({
        seller_profile_id: profileId,
        bot_name: f.bot_name,
        bot_username: f.bot_username,
        telegram_bot_token: f.telegram_bot_token,
        status: f.telegram_bot_token ? "active" : "inactive",
      });
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("seller_bots").update({
        bot_name: f.bot_name,
        bot_username: f.bot_username,
        telegram_bot_token: f.telegram_bot_token,
        status: f.telegram_bot_token ? "active" : "inactive",
      }).eq("id", q.data.id);
      if (error) return toast.error(error.message);
    }
    toast.success("Bot salvo");
    q.refetch();
  };

  const testBot = useMutation({
    mutationFn: useServerFn(testTelegramBot),
    onSuccess: (r: any) => {
      if (r?.ok) { toast.success(`Bot ok: @${r.data?.result?.username ?? "?"}`); q.refetch(); }
      else toast.error(r?.error ?? "Falha");
    },
  });

  const webhookByProfile = q.data?.id ? `${origin}/api/public/telegram/webhook/${q.data.id}` : "";

  return (
    <Card className="p-5 space-y-3">
      <div className="flex items-center justify-between"><p className="font-semibold">Bot Telegram (deste perfil)</p><StatusPill ok={!!q.data?.telegram_bot_token} /></div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="space-y-1"><Label>Nome do bot</Label><Input value={f.bot_name ?? ""} onChange={(e) => setF({ ...f, bot_name: e.target.value })} /></div>
        <div className="space-y-1"><Label>Username do bot</Label><Input value={f.bot_username ?? ""} onChange={(e) => setF({ ...f, bot_username: e.target.value })} placeholder="meubot" /></div>
        <div className="space-y-1 sm:col-span-2">
          <Label>Token do BotFather</Label>
          <div className="flex gap-2">
            <Input
              type={showToken ? "text" : "password"}
              value={showToken ? (f.telegram_bot_token ?? "") : maskKey(f.telegram_bot_token)}
              onChange={(e) => setF({ ...f, telegram_bot_token: e.target.value })}
              placeholder="123456:ABC-..."
            />
            <Button size="sm" variant="outline" onClick={() => setShowToken((s) => !s)}>{showToken ? "Ocultar" : "Mostrar"}</Button>
          </div>
          <p className="text-[11px] text-muted-foreground">Token gravado em backend. Use o painel apenas para configurar.</p>
        </div>
      </div>
      <div className="flex gap-2 flex-wrap">
        <Button size="sm" onClick={save}>Salvar bot</Button>
        <Button size="sm" variant="outline" onClick={() => testBot.mutate({ sellerProfileId: profileId } as any)} disabled={testBot.isPending}>
          <Play className="h-3.5 w-3.5 mr-1" />Testar bot
        </Button>
      </div>
      {q.data?.last_error && <p className="text-xs text-destructive">Último erro: {q.data.last_error}</p>}

      <div className="space-y-2 pt-2 border-t">
        <Label className="text-xs">Webhook por perfil</Label>
        {webhookByProfile ? <CopyUrl value={webhookByProfile} /> : <p className="text-xs text-muted-foreground">Salve o bot primeiro para gerar o webhook por perfil.</p>}
        <Label className="text-xs mt-2 block">Webhook legado (global)</Label>
        <CopyUrl value={webhookLegacy} />
        <p className="text-[11px] text-muted-foreground">O webhook legado continua funcionando com o bot configurado em variáveis de ambiente.</p>
      </div>
    </Card>
  );
}

// ============ Cakto ============
function CaktoTab({ profileId, webhookLegacy, origin }: { profileId: string; webhookLegacy: string; origin: string }) {
  const q = useQuery({
    queryKey: ["seller_cakto", profileId],
    queryFn: async () => (await supabase.from("seller_cakto_settings").select("*").eq("seller_profile_id", profileId).maybeSingle()).data,
  });
  const lastCakto = useQuery({
    queryKey: ["last_cakto_event", profileId],
    queryFn: async () => (await supabase.from("cakto_webhook_events").select("event_type, processed, processing_error, created_at").eq("seller_profile_id", profileId).order("created_at", { ascending: false }).limit(1).maybeSingle()).data,
  });
  const [f, setF] = useState<any>({});
  const [reveal, setReveal] = useState(false);
  useEffect(() => { if (q.data) setF(q.data); }, [q.data]);

  const save = async () => {
    const payload = {
      seller_profile_id: profileId,
      cakto_api_key: f.cakto_api_key,
      cakto_client_id: f.cakto_client_id,
      cakto_client_secret: f.cakto_client_secret,
      cakto_webhook_secret: f.cakto_webhook_secret,
    };
    const { error } = await supabase.from("seller_cakto_settings").upsert(payload, { onConflict: "seller_profile_id" });
    if (error) toast.error(error.message); else { toast.success("Cakto salvo"); q.refetch(); }
  };

  const sendTest = useMutation({
    mutationFn: useServerFn(sendCaktoTestEvent),
    onSuccess: (r: any) => { toast.success(`Evento de teste (${r.fakeId})`); lastCakto.refetch(); },
  });

  const webhookByProfile = `${origin}/api/public/cakto/webhook/${profileId}`;

  return (
    <Card className="p-5 space-y-3">
      <div className="flex items-center justify-between"><p className="font-semibold">Cakto (deste perfil)</p><StatusPill ok={!!q.data?.cakto_api_key} /></div>
      <div className="grid sm:grid-cols-2 gap-3">
        {(["cakto_api_key", "cakto_client_id", "cakto_client_secret", "cakto_webhook_secret"] as const).map((k) => (
          <div key={k} className="space-y-1">
            <Label>{k.replace("cakto_", "").replace("_", " ").toUpperCase()}</Label>
            <Input
              type={reveal ? "text" : "password"}
              value={reveal ? (f[k] ?? "") : maskKey(f[k])}
              onChange={(e) => setF({ ...f, [k]: e.target.value })}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-2 flex-wrap">
        <Button size="sm" onClick={save}>Salvar Cakto</Button>
        <Button size="sm" variant="outline" onClick={() => setReveal((s) => !s)}>{reveal ? "Ocultar" : "Mostrar"} chaves</Button>
        <Button size="sm" variant="outline" onClick={() => sendTest.mutate({ sellerProfileId: profileId } as any)} disabled={sendTest.isPending}>
          Enviar evento de teste
        </Button>
      </div>
      <div className="space-y-2 pt-2 border-t">
        <Label className="text-xs">Webhook por perfil</Label>
        <CopyUrl value={webhookByProfile} />
        <Label className="text-xs mt-2 block">Webhook legado (global)</Label>
        <CopyUrl value={webhookLegacy} />
      </div>
      <p className="text-xs text-muted-foreground">
        Último webhook: {lastCakto.data?.created_at ? new Date(lastCakto.data.created_at).toLocaleString("pt-BR") : "—"}
        {lastCakto.data?.processing_error ? <span className="text-destructive ml-2">{lastCakto.data.processing_error}</span> : null}
      </p>
    </Card>
  );
}

// ============ Grok ============
function GrokTab({ profileId }: { profileId: string }) {
  const q = useQuery({
    queryKey: ["seller_grok", profileId],
    queryFn: async () => (await supabase.from("seller_grok_settings").select("*").eq("seller_profile_id", profileId).maybeSingle()).data,
  });
  const grokFn = useServerFn(grokStatus);
  const status = useQuery({
    queryKey: ["grok_status", profileId],
    queryFn: () => grokFn({ data: { sellerProfileId: profileId } } as any),
  });

  const [f, setF] = useState<any>({});
  const [reveal, setReveal] = useState(false);
  useEffect(() => { if (q.data) setF(q.data); }, [q.data]);

  const save = async (overrides: any = {}) => {
    const payload = {
      seller_profile_id: profileId,
      xai_api_key: f.xai_api_key,
      model: f.model ?? "grok-4-latest",
      global_mode: f.global_mode ?? "off",
      enable_ai: !!f.enable_ai,
      system_prompt: f.system_prompt,
      fallback_message: f.fallback_message,
      ...overrides,
    };
    const { error } = await supabase.from("seller_grok_settings").upsert(payload, { onConflict: "seller_profile_id" });
    if (error) toast.error(error.message);
    else { toast.success("Grok salvo"); q.refetch(); status.refetch(); }
  };

  const [testResult, setTestResult] = useState<any>(null);
  const pingGrokFn = useServerFn(pingGrok);
  const testGrok = useMutation({
    mutationFn: () => pingGrokFn({ data: { sellerProfileId: profileId } } as any),
    onSuccess: (r: any) => {
      setTestResult(r);
      if (r?.ok) toast.success("Grok respondeu");
      else toast.error(r?.error ?? "Falha");
    },
  });

  return (
    <Card className="p-5 space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-semibold">Grok / xAI (deste perfil)</p>
        <StatusPill ok={!!status.data?.available} labelOk="Disponível" labelMissing="Desligado" />
      </div>
      <ul className="text-xs text-muted-foreground space-y-1">
        <li>XAI_API_KEY: <StatusPill ok={!!status.data?.hasKey} /> {status.data?.perProfileConfigured ? "(por perfil)" : status.data?.hasKey ? "(global)" : ""}</li>
        <li>Modo atual: <strong className="text-foreground">{status.data?.mode ?? "off"}</strong></li>
        <li>Modelo: <strong className="text-foreground">{status.data?.model}</strong></li>
      </ul>

      <div className="grid sm:grid-cols-2 gap-3">
        <div className="space-y-1 sm:col-span-2">
          <Label>API Key (xAI)</Label>
          <div className="flex gap-2">
            <Input type={reveal ? "text" : "password"} value={reveal ? (f.xai_api_key ?? "") : maskKey(f.xai_api_key)} onChange={(e) => setF({ ...f, xai_api_key: e.target.value })} placeholder="xai-..." />
            <Button size="sm" variant="outline" onClick={() => setReveal((s) => !s)}>{reveal ? "Ocultar" : "Mostrar"}</Button>
          </div>
        </div>
        <div className="space-y-1"><Label>Modelo</Label><Input value={f.model ?? "grok-4-latest"} onChange={(e) => setF({ ...f, model: e.target.value })} /></div>
        <div className="space-y-1 flex items-end gap-2">
          <div className="flex items-center gap-2"><Switch checked={!!f.enable_ai} onCheckedChange={(v) => setF({ ...f, enable_ai: v })} /><Label>IA ativada</Label></div>
        </div>
        <div className="space-y-1 sm:col-span-2"><Label>System prompt (opcional)</Label><Textarea rows={3} value={f.system_prompt ?? ""} onChange={(e) => setF({ ...f, system_prompt: e.target.value })} /></div>
      </div>

      <div>
        <Label className="text-xs text-muted-foreground">Modo de atendimento</Label>
        <div className="flex flex-wrap gap-2 mt-1">
          {([
            ["off", "Desligado"],
            ["suggest", "Sugerir respostas"],
            ["auto_by_funnel", "Auto por funil"],
            ["auto_all", "Auto total"],
          ] as const).map(([m, label]) => (
            <Button
              key={m}
              size="sm"
              variant={(f.global_mode ?? "off") === m ? "default" : "outline"}
              onClick={() => { setF({ ...f, global_mode: m }); save({ global_mode: m }); }}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button size="sm" onClick={() => save()}>Salvar</Button>
        <Button size="sm" variant="outline" disabled={!status.data?.hasKey || testGrok.isPending} onClick={() => testGrok.mutate()}>
          <Play className="h-3.5 w-3.5 mr-1" />{testGrok.isPending ? "Testando..." : "Testar Grok"}
        </Button>
        <Button size="sm" variant="outline" onClick={() => save({ global_mode: "off" })}>
          <Pause className="h-3.5 w-3.5 mr-1" />Pausar
        </Button>
        <Button size="sm" variant="outline" onClick={() => save({ global_mode: "auto_by_funnel", enable_ai: true })}>
          <Play className="h-3.5 w-3.5 mr-1" />Ativar (auto por funil)
        </Button>
      </div>

      {testResult && (
        <div className={`p-3 rounded-lg border text-xs ${testResult.ok ? "bg-success/10 border-success/30" : "bg-destructive/10 border-destructive/30"}`}>
          <strong className={testResult.ok ? "text-success" : "text-destructive"}>{testResult.ok ? "Resposta" : "Erro"}</strong>
          <pre className="whitespace-pre-wrap font-mono text-xs mt-1">{testResult.ok ? testResult.text : testResult.error}</pre>
        </div>
      )}

      <div className="p-3 rounded-lg bg-muted/40 border border-border flex gap-2">
        <Bot className="h-4 w-4 text-primary shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground">
          Cada perfil tem sua própria chave e modo de operação. Se a chave do perfil estiver vazia, a chave global é usada como fallback.
        </p>
      </div>
    </Card>
  );
}

// ============ Voz ============
function VozTab({ profileId }: { profileId: string }) {
  const q = useQuery({
    queryKey: ["seller_voice", profileId],
    queryFn: async () => (await supabase.from("seller_voice_settings").select("*").eq("seller_profile_id", profileId).maybeSingle()).data,
  });
  const [f, setF] = useState<any>({});
  const [reveal, setReveal] = useState(false);
  useEffect(() => { if (q.data) setF(q.data); }, [q.data]);

  const save = async () => {
    const { error } = await supabase.from("seller_voice_settings").upsert({
      seller_profile_id: profileId,
      elevenlabs_api_key: f.elevenlabs_api_key,
      voice_id: f.voice_id,
      model: f.model,
      enabled: !!f.enabled,
      send_audio_mode: f.send_audio_mode ?? "disabled",
      max_audio_characters: f.max_audio_characters ?? 600,
    }, { onConflict: "seller_profile_id" });
    if (error) toast.error(error.message); else { toast.success("Voz salva"); q.refetch(); }
  };

  return (
    <Card className="p-5 space-y-3">
      <div className="flex items-center justify-between"><p className="font-semibold">Voz / ElevenLabs (deste perfil)</p><StatusPill ok={!!q.data?.enabled} labelOk="Ativada" labelMissing="Desativada" /></div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="space-y-1 sm:col-span-2">
          <Label>ElevenLabs API Key</Label>
          <div className="flex gap-2">
            <Input type={reveal ? "text" : "password"} value={reveal ? (f.elevenlabs_api_key ?? "") : maskKey(f.elevenlabs_api_key)} onChange={(e) => setF({ ...f, elevenlabs_api_key: e.target.value })} />
            <Button size="sm" variant="outline" onClick={() => setReveal((s) => !s)}>{reveal ? "Ocultar" : "Mostrar"}</Button>
          </div>
        </div>
        <div className="space-y-1"><Label>Voice ID</Label><Input value={f.voice_id ?? ""} onChange={(e) => setF({ ...f, voice_id: e.target.value })} /></div>
        <div className="space-y-1"><Label>Modelo</Label><Input value={f.model ?? ""} onChange={(e) => setF({ ...f, model: e.target.value })} /></div>
        <div className="space-y-1"><Label>Modo de áudio</Label><Input value={f.send_audio_mode ?? "disabled"} onChange={(e) => setF({ ...f, send_audio_mode: e.target.value })} placeholder="disabled | manual | auto" /></div>
        <div className="space-y-1"><Label>Máx. caracteres por áudio</Label><Input type="number" value={f.max_audio_characters ?? 600} onChange={(e) => setF({ ...f, max_audio_characters: Number(e.target.value) })} /></div>
        <div className="flex items-center gap-2"><Switch checked={!!f.enabled} onCheckedChange={(v) => setF({ ...f, enabled: v })} /><Label>Voz ativada</Label></div>
      </div>
      <Button size="sm" onClick={save}>Salvar voz</Button>
    </Card>
  );
}

// ============ Plataforma ============
function PlataformaTab({ profileId }: { profileId: string }) {
  const q = useQuery({
    queryKey: ["seller_platform", profileId],
    queryFn: async () => (await supabase.from("seller_platform_settings").select("*").eq("seller_profile_id", profileId).maybeSingle()).data,
  });
  const [f, setF] = useState<any>({});
  useEffect(() => { if (q.data) setF(q.data); }, [q.data]);

  const save = async () => {
    const { error } = await supabase.from("seller_platform_settings").upsert({
      seller_profile_id: profileId,
      login_enabled: !!f.login_enabled,
      timezone: f.timezone ?? "America/Sao_Paulo",
      default_language: f.default_language ?? "pt-BR",
      currency: f.currency ?? "BRL",
      development_mode: !!f.development_mode,
    }, { onConflict: "seller_profile_id" });
    if (error) toast.error(error.message); else { toast.success("Plataforma salva"); q.refetch(); }
  };

  return (
    <Card className="p-5 space-y-3">
      <p className="font-semibold">Plataforma (deste perfil)</p>
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="flex items-center gap-2"><Switch checked={!!f.login_enabled} onCheckedChange={(v) => setF({ ...f, login_enabled: v })} /><Label>Login habilitado</Label></div>
        <div className="flex items-center gap-2"><Switch checked={!!f.development_mode} onCheckedChange={(v) => setF({ ...f, development_mode: v })} /><Label>Modo desenvolvimento</Label></div>
        <div className="space-y-1"><Label>Fuso horário</Label><Input value={f.timezone ?? "America/Sao_Paulo"} onChange={(e) => setF({ ...f, timezone: e.target.value })} /></div>
        <div className="space-y-1"><Label>Idioma</Label><Input value={f.default_language ?? "pt-BR"} onChange={(e) => setF({ ...f, default_language: e.target.value })} /></div>
        <div className="space-y-1"><Label>Moeda</Label><Input value={f.currency ?? "BRL"} onChange={(e) => setF({ ...f, currency: e.target.value })} /></div>
      </div>
      <Button size="sm" onClick={save}>Salvar</Button>
    </Card>
  );
}

// ============ Segurança ============
function SegurancaTab() {
  return (
    <Card className="p-5 space-y-3">
      <div className="flex items-start gap-3">
        <Lock className="h-5 w-5 text-warning shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-semibold">Modo desenvolvimento</p>
          <p className="text-sm text-muted-foreground mt-1">
            Login: <strong className="text-foreground">{AUTH_ENABLED ? "ativo" : "desativado"}</strong> · Admin demo ativo.
          </p>
          <ul className="text-sm text-muted-foreground mt-2 space-y-1">
            <li>• Tokens e API keys são mascarados no painel.</li>
            <li>• Operações sensíveis acontecem no backend (server functions).</li>
            <li>• Cada perfil tem seu próprio conjunto de credenciais isoladas.</li>
            <li>• Webhooks por perfil identificam a influenciadora pela URL.</li>
          </ul>
        </div>
      </div>
    </Card>
  );
}
