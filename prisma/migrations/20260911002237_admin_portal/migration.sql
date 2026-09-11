-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('PROPIETARIO', 'ADMINISTRADOR', 'RECEPCION', 'CONTABILIDAD', 'EDITOR', 'SOLO_LECTURA');

-- CreateEnum
CREATE TYPE "DescuentoTipo" AS ENUM ('PORCENTAJE', 'MONTO');

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "checkInAt" TIMESTAMP(3),
ADD COLUMN     "checkOutAt" TIMESTAMP(3),
ADD COLUMN     "estadoLimpieza" TEXT NOT NULL DEFAULT 'pendiente',
ADD COLUMN     "notasInternas" TEXT;

-- AlterTable
ALTER TABLE "Guest" ADD COLUMN     "preferencias" TEXT,
ADD COLUMN     "solicitudEliminacion" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "rol" "Rol" NOT NULL DEFAULT 'RECEPCION',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "ultimoAcceso" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "actorNombre" TEXT NOT NULL,
    "accion" TEXT NOT NULL,
    "entidad" TEXT,
    "detalle" TEXT,
    "valorAnterior" TEXT,
    "valorNuevo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Season" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "desde" DATE NOT NULL,
    "hasta" DATE NOT NULL,
    "ajustePct" INTEGER NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Season_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromoCode" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "descripcion" TEXT,
    "tipo" "DescuentoTipo" NOT NULL DEFAULT 'PORCENTAJE',
    "valor" INTEGER NOT NULL,
    "desde" DATE,
    "hasta" DATE,
    "minNoches" INTEGER NOT NULL DEFAULT 1,
    "usosMax" INTEGER,
    "usos" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PromoCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IcalLink" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "urlEntrada" TEXT,
    "tokenSalida" TEXT NOT NULL,
    "ultimaSync" TIMESTAMP(3),
    "ultimoResultado" TEXT,
    "eventos" INTEGER NOT NULL DEFAULT 0,
    "autoSync" BOOLEAN NOT NULL DEFAULT true,
    "activa" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "IcalLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IcalSyncLog" (
    "id" TEXT NOT NULL,
    "linkId" TEXT NOT NULL,
    "ok" BOOLEAN NOT NULL,
    "mensaje" TEXT NOT NULL,
    "eventos" INTEGER NOT NULL DEFAULT 0,
    "conflictos" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IcalSyncLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailTemplate" (
    "id" TEXT NOT NULL,
    "evento" TEXT NOT NULL,
    "asunto" TEXT NOT NULL,
    "cuerpo" TEXT NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setting" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "data" JSONB NOT NULL DEFAULT '{}',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "AdminSession_token_key" ON "AdminSession"("token");

-- CreateIndex
CREATE INDEX "AdminSession_userId_idx" ON "AdminSession"("userId");

-- CreateIndex
CREATE INDEX "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt");

-- CreateIndex
CREATE INDEX "ActivityLog_entidad_idx" ON "ActivityLog"("entidad");

-- CreateIndex
CREATE INDEX "Season_activa_desde_idx" ON "Season"("activa", "desde");

-- CreateIndex
CREATE UNIQUE INDEX "PromoCode_codigo_key" ON "PromoCode"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "IcalLink_roomId_key" ON "IcalLink"("roomId");

-- CreateIndex
CREATE INDEX "IcalSyncLog_linkId_createdAt_idx" ON "IcalSyncLog"("linkId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "EmailTemplate_evento_key" ON "EmailTemplate"("evento");

-- AddForeignKey
ALTER TABLE "AdminSession" ADD CONSTRAINT "AdminSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IcalLink" ADD CONSTRAINT "IcalLink_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IcalSyncLog" ADD CONSTRAINT "IcalSyncLog_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "IcalLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;
