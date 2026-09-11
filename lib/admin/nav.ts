import type { Modulo } from "@/lib/auth/rbac";

export const ADMIN_NAV: { href: string; label: string; modulo: Modulo }[] = [
  { href: "/admin", label: "Dashboard", modulo: "dashboard" },
  { href: "/admin/calendario", label: "Calendario", modulo: "calendario" },
  { href: "/admin/reservas", label: "Reservas", modulo: "reservas" },
  { href: "/admin/habitaciones", label: "Habitaciones", modulo: "habitaciones" },
  { href: "/admin/tarifas", label: "Tarifas y disponibilidad", modulo: "tarifas" },
  { href: "/admin/pagos", label: "Pagos", modulo: "pagos" },
  { href: "/admin/huespedes", label: "Huéspedes", modulo: "huespedes" },
  { href: "/admin/servicios", label: "Servicios", modulo: "servicios" },
  { href: "/admin/resenas", label: "Reseñas", modulo: "resenas" },
  { href: "/admin/mensajes", label: "Mensajes", modulo: "mensajes" },
  { href: "/admin/contenido", label: "Contenido", modulo: "contenido" },
  { href: "/admin/galeria", label: "Galería", modulo: "galeria" },
  { href: "/admin/reportes", label: "Reportes", modulo: "reportes" },
  { href: "/admin/usuarios", label: "Usuarios", modulo: "usuarios" },
  { href: "/admin/configuracion", label: "Configuración", modulo: "configuracion" },
];
