"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";

const BAR_STYLES: Record<string, string> = {
  directa: "bg-carbon text-marfil",
  airbnb: "bg-oro text-carbon",
  pendiente: "border border-dashed border-oro bg-[#FFF9E8] text-[#8A6A0B]",
  conflicto: "border border-bugambilia bg-[#FFE3EA] text-[#C2385A]",
  encurso: "bg-[#2c4159] text-marfil",
  manual: "bg-[#E4E2DA] text-[#5b6472]",
  mantenimiento: "border border-carbon/30 bg-[#E4E2DA] text-[#5b6472]",
  cortesia: "bg-exito-bg text-exito-fg",
};

const LEYENDA: [string, string][] = [
  ["Disponible", "border border-hairline bg-white"],
  ["Reserva directa", "bg-carbon"],
  ["Reserva Airbnb", "bg-oro"],
  ["Pendiente de pago", "border border-dashed border-oro bg-[#FFF9E8]"],
  ["Conflicto", "border border-bugambilia bg-[#FFE3EA]"],
  ["Bloqueo manual", "bg-[#E4E2DA]"],
  ["Mantenimiento", "border border-carbon/30 bg-[#E4E2DA]"],
  ["Cortesía", "bg-exito-bg"],
];

type Fila = {
  room: { id: string; nombre: string; precioBase: number; capacidadAdultos: number; capacidadNinos: number };
  barras: { tipo: string; left: number; width: number; label: string; id: string; href?: string }[];
};
type Columna = { fecha: string; dia: number; dow: number; finde: boolean };

const DOW = ["D", "L", "M", "M", "J", "V", "S"];

export function CalendarStrip({
  filas,
  columnas,
  desde,
  dias,
}: {
  filas: Fila[];
  columnas: Columna[];
  desde: string;
  dias: number;
}) {
  const router = useRouter();

  function mover(deltaDias: number) {
    const d = new Date(desde + "T00:00:00Z");
    d.setUTCDate(d.getUTCDate() + deltaDias);
    router.push(`/admin/calendario?desde=${d.toISOString().slice(0, 10)}`);
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex gap-1.5">
          <button onClick={() => mover(-dias)} className="rounded-md border border-hairline px-2.5 py-1 text-[12px] hover:bg-marfil">
            ←
          </button>
          <button onClick={() => mover(-1)} className="rounded-md border border-hairline px-2.5 py-1 text-[12px] hover:bg-marfil">
            Día −
          </button>
          <button onClick={() => router.push("/admin/calendario")} className="rounded-md border border-hairline px-2.5 py-1 text-[12px] hover:bg-marfil">
            Hoy
          </button>
          <button onClick={() => mover(1)} className="rounded-md border border-hairline px-2.5 py-1 text-[12px] hover:bg-marfil">
            Día +
          </button>
          <button onClick={() => mover(dias)} className="rounded-md border border-hairline px-2.5 py-1 text-[12px] hover:bg-marfil">
            →
          </button>
        </div>
        <p className="text-[12px] text-ink-3">{columnas.length} días · vista cinta</p>
      </div>

      <div className="overflow-x-auto rounded-md border border-hairline bg-white">
        <div className="min-w-[860px]">
          {/* Cabecera de días */}
          <div className="grid" style={{ gridTemplateColumns: `160px repeat(${dias}, 1fr)` }}>
            <div className="border-b border-r border-hairline px-3 py-2 text-[11px] text-ink-3">Habitación</div>
            {columnas.map((c) => (
              <div
                key={c.fecha}
                className={clsx(
                  "border-b border-hairline py-1.5 text-center text-[10.5px]",
                  c.finde ? "font-semibold text-[#B08D1F]" : "text-ink-3",
                )}
              >
                <div>{DOW[c.dow]}</div>
                <div className="text-carbon">{c.dia}</div>
              </div>
            ))}
          </div>

          {/* Filas por habitación */}
          {filas.map((f) => (
            <div
              key={f.room.id}
              className="grid border-b border-hairline last:border-0"
              style={{ gridTemplateColumns: `160px repeat(${dias}, 1fr)` }}
            >
              <div className="border-r border-hairline px-3 py-3">
                <p className="text-[12px] font-medium text-carbon">{f.room.nombre}</p>
                <p className="text-[10px] text-ink-3">
                  {f.room.capacidadAdultos + f.room.capacidadNinos} huéspedes
                </p>
              </div>
              <div className="relative col-span-full" style={{ gridColumn: `2 / span ${dias}` }}>
                <div className="pointer-events-none absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${dias}, 1fr)` }}>
                  {columnas.map((c) => (
                    <div key={c.fecha} className={clsx("border-r border-hairline/60", c.finde && "bg-marfil/50")} />
                  ))}
                </div>
                <div className="relative py-2" style={{ minHeight: 44 }}>
                  {f.barras.map((b, i) => {
                    const cls = clsx(
                      "absolute top-1.5 flex items-center overflow-hidden rounded-[5px] px-2 text-[10px] font-medium",
                      BAR_STYLES[b.tipo] ?? BAR_STYLES.manual,
                    );
                    const style = { left: `${b.left}%`, width: `calc(${b.width}% - 3px)`, height: 30 };
                    return b.href ? (
                      <Link key={b.id + i} href={b.href} title={b.label} className={cls} style={style}>
                        <span className="truncate">{b.label}</span>
                      </Link>
                    ) : (
                      <div key={b.id + i} title={b.label} className={cls} style={style}>
                        <span className="truncate">{b.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[10.5px] text-ink-2">
        {LEYENDA.map(([label, cls]) => (
          <span key={label} className="flex items-center gap-1.5">
            <span className={clsx("inline-block size-3 rounded-sm", cls)} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
