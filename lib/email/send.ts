import "server-only";
import { db } from "@/lib/db";
import { buildEmail, channelFor, type NotificationEvent, type NotificationCtx } from "@/lib/email/templates";
import { guestsLabel } from "@/lib/dates";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "reservas@valema.co";

type SendResult = { ok: boolean; skipped?: boolean };

/**
 * Envío de correo. Fase 1: registra en consola. Para producción se
 * implementa un adaptador (Resend, SES, SMTP) detrás de esta función.
 */
export async function sendEmail(msg: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<SendResult> {
  const provider = process.env.EMAIL_PROVIDER ?? "log";
  if (provider === "log") {
    console.log(`\n📧 [correo → ${msg.to}] ${msg.subject}\n${msg.text.split("\n").slice(0, 3).join("\n")}…\n`);
    return { ok: true };
  }
  // if (provider === "resend") { ... }
  console.warn(`EMAIL_PROVIDER "${provider}" no implementado; correo no enviado.`);
  return { ok: false, skipped: true };
}

/** Registro de un mensaje de WhatsApp (integración pendiente). */
async function queueWhatsapp(to: string, event: NotificationEvent) {
  console.log(`📱 [whatsapp → ${to}] plantilla: ${event} (integración pendiente)`);
}

export async function notify(
  event: NotificationEvent,
  ctx: NotificationCtx,
  opts: { to: string },
): Promise<void> {
  const canal = channelFor(event);
  try {
    if (canal === "correo" || canal === "ambos") {
      const email = buildEmail(event, ctx);
      await sendEmail({ to: opts.to, ...email });
    }
    if (canal === "whatsapp" || canal === "ambos") {
      await queueWhatsapp(ctx.whatsapp ?? opts.to, event);
    }
  } catch (err) {
    console.error(`notify(${event})`, err);
  }
}

function ctxFrom(b: {
  codigo: string;
  gestionToken: string;
  llegada: Date;
  salida: Date;
  noches: number;
  adultos: number;
  ninos: number;
  total: number;
  anticipo: number;
  saldo: number;
  room: { nombre: string };
  guest: { nombre: string; telefono: string };
}): NotificationCtx {
  return {
    nombre: b.guest.nombre,
    codigo: b.codigo,
    habitacion: b.room.nombre,
    llegada: new Date(b.llegada),
    salida: new Date(b.salida),
    noches: b.noches,
    huespedes: guestsLabel(b.adultos, b.ninos),
    total: b.total,
    anticipo: b.anticipo,
    saldo: b.saldo,
    gestionUrl: `${SITE}/mi-reserva/${b.gestionToken}`,
    whatsapp: b.guest.telefono,
  };
}

async function loadBooking(bookingId: string) {
  return db.booking.findUnique({
    where: { id: bookingId },
    include: { room: { select: { nombre: true } }, guest: true },
  });
}

/** Dispara los correos que correspondan a un evento de reserva. */
export async function notifyBooking(bookingId: string, event: NotificationEvent, extra?: string) {
  const b = await loadBooking(bookingId);
  if (!b) return;
  const ctx = { ...ctxFrom(b), extra };
  if (event === "admin_nueva_reserva" || event === "admin_cancelacion" || event === "admin_alerta_conflicto") {
    await notify(event, ctx, { to: ADMIN_EMAIL });
  } else {
    await notify(event, ctx, { to: b.guest.correo });
  }
}
