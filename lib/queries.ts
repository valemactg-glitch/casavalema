import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";
import { precioDesde } from "@/lib/booking/search";

export const getRooms = cache(async () => {
  const rooms = await db.room.findMany({
    where: { visible: true },
    orderBy: { orden: "asc" },
    include: {
      images: { orderBy: { orden: "asc" } },
      ratePlans: { where: { activo: true }, orderBy: { descuentoPct: "asc" } },
      _count: { select: { reviews: { where: { estado: "PUBLICADA" } } } },
    },
  });
  const desde = await Promise.all(rooms.map((r) => precioDesde(r.id)));
  return rooms.map((r, i) => ({ ...r, precioDesde: desde[i] || r.precioBase }));
});

export const getRoom = cache(async (slug: string) => {
  return db.room.findFirst({
    where: { slug, visible: true },
    include: {
      images: { orderBy: { orden: "asc" } },
      ratePlans: { where: { activo: true }, orderBy: { descuentoPct: "asc" } },
      reviews: {
        where: { estado: "PUBLICADA" },
        orderBy: { createdAt: "desc" },
      },
    },
  });
});

export const getServices = cache(async () => {
  return db.service.findMany({
    where: { activo: true, disponibilidad: { not: "NO_DISPONIBLE" } },
    orderBy: { orden: "asc" },
  });
});

export const getReviewsSummary = cache(async () => {
  const reviews = await db.review.findMany({
    where: { estado: "PUBLICADA" },
    orderBy: { createdAt: "desc" },
    include: { room: { select: { nombre: true, slug: true } } },
  });
  if (reviews.length === 0) {
    return { count: 0, promedio: 0, categorias: null, reviews: [] as typeof reviews };
  }
  const avg = (k: "limpieza" | "ubicacion" | "atencion" | "comodidad" | "precio") =>
    reviews.reduce((s, r) => s + r[k], 0) / reviews.length;
  const categorias = {
    limpieza: avg("limpieza"),
    ubicacion: avg("ubicacion"),
    atencion: avg("atencion"),
    comodidad: avg("comodidad"),
    precio: avg("precio"),
  };
  const promedio =
    Object.values(categorias).reduce((s, v) => s + v, 0) / 5;
  return { count: reviews.length, promedio, categorias, reviews };
});

export const getGallery = cache(async () => {
  return db.galleryImage.findMany({
    where: { publicada: true },
    orderBy: [{ categoria: "asc" }, { orden: "asc" }],
  });
});

export const getFaq = cache(async () => {
  const items = await db.faqItem.findMany({
    where: { publicada: true },
    orderBy: [{ categoria: "asc" }, { orden: "asc" }],
  });
  const grupos = new Map<string, typeof items>();
  for (const it of items) {
    const arr = grupos.get(it.categoria) ?? [];
    arr.push(it);
    grupos.set(it.categoria, arr);
  }
  return [...grupos.entries()].map(([categoria, items]) => ({ categoria, items }));
});

export const getSitePage = cache(async (clave: string) => {
  const page = await db.sitePage.findUnique({ where: { clave } });
  return (page?.contenido ?? {}) as Record<string, unknown>;
});

export const getLegalDoc = cache(async (slug: string) => {
  return db.legalDoc.findUnique({ where: { slug } });
});

export const getLegalDocs = cache(async () => {
  return db.legalDoc.findMany({ orderBy: { titulo: "asc" } });
});

export function coverOf(images: { url: string; alt: string; portada: boolean }[]) {
  const c = images.find((i) => i.portada) ?? images[0];
  return c ? { url: c.url, alt: c.alt } : null;
}
