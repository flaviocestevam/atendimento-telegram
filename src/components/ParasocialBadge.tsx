import { Badge } from "@/components/ui/badge";

interface ParasocialBadgeProps {
  strength: number;
  className?: string;
}

export function ParasocialBadge({ strength, className = "" }: ParasocialBadgeProps) {
  let badgeText = "";
  let variant: "default" | "secondary" | "outline" = "secondary";

  if (strength >= 70) {
    badgeText = "🔥 Alta Conexão";
    variant = "default";
  } else if (strength >= 40) {
    badgeText = "❤️ Conectado";
    variant = "secondary";
  } else {
    badgeText = "👀 Iniciando";
    variant = "outline";
  }

  return (
    <Badge variant={variant} className={className}>
      {badgeText} ({strength})
    </Badge>
  );
}
