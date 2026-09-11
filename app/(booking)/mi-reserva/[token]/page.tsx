import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";
import {
  ContactUpdateForm,
  CompanionForm,
  RequestForm,
  ReviewForm,
  PayPendingPanel,
} from "@/components/booking/GuestPortalForms";
import { getBookingByToken, paidTotal, ESTADO_BOOKING } from "@/lib/booking/get";
import { formatCOP } from "@/lib/format";
import { formatRangeEs, formatDateLongEs, nightsLabel, guestsLabel, today } from "@/lib/dates";
import { whatsappUrl } from "@/lib/nav";

// Datos en vivo (disponibilidad, precios, contenido editable): nunca prerenderizar.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mi reserva",
  robots: { index: false, follow: false },
};

const badgeTone = (t: string) =>
  t === "pendiente" ? "pendiente" : t === "error" ? "error" : t === "info" ? "info" : t === "exito" ? "exito" : "neutro";

function Section({
  title,
  children,
  estado,
  defaultOpen,
}: {
  title: string;
  children: React.ReactNode;
  estado?: string;
  defaultOpen?: boolean;
}) {
  return (
    <details open={defaultOpen} className="group rounded-lg border border-hairline bg-white">
      <summary className="flex cursor-pointer items-center justify-between gap-3 px-5 py-3.5 text-[14px] font-medium text-carbon marker:content-none">
        <span className="flex items-center gap-2">
          {title}
          {estado && <span className="text-[11.5px] font-normal text-ink-3">· {estado}</span>}
        </span>
        <span className="text-ink-3 transition-transform group-open:rotate-45">+</span>
      </summary>
      <div className="border-t border-hairline px-5 py-4">{children}</div>
    </details>
  );
}

