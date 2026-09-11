import { renderEmail, type RenderedEmail } from "@/lib/email/render";
import { formatCOP } from "@/lib/format";
import { formatRangeEs } from "@/lib/dates";
import { CONTACT } from "@/lib/nav";

export type Canal = "correo" | "whatsapp" | "ambos";

export type NotificationEvent =
  | "reserva_recibida"
  | "reserva_confirmada"
  | "pago_aprobado"
  | "pago_pendiente"
  | "pago_rechazado"
  | "transferencia_pendiente"
  | "transferencia_aprobada"
  | "recordatorio_pago"
  | "reserva_modificada"
  | "solicitud_cambio_recibida"
  | "reserva_cancelada"
  | "reembolso_iniciado"
  | "reembolso_completado"
  | "recordatorio_previo_checkin"
  | "instrucciones_llegada"
  | "mensaje_bienvenida"
  | "recordatorio_checkout"
  | "solicitud_resena"
  | "admin_nueva_reserva"
  | "admin_cancelacion"
  | "admin_alerta_conflicto";

export type NotificationCtx = {
  nombre: string;
  codigo: string;
  habitacion: string;
  llegada: Date;
  salida: Date;
  noches: number;
  huespedes: string;
  total: number;
  anticipo: number;
  saldo: number;
  gestionUrl: string;
  whatsapp?: string;
  extra?: string;
};

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/** Metadatos de las 21 notificaciones (para el panel administrativo y la documentación). */
export const NOTIFICATIONS: {
  event: NotificationEvent;
  nombre: string;
  destinatario: "Huésped" | "Administrador";
  canal: Canal;
  disparador: string;
}[] = [
  { event: "reserva_recibida", nombre: "Reserva recibida", destinatario: "Huésped", canal: "correo", disparador: "Al crear la reserva (pendiente de pago)" },
  { event: "reserva_confirmada", nombre: "Reserva confirmada", destinatario: "Huésped", canal: "ambos", disparador: "Al cubrirse el anticipo" },
  { event: "pago_aprobado", nombre: "Pago aprobado", destinatario: "Huésped", canal: "correo", disparador: "Pasarela / webhook confirma un pago" },
  { event: "pago_pendiente", nombre: "Pago pendiente", destinatario: "Huésped", canal: "correo", disparador: "El pago queda en revisión" },
  { event: "pago_rechazado", nombre: "Pago rechazado", destinatario: "Huésped", canal: "correo", disparador: "La pasarela rechaza el pago" },
  { event: "transferencia_pendiente", nombre: "Transferencia pendiente de verificación", destinatario: "Huésped", canal: "correo", disparador: "El huésped elige transferencia" },
  { event: "transferencia_aprobada", nombre: "Transferencia aprobada", destinatario: "Huésped", canal: "ambos", disparador: "El administrador verifica la transferencia" },
  { event: "recordatorio_pago", nombre: "Recordatorio de pago", destinatario: "Huésped", canal: "ambos", disparador: "Job: la retención está por vencer" },
  { event: "reserva_modificada", nombre: "Reserva modificada", destinatario: "Huésped", canal: "correo", disparador: "El administrador cambia fecha, habitación o precio" },
  { event: "solicitud_cambio_recibida", nombre: "Solicitud de cambio recibida", destinatario: "Huésped", canal: "correo", disparador: "El huésped envía una solicitud" },
  { event: "reserva_cancelada", nombre: "Reserva cancelada", destinatario: "Huésped", canal: "correo", disparador: "Se cancela la reserva" },
  { event: "reembolso_iniciado", nombre: "Reembolso iniciado", destinatario: "Huésped", canal: "correo", disparador: "El administrador inicia un reembolso" },
  { event: "reembolso_completado", nombre: "Reembolso completado", destinatario: "Huésped", canal: "correo", disparador: "La pasarela confirma el reembolso" },
  { event: "recordatorio_previo_checkin", nombre: "Recordatorio previo al check-in", destinatario: "Huésped", canal: "ambos", disparador: "Job: 2 días antes de la llegada" },
  { event: "instrucciones_llegada", nombre: "Instrucciones de llegada", destinatario: "Huésped", canal: "ambos", disparador: "Job: el día antes de la llegada" },
  { event: "mensaje_bienvenida", nombre: "Mensaje de bienvenida", destinatario: "Huésped", canal: "correo", disparador: "El día del check-in" },
  { event: "recordatorio_checkout", nombre: "Recordatorio de check-out", destinatario: "Huésped", canal: "whatsapp", disparador: "La mañana del check-out" },
  { event: "solicitud_resena", nombre: "Solicitud de reseña", destinatario: "Huésped", canal: "correo", disparador: "Job: 1 día después del check-out" },
  { event: "admin_nueva_reserva", nombre: "Nueva reserva (para el administrador)", destinatario: "Administrador", canal: "correo", disparador: "Al crear cualquier reserva" },
  { event: "admin_cancelacion", nombre: "Cancelación (para el administrador)", destinatario: "Administrador", canal: "correo", disparador: "Al cancelarse una reserva" },
  { event: "admin_alerta_conflicto", nombre: "Alerta de posible conflicto de disponibilidad", destinatario: "Administrador", canal: "correo", disparador: "iCal importa un evento que se solapa con una reserva directa" },
];

