import { AdminHeader, Panel, Table, Th, Td, Pill } from "@/components/admin/ui";

import { UsuarioCrearForm } from "@/components/admin/UsuarioCrearForm";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { ROLES, PERMISSION_MATRIX } from "@/lib/auth/rbac";
import { ADMIN_NAV } from "@/lib/admin/nav";
import { formatDateLongEs } from "@/lib/dates";
import { cambiarRol, toggleUsuario, restablecerClave } from "./actions";

export default async function UsuariosPage() {
  await requireUser("usuarios");
  const [users, actividad] = await Promise.all([
    db.user.findMany({ orderBy: { createdAt: "asc" } }),
    db.activityLog.findMany({ orderBy: { createdAt: "desc" }, take: 40 }),
  ]);

  const modulos = ADMIN_NAV.filter((m) => m.modulo !== "dashboard");

  return (
    <>
      <AdminHeader title="Usuarios, roles y seguridad" subtitle={`${users.length} usuarios`} />

      <Panel title="Usuarios" className="mb-4">
        <Table className="min-w-[620px]">
          <thead>
            <tr>
              <Th>Usuario</Th>
              <Th>Rol</Th>
              <Th>Último acceso</Th>
              <Th>Estado</Th>
              <Th>Acciones</Th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <Td>
                  <span className="font-medium">{u.nombre}</span>
                  <span className="block text-[11px] text-ink-3">{u.email}</span>
                </Td>
                <Td>
                  <form action={cambiarRol} className="flex items-center gap-1">
                    <input type="hidden" name="id" value={u.id} />
                    <select name="rol" defaultValue={u.rol} className="rounded-sm border border-hairline px-1.5 py-1 text-[11px]">
                      {ROLES.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                    <button className="text-[10.5px] underline">Cambiar</button>
                  </form>
                </Td>
                <Td>{u.ultimoAcceso ? formatDateLongEs(u.ultimoAcceso) : "nunca"}</Td>
                <Td>
                  <Pill tone={u.activo ? "exito" : "neutro"}>{u.activo ? "activo" : "inactivo"}</Pill>
                </Td>
                <Td>
                  <div className="flex flex-wrap gap-1.5 text-[10.5px]">
                    <form action={toggleUsuario}>
                      <input type="hidden" name="id" value={u.id} />
                      <button className="rounded-pill border border-hairline px-2 py-0.5">
                        {u.activo ? "Desactivar" : "Activar"}
                      </button>
                    </form>
                    <form action={restablecerClave} className="flex gap-1">
                      <input type="hidden" name="id" value={u.id} />
                      <input name="password" placeholder="nueva clave" className="w-24 rounded-sm border border-hairline px-1.5 py-0.5" />
                      <button className="rounded-pill border border-hairline px-2 py-0.5">Restablecer</button>
                    </form>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Panel>

      <Panel title="Crear usuario" className="mb-4">
        <UsuarioCrearForm />
      </Panel>

      <Panel title="Matriz de permisos" className="mb-4">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-[11px]">
            <thead>
              <tr>
                <th className="border-b border-hairline pb-2 text-left text-ink-3">Módulo</th>
                {ROLES.map((r) => (
                  <th key={r.value} className="border-b border-hairline pb-2 text-center text-ink-3">
                    {r.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {modulos.map((m) => (
                <tr key={m.modulo}>
                  <td className="border-b border-hairline/70 py-1.5 text-carbon">{m.label}</td>
                  {ROLES.map((r) => {
                    const nivel = PERMISSION_MATRIX[m.modulo][r.value];
                    return (
                      <td key={r.value} className="border-b border-hairline/70 py-1.5 text-center">
                        {nivel === "write" ? (
                          <span className="text-exito-fg">editar</span>
                        ) : nivel === "read" ? (
                          <span className="text-ink-3">ver</span>
                        ) : (
                          <span className="text-ink-muted">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[10.5px] text-ink-3">
          Los permisos vienen definidos por rol. Para cambiarlos se ajusta la matriz en el
          código (`lib/auth/rbac.ts`).
        </p>
      </Panel>

      <Panel title="Registro de actividad">
        <ol className="space-y-1 text-[11.5px] text-ink-3">
          {actividad.map((a) => (
            <li key={a.id}>
              <span className="text-carbon">{a.actorNombre}</span> · {a.accion}
              {a.entidad ? ` · ${a.entidad}` : ""}
              {a.detalle ? ` · ${a.detalle}` : ""} · {formatDateLongEs(a.createdAt)}
            </li>
          ))}
        </ol>
      </Panel>
    </>
  );
}
