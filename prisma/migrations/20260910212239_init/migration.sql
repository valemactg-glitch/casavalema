-- CreateEnum
CREATE TYPE "DocTipo" AS ENUM ('CC', 'CE', 'PP', 'NIT', 'TI');

-- CreateEnum
CREATE TYPE "BookingEstado" AS ENUM ('BORRADOR', 'PENDIENTE_PAGO', 'PAGO_PARCIAL', 'CONFIRMADA', 'EN_CURSO', 'COMPLETADA', 'CANCELADA', 'NO_SHOW', 'REEMBOLSADA', 'REEMBOLSO_PARCIAL');

-- CreateEnum
CREATE TYPE "Canal" AS ENUM ('DIRECTO', 'AIRBNB', 'WHATSAPP', 'TELEFONO');

-- CreateEnum
CREATE TYPE "PaymentMetodo" AS ENUM ('TARJETA', 'PSE', 'TRANSFERENCIA');

-- CreateEnum
CREATE TYPE "PaymentEstado" AS ENUM ('PENDIENTE', 'APROBADO', 'RECHAZADO', 'CANCELADO', 'EXPIRADO', 'REEMBOLSADO');

-- CreateEnum
CREATE TYPE "BlockTipo" AS ENUM ('MANUAL', 'MANTENIMIENTO', 'CORTESIA', 'AIRBNB');

-- CreateEnum
CREATE TYPE "ReviewEstado" AS ENUM ('PENDIENTE', 'PUBLICADA', 'RECHAZADA', 'SIN_VALIDAR');

-- CreateEnum
CREATE TYPE "ServiceCobro" AS ENUM ('UNA_VEZ', 'POR_NOCHE', 'POR_HABITACION', 'POR_HUESPED', 'BAJO_SOLICITUD');

-- CreateEnum
CREATE TYPE "ServiceDisponibilidad" AS ENUM ('INCLUIDO', 'ADICIONAL', 'BAJO_SOLICITUD', 'NO_DISPONIBLE');

-- CreateEnum
CREATE TYPE "ChangeRequestTipo" AS ENUM ('FECHAS', 'CANCELACION', 'SERVICIOS', 'DATOS', 'OTRO');

-- CreateEnum
CREATE TYPE "ChangeRequestEstado" AS ENUM ('EN_REVISION', 'APROBADO', 'RECHAZADO');

