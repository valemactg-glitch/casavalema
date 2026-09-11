import "server-only";

/**
 * Abstracción de pasarela. Fase 1 usa `mock`. Para conectar Wompi o
 * Mercado Pago se implementa un adaptador con esta misma interfaz y se
 * cambia PAYMENTS_PROVIDER. Nunca se guardan datos de tarjeta.
 */

export type PaymentMethod = "TARJETA" | "PSE" | "TRANSFERENCIA";
export type PaymentModalidad = "anticipo" | "total";

export type CreatePaymentInput = {
  referencia: string;
  bookingCodigo: string;
  metodo: PaymentMethod;
  valor: number;
  moneda: "COP";
  correo: string;
  descripcion: string;
  returnUrl: string;
};

export type CreatePaymentResult = {
  proveedor: string;
  proveedorRef: string;
  /** Estado inmediato (tarjeta/PSE en el mock aprueban al instante). */
  estado: "APROBADO" | "PENDIENTE" | "RECHAZADO";
  /** A dónde llevar al huésped tras iniciar el pago. */
  redirectUrl: string;
};

export interface PaymentGateway {
  readonly nombre: string;
  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;
  verifyWebhook(headers: Headers, rawBody: string): { valido: boolean };
}

// ── Mock: simula el comportamiento sin salir del sitio ──────────

class MockGateway implements PaymentGateway {
  readonly nombre = "mock";

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    const proveedorRef = `mock_${Math.random().toString(36).slice(2, 10)}`;
    // Transferencia siempre queda pendiente de verificación manual.
    if (input.metodo === "TRANSFERENCIA") {
      return {
        proveedor: this.nombre,
        proveedorRef,
        estado: "PENDIENTE",
        redirectUrl: input.returnUrl + "&estado=pendiente",
      };
    }
    // Tarjeta / PSE: en el mock aprueban salvo un caso de prueba.
    const rechazar = input.correo.includes("rechazo");
    return {
      proveedor: this.nombre,
      proveedorRef,
      estado: rechazar ? "RECHAZADO" : "APROBADO",
      redirectUrl: input.returnUrl + (rechazar ? "&estado=rechazado" : "&estado=aprobado"),
    };
  }

  verifyWebhook(): { valido: boolean } {
    return { valido: true };
  }
}

export function getGateway(): PaymentGateway {
  const provider = process.env.PAYMENTS_PROVIDER ?? "mock";
  switch (provider) {
    // case "wompi": return new WompiGateway();
    // case "mercadopago": return new MercadoPagoGateway();
    default:
      return new MockGateway();
  }
}
