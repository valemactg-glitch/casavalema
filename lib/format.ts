const cop = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

/** 210000 → "$210.000" */
export function formatCOP(pesos: number): string {
  return cop.format(Math.round(pesos)).replace(/\s/g, " ");
}

/** 210000 → "$ 210.000" con espacio fino, para totales grandes. */
export function formatCOPLoose(pesos: number): string {
  return cop.format(Math.round(pesos));
}

export function pct(n: number): string {
  return `${n} %`;
}

export function initials(nombre: string): string {
  return nombre
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}
