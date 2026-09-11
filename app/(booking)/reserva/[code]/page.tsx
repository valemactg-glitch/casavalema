import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Callout } from "@/components/ui/Callout";
import { getBookingByCode, getBookingByToken, paidTotal, ESTADO_BOOKING, ESTADO_PAGO } from "@/lib/booking/get";
import { formatCOP } from "@/lib/format";
import { formatRangeEs, formatDateLongEs, nightsLabel, guestsLabel, parseISODate } from "@/lib/dates";
import { cobroLabel } from "@/lib/booking/pricing";
import { whatsappUrl } from "@/lib/nav";

export const metadata: Metadata = {
  title: "Confirmación de reserva",
  robots: { index: false, follow: false },
};

export default async function ConfirmacionPage(props: PageProps<"/reserva/[code]">) {
  const { code } = await props.params;
  const sp = await props.searchParams;
  const token = typeof sp.t === "string" ? sp.t : null;
  const estadoRetorno = typeof sp.estado === "string" ? sp.estado : null;

  const booking = token ? await getBookingByToken(token) : await getBookingByCode(code);
  if (!booking || booking.codigo.toUpperCase() !== code.toUpperCase()) {
    // Sin token válido: pedir verificación por correo.
    return (
      <div className="mx-auto max-w-md text-center">
        <h1 className="text-[24px]">Consulta tu reserva</h1>
        <p className="mt-2 text-[14px] text-ink-2">
          Para ver los detalles de la reserva <strong>{code}</strong>, verifica tu correo.
        </p>
        <div className="mt-6">
          <Button href={`/mi-reserva?code=${encodeURIComponent(code)}`} variant="primary">
            Ir a “Mi reserva”
          </Button>
        </div>
      </div>
    );
  }

  const abonado = paidTotal(booking.payments);
  const saldo = Math.max(0, booking.total - abonado);
  const eb = ESTADO_BOOKING[booking.estado];
  const ultimoPago = booking.payments[booking.payments.length - 1];
  const ep = ultimoPago ? ESTADO_PAGO[ultimoPago.estado] : null;

  const pendienteTransferencia =
    ultimoPago?.metodo === "TRANSFERENCIA" && ultimoPago.estado === "PENDIENTE";
  const rechazado = estadoRetorno === "rechazado" || ultimoPago?.estado === "RECHAZADO";

  const l = parseISODate(new Date(booking.llegada).toISOString().slice(0, 10))!;
  const s = parseISODate(new Date(booking.salida).toISOString().slice(0, 10))!;

  const instrucciones = [
    "Te enviamos la dirección exacta y cómo entrar por correo, y un recordatorio el día antes.",
    "Check-in desde las 15:00. Escríbenos tu hora de llegada para coordinar la entrega de llaves.",
    "El saldo pendiente se paga al llegar, en efectivo o por transferencia.",
    "El rooftop es de uso libre entre las 7:00 y las 22:00.",
  ];

  return (
    <div className="mx-auto max-w-2xl">
      {/* Marca de estado */}
      <div className="text-center">
        {rechazado ? (
          <div className="mx-auto grid size-14 place-items-center rounded-pill bg-error-soft-bg text-error-fg">✕</div>
        ) : pendienteTransferencia ? (
          <div className="mx-auto grid size-14 place-items-center rounded-pill bg-pendiente-bg text-pendiente-fg">•••</div>
        ) : (
          <div className="mx-auto grid size-14 place-items-center rounded-pill bg-exito-bg text-exito-fg">✓</div>
        )}
        <h1 className="mt-4 text-[clamp(1.6rem,4vw,2rem)]">
          {rechazado
            ? "El pago no se completó"
            : pendienteTransferencia
              ? "Recibimos tu solicitud"
              : booking.estado === "CONFIRMADA"
                ? "Tu reserva está confirmada"
                : "Tu reserva está registrada"}
        </h1>
        <p className="mt-2 text-[13.5px] text-ink-2">
          {rechazado
            ? "Puedes reintentar el pago desde “Mi reserva” con otro método."
            : pendienteTransferencia
              ? "Estamos verificando tu transferencia. Te confirmamos por correo en menos de 12 horas y mantenemos tus fechas apartadas."
              : "Te enviamos la confirmación al correo que nos diste. Guarda el código de tu reserva."}
        </p>
      </div>

      {/* Tarjeta de reserva */}
      <div className="mt-8 overflow-hidden rounded-lg border border-hairline bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 bg-carbon px-5 py-4 text-marfil">
          <div>
            <p className="text-[10px] uppercase tracking-[0.14em] text-marfil/60">Código de reserva</p>
            <p className="font-heading text-[25px]">{booking.codigo}</p>
          </div>
          <div className="flex gap-2">
            <Badge tone={eb.tone === "pendiente" ? "pendiente" : eb.tone === "error" ? "error" : eb.tone === "info" ? "info" : eb.tone === "exito" ? "exito" : "neutro"}>
              {eb.label}
            </Badge>
            {ep && (
              <Badge tone={ep.tone === "pendiente" ? "pendiente" : ep.tone === "error" ? "error" : ep.tone === "exito" ? "exito" : "neutro"}>
                Pago: {ep.label}
              </Badge>
            )}
          </div>
        </div>

        <dl className="divide-y divide-hairline text-[13px]">
          {[
            ["Habitación", booking.room.nombre],
            ["Fechas", formatRangeEs(l, s)],
            ["Noches", nightsLabel(booking.noches)],
            ["Huéspedes", guestsLabel(booking.adultos, booking.ninos)],
            ["Titular", `${booking.guest.nombre} ${booking.guest.apellidos}`],
            ["Tarifa", `${booking.ratePlan?.nombre ?? "—"} · ${booking.ratePlan?.reembolsable ? "reembolsable" : "no reembolsable"}`],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 px-5 py-2.5">
              <dt className="text-ink-3">{k}</dt>
              <dd className="text-right font-medium text-carbon">{v}</dd>
            </div>
          ))}
          {booking.services.length > 0 && (
            <div className="px-5 py-2.5">
              <dt className="text-ink-3">Servicios</dt>
              <dd className="mt-1 space-y-0.5">
                {booking.services.map((bs) => (
                  <div key={bs.id} className="flex justify-between text-[12.5px]">
                    <span>
                      {bs.service.nombre} <span className="text-ink-3">{cobroLabel(bs.tipoCobro)}</span>
                    </span>
                    <span>{bs.subtotal > 0 ? formatCOP(bs.subtotal) : "Bajo solicitud"}</span>
                  </div>
                ))}
              </dd>
            </div>
          )}
          <div className="flex justify-between gap-4 px-5 py-2.5">
            <dt className="text-ink-3">Total de la estadía</dt>
            <dd className="text-right font-medium text-carbon">{formatCOP(booking.total)}</dd>
          </div>
          <div className="flex justify-between gap-4 px-5 py-2.5">
            <dt className="text-ink-3">Pagado</dt>
            <dd className="text-right font-medium text-exito-fg">{formatCOP(abonado)}</dd>
          </div>
        </dl>

        {saldo > 0 && (
          <div className="flex items-center justify-between bg-pendiente-bg px-5 py-3 text-[13px] text-pendiente-fg">
            <span className="font-semibold">Saldo pendiente</span>
            <span className="font-semibold">{formatCOP(saldo)}</span>
          </div>
        )}
      </div>

      {/* Datos de transferencia si aplica */}
      {pendienteTransferencia && (
        <Callout tone="info" className="mt-4" title="Datos para la transferencia">
          Banco: [BANCO] · Cuenta de ahorros [NÚMERO] · Titular: Casa Turística Valema ·
          NIT [NIT]. Envía el comprobante por WhatsApp indicando tu código {booking.codigo}.
        </Callout>
      )}

      {/* Acciones */}
      <div className="mt-6 grid gap-2 sm:grid-cols-2">
        <Button href={`/comprobante/${booking.gestionToken}`} variant="outline" size="sm">
          Ver / imprimir comprobante
        </Button>
        <Button href={`/api/calendario/${booking.gestionToken}`} variant="outline" size="sm">
          Agregar al calendario
        </Button>
        <Button href={`/mi-reserva/${booking.gestionToken}`} variant="outline" size="sm">
          Gestionar mi reserva
        </Button>
        <Button
          href={whatsappUrl(`Hola, tengo la reserva ${booking.codigo} y quiero coordinar mi llegada.`)}
          variant="outline"
          size="sm"
        >
          Escribir por WhatsApp
        </Button>
      </div>

      {rechazado && (
        <div className="mt-4">
          <Button href={`/mi-reserva/${booking.gestionToken}`} variant="primary" fullWidth>
            Reintentar el pago
          </Button>
        </div>
      )}

      {/* Instrucciones de llegada */}
      {!rechazado && (
        <div className="mt-8 rounded-lg border border-hairline bg-white p-5">
          <h2 className="text-[16px]">Antes de tu llegada</h2>
          <ol className="mt-3 space-y-2.5">
            {instrucciones.map((t, i) => (
              <li key={i} className="flex gap-3 text-[13px] leading-relaxed text-ink-2">
                <span className="grid size-5 shrink-0 place-items-center rounded-pill bg-carbon text-[10px] font-semibold text-marfil">
                  {i + 1}
                </span>
                {t}
              </li>
            ))}
          </ol>
          <p className="mt-4 text-[12px] text-ink-3">
            Confirmación enviada a <strong>{booking.guest.correo}</strong>. Si no la ves,
            revisa spam o escríbenos.
          </p>
        </div>
      )}

      <p className="mt-6 text-center text-[12px] text-ink-3">
        <Link href="/" className="underline">
          Volver al inicio
        </Link>{" "}
        · Reserva del {formatDateLongEs(booking.createdAt)}
      </p>
    </div>
  );
}
