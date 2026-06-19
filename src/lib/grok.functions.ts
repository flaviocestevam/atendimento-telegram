import { createServerFn } from "@tanstack/react-start";

// Verifica se o Grok está habilitado e configurado.
// Retorna { available, reason } — todo fluxo de IA passa por aqui antes de chamar.
export const grokStatus = createServerFn({ method: "GET" }).handler(async () => {
  const hasKey = !!process.env.XAI_API_KEY;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: ai } = await supabaseAdmin
    .from("ai_settings")
    .select("grok_global_mode")
    .limit(1)
    .maybeSingle();
  const mode = (ai?.grok_global_mode as string | undefined) ?? "off";
  const enabled = mode !== "off";
  return {
    available: hasKey && enabled,
    hasKey,
    enabled,
    mode,
    model: process.env.XAI_MODEL ?? "grok-2-latest",
  };
});

// Teste rápido: faz uma chamada mínima ao endpoint da xAI e retorna o texto.
export const pingGrok = createServerFn({ method: "POST" }).handler(async () => {
  const xaiKey = process.env.XAI_API_KEY;
  if (!xaiKey) return { ok: false, error: "missing_XAI_API_KEY" };
  const model = process.env.XAI_MODEL ?? "grok-2-latest";
  try {
    const r = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${xaiKey}` },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: "Responda em uma frase curta em português." },
          { role: "user", content: "Diga 'ok' e a data de hoje." },
        ],
        temperature: 0.2,
      }),
    });
    const json: any = await r.json();
    if (!r.ok) return { ok: false, error: json?.error?.message ?? `http_${r.status}`, model };
    const text = json.choices?.[0]?.message?.content ?? "";
    return { ok: true, text, model };
  } catch (err: any) {
    return { ok: false, error: err?.message ?? "grok_ping_exception" };
  }
});

// Chamada principal ao Grok (modo automático ou sugestão).
// Retorna texto + flags de segurança. NÃO envia nada por conta própria.
export const callGrok = createServerFn({ method: "POST" })
  .inputValidator((input: {
    conversationId: string;
    mode: "suggest" | "auto";
  }) => input)
  .handler(async ({ data }) => {
    const xaiKey = process.env.XAI_API_KEY;
    const { supabaseAdmin: _adminCheck } = await import("@/integrations/supabase/client.server");
    const { data: aiCheck } = await _adminCheck
      .from("ai_settings")
      .select("grok_global_mode")
      .limit(1)
      .maybeSingle();
    const enabled = ((aiCheck?.grok_global_mode as string | undefined) ?? "off") !== "off";
    if (!xaiKey || !enabled) {
      return { ok: false, error: "grok_disabled", available: false };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Contexto mínimo: últimas 15 mensagens + perfil do vendedor + memórias do lead
    const { data: conv } = await supabaseAdmin
      .from("conversations")
      .select("*, leads(*), telegram_users(*)")
      .eq("id", data.conversationId)
      .maybeSingle();
    if (!conv) return { ok: false, error: "conversation_not_found" };

    const { data: messages } = await supabaseAdmin
      .from("messages")
      .select("direction, text, created_at")
      .eq("conversation_id", data.conversationId)
      .order("created_at", { ascending: false })
      .limit(15);

    const { data: profile } = await supabaseAdmin
      .from("seller_profiles")
      .select("*")
      .eq("id", (conv as any).seller_profile_id)
      .maybeSingle();

    const { data: memories } = await supabaseAdmin
      .from("lead_memories")
      .select("title, content")
      .eq("lead_id", (conv as any).lead_id)
      .eq("is_active", true)
      .limit(20);

    // === Banco de Histórias: escolhe uma ainda não usada com este lead ===
    const telegramUserId = (conv as any).telegram_user_id ?? (conv as any).telegram_users?.id ?? null;
    const sellerId = (conv as any).seller_profile_id;
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

    const systemPrompt = [
      `Você é ${(profile as any)?.display_name ?? "o vendedor"}.`,
      `Tom: ${(profile as any)?.tone_of_voice ?? "casual"}.`,
      `Estilo: ${(profile as any)?.communication_style ?? "amigável e direto"}.`,
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
          Authorization: `Bearer ${xaiKey}`,
        },
        body: JSON.stringify({
          model: process.env.XAI_MODEL ?? "grok-2-latest",
          messages: [{ role: "system", content: systemPrompt }, ...history],
          temperature: 0.7,
        }),
      });
      const json: any = await r.json();
      if (!r.ok) return { ok: false, error: json?.error?.message ?? "grok_call_failed" };

      const text = json.choices?.[0]?.message?.content ?? "";

      // Se a IA realmente incorporou a história sugerida, registra como usada.
      // Heurística: pega ~6 palavras significativas da história e procura overlap no texto.
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
