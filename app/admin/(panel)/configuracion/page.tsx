import { AdminHeader, Panel } from "@/components/admin/ui";
import { Button } from "@/components/ui/Button";
import { requireUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { db } from "@/lib/db";
import { guardarConfig } from "./actions";

type Campo = { name: string; label: string; type?: string; placeholder?: string };
type Grupo = { grupo: string; titulo: string; campos: Campo[] };

const GRUPOS: Grupo[] = [
  {
    grupo: "alojamiento",
    titulo: "Datos del alojamiento",
    campos: [
      { name: "nombre", label: "Nombre" },
      { name: "ciudad", label: "Ciudad" },
      { name: "zonaHoraria", label: "Zona horaria" },
      { name: "moneda", label: "Moneda" },
      { name: "checkIn", label: "Check-in" },
      { name: "checkOut", label: "Check-out" },
      { name: "capacidadTotal", label: "Capacidad total", type: "number" },
    ],
  },
  {
    grupo: "pagos",
    titulo: "Pagos y pasarela",
    campos: [
      { name: "proveedor", label: "Proveedor (mock | wompi | mercadopago)" },
      { name: "anticipoPct", label: "Anticipo por defecto (%)", type: "number" },
      { name: "cuentaBancaria", label: "Datos de la cuenta bancaria (transferencias)" },
    ],
  },
  {
    grupo: "integraciones",
    titulo: "Integraciones Airbnb / iCal",
    campos: [
      { name: "frecuenciaSyncHoras", label: "Frecuencia de sincronización automática (horas)", type: "number" },
      { name: "notaConflictos", label: "Correo para alertas de conflicto" },
    ],
  },
  {
    grupo: "contacto",
    titulo: "Contacto y redes",
    campos: [
      { name: "telefono", label: "Teléfono" },
      { name: "whatsapp", label: "WhatsApp (con indicativo, sin +)" },
      { name: "correo", label: "Correo" },
      { name: "instagram", label: "Instagram (usuario)" },
    ],
  },
  {
    grupo: "legal",
    titulo: "Impuestos y datos legales",
    campos: [
      { name: "razonSocial", label: "Razón social" },
      { name: "nit", label: "NIT" },
      { name: "rnt", label: "Registro Nacional de Turismo" },
      { name: "regimen", label: "Régimen tributario" },
    ],
  },
  {
    grupo: "privacidad",
    titulo: "Sitio y privacidad",
    campos: [
      { name: "mostrarDireccionAntesDeReservar", label: "Mostrar la dirección exacta antes de reservar", type: "checkbox" },
      { name: "dominio", label: "Dominio" },
      { name: "analitica", label: "ID de analítica" },
    ],
  },
];

export default async function ConfiguracionPage() {
  const user = await requireUser("configuracion");
  const w = can(user.rol, "configuracion", "write");
  const setting = await db.setting.findUnique({ where: { id: 1 } });
  const data = (setting?.data as Record<string, Record<string, unknown>>) ?? {};

  return (
    <>
      <AdminHeader title="Configuración" subtitle="Estos valores alimentan el sitio público y el motor de reservas" />
      {!w && (
        <p className="mb-4 rounded-md bg-neutro-bg px-3 py-2 text-[11.5px] text-neutro-fg">
          Sólo el propietario puede modificar la configuración.
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {GRUPOS.map((g) => {
          const valores = data[g.grupo] ?? {};
          return (
            <Panel key={g.grupo} title={g.titulo}>
              <form action={guardarConfig} className="space-y-2.5">
                <input type="hidden" name="__grupo" value={g.grupo} />
                {g.campos.map((c) => (
                  <label key={c.name} className="block text-[11px] font-medium text-ink-2">
                    {c.label}
                    {c.type === "checkbox" ? (
                      <input
                        type="checkbox"
                        name={c.name}
                        defaultChecked={!!valores[c.name]}
                        disabled={!w}
                        className="ml-2 accent-carbon"
                      />
                    ) : (
                      <input
                        name={c.name}
                        type={c.type ?? "text"}
                        defaultValue={String(valores[c.name] ?? "")}
                        disabled={!w}
                        className="mt-1 block h-9 w-full rounded-sm border border-hairline px-2 text-[12px] disabled:bg-neutro-bg/40"
                      />
                    )}
                  </label>
                ))}
                {w && (
                  <Button type="submit" variant="outline" size="sm">
                    Guardar {g.titulo.toLowerCase()}
                  </Button>
                )}
              </form>
            </Panel>
          );
        })}
      </div>

      <p className="mt-4 text-[11px] text-ink-3">
        La dirección exacta, los datos bancarios y las llaves de la pasarela se guardan
        aquí; algunos requieren rol de propietario para verse.
      </p>
    </>
  );
}
