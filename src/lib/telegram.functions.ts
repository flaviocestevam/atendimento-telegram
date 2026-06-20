import { createServerFn } from "@tanstack/react-start";

const GATEWAY = "https://connector-gateway.lovable.dev/telegram";
const BOT_API = "https://api.telegram.org/bot";

// Resolve token: prioriza seller_bots, cai pro gateway global (TELEGRAM_API_KEY) se nada por perfil.
async function resolveBot(sellerProfileId?: string | null) {
  if (sellerProfileId) {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("seller_bots")
      .select("id, telegram_bot_token, bot_username, status")
      .eq("seller_profile_id", sellerProfileId)
      .maybeSingle();
    if (data?.telegram_bot_token) {
      return { kind: "direct" as const, token: data.telegram_bot_token, botRow: data };
    }
  }
  // Fallback global via gateway
  const lovableKey = process.env.LOVABLE_API_KEY;
  const tgKey = process.env.TELEGRAM_API_KEY;
  if (lovableKey && tgKey) return { kind: "gateway" as const, lovableKey, tgKey, botRow: null };
  return { kind: "none" as const, botRow: null };
}

async function tgCall(method: string, body: unknown, sellerProfileId?: string | null) {
  const bot = await resolveBot(sellerProfileId);
  if (bot.kind === "none") return { ok: false, error: "telegram_not_configured" };

  const url =
    bot.kind === "direct"
      ? `${BOT_API}${bot.token}/${method}`
      : `${GATEWAY}/${method}`;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (bot.kind === "gateway") {
    headers.Authorization = `Bearer ${bot.lovableKey}`;
    headers["X-Connection-Api-Key"] = bot.tgKey;
  }

  const r = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
  const data = await r.json().catch(() => ({}));
  return r.ok ? { ok: true, data } : { ok: false, error: (data as any)?.description ?? r.statusText, status: r.status };
}

export const sendTelegramMessage = createServerFn({ method: "POST" })
  .inputValidator((input: { conversationId: string; text: string; replyMarkup?: unknown }) => input)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: conv, error } = await supabaseAdmin
      .from("conversations")
      .select("id, telegram_user_id, lead_id, seller_profile_id, telegram_users(telegram_id)")
      .eq("id", data.conversationId)
      .maybeSingle();
    if (error || !conv) return { ok: false, error: "conversation_not_found" };
    const chatId = (conv as any).telegram_users?.telegram_id;
    if (!chatId) return { ok: false, error: "no_chat_id" };

    const result = await tgCall(
      "sendMessage",
      { chat_id: chatId, text: data.text, reply_markup: data.replyMarkup },
      (conv as any).seller_profile_id,
    );

    await supabaseAdmin.from("messages").insert({
      seller_profile_id: conv.seller_profile_id,
      conversation_id: conv.id,
      telegram_user_id: conv.telegram_user_id,
      lead_id: conv.lead_id,
      direction: "outbound",
      sender: "admin",
      sender_type: "admin",
      kind: "text",
      text: data.text,
      payload: { delivered: result.ok, error: result.ok ? null : (result as any).error },
    });

    await supabaseAdmin
      .from("conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", conv.id);

    return result;
  });

export const createTelegramInviteLink = createServerFn({ method: "POST" })
  .inputValidator((input: { chatId: string; expireSeconds?: number; memberLimit?: number; sellerProfileId?: string | null }) => input)
  .handler(async ({ data }) => {
    return await tgCall(
      "createChatInviteLink",
      {
        chat_id: data.chatId,
        expire_date: data.expireSeconds ? Math.floor(Date.now() / 1000) + data.expireSeconds : undefined,
        member_limit: data.memberLimit,
      },
      data.sellerProfileId,
    );
  });

export const removeFromTelegramGroup = createServerFn({ method: "POST" })
  .inputValidator((input: { chatId: string; userId: number; sellerProfileId?: string | null }) => input)
  .handler(async ({ data }) => {
    await tgCall("banChatMember", { chat_id: data.chatId, user_id: data.userId }, data.sellerProfileId);
    await tgCall("unbanChatMember", { chat_id: data.chatId, user_id: data.userId, only_if_banned: true }, data.sellerProfileId);
    return { ok: true };
  });

export const testTelegramBot = createServerFn({ method: "POST" })
  .inputValidator((input: { sellerProfileId?: string | null } | undefined) => input ?? {})
  .handler(async ({ data }) => {
    const result = await tgCall("getMe", {}, data?.sellerProfileId);

    // Atualiza status do bot por perfil quando aplicável
    if (data?.sellerProfileId) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const patch = result.ok
        ? {
            status: "active",
            last_error: null,
            telegram_bot_id: String((result as any).data?.result?.id ?? ""),
            bot_username: (result as any).data?.result?.username ?? null,
          }
        : { status: "error", last_error: (result as any).error ?? "test_failed" };
      await supabaseAdmin.from("seller_bots").update(patch as any).eq("seller_profile_id", data.sellerProfileId);
    }
    return result;
  });
