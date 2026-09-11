export type Rol =
  | "PROPIETARIO"
  | "ADMINISTRADOR"
  | "RECEPCION"
  | "CONTABILIDAD"
  | "EDITOR"
  | "SOLO_LECTURA";

export const ROLES: { value: Rol; label: string; descripcion: string }[] = [
  { value: "PROPIETARIO", label: "Propietario", descripcion: "Control total, incluidos usuarios y configuración." },
  { value: "ADMINISTRADOR", label: "Administrador", descripcion: "Toda la operación salvo usuarios y datos bancarios." },
  { value: "RECEPCION", label: "Recepción", descripcion: "Calendario, reservas, check-in/out y huéspedes." },
  { value: "CONTABILIDAD", label: "Contabilidad", descripcion: "Pagos, reembolsos y reportes financieros." },
  { value: "EDITOR", label: "Editor de contenido", descripcion: "Contenido del sitio, galería, reseñas y FAQ." },
  { value: "SOLO_LECTURA", label: "Solo lectura", descripcion: "Ver todo, sin modificar nada." },
];

/** Módulos del portal (para la barra lateral y la matriz de permisos). */
export type Modulo =
  | "dashboard"
  | "calendario"
  | "reservas"
  | "habitaciones"
  | "tarifas"
  | "pagos"
  | "huespedes"
  | "servicios"
  | "resenas"
  | "mensajes"
  | "contenido"
  | "galeria"
  | "reportes"
  | "usuarios"
  | "configuracion";

type Nivel = "none" | "read" | "write";

const MATRIX: Record<Modulo, Record<Rol, Nivel>> = {
  dashboard:     { PROPIETARIO: "read",  ADMINISTRADOR: "read",  RECEPCION: "read",  CONTABILIDAD: "read",  EDITOR: "read",  SOLO_LECTURA: "read" },
  calendario:    { PROPIETARIO: "write", ADMINISTRADOR: "write", RECEPCION: "write", CONTABILIDAD: "read",  EDITOR: "none",  SOLO_LECTURA: "read" },
  reservas:      { PROPIETARIO: "write", ADMINISTRADOR: "write", RECEPCION: "write", CONTABILIDAD: "read",  EDITOR: "none",  SOLO_LECTURA: "read" },
  habitaciones:  { PROPIETARIO: "write", ADMINISTRADOR: "write", RECEPCION: "read",  CONTABILIDAD: "none",  EDITOR: "write", SOLO_LECTURA: "read" },
  tarifas:       { PROPIETARIO: "write", ADMINISTRADOR: "write", RECEPCION: "read",  CONTABILIDAD: "read",  EDITOR: "none",  SOLO_LECTURA: "read" },
  pagos:         { PROPIETARIO: "write", ADMINISTRADOR: "write", RECEPCION: "read",  CONTABILIDAD: "write", EDITOR: "none",  SOLO_LECTURA: "read" },
  huespedes:     { PROPIETARIO: "write", ADMINISTRADOR: "write", RECEPCION: "write", CONTABILIDAD: "read",  EDITOR: "none",  SOLO_LECTURA: "read" },
  servicios:     { PROPIETARIO: "write", ADMINISTRADOR: "write", RECEPCION: "read",  CONTABILIDAD: "none",  EDITOR: "write", SOLO_LECTURA: "read" },
  resenas:       { PROPIETARIO: "write", ADMINISTRADOR: "write", RECEPCION: "none",  CONTABILIDAD: "none",  EDITOR: "write", SOLO_LECTURA: "read" },
  mensajes:      { PROPIETARIO: "write", ADMINISTRADOR: "write", RECEPCION: "write", CONTABILIDAD: "none",  EDITOR: "write", SOLO_LECTURA: "read" },
  contenido:     { PROPIETARIO: "write", ADMINISTRADOR: "write", RECEPCION: "none",  CONTABILIDAD: "none",  EDITOR: "write", SOLO_LECTURA: "read" },
  galeria:       { PROPIETARIO: "write", ADMINISTRADOR: "write", RECEPCION: "none",  CONTABILIDAD: "none",  EDITOR: "write", SOLO_LECTURA: "read" },
  reportes:      { PROPIETARIO: "read",  ADMINISTRADOR: "read",  RECEPCION: "none",  CONTABILIDAD: "read",  EDITOR: "none",  SOLO_LECTURA: "read" },
  usuarios:      { PROPIETARIO: "write", ADMINISTRADOR: "none",  RECEPCION: "none",  CONTABILIDAD: "none",  EDITOR: "none",  SOLO_LECTURA: "none" },
  configuracion: { PROPIETARIO: "write", ADMINISTRADOR: "read",  RECEPCION: "none",  CONTABILIDAD: "none",  EDITOR: "none",  SOLO_LECTURA: "none" },
};

export function can(rol: Rol, modulo: Modulo, accion: "read" | "write" = "read"): boolean {
  const nivel = MATRIX[modulo][rol];
  if (nivel === "none") return false;
  if (accion === "read") return true;
  return nivel === "write";
}

export function accessibleModules(rol: Rol): Modulo[] {
  return (Object.keys(MATRIX) as Modulo[]).filter((m) => can(rol, m, "read"));
}

export const PERMISSION_MATRIX = MATRIX;
