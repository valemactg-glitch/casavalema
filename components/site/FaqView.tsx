"use client";

import { useMemo, useState } from "react";
import { clsx } from "clsx";

export type FaqGroup = { categoria: string; items: { id: string; pregunta: string; respuesta: string }[] };

export function FaqView({ grupos }: { grupos: FaqGroup[] }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("todas");
  const norm = q.trim().toLowerCase();

  const filtrados = useMemo(() => {
    return grupos
      .filter((g) => cat === "todas" || g.categoria === cat)
      .map((g) => ({
        ...g,
        items: norm
          ? g.items.filter(
              (i) =>
                i.pregunta.toLowerCase().includes(norm) ||
                i.respuesta.toLowerCase().includes(norm),
            )
          : g.items,
      }))
      .filter((g) => g.items.length > 0);
  }, [grupos, cat, norm]);

  const total = filtrados.reduce((s, g) => s + g.items.length, 0);

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Busca una pregunta…"
            aria-label="Buscar en preguntas frecuentes"
            className="h-11 w-full rounded-pill border border-hairline bg-white pl-10 pr-4 text-[13.5px] focus:border-oro focus:outline-none"
          />
          <svg
            className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-3"
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden="true"
          >
            <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.6" />
            <path d="m17 17-3.5-3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </div>
        <select
          value={cat}
          onChange={(e) => setCat(e.target.value)}
          className="h-11 rounded-pill border border-hairline bg-white px-4 text-[13px]"
          aria-label="Filtrar por categoría"
        >
          <option value="todas">Todas las categorías</option>
          {grupos.map((g) => (
            <option key={g.categoria} value={g.categoria}>
              {g.categoria}
            </option>
          ))}
        </select>
      </div>

      {total === 0 ? (
        <p className="mt-10 text-[13.5px] text-ink-3">
          No encontramos preguntas para “{q}”. Escríbenos por WhatsApp y te respondemos.
        </p>
      ) : (
        <div className="mt-8 space-y-10">
          {filtrados.map((g) => (
            <section key={g.categoria}>
              <h2 className="kicker mb-3">{g.categoria}</h2>
              <div className="divide-y divide-hairline border-y border-hairline">
                {g.items.map((i) => (
                  <details key={i.id} className="group py-1">
                    <summary
                      className={clsx(
                        "flex cursor-pointer list-none items-center justify-between gap-4 py-3.5",
                        "text-[14px] font-medium text-carbon marker:content-none",
                      )}
                    >
                      {i.pregunta}
                      <span className="grid size-6 shrink-0 place-items-center rounded-pill border border-hairline text-ink-3 transition-transform group-open:rotate-45">
                        +
                      </span>
                    </summary>
                    <p className="pb-4 pr-10 text-[13.5px] leading-relaxed text-ink-2">
                      {i.respuesta}
                    </p>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
