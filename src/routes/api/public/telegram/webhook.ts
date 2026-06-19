import { createFileRoute } from "@tanstack/react-router";
import { createHash, timingSafeEqual } from "crypto";

// Webhook público do Telegram.
// - Valida secret derivado do TELEGRAM_API_KEY (conector).
// - Upsert lead em telegram_users + leads.
// - Upsert conversa.
// - Salva mensagem inbound.
// - Processa comandos /start e callbacks de botão.
// - Texto livre: marca conversa como aguardando resposta (Grok desligado é o padrão).
//
// IMPORTANTE: este handler NUNCA libera acesso sozinho — depende sempre de payment.status='approved'.

const GATEWAY = "https://connector-gateway.lovable.dev/telegram";

async function tgSend(method: string, body: unknown) {
  const lovableKey = process.env.LOVABLE_API_KEY;
  const tgKey = process.env.TELEGRAM_API_KEY;
  if (!lovableKey || !tgKey) return null;
  return fetch(`${GATEWAY}/${method}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": tgKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  }).then((r) => r.json()).catch(() => null);
}

function brl(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export const Route = createFileRoute("/api/public/telegram/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.TELEGRAM_API_KEY;
        if (!apiKey) return new Response("Telegram not configured", { status: 503 });

        const expected = createHash("sha256").update(`telegram-webhook:${apiKey}`).digest("base64url");
        const actual = request.headers.get("X-Telegram-Bot-Api-Secret-Token") ?? "";
        const a = Buffer.from(actual);
        const b = Buffer.from(expected);
        if (a.length !== b.length || !timingSafeEqual(a, b)) {
          return new Response("Unauthorized", { status: 401 });
        }

        const update = await request.json();
        const cb = update.callback_query;
        const msg = update.message ?? update.edited_message ?? cb?.message;
        if (!msg?.chat?.id) return Response.json({ ok: true, ignored: true });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const tgId = String((cb?.from ?? msg.from)?.id ?? msg.chat.id);
        const chatId = msg.chat.id;

        // upsert telegram_users
        const { data: tgUser } = await supabaseAdmin
          .from("telegram_users")
          .upsert(
            {
              telegram_id: tgId,
              first_name: (cb?.from ?? msg.from)?.first_name ?? null,
              last_name: (cb?.from ?? msg.from)?.last_name ?? null,
              username: (cb?.from ?? msg.from)?.username ?? null,
            },
            { onConflict: "telegram_id" }
          )
          .select("id, seller_profile_id")
          .single();
        if (!tgUser) return Response.json({ ok: false }, { status: 500 });

        // upsert leads
        const { data: lead } = await supabaseAdmin
          .from("leads")
          .upsert(
            {
              telegram_user_id: tgUser.id,
              seller_profile_id: tgUser.seller_profile_id,
              display_name: (cb?.from ?? msg.from)?.first_name ?? null,
              username: (cb?.from ?? msg.from)?.username ?? null,
              last_interaction_at: new Date().toISOString(),
            },
            { onConflict: "telegram_user_id" }
          )
          .select("id, seller_profile_id")
          .single();

        // upsert conversa
        const { data: conv } = await supabaseAdmin
          .from("conversations")
          .upsert(
            {
              telegram_user_id: tgUser.id,
              lead_id: lead?.id,
              seller_profile_id: tgUser.seller_profile_id,
              last_message_at: new Date().toISOString(),
              last_interaction_at: new Date().toISOString(),
            },
            { onConflict: "telegram_user_id" }
          )
          .select("id, grok_mode")
          .single();

        // salva mensagem
        if (conv) {
          await supabaseAdmin.from("messages").insert({
            seller_profile_id: tgUser.seller_profile_id,
            conversation_id: conv.id,
            telegram_user_id: tgUser.id,
            lead_id: lead?.id,
            direction: "inbound",
            sender: "lead",
            sender_type: "user",
            kind: cb ? "text" : msg.text ? "text" : msg.photo ? "image" : msg.document ? "file" : msg.voice ? "audio" : "text",
            text: cb?.data ?? msg.text ?? msg.caption ?? "",
            payload: cb ?? msg,
          });
        }

        const text = (msg.text ?? "").trim();
        const cbData = cb?.data as string | undefined;

        // ============ /start ============
        if (text.startsWith("/start") || cbData === "menu") {
          await tgSend("sendMessage", {
            chat_id: chatId,
            text: "opa, seja bem-vindo(a). escolhe uma opção aqui embaixo:",
            reply_markup: {
              inline_keyboard: [
                [{ text: "Ver planos", callback_data: "plans" }],
                [{ text: "Ver conteúdos", callback_data: "contents" }],
                [{ text: "Meus acessos", callback_data: "my_access" }],
                [{ text: "Falar com atendimento", callback_data: "human" }],
              ],
            },
          });
          if (cb) await tgSend("answerCallbackQuery", { callback_query_id: cb.id });
          return Response.json({ ok: true, handled: "start" });
        }

        // ============ Listar planos ============
        if (cbData === "plans") {
          const { data: plans } = await supabaseAdmin
            .from("plans")
            .select("id, name, description, price_cents, duration_days")
            .eq("is_active", true)
            .order("price_cents");
          if (!plans?.length) {
            await tgSend("sendMessage", { chat_id: chatId, text: "ainda não tem plano disponível por aqui. me chama daqui a pouco." });
          } else {
            for (const p of plans) {
              await tgSend("sendMessage", {
                chat_id: chatId,
                text: `*${p.name}*\n${p.description ?? ""}\n\n💰 ${brl(p.price_cents)}\n⏱️ ${p.duration_days} dias`,
                parse_mode: "Markdown",
                reply_markup: { inline_keyboard: [[{ text: `Comprar ${p.name}`, callback_data: `buy_plan:${p.id}` }]] },
              });
            }
          }
          if (cb) await tgSend("answerCallbackQuery", { callback_query_id: cb.id });
          return Response.json({ ok: true, handled: "plans" });
        }

        // ============ Listar conteúdos ============
        if (cbData === "contents") {
          const { data: contents } = await supabaseAdmin
            .from("contents")
            .select("id, name, description, price_cents")
            .eq("is_active", true)
            .order("price_cents");
          if (!contents?.length) {
            await tgSend("sendMessage", { chat_id: chatId, text: "ainda não tem conteúdo avulso. me chama daqui a pouco." });
          } else {
            for (const c of contents) {
              await tgSend("sendMessage", {
                chat_id: chatId,
                text: `*${c.name}*\n${c.description ?? ""}\n\n💰 ${brl(c.price_cents)}`,
                parse_mode: "Markdown",
                reply_markup: { inline_keyboard: [[{ text: `Comprar ${c.name}`, callback_data: `buy_content:${c.id}` }]] },
              });
            }
          }
          if (cb) await tgSend("answerCallbackQuery", { callback_query_id: cb.id });
          return Response.json({ ok: true, handled: "contents" });
        }

        // ============ Comprar plano/conteúdo ============
        if (cbData?.startsWith("buy_plan:") || cbData?.startsWith("buy_content:")) {
          const isPlan = cbData.startsWith("buy_plan:");
          const itemId = cbData.split(":")[1];
          const { createCaktoCheckout } = await import("@/lib/cakto.functions");
          const result = await createCaktoCheckout({
            data: {
              leadId: lead!.id,
              telegramUserId: tgUser.id,
              itemType: isPlan ? "plan" : "content",
              planId: isPlan ? itemId : undefined,
              contentId: !isPlan ? itemId : undefined,
            },
          });
          if (result.ok && result.checkoutUrl) {
            const item: any = result.item;
            const tpl = isPlan
              ? `fechado. vou te mandar o acesso por aqui.\n\nPlano: ${item.name}\nValor: ${brl(item.price_cents)}\n\npra pagar, é só clicar aqui:\n${result.checkoutUrl}\n\nassim que o pagamento aprovar, eu libero seu acesso automaticamente.`
              : `tenho esse conteúdo separado pra vc.\n\nConteúdo: ${item.name}\nValor: ${brl(item.price_cents)}\n\npra pegar, paga por aqui:\n${result.checkoutUrl}\n\nquando aprovar, eu te envio aqui no Telegram.`;
            await tgSend("sendMessage", {
              chat_id: chatId, text: tpl,
              reply_markup: { inline_keyboard: [[{ text: "Já paguei", callback_data: `paid:${result.paymentId}` }]] },
            });
          } else {
            await tgSend("sendMessage", { chat_id: chatId, text: "deu ruim ao gerar o checkout. me chama que eu resolvo." });
          }
          if (cb) await tgSend("answerCallbackQuery", { callback_query_id: cb.id });
          return Response.json({ ok: true, handled: "buy" });
        }

        // ============ Já paguei ============
        if (cbData?.startsWith("paid:")) {
          const paymentId = cbData.split(":")[1];
          const { data: payment } = await supabaseAdmin.from("payments").select("status").eq("id", paymentId).maybeSingle();
          if (payment?.status === "approved") {
            await tgSend("sendMessage", { chat_id: chatId, text: "pagamento aprovado ✅ vou te mandar o acesso agora mesmo." });
          } else {
            await tgSend("sendMessage", { chat_id: chatId, text: "ainda não apareceu aprovado aqui. normalmente atualiza em alguns minutos. se já pagou, tenta de novo daqui a pouco." });
          }
          if (cb) await tgSend("answerCallbackQuery", { callback_query_id: cb.id });
          return Response.json({ ok: true, handled: "paid_check" });
        }

        // ============ Meus acessos ============
        if (cbData === "my_access") {
          const { data: grants } = await supabaseAdmin
            .from("access_grants")
            .select("access_type, status, expires_at, invite_link, delivery_payload, plans(name), contents(name)")
            .eq("telegram_user_id", tgUser.id)
            .eq("status", "active");
          if (!grants?.length) {
            await tgSend("sendMessage", { chat_id: chatId, text: "vc ainda não tem acesso ativo. quer ver os planos?" });
          } else {
            const lines = grants.map((g: any) => {
              const name = g.plans?.name ?? g.contents?.name ?? "Acesso";
              const exp = g.expires_at ? ` · vence em ${new Date(g.expires_at).toLocaleDateString("pt-BR")}` : " · vitalício";
              const link = g.invite_link ? `\n  ${g.invite_link}` : g.delivery_payload ? `\n  ${g.delivery_payload}` : "";
              return `• ${name}${exp}${link}`;
            }).join("\n\n");
            await tgSend("sendMessage", { chat_id: chatId, text: `seus acessos ativos:\n\n${lines}` });
          }
          if (cb) await tgSend("answerCallbackQuery", { callback_query_id: cb.id });
          return Response.json({ ok: true, handled: "my_access" });
        }

        // ============ Falar com atendimento ============
        if (cbData === "human") {
          await supabaseAdmin.from("conversations").update({ needs_human: true }).eq("id", conv!.id);
          await tgSend("sendMessage", { chat_id: chatId, text: "beleza, me manda sua dúvida aqui que eu te respondo por aqui." });
          if (cb) await tgSend("answerCallbackQuery", { callback_query_id: cb.id });
          return Response.json({ ok: true, handled: "human" });
        }

        // ============ Texto livre ============
        // Modo demo: Grok desligado → marca aguardando resposta humana.
        // (Quando Grok estiver ligado, o caller pode disparar suggest/auto.)
        if (text && conv) {
          await supabaseAdmin.from("conversations").update({ needs_human: true }).eq("id", conv.id);
        }

        return Response.json({ ok: true });
      },
    },
  },
});
