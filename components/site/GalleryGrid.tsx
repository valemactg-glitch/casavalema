"use client";

import { useEffect, useMemo, useState } from "react";
import { clsx } from "clsx";
import { ImageSlot } from "@/components/ui/ImageSlot";

export type GalleryItem = {
  id: string;
  url: string;
  alt: string;
  pie: string | null;
  categoria: string;
};

const LABELS: Record<string, string> = {
  todas: "Todas",
  habitaciones: "Habitaciones",
  fachada: "Fachada",
  comunes: "Espacios comunes",
  rooftop: "Rooftop",
  entorno: "Entorno",
  experiencias: "Experiencias",
};

export function GalleryGrid({ items }: { items: GalleryItem[] }) {
  const categorias = useMemo(() => {
    const set = new Set(items.map((i) => i.categoria));
    return ["todas", ...Object.keys(LABELS).filter((k) => k !== "todas" && set.has(k))];
  }, [items]);

  const [filtro, setFiltro] = useState("todas");
  const [abierta, setAbierta] = useState<number | null>(null);

  const visibles = filtro === "todas" ? items : items.filter((i) => i.categoria === filtro);

  function cambiarFiltro(c: string) {
    setFiltro(c);
    setAbierta(null);
  }

  useEffect(() => {
    if (abierta === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setAbierta(null);
      if (e.key === "ArrowRight") setAbierta((v) => (v === null ? v : (v + 1) % visibles.length));
      if (e.key === "ArrowLeft") setAbierta((v) => (v === null ? v : (v - 1 + visibles.length) % visibles.length));
    }
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [abierta, visibles.length]);

  return (
    <div>
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filtrar galería">
        {categorias.map((c) => (
          <button
            key={c}
            role="tab"
            aria-selected={filtro === c}
            onClick={() => cambiarFiltro(c)}
            className={clsx(
              "rounded-pill px-3.5 py-1.5 text-[12.5px] font-medium transition-colors",
              filtro === c
                ? "bg-carbon text-marfil"
                : "border border-hairline bg-white text-ink-2 hover:border-carbon",
            )}
          >
            {LABELS[c] ?? c}
          </button>
        ))}
      </div>

      {visibles.length === 0 ? (
        <p className="mt-10 text-[13px] text-ink-3">Todavía no hay fotos en esta categoría.</p>
      ) : (
        <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {visibles.map((item, i) => (
            <li key={item.id}>
              <button
                onClick={() => setAbierta(i)}
                className="group block w-full overflow-hidden rounded-md focus-visible:outline-2"
                aria-label={`Ampliar: ${item.alt}`}
              >
                <ImageSlot
                  src={item.url}
                  alt={item.alt}
                  ratio="1/1"
                  className="transition-transform group-hover:scale-[1.03]"
                />
              </button>
            </li>
          ))}
        </ul>
      )}

      {abierta !== null && visibles[abierta] && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={visibles[abierta].alt}
          className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-carbon/92 p-4"
          onClick={() => setAbierta(null)}
        >
          <button
            className="absolute right-4 top-4 grid size-10 place-items-center rounded-pill bg-white/10 text-marfil hover:bg-white/20"
            onClick={() => setAbierta(null)}
            aria-label="Cerrar"
          >
            ✕
          </button>
          <div className="w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <div className="overflow-hidden rounded-lg">
              <ImageSlot src={visibles[abierta].url} alt={visibles[abierta].alt} ratio="16/10" />
            </div>
            <p className="mt-3 text-center text-[13px] text-marfil/80">
              {visibles[abierta].pie ?? visibles[abierta].alt}
              <span className="ml-2 text-marfil/50">
                {abierta + 1} / {visibles.length}
              </span>
            </p>
          </div>
          <div className="mt-4 flex gap-3">
            <button
              className="rounded-pill bg-white/10 px-4 py-2 text-[13px] text-marfil hover:bg-white/20"
              onClick={(e) => {
                e.stopPropagation();
                setAbierta((v) => (v === null ? v : (v - 1 + visibles.length) % visibles.length));
              }}
            >
              ← Anterior
            </button>
            <button
              className="rounded-pill bg-white/10 px-4 py-2 text-[13px] text-marfil hover:bg-white/20"
              onClick={(e) => {
                e.stopPropagation();
                setAbierta((v) => (v === null ? v : (v + 1) % visibles.length));
              }}
            >
              Siguiente →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
