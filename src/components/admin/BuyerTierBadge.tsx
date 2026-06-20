import { cn } from "@/lib/utils";

const TIERS: Record<string, { label: string; emoji: string; cls: string }> = {
  sardinha: { label: "Sardinha", emoji: "🐟", cls: "bg-muted text-muted-foreground border-border" },
  dourado:  { label: "Dourado",  emoji: "🥇", cls: "bg-warning/15 text-warning border-warning/30" },
  salmao:   { label: "Salmão",   emoji: "🍣", cls: "bg-info/15 text-info border-info/30" },
  baleia:   { label: "Baleia",   emoji: "🐋", cls: "bg-primary/15 text-primary border-primary/30" },
};

export function BuyerTierBadge({ tier }: { tier?: string | null }) {
  const cfg = TIERS[tier ?? "sardinha"] ?? TIERS.sardinha;
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border", cfg.cls)}>
      <span>{cfg.emoji}</span>
      <span>{cfg.label}</span>
    </span>
  );
}
