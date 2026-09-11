import { addDays, nights, parseISODate, toISODate, today } from "@/lib/dates";

export type Search = {
  llegada: Date;
  salida: Date;
  adultos: number;
  ninos: number;
  habitaciones: number;
  codigo: string | null;
};

export type RawSearch = {
  llegada?: string | string[];
  salida?: string | string[];
  adultos?: string | string[];
  ninos?: string | string[];
  habitaciones?: string | string[];
  codigo?: string | string[];
};

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

function int(v: string | string[] | undefined, fallback: number, min: number, max: number): number {
  const n = Number.parseInt(first(v) ?? "", 10);
  if (Number.isNaN(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

/** Próximo viernes desde hoy (o hoy si ya es viernes). */
export function defaultArrival(): Date {
  const t = today();
  const dow = t.getUTCDay();
  const delta = (5 - dow + 7) % 7;
  return addDays(t, delta);
}

export type SearchIssue =
  | "salida_no_posterior"
  | "llegada_pasada"
  | "rango_largo";

/**
 * Normaliza los parámetros de búsqueda. Nunca lanza: corrige lo corregible
 * y reporta los problemas que el usuario debe ver.
 */
export function parseSearch(raw: RawSearch): { search: Search; issues: SearchIssue[] } {
  const t = today();
  const issues: SearchIssue[] = [];

  let llegada = parseISODate(first(raw.llegada)) ?? defaultArrival();
  let salida = parseISODate(first(raw.salida)) ?? addDays(llegada, 2);

  if (llegada < t) {
    issues.push("llegada_pasada");
    llegada = defaultArrival();
    salida = addDays(llegada, 2);
  }
  if (salida <= llegada) {
    issues.push("salida_no_posterior");
    salida = addDays(llegada, 2);
  }
  if (nights(llegada, salida) > 30) {
    issues.push("rango_largo");
    salida = addDays(llegada, 30);
  }

  const adultos = int(raw.adultos, 2, 1, 8);
  const ninos = int(raw.ninos, 0, 0, 6);
  const habitaciones = int(raw.habitaciones, 1, 1, 5);
  const codigo = (first(raw.codigo) ?? "").trim().toUpperCase() || null;

  return { search: { llegada, salida, adultos, ninos, habitaciones, codigo }, issues };
}

export function searchToQuery(s: Partial<Search>): string {
  const q = new URLSearchParams();
  if (s.llegada) q.set("llegada", toISODate(s.llegada));
  if (s.salida) q.set("salida", toISODate(s.salida));
  if (s.adultos != null) q.set("adultos", String(s.adultos));
  if (s.ninos != null) q.set("ninos", String(s.ninos));
  if (s.habitaciones != null) q.set("habitaciones", String(s.habitaciones));
  if (s.codigo) q.set("codigo", s.codigo);
  return q.toString();
}

export const ISSUE_TEXT: Record<SearchIssue, string> = {
  salida_no_posterior: "La fecha de salida debe ser posterior a la de llegada. Ajustamos a dos noches.",
  llegada_pasada: "La fecha de llegada ya pasó. La movimos al próximo fin de semana.",
  rango_largo: "Para estadías de más de 30 noches, escríbenos por WhatsApp y lo coordinamos.",
};
