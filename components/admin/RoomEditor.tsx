"use client";

import { useActionState } from "react";
import { Field, SelectField, TextareaField, CheckboxField } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { guardarHabitacion, type RoomState } from "@/app/admin/(panel)/habitaciones/actions";
import { AMENIDADES } from "@/lib/catalog";

const initial: RoomState = {};

type Room = {
  id: string;
  nombre: string;
  descripcionCorta: string;
  descripcionLarga: string;
  capacidadAdultos: number;
  capacidadNinos: number;
  cama: string;
  tamanoM2: number | null;
  vista: string | null;
  ubicacionEnCasa: string | null;
  banoPrivado: boolean;
  precioBase: number;
  anticipoPct: number;
  estadiaMin: number;
  visible: boolean;
  ventaCerrada: boolean;
  seoTitulo: string | null;
  seoDescripcion: string | null;
  servicios: string[];
};

export function RoomEditor({ room }: { room: Room }) {
  const [state, action, pending] = useActionState(guardarHabitacion, initial);

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="id" value={room.id} />
      {state.ok && (
        <p className="rounded-md bg-exito-bg px-3 py-2 text-[12px] text-exito-fg">Cambios guardados.</p>
      )}
      {state.error && (
        <p className="rounded-md bg-error-soft-bg px-3 py-2 text-[12px] text-error-fg">{state.error}</p>
      )}

      <details open className="rounded-md border border-hairline bg-white">
        <summary className="cursor-pointer px-4 py-2.5 text-[13px] font-semibold text-carbon">Contenido</summary>
        <div className="space-y-3 border-t border-hairline p-4">
          <Field name="nombre" label="Nombre" defaultValue={room.nombre} required />
          <TextareaField name="descripcionCorta" label="Descripción corta" defaultValue={room.descripcionCorta} rows={2} required />
          <TextareaField name="descripcionLarga" label="Descripción larga" defaultValue={room.descripcionLarga} rows={5} required />
          <div className="grid gap-3 sm:grid-cols-3">
            <SelectField name="capacidadAdultos" label="Adultos" defaultValue={String(room.capacidadAdultos)}>
              {[1, 2, 3, 4, 5, 6].map((n) => <option key={n}>{n}</option>)}
            </SelectField>
            <SelectField name="capacidadNinos" label="Niños" defaultValue={String(room.capacidadNinos)}>
              {[0, 1, 2, 3, 4].map((n) => <option key={n}>{n}</option>)}
            </SelectField>
            <Field name="cama" label="Cama" defaultValue={room.cama} required />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field name="tamanoM2" label="m²" type="number" defaultValue={room.tamanoM2 ?? ""} />
            <Field name="vista" label="Vista" defaultValue={room.vista ?? ""} />
            <Field name="ubicacionEnCasa" label="Ubicación en la casa" defaultValue={room.ubicacionEnCasa ?? ""} />
          </div>
          <CheckboxField name="banoPrivado" label="Baño privado" defaultChecked={room.banoPrivado} />
        </div>
      </details>

      <details className="rounded-md border border-hairline bg-white">
        <summary className="cursor-pointer px-4 py-2.5 text-[13px] font-semibold text-carbon">Servicios incluidos</summary>
        <div className="grid gap-2 border-t border-hairline p-4 sm:grid-cols-2">
          {Object.entries(AMENIDADES).map(([k, label]) => (
            <CheckboxField
              key={k}
              name="servicios"
              value={k}
              label={label}
              defaultChecked={room.servicios.includes(k)}
            />
          ))}
        </div>
      </details>

      <details className="rounded-md border border-hairline bg-white">
        <summary className="cursor-pointer px-4 py-2.5 text-[13px] font-semibold text-carbon">Precios y venta</summary>
        <div className="space-y-3 border-t border-hairline p-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <Field name="precioBase" label="Precio base / noche (COP)" type="number" defaultValue={room.precioBase} required />
            <Field name="anticipoPct" label="Anticipo %" type="number" defaultValue={room.anticipoPct} />
            <Field name="estadiaMin" label="Estadía mínima (noches)" type="number" defaultValue={room.estadiaMin} />
          </div>
          <CheckboxField name="visible" label="Visible en el sitio" defaultChecked={room.visible} />
          <CheckboxField name="ventaCerrada" label="Cerrar la venta temporalmente (sigue visible, no reservable)" defaultChecked={room.ventaCerrada} />
        </div>
      </details>

      <details className="rounded-md border border-hairline bg-white">
        <summary className="cursor-pointer px-4 py-2.5 text-[13px] font-semibold text-carbon">SEO</summary>
        <div className="space-y-3 border-t border-hairline p-4">
          <Field name="seoTitulo" label="Título SEO" defaultValue={room.seoTitulo ?? ""} />
          <TextareaField name="seoDescripcion" label="Descripción SEO" defaultValue={room.seoDescripcion ?? ""} rows={2} />
        </div>
      </details>

      <Button type="submit" variant="primary" size="lg" loading={pending}>
        Guardar cambios
      </Button>
    </form>
  );
}
