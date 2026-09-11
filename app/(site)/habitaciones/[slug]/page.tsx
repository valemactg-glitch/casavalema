import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Section } from "@/components/site/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Diamond } from "@/components/ui/Diamond";
import { ImageSlot } from "@/components/ui/ImageSlot";
import { StarRating } from "@/components/ui/StarRating";
import { Badge } from "@/components/ui/Badge";
import { RoomBooking } from "@/components/booking/RoomBooking";
import { RoomPreviewCard } from "@/components/booking/RoomPreviewCard";
import { getRoom, getRooms } from "@/lib/queries";
import { roomCalendar } from "@/lib/booking/calendar";
import { amenidadLabel } from "@/lib/catalog";
import { formatCOP, initials } from "@/lib/format";
import { guestsLabel, formatDateEs, parseISODate, toISODate, addDays } from "@/lib/dates";
import { defaultArrival, parseSearch } from "@/lib/search-params";

export async function generateMetadata(props: PageProps<"/habitaciones/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const room = await getRoom(slug);
  if (!room) return {};
  return {
    title: room.seoTitulo ?? `${room.nombre} — habitación`,
    description: room.seoDescripcion ?? room.descripcionCorta,
    alternates: { canonical: `/habitaciones/${slug}` },
  };
}

export default async function RoomPage(props: PageProps<"/habitaciones/[slug]">) {
  const { slug } = await props.params;
  const raw = await props.searchParams;
  const [room, rooms] = await Promise.all([getRoom(slug), getRooms()]);
  if (!room) notFound();

  const calendar = await roomCalendar(room.id, 12);

  // Fechas por defecto: de la URL si vienen, si no el próximo fin de semana.
  const urlLlegada = parseISODate(typeof raw.llegada === "string" ? raw.llegada : undefined);
  const llegadaDef = urlLlegada ?? defaultArrival();
  const salidaDef =
    parseISODate(typeof raw.salida === "string" ? raw.salida : undefined) ?? addDays(llegadaDef, 2);
  const { search } = parseSearch(raw);

  const reglas = (room.reglas as { clave: string; valor: string }[]) ?? [];
  const otras = rooms.filter((r) => r.slug !== slug).slice(0, 3);

  const puntajes = room.reviews.map(
    (r) => (r.limpieza + r.ubicacion + r.atencion + r.comodidad + r.precio) / 5,
  );
  const rating = puntajes.length ? puntajes.reduce((a, b) => a + b, 0) / puntajes.length : null;

  const datos: [string, string][] = [
    ["Capacidad", guestsLabel(room.capacidadAdultos, room.capacidadNinos)],
    ["Cama", room.cama],
    ["Tamaño", room.tamanoM2 ? `${room.tamanoM2} m² aprox.` : "—"],
    ["Vista", room.vista ?? "—"],
    ["Baño", room.banoPrivado ? "Privado, con ducha" : "Compartido"],
    ["En la casa", room.ubicacionEnCasa ?? "—"],
    ["Wi-Fi", "De fibra, sin costo"],
    ["Estadía mínima", room.estadiaMin === 1 ? "1 noche" : `${room.estadiaMin} noches`],
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "HotelRoom",
    name: room.nombre,
    description: room.descripcionCorta,
    occupancy: {
      "@type": "QuantitativeValue",
      maxValue: room.capacidadAdultos + room.capacidadNinos,
    },
    bed: room.cama,
    amenityFeature: room.servicios.map((s) => ({
      "@type": "LocationFeatureSpecification",
      name: amenidadLabel(s),
      value: true,
    })),
    offers: {
      "@type": "Offer",
      priceCurrency: "COP",
      price: room.precioBase,
      availability: room.ventaCerrada ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
      url: `/habitaciones/${slug}`,
    },
    ...(rating
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: rating.toFixed(1),
            reviewCount: room.reviews.length,
            bestRating: 5,
          },
        }
      : {}),
    review: room.reviews.slice(0, 5).map((r) => ({
      "@type": "Review",
      author: { "@type": "Person", name: r.autor },
      reviewRating: {
        "@type": "Rating",
        ratingValue: ((r.limpieza + r.ubicacion + r.atencion + r.comodidad + r.precio) / 5).toFixed(1),
        bestRating: 5,
      },
      reviewBody: r.texto,
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Galería */}
      <div className="bg-marfil pt-20">
        <div className="shell pb-4 pt-4">
          <p className="text-[12px] text-ink-3">
            <Link href="/habitaciones" className="hover:text-oro-texto">
              Habitaciones
            </Link>{" "}
            · {room.nombre}
          </p>
        </div>
        <div className="shell grid gap-3 md:grid-cols-[2fr_1fr]">
          <ImageSlot
            src={room.images[0]?.url}
            alt={room.images[0]?.alt ?? `${room.nombre} — vista general`}
            ratio="4/3"
            className="rounded-lg"
            priority
          />
          <div className="grid gap-3">
            <ImageSlot src={room.images[1]?.url} alt={room.images[1]?.alt ?? "Detalle"} ratio="4/3" className="rounded-md" />
            <ImageSlot src={room.images[2]?.url} alt={room.images[2]?.alt ?? "Baño privado"} ratio="4/3" className="rounded-md" />
          </div>
        </div>
      </div>

      <Section>
        <RoomBooking
          slug={room.slug}
          nombre={room.nombre}
          capacidadAdultos={room.capacidadAdultos}
          capacidadNinos={room.capacidadNinos}
          calendar={calendar}
          ratePlans={room.ratePlans.map((p) => ({
            id: p.id,
            nombre: p.nombre,
            reembolsable: p.reembolsable,
            anticipoPct: p.anticipoPct,
            descuentoPct: p.descuentoPct,
            politicaCancelacion: p.politicaCancelacion,
          }))}
          defaults={{
            llegada: toISODate(llegadaDef),
            salida: toISODate(salidaDef),
            adultos: Math.min(search.adultos, room.capacidadAdultos),
            ninos: Math.min(search.ninos, room.capacidadNinos),
          }}
        >
          <div>
            <p className="kicker">Habitación</p>
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <h1 className="text-[clamp(1.9rem,5vw,2.4rem)]">{room.nombre}</h1>
              {room.ventaCerrada && <Badge tone="neutro">Venta cerrada</Badge>}
              {rating && (
                <span className="flex items-center gap-1.5 text-[13px] text-ink-2">
                  <StarRating value={rating} size={14} />
                  {rating.toFixed(1).replace(".", ",")} · {room.reviews.length} reseñas
                </span>
              )}
            </div>
            <p className="mt-2 text-[13px] text-ink-3">
              {guestsLabel(room.capacidadAdultos, room.capacidadNinos)} · {room.cama}
              {room.tamanoM2 ? ` · ${room.tamanoM2} m²` : ""}
              {room.banoPrivado ? " · baño privado" : ""}
              {room.vista ? ` · ${room.vista.toLowerCase()}` : ""} · desde{" "}
              {formatCOP(room.precioBase)}
            </p>

            <p className="mt-5 text-[15px] leading-relaxed text-ink-2">{room.descripcionLarga}</p>

            {/* Tabla de datos */}
            <div className="mt-6 overflow-hidden rounded-lg bg-hairline">
              <div className="grid gap-px sm:grid-cols-2">
                {datos.map(([k, v]) => (
                  <div key={k} className="bg-marfil p-3.5">
                    <p className="data-label">{k}</p>
                    <p className="mt-0.5 text-[13px] text-carbon">{v}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Amenidades */}
            <div className="mt-6">
              <h2 className="text-[17px]">Qué incluye</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {room.servicios.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1.5 rounded-pill bg-white px-3 py-1.5 text-[12px] text-ink-2 ring-1 ring-hairline"
                  >
                    <Diamond className="size-[6px]" />
                    {amenidadLabel(s)}
                  </span>
                ))}
              </div>
            </div>

            {/* Reglas */}
            {reglas.length > 0 && (
              <div className="mt-6">
                <h2 className="text-[17px]">Reglas y políticas</h2>
                <dl className="mt-3 divide-y divide-hairline border-y border-hairline">
                  {reglas.map((r) => (
                    <div key={r.clave} className="grid gap-1 py-2.5 sm:grid-cols-[150px_1fr]">
                      <dt className="text-[12.5px] font-medium text-carbon">{r.clave}</dt>
                      <dd className="text-[12.5px] text-ink-2">{r.valor}</dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-3 text-[12px] text-ink-3">
                  Cancelación gratuita hasta 5 días antes con la tarifa flexible.{" "}
                  <Link href="/legales/politica-de-cancelaciones" className="underline">
                    Ver política completa
                  </Link>
                  .
                </p>
              </div>
            )}
          </div>
        </RoomBooking>
      </Section>

      {/* Reseñas de esta habitación */}
      {room.reviews.length > 0 && (
        <Section tone="white">
          <SectionHeading
            kicker={`Reseñas de ${room.nombre}`}
            title={rating ? `${rating.toFixed(1).replace(".", ",")} de 5` : "Reseñas"}
          />
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {room.reviews.slice(0, 4).map((r) => (
              <figure key={r.id} className="rounded-lg border border-hairline bg-marfil p-5">
                <div className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-pill bg-carbon text-[12px] font-semibold text-marfil">
                    {initials(r.autor)}
                  </span>
                  <div>
                    <figcaption className="text-[13px] font-semibold text-carbon">{r.autor}</figcaption>
                    <p className="text-[11px] text-ink-3">
                      {r.fechaEstadia ? formatDateEs(r.fechaEstadia, { weekday: false }) : ""}
                    </p>
                  </div>
                </div>
                <blockquote className="mt-3 text-[13px] leading-relaxed text-ink-2">
                  “{r.texto}”
                </blockquote>
              </figure>
            ))}
          </div>
          <Link href="/resenas" className="mt-4 inline-block text-[13px] font-semibold text-oro-texto hover:underline">
            Ver todas las reseñas →
          </Link>
        </Section>
      )}

      {/* Habitaciones relacionadas */}
      <Section>
        <SectionHeading kicker="También te puede servir" title="Otras habitaciones" />
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {otras.map((r) => (
            <RoomPreviewCard
              key={r.id}
              room={{
                slug: r.slug,
                nombre: r.nombre,
                descripcionCorta: r.descripcionCorta,
                capacidadAdultos: r.capacidadAdultos,
                capacidadNinos: r.capacidadNinos,
                cama: r.cama,
                tamanoM2: r.tamanoM2,
                precioDesde: r.precioDesde,
                cover: r.images.find((i) => i.portada)
                  ? { url: r.images.find((i) => i.portada)!.url, alt: r.images.find((i) => i.portada)!.alt }
                  : null,
              }}
            />
          ))}
        </div>
      </Section>
    </>
  );
}
