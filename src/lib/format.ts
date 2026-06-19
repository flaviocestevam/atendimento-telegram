export const BRL = (cents: number | null | undefined) =>
  ((cents ?? 0) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const dateBR = (d: string | Date | null | undefined) => {
  if (!d) return "—";
  const dt = typeof d === "string" ? new Date(d) : d;
  return dt.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
};

export const dateTimeBR = (d: string | Date | null | undefined) => {
  if (!d) return "—";
  const dt = typeof d === "string" ? new Date(d) : d;
  return dt.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

export const relTime = (d: string | Date | null | undefined) => {
  if (!d) return "—";
  const dt = typeof d === "string" ? new Date(d) : d;
  const diff = Date.now() - dt.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "agora";
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const days = Math.floor(h / 24);
  return `${days}d`;
};

export const mask = (s: string | null | undefined, visible = 4) => {
  if (!s) return "não configurado";
  if (s.length <= visible) return "•".repeat(s.length);
  return "•".repeat(Math.max(8, s.length - visible)) + s.slice(-visible);
};
