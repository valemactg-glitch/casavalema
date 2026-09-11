import type { MetadataRoute } from "next";
import { db } from "@/lib/db";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://valema.co";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [rooms, legales] = await Promise.all([
    db.room.findMany({ where: { visible: true }, select: { slug: true, updatedAt: true } }),
    db.legalDoc.findMany({ select: { slug: true, updatedAt: true } }),
  ]);

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
