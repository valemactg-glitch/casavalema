import type { Metadata } from "next";
import { LookupForm } from "@/components/booking/LookupForm";
import { whatsappUrl } from "@/lib/nav";

export const metadata: Metadata = {
  title: "Mi reserva",
  robots: { index: false, follow: false },
};

export default async function MiReservaPage(props: PageProps<"/mi-reserva">) {
  const sp = await props.searchParams;
  const code = typeof sp.code === "string" ? sp.code : undefined;

  return (
    <div className="mx-auto max-w-md">
      <p className="kicker">Mi reserva</p>
      <h1 className="mt-1 text-[clamp(1.6rem,4vw,2rem)]">Consulta y gestiona tu reserva</h1>
      <p className="mt-2 text-[13.5px] leading-relaxed text-ink-2">
        Sin crear cuenta. Con tu código y tu correo puedes ver el estado, pagar el saldo,
        informar tu hora de llegada y pedir cambios.
      </p>
      <div className="mt-6">
        <LookupForm codeDefault={code} />
      </div>
      <p className="mt-4 text-[12.5px] text-ink-3">
        ¿No encuentras tu código?{" "}
        <a href={whatsappUrl()} className="underline">
          Escríbenos por WhatsApp
        </a>{" "}
        y lo buscamos.
      </p>
    </div>
  );
}
