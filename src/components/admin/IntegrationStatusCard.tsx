import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, CreditCard, Sparkles, Package, Check, AlertCircle, Settings } from "lucide-react";
import { getIntegrationStatus } from "@/lib/integration-status.functions";

function Pill({ ok, label, hint }: { ok: boolean; label: string; hint?: string }) {
  return (
    <div className="flex items-center gap-1.5">
      {ok ? (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] bg-success/15 text-success border border-success/30">
          <Check className="h-3 w-3" />{label}
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] bg-warning/15 text-warning border border-warning/30">
          <AlertCircle className="h-3 w-3" />{label}
        </span>
      )}
      {hint && <span className="text-[10px] text-muted-foreground truncate">{hint}</span>}
    </div>
  );
}

export function IntegrationStatusCard({ profileId }: { profileId: string }) {
  const fn = useServerFn(getIntegrationStatus);
  const q = useQuery({
    queryKey: ["integration_status", profileId],
    queryFn: () => fn({ data: { sellerProfileId: profileId } } as any),
    refetchInterval: 30_000,
  });

  const s = q.data;
  const allOk = !!s && s.telegram.configured && s.cakto.configured && s.grok.configured && s.catalog.ok;

  return (
    <Card className="p-4 bg-card border-border">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          {allOk ? (
            <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
          ) : (
            <span className="h-2 w-2 rounded-full bg-warning" />
          )}
          <h3 className="font-semibold text-sm">
            {allOk ? "Tudo conectado — pronto pra vender" : "Status das integrações"}
          </h3>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link to="/configuracoes"><Settings className="h-3.5 w-3.5 mr-1" />Configurar</Link>
        </Button>
      </div>

      {q.isLoading && <p className="text-xs text-muted-foreground mt-3">Verificando…</p>}

      {s && (
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="flex items-start gap-2">
            <Bot className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div className="space-y-1 min-w-0">
              <p className="text-xs font-medium">Telegram Bot</p>
              <Pill ok={s.telegram.configured} label={s.telegram.configured ? "Conectado" : "Pendente"} hint={s.telegram.botUsername ? `@${s.telegram.botUsername}` : undefined} />
              {s.telegram.lastError && <p className="text-[10px] text-destructive truncate">{s.telegram.lastError}</p>}
            </div>
          </div>

          <div className="flex items-start gap-2">
            <CreditCard className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div className="space-y-1 min-w-0">
              <p className="text-xs font-medium">Cakto (pagamentos)</p>
              <Pill ok={s.cakto.configured} label={s.cakto.configured ? "Chave OK" : "Pendente"} hint={s.cakto.hasWebhookSecret ? "webhook OK" : "sem secret"} />
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div className="space-y-1 min-w-0">
              <p className="text-xs font-medium">IA / Grok</p>
              <Pill ok={s.grok.configured} label={s.grok.configured ? "Disponível" : "Sem chave"} hint={`modo: ${s.grok.mode}`} />
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Package className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div className="space-y-1 min-w-0">
              <p className="text-xs font-medium">Catálogo</p>
              <Pill ok={s.catalog.ok} label={s.catalog.ok ? `${s.catalog.plans} planos · ${s.catalog.contents} conteúdos` : "Vazio"} />
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
