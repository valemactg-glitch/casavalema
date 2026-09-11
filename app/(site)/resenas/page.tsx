import type { Metadata } from "next";
import { PageIntro, Section } from "@/components/site/Section";
import { ReviewsView } from "@/components/site/ReviewsView";
import { getReviewsSummary } from "@/lib/queries";
import { formatDateEs } from "@/lib/dates";

// Datos en vivo (disponibilidad, precios, contenido editable): nunca prerenderizar.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Reseñas",
  description: "Reseñas verificadas de huéspedes de Casa Turística Valema, con calificación por limpieza, ubicación, atención, comodidad y relación calidad-precio.",
  alternates: { canonical: "/resenas" },
};

export default async function ResenasPage() {
  const data = await getReviewsSummary();

  if (data.count === 0 || !data.categorias) {
    return (
      <>
        <PageIntro kicker="Reseñas verificadas" title="Todavía no hay reseñas" />
        <Section>
          <p className="max-w-lg text-[14px] leading-relaxed text-ink-2">
            Aún no tenemos reseñas publicadas. Cuando los primeros huéspedes completen su
            estadía y dejen su opinión, aparecerán aquí con su calificación por categoría.
          </p>
        </Section>
      </>
    );
  }

  const reviews = data.reviews.map((r) => ({
    id: r.id,
    autor: r.autor,
    fecha: r.fechaEstadia ? formatDateEs(r.fechaEstadia, { weekday: false }) : null,
    roomNombre: r.room?.nombre ?? null,
    roomSlug: r.room?.slug ?? null,
    promedio: (r.limpieza + r.ubicacion + r.atencion + r.comodidad + r.precio) / 5,
    texto: r.texto,
    respuesta: r.respuesta,
    destacada: r.destacada,
  }));

  return (
    <>
      <PageIntro
        kicker="Reseñas verificadas"
        title={`${data.promedio.toFixed(1).replace(".", ",")} de 5 en ${data.count} reseñas`}
        intro="Cada reseña corresponde a una estadía real, reservada directo o por Airbnb. No aceptamos reseñas anónimas."
      />
      <Section>
        <ReviewsView
          promedio={data.promedio}
          count={data.count}
          categorias={data.categorias}
          reviews={reviews}
        />
      </Section>
    </>
  );
}
