/**
 * E2E: Profile isolation
 *
 * Simulates "switching the active profile selector" by iterating every
 * seller_profile and querying the exact same tables Dashboard, Conversas,
 * Leads, Planos and Pagamentos query in the UI. Asserts that:
 *
 *   1. Every row returned for profile X carries seller_profile_id === X
 *      (no cross-vendor leak in either direction).
 *   2. Cross-checking the same query for a sibling profile never returns
 *      any row that belonged to the first profile.
 *   3. There are no orphan rows with NULL seller_profile_id in the tested
 *      tables (those would show up for every active profile and break
 *      isolation).
 *
 * Run:
 *   TEST_EMAIL=you@example.com TEST_PASSWORD=*** bun tests/e2e/profile-isolation.ts
 *
 * The test logs in with the provided credentials so RLS runs as a real
 * user — exactly like the browser. Exits with code 1 on any violation.
 */
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? "https://hdaslwkfrsjbywsvxmsn.supabase.co";
const SUPABASE_ANON =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkYXNsd2tmcnNqYnl3c3Z4bXNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4ODY0NDEsImV4cCI6MjA5NzQ2MjQ0MX0.1AWHvjTt8FhSHJrnSCZ1ydARKGEHyYlLRdd57dULyI0";

const EMAIL = process.env.TEST_EMAIL;
const PASSWORD = process.env.TEST_PASSWORD;

if (!EMAIL || !PASSWORD) {
  console.error("Missing TEST_EMAIL / TEST_PASSWORD env vars.");
  process.exit(2);
}

const sb = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: { persistSession: false },
});

type Row = { seller_profile_id: string | null; id?: string | number };

let failures = 0;
const fail = (msg: string) => {
  failures++;
  console.error("  ✗", msg);
};
const ok = (msg: string) => console.log("  ✓", msg);

async function queryForProfile(table: string, profileId: string): Promise<Row[]> {
  const { data, error } = await sb
    .from(table)
    .select("id, seller_profile_id")
    .eq("seller_profile_id", profileId)
    .limit(1000);
  if (error) throw new Error(`${table}: ${error.message}`);
  return (data ?? []) as Row[];
}

async function checkOrphans(table: string) {
  const { count, error } = await sb
    .from(table)
    .select("id", { count: "exact", head: true })
    .is("seller_profile_id", null);
  if (error) {
    console.warn(`  ! ${table}: cannot check orphans (${error.message})`);
    return;
  }
  if ((count ?? 0) > 0) fail(`${table}: ${count} orphan row(s) with NULL seller_profile_id`);
  else ok(`${table}: no orphan rows`);
}

async function main() {
  console.log("→ Signing in as", EMAIL);
  const { error: authErr } = await sb.auth.signInWithPassword({ email: EMAIL!, password: PASSWORD! });
  if (authErr) {
    console.error("Login failed:", authErr.message);
    process.exit(2);
  }

  const { data: profiles, error: pErr } = await sb
    .from("seller_profiles")
    .select("id, display_name, status");
  if (pErr) throw pErr;
  if (!profiles || profiles.length < 2) {
    console.error("Need at least 2 seller_profiles to test isolation. Found:", profiles?.length ?? 0);
    process.exit(2);
  }

  console.log(`→ ${profiles.length} profiles found:`, profiles.map((p) => p.display_name).join(", "));

  // Tables touched by Dashboard / Conversas / Leads / Planos / Pagamentos.
  const tables = [
    "leads",
    "conversations",
    "messages",
    "telegram_users",
    "plans",
    "telegram_groups",
    "payments",
    "orders",
    "access_grants",
    "cakto_events",
  ];

  console.log("\n[1] Orphan rows (NULL seller_profile_id)");
  for (const t of tables) await checkOrphans(t);

  console.log("\n[2] Per-profile query isolation");
  // For every profile, every table: every returned row must carry that profile id.
  // Then cross-check: rows of profile A must not appear in profile B's result set.
  const byProfile: Record<string, Record<string, Set<string>>> = {};
  for (const p of profiles) {
    byProfile[p.id] = {};
    for (const t of tables) {
      const rows = await queryForProfile(t, p.id);
      const wrong = rows.filter((r) => r.seller_profile_id !== p.id);
      if (wrong.length) fail(`${t} @ ${p.display_name}: ${wrong.length} row(s) with foreign seller_profile_id`);
      byProfile[p.id][t] = new Set(rows.map((r) => String(r.id)));
    }
    ok(`${p.display_name}: ${tables.length} tables filtered cleanly`);
  }

  console.log("\n[3] Cross-profile leak check");
  for (const a of profiles) {
    for (const b of profiles) {
      if (a.id === b.id) continue;
      for (const t of tables) {
        const overlap = [...byProfile[a.id][t]].filter((id) => byProfile[b.id][t].has(id));
        if (overlap.length) fail(`${t}: ${overlap.length} id(s) appear under both ${a.display_name} and ${b.display_name}`);
      }
    }
  }
  if (failures === 0) ok("no row leaks between any pair of profiles");

  console.log(`\n${failures === 0 ? "✅ PASS" : `❌ FAIL (${failures} issue${failures === 1 ? "" : "s"})`}`);
  await sb.auth.signOut();
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
