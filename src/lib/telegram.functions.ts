import { createServerFn } from "@tanstack/react-start";

const GATEWAY = "https://connector-gateway.lovable.dev/telegram";

async function tgCall(method: string, body: unknown) {
  const lovableKey = process.env.LOVABLE_API_KEY;
  const tgKey = process.env.TELEGRAM_API_KEY;
  if (!lovableKey || !tgKey) {
    return { ok: false, error: "telegram_not_configured" };
  }
  const r = await fetch(`${GATEWAY}/${method}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": tgKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const data = await r.json().catch(() => ({}));
  return r.ok ? { ok: true, data } : { ok: false, error: data?.description ?? r.statusText, status: r.status };
}

// Envia mensagem manual a partir do painel (sender admin).
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

    const result = await tgCall("sendMessage", {
      chat_id: chatId,
      text: data.text,
      reply_markup: data.replyMarkup,
    });

    // Salva mensagem outbound mesmo se Telegram falhar (admin escreveu)
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
      payload: { delivered: result.ok, error: result.ok ? null : result.error },
    });

    await supabaseAdmin
      .from("conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", conv.id);

    return result;
  });

// Cria invite link Telegram para um chat (grupo/canal).
export const createTelegramInviteLink = createServerFn({ method: "POST" })
  .inputValidator((input: { chatId: string; expireSeconds?: number; memberLimit?: number }) => input)
  .handler(async ({ data }) => {
    const result = await tgCall("createChatInviteLink", {
      chat_id: data.chatId,
      expire_date: data.expireSeconds ? Math.floor(Date.now() / 1000) + data.expireSeconds : undefined,
      member_limit: data.memberLimit,
    });
    return result;
  });

// Remove usuário do grupo (ban + unban) — usado quando assinatura vence.
export const removeFromTelegramGroup = createServerFn({ method: "POST" })
  .inputValidator((input: { chatId: string; userId: number }) => input)
  .handler(async ({ data }) => {
    await tgCall("banChatMember", { chat_id: data.chatId, user_id: data.userId });
    await tgCall("unbanChatMember", { chat_id: data.chatId, user_id: data.userId, only_if_banned: true });
    return { ok: true };
  });

// Testa o bot Telegram (botão na tela de Configurações).
export const testTelegramBot = createServerFn({ method: "POST" }).handler(async () => {
  return await tgCall("getMe", {});
});
