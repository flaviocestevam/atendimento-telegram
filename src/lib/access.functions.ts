import { createServerFn } from "@tanstack/react-start";

// Libera acesso após pagamento aprovado.
// - Para plano: cria access_grant, calcula expires_at, gera invite link Telegram, envia.
// - Para conteúdo: cria access_grant e entrega payload (texto/link/arquivo).
// SEGURANÇA: nunca libera se o payment não estiver `approved`.
export const grantAccess = createServerFn({ method: "POST" })
  .inputValidator((input: { paymentId: string }) => input)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: payment } = await supabaseAdmin
      .from("payments")
      .select("*, orders(*)")
      .eq("id", data.paymentId)
      .maybeSingle();

    if (!payment || payment.status !== "approved") {
      return { ok: false, error: "payment_not_approved" };
    }
    const order: any = (payment as any).orders;
    if (!order) return { ok: false, error: "order_not_found" };

    const isPlan = order.item_type === "plan";
    const accessType = isPlan ? "group" : "content";

    // Busca item para descobrir grupo/duração/payload
    const itemTable = isPlan ? "plans" : "contents";
    const itemId = isPlan ? order.plan_id : order.content_id;
    const { data: item } = await supabaseAdmin.from(itemTable).select("*").eq("id", itemId).maybeSingle();
    if (!item) return { ok: false, error: "item_not_found" };

    let expiresAt: string | null = null;
    if (isPlan && (item as any).duration_days) {
      const d = new Date();
      d.setDate(d.getDate() + (item as any).duration_days);
      expiresAt = d.toISOString();
    } else if (!isPlan && !(item as any).lifetime_access && (item as any).access_duration_days) {
      const d = new Date();
      d.setDate(d.getDate() + (item as any).access_duration_days);
      expiresAt = d.toISOString();
    }

    let inviteLink: string | null = isPlan ? null : null;
    if (isPlan) {
      // tenta criar invite link Telegram pelo grupo configurado
      const { data: group } = await supabaseAdmin
        .from("telegram_groups")
        .select("*")
        .eq("id", (item as any).telegram_group_id)
        .maybeSingle();
      inviteLink = (group as any)?.default_invite_link ?? null;
      // (Geração dinâmica via createChatInviteLink fica disponível em telegram.functions.ts)
    }

    const { data: grant } = await supabaseAdmin
      .from("access_grants")
      .insert({
        seller_profile_id: payment.seller_profile_id,
        lead_id: payment.lead_id,
        telegram_user_id: order.telegram_user_id,
        order_id: order.id,
        plan_id: isPlan ? itemId : null,
        content_id: !isPlan ? itemId : null,
        telegram_group_id: isPlan ? (item as any).telegram_group_id : null,
        access_type: accessType,
        status: "active",
        expires_at: expiresAt,
        invite_link: inviteLink,
        delivery_payload: !isPlan ? (item as any).delivery_payload : null,
      })
      .select("id")
      .single();

    await supabaseAdmin.from("activity_logs").insert({
      type: "access_granted",
      telegram_user_id: order.telegram_user_id,
      description: `Acesso liberado: ${(item as any).name}`,
      metadata: { grant_id: grant?.id, expires_at: expiresAt, invite_link: inviteLink },
    });

    return { ok: true, grantId: grant?.id, inviteLink, expiresAt, isPlan, item };
  });

// Marca acessos vencidos (job manual / cron).
export const revokeExpiredAccess = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: expired } = await supabaseAdmin
    .from("access_grants")
    .select("id, telegram_user_id, telegram_groups(chat_id)")
    .eq("status", "active")
    .lt("expires_at", new Date().toISOString());

  if (expired) {
    for (const g of expired) {
      await supabaseAdmin
        .from("access_grants")
        .update({ status: "expired", revoked_at: new Date().toISOString() })
        .eq("id", (g as any).id);
    }
  }
  return { ok: true, revoked: expired?.length ?? 0 };
});
