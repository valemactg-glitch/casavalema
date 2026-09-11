"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";

export function LookupForm({ codeDefault }: { codeDefault?: string }) {
  const router = useRouter();
  const [code, setCode] = useState(codeDefault ?? "");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const q = new URLSearchParams({ code: code.trim(), email: email.trim() });
      const res = await fetch(`/api/bookings/lookup?${q}`);
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.message ?? "No encontramos la reserva.");
        return;
      }
      router.push(`/mi-reserva/${data.token}`);
    } catch {
      setError("Problema de conexión. Intenta de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-lg border border-hairline bg-white p-6">
      {error && (
        <Callout tone="error" role="alert">
          {error}
        </Callout>
      )}
      <Field
        name="code"
        label="Código de reserva"
        placeholder="VAL-26-0184"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        required
        autoComplete="off"
      />
      <Field
        name="email"
        label="Correo de la reserva"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        autoComplete="email"
      />
      <Button type="submit" variant="primary" size="lg" loading={busy} fullWidth>
        Ver mi reserva
      </Button>
      <p className="text-[11.5px] text-ink-3">
        También puedes entrar con el enlace seguro que te enviamos por correo, sin
        contraseña.
      </p>
    </form>
  );
}
