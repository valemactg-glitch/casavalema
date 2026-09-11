/** Etiquetas de amenidades. Debe coincidir con prisma/seed.ts. */
export const AMENIDADES: Record<string, string> = {
  wifi: "Wi-Fi de fibra",
  agua_caliente: "Agua caliente",
  ropa_cama_algodon: "Ropa de cama de algodón",
  toallas: "Toallas",
  amenities_bano: "Amenities de baño",
  secador: "Secador",
  closet: "Clóset con perchas",
  escritorio: "Escritorio y silla",
  tv: "Televisión",
  aire: "Aire acondicionado",
  ventilador: "Ventilador de techo",
  cafetera: "Cafetera y hervidor",
  acceso_rooftop: "Acceso al rooftop",
  ventana_patio: "Ventana al patio",
};

export function amenidadLabel(clave: string): string {
  return AMENIDADES[clave] ?? clave;
}

export const DOC_TIPOS: { value: string; label: string }[] = [
  { value: "CC", label: "Cédula de ciudadanía" },
  { value: "CE", label: "Cédula de extranjería" },
  { value: "PP", label: "Pasaporte" },
  { value: "TI", label: "Tarjeta de identidad" },
  { value: "NIT", label: "NIT" },
];

export const MOTIVOS_CONTACTO = [
  "Consulta de disponibilidad",
  "Reserva de grupo",
  "Factura o datos tributarios",
  "Servicios y experiencias",
  "Prensa o alianzas",
  "Otro",
];

export const PISO_LEGAL = 4.5; // contraste mínimo — recordatorio, no se usa en runtime
