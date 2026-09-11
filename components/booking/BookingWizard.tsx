"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { clsx } from "clsx";
import { Button } from "@/components/ui/Button";
import { Field, SelectField, TextareaField, CheckboxField } from "@/components/ui/Field";
import { Callout } from "@/components/ui/Callout";
import { BookingSummary, type SummaryServicio } from "./BookingSummary";
import { HoldTimer } from "./HoldTimer";
import { formatCOP } from "@/lib/format";
import { formatRangeEs, nightsLabel, parseISODate } from "@/lib/dates";
import { cobroLabel } from "@/lib/booking/pricing";
import type { ClientPlan, ClientQuote } from "@/lib/booking/clientQuote";
import { DOC_TIPOS } from "@/lib/catalog";

const PASOS = ["Fechas", "Habitación", "Servicios", "Datos", "Revisión", "Pago", "Listo"];

export type WizardServicio = {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  tipoCobro: string;
  disponibilidad: string;
};

export type WizardProps = {
  habitacion: { slug: string; nombre: string; capacidadAdultos: number; capacidadNinos: number };
  quotes: Record<string, ClientQuote>;
  disponible: boolean;
  motivoNoDisponible?: string;
  ratePlans: ClientPlan[];
  servicios: WizardServicio[];
  defaults: { llegada: string; salida: string; adultos: number; ninos: number; planId: string };
};

type GuestForm = {
  nombre: string;
  apellidos: string;
  docTipo: string;
  docNumero: string;
  pais: string;
  ciudad: string;
  telefono: string;
  correo: string;
};

const emptyGuest: GuestForm = {
  nombre: "",
  apellidos: "",
  docTipo: "CC",
  pais: "Colombia",
  docNumero: "",
  ciudad: "",
  telefono: "",
  correo: "",
};

