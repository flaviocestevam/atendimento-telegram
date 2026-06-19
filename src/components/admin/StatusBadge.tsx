import { cn } from "@/lib/utils";

type Variant = "success" | "warning" | "info" | "destructive" | "muted" | "primary";

const styles: Record<Variant, string> = {
  success: "bg-success/15 text-success border border-success/30",
  warning: "bg-warning/15 text-warning border border-warning/30",
  info: "bg-info/15 text-info border border-info/30",
  destructive: "bg-destructive/15 text-destructive border border-destructive/30",
  muted: "bg-muted text-muted-foreground border border-border",
  primary: "bg-primary/15 text-primary border border-primary/30",
};

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: Variant }> = {
    // pagamentos
    active: { label: "Ativo", variant: "success" },
    paid: { label: "Pago", variant: "success" },
    approved: { label: "Aprovado", variant: "success" },
    pending: { label: "Pendente", variant: "warning" },
    checkout_sent: { label: "Checkout enviado", variant: "info" },
    open: { label: "Aberta", variant: "info" },
    expired: { label: "Vencido", variant: "muted" },
    cancelled: { label: "Cancelado", variant: "muted" },
    refunded: { label: "Reembolsado", variant: "muted" },
    failed: { label: "Falhou", variant: "destructive" },
    blocked: { label: "Bloqueado", variant: "destructive" },
    revoked: { label: "Revogado", variant: "destructive" },
    inactive: { label: "Inativo", variant: "muted" },
    // conversa
    human: { label: "Humano", variant: "info" },
    ai: { label: "IA ativa", variant: "primary" },
    grok_on: { label: "Grok ligado", variant: "primary" },
    grok_off: { label: "Grok pausado", variant: "muted" },
    needs_human: { label: "Precisa humano", variant: "warning" },
    // leads
    new: { label: "Novo", variant: "info" },
    in_conversation: { label: "Em conversa", variant: "info" },
    awaiting_reply: { label: "Aguardando", variant: "warning" },
    pix_pending: { label: "Pix pendente", variant: "warning" },
    buyer: { label: "Comprador", variant: "success" },
    subscriber_active: { label: "Assinante", variant: "success" },
    subscription_expired: { label: "Assinatura vencida", variant: "muted" },
    in_funnel: { label: "Em funil", variant: "primary" },
    in_story: { label: "Em história", variant: "primary" },
    ready_upsell: { label: "Pronto p/ upsell", variant: "info" },
    // temperatura
    cold: { label: "Frio", variant: "muted" },
    warm: { label: "Morno", variant: "warning" },
    hot: { label: "Quente", variant: "destructive" },
  };
  const cfg = map[status] ?? { label: status, variant: "muted" as Variant };
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium", styles[cfg.variant])}>
      {cfg.label}
    </span>
  );
}
