import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { Section } from "@/components/site/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";
import { Diamond } from "@/components/ui/Diamond";
import { ImageSlot } from "@/components/ui/ImageSlot";
import { StarRating } from "@/components/ui/StarRating";
import { SearchForm } from "@/components/booking/SearchForm";
import { RoomPreviewCard } from "@/components/booking/RoomPreviewCard";
import {
  getRooms,
  getReviewsSummary,
  getServices,
  getGallery,
  getSitePage,
} from "@/lib/queries";
import { amenidadLabel } from "@/lib/catalog";
import { cobroLabel } from "@/lib/booking/pricing";
import { formatCOP, initials } from "@/lib/format";
import { defaultArrival, searchToQuery } from "@/lib/search-params";
import { addDays, formatDateEs } from "@/lib/dates";
import { CONTACT } from "@/lib/nav";

// Datos en vivo (disponibilidad, precios, contenido editable): nunca prerenderizar.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Casa Turística Valema — alojamiento boutique con rooftop",
  alternates: { canonical: "/" },
};

function heroDefaults() {
  const llegada = defaultArrival();
  const salida = addDays(llegada, 2);
  return {
    llegada: llegada.toISOString().slice(0, 10),
    salida: salida.toISOString().slice(0, 10),
    adultos: 2,
    ninos: 0,
    habitaciones: 1,
  };
}

