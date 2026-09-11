import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { NOTIFICATIONS, buildEmail, type NotificationCtx } from "@/lib/email/templates";
import { addDays, today } from "@/lib/dates";

export const metadata: Metadata = {
  title: "Plantillas de correo (previsualización)",
  robots: { index: false, follow: false },
};

const SAMPLE: NotificationCtx = {
  nombre: "Ana María",
  codigo: "VAL-26-0184",
  habitacion: "Magdalena",
  llegada: addDays(today(), 20),
  salida: addDays(today(), 22),
  noches: 2,
  huespedes: "2 adultos",
  total: 668000,
  anticipo: 200400,
  saldo: 467600,
  gestionUrl: "https://valema.co/mi-reserva/ejemplo",
  whatsapp: "573000000000",
  extra: "Nueva fecha propuesta: del 15 al 18 de diciembre.",
};

export default function EmailsPreview(props: { searchParams?: Promise<Record<string, string>> }) {
  void props;
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 20px", fontFamily: "system-ui" }}>
      <h1 className="font-heading text-[28px]">Plantillas de correo y notificaciones</h1>
      <p className="mt-2 text-[14px] text-ink-2">
        21 notificaciones. Cada una se activa o desactiva por separado y declara su canal.
        Las variables entre llaves se resuelven en el envío. Vista de desarrollo.
      </p>

      <table className="mt-6 w-full border-collapse text-[12.5px]">
        <thead>
          <tr className="border-b border-hairline text-left text-ink-3">
            <th className="py-2">Notificación</th>
            <th className="py-2">Destinatario</th>
            <th className="py-2">Canal</th>
            <th className="py-2">Se dispara</th>
          </tr>
        </thead>
        <tbody>
          {NOTIFICATIONS.map((n) => (
            <tr key={n.event} className="border-b border-hairline">
              <td className="py-2 font-medium text-carbon">
                <a href={`#${n.event}`}>{n.nombre}</a>
              </td>
              <td className="py-2 text-ink-2">{n.destinatario}</td>
              <td className="py-2 text-ink-2">
                {n.canal === "ambos" ? "Correo + WhatsApp" : n.canal === "correo" ? "Correo" : "WhatsApp"}
              </td>
              <td className="py-2 text-ink-3">{n.disparador}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-10 grid gap-10 md:grid-cols-2">
        {NOTIFICATIONS.map((n) => {
          const email = buildEmail(n.event, SAMPLE);
          return (
            <section key={n.event} id={n.event}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-oro-texto">
                {n.nombre} · {n.canal}
              </p>
              <p className="mb-2 text-[12px] text-ink-3">Asunto: {email.subject}</p>
              <iframe
                title={n.nombre}
                srcDoc={email.html}
                style={{ width: "100%", height: 520, border: "1px solid #e6e4dc", borderRadius: 12, background: "#e6e4dc" }}
              />
            </section>
          );
        })}
      </div>
    </div>
  );
}
