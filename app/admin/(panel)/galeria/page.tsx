import { AdminHeader, Panel, Pill } from "@/components/admin/ui";
import { Button } from "@/components/ui/Button";
import { ImageSlot } from "@/components/ui/ImageSlot";
import { requireUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { db } from "@/lib/db";
import { agregarImagen, editarImagen, togglePublicada, eliminarImagen } from "./actions";

const CATS = ["habitaciones", "fachada", "comunes", "rooftop", "entorno", "experiencias"];

export default async function GaleriaAdminPage(props: PageProps<"/admin/galeria">) {
  const user = await requireUser("galeria");
  const w = can(user.rol, "galeria", "write");
  const sp = await props.searchParams;
  const cat = typeof sp.cat === "string" ? sp.cat : "";

  const imgs = await db.galleryImage.findMany({
    where: cat ? { categoria: cat } : {},
    orderBy: [{ categoria: "asc" }, { orden: "asc" }],
  });
  const sinAlt = imgs.filter((i) => !i.alt || i.alt.length < 3).length;

  return (
    <>
      <AdminHeader
        title="Galería multimedia"
        subtitle={`${imgs.length} imágenes${cat ? ` en ${cat}` : ""}`}
      />

      {sinAlt > 0 && (
        <p className="mb-4 rounded-md bg-aviso-bg px-3 py-2 text-[12px] text-aviso-fg">
          {sinAlt} imagen(es) sin texto alternativo. La galería no publica una imagen sin
          descripción para lectores de pantalla.
        </p>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        <a
          href="/admin/galeria"
          className={`rounded-pill px-3 py-1 text-[12px] ${!cat ? "bg-carbon text-marfil" : "border border-hairline"}`}
        >
          Todas
        </a>
        {CATS.map((c) => (
          <a
            key={c}
            href={`/admin/galeria?cat=${c}`}
            className={`rounded-pill px-3 py-1 text-[12px] ${cat === c ? "bg-carbon text-marfil" : "border border-hairline"}`}
          >
            {c}
          </a>
        ))}
      </div>

      {w && (
        <Panel title="Agregar imagen" className="mb-4">
          <form action={agregarImagen} className="grid gap-2 sm:grid-cols-2">
            <input name="url" placeholder="URL de la imagen (o vacío por ahora)" className="rounded-sm border border-hairline px-2 py-1.5 text-[12px]" />
            <select name="categoria" defaultValue={cat || "comunes"} className="rounded-sm border border-hairline px-2 py-1.5 text-[12px]">
              {CATS.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <input name="alt" placeholder="Texto alternativo (obligatorio)" required className="rounded-sm border border-hairline px-2 py-1.5 text-[12px]" />
            <input name="pie" placeholder="Pie de foto (opcional)" className="rounded-sm border border-hairline px-2 py-1.5 text-[12px]" />
            <div className="sm:col-span-2">
              <Button type="submit" variant="primary" size="sm">
                Agregar
              </Button>
            </div>
          </form>
        </Panel>
      )}

      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {imgs.map((i) => (
          <div key={i.id} className="rounded-md border border-hairline bg-white p-2">
            <ImageSlot src={i.url} alt={i.alt} ratio="1/1" className="rounded-sm" />
            <div className="mt-2 flex items-center justify-between">
              <span className="text-[10px] text-ink-3">{i.categoria}</span>
              {!i.publicada && <Pill tone="neutro">oculta</Pill>}
            </div>
            {w && (
              <form action={editarImagen} className="mt-1.5 space-y-1">
                <input type="hidden" name="id" value={i.id} />
                <input name="alt" defaultValue={i.alt} className="w-full rounded-sm border border-hairline px-1.5 py-1 text-[10.5px]" />
                <input name="pie" defaultValue={i.pie ?? ""} placeholder="pie" className="w-full rounded-sm border border-hairline px-1.5 py-1 text-[10.5px]" />
                <select name="categoria" defaultValue={i.categoria} className="w-full rounded-sm border border-hairline px-1.5 py-1 text-[10.5px]">
                  {CATS.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
                <div className="flex flex-wrap gap-1 text-[10px]">
                  <button className="rounded-pill border border-hairline px-1.5 py-0.5">Guardar</button>
                </div>
              </form>
            )}
            {w && (
              <div className="mt-1 flex gap-1 text-[10px]">
                <form action={togglePublicada}>
                  <input type="hidden" name="id" value={i.id} />
                  <button className="rounded-pill border border-hairline px-1.5 py-0.5">
                    {i.publicada ? "Ocultar" : "Publicar"}
                  </button>
                </form>
                <form action={eliminarImagen}>
                  <input type="hidden" name="id" value={i.id} />
                  <button className="rounded-pill border border-bugambilia/40 px-1.5 py-0.5 text-error-fg">Eliminar</button>
                </form>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