export default async function HomePage() {
  const [rooms, resenas, servicios, galeria, home, laCasa, rooftop, ubicacion] =
    await Promise.all([
      getRooms(),
      getReviewsSummary(),
      getServices(),
      getGallery(),
      getSitePage("home"),
      getSitePage("la-casa"),
      getSitePage("rooftop"),
      getSitePage("ubicacion"),
    ]);

  const hero = home as {
    heroKicker?: string;
    heroTitulo?: string;
    heroTexto?: string;
    cifras?: { valor: string; etiqueta: string }[];
  };
  const cifras = hero.cifras ?? [
    { valor: "5", etiqueta: "Habitaciones" },
    { valor: resenas.promedio ? resenas.promedio.toFixed(1).replace(".", ",") : "—", etiqueta: "Calificación" },
    { valor: "2 min", etiqueta: "Al rooftop" },
  ];

  const beneficios = [
    { t: "Mejor precio", d: "Si lo encuentras más barato en otro canal, lo igualamos." },
    { t: "Cancelación flexible", d: "Gratis hasta 5 días antes de la llegada con la tarifa flexible." },
    { t: "Anticipo del 30 %", d: "Reservas con el 30 % y pagas el saldo al llegar, en efectivo o transferencia." },
    { t: "Hablas con la casa", d: "Sin call center: te responde quien te va a recibir." },
  ];

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative isolate flex min-h-[42rem] flex-col justify-center overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <Image
            src="/foto3.png"
            alt="Casa Turística Valema al atardecer"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(20,29,41,0.78) 0%, rgba(29,42,58,0.34) 30%, rgba(29,42,58,0.30) 55%, rgba(20,29,41,0.86) 100%)",
              pointerEvents: "none",
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(100deg, rgba(20,29,41,0.66) 0%, rgba(20,29,41,0.30) 44%, rgba(20,29,41,0) 70%)",
              pointerEvents: "none",
            }}
          />
        </div>

        <div className="shell pt-28 pb-40">
          <p className="font-heading text-[19px] font-light italic text-oro">
            {hero.heroKicker ?? "Bienvenido a"}
          </p>
          <h1 className="mt-1 text-[clamp(3rem,9vw,4.6rem)] leading-none tracking-[-0.02em] text-marfil">
            {hero.heroTitulo ?? "Valema"}
          </h1>
          <div className="mt-4 h-0.5 w-14 bg-oro" />
          <p className="mt-5 max-w-lg text-[16px] leading-relaxed text-marfil/90">
            {hero.heroTexto ??
              "Cinco habitaciones independientes, cada una con su nombre y su carácter, y un rooftop donde la tarde se alarga."}
          </p>
        </div>

        <div className="absolute inset-x-0 bottom-0">
          <div className="grid grid-cols-3 border-t border-oro/25 bg-carbon/70 text-marfil backdrop-blur-sm">
            {cifras.map((c) => (
              <div key={c.etiqueta} className="border-l border-oro/25 px-4 py-3 first:border-l-0 sm:px-6 sm:py-4">
                <p className="font-heading text-[17px] text-oro">{c.valor}</p>
                <p className="text-[11px] uppercase tracking-[0.1em] text-marfil/70">{c.etiqueta}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Buscador ─────────────────────────────────────── */}
      <div className="shell -mt-20 relative z-10">
        <SearchForm defaults={heroDefaults()} variant="hero" />
      </div>

      {/* ── La casa ──────────────────────────────────────── */}
      <Section>
        <div className="grid gap-10 lg:grid-cols-[1fr_1.05fr] lg:items-center">
          <div>
            <SectionHeading
              kicker={(laCasa.kicker as string) ?? "La casa · nuestra historia"}
              title={(laCasa.titulo as string) ?? "Una casa de familia que aprendió a recibir"}
              intro={(laCasa.historia as string) ?? undefined}
            />
            <div className="mt-6 grid grid-cols-3 gap-4">
              {[
                { v: "5", l: "Habitaciones" },
                { v: "13", l: "Huéspedes máx." },
                { v: "1", l: "Rooftop" },
              ].map((c) => (
                <div key={c.l} className="border-t-2 border-oro pt-2">
                  <p className="font-heading text-[22px] text-carbon">{c.v}</p>
                  <p className="data-label">{c.l}</p>
                </div>
              ))}
            </div>
            <div className="mt-6">
              <Button href="/la-casa" variant="outline" size="sm">
                Conoce la casa
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <ImageSlot src="/foto4.png" alt="Rooftop al atardecer con la bugambilia y vista al valle" ratio="3/4" className="rounded-md" />
            <div className="grid gap-3">
              <ImageSlot src="/foto1.png" alt="Desayuno servido en la terraza con vista a las montañas" ratio="4/3" className="rounded-md" />
              <ImageSlot alt="Comedor con mesa larga de madera" ratio="4/3" className="rounded-md" />
            </div>
          </div>
        </div>
      </Section>

      {/* ── Habitaciones ─────────────────────────────────── */}
      <Section tone="white">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeading
            kicker="Las habitaciones"
            title="Cinco nombres, cinco caracteres"
            intro="Cada habitación es independiente, con su precio y su disponibilidad. Elige por capacidad, por vista o por presupuesto."
          />
          <Button href="/habitaciones" variant="ghost" size="sm">
            Ver todas y comparar →
          </Button>
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {rooms.map((r) => (
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

      {/* ── Beneficios reserva directa ───────────────────── */}
      <Section>
        <div className="rounded-xl bg-carbon px-6 py-10 text-marfil sm:px-10">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.6fr] lg:items-center">
            <div>
              <p className="kicker !text-oro">Reserva directa</p>
              <h2 className="mt-2 text-[clamp(1.5rem,3.5vw,2rem)] text-marfil">
                Reservar aquí siempre conviene más
              </h2>
            </div>
            <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
              {beneficios.map((b) => (
                <div key={b.t} className="border-t border-oro/40 pt-3">
                  <p className="text-[14px] font-semibold text-marfil">{b.t}</p>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-marfil/70">{b.d}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* ── Rooftop ──────────────────────────────────────── */}
      <Section tone="white">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <ImageSlot src="/foto4.png" alt="Rooftop al atardecer con pérgola de bugambilia y vista al valle" ratio="4/3" className="rounded-lg" />
          <div>
            <SectionHeading
              kicker={(rooftop.kicker as string) ?? "El rooftop"}
              title={(rooftop.titulo as string) ?? "Donde termina el día"}
              intro={(rooftop.texto as string) ?? undefined}
            />
            <div className="mt-5 flex flex-wrap gap-2">
              {["Uso libre para huéspedes", "Abierto 7:00–22:00", "Hamacas y sombra", "Vista a los tejados"].map(
                (chip) => (
                  <span
                    key={chip}
                    className="rounded-pill border border-hairline bg-marfil px-3 py-1.5 text-[12px] text-ink-2"
                  >
                    {chip}
                  </span>
                ),
              )}
            </div>
            <div className="mt-6">
              <Button href="/rooftop" variant="outline" size="sm">
                Ver el rooftop
              </Button>
            </div>
          </div>
        </div>
      </Section>

      {/* ── Servicios ────────────────────────────────────── */}
      <Section>
        <SectionHeading
          kicker="Servicios y comodidades"
          title="Lo que encuentras en la casa"
          intro="Wi-Fi de fibra, agua caliente y ropa de cama de algodón en todas las habitaciones. Y algunos extras que puedes sumar a tu reserva."
        />
        <div className="mt-8 overflow-hidden rounded-lg bg-hairline">
          <div className="grid gap-px sm:grid-cols-2 lg:grid-cols-3">
            {[
              ...["wifi", "agua_caliente", "ropa_cama_algodon", "acceso_rooftop", "escritorio", "amenities_bano"].map(
                (k) => ({ t: amenidadLabel(k), d: "Incluido en todas las habitaciones", incluido: true }),
              ),
            ].map((s) => (
              <div key={s.t} className="bg-marfil p-5">
                <div className="flex items-center gap-2">
                  <Diamond className="size-[7px]" />
                  <p className="text-[13.5px] font-semibold text-carbon">{s.t}</p>
                </div>
                <p className="mt-1 text-[12px] text-ink-3">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-[12.5px] text-ink-2">
          {servicios.slice(0, 5).map((s) => (
            <span key={s.id} className="inline-flex items-center gap-1.5">
              <span className="text-oro-texto">+</span>
              {s.nombre}
              {s.precio > 0 && (
                <span className="text-ink-3">
                  {" "}
                  {formatCOP(s.precio)} {cobroLabel(s.tipoCobro)}
                </span>
              )}
            </span>
          ))}
          <Link href="/servicios" className="font-semibold text-oro-texto hover:underline">
            Ver todos →
          </Link>
        </div>
      </Section>

      {/* ── Galería ──────────────────────────────────────── */}
      <Section tone="white" bleed>
        <div className="shell">
          <SectionHeading kicker="Galería" title="La casa por dentro" />
        </div>
        <div className="mt-8 flex snap-x gap-4 overflow-x-auto px-[max(20px,calc((100vw-1180px)/2+20px))] pb-4">
          {galeria.slice(0, 10).map((g) => (
            <div key={g.id} className="w-[262px] shrink-0 snap-start">
              <ImageSlot src={g.url} alt={g.alt} ratio="4/3" className="rounded-md" />
            </div>
          ))}
          <Link
            href="/galeria"
            className="grid w-[200px] shrink-0 snap-start place-items-center rounded-md border border-hairline bg-marfil text-[13px] font-semibold text-oro-texto"
          >
            Ver galería completa →
          </Link>
        </div>
      </Section>

      {/* ── Ubicación ────────────────────────────────────── */}
      <Section>
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <SectionHeading
              kicker={(ubicacion.kicker as string) ?? "Cómo llegar"}
              title={(ubicacion.titulo as string) ?? "En un barrio tranquilo, cerca de todo"}
              intro={(ubicacion.sector as string) ?? undefined}
            />
            <dl className="mt-6 divide-y divide-hairline border-y border-hairline">
              {((ubicacion.distancias as { lugar: string; detalle: string }[]) ?? [])
                .slice(0, 4)
                .map((d) => (
                  <div key={d.lugar} className="flex justify-between py-2.5 text-[13px]">
                    <dt className="text-ink-2">{d.lugar}</dt>
                    <dd className="font-medium text-carbon">{d.detalle}</dd>
                  </div>
                ))}
            </dl>
            <div className="mt-6">
              <Button href="/ubicacion" variant="outline" size="sm">
                Ver ubicación y cómo llegar
              </Button>
            </div>
          </div>
          <ImageSlot alt="Mapa esquemático del sector — sustituir por Google Maps" ratio="4/3" className="rounded-lg" />
        </div>
      </Section>

      {/* ── Reseñas ──────────────────────────────────────── */}
      {resenas.count > 0 && (
        <Section tone="white">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="kicker mb-2">Reseñas verificadas</p>
              <div className="flex items-center gap-3">
                <h2 className="text-[clamp(1.8rem,4vw,2.2rem)]">
                  {resenas.promedio.toFixed(1).replace(".", ",")} de 5
                </h2>
                <StarRating value={resenas.promedio} size={18} />
              </div>
              <p className="mt-1 text-[13px] text-ink-3">
                {resenas.count} reseñas de huéspedes que reservaron directo o por Airbnb
              </p>
            </div>
            <Button href="/resenas" variant="ghost" size="sm">
              Ver todas las reseñas →
            </Button>
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {resenas.reviews
              .filter((r) => r.destacada)
              .slice(0, 3)
              .concat(resenas.reviews.filter((r) => !r.destacada))
              .slice(0, 3)
              .map((r) => (
                <figure key={r.id} className="rounded-lg border border-hairline bg-marfil p-5">
                  <div className="flex items-center gap-3">
                    <span className="grid size-9 place-items-center rounded-pill bg-carbon text-[12px] font-semibold text-marfil">
                      {initials(r.autor)}
                    </span>
                    <div>
                      <figcaption className="text-[13px] font-semibold text-carbon">{r.autor}</figcaption>
                      <p className="text-[11px] text-ink-3">
                        {r.room?.nombre ?? "Casa Valema"}
                        {r.fechaEstadia ? ` · ${formatDateEs(r.fechaEstadia, { weekday: false })}` : ""}
                      </p>
                    </div>
                  </div>
                  <blockquote className="mt-3 line-clamp-5 text-[13px] leading-relaxed text-ink-2">
                    “{r.texto}”
                  </blockquote>
                </figure>
              ))}
          </div>
        </Section>
      )}

      {/* ── Instagram ────────────────────────────────────── */}
      <Section>
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="kicker">En redes</p>
          <h2 className="text-[clamp(1.5rem,3.5vw,1.9rem)]">Síguenos en Instagram</h2>
          <p className="text-[13px] text-ink-2">
            @{CONTACT.instagram} — la casa, el rooftop y el barrio, casi a diario.
          </p>
          <div className="mt-4 grid w-full grid-cols-3 gap-3 sm:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <ImageSlot key={i} alt={`Publicación de Instagram ${i + 1}`} ratio="1/1" className="rounded-md" />
            ))}
          </div>
          <Button href={CONTACT.instagramUrl} variant="outline" size="sm" className="mt-4">
            Abrir Instagram
          </Button>
        </div>
      </Section>

      {/* ── CTA final ────────────────────────────────────── */}
      <Section tone="carbon">
        <div className="flex flex-col items-center gap-5 text-center">
          <p className="kicker !text-oro">Tu habitación te espera</p>
          <h2 className="max-w-xl text-[clamp(1.8rem,4vw,2.4rem)] text-marfil">
            Consulta disponibilidad y reserva en dos minutos
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            <Button href={`/reservar?${searchToQuery(defaultRange())}`} variant="gold" size="lg">
              Ver disponibilidad
            </Button>
            <Button href="/habitaciones" variant="outline" size="lg" className="border-marfil/40 text-marfil hover:bg-marfil/10">
              Comparar habitaciones
            </Button>
          </div>
        </div>
      </Section>
    </>
  );
}

function defaultRange() {
  const llegada = defaultArrival();
  return { llegada, salida: addDays(llegada, 2), adultos: 2, ninos: 0, habitaciones: 1 };
}