-- CreateTable
CREATE TABLE "Room" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcionCorta" TEXT NOT NULL,
    "descripcionLarga" TEXT NOT NULL,
    "capacidadAdultos" INTEGER NOT NULL DEFAULT 2,
    "capacidadNinos" INTEGER NOT NULL DEFAULT 0,
    "cama" TEXT NOT NULL,
    "tamanoM2" INTEGER,
    "vista" TEXT,
    "banoPrivado" BOOLEAN NOT NULL DEFAULT true,
    "ubicacionEnCasa" TEXT,
    "precioBase" INTEGER NOT NULL,
    "anticipoPct" INTEGER NOT NULL DEFAULT 30,
    "estadiaMin" INTEGER NOT NULL DEFAULT 1,
    "estadiaMax" INTEGER,
    "servicios" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "reglas" JSONB NOT NULL DEFAULT '[]',
    "orden" INTEGER NOT NULL DEFAULT 0,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "ventaCerrada" BOOLEAN NOT NULL DEFAULT false,
    "seoTitulo" TEXT,
    "seoDescripcion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoomImage" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "alt" TEXT NOT NULL,
    "pie" TEXT,
    "portada" BOOLEAN NOT NULL DEFAULT false,
    "orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "RoomImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RatePlan" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "reembolsable" BOOLEAN NOT NULL DEFAULT true,
    "anticipoPct" INTEGER NOT NULL DEFAULT 30,
    "politicaCancelacion" TEXT NOT NULL,
    "descuentoPct" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "RatePlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Availability" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "precio" INTEGER NOT NULL,
    "estadiaMin" INTEGER NOT NULL DEFAULT 1,
    "estadiaMax" INTEGER,
    "cerrado" BOOLEAN NOT NULL DEFAULT false,
    "anticipacionMin" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Availability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingHold" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "llegada" DATE NOT NULL,
    "salida" DATE NOT NULL,
    "sessionId" TEXT NOT NULL,
    "expiraEn" TIMESTAMP(3) NOT NULL,
    "bookingId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingHold_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Guest" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "docTipo" "DocTipo" NOT NULL DEFAULT 'CC',
    "docNumero" TEXT NOT NULL,
    "pais" TEXT NOT NULL DEFAULT 'Colombia',
    "ciudad" TEXT,
    "telefono" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "consentimientos" JSONB NOT NULL DEFAULT '{}',
    "etiquetas" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notasPrivadas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Guest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "ratePlanId" TEXT,
    "guestId" TEXT NOT NULL,
    "llegada" DATE NOT NULL,
    "salida" DATE NOT NULL,
    "noches" INTEGER NOT NULL,
    "adultos" INTEGER NOT NULL,
    "ninos" INTEGER NOT NULL DEFAULT 0,
    "estado" "BookingEstado" NOT NULL DEFAULT 'BORRADOR',
    "canal" "Canal" NOT NULL DEFAULT 'DIRECTO',
    "subtotal" INTEGER NOT NULL,
    "serviciosTotal" INTEGER NOT NULL DEFAULT 0,
    "descuento" INTEGER NOT NULL DEFAULT 0,
    "impuestos" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL,
    "anticipo" INTEGER NOT NULL,
    "saldo" INTEGER NOT NULL,
    "codigoPromocional" TEXT,
    "horaLlegada" TEXT,
    "solicitudes" TEXT,
    "reservaParaOtro" BOOLEAN NOT NULL DEFAULT false,
    "facturacion" JSONB,
    "holdExpiraEn" TIMESTAMP(3),
    "gestionToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Companion" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "docNumero" TEXT,
    "esMenor" BOOLEAN NOT NULL DEFAULT false,
    "edad" INTEGER,

    CONSTRAINT "Companion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingEvent" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "detalle" TEXT NOT NULL,
    "valorAnterior" TEXT,
    "valorNuevo" TEXT,
    "actor" TEXT NOT NULL DEFAULT 'sistema',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChangeRequest" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "tipo" "ChangeRequestTipo" NOT NULL,
    "detalle" TEXT NOT NULL,
    "estado" "ChangeRequestEstado" NOT NULL DEFAULT 'EN_REVISION',
    "respuesta" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChangeRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "referencia" TEXT NOT NULL,
    "metodo" "PaymentMetodo" NOT NULL,
    "estado" "PaymentEstado" NOT NULL DEFAULT 'PENDIENTE',
    "valor" INTEGER NOT NULL,
    "comision" INTEGER NOT NULL DEFAULT 0,
    "moneda" TEXT NOT NULL DEFAULT 'COP',
    "proveedor" TEXT NOT NULL DEFAULT 'mock',
    "proveedorRef" TEXT,
    "comprobanteUrl" TEXT,
    "detalle" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Block" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "desde" DATE NOT NULL,
    "hasta" DATE NOT NULL,
    "tipo" "BlockTipo" NOT NULL DEFAULT 'MANUAL',
    "motivo" TEXT,
    "origen" TEXT,
    "icalUid" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Block_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT,
    "roomId" TEXT,
    "autor" TEXT NOT NULL,
    "fechaEstadia" DATE,
    "limpieza" INTEGER NOT NULL,
    "ubicacion" INTEGER NOT NULL,
    "atencion" INTEGER NOT NULL,
    "comodidad" INTEGER NOT NULL,
    "precio" INTEGER NOT NULL,
    "texto" TEXT NOT NULL,
    "estado" "ReviewEstado" NOT NULL DEFAULT 'PENDIENTE',
    "respuesta" TEXT,
    "destacada" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "imagenUrl" TEXT,
    "precio" INTEGER NOT NULL DEFAULT 0,
    "tipoCobro" "ServiceCobro" NOT NULL DEFAULT 'UNA_VEZ',
    "disponibilidad" "ServiceDisponibilidad" NOT NULL DEFAULT 'ADICIONAL',
    "cupo" INTEGER,
    "anticipacionHoras" INTEGER NOT NULL DEFAULT 0,
    "impuestosIncluidos" BOOLEAN NOT NULL DEFAULT true,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingService" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL DEFAULT 1,
    "precioUnit" INTEGER NOT NULL,
    "tipoCobro" "ServiceCobro" NOT NULL,
    "subtotal" INTEGER NOT NULL,

    CONSTRAINT "BookingService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SitePage" (
    "id" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "contenido" JSONB NOT NULL DEFAULT '{}',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SitePage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FaqItem" (
    "id" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "pregunta" TEXT NOT NULL,
    "respuesta" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "publicada" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "FaqItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegalDoc" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "cuerpo" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LegalDoc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactMessage" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "telefono" TEXT,
    "motivo" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "consentimiento" BOOLEAN NOT NULL DEFAULT false,
    "gestionado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GalleryImage" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "alt" TEXT NOT NULL,
    "pie" TEXT,
    "categoria" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "publicada" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "GalleryImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Room_slug_key" ON "Room"("slug");

-- CreateIndex
CREATE INDEX "Room_visible_orden_idx" ON "Room"("visible", "orden");

-- CreateIndex
CREATE INDEX "RoomImage_roomId_orden_idx" ON "RoomImage"("roomId", "orden");

-- CreateIndex
CREATE INDEX "RatePlan_roomId_activo_idx" ON "RatePlan"("roomId", "activo");

-- CreateIndex
CREATE INDEX "Availability_fecha_idx" ON "Availability"("fecha");

-- CreateIndex
CREATE UNIQUE INDEX "Availability_roomId_fecha_key" ON "Availability"("roomId", "fecha");

-- CreateIndex
CREATE INDEX "BookingHold_roomId_expiraEn_idx" ON "BookingHold"("roomId", "expiraEn");

-- CreateIndex
CREATE INDEX "BookingHold_expiraEn_idx" ON "BookingHold"("expiraEn");

-- CreateIndex
CREATE INDEX "Guest_correo_idx" ON "Guest"("correo");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_codigo_key" ON "Booking"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_gestionToken_key" ON "Booking"("gestionToken");

-- CreateIndex
CREATE INDEX "Booking_estado_idx" ON "Booking"("estado");

-- CreateIndex
CREATE INDEX "Booking_roomId_llegada_salida_idx" ON "Booking"("roomId", "llegada", "salida");

-- CreateIndex
CREATE INDEX "Booking_llegada_idx" ON "Booking"("llegada");

-- CreateIndex
CREATE INDEX "BookingEvent_bookingId_createdAt_idx" ON "BookingEvent"("bookingId", "createdAt");

-- CreateIndex
CREATE INDEX "ChangeRequest_estado_idx" ON "ChangeRequest"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_referencia_key" ON "Payment"("referencia");

-- CreateIndex
CREATE INDEX "Payment_bookingId_idx" ON "Payment"("bookingId");

-- CreateIndex
CREATE INDEX "Payment_estado_idx" ON "Payment"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "Block_icalUid_key" ON "Block"("icalUid");

-- CreateIndex
CREATE INDEX "Block_roomId_desde_hasta_idx" ON "Block"("roomId", "desde", "hasta");

-- CreateIndex
CREATE UNIQUE INDEX "Review_bookingId_key" ON "Review"("bookingId");

-- CreateIndex
CREATE INDEX "Review_estado_idx" ON "Review"("estado");

-- CreateIndex
CREATE INDEX "Review_roomId_idx" ON "Review"("roomId");

-- CreateIndex
CREATE UNIQUE INDEX "Service_slug_key" ON "Service"("slug");

-- CreateIndex
CREATE INDEX "Service_activo_orden_idx" ON "Service"("activo", "orden");

-- CreateIndex
CREATE UNIQUE INDEX "BookingService_bookingId_serviceId_key" ON "BookingService"("bookingId", "serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "SitePage_clave_key" ON "SitePage"("clave");

-- CreateIndex
CREATE INDEX "FaqItem_categoria_orden_idx" ON "FaqItem"("categoria", "orden");

-- CreateIndex
CREATE UNIQUE INDEX "LegalDoc_slug_key" ON "LegalDoc"("slug");

-- CreateIndex
CREATE INDEX "ContactMessage_gestionado_createdAt_idx" ON "ContactMessage"("gestionado", "createdAt");

-- CreateIndex
CREATE INDEX "GalleryImage_categoria_orden_idx" ON "GalleryImage"("categoria", "orden");

-- AddForeignKey
ALTER TABLE "RoomImage" ADD CONSTRAINT "RoomImage_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RatePlan" ADD CONSTRAINT "RatePlan_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Availability" ADD CONSTRAINT "Availability_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingHold" ADD CONSTRAINT "BookingHold_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingHold" ADD CONSTRAINT "BookingHold_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_ratePlanId_fkey" FOREIGN KEY ("ratePlanId") REFERENCES "RatePlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Companion" ADD CONSTRAINT "Companion_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingEvent" ADD CONSTRAINT "BookingEvent_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChangeRequest" ADD CONSTRAINT "ChangeRequest_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Block" ADD CONSTRAINT "Block_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingService" ADD CONSTRAINT "BookingService_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingService" ADD CONSTRAINT "BookingService_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
