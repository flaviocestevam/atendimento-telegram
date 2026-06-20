import { createServerFn } from "@tanstack/react-start";

// Lê configuração Grok do perfil (se houver) e mescla com fallback de env.
async function resolveGrokConfig(sellerProfileId?: string | null) {
  let perProfile: any = null;
  if (sellerProfileId) {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("seller_grok_settings")
      .select("xai_api_key, model, global_mode, enable_ai")
      .eq("seller_profile_id", sellerProfileId)
      .maybeSingle();
    perProfile = data;
  }
  const xaiKey = perProfile?.xai_api_key || process.env.XAI_API_KEY || null;
  const model = perProfile?.model || process.env.XAI_MODEL || "grok-4-latest";
  const mode = (perProfile?.global_mode as string | undefined) ?? "off";
  const enableAi = !!perProfile?.enable_ai;
  const enabled = enableAi && mode !== "off";
  return { xaiKey, model, mode, enableAi, enabled, perProfile };
}

export const grokStatus = createServerFn({ method: "POST" })
  .inputValidator((input: { sellerProfileId?: string | null } | undefined) => input ?? {})
  .handler(async ({ data }) => {
    const cfg = await resolveGrokConfig(data?.sellerProfileId);
    return {
      available: !!cfg.xaiKey && cfg.enabled,
      hasKey: !!cfg.xaiKey,
      enabled: cfg.enabled,
      mode: cfg.mode,
      model: cfg.model,
      enableAi: cfg.enableAi,
      perProfileConfigured: !!cfg.perProfile?.xai_api_key,
    };
  });

