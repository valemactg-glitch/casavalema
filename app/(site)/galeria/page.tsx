import type { Metadata } from "next";
import { PageIntro, Section } from "@/components/site/Section";
import { GalleryGrid } from "@/components/site/GalleryGrid";
import { getGallery } from "@/lib/queries";

// Datos en vivo (disponibilidad, precios, contenido editable): nunca prerenderizar.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Galería",
  description: "Fotos de las habitaciones, la fachada, los espacios comunes, el rooftop y el entorno de Casa Turística Valema.",
  alternates: { canonical: "/galeria" },
};

export default async function GaleriaPage() {
  const items = await getGallery();

  return (
    <>
      <PageIntro
        kicker="Galería"
        title="La casa, el rooftop y el barrio"
        intro="Estas imágenes son de referencia mientras llega la fotografía definitiva. Cada foto lleva su descripción para lectores de pantalla."
      />
      <Section>
        <GalleryGrid
          items={items.map((i) => ({
            id: i.id,
            url: i.url,
            alt: i.alt,
            pie: i.pie,
            categoria: i.categoria,
          }))}
        />
      </Section>
    </>
  );
}