export function channelFor(event: NotificationEvent): Canal {
  return NOTIFICATIONS.find((n) => n.event === event)?.canal ?? "correo";
}

const datosReserva = (c: NotificationCtx): [string, string][] => [
  ["Código", c.codigo],
  ["Habitación", c.habitacion],
  ["Fechas", formatRangeEs(c.llegada, c.salida)],
  ["Huéspedes", c.huespedes],
];

export function buildEmail(event: NotificationEvent, c: NotificationCtx): RenderedEmail {
  switch (event) {
    case "reserva_recibida":
      return renderEmail({
        subject: `Recibimos tu reserva ${c.codigo}`,
        preheader: "Falta completar el pago para confirmar.",
        titulo: "Recibimos tu reserva",
        saludo: `Hola ${c.nombre}, apartamos ${c.habitacion} para ti. Para confirmar, completa el pago del anticipo.`,
        bloques: [
          { tipo: "datos", filas: [...datosReserva(c), ["Total", formatCOP(c.total)], ["Anticipo", formatCOP(c.anticipo)]] },
          { tipo: "aviso", texto: "Tu reserva queda apartada por tiempo limitado. Si no completas el pago, se libera y las fechas vuelven a estar disponibles." },
          { tipo: "cta", texto: "Completar el pago", url: c.gestionUrl },
        ],
      });

    case "reserva_confirmada":
      return renderEmail({
        subject: `Tu reserva en Valema está confirmada · ${c.codigo}`,
        preheader: "Te contamos lo esencial para tu llegada.",
        titulo: "Tu reserva está confirmada",
        saludo: `¡Todo listo, ${c.nombre}! Guardamos ${c.habitacion} para ti.`,
        bloques: [
          { tipo: "datos", filas: [...datosReserva(c), ["Pagado", formatCOP(c.anticipo)], ["Saldo al llegar", formatCOP(c.saldo)]] },
          { tipo: "parrafo", texto: "Unos días antes de tu llegada te enviaremos la dirección exacta y cómo entrar." },
          { tipo: "cta", texto: "Ver mi reserva", url: c.gestionUrl },
          { tipo: "parrafo", texto: `¿Alguna duda? Respóndenos este correo o escríbenos por WhatsApp.` },
        ],
      });

    case "pago_aprobado":
      return renderEmail({
        subject: `Pago aprobado · ${c.codigo}`,
        titulo: "Recibimos tu pago",
        saludo: `Hola ${c.nombre}, confirmamos un pago de ${formatCOP(c.anticipo)} para la reserva ${c.codigo}.`,
        bloques: [
          { tipo: "datos", filas: [["Código", c.codigo], ["Pagado", formatCOP(c.anticipo)], ["Saldo al llegar", formatCOP(c.saldo)]] },
          { tipo: "cta", texto: "Ver comprobante", url: c.gestionUrl },
        ],
      });

    case "pago_pendiente":
      return renderEmail({
        subject: `Tu pago está en revisión · ${c.codigo}`,
        titulo: "Tu pago está en revisión",
        saludo: `Hola ${c.nombre}, tu pago quedó registrado y lo estamos revisando.`,
        bloques: [
          { tipo: "parrafo", texto: "Mientras tanto mantenemos tus fechas apartadas. Te escribimos en cuanto quede confirmado." },
          { tipo: "datos", filas: datosReserva(c) },
        ],
      });

    case "pago_rechazado":
      return renderEmail({
        subject: `El pago no se completó · ${c.codigo}`,
        titulo: "El pago no se completó",
        saludo: `Hola ${c.nombre}, la pasarela rechazó el pago de la reserva ${c.codigo}.`,
        bloques: [
          { tipo: "parrafo", texto: "No se realizó ningún cobro. Puedes reintentar con otro método o tarjeta desde tu reserva." },
          { tipo: "cta", texto: "Reintentar el pago", url: c.gestionUrl },
        ],
      });

    case "transferencia_pendiente":
      return renderEmail({
        subject: `Recibimos tu comprobante · ${c.codigo}`,
        titulo: "Recibimos tu comprobante",
        saludo: `Hola ${c.nombre}, estamos revisando la transferencia.`,
        bloques: [
          { tipo: "parrafo", texto: "La verificación suele tardar menos de 12 horas y mientras tanto mantenemos tus fechas apartadas. Te escribimos en cuanto quede confirmada." },
          { tipo: "datos", filas: [...datosReserva(c), ["A transferir", formatCOP(c.anticipo)]] },
        ],
      });

    case "transferencia_aprobada":
      return renderEmail({
        subject: `Transferencia confirmada · ${c.codigo}`,
        titulo: "Confirmamos tu transferencia",
        saludo: `¡Listo, ${c.nombre}! Verificamos tu transferencia y tu reserva quedó confirmada.`,
        bloques: [
          { tipo: "datos", filas: [...datosReserva(c), ["Pagado", formatCOP(c.anticipo)], ["Saldo al llegar", formatCOP(c.saldo)]] },
          { tipo: "cta", texto: "Ver mi reserva", url: c.gestionUrl },
        ],
      });

    case "recordatorio_pago":
      return renderEmail({
        subject: `Tu reserva está por liberarse · ${c.codigo}`,
        titulo: "Tu reserva está por liberarse",
        saludo: `Hola ${c.nombre}, aún no recibimos el pago de la reserva ${c.codigo}.`,
        bloques: [
          { tipo: "aviso", texto: "Si no completas el pago pronto, la reserva se cancela y las fechas vuelven a estar disponibles." },
          { tipo: "cta", texto: "Completar el pago", url: c.gestionUrl },
        ],
      });

    case "reserva_modificada":
      return renderEmail({
        subject: `Actualizamos tu reserva ${c.codigo}`,
        titulo: "Actualizamos tu reserva",
        saludo: `Hola ${c.nombre}, hicimos un cambio en tu reserva.`,
        bloques: [
          { tipo: "parrafo", texto: c.extra ?? "Revisa los datos actualizados a continuación." },
          { tipo: "datos", filas: [...datosReserva(c), ["Total", formatCOP(c.total)], ["Saldo", formatCOP(c.saldo)]] },
          { tipo: "cta", texto: "Ver mi reserva", url: c.gestionUrl },
        ],
      });

    case "solicitud_cambio_recibida":
      return renderEmail({
        subject: `Recibimos tu solicitud · ${c.codigo}`,
        titulo: "Recibimos tu solicitud",
        saludo: `Hola ${c.nombre}, registramos tu solicitud para la reserva ${c.codigo}.`,
        bloques: [
          { tipo: "parrafo", texto: c.extra ?? "La revisamos según la política y te contactamos. Nada se aprueba automáticamente." },
          { tipo: "cta", texto: "Ver estado de la solicitud", url: c.gestionUrl },
        ],
      });

    case "reserva_cancelada":
      return renderEmail({
        subject: `Reserva cancelada · ${c.codigo}`,
        titulo: "Tu reserva quedó cancelada",
        saludo: `Hola ${c.nombre}, confirmamos la cancelación de la reserva ${c.codigo}.`,
        bloques: [
          { tipo: "parrafo", texto: c.extra ?? "Si corresponde un reembolso según la política, lo procesamos y te avisamos." },
          { tipo: "datos", filas: datosReserva(c) },
        ],
      });

    case "reembolso_iniciado":
      return renderEmail({
        subject: `Iniciamos tu reembolso · ${c.codigo}`,
        titulo: "Iniciamos tu reembolso",
        saludo: `Hola ${c.nombre}, empezamos el reembolso de tu reserva ${c.codigo}.`,
        bloques: [
          { tipo: "parrafo", texto: c.extra ?? `Monto: ${formatCOP(c.anticipo)}. Según tu banco puede tardar unos días hábiles en reflejarse.` },
        ],
      });

    case "reembolso_completado":
      return renderEmail({
        subject: `Reembolso completado · ${c.codigo}`,
        titulo: "Reembolso completado",
        saludo: `Hola ${c.nombre}, la pasarela confirmó el reembolso de tu reserva ${c.codigo}.`,
        bloques: [{ tipo: "parrafo", texto: c.extra ?? `Monto reembolsado: ${formatCOP(c.anticipo)}.` }],
      });

    case "recordatorio_previo_checkin":
      return renderEmail({
        subject: `Tu llegada a Valema se acerca · ${c.codigo}`,
        titulo: "Tu llegada se acerca",
        saludo: `Hola ${c.nombre}, en unos días te esperamos en ${c.habitacion}.`,
        bloques: [
          { tipo: "datos", filas: [...datosReserva(c), ["Saldo al llegar", formatCOP(c.saldo)]] },
          { tipo: "parrafo", texto: "Mañana te enviaremos la dirección exacta y las instrucciones para entrar. Cuéntanos tu hora aproximada de llegada para coordinar." },
          { tipo: "cta", texto: "Informar mi hora de llegada", url: c.gestionUrl },
        ],
      });

    case "instrucciones_llegada":
      return renderEmail({
        subject: `Cómo llegar y entrar · ${c.codigo}`,
        titulo: "Cómo llegar y entrar",
        saludo: `Hola ${c.nombre}, aquí está todo lo necesario para tu llegada de mañana.`,
        bloques: [
          { tipo: "lista", items: [
            "Dirección: [DIRECCIÓN EXACTA] — editable desde Configuración.",
            "Cómo entrar: [INSTRUCCIONES DE ACCESO].",
            "Check-in desde las 15:00. Si llegas antes, escríbenos.",
            `Cualquier cosa en el camino, WhatsApp: ${CONTACT.telefono}.`,
          ] },
          { tipo: "cta", texto: "Abrir en el mapa", url: `${SITE}/ubicacion` },
        ],
      });

    case "mensaje_bienvenida":
      return renderEmail({
        subject: `¡Bienvenido a Valema, ${c.nombre}!`,
        titulo: `Te esperamos, ${c.nombre}`,
        saludo: `Ya está todo listo. Guardamos ${c.habitacion} para ti y te contamos lo esencial.`,
        bloques: [
          { tipo: "lista", items: [
            "El Wi-Fi y la clave están en una tarjeta sobre el escritorio.",
            "El rooftop es de uso libre entre las 7:00 y las 22:00.",
            "El desayuno, si lo reservaste, se sirve arriba entre las 7:30 y las 9:30.",
            "Check-out hasta las 11:00. Si necesitas más tiempo, pregúntanos.",
          ] },
          { tipo: "parrafo", texto: "Si necesitas algo durante tu estadía, respóndenos este correo o escríbenos por WhatsApp." },
        ],
      });

    case "recordatorio_checkout":
      return renderEmail({
        subject: `Check-out hoy · ${c.codigo}`,
        titulo: "Hoy es tu check-out",
        saludo: `Hola ${c.nombre}, esperamos que hayas descansado.`,
        bloques: [
          { tipo: "parrafo", texto: "El check-out es hasta las 11:00. Deja la llave sobre el escritorio y cierra al salir. Si tienes saldo pendiente, puedes pagarlo antes de irte." },
          { tipo: "cta", texto: "Ver mi reserva", url: c.gestionUrl },
        ],
      });

    case "solicitud_resena":
      return renderEmail({
        subject: `¿Cómo estuvo tu estadía en Valema?`,
        titulo: "Cuéntanos cómo te fue",
        saludo: `Hola ${c.nombre}, gracias por quedarte en ${c.habitacion}.`,
        bloques: [
          { tipo: "parrafo", texto: "Nos ayuda mucho saber cómo estuvo tu experiencia. Toma dos minutos y solo lo verá quien esté pensando en reservar." },
          { tipo: "cta", texto: "Dejar mi reseña", url: c.gestionUrl },
        ],
      });

    case "admin_nueva_reserva":
      return renderEmail({
        subject: `Nueva reserva ${c.codigo} — ${c.habitacion}`,
        titulo: "Nueva reserva directa",
        bloques: [
          { tipo: "datos", filas: [...datosReserva(c), ["Titular", c.nombre], ["Total", formatCOP(c.total)], ["Anticipo", formatCOP(c.anticipo)]] },
          { tipo: "cta", texto: "Abrir en el panel", url: `${SITE}/mi-reserva` },
        ],
      });

    case "admin_cancelacion":
      return renderEmail({
        subject: `Reserva cancelada ${c.codigo} — ${c.habitacion}`,
        titulo: "Reserva cancelada",
        bloques: [
          { tipo: "datos", filas: [...datosReserva(c), ["Titular", c.nombre]] },
          { tipo: "parrafo", texto: c.extra ?? "Revisa si corresponde reembolso según la política." },
        ],
      });

    case "admin_alerta_conflicto":
      return renderEmail({
        subject: `⚠ Posible conflicto de disponibilidad — ${c.habitacion}`,
        titulo: "Posible conflicto de disponibilidad",
        bloques: [
          { tipo: "aviso", texto: c.extra ?? `Un evento importado de Airbnb se solapa con la reserva directa ${c.codigo} en ${c.habitacion}. No se canceló nada automáticamente.` },
          { tipo: "datos", filas: datosReserva(c) },
          { tipo: "cta", texto: "Revisar el calendario", url: `${SITE}/mi-reserva` },
        ],
      });
  }
}
