import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { tgCall } from "@/lib/telegram.functions";

export const Route = createFileRoute("/api/public/scheduled-posts/run")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = request.headers.get("apikey");
        if (apiKey !== process.env.SUPABASE_PUBLISHABLE_KEY) {
          return new Response("Unauthorized", { status: 401 });
        }

        const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
        const nowIso = new Date().toISOString();

        const { data: due, error } = await supabase
          .from("scheduled_posts")
          .select("id, seller_profile_id, telegram_group_id, message")
          .eq("status", "scheduled")
          .lte("scheduled_at", nowIso)
          .limit(25);

        if (error) return Response.json({ error: error.message }, { status: 500 });

        const results: any[] = [];
        for (const post of due ?? []) {
          // Resolve target chat_ids
          let groups: { chat_id: string }[] = [];
          if (post.telegram_group_id) {
            const g = await supabase.from("telegram_groups").select("chat_id").eq("id", post.telegram_group_id).maybeSingle();
            if (g.data?.chat_id) groups = [{ chat_id: g.data.chat_id }];
          } else {
            const gs = await supabase
              .from("telegram_groups")
              .select("chat_id")
              .eq("seller_profile_id", post.seller_profile_id)
              .eq("status", "active");
            groups = (gs.data ?? []) as any;
          }

          if (groups.length === 0) {
            await supabase.from("scheduled_posts").update({ status: "failed", error: "no_target_groups", sent_at: nowIso }).eq("id", post.id);
            results.push({ id: post.id, ok: false, error: "no_target_groups" });
            continue;
          }

          const sendResults: any[] = [];
          let anyOk = false;
          for (const g of groups) {
            const r = await tgCall("sendMessage", { chat_id: g.chat_id, text: post.message }, post.seller_profile_id);
            sendResults.push({ chat_id: g.chat_id, ...r });
            if (r.ok) anyOk = true;
          }

          await supabase
            .from("scheduled_posts")
            .update({
              status: anyOk ? "sent" : "failed",
              error: anyOk ? null : "all_sends_failed",
              sent_at: new Date().toISOString(),
              result: sendResults,
            })
            .eq("id", post.id);
          results.push({ id: post.id, ok: anyOk, sent: sendResults.length });
        }

        return Response.json({ processed: results.length, results });
      },
    },
  },
});
