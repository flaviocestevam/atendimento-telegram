import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { callGrok } from "@/lib/grok.functions";
import { supabase } from "@/integrations/supabase/client";
import { useActiveProfile } from "@/lib/active-profile";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { relTime, dateTimeBR, BRL } from "@/lib/format";
import { Send, Sparkles, UserCheck, Pause, Play, Search, Languages } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/conversas")({
  component: ConversasPage,
});

const filters = [
  { id: "all", label: "Todas" },
  { id: "pending", label: "Aguardando" },
  { id: "ai", label: "IA respondeu" },
  { id: "human", label: "Atendimento humano" },
  { id: "payment", label: "Pagamento pendente" },
  { id: "active", label: "Assinantes" },
  { id: "blocked", label: "Bloqueados" },
];

function ConversasPage() {
  const { profileId } = useActiveProfile();
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const qc = useQueryClient();
  const callGrokFn = useServerFn(callGrok);
  const [grokLoading, setGrokLoading] = useState(false);


  const convs = useQuery({
    enabled: !!profileId,
    queryKey: ["conversations", profileId, filter, search],
    queryFn: async () => {
      let q = supabase
        .from("conversations")
        .select("id,status,ai_enabled,last_message_at,telegram_user_id,telegram_users(id,first_name,last_name,username,telegram_id,is_blocked)")
        .eq("seller_profile_id", profileId!)
        .order("last_message_at", { ascending: false, nullsFirst: false })
        .limit(50);
      if (filter === "pending") q = q.eq("status", "pending");
      if (filter === "human") q = q.eq("ai_enabled", false);
      if (filter === "ai") q = q.eq("ai_enabled", true);
      if (filter === "blocked") q = q.eq("status", "blocked");
      const { data } = await q;
      const list = data ?? [];
      if (!search) return list;
      const s = search.toLowerCase();
      return list.filter((c: any) =>
        (c.telegram_users?.first_name ?? "").toLowerCase().includes(s) ||
        (c.telegram_users?.username ?? "").toLowerCase().includes(s)
      );
    },
  });

  const selected = (convs.data ?? []).find((c: any) => c.id === selectedId) ?? (convs.data ?? [])[0];

  const messages = useQuery({
    enabled: !!selected?.id,
    queryKey: ["messages", selected?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", selected!.id)
        .order("created_at", { ascending: true });
      return data ?? [];
    },
  });

  const userStats = useQuery({
    enabled: !!selected?.telegram_user_id && !!profileId,
    queryKey: ["user-stats", profileId, selected?.telegram_user_id],
    queryFn: async () => {
      const uid = selected!.telegram_user_id as string;
      const [orders, grant] = await Promise.all([
        supabase.from("orders").select("amount_cents,status,paid_at").eq("seller_profile_id", profileId!).eq("telegram_user_id", uid),
        supabase.from("access_grants").select("*,plans(name)").eq("seller_profile_id", profileId!).eq("telegram_user_id", uid).eq("status", "active").order("expires_at", { ascending: false }).limit(1).maybeSingle(),
      ]);
      const totalPago = (orders.data ?? []).filter(o => o.status === "paid").reduce((s, o) => s + o.amount_cents, 0);
      const ultimo = (orders.data ?? []).filter(o => !!o.paid_at).sort((a, b) => +new Date(b.paid_at as string) - +new Date(a.paid_at as string))[0];
      return { totalPago, ultimo, grant: grant.data };
    },
  });

  const leadQ = useQuery({
    enabled: !!selected?.telegram_user_id && !!profileId,
    queryKey: ["lead-lang", profileId, selected?.telegram_user_id],
    queryFn: async () => {
      const { data } = await supabase
        .from("leads")
        .select("id,preferred_language,language_confirmed_at,language_detection_source")
        .eq("seller_profile_id", profileId!)
        .eq("telegram_user_id", selected!.telegram_user_id as string)
        .maybeSingle();
      return data;
    },
  });

  const leadContext = useQuery({
    enabled: !!leadQ.data?.id && !!selected?.telegram_user_id,
    queryKey: ["lead-context", leadQ.data?.id, selected?.telegram_user_id],
    queryFn: async () => {
      const leadId = leadQ.data!.id as string;
      const tgUserId = selected!.telegram_user_id as string;
      const [mems, stories] = await Promise.all([
        supabase.from("lead_memories").select("id,title,content,memory_type,importance").eq("lead_id", leadId).eq("is_active", true).order("importance", { ascending: false }).limit(8),
        supabase.from("story_leads").select("id,story_id,current_step,last_step_at,stories(name)").eq("lead_id", tgUserId).order("last_step_at", { ascending: false }).limit(8),
      ]);
      return { memories: mems.data ?? [], stories: stories.data ?? [] };
    },
  });

  async function suggestWithGrok() {
    if (!selected) return;
    setGrokLoading(true);
    try {
      const res = await callGrokFn({ data: { conversationId: selected.id, mode: "suggest" } });
      if (!res?.ok) return toast.error(res?.error ?? "Falha no Grok");
      setReply(res.text ?? "");
      if (res.storyUsed) toast.success(`Sugestão pronta · usou história "${res.storyUsed.name}"`);
      else toast.success("Sugestão pronta");
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao chamar Grok");
    } finally {
      setGrokLoading(false);
    }
  }

  async function setLeadLanguage(lang: "pt" | "en" | "es", source: "manual" | "confirmed" = "manual") {
    if (!leadQ.data?.id) return toast.error("Lead não encontrado para este usuário");
    const { error } = await supabase
      .from("leads")
      .update({
        preferred_language: lang,
        language_confirmed_at: new Date().toISOString(),
        language_detection_source: source,
      })
      .eq("id", leadQ.data.id);
    if (error) return toast.error(error.message);
    toast.success(`Idioma definido: ${lang.toUpperCase()}`);
    qc.invalidateQueries({ queryKey: ["lead-lang", profileId, selected?.telegram_user_id] });
  }

  async function askLanguage(lang: "en" | "es") {
    if (!selected || !profileId) return;
    const text = lang === "en"
      ? "I noticed you wrote in English. Would you like me to continue our conversation in English?"
      : "Vi que escribiste en español. ¿Prefieres que siga conversando contigo en español?";
    const { error } = await supabase.from("messages").insert({
      seller_profile_id: profileId,
      conversation_id: selected.id,
      telegram_user_id: selected.telegram_user_id,
      direction: "outbound",
      sender_type: "admin",
      sender: "admin",
      kind: "text",
      text,
    });
    if (error) return toast.error(error.message);
    await supabase.from("conversations").update({ last_message_at: new Date().toISOString() }).eq("id", selected.id);
    qc.invalidateQueries({ queryKey: ["messages", selected.id] });
    toast.success("Pergunta enviada");
  }

  async function sendReply() {
    if (!reply.trim() || !selected || !profileId) return;
    const { error } = await supabase.from("messages").insert({
      seller_profile_id: profileId,
      conversation_id: selected.id,
      telegram_user_id: selected.telegram_user_id,
      direction: "outbound",
      sender_type: "admin",
      sender: "admin",
      kind: "text",
      text: reply,
    });
    if (error) return toast.error(error.message);
    await supabase.from("conversations").update({ last_message_at: new Date().toISOString() }).eq("id", selected.id);
    setReply("");
    qc.invalidateQueries({ queryKey: ["messages", selected.id] });
    toast.success("Mensagem enviada (mock — Telegram não conectado)");
  }

  async function toggleAI() {
    if (!selected) return;
    await supabase.from("conversations").update({ ai_enabled: !selected.ai_enabled }).eq("id", selected.id);
    qc.invalidateQueries({ queryKey: ["conversations"] });
  }

  return (
    <div>
      <PageHeader title="Conversas" subtitle="Inbox unificado do bot e atendimento humano" />

      <Tabs value={filter} onValueChange={setFilter} className="mb-4">
        <TabsList>
          {filters.map(f => <TabsTrigger key={f.id} value={f.id}>{f.label}</TabsTrigger>)}
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-12 gap-4 h-[calc(100vh-220px)]">
        {/* Lista */}
        <Card className="col-span-12 lg:col-span-3 p-3 flex flex-col bg-card border-border">
          <div className="relative mb-2">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <ScrollArea className="flex-1">
            <div className="space-y-1">
              {(convs.data ?? []).map((c: any) => {
                const u = c.telegram_users;
                const active = selected?.id === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedId(c.id)}
                    className={cn(
                      "w-full text-left p-3 rounded-lg transition-colors",
                      active ? "bg-primary/15 border border-primary/30" : "hover:bg-muted"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium truncate">{u?.first_name} {u?.last_name}</span>
                      <span className="text-xs text-muted-foreground shrink-0">{relTime(c.last_message_at)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-1">
                      <span className="text-xs text-muted-foreground truncate">@{u?.username ?? u?.telegram_id}</span>
                      <StatusBadge status={c.ai_enabled ? "ai" : "human"} />
                    </div>
                  </button>
                );
              })}
              {convs.isLoading && <p className="text-sm text-muted-foreground p-3">Carregando...</p>}
              {!convs.isLoading && (convs.data?.length ?? 0) === 0 && (
                <p className="text-sm text-muted-foreground p-3">Nenhuma conversa.</p>
              )}
            </div>
          </ScrollArea>
        </Card>

        {/* Centro */}
        <Card className="col-span-12 lg:col-span-6 flex flex-col bg-card border-border">
          {selected ? (
            <>
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div>
                  <div className="font-semibold">{selected.telegram_users?.first_name} {selected.telegram_users?.last_name}</div>
                  <div className="text-xs text-muted-foreground">@{selected.telegram_users?.username}</div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={toggleAI}>
                    {selected.ai_enabled ? <><Pause className="h-3 w-3 mr-1"/>Pausar IA</> : <><Play className="h-3 w-3 mr-1"/>Ativar IA</>}
                  </Button>
                  <Button size="sm" variant="outline"><UserCheck className="h-3 w-3 mr-1"/>Assumir</Button>
                </div>
              </div>
              <div className="px-4 py-2 border-b border-border flex items-center gap-2 flex-wrap text-xs">
                <Languages className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">Idioma:</span>
                <span className="font-medium uppercase">{leadQ.data?.preferred_language ?? "pt"}</span>
                {leadQ.data?.language_confirmed_at ? (
                  <span className="text-muted-foreground">· confirmado {relTime(leadQ.data.language_confirmed_at)}</span>
                ) : (
                  <span className="text-muted-foreground">· padrão do perfil</span>
                )}
                <div className="ml-auto flex items-center gap-1">
                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => askLanguage("en")}>Perguntar EN</Button>
                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => askLanguage("es")}>Perguntar ES</Button>
                  <Select
                    value={leadQ.data?.preferred_language ?? "pt"}
                    onValueChange={(v) => setLeadLanguage(v as "pt" | "en" | "es", "manual")}
                  >
                    <SelectTrigger className="h-7 w-[120px] text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pt">Português</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-3">
                  {(messages.data ?? []).map((m: any) => (
                    <div key={m.id} className={cn("flex", m.direction === "inbound" ? "justify-start" : "justify-end")}>
                      <div className={cn(
                        "max-w-[75%] rounded-2xl px-4 py-2 text-sm",
                        m.direction === "inbound"
                          ? "bg-muted text-foreground"
                          : m.sender_type === "ai" ? "bg-primary/20 text-foreground border border-primary/30" : "bg-primary text-primary-foreground"
                      )}>
                        <p className="whitespace-pre-wrap">{m.text}</p>
                        <p className="text-[10px] opacity-70 mt-1">{dateTimeBR(m.created_at)} · {m.sender_type}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <div className="p-4 border-t border-border space-y-2">
                <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <Sparkles className="h-4 w-4 text-primary mt-0.5"/>
                  <div className="flex-1 text-xs">
                    <p className="font-medium text-primary">Sugestão da IA (Grok)</p>
                    <p className="text-muted-foreground">Gera resposta usando ficha da influenciadora, memórias do lead e histórias ainda não usadas.</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={suggestWithGrok} disabled={grokLoading}>
                    {grokLoading ? "Gerando..." : "Sugerir"}
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Textarea
                    rows={2}
                    placeholder="Digite sua resposta..."
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    className="flex-1 resize-none"
                  />
                  <Button onClick={sendReply}><Send className="h-4 w-4"/></Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">Selecione uma conversa</div>
          )}
        </Card>

        {/* Direita */}
        <Card className="col-span-12 lg:col-span-3 p-4 bg-card border-border overflow-y-auto">
          {selected && (
            <div className="space-y-4">
              <div>
                <p className="text-xs uppercase text-muted-foreground">Usuário</p>
                <p className="font-semibold">{selected.telegram_users?.first_name} {selected.telegram_users?.last_name}</p>
                <p className="text-xs text-muted-foreground">@{selected.telegram_users?.username}</p>
                <p className="text-xs text-muted-foreground">ID: {selected.telegram_users?.telegram_id}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded bg-muted">
                  <p className="text-muted-foreground">Status</p>
                  <StatusBadge status={userStats.data?.grant ? "active" : "expired"} />
                </div>
                <div className="p-2 rounded bg-muted">
                  <p className="text-muted-foreground">Plano</p>
                  <p className="font-medium">{userStats.data?.grant?.plans?.name ?? "—"}</p>
                </div>
                <div className="p-2 rounded bg-muted">
                  <p className="text-muted-foreground">Vencimento</p>
                  <p className="font-medium">{userStats.data?.grant?.expires_at ? dateTimeBR(userStats.data.grant.expires_at) : "—"}</p>
                </div>
                <div className="p-2 rounded bg-muted">
                  <p className="text-muted-foreground">Último pagamento</p>
                  <p className="font-medium">{userStats.data?.ultimo?.paid_at ? dateTimeBR(userStats.data.ultimo.paid_at) : "—"}</p>
                </div>
                <div className="col-span-2 p-2 rounded bg-muted">
                  <p className="text-muted-foreground">Total pago</p>
                  <p className="font-semibold text-success">{BRL(userStats.data?.totalPago ?? 0)}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Button size="sm" variant="outline" className="w-full">Reenviar link</Button>
                <Button size="sm" variant="outline" className="w-full">Ver pagamentos</Button>
                <Button size="sm" variant="outline" className="w-full">Liberar manualmente</Button>
                <Button size="sm" variant="outline" className="w-full text-warning">Revogar acesso</Button>
                <Button size="sm" variant="outline" className="w-full text-destructive">Bloquear usuário</Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
