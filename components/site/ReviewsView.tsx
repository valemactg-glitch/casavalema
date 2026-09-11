"use client";

import { useMemo, useState } from "react";
import { clsx } from "clsx";
import { StarRating } from "@/components/ui/StarRating";
import { Badge } from "@/components/ui/Badge";
import { initials } from "@/lib/format";

export type ReviewItem = {
  id: string;
  autor: string;
  fecha: string | null;
  roomNombre: string | null;
  roomSlug: string | null;
  promedio: number;
  texto: string;
  respuesta: string | null;
  destacada: boolean;
};

const CATS: { key: string; label: string }[] = [
  { key: "limpieza", label: "Limpieza" },
  { key: "ubicacion", label: "Ubicación" },
  { key: "atencion", label: "Atención" },
  { key: "comodidad", label: "Comodidad" },
  { key: "precio", label: "Relación calidad-precio" },
];

export function ReviewsView({
  promedio,
  count,
  categorias,
  reviews,
}: {
  promedio: number;
  count: number;
  categorias: Record<string, number>;
  reviews: ReviewItem[];
}) {
  const habitaciones = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of reviews) if (r.roomSlug && r.roomNombre) map.set(r.roomSlug, r.roomNombre);
    return [...map.entries()];
  }, [reviews]);

  const [room, setRoom] = useState("todas");
  const [orden, setOrden] = useState<"recientes" | "mejores">("recientes");

  const visibles = useMemo(() => {
    let list = room === "todas" ? reviews : reviews.filter((r) => r.roomSlug === room);
    list = [...list];
    if (orden === "mejores") list.sort((a, b) => b.promedio - a.promedio);
    return list;
  }, [reviews, room, orden]);

  return (
    <div className="grid gap-10 lg:grid-cols-[300px_1fr]">
      <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-lg border border-hairline bg-white p-5">
          <div className="flex items-center gap-3">
            <span className="font-heading text-[34px] leading-none text-carbon">
              {promedio.toFixed(1).replace(".", ",")}
            </span>
            <div>
              <StarRating value={promedio} size={16} />
              <p className="mt-1 text-[12px] text-ink-3">{count} reseñas verificadas</p>
            </div>
          </div>
          <dl className="mt-5 space-y-2.5">
            {CATS.map((c) => {
              const v = categorias[c.key] ?? 0;
              return (
                <div key={c.key} className="grid grid-cols-[1fr_auto] items-center gap-2 text-[12px]">
                  <dt className="text-ink-2">{c.label}</dt>
                  <dd className="flex items-center gap-2">
                    <span className="h-1.5 w-24 overflow-hidden rounded-pill bg-neutro-bg">
                      <span
                        className="block h-full rounded-pill bg-oro"
                        style={{ width: `${(v / 5) * 100}%` }}
                      />
                    </span>
                    <span className="w-6 text-right font-medium text-carbon">
                      {v.toFixed(1).replace(".", ",")}
                    </span>
                  </dd>
                </div>
              );
            })}
          </dl>
        </div>

        <div className="space-y-3">
          <div>
            <label className="data-label mb-1.5 block">Habitación</label>
            <select
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              className="h-10 w-full rounded-sm border border-hairline bg-white px-3 text-[13px]"
            >
              <option value="todas">Todas las habitaciones</option>
              {habitaciones.map(([slug, nombre]) => (
                <option key={slug} value={slug}>
                  {nombre}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="data-label mb-1.5 block">Orden</label>
            <select
              value={orden}
              onChange={(e) => setOrden(e.target.value as "recientes" | "mejores")}
              className="h-10 w-full rounded-sm border border-hairline bg-white px-3 text-[13px]"
            >
              <option value="recientes">Más recientes</option>
              <option value="mejores">Mejor calificadas</option>
            </select>
          </div>
        </div>

        <p className="rounded-lg border border-hairline bg-marfil p-4 text-[12px] leading-relaxed text-ink-2">
          Solo publicamos reseñas de huéspedes que completaron su estadía. Después del
          check-out te llega una invitación por correo para dejar la tuya.
        </p>
      </aside>

      <div>
        <p className="mb-4 text-[13px] text-ink-3">
          {visibles.length} {visibles.length === 1 ? "reseña" : "reseñas"}
          {room !== "todas" && " para esta habitación"}
        </p>
        <ul className="space-y-4">
          {visibles.map((r) => (
            <li key={r.id}>
              <article
                className={clsx(
                  "rounded-lg border bg-white p-5",
                  r.destacada ? "border-oro/40" : "border-hairline",
                )}
              >
                <header className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="grid size-9 place-items-center rounded-pill bg-carbon text-[12px] font-semibold text-marfil">
                      {initials(r.autor)}
                    </span>
                    <div>
                      <p className="text-[13.5px] font-semibold text-carbon">{r.autor}</p>
                      <p className="text-[11.5px] text-ink-3">
                        {r.roomNombre ?? "Casa Valema"}
                        {r.fecha ? ` · ${r.fecha}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StarRating value={r.promedio} size={13} />
                    {r.destacada && <Badge tone="oro">Destacada</Badge>}
                  </div>
                </header>
                <p className="mt-3 text-[13.5px] leading-relaxed text-ink-2">{r.texto}</p>
                {r.respuesta && (
                  <div className="mt-3 rounded-md bg-marfil p-3.5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-oro-texto">
                      Respuesta de Valema
                    </p>
                    <p className="mt-1 text-[12.5px] leading-relaxed text-ink-2">{r.respuesta}</p>
                  </div>
                )}
              </article>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
