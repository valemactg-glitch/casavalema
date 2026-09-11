import Link from "next/link";
import { ImageSlot } from "@/components/ui/ImageSlot";
import { Badge } from "@/components/ui/Badge";
import { formatCOP } from "@/lib/format";
import { guestsLabel } from "@/lib/dates";

export type RoomPreview = {
  slug: string;
  nombre: string;
  descripcionCorta: string;
  capacidadAdultos: number;
  capacidadNinos: number;
  cama: string;
  tamanoM2: number | null;
  precioDesde: number;
  cover: { url: string; alt: string } | null;
};

export function RoomPreviewCard({ room }: { room: RoomPreview }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-lg border border-hairline bg-white shadow-card transition-shadow hover:shadow-elevated">
      <Link href={`/habitaciones/${room.slug}`} className="relative block">
        <ImageSlot
          src={room.cover?.url}
          alt={room.cover?.alt ?? `${room.nombre} — vista general`}
          ratio="4/3"
        />
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="text-[19px]">
            <Link href={`/habitaciones/${room.slug}`} className="text-carbon hover:text-oro-texto">
              {room.nombre}
            </Link>
          </h3>
          <span className="text-[12px] text-ink-3">
            desde <span className="font-semibold text-carbon">{formatCOP(room.precioDesde)}</span>
          </span>
        </div>
        <p className="text-[12px] text-ink-3">
          {guestsLabel(room.capacidadAdultos, room.capacidadNinos)} · {room.cama}
          {room.tamanoM2 ? ` · ${room.tamanoM2} m²` : ""}
        </p>
        <p className="line-clamp-2 flex-1 text-[13px] leading-relaxed text-ink-2">
          {room.descripcionCorta}
        </p>
        <div className="flex items-center gap-3 pt-1">
          <Link
            href={`/habitaciones/${room.slug}`}
            className="text-[12.5px] font-semibold text-oro-texto hover:underline"
          >
            Ver habitación →
          </Link>
        </div>
      </div>
    </article>
  );
}

export { Badge };
