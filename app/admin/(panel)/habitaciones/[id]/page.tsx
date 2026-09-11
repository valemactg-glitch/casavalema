import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminHeader, Panel } from "@/components/admin/ui";
import { Button } from "@/components/ui/Button";
import { ImageSlot } from "@/components/ui/ImageSlot";
import { RoomEditor } from "@/components/admin/RoomEditor";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import {
  agregarFoto,
  editarFoto,
  portadaFoto,
  moverFoto,
  eliminarFoto,
  guardarReglas,
} from "../actions";

export default async function RoomEditorPage(props: PageProps<"/admin/habitaciones/[id]">) {
  await requireUser("habitaciones", "write");
  const { id } = await props.params;
  const room = await db.room.findUnique({ where: { id }, include: { images: { orderBy: { orden: "asc" } } } });
  if (!room) notFound();

  const reglas = (room.reglas as { clave: string; valor: string }[]) ?? [];

  return (
    <>
      <AdminHeader
        title={`Editar ${room.nombre}`}
        subtitle={
          <>
            <Link href="/admin/habitaciones" className="hover:text-carbon">
              Habitaciones
            </Link>{" "}
            · <Link href={`/habitaciones/${room.slug}`} className="hover:text-carbon">ver pública</Link>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <RoomEditor
          room={{
            id: room.id,
            nombre: room.nombre,
            descripcionCorta: room.descripcionCorta,
            descripcionLarga: room.descripcionLarga,
            capacidadAdultos: room.capacidadAdultos,
            capacidadNinos: room.capacidadNinos,
            cama: room.cama,
            tamanoM2: room.tamanoM2,
            vista: room.vista,
            ubicacionEnCasa: room.ubicacionEnCasa,
            banoPrivado: room.banoPrivado,
            precioBase: room.precioBase,
            anticipoPct: room.anticipoPct,
            estadiaMin: room.estadiaMin,
            visible: room.visible,
            ventaCerrada: room.ventaCerrada,
            seoTitulo: room.seoTitulo,
            seoDescripcion: room.seoDescripcion,
            servicios: room.servicios,
          }}
        />

        <div className="space-y-4">
          <Panel title="Fotos">
            <ul className="space-y-3">
              {room.images.map((img, i) => (
                <li key={img.id} className="rounded-md border border-hairline p-2">
                  <div className="flex gap-3">
                    <div className="w-20 shrink-0">
                      <ImageSlot src={img.url} alt={img.alt} ratio="1/1" className="rounded-sm" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <form action={editarFoto} className="space-y-1.5">
                        <input type="hidden" name="id" value={img.id} />
                        <input
                          name="alt"
                          defaultValue={img.alt}
                          placeholder="Texto alternativo (obligatorio)"
                          className="w-full rounded-sm border border-hairline px-2 py-1 text-[11.5px]"
                        />
                        <input
                          name="pie"
                          defaultValue={img.pie ?? ""}
                          placeholder="Pie de foto (opcional)"
                          className="w-full rounded-sm border border-hairline px-2 py-1 text-[11.5px]"
                        />
                        <button className="text-[11px] text-oro-texto underline">Guardar texto</button>
                      </form>
                      <div className="flex flex-wrap gap-1.5 text-[10.5px]">
                        {img.portada ? (
                          <span className="rounded-pill bg-oro/20 px-2 py-0.5 font-semibold text-oro-texto">Portada</span>
                        ) : (
                          <form action={portadaFoto}>
                            <input type="hidden" name="id" value={img.id} />
                            <button className="rounded-pill border border-hairline px-2 py-0.5">Hacer portada</button>
                          </form>
                        )}
                        <form action={moverFoto}>
                          <input type="hidden" name="id" value={img.id} />
                          <input type="hidden" name="dir" value="up" />
                          <button disabled={i === 0} className="rounded-pill border border-hairline px-2 py-0.5 disabled:opacity-30">↑</button>
                        </form>
                        <form action={moverFoto}>
                          <input type="hidden" name="id" value={img.id} />
                          <input type="hidden" name="dir" value="down" />
                          <button disabled={i === room.images.length - 1} className="rounded-pill border border-hairline px-2 py-0.5 disabled:opacity-30">↓</button>
                        </form>
                        <form action={eliminarFoto}>
                          <input type="hidden" name="id" value={img.id} />
                          <button className="rounded-pill border border-bugambilia/40 px-2 py-0.5 text-error-fg">Eliminar</button>
                        </form>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <form action={agregarFoto} className="mt-3 space-y-2 border-t border-hairline pt-3">
              <input type="hidden" name="roomId" value={room.id} />
              <input name="url" placeholder="URL de la imagen (o vacío por ahora)" className="w-full rounded-sm border border-hairline px-2 py-1.5 text-[12px]" />
              <input name="alt" placeholder="Texto alternativo (obligatorio para publicar)" required className="w-full rounded-sm border border-hairline px-2 py-1.5 text-[12px]" />
              <Button type="submit" variant="outline" size="sm">
                Agregar foto
              </Button>
            </form>
          </Panel>

          <Panel title="Reglas y políticas">
            <form action={guardarReglas} className="space-y-2">
              <input type="hidden" name="roomId" value={room.id} />
              {[...reglas, { clave: "", valor: "" }, { clave: "", valor: "" }].map((r, i) => (
                <div key={i} className="grid grid-cols-[110px_1fr] gap-1.5">
                  <input name="clave" defaultValue={r.clave} placeholder="Clave" className="rounded-sm border border-hairline px-2 py-1 text-[11.5px]" />
                  <input name="valor" defaultValue={r.valor} placeholder="Valor" className="rounded-sm border border-hairline px-2 py-1 text-[11.5px]" />
                </div>
              ))}
              <Button type="submit" variant="outline" size="sm">
                Guardar reglas
              </Button>
            </form>
          </Panel>
        </div>
      </div>
    </>
  );
}
