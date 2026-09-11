import { AdminHeader, Panel, Pill } from "@/components/admin/ui";
import { Button } from "@/components/ui/Button";
import { requireUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { db } from "@/lib/db";
import { guardarPagina, guardarLegal, guardarFaq, eliminarFaq } from "./actions";

export default async function ContenidoPage() {
  const user = await requireUser("contenido");
  const w = can(user.rol, "contenido", "write");
  const [paginas, legales, faqs] = await Promise.all([
    db.sitePage.findMany({ orderBy: { clave: "asc" } }),
    db.legalDoc.findMany({ orderBy: { titulo: "asc" } }),
    db.faqItem.findMany({ orderBy: [{ categoria: "asc" }, { orden: "asc" }] }),
  ]);

  return (
    <>
      <AdminHeader title="Contenido del sitio" subtitle="Páginas editoriales, preguntas frecuentes y documentos legales" />

      <Panel title="Páginas editoriales" className="mb-4">
        <p className="mb-3 text-[11.5px] text-ink-2">
          El contenido de cada página se guarda como JSON. Edita los textos manteniendo la
          estructura de claves.
        </p>
        <div className="space-y-2">
          {paginas.map((p) => (
            <details key={p.clave} className="rounded-md border border-hairline">
              <summary className="cursor-pointer px-3 py-2 text-[12.5px] font-medium text-carbon">
                {p.titulo} <span className="font-normal text-ink-3">· {p.clave}</span>
              </summary>
              <div className="border-t border-hairline p-3">
                {w ? (
                  <form action={guardarPagina} className="space-y-2">
                    <input type="hidden" name="clave" value={p.clave} />
                    <textarea
                      name="contenido"
                      defaultValue={JSON.stringify(p.contenido, null, 2)}
                      rows={12}
                      className="w-full rounded-sm border border-hairline p-2 font-mono text-[11px]"
                    />
                    <Button type="submit" variant="outline" size="sm">
                      Guardar {p.titulo}
                    </Button>
                  </form>
                ) : (
                  <pre className="overflow-x-auto rounded-md bg-marfil p-2 text-[11px]">
                    {JSON.stringify(p.contenido, null, 2)}
                  </pre>
                )}
              </div>
            </details>
          ))}
        </div>
      </Panel>

      <Panel title="Preguntas frecuentes" className="mb-4">
        <div className="space-y-2">
          {faqs.map((f) => (
            <details key={f.id} className="rounded-md border border-hairline">
              <summary className="flex cursor-pointer items-center justify-between gap-3 px-3 py-2 text-[12px]">
                <span>
                  <span className="text-ink-3">{f.categoria}</span> · {f.pregunta}
                </span>
                {!f.publicada && <Pill tone="neutro">oculta</Pill>}
              </summary>
              {w && (
                <form action={guardarFaq} className="space-y-2 border-t border-hairline p-3">
                  <input type="hidden" name="id" value={f.id} />
                  <div className="grid gap-2 sm:grid-cols-2">
                    <input name="categoria" defaultValue={f.categoria} className="rounded-sm border border-hairline px-2 py-1 text-[12px]" />
                    <label className="flex items-center gap-2 text-[12px]">
                      <input type="checkbox" name="publicada" defaultChecked={f.publicada} className="accent-carbon" /> Publicada
                    </label>
                  </div>
                  <input name="pregunta" defaultValue={f.pregunta} className="w-full rounded-sm border border-hairline px-2 py-1 text-[12px]" />
                  <textarea name="respuesta" defaultValue={f.respuesta} rows={3} className="w-full rounded-sm border border-hairline p-2 text-[12px]" />
                  <div className="flex gap-2">
                    <Button type="submit" variant="outline" size="sm">
                      Guardar
                    </Button>
                    <form action={eliminarFaq}>
                      <input type="hidden" name="id" value={f.id} />
                      <Button type="submit" variant="ghost" size="sm">
                        Eliminar
                      </Button>
                    </form>
                  </div>
                </form>
              )}
            </details>
          ))}
        </div>
        {w && (
          <form action={guardarFaq} className="mt-3 space-y-2 border-t border-hairline pt-3">
            <input type="hidden" name="id" value="" />
            <div className="grid gap-2 sm:grid-cols-2">
              <input name="categoria" placeholder="Categoría" required className="rounded-sm border border-hairline px-2 py-1 text-[12px]" />
              <label className="flex items-center gap-2 text-[12px]">
                <input type="checkbox" name="publicada" defaultChecked className="accent-carbon" /> Publicada
              </label>
            </div>
            <input name="pregunta" placeholder="Pregunta" required className="w-full rounded-sm border border-hairline px-2 py-1 text-[12px]" />
            <textarea name="respuesta" placeholder="Respuesta" required rows={3} className="w-full rounded-sm border border-hairline p-2 text-[12px]" />
            <Button type="submit" variant="primary" size="sm">
              Agregar pregunta
            </Button>
          </form>
        )}
      </Panel>

      <Panel title="Documentos legales">
        <div className="space-y-2">
          {legales.map((l) => (
            <details key={l.slug} className="rounded-md border border-hairline">
              <summary className="cursor-pointer px-3 py-2 text-[12.5px] font-medium text-carbon">
                {l.titulo} <span className="font-normal text-ink-3">· v{l.version}</span>
              </summary>
              {w && (
                <form action={guardarLegal} className="space-y-2 border-t border-hairline p-3">
                  <input type="hidden" name="slug" value={l.slug} />
                  <input name="version" defaultValue={l.version} className="w-24 rounded-sm border border-hairline px-2 py-1 text-[12px]" />
                  <textarea name="cuerpo" defaultValue={l.cuerpo} rows={12} className="w-full rounded-sm border border-hairline p-2 font-mono text-[11px]" />
                  <Button type="submit" variant="outline" size="sm">
                    Guardar (markdown)
                  </Button>
                </form>
              )}
            </details>
          ))}
        </div>
      </Panel>
    </>
  );
}
