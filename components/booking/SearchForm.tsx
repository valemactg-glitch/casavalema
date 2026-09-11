"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { clsx } from "clsx";
import { Button } from "@/components/ui/Button";
import { Field, SelectField } from "@/components/ui/Field";

export type SearchDefaults = {
  llegada: string;
  salida: string;
  adultos: number;
  ninos: number;
  habitaciones: number;
  codigo?: string | null;
};

function todayISO(): string {
  const now = new Date();
  const bogota = new Date(now.getTime() - 5 * 60 * 60_000);
  return bogota.toISOString().slice(0, 10);
}

function addDaysISO(iso: string, n: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function SearchForm({
  defaults,
  variant = "hero",
  action = "/habitaciones",
  showPromo = true,
}: {
  defaults: SearchDefaults;
  variant?: "hero" | "bar" | "page";
  action?: string;
  showPromo?: boolean;
}) {
  const router = useRouter();
  const min = useMemo(() => todayISO(), []);
  const [llegada, setLlegada] = useState(defaults.llegada);
  const [salida, setSalida] = useState(defaults.salida);
  const [adultos, setAdultos] = useState(String(defaults.adultos));
  const [ninos, setNinos] = useState(String(defaults.ninos));
  const [habitaciones, setHabitaciones] = useState(String(defaults.habitaciones));
  const [codigo, setCodigo] = useState(defaults.codigo ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const minSalida = addDaysISO(llegada || min, 1);

  function onLlegada(v: string) {
    setLlegada(v);
    if (v && salida && salida <= v) setSalida(addDaysISO(v, 2));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!llegada || !salida) {
      setError("Elige las fechas de llegada y salida.");
      return;
    }
    if (salida <= llegada) {
      setError("La fecha de salida debe ser posterior a la de llegada.");
      return;
    }
    if (llegada < min) {
      setError("La fecha de llegada no puede ser una fecha pasada.");
      return;
    }
    const q = new URLSearchParams({
      llegada,
      salida,
      adultos,
      ninos,
      habitaciones,
    });
    if (codigo.trim()) q.set("codigo", codigo.trim().toUpperCase());
    setPending(true);
    router.push(`${action}?${q.toString()}`);
  }

  const compact = variant === "bar";

  return (
    <form
      onSubmit={submit}
      className={clsx(
        "w-full",
        variant === "hero" &&
          "rounded-lg bg-white p-4 shadow-floating sm:p-5",
        variant === "page" && "rounded-lg border border-hairline bg-white p-4 sm:p-5",
        compact && "rounded-lg border border-hairline bg-white p-3.5",
      )}
    >
      <div
        className={clsx(
          "grid gap-3",
          compact
            ? "sm:grid-cols-[1fr_1fr_1fr_auto]"
            : "sm:grid-cols-2 md:grid-cols-[repeat(3,minmax(0,1fr))] lg:grid-cols-[repeat(6,minmax(0,1fr))_auto]",
        )}
      >
        <Field
          type="date"
          name="llegada"
          label="Llegada"
          min={min}
          value={llegada}
          onChange={(e) => onLlegada(e.target.value)}
          required
        />
        <Field
          type="date"
          name="salida"
          label="Salida"
          min={minSalida}
          value={salida}
          onChange={(e) => setSalida(e.target.value)}
          required
        />

        {compact ? (
          <SelectField
            name="huespedes"
            label="Huéspedes"
            value={`${adultos}-${ninos}`}
            onChange={(e) => {
              const [a, n] = e.target.value.split("-");
              setAdultos(a);
              setNinos(n);
            }}
          >
            {[
              ["1-0", "1 adulto"],
              ["2-0", "2 adultos"],
              ["2-1", "2 adultos, 1 niño"],
              ["3-0", "3 adultos"],
              ["3-1", "3 adultos, 1 niño"],
              ["4-0", "4 adultos"],
              ["4-2", "4 adultos, 2 niños"],
            ].map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </SelectField>
        ) : (
          <>
            <SelectField name="adultos" label="Adultos" value={adultos} onChange={(e) => setAdultos(e.target.value)}>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </SelectField>
            <SelectField name="ninos" label="Niños" value={ninos} onChange={(e) => setNinos(e.target.value)}>
              {[0, 1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </SelectField>
            <SelectField
              name="habitaciones"
              label="Habitaciones"
              value={habitaciones}
              onChange={(e) => setHabitaciones(e.target.value)}
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </SelectField>
            {showPromo && (
              <Field
                name="codigo"
                label="Código promocional"
                placeholder="Opcional"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                autoComplete="off"
              />
            )}
          </>
        )}

        <div className={clsx("flex items-end", !compact && "lg:col-span-1")}>
          <Button type="submit" variant="primary" size="md" fullWidth loading={pending}>
            {compact ? "Actualizar" : "Ver disponibilidad"}
          </Button>
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-3 text-[12px] font-medium text-error-fg">
          {error}
        </p>
      )}

      {variant === "hero" && !error && (
        <p className="mt-3 text-[11.5px] text-ink-3">
          Hora local de Colombia (GMT-5) · Mejor precio garantizado en la web ·
          Cancelación gratuita hasta 5 días antes con la tarifa flexible
        </p>
      )}
    </form>
  );
}
