import type { MetadataRoute } from "next";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://valema.co";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/reservar", "/reserva/", "/mi-reserva", "/comprobante/", "/api/", "/emails"],
    },
    sitemap: `${SITE}/sitemap.xml`,
  };
}
