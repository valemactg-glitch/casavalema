import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { SITE_URL as SITE } from "@/lib/site";

// Datos en vivo: nunca prerenderizar en build (evita fallar si DATABASE_URL
// no está disponible todavía, p. ej. en el primer deploy de Vercel).
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let rooms: { slug: string; updatedAt: Date }[] = [];
  let legales: { slug: string; updatedAt: Date }[] = [];
  try {
    [rooms, legales] = await Promise.all([
      db.room.findMany({ where: { visible: true }, select: { slug: true, updatedAt: true } }),
      db.legalDoc.findMany({ select: { slug: true, updatedAt: true } }),
    ]);
  } catch (err) {
    console.warn("sitemap: sin conexión a la base de datos, se omiten rutas dinámicas.", err);
  }

  const estaticas = [
    "",
    "/la-casa",
    "/habitaciones",
    "/rooftop",
    "/servicios",
    "/galeria",
    "/ubicacion",
    "/resenas",
    "/contacto",
    "/preguntas-frecuentes",
    "/legales",
  ].map((p) => ({
    url: `${SITE}${p}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: p === "" ? 1 : 0.7,
  }));

  return [
    ...estaticas,
    ...rooms.map((r) => ({
      url: `${SITE}/habitaciones/${r.slug}`,
      lastModified: r.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })),
    ...legales.map((l) => ({
      url: `${SITE}/legales/${l.slug}`,
      lastModified: l.updatedAt,
      changeFrequency: "yearly" as const,
      priority: 0.3,
    })),
  ];
}
