import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PrintButton } from "@/components/booking/PrintButton";
import { getBookingByToken, paidTotal } from "@/lib/booking/get";
import { formatCOP } from "@/lib/format";
import { formatRangeEs, formatDateLongEs, nightsLabel, guestsLabel } from "@/lib/dates";
import { cobroLabel } from "@/lib/booking/pricing";
import { LEGAL_INFO, CONTACT } from "@/lib/nav";

export const metadata: Metadata = {
  title: "Comprobante de reserva",
  robots: { index: false, follow: false },
};

export default async function ComprobantePage(props: PageProps<"/comprobante/[token]">) {
  const { token } = await props.params;
  const b = await getBookingByToken(token);
  if (!b) notFound();

  const abonado = paidTotal(b.payments);
  const saldo = Math.max(0, b.total - abonado);

  return (
    <div className="mx-auto max-w-2xl bg-white px-6 py-10 text-ink sm:px-10">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Link href={`/reserva/${b.codigo}?t=${token}`} className="text-[13px] text-ink-2 underline">
          ← Volver a la reserva
        </Link>
        <PrintButton />
      </div>

      <header className="flex items-baseline justify-between border-b border-hairline pb-4">
        <div className="flex items-baseline gap-2">
          <span className="font-heading text-[22px] text-carbon">Valema</span>
          <span className="text-[9px] font-semibold uppercase tracking-[0.24em] text-oro-texto">
            Casa turística
          </span>
        </div>
        <p className="text-[12px] text-ink-3">Comprobante de reserva</p>
      </header>

      <div className="mt-6 flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-heading text-[26px] text-carbon">{b.codigo}</p>
        <p className="text-[12px] text-ink-3">Emitido el {formatDateLongEs(new Date())}</p>
      </div>

      <table className="mt-6 w-full text-[13px]">
        <tbody>
          {[
            ["Titular", `${b.guest.nombre} ${b.guest.apellidos}`],
            ["Documento", `${b.guest.docTipo} ${b.guest.docNumero}`],
            ["Contacto", `${b.guest.correo} · ${b.guest.telefono}`],
            ["Habitación", b.room.nombre],
            ["Fechas", formatRangeEs(new Date(b.llegada), new Date(b.salida))],
            ["Noches", nightsLabel(b.noches)],
            ["Huéspedes", guestsLabel(b.adultos, b.ninos)],
            ["Tarifa", b.ratePlan?.nombre ?? "—"],
          ].map(([k, v]) => (
            <tr key={k} className="border-b border-hairline">
              <th className="w-40 py-2 text-left font-medium text-ink-3">{k}</th>
              <td className="py-2 text-carbon">{v}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <table className="mt-6 w-full text-[13px]">
        <tbody>
          <tr className="border-b border-hairline">
            <th className="py-2 text-left font-medium text-ink-3">Alojamiento ({nightsLabel(b.noches)})</th>
            <td className="py-2 text-right text-carbon">{formatCOP(b.subtotal)}</td>
          </tr>
          {b.descuento > 0 && (
            <tr className="border-b border-hairline">
              <th className="py-2 text-left font-medium text-ink-3">Descuento tarifa</th>
              <td className="py-2 text-right text-carbon">−{formatCOP(b.descuento)}</td>
            </tr>
          )}
          {b.services.map((s) => (
            <tr key={s.id} className="border-b border-hairline">
              <th className="py-2 text-left font-medium text-ink-3">
                {s.service.nombre} · {cobroLabel(s.tipoCobro)}
              </th>
              <td className="py-2 text-right text-carbon">
                {s.subtotal > 0 ? formatCOP(s.subtotal) : "Bajo solicitud"}
              </td>
            </tr>
          ))}
          <tr className="border-b border-hairline">
            <th className="py-2 text-left font-medium text-ink-3">Impuestos y cargos</th>
            <td className="py-2 text-right text-carbon">Incluidos</td>
          </tr>
          <tr className="border-b-2 border-carbon">
            <th className="py-2 text-left font-semibold text-carbon">Total</th>
            <td className="py-2 text-right font-semibold text-carbon">{formatCOP(b.total)}</td>
          </tr>
          <tr className="border-b border-hairline">
            <th className="py-2 text-left font-medium text-ink-3">Pagado</th>
            <td className="py-2 text-right text-carbon">{formatCOP(abonado)}</td>
          </tr>
          <tr>
            <th className="py-2 text-left font-medium text-ink-3">Saldo al llegar</th>
            <td className="py-2 text-right font-semibold text-carbon">{formatCOP(saldo)}</td>
          </tr>
        </tbody>
      </table>

      {b.payments.length > 0 && (
        <div className="mt-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-3">Pagos</p>
          <ul className="mt-2 space-y-1 text-[12px] text-ink-2">
            {b.payments.map((p) => (
              <li key={p.id} className="flex justify-between">
                <span>
                  {p.referencia} · {p.metodo} · {p.estado.toLowerCase()}
                </span>
                <span>{formatCOP(p.valor)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <footer className="mt-10 border-t border-hairline pt-4 text-[11px] leading-relaxed text-ink-3">
        <p>
          {LEGAL_INFO.razonSocial} · {LEGAL_INFO.rnt} · {LEGAL_INFO.ciudad} · {CONTACT.correo} ·{" "}
          {CONTACT.telefono}
        </p>
        <p className="mt-1">
          Este comprobante no es una factura electrónica. Si necesitas factura con datos
          tributarios, escríbenos con tus datos de facturación.
        </p>
      </footer>
    </div>
  );
}
