import type { Availability, RatePlan } from "@prisma/client";
import { toISODate } from "@/lib/dates";

export type NightlyLine = { fecha: string; precio: number };

export type Quote = {
  noches: number;
  nightly: NightlyLine[];
  subtotal: number; // suma de noches (antes de descuento)
  descuentoPct: number;
  descuento: number;
  serviciosTotal: number;
  impuestos: number; // 0: los precios ya incluyen impuestos y cargos
  total: number;
  anticipoPct: number;
  anticipo: number; // a pagar ahora
  saldo: number; // se paga al llegar
  reembolsable: boolean;
  politicaCancelacion: string;
};

export type ServiceLine = {
  serviceId: string;
  nombre: string;
  precioUnit: number;
  cantidad: number;
  tipoCobro: string;
  subtotal: number;
};

/** Redondeo a la centena de peso más cercana. */
function roundPeso(n: number): number {
  return Math.round(n / 100) * 100;
}

export function quote(params: {
  availability: Availability[];
  ratePlan: Pick<RatePlan, "reembolsable" | "anticipoPct" | "descuentoPct" | "politicaCancelacion">;
  servicios?: ServiceLine[];
}): Quote {
  const { availability, ratePlan } = params;
  const nightly: NightlyLine[] = availability
    .slice()
    .sort((a, b) => a.fecha.getTime() - b.fecha.getTime())
    .map((r) => ({ fecha: toISODate(r.fecha), precio: r.precio }));

  const noches = nightly.length;
  const subtotal = nightly.reduce((s, l) => s + l.precio, 0);
  const descuentoPct = ratePlan.descuentoPct ?? 0;
  const descuento = descuentoPct > 0 ? roundPeso((subtotal * descuentoPct) / 100) : 0;

  const serviciosTotal = (params.servicios ?? []).reduce((s, l) => s + l.subtotal, 0);
  const impuestos = 0;

  const total = subtotal - descuento + serviciosTotal + impuestos;
  const anticipoPct = ratePlan.reembolsable ? ratePlan.anticipoPct : 100;
  const anticipo = anticipoPct >= 100 ? total : roundPeso((total * anticipoPct) / 100);
  const saldo = total - anticipo;

  return {
    noches,
    nightly,
    subtotal,
    descuentoPct,
    descuento,
    serviciosTotal,
    impuestos,
    total,
    anticipoPct,
    anticipo,
    saldo,
    reembolsable: ratePlan.reembolsable,
    politicaCancelacion: ratePlan.politicaCancelacion,
  };
}

/** Cobro de un servicio según su tipo, dadas noches / habitaciones / huéspedes. */
export function serviceCharge(params: {
  precio: number;
  tipoCobro: string;
  cantidadSolicitada: number; // p.ej. nº de desayunos que el huésped elige
  noches: number;
}): { cantidad: number; subtotal: number } {
  const { precio, tipoCobro, cantidadSolicitada, noches } = params;
  switch (tipoCobro) {
    case "POR_NOCHE":
      return { cantidad: noches, subtotal: precio * noches };
    case "POR_HUESPED":
      return { cantidad: cantidadSolicitada * noches, subtotal: precio * cantidadSolicitada * noches };
    case "POR_HABITACION":
      return { cantidad: 1, subtotal: precio };
    case "BAJO_SOLICITUD":
      return { cantidad: cantidadSolicitada, subtotal: 0 }; // se cotiza aparte
    case "UNA_VEZ":
    default:
      return { cantidad: 1, subtotal: precio };
  }
}

/** Unidad legible del tipo de cobro, para la UI. */
export function cobroLabel(tipoCobro: string): string {
  return (
    {
      POR_NOCHE: "por noche",
      POR_HUESPED: "por huésped / noche",
      POR_HABITACION: "por habitación",
      BAJO_SOLICITUD: "bajo solicitud",
      UNA_VEZ: "pago único",
    }[tipoCobro] ?? ""
  );
}
