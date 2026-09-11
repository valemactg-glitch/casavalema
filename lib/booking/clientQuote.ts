/**
 * Cotización en el cliente a partir del calendario ya cargado.
 * Es sólo para mostrar precios mientras el huésped elige fechas; la
 * verdad de precio y disponibilidad se recalcula en el servidor al
 * crear la retención y la reserva.
 */

export type CalNight = {
  fecha: string;
  precio: number | null;
  estadiaMin: number;
  disponible: boolean;
};

export type ClientPlan = {
  id: string;
  nombre: string;
  reembolsable: boolean;
  anticipoPct: number;
  descuentoPct: number;
  politicaCancelacion: string;
};

export type ClientQuote = {
  noches: number;
  nightly: { fecha: string; precio: number }[];
  subtotal: number;
  descuento: number;
  total: number;
  anticipo: number;
  saldo: number;
  minStay: number;
  todasDisponibles: boolean;
};

function roundPeso(n: number) {
  return Math.round(n / 100) * 100;
}

export function nightsInRange(llegada: string, salida: string): string[] {
  const out: string[] = [];
  const d = new Date(llegada + "T00:00:00Z");
  const end = new Date(salida + "T00:00:00Z");
  while (d < end) {
    out.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
}

export function clientQuote(
  calendar: CalNight[],
  llegada: string,
  salida: string,
  plan: ClientPlan | null,
): ClientQuote | null {
  if (!llegada || !salida || salida <= llegada) return null;
  const byDate = new Map(calendar.map((c) => [c.fecha, c]));
  const fechas = nightsInRange(llegada, salida);
  const nightly: { fecha: string; precio: number }[] = [];
  let minStay = 1;
  let todas = true;
  for (const f of fechas) {
    const c = byDate.get(f);
    if (!c || c.precio == null) return null;
    if (!c.disponible) todas = false;
    minStay = Math.max(minStay, c.estadiaMin);
    nightly.push({ fecha: f, precio: c.precio });
  }
  const noches = nightly.length;
  const subtotal = nightly.reduce((s, n) => s + n.precio, 0);
  const descuentoPct = plan?.descuentoPct ?? 0;
  const descuento = descuentoPct ? roundPeso((subtotal * descuentoPct) / 100) : 0;
  const total = subtotal - descuento;
  const anticipoPct = plan ? (plan.reembolsable ? plan.anticipoPct : 100) : 30;
  const anticipo = anticipoPct >= 100 ? total : roundPeso((total * anticipoPct) / 100);
  return {
    noches,
    nightly,
    subtotal,
    descuento,
    total,
    anticipo,
    saldo: total - anticipo,
    minStay,
    todasDisponibles: todas,
  };
}
