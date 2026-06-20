import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useActiveProfile } from "@/lib/active-profile";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Check, Copy, Sparkles, Bot, CreditCard, Package, UserCircle } from "lucide-react";
import { testTelegramBot } from "@/lib/telegram.functions";

export const Route = createFileRoute("/_authenticated/perfis/novo")({
  component: NovoPerfilWizard,
});

type Step = 0 | 1 | 2 | 3 | 4;
const STEPS = [
  { idx: 0, label: "Perfil", icon: UserCircle },
  { idx: 1, label: "Telegram", icon: Bot },
  { idx: 2, label: "Cakto", icon: CreditCard },
  { idx: 3, label: "Plano", icon: Package },
  { idx: 4, label: "IA", icon: Sparkles },
] as const;

function NovoPerfilWizard() {
  const nav = useNavigate();
  const { setProfileId, refetch } = useActiveProfile();
  const [step, setStep] = useState<Step>(0);
  const [profileId, setNewProfileId] = useState<string | null>(null);
  const [botId, setBotId] = useState<string | null>(null);

  // Step 0
  const [profile, setProfile] = useState({ display_name: "", username: "", avatar_url: "", short_bio: "" });
  // Step 1
  const [bot, setBot] = useState({ bot_name: "", bot_username: "", telegram_bot_token: "" });
  // Step 2
  const [cakto, setCakto] = useState({ cakto_api_key: "", cakto_webhook_secret: "" });
  // Step 3
  const [plan, setPlan] = useState({ name: "", description: "", price_brl: "97,00", duration_days: "30" });
  // Step 4
  const [grok, setGrok] = useState({ xai_api_key: "", system_prompt: "", enable: true });

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  // ===== Step 0 =====
  const createProfile = useMutation({
    mutationFn: async () => {
      if (!profile.display_name.trim()) throw new Error("Nome obrigatório");
      const { data: user } = await supabase.auth.getUser();
      const { data, error } = await supabase.from("seller_profiles").insert({
        display_name: profile.display_name.trim(),
        username: profile.username.trim() || null,
        avatar_url: profile.avatar_url.trim() || null,
        short_bio: profile.short_bio.trim() || null,
        owner_user_id: user.user?.id ?? null,
        status: "active",
        is_active: true,
        currency: "BRL",
        timezone: "America/Sao_Paulo",
      }).select("id").single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: (id) => {
      setNewProfileId(id);
      setProfileId(id);
      refetch();
      toast.success("Perfil criado");
      setStep(1);
    },
    onError: (e: any) => toast.error(e.message),
  });

  // ===== Step 1 =====
  const saveBot = useMutation({
    mutationFn: async () => {
      if (!profileId) throw new Error("Crie o perfil primeiro");
      const { data, error } = await supabase.from("seller_bots").upsert({
        seller_profile_id: profileId,
        bot_name: bot.bot_name || null,
        bot_username: bot.bot_username || null,
        telegram_bot_token: bot.telegram_bot_token || null,
        status: bot.telegram_bot_token ? "active" : "inactive",
      }, { onConflict: "seller_profile_id" }).select("id").single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: (id) => { setBotId(id); toast.success("Bot salvo"); },
    onError: (e: any) => toast.error(e.message),
  });

  const testBotFn = useServerFn(testTelegramBot);
  const testBot = useMutation({
    mutationFn: () => testBotFn({ data: { sellerProfileId: profileId! } } as any),
    onSuccess: (r: any) => {
      if (r?.ok) toast.success(`Bot ok: @${r.data?.result?.username ?? "?"}`);
      else toast.error(r?.error ?? "Falha");
    },
  });

  // ===== Step 2 =====
  const saveCakto = useMutation({
    mutationFn: async () => {
      if (!profileId) throw new Error("Crie o perfil primeiro");
      const { error } = await supabase.from("seller_cakto_settings").upsert({
        seller_profile_id: profileId,
        cakto_api_key: cakto.cakto_api_key || null,
        cakto_webhook_secret: cakto.cakto_webhook_secret || null,
      }, { onConflict: "seller_profile_id" });
      if (error) throw error;
    },
    onSuccess: () => toast.success("Cakto salva"),
    onError: (e: any) => toast.error(e.message),
  });

  // ===== Step 3 =====
  const createPlan = useMutation({
    mutationFn: async () => {
      if (!profileId) throw new Error("Crie o perfil primeiro");
      if (!plan.name.trim()) throw new Error("Nome do plano obrigatório");
      const cents = Math.round(parseFloat(plan.price_brl.replace(",", ".")) * 100);
      if (!cents || cents < 100) throw new Error("Preço inválido");
      const { error } = await supabase.from("plans").insert({
        seller_profile_id: profileId,
        name: plan.name.trim(),
        description: plan.description.trim() || null,
        price_cents: cents,
        duration_days: parseInt(plan.duration_days, 10) || 30,
        is_active: true,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Plano criado"); setStep(4); },
    onError: (e: any) => toast.error(e.message),
  });

  // ===== Step 4 =====
  const saveGrok = useMutation({
    mutationFn: async () => {
      if (!profileId) throw new Error("Crie o perfil primeiro");
      const { error } = await supabase.from("seller_grok_settings").upsert({
        seller_profile_id: profileId,
        xai_api_key: grok.xai_api_key || null,
        system_prompt: grok.system_prompt || null,
        enable_ai: grok.enable,
        global_mode: grok.enable ? "auto_by_funnel" : "off",
        model: "grok-4-latest",
      }, { onConflict: "seller_profile_id" });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("IA configurada"); finalize(); },
    onError: (e: any) => toast.error(e.message),
  });

  const finalize = () => {
    toast.success("Vendedora pronta para operar 🎉");
    nav({ to: "/dashboard" });
  };

  const webhookTelegram = botId ? `${origin}/api/public/telegram/webhook/${botId}` : "";
  const webhookCakto = profileId ? `${origin}/api/public/cakto/webhook/${profileId}` : "";

  const copy = (v: string) => { navigator.clipboard.writeText(v); toast.success("Copiado"); };

  return (
    <div className="p-6 max-w-3xl space-y-5">
      <PageHeader
        title="Nova vendedora"
        subtitle="Wizard guiado: perfil → Telegram → Cakto → catálogo → IA."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link to="/perfis"><ChevronLeft className="h-4 w-4 mr-1" />Voltar</Link>
          </Button>
        }
      />

      {/* Stepper */}
      <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-1">
        {STEPS.map((s) => {
          const done = step > s.idx;
          const cur = step === s.idx;
          const Icon = s.icon;
          return (
            <div key={s.idx} className="flex items-center gap-1 sm:gap-2 shrink-0">
              <div className={`h-8 px-3 rounded-full flex items-center gap-1.5 text-xs border ${
                done ? "bg-success/15 text-success border-success/30"
                : cur ? "bg-primary/15 text-primary border-primary/30"
                : "bg-muted text-muted-foreground border-border"}`}>
                {done ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                <span className="hidden sm:inline">{s.label}</span>
              </div>
              {s.idx < STEPS.length - 1 && <span className="h-px w-3 sm:w-6 bg-border" />}
            </div>
          );
        })}
      </div>

      <Card className="p-5 space-y-4">
        {step === 0 && (
          <>
            <h2 className="font-semibold">1. Dados do perfil</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2"><Label>Nome de exibição *</Label><Input value={profile.display_name} onChange={(e) => setProfile({ ...profile, display_name: e.target.value })} placeholder="Ex: Lara" /></div>
              <div><Label>Username</Label><Input value={profile.username} onChange={(e) => setProfile({ ...profile, username: e.target.value })} placeholder="lara_oficial" /></div>
              <div><Label>Avatar URL</Label><Input value={profile.avatar_url} onChange={(e) => setProfile({ ...profile, avatar_url: e.target.value })} placeholder="https://…" /></div>
              <div className="sm:col-span-2"><Label>Bio curta</Label><Textarea rows={2} value={profile.short_bio} onChange={(e) => setProfile({ ...profile, short_bio: e.target.value })} /></div>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => createProfile.mutate()} disabled={createProfile.isPending || !profile.display_name.trim()}>
                {createProfile.isPending ? "Criando…" : "Criar e continuar"}<ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h2 className="font-semibold">2. Bot do Telegram</h2>
            <p className="text-xs text-muted-foreground">Crie um bot no @BotFather e cole o token aqui.</p>
            <div className="grid sm:grid-cols-2 gap-3">
              <div><Label>Nome do bot</Label><Input value={bot.bot_name} onChange={(e) => setBot({ ...bot, bot_name: e.target.value })} /></div>
              <div><Label>Username do bot</Label><Input value={bot.bot_username} onChange={(e) => setBot({ ...bot, bot_username: e.target.value })} placeholder="meubot" /></div>
              <div className="sm:col-span-2"><Label>Token do BotFather</Label><Input type="password" value={bot.telegram_bot_token} onChange={(e) => setBot({ ...bot, telegram_bot_token: e.target.value })} placeholder="123456:ABC-…" /></div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button size="sm" onClick={() => saveBot.mutate()} disabled={saveBot.isPending || !bot.telegram_bot_token}>{saveBot.isPending ? "Salvando…" : "Salvar bot"}</Button>
              <Button size="sm" variant="outline" disabled={!botId || testBot.isPending} onClick={() => testBot.mutate()}>{testBot.isPending ? "Testando…" : "Testar bot"}</Button>
            </div>
            {webhookTelegram && (
              <div className="p-3 rounded-md bg-muted/40 border border-border space-y-1">
                <Label className="text-xs">Webhook deste bot</Label>
                <div className="flex gap-2">
                  <Input readOnly value={webhookTelegram} className="font-mono text-xs" />
                  <Button size="sm" variant="outline" onClick={() => copy(webhookTelegram)}><Copy className="h-3.5 w-3.5" /></Button>
                </div>
                <p className="text-[11px] text-muted-foreground">Use “Testar bot” para validar — registramos o webhook automaticamente em uma próxima versão.</p>
              </div>
            )}
            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep(0)}><ChevronLeft className="h-4 w-4 mr-1" />Voltar</Button>
              <Button onClick={() => setStep(2)}>Próximo<ChevronRight className="h-4 w-4 ml-1" /></Button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="font-semibold">3. Cakto (pagamentos)</h2>
            <p className="text-xs text-muted-foreground">Pegue as chaves no painel da Cakto. O webhook abaixo precisa ser colado lá.</p>
            <div className="grid sm:grid-cols-2 gap-3">
              <div><Label>API Key</Label><Input type="password" value={cakto.cakto_api_key} onChange={(e) => setCakto({ ...cakto, cakto_api_key: e.target.value })} /></div>
              <div><Label>Webhook Secret</Label><Input type="password" value={cakto.cakto_webhook_secret} onChange={(e) => setCakto({ ...cakto, cakto_webhook_secret: e.target.value })} /></div>
            </div>
            <Button size="sm" onClick={() => saveCakto.mutate()} disabled={saveCakto.isPending}>{saveCakto.isPending ? "Salvando…" : "Salvar Cakto"}</Button>
            {webhookCakto && (
              <div className="p-3 rounded-md bg-muted/40 border border-border space-y-1">
                <Label className="text-xs">URL do webhook para colar no painel Cakto</Label>
                <div className="flex gap-2">
                  <Input readOnly value={webhookCakto} className="font-mono text-xs" />
                  <Button size="sm" variant="outline" onClick={() => copy(webhookCakto)}><Copy className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            )}
            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep(1)}><ChevronLeft className="h-4 w-4 mr-1" />Voltar</Button>
              <Button onClick={() => setStep(3)}>Próximo<ChevronRight className="h-4 w-4 ml-1" /></Button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="font-semibold">4. Primeiro plano</h2>
            <p className="text-xs text-muted-foreground">Crie pelo menos um plano para o bot ter o que vender.</p>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2"><Label>Nome *</Label><Input value={plan.name} onChange={(e) => setPlan({ ...plan, name: e.target.value })} placeholder="Ex: VIP Mensal" /></div>
              <div className="sm:col-span-2"><Label>Descrição</Label><Textarea rows={2} value={plan.description} onChange={(e) => setPlan({ ...plan, description: e.target.value })} /></div>
              <div><Label>Preço (R$)</Label><Input value={plan.price_brl} onChange={(e) => setPlan({ ...plan, price_brl: e.target.value })} placeholder="97,00" /></div>
              <div><Label>Duração (dias)</Label><Input value={plan.duration_days} onChange={(e) => setPlan({ ...plan, duration_days: e.target.value })} placeholder="30" /></div>
            </div>
            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep(2)}><ChevronLeft className="h-4 w-4 mr-1" />Voltar</Button>
              <Button onClick={() => createPlan.mutate()} disabled={createPlan.isPending || !plan.name.trim()}>
                {createPlan.isPending ? "Criando…" : "Criar plano e continuar"}<ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <h2 className="font-semibold">5. IA (opcional)</h2>
            <p className="text-xs text-muted-foreground">Configure a chave xAI/Grok ou use a chave global do sistema. Pode pular.</p>
            <div className="space-y-3">
              <div><Label>XAI API Key (opcional — usa a global se vazio)</Label><Input type="password" value={grok.xai_api_key} onChange={(e) => setGrok({ ...grok, xai_api_key: e.target.value })} placeholder="xai-…" /></div>
              <div><Label>System prompt (personalidade)</Label><Textarea rows={4} value={grok.system_prompt} onChange={(e) => setGrok({ ...grok, system_prompt: e.target.value })} placeholder="Você é a Lara, vendedora simpática…" /></div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={grok.enable} onChange={(e) => setGrok({ ...grok, enable: e.target.checked })} />
                Ativar IA em modo auto (por funil)
              </label>
            </div>
            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep(3)}><ChevronLeft className="h-4 w-4 mr-1" />Voltar</Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={finalize}>Pular e finalizar</Button>
                <Button onClick={() => saveGrok.mutate()} disabled={saveGrok.isPending}>
                  {saveGrok.isPending ? "Salvando…" : "Salvar e finalizar"}<Check className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
