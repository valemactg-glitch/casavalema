export const MAIN_NAV = [
  { href: "/la-casa", label: "La casa" },
  { href: "/habitaciones", label: "Habitaciones" },
  { href: "/rooftop", label: "Rooftop" },
  { href: "/servicios", label: "Servicios" },
  { href: "/galeria", label: "Galería" },
  { href: "/ubicacion", label: "Ubicación" },
  { href: "/resenas", label: "Reseñas" },
  { href: "/contacto", label: "Contacto" },
] as const;

export const FOOTER_NAV = {
  Explorar: [
    { href: "/la-casa", label: "La casa" },
    { href: "/habitaciones", label: "Habitaciones" },
    { href: "/rooftop", label: "Rooftop" },
    { href: "/galeria", label: "Galería" },
    { href: "/ubicacion", label: "Ubicación" },
  ],
  Reservas: [
    { href: "/reservar", label: "Reservar ahora" },
    { href: "/mi-reserva", label: "Mi reserva" },
    { href: "/servicios", label: "Servicios y experiencias" },
    { href: "/preguntas-frecuentes", label: "Preguntas frecuentes" },
    { href: "/resenas", label: "Reseñas" },
  ],
  Legal: [
    { href: "/legales/politica-de-reservas", label: "Política de reservas" },
    { href: "/legales/politica-de-cancelaciones", label: "Cancelaciones y reembolsos" },
    { href: "/legales/politica-de-privacidad", label: "Privacidad" },
    { href: "/legales/tratamiento-de-datos", label: "Tratamiento de datos" },
    { href: "/legales", label: "Todas las políticas" },
  ],
} as const;

/** Datos de contacto — editables desde Configuración del portal (Fase 2). */
export const CONTACT = {
  telefono: "+57 300 000 0000",
  telefonoHref: "tel:+573000000000",
  whatsapp: "573000000000",
  whatsappMsg: "Hola, quiero consultar disponibilidad en Casa Turística Valema.",
  correo: "hola@valema.co",
  instagram: "casavalema",
  instagramUrl: "https://instagram.com/casavalema",
  horario: "Todos los días, 8:00–20:00 (hora de Colombia)",
};

export function whatsappUrl(msg = CONTACT.whatsappMsg): string {
  return `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(msg)}`;
}

/** Datos legales/comerciales — editables desde Configuración (Fase 2). */
export const LEGAL_INFO = {
  razonSocial: "Casa Turística Valema",
  rnt: "RNT en trámite",
  ciudad: "Colombia",
};