export default async function PortalPage(props: PageProps<"/mi-reserva/[token]">) {
  const { token } = await props.params;
  const b = await getBookingByToken(token);
  if (!b) notFound();

  const abonado = paidTotal(b.payments);
  const saldo = Math.max(0, b.total - abonado);
  const anticipoPendiente = Math.max(0, b.anticipo - abonado);
  const eb = ESTADO_BOOKING[b.estado];
  const ultimoPago = b.payments[b.payments.length - 1];
  const checkoutPasado = new Date(b.salida) <= today();
  const puedeSolicitar = !["CANCELADA", "COMPLETADA", "NO_SHOW"].includes(b.estado);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between">
        <p className="kicker">Mi reserva</p>
        <Link href="/mi-reserva" className="text-[12px] text-ink-3 underline">
          Salir
        </Link>
      </div>

      {/* Tarjeta */}
      <div className="mt-3 overflow-hidden rounded-lg border border-hairline">
        <div className="flex flex-wrap items-center justify-between gap-3 bg-carbon px-5 py-4 text-marfil">
          <div>
            <p className="text-[10px] uppercase tracking-[0.14em] text-marfil/60">Reserva</p>
            <p className="font-heading text-[24px]">{b.codigo}</p>
          </div>
          <Badge tone={badgeTone(eb.tone)}>{eb.label}</Badge>
        </div>
        <dl className="divide-y divide-hairline bg-white text-[13px]">
          {[
            ["Habitación", b.room.nombre],
            ["Fechas", formatRangeEs(new Date(b.llegada), new Date(b.salida))],
            ["Noches", nightsLabel(b.noches)],
            ["Huéspedes", guestsLabel(b.adultos, b.ninos)],
            ["Total", formatCOP(b.total)],
            ["Pagado", formatCOP(abonado)],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 px-5 py-2.5">
              <dt className="text-ink-3">{k}</dt>
              <dd className="text-right font-medium text-carbon">{v}</dd>
            </div>
          ))}
        </dl>
        {saldo > 0 && (
          <div className="flex items-center justify-between bg-pendiente-bg px-5 py-3 text-[13px] font-semibold text-pendiente-fg">
            <span>Saldo pendiente</span>
            <span>{formatCOP(saldo)}</span>
          </div>
        )}
      </div>

      {b.estado === "CANCELADA" && (
        <Callout tone="error" className="mt-4" title="Reserva cancelada">
          Esta reserva está cancelada. Si crees que es un error, escríbenos por WhatsApp.
        </Callout>
      )}

      {/* Acciones rápidas */}
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <Button href={`/comprobante/${b.gestionToken}`} variant="outline" size="sm">
          Descargar comprobante
        </Button>
        <Button href={`/api/calendario/${b.gestionToken}`} variant="outline" size="sm">
          Agregar al calendario
        </Button>
        <Button
          href={whatsappUrl(`Hola, sobre mi reserva ${b.codigo}:`)}
          variant="outline"
          size="sm"
        >
          Escribir por WhatsApp
        </Button>
        <Button href="/legales/politica-de-cancelaciones" variant="outline" size="sm">
          Ver políticas
        </Button>
      </div>

      {/* Secciones */}
      <div className="mt-5 space-y-3">
        {(anticipoPendiente > 0 || saldo > 0) && b.estado !== "CANCELADA" && (
          <Section
            title={anticipoPendiente > 0 ? "Completar el pago" : "Adelantar el saldo"}
            estado={
              ultimoPago?.metodo === "TRANSFERENCIA" && ultimoPago.estado === "PENDIENTE"
                ? "transferencia en verificación"
                : undefined
            }
            defaultOpen={anticipoPendiente > 0}
          >
            <PayPendingPanel
              bookingId={b.id}
              codigo={b.codigo}
              saldo={saldo}
              anticipoPendiente={anticipoPendiente}
              reembolsable={b.ratePlan?.reembolsable ?? true}
            />
          </Section>
        )}

        <Section title="Datos de contacto y hora de llegada">
          <ContactUpdateForm
            token={token}
            telefono={b.guest.telefono}
            correo={b.guest.correo}
            horaLlegada={b.horaLlegada}
          />
        </Section>

        <Section title="Acompañantes" estado={`${b.companions.length} agregados`}>
          {b.companions.length > 0 && (
            <ul className="mb-3 space-y-1 text-[12.5px] text-ink-2">
              {b.companions.map((c) => (
                <li key={c.id}>
                  {c.nombre}
                  {c.esMenor ? ` · menor${c.edad ? ` (${c.edad})` : ""}` : ""}
                </li>
              ))}
            </ul>
          )}
          <CompanionForm token={token} />
        </Section>

        {puedeSolicitar && (
          <Section title="Solicitar un cambio o cancelación">
            <RequestForm token={token} />
          </Section>
        )}

        {b.changeRequests.length > 0 && (
          <Section title="Solicitudes" estado={`${b.changeRequests.length}`} defaultOpen>
            <ul className="space-y-2">
              {b.changeRequests.map((cr) => (
                <li key={cr.id} className="flex items-start justify-between gap-3 text-[12.5px]">
                  <span className="text-ink-2">
                    <span className="font-medium text-carbon">{cr.tipo}</span> · {cr.detalle}
                  </span>
                  <Badge
                    tone={
                      cr.estado === "APROBADO"
                        ? "exito"
                        : cr.estado === "RECHAZADO"
                          ? "error"
                          : "pendiente"
                    }
                  >
                    {cr.estado === "EN_REVISION"
                      ? "En revisión"
                      : cr.estado === "APROBADO"
                        ? "Aprobado"
                        : "Ver política"}
                  </Badge>
                </li>
              ))}
            </ul>
          </Section>
        )}

        <Section
          title="Dejar una reseña"
          estado={checkoutPasado ? undefined : "disponible después del check-out"}
        >
          {b.review ? (
            <p className="text-[13px] text-ink-2">
              Ya dejaste tu reseña. Estado: {b.review.estado === "PUBLICADA" ? "publicada" : "pendiente de aprobación"}.
            </p>
          ) : checkoutPasado ? (
            <ReviewForm token={token} />
          ) : (
            <p className="text-[13px] text-ink-3">
              Podrás calificar tu estadía cuando termine, el {formatDateLongEs(new Date(b.salida))}.
            </p>
          )}
        </Section>
      </div>

      {/* Historial */}
      <div className="mt-6">
        <p className="data-label mb-2">Historial</p>
        <ol className="space-y-1.5 border-l border-hairline pl-4 text-[12px] text-ink-3">
          {b.events.slice(0, 12).map((e) => (
            <li key={e.id}>
              <span className="text-carbon">{e.detalle}</span> ·{" "}
              {formatDateLongEs(new Date(e.createdAt))}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