export function BookingWizard({
  habitacion,
  quotes,
  disponible,
  motivoNoDisponible,
  ratePlans,
  servicios,
  defaults,
}: WizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(2); // 2=Servicios … 5=Pago
  const [planId, setPlanId] = useState(defaults.planId || ratePlans[0]?.id || "");
  const [cantidades, setCantidades] = useState<Record<string, number>>({});
  const [guest, setGuest] = useState<GuestForm>(emptyGuest);
  const [horaLlegada, setHoraLlegada] = useState("");
  const [solicitudes, setSolicitudes] = useState("");
  const [reservaParaOtro, setReservaParaOtro] = useState(false);
  const [facturar, setFacturar] = useState(false);
  const [factura, setFactura] = useState({ razonSocial: "", nit: "", direccion: "" });
  const [consent, setConsent] = useState({ politicas: false, datos: false, comunicaciones: false });

  const [holdExpira, setHoldExpira] = useState<string | null>(null);
  const [holdError, setHoldError] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [gestionToken, setGestionToken] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const plan = ratePlans.find((p) => p.id === planId) ?? ratePlans[0] ?? null;
  const quote: ClientQuote | null = (plan && quotes[plan.id]) ?? null;

  const summaryServicios: SummaryServicio[] = useMemo(
    () =>
      servicios
        .filter((s) => cantidades[s.id] > 0 || s.disponibilidad === "BAJO_SOLICITUD" && cantidades[s.id] > 0)
        .map((s) => {
          const cant = cantidades[s.id] ?? 0;
          const bajoSolicitud = s.disponibilidad === "BAJO_SOLICITUD" || s.precio === 0;
          const noches = quote?.noches ?? 1;
          let unidades = cant;
          let subtotal = 0;
          if (!bajoSolicitud) {
            if (s.tipoCobro === "POR_NOCHE") {
              unidades = noches;
              subtotal = s.precio * noches;
            } else if (s.tipoCobro === "POR_HUESPED") {
              unidades = cant * noches;
              subtotal = s.precio * cant * noches;
            } else if (s.tipoCobro === "POR_HABITACION") {
              unidades = 1;
              subtotal = s.precio;
            } else {
              unidades = 1;
              subtotal = s.precio;
            }
          }
          return {
            id: s.id,
            nombre: s.nombre,
            precio: s.precio,
            tipoCobro: s.tipoCobro,
            cantidad: unidades,
            subtotal,
            bajoSolicitud,
          };
        }),
    [servicios, cantidades, quote],
  );

  // Crear / renovar la retención al entrar al flujo.
  const holdOnce = useRef(false);
  useEffect(() => {
    if (holdOnce.current) return;
    holdOnce.current = true;
    void renovarHold();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function renovarHold(): Promise<boolean> {
    setHoldError(null);
    try {
      const res = await fetch("/api/holds", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          habitacion: habitacion.slug,
          llegada: defaults.llegada,
          salida: defaults.salida,
          adultos: defaults.adultos,
          ninos: defaults.ninos,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setHoldError(data.message ?? "No pudimos apartar la habitación.");
        return false;
      }
      setHoldExpira(data.expiraEn);
      return true;
    } catch {
      setHoldError("Problema de conexión al apartar la habitación.");
      return false;
    }
  }

  function servicioBadge(s: WizardServicio) {
    if (s.disponibilidad === "BAJO_SOLICITUD") return "bajo solicitud";
    return `${formatCOP(s.precio)} · ${cobroLabel(s.tipoCobro)}`;
  }

  function validarDatos(): boolean {
    const fe: Record<string, string> = {};
    if (guest.nombre.trim().length < 2) fe.nombre = "Escribe tu nombre.";
    if (guest.apellidos.trim().length < 2) fe.apellidos = "Escribe tus apellidos.";
    if (!/^[0-9A-Za-z-]{4,}$/.test(guest.docNumero.trim()))
      fe.docNumero = "Escribe el número completo, sin puntos.";
    if (guest.telefono.trim().length < 7) fe.telefono = "Escribe un teléfono válido.";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(guest.correo.trim())) fe.correo = "Escribe un correo válido.";
    if (!consent.politicas) fe.politicas = "Debes aceptar las políticas.";
    if (!consent.datos) fe.datos = "Necesitamos tu autorización de datos.";
    setFieldErrors(fe);
    return Object.keys(fe).length === 0;
  }

  async function crearReserva(): Promise<boolean> {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          habitacion: habitacion.slug,
          llegada: defaults.llegada,
          salida: defaults.salida,
          adultos: defaults.adultos,
          ninos: defaults.ninos,
          planId,
          servicios: Object.entries(cantidades)
            .filter(([, c]) => c > 0)
            .map(([serviceId, cantidad]) => ({ serviceId, cantidad })),
          guest: { ...guest, ciudad: guest.ciudad || undefined },
          companions: [],
          horaLlegada,
          solicitudes,
          reservaParaOtro,
          facturacion: facturar ? factura : undefined,
          consentimientos: {
            politicas: consent.politicas,
            datos: consent.datos,
            comunicaciones: consent.comunicaciones,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        if (data.reason && ["no_disponible", "estadia_minima", "anticipacion"].includes(data.reason)) {
          setHoldError(data.message);
        }
        setError(data.message ?? "No pudimos crear la reserva.");
        setFieldErrors(data.fieldErrors ?? {});
        return false;
      }
      setBookingId(data.bookingId);
      setGestionToken(data.gestionToken ?? null);
      return true;
    } catch {
      setError("Problema de conexión. Intenta de nuevo.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function pagar(metodo: "TARJETA" | "PSE" | "TRANSFERENCIA", modalidad: "anticipo" | "total") {
    if (!bookingId) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/payments`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ metodo, modalidad }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.message ?? "No se pudo procesar el pago.");
        return;
      }
      const estado =
        data.estado === "APROBADO" ? "aprobado" : data.estado === "PENDIENTE" ? "pendiente" : "rechazado";
      if (estado === "rechazado") {
        setError("El pago fue rechazado. Puedes intentar con otro método o tarjeta.");
        return;
      }
      const t = gestionToken ? `&t=${gestionToken}` : "";
      router.push(`/reserva/${data.codigo}?ref=${data.referencia}&estado=${estado}${t}`);
    } catch {
      setError("Problema de conexión con la pasarela.");
    } finally {
      setBusy(false);
    }
  }

  const capacidadOk =
    defaults.adultos <= habitacion.capacidadAdultos && defaults.ninos <= habitacion.capacidadNinos;
  const fechasOk = disponible && !!quote && quote.todasDisponibles && quote.noches >= quote.minStay;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div>
        <Progreso step={step} />

        {holdError && (
          <Callout tone="error" role="alert" className="mt-4" title="Se liberó la habitación">
            {holdError}{" "}
            <Link href={`/habitaciones?llegada=${defaults.llegada}&salida=${defaults.salida}&adultos=${defaults.adultos}&ninos=${defaults.ninos}`}>
              Volver a buscar disponibilidad
            </Link>
            .
          </Callout>
        )}
        {error && !holdError && (
          <Callout tone="error" role="alert" className="mt-4">
            {error}
          </Callout>
        )}
        {!fechasOk && !holdError && (
          <Callout tone="aviso" className="mt-4">
            {motivoNoDisponible ??
              "Estas fechas ya no cumplen las condiciones de la habitación."}{" "}
            <Link href={`/habitaciones/${habitacion.slug}`}>Elige otras fechas</Link>.
          </Callout>
        )}

        {ratePlans.length > 1 && step < 5 && (
          <fieldset className="mt-5 rounded-lg border border-hairline bg-white p-3">
            <legend className="px-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-3">
              Tu tarifa
            </legend>
            <div className="mt-1 grid gap-2 sm:grid-cols-2">
              {ratePlans.map((p) => {
                const q = quotes[p.id];
                return (
                  <label
                    key={p.id}
                    className={clsx(
                      "flex cursor-pointer items-start gap-2 rounded-md border p-2.5 text-[12px]",
                      planId === p.id ? "border-oro bg-oro/[0.06]" : "border-hairline",
                    )}
                  >
                    <input
                      type="radio"
                      name="wizard-plan"
                      checked={planId === p.id}
                      onChange={() => setPlanId(p.id)}
                      className="mt-0.5 accent-carbon"
                    />
                    <span>
                      <span className="font-medium text-carbon">{p.nombre}</span>
                      {p.descuentoPct > 0 && <span className="ml-1 text-oro-texto">−{p.descuentoPct}%</span>}
                      <span className="block text-[11px] leading-snug text-ink-3">
                        {p.reembolsable ? "Cancelación flexible" : "Sin cambios ni reembolsos"}
                        {q ? ` · ${formatCOP(q.total)}` : ""}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        )}

        <div className="mt-6">
          {step === 2 && (
            <StepServicios
              servicios={servicios}
              cantidades={cantidades}
              setCantidades={setCantidades}
              badge={servicioBadge}
            />
          )}
          {step === 3 && (
            <StepDatos
              guest={guest}
              setGuest={setGuest}
              horaLlegada={horaLlegada}
              setHoraLlegada={setHoraLlegada}
              solicitudes={solicitudes}
              setSolicitudes={setSolicitudes}
              reservaParaOtro={reservaParaOtro}
              setReservaParaOtro={setReservaParaOtro}
              facturar={facturar}
              setFacturar={setFacturar}
              factura={factura}
              setFactura={setFactura}
              consent={consent}
              setConsent={setConsent}
              errors={fieldErrors}
            />
          )}
          {step === 4 && (
            <StepRevision
              habitacion={habitacion}
              defaults={defaults}
              quote={quote}
              plan={plan}
              servicios={summaryServicios}
              guest={guest}
              holdExpira={holdExpira}
              onExpire={renovarHold}
            />
          )}
          {step === 5 && (
            <StepPago
              quote={quote}
              plan={plan}
              serviciosTotal={summaryServicios.filter((s) => !s.bajoSolicitud).reduce((a, x) => a + x.subtotal, 0)}
              busy={busy}
              onPagar={pagar}
              holdExpira={holdExpira}
              onExpire={renovarHold}
            />
          )}
        </div>

        <div className="mt-8 flex items-center justify-between border-t border-hairline pt-4">
          <button
            onClick={() => setStep((s) => Math.max(2, s - 1))}
            disabled={step === 2}
            className="text-[13px] font-medium text-ink-2 hover:text-carbon disabled:opacity-40"
          >
            ← Atrás
          </button>
          {step < 5 && (
            <Button
              variant="primary"
              size="lg"
              loading={busy}
              disabled={!fechasOk || !capacidadOk}
              onClick={async () => {
                if (step === 2) {
                  setStep(3);
                } else if (step === 3) {
                  if (!validarDatos()) return;
                  const ok = await renovarHold();
                  if (ok) setStep(4);
                } else if (step === 4) {
                  const ok = await crearReserva();
                  if (ok) setStep(5);
                }
              }}
            >
              {step === 4 ? "Ir al pago" : "Continuar"}
            </Button>
          )}
        </div>
      </div>

      <aside className="lg:sticky lg:top-20 lg:self-start">
        <BookingSummary
          nombre={habitacion.nombre}
          llegada={defaults.llegada}
          salida={defaults.salida}
          adultos={defaults.adultos}
          ninos={defaults.ninos}
          quote={quote}
          servicios={summaryServicios}
          planNombre={plan?.nombre ?? ""}
          reembolsable={plan?.reembolsable ?? true}
          anticipoPct={plan?.anticipoPct ?? 30}
        />
        {holdExpira && step >= 3 && (
          <div className="mt-3 rounded-md bg-pendiente-bg px-3.5 py-2.5 text-[12px] text-pendiente-fg">
            Apartamos la habitación por tiempo limitado.{" "}
            <HoldTimer expiraEn={holdExpira} onExpire={renovarHold} inline />
          </div>
        )}
        <p className="mt-3 px-1 text-[11px] leading-relaxed text-ink-3">
          El total no cambia entre esta pantalla y el pago. Impuestos y cargos ya
          incluidos.
        </p>
      </aside>
    </div>
  );
}

function Progreso({ step }: { step: number }) {
  return (
    <div>
      <ol className="flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
        {PASOS.map((p, i) => (
          <li
            key={p}
            className={clsx(
              "flex items-center gap-1.5",
              i < step ? "text-oro-texto" : i === step ? "font-semibold text-carbon" : "text-ink-3",
            )}
          >
            <span
              className={clsx(
                "grid size-4 place-items-center rounded-pill text-[9px]",
                i < step ? "bg-oro text-carbon" : i === step ? "bg-carbon text-marfil" : "bg-neutro-bg text-ink-3",
              )}
            >
              {i < step ? "✓" : i + 1}
            </span>
            {p}
          </li>
        ))}
      </ol>
      <div className="mt-2 flex gap-1">
        {PASOS.map((_, i) => (
          <span
            key={i}
            className={clsx(
              "h-1 flex-1 rounded-pill",
              i < step ? "bg-oro" : i === step ? "bg-carbon" : "bg-[#dfddd3]",
            )}
          />
        ))}
      </div>
    </div>
  );
}

// ── Paso 3: Servicios ──────────────────────────────────────────
function StepServicios({
  servicios,
  cantidades,
  setCantidades,
  badge,
}: {
  servicios: WizardServicio[];
  cantidades: Record<string, number>;
  setCantidades: (fn: (c: Record<string, number>) => Record<string, number>) => void;
  badge: (s: WizardServicio) => string;
}) {
  return (
    <section>
      <h2 className="text-[19px]">Servicios adicionales</h2>
      <p className="mt-1 text-[12.5px] text-ink-3">
        Opcional. También puedes agregarlos después desde “Mi reserva”.
      </p>
      <ul className="mt-5 space-y-3">
        {servicios.map((s) => {
          const cant = cantidades[s.id] ?? 0;
          const porHuesped = s.tipoCobro === "POR_HUESPED";
          return (
            <li
              key={s.id}
              className={clsx(
                "rounded-lg border p-4",
                cant > 0 ? "border-oro bg-oro/[0.05]" : "border-hairline bg-white",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <label className="flex flex-1 items-start gap-3">
                  <input
                    type="checkbox"
                    checked={cant > 0}
                    onChange={(e) =>
                      setCantidades((c) => ({ ...c, [s.id]: e.target.checked ? 1 : 0 }))
                    }
                    className="mt-0.5 size-4 accent-carbon"
                  />
                  <span>
                    <span className="text-[14px] font-medium text-carbon">{s.nombre}</span>
                    <span className="block text-[12px] leading-relaxed text-ink-2">{s.descripcion}</span>
                    <span className="mt-1 block text-[11.5px] text-ink-3">{badge(s)}</span>
                  </span>
                </label>
                {cant > 0 && porHuesped && (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setCantidades((c) => ({ ...c, [s.id]: Math.max(1, cant - 1) }))}
                      className="grid size-7 place-items-center rounded-pill border border-hairline"
                      aria-label="Menos"
                    >
                      −
                    </button>
                    <span className="w-5 text-center text-[13px]">{cant}</span>
                    <button
                      type="button"
                      onClick={() => setCantidades((c) => ({ ...c, [s.id]: cant + 1 }))}
                      className="grid size-7 place-items-center rounded-pill border border-hairline"
                      aria-label="Más"
                    >
                      +
                    </button>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// ── Paso 4: Datos ──────────────────────────────────────────────
type SetState<T> = (v: T | ((prev: T) => T)) => void;

function StepDatos({
  guest,
  setGuest,
  horaLlegada,
  setHoraLlegada,
  solicitudes,
  setSolicitudes,
  reservaParaOtro,
  setReservaParaOtro,
  facturar,
  setFacturar,
  factura,
  setFactura,
  consent,
  setConsent,
  errors,
}: {
  guest: GuestForm;
  setGuest: SetState<GuestForm>;
  horaLlegada: string;
  setHoraLlegada: (v: string) => void;
  solicitudes: string;
  setSolicitudes: (v: string) => void;
  reservaParaOtro: boolean;
  setReservaParaOtro: (v: boolean) => void;
  facturar: boolean;
  setFacturar: (v: boolean) => void;
  factura: { razonSocial: string; nit: string; direccion: string };
  setFactura: SetState<{ razonSocial: string; nit: string; direccion: string }>;
  consent: { politicas: boolean; datos: boolean; comunicaciones: boolean };
  setConsent: SetState<{ politicas: boolean; datos: boolean; comunicaciones: boolean }>;
  errors: Record<string, string>;
}) {
  const u = (k: keyof GuestForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setGuest((g) => ({ ...g, [k]: e.target.value }));

  return (
    <section className="space-y-4">
      <h2 className="text-[19px]">Tus datos</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="nombre" label="Nombre" required value={guest.nombre} onChange={u("nombre")} error={errors.nombre} autoComplete="given-name" />
        <Field name="apellidos" label="Apellidos" required value={guest.apellidos} onChange={u("apellidos")} error={errors.apellidos} autoComplete="family-name" />
      </div>
      <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
        <SelectField name="docTipo" label="Documento" value={guest.docTipo} onChange={u("docTipo")}>
          {DOC_TIPOS.map((d) => (
            <option key={d.value} value={d.value}>
              {d.value}
            </option>
          ))}
        </SelectField>
        <Field
          name="docNumero"
          label="Número de documento"
          required
          value={guest.docNumero}
          onChange={u("docNumero")}
          error={errors.docNumero}
          inputMode="numeric"
          autoComplete="off"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="pais" label="País" required value={guest.pais} onChange={u("pais")} autoComplete="country-name" />
        <Field name="ciudad" label="Ciudad (opcional)" value={guest.ciudad} onChange={u("ciudad")} autoComplete="address-level2" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="telefono" label="Teléfono" type="tel" required value={guest.telefono} onChange={u("telefono")} error={errors.telefono} autoComplete="tel" />
        <Field name="correo" label="Correo" type="email" required value={guest.correo} onChange={u("correo")} error={errors.correo} autoComplete="email" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="horaLlegada" label="Hora aproximada de llegada (opcional)" type="time" value={horaLlegada} onChange={(e) => setHoraLlegada(e.target.value)} />
      </div>
      <TextareaField
        name="solicitudes"
        label="Solicitudes especiales (opcional)"
        rows={3}
        value={solicitudes}
        onChange={(e) => setSolicitudes(e.target.value)}
        placeholder="Cama extra, alergias, celebración…"
      />

      <CheckboxField
        name="reservaParaOtro"
        label="Estoy reservando para otra persona"
        checked={reservaParaOtro}
        onChange={(e) => setReservaParaOtro(e.target.checked)}
      />
      <CheckboxField
        name="facturar"
        label="Necesito factura con datos tributarios"
        checked={facturar}
        onChange={(e) => setFacturar(e.target.checked)}
      />
      {facturar && (
        <div className="grid gap-3 rounded-md bg-marfil p-4 sm:grid-cols-2">
          <Field name="razonSocial" label="Razón social" value={factura.razonSocial} onChange={(e) => setFactura((f) => ({ ...f, razonSocial: e.target.value }))} />
          <Field name="nit" label="NIT / documento" value={factura.nit} onChange={(e) => setFactura((f) => ({ ...f, nit: e.target.value }))} />
          <Field name="direccion" label="Dirección (opcional)" wrapClassName="sm:col-span-2" value={factura.direccion} onChange={(e) => setFactura((f) => ({ ...f, direccion: e.target.value }))} />
        </div>
      )}

      <div className="space-y-2 border-t border-hairline pt-4">
        <CheckboxField
          name="politicas"
          label={
            <>
              He leído y acepto la{" "}
              <Link href="/legales/politica-de-reservas" className="underline" target="_blank">
                política de reservas
              </Link>{" "}
              y la{" "}
              <Link href="/legales/politica-de-cancelaciones" className="underline" target="_blank">
                de cancelaciones
              </Link>
              .
            </>
          }
          checked={consent.politicas}
          onChange={(e) => setConsent((c) => ({ ...c, politicas: e.target.checked }))}
          error={errors.politicas}
        />
        <CheckboxField
          name="datos"
          label={
            <>
              Autorizo el tratamiento de mis datos según la{" "}
              <Link href="/legales/tratamiento-de-datos" className="underline" target="_blank">
                política de datos
              </Link>
              .
            </>
          }
          checked={consent.datos}
          onChange={(e) => setConsent((c) => ({ ...c, datos: e.target.checked }))}
          error={errors.datos}
        />
        <CheckboxField
          name="comunicaciones"
          label="Quiero recibir novedades y ofertas de Valema (opcional)"
          checked={consent.comunicaciones}
          onChange={(e) => setConsent((c) => ({ ...c, comunicaciones: e.target.checked }))}
        />
      </div>
    </section>
  );
}

// ── Paso 5: Revisión ───────────────────────────────────────────
function StepRevision({
  habitacion,
  defaults,
  quote,
  plan,
  servicios,
  guest,
  holdExpira,
  onExpire,
}: {
  habitacion: WizardProps["habitacion"];
  defaults: WizardProps["defaults"];
  quote: ClientQuote | null;
  plan: ClientPlan | null;
  servicios: SummaryServicio[];
  guest: GuestForm;
  holdExpira: string | null;
  onExpire: () => Promise<boolean>;
}) {
  const l = parseISODate(defaults.llegada);
  const s = parseISODate(defaults.salida);
  return (
    <section className="space-y-5">
      <h2 className="text-[19px]">Revisa tu reserva</h2>

      {holdExpira && (
        <Callout tone="aviso">
          Tienes esta habitación apartada.{" "}
          <HoldTimer expiraEn={holdExpira} onExpire={onExpire} inline /> para completar el pago.
        </Callout>
      )}

      <dl className="divide-y divide-hairline rounded-lg border border-hairline bg-white text-[13px]">
        {[
          ["Habitación", habitacion.nombre],
          ["Fechas", l && s ? formatRangeEs(l, s) : "—"],
          ["Noches", quote ? nightsLabel(quote.noches) : "—"],
          ["Huéspedes", `${defaults.adultos} adultos${defaults.ninos ? `, ${defaults.ninos} niños` : ""}`],
          ["Tarifa", `${plan?.nombre ?? ""} · ${plan?.reembolsable ? "reembolsable" : "no reembolsable"}`],
          ["Titular", `${guest.nombre} ${guest.apellidos}`.trim() || "—"],
          ["Contacto", [guest.correo, guest.telefono].filter(Boolean).join(" · ") || "—"],
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 px-4 py-2.5">
            <dt className="text-ink-3">{k}</dt>
            <dd className="text-right font-medium text-carbon">{v}</dd>
          </div>
        ))}
        {servicios.length > 0 && (
          <div className="px-4 py-2.5">
            <dt className="text-ink-3">Servicios</dt>
            <dd className="mt-1 space-y-1">
              {servicios.map((x) => (
                <div key={x.id} className="flex justify-between text-[12.5px]">
                  <span>
                    {x.nombre} <span className="text-ink-3">{cobroLabel(x.tipoCobro)}</span>
                  </span>
                  <span>{x.bajoSolicitud ? "Bajo solicitud" : formatCOP(x.subtotal)}</span>
                </div>
              ))}
            </dd>
          </div>
        )}
      </dl>

      <p className="text-[12px] leading-relaxed text-ink-3">
        {plan?.politicaCancelacion}
      </p>
    </section>
  );
}

// ── Paso 6: Pago ───────────────────────────────────────────────
function StepPago({
  quote,
  plan,
  serviciosTotal,
  busy,
  onPagar,
  holdExpira,
  onExpire,
}: {
  quote: ClientQuote | null;
  plan: ClientPlan | null;
  serviciosTotal: number;
  busy: boolean;
  onPagar: (m: "TARJETA" | "PSE" | "TRANSFERENCIA", mod: "anticipo" | "total") => void;
  holdExpira: string | null;
  onExpire: () => Promise<boolean>;
}) {
  const [metodo, setMetodo] = useState<"TARJETA" | "PSE" | "TRANSFERENCIA">("TARJETA");
  const [modalidad, setModalidad] = useState<"anticipo" | "total">("anticipo");

  const total = (quote?.total ?? 0) + serviciosTotal;
  const pct = plan ? (plan.reembolsable ? plan.anticipoPct : 100) : 30;
  const anticipo = pct >= 100 ? total : Math.round((total * pct) / 100 / 100) * 100;
  const aPagar = modalidad === "total" || pct >= 100 ? total : anticipo;

  return (
    <section className="space-y-5">
      <h2 className="text-[19px]">Pago</h2>

      {holdExpira && (
        <Callout tone="aviso">
          <HoldTimer expiraEn={holdExpira} onExpire={onExpire} inline /> para completar el pago
          antes de que se libere la habitación.
        </Callout>
      )}

      <fieldset>
        <legend className="text-[13px] font-medium text-carbon">Método de pago</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          {[
            ["TARJETA", "Tarjeta", "Débito o crédito"],
            ["PSE", "PSE", "Débito desde tu banco"],
            ["TRANSFERENCIA", "Transferencia", "Con verificación manual"],
          ].map(([v, t, d]) => (
            <label
              key={v}
              className={clsx(
                "cursor-pointer rounded-lg border p-3 text-[12.5px]",
                metodo === v ? "border-oro bg-oro/[0.06]" : "border-hairline bg-white",
              )}
            >
              <input
                type="radio"
                name="metodo"
                className="sr-only"
                checked={metodo === v}
                onChange={() => setMetodo(v as typeof metodo)}
              />
              <span className="font-medium text-carbon">{t}</span>
              <span className="block text-[11px] text-ink-3">{d}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {pct < 100 && (
        <fieldset>
          <legend className="text-[13px] font-medium text-carbon">¿Cuánto quieres pagar ahora?</legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {[
              ["anticipo", `Anticipo ${pct} %`, formatCOP(anticipo)],
              ["total", "Pago total", formatCOP(total)],
            ].map(([v, t, monto]) => (
              <label
                key={v}
                className={clsx(
                  "flex cursor-pointer items-center justify-between rounded-lg border p-3 text-[12.5px]",
                  modalidad === v ? "border-oro bg-oro/[0.06]" : "border-hairline bg-white",
                )}
              >
                <span className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="modalidad"
                    checked={modalidad === v}
                    onChange={() => setModalidad(v as typeof modalidad)}
                    className="accent-carbon"
                  />
                  {t}
                </span>
                <span className="font-medium text-carbon">{monto}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {metodo === "TRANSFERENCIA" && (
        <Callout tone="info">
          Al continuar, te mostramos los datos bancarios. La reserva queda pendiente hasta
          que verifiquemos la transferencia, normalmente en menos de 12 horas. Mientras
          tanto, mantenemos tus fechas apartadas.
        </Callout>
      )}

      <div className="rounded-lg bg-marfil p-4">
        <div className="flex items-center justify-between text-[14px] font-semibold text-carbon">
          <span>A pagar ahora</span>
          <span>{formatCOP(metodo === "TRANSFERENCIA" ? aPagar : aPagar)}</span>
        </div>
        <p className="mt-1 text-[11.5px] text-ink-3">
          Saldo al llegar: {formatCOP(Math.max(0, total - aPagar))}
        </p>
      </div>

      <Button
        variant="primary"
        size="lg"
        fullWidth
        loading={busy}
        onClick={() => onPagar(metodo, modalidad)}
      >
        {metodo === "TRANSFERENCIA" ? "Registrar y ver datos bancarios" : `Pagar ${formatCOP(aPagar)}`}
      </Button>

      <p className="flex items-center justify-center gap-2 text-[11px] text-ink-3">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="4" y="10" width="16" height="11" rx="2" stroke="currentColor" strokeWidth="1.6" />
          <path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.6" />
        </svg>
        La pasarela procesa el pago. Valema no guarda los datos de tu tarjeta.
      </p>
    </section>
  );
}
