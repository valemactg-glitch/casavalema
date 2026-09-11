import { ImageSlot } from "@/components/ui/ImageSlot";
import { googleMapsEmbedUrl, googleMapsUrl, type UbicacionSettings } from "@/lib/settings";

/**
 * Mapa embebido de Google (sin API key, vía el parámetro `output=embed`).
 * Mientras el administrador no configure coordenadas o dirección desde
 * Configuración, se muestra un marcador editable en su lugar.
 */
export function MapEmbed({
  ubicacion,
  className,
  ratio = "16/10",
  title = "Mapa de Casa Turística Valema",
}: {
  ubicacion: UbicacionSettings;
  className?: string;
  ratio?: `${number}/${number}`;
  title?: string;
}) {
  const src = googleMapsEmbedUrl(ubicacion);

  if (!src) {
    return (
      <ImageSlot
        alt="Mapa del sector — configúralo en Admin → Configuración → Ubicación"
        ratio={ratio}
        className={className}
      />
    );
  }

  return (
    <div className={className} style={{ aspectRatio: ratio.replace("/", " / ") }}>
      <iframe
        src={src}
        title={title}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="h-full w-full border-0"
        allowFullScreen
      />
    </div>
  );
}

export { googleMapsUrl };
