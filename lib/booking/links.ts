import { toISODate } from "@/lib/dates";

export type BookingLinkParams = {
  slug: string;
  llegada: Date | string;
  salida: Date | string;
  adultos: number;
  ninos: number;
  plan?: string;
};

/** URL al flujo de reserva con la habitación y las fechas ya elegidas. */
export function reservarHref(p: BookingLinkParams): string {
  const q = new URLSearchParams({
    habitacion: p.slug,
    llegada: typeof p.llegada === "string" ? p.llegada : toISODate(p.llegada),
    salida: typeof p.salida === "string" ? p.salida : toISODate(p.salida),
    adultos: String(p.adultos),
    ninos: String(p.ninos),
  });
  if (p.plan) q.set("plan", p.plan);
  return `/reservar?${q.toString()}`;
}
