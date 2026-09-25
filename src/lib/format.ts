// Los eventos son en Costa Rica: "hoy" se calcula en esa zona horaria, sin importar
// desde dónde se visite el sitio.
const EVENT_TIME_ZONE = "America/Costa_Rica";

/** Fecha de hoy en Costa Rica, como YYYY-MM-DD. */
export function todayISO(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: EVENT_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** Hora actual en Costa Rica, como "HH:MM" (mismo formato que events.time). */
export function nowTimeHM(): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: EVENT_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return `${get("hour")}:${get("minute")}`;
}

/**
 * Misma regla que el sitio: un evento pasa a "pasados" cuando llega su fecha y hora de inicio
 * en Costa Rica; si no tiene hora, al terminar ese día.
 */
export function isEventPast(event: { date_short: string; time: string | null }): boolean {
  const today = todayISO();
  if (event.date_short !== today) return event.date_short < today;
  return !!event.time && event.time <= nowTimeHM();
}

/** Filtro de PostgREST (para `.or()`) con los eventos que todavía no empezaron. */
export function upcomingEventsFilter(): string {
  const d = todayISO();
  return `date_short.gt.${d},and(date_short.eq.${d},or(time.is.null,time.eq."",time.gt."${nowTimeHM()}"))`;
}

function fromISODate(date: string): Date | null {
  const [y, m, d] = date.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** "Sábado, 14 de agosto de 2026" */
export function formatEventDate(date: string | null | undefined): string {
  if (!date) return "";
  const d = fromISODate(date);
  if (!d) return date;
  return capitalize(
    d.toLocaleDateString("es-419", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
  );
}

/** "14 ago 2026" (para listas compactas) */
export function formatShortDate(date: string | null | undefined): string {
  if (!date) return "";
  const d = fromISODate(date);
  if (!d) return date;
  return d.toLocaleDateString("es-419", { day: "numeric", month: "short", year: "numeric" });
}

/** "10 de abril de 2026" (fecha de publicación de noticias, guardada como timestamp) */
export function formatNewsDate(timestamp: string | null | undefined): string {
  if (!timestamp) return "";
  return new Date(timestamp).toLocaleDateString("es-419", {
    timeZone: EVENT_TIME_ZONE,
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Resumen de una noticia: el que cargó el editor o las primeras líneas del contenido. */
export function newsExcerpt(summary: string | null, content: string | null, length = 150): string {
  if (summary?.trim()) return summary.trim();
  const text = (content ?? "").replace(/\s+/g, " ").trim();
  return text.length > length ? `${text.slice(0, length).trimEnd()}...` : text;
}

export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " y ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
