/**
 * Todas las "noches" del sistema se representan como Date a medianoche UTC.
 * Prisma `@db.Date` devuelve exactamente eso al leer, así que comparaciones
 * y claves únicas cuadran sin depender de la zona horaria del servidor.
 * Colombia no tiene horario de verano: la zona local es GMT-5 fija.
 */

export const BOGOTA_OFFSET_MIN = -5 * 60;

/** Fecha de "hoy" en Colombia, como Date a medianoche UTC. */
export function today(): Date {
  const now = new Date();
  const bogota = new Date(now.getTime() + BOGOTA_OFFSET_MIN * 60_000);
  return new Date(Date.UTC(bogota.getUTCFullYear(), bogota.getUTCMonth(), bogota.getUTCDate()));
}

/** 'yyyy-MM-dd' → Date a medianoche UTC. Devuelve null si no es válida. */
export function parseISODate(s: string | null | undefined): Date | null {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const [y, m, d] = s.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  if (
    date.getUTCFullYear() !== y ||
    date.getUTCMonth() !== m - 1 ||
    date.getUTCDate() !== d
  ) {
    return null;
  }
  return date;
}

export function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setUTCDate(r.getUTCDate() + n);
  return r;
}

export function diffDays(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

/** Número de noches entre llegada y salida (salida exclusiva). */
export function nights(llegada: Date, salida: Date): number {
  return diffDays(llegada, salida);
}

/** Cada noche ocupada: [llegada, salida). */
export function eachNight(llegada: Date, salida: Date): Date[] {
  const out: Date[] = [];
  for (let d = new Date(llegada); d < salida; d = addDays(d, 1)) {
    out.push(new Date(d));
  }
  return out;
}

export function isWeekend(d: Date): boolean {
  const dow = d.getUTCDay();
  return dow === 5 || dow === 6;
}

// ── Formato en español ─────────────────────────────────────────

const DIAS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
const MESES = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];
const MESES_LARGOS = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

/** "vie 12 dic 2026" */
export function formatDateEs(d: Date, opts?: { year?: boolean; weekday?: boolean }): string {
  const { year = true, weekday = true } = opts ?? {};
  const parts: string[] = [];
  if (weekday) parts.push(DIAS[d.getUTCDay()]);
  parts.push(String(d.getUTCDate()));
  parts.push(MESES[d.getUTCMonth()]);
  if (year) parts.push(String(d.getUTCFullYear()));
  return parts.join(" ");
}

/** "12 de diciembre de 2026" */
export function formatDateLongEs(d: Date): string {
  return `${d.getUTCDate()} de ${MESES_LARGOS[d.getUTCMonth()]} de ${d.getUTCFullYear()}`;
}

/** "12 – 14 dic 2026" o "28 dic 2026 – 2 ene 2027" */
export function formatRangeEs(llegada: Date, salida: Date): string {
  const mismoMes =
    llegada.getUTCMonth() === salida.getUTCMonth() &&
    llegada.getUTCFullYear() === salida.getUTCFullYear();
  if (mismoMes) {
    return `${llegada.getUTCDate()} – ${salida.getUTCDate()} ${MESES[salida.getUTCMonth()]} ${salida.getUTCFullYear()}`;
  }
  return `${formatDateEs(llegada, { weekday: false })} – ${formatDateEs(salida, { weekday: false })}`;
}

export function nightsLabel(n: number): string {
  return n === 1 ? "1 noche" : `${n} noches`;
}

export function guestsLabel(adultos: number, ninos: number): string {
  const a = adultos === 1 ? "1 adulto" : `${adultos} adultos`;
  if (!ninos) return a;
  const n = ninos === 1 ? "1 niño" : `${ninos} niños`;
  return `${a}, ${n}`;
}
