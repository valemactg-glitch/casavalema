import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageIntro, Section } from "@/components/site/Section";
import { Prose } from "@/components/ui/Prose";
import { CookiePreferences } from "@/components/site/CookiePreferences";
import { getLegalDoc, getLegalDocs } from "@/lib/queries";
import { formatDateLongEs } from "@/lib/dates";

// Datos en vivo (disponibilidad, precios, contenido editable): nunca prerenderizar.
export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  // Si la base de datos no está disponible en tiempo de build (p. ej. no se
  // ha configurado DATABASE_URL todavía), no se debe tumbar el build entero:
  // estas páginas simplemente se renderizan bajo demanda en el primer visitante.
  try {
    const docs = await getLegalDocs();
    return docs.map((d) => ({ slug: d.slug }));
  } catch (err) {
    console.warn("generateStaticParams(/legales/[slug]): sin conexión a la base de datos en build.", err);
    return [];
  }
}

export async function generateMetadata(props: PageProps<"/legales/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const doc = await getLegalDoc(slug);
  if (!doc) return {};
  return {
    title: doc.titulo,
    description: `${doc.titulo} de Casa Turística Valema.`,
    alternates: { canonical: `/legales/${slug}` },
    robots: { index: true, follow: true },
  };
}

export default async function LegalDocPage(props: PageProps<"/legales/[slug]">) {
  const { slug } = await props.params;
  const [doc, all] = await Promise.all([getLegalDoc(slug), getLegalDocs()]);
  if (!doc) notFound();

  return (
    <>
      <PageIntro kicker="Legal" title={doc.titulo}>
        <p className="text-[12px] text-ink-3">
          Versión {doc.version} · Actualizado el {formatDateLongEs(doc.updatedAt)}
        </p>
      </PageIntro>
      <Section>
        <div className="grid gap-10 lg:grid-cols-[1fr_240px]">
          <div>
            <Prose markdown={doc.cuerpo} />
            {slug === "politica-de-cookies" && (
              <div className="mt-8">
                <CookiePreferences />
              </div>
            )}
          </div>
          <nav aria-label="Otras políticas" className="lg:sticky lg:top-24 lg:self-start">
            <p className="data-label mb-2">Otras políticas</p>
            <ul className="space-y-1.5">
              {all
                .filter((d) => d.slug !== slug)
                .map((d) => (
                  <li key={d.id}>
                    <Link href={`/legales/${d.slug}`} className="text-[12.5px] text-ink-2 hover:text-oro-texto">
                      {d.titulo}
                    </Link>
                  </li>
                ))}
            </ul>
          </nav>
        </div>
      </Section>
    </>
  );
}
