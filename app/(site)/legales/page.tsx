import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro, Section } from "@/components/site/Section";
import { Diamond } from "@/components/ui/Diamond";
import { getLegalDocs } from "@/lib/queries";
import { formatDateLongEs } from "@/lib/dates";

// Datos en vivo (disponibilidad, precios, contenido editable): nunca prerenderizar.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Políticas y documentos legales",
  description: "Términos, privacidad, tratamiento de datos, cookies, reservas, pagos, cancelaciones y reglamento de Casa Turística Valema.",
  alternates: { canonical: "/legales" },
};

export default async function LegalesIndex() {
  const docs = await getLegalDocs();

  return (
    <>
      <PageIntro
        kicker="Legal"
        title="Políticas y documentos"
        intro="Estos textos son de muestra mientras el cliente aprueba la versión definitiva. Aplican las condiciones comunicadas durante la reserva y confirmadas por correo."
      />
      <Section>
        <ul className="divide-y divide-hairline border-y border-hairline">
          {docs.map((d) => (
            <li key={d.id}>
              <Link
                href={`/legales/${d.slug}`}
                className="flex items-center justify-between gap-4 py-4 hover:text-oro-texto"
              >
                <span className="flex items-center gap-3 text-[14px] font-medium text-carbon">
                  <Diamond className="size-[7px]" />
                  {d.titulo}
                </span>
                <span className="text-[11.5px] text-ink-3">
                  v{d.version} · {formatDateLongEs(d.updatedAt)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}