export const pingGrok = createServerFn({ method: "POST" })
  .inputValidator((input: { sellerProfileId?: string | null } | undefined) => input ?? {})
  .handler(async ({ data }) => {
    const cfg = await resolveGrokConfig(data?.sellerProfileId);
    if (!cfg.xaiKey) return { ok: false, error: "missing_xai_api_key" };
    try {
      const r = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${cfg.xaiKey}` },
        body: JSON.stringify({
          model: cfg.model,
          messages: [
            { role: "system", content: "Responda em uma frase curta em português." },
            { role: "user", content: "Diga 'ok' e a data de hoje." },
          ],
          temperature: 0.2,
        }),
      });
      const raw = await r.text();
      let json: any = null;
      try { json = JSON.parse(raw); } catch { /* keep raw */ }
      if (!r.ok) {
        const msg = json?.error?.message ?? json?.error ?? raw ?? `http_${r.status}`;
        return { ok: false, error: `HTTP ${r.status}: ${typeof msg === "string" ? msg : JSON.stringify(msg)}`, model: cfg.model };
      }
      const text = json?.choices?.[0]?.message?.content ?? "";
      return { ok: true, text, model: cfg.model };
    } catch (err: any) {
      return { ok: false, error: err?.message ?? "grok_ping_exception" };
    }
  });

// Chamada principal (auto/sugestão) — agora resolve config a partir do seller da conversa.
export const callGrok = createServerFn({ method: "POST" })
  .inputValidator((input: {
    conversationId: string;
    mode: "suggest" | "auto";
  }) => input)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: conv } = await supabaseAdmin
      .from("conversations")
      .select("*, leads(*), telegram_users(*)")
      .eq("id", data.conversationId)
      .maybeSingle();
    if (!conv) return { ok: false, error: "conversation_not_found" };

    const sellerId = (conv as any).seller_profile_id;
    const cfg = await resolveGrokConfig(sellerId);
    if (!cfg.xaiKey || !cfg.enabled) {
      return { ok: false, error: "grok_disabled", available: false };
    }

    const { data: messages } = await supabaseAdmin
      .from("messages")
      .select("direction, text, created_at")
      .eq("conversation_id", data.conversationId)
      .order("created_at", { ascending: false })
      .limit(15);

    const { data: profile } = await supabaseAdmin
      .from("seller_profiles")
      .select("*")
      .eq("id", sellerId)
      .maybeSingle();

    const { data: platform } = await supabaseAdmin
      .from("seller_platform_settings")
      .select("default_language")
      .eq("seller_profile_id", sellerId)
      .maybeSingle();

    const { data: memories } = await supabaseAdmin
      .from("lead_memories")
      .select("title, content")
      .eq("lead_id", (conv as any).lead_id)
      .eq("is_active", true)
      .limit(20);

    const lead: any = (conv as any).leads ?? null;
    const defaultLang = (platform as any)?.default_language ?? "pt-BR";
    const preferredLang = lead?.preferred_language && lead.preferred_language !== "default"
      ? lead.preferred_language
      : null;
    const activeLang = preferredLang ?? defaultLang;
    const langConfirmed = !!lead?.language_confirmed_at;

    const telegramUserId = (conv as any).telegram_user_id ?? (conv as any).telegram_users?.id ?? null;
    let chosenStory: { id: string; name: string; text: string; variation: number } | null = null;

    if (telegramUserId && sellerId) {
      const { data: usedRows } = await supabaseAdmin
        .from("story_leads")
        .select("story_id")
        .eq("lead_id", telegramUserId);
      const usedIds = (usedRows ?? []).map((r: any) => r.story_id);

      let q = supabaseAdmin
        .from("stories")
        .select("id, name, steps")
        .eq("seller_profile_id", sellerId)
        .eq("status", "active");
      if (usedIds.length) q = q.not("id", "in", `(${usedIds.join(",")})`);
      const { data: candidates } = await q.limit(20);

      if (candidates?.length) {
        const story: any = candidates[Math.floor(Math.random() * candidates.length)];
        const variations = Array.isArray(story.steps) ? story.steps : [];
        if (variations.length) {
          const v: any = variations[Math.floor(Math.random() * variations.length)];
          chosenStory = {
            id: story.id,
            name: story.name,
            text: v?.text ?? "",
            variation: v?.variation ?? 1,
          };
        }
      }
    }

    const languageBlock = [
      `IDIOMA ATIVO DESTA CONVERSA: ${activeLang}${langConfirmed ? " (confirmado pelo lead)" : " (padrão do perfil)"}.`,
      `IDIOMA PADRÃO DO PERFIL: ${defaultLang}.`,
      `REGRAS DE IDIOMA:`,
      `- Sempre responda em "${activeLang}" enquanto não houver confirmação para outro idioma.`,
      `- NUNCA mude o idioma da conversa por causa de palavras isoladas, gírias, nomes de produto, emojis, ou frases curtas em outro idioma (ex.: "ok", "hello", "thanks", "hola", "gracias", "price?", "link?", "pix?", "vip", "checkout").`,
      `- Só considere mudança de idioma se o lead escrever UMA MENSAGEM COMPLETA ou várias mensagens seguidas em inglês ou espanhol.`,
      `- Nesses casos, pergunte antes de mudar:`,
      `  • Para inglês: "vi que você escreveu em inglês. prefere que eu continue conversando com você em inglês?"`,
      `  • Para espanhol: "vi que escribiste en español. ¿prefieres que siga conversando contigo en español?"`,
      `- Só troque o idioma após confirmação clara ("sim", "yes", "sí", "pode", "please", "em inglês", "in English", "en español", "prefiro espanhol", "prefiro inglês").`,
      `- A mudança de idioma NUNCA pode alterar preço, produto, plano, desconto, garantia, entrega, regra de acesso, regra de pagamento, regra de reembolso ou validade da assinatura. Traduza mantendo exatamente o mesmo sentido comercial.`,
    ].join("\n");

    const systemPrompt = [
      cfg.perProfile?.system_prompt || "",
      `Você é ${(profile as any)?.display_name ?? "o vendedor"}.`,
      `Tom: ${(profile as any)?.tone_of_voice ?? "casual"}.`,
      `Estilo: ${(profile as any)?.communication_style ?? "amigável e direto"}.`,
      languageBlock,
      `REGRAS COMERCIAIS: ${(profile as any)?.commercial_rules ?? "Não invente preço, garantia ou benefício."}`,
      `REGRAS EMOCIONAIS: ${(profile as any)?.emotional_rules ?? "Seja empático e respeitoso."}`,
      `PROIBIDO: ${(profile as any)?.forbidden_promises ?? "Não prometa o que não está cadastrado."}`,
      memories?.length ? `Memórias do lead:\n${memories.map((m: any) => `- ${m.title}: ${m.content}`).join("\n")}` : "",
      chosenStory
        ? `HISTÓRIA DISPONÍVEL (ainda não usada com este lead — "${chosenStory.name}", variação ${chosenStory.variation}):\n"${chosenStory.text}"\n\nUse essa história de forma natural e fluida, adaptando ao contexto da conversa. NÃO force se não couber naturalmente. Priorize sempre conexão emocional antes de escalar.`
        : "",
    ].filter(Boolean).join("\n\n");

    const history = (messages ?? []).reverse().map((m: any) => ({
      role: m.direction === "inbound" ? "user" : "assistant",
      content: m.text ?? "",
    }));

    try {
      const r = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cfg.xaiKey}`,
        },
        body: JSON.stringify({
          model: cfg.model,
          messages: [{ role: "system", content: systemPrompt }, ...history],
          temperature: 0.7,
        }),
      });
      const json: any = await r.json();
      if (!r.ok) return { ok: false, error: json?.error?.message ?? "grok_call_failed" };

      const text = json.choices?.[0]?.message?.content ?? "";

      let storyUsed: { id: string; name: string; variation: number } | null = null;
      if (chosenStory && text && telegramUserId) {
        const norm = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, "");
        const sample = norm(chosenStory.text).split(/\s+/).filter((w) => w.length > 4).slice(0, 8);
        const hay = norm(text);
        const hits = sample.filter((w) => hay.includes(w)).length;
        if (hits >= 2) {
          await supabaseAdmin
            .from("story_leads")
            .upsert(
              {
                story_id: chosenStory.id,
                lead_id: telegramUserId,
                current_step: chosenStory.variation,
                last_step_at: new Date().toISOString(),
                status: "active",
              },
              { onConflict: "story_id,lead_id" },
            );
          storyUsed = { id: chosenStory.id, name: chosenStory.name, variation: chosenStory.variation };
        }
      }

      return {
        ok: true,
        text,
        mode: data.mode,
        shouldRequestHuman: false,
        suggestedAction: null,
        storyUsed,
      };
    } catch (err: any) {
      return { ok: false, error: err?.message ?? "grok_call_exception" };
    }
  });
