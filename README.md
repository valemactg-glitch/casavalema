# Casa Turística Valema — sitio web y motor de reservas

Producto digital de Casa Turística Valema: cinco habitaciones independientes
(Valentina, Elena, Magdalena, Aurora, Alma) y un rooftop compartido, con reserva
directa desde la web.

Cubre el sitio público, el motor de reservas y el **portal administrativo completo**
(los 15 módulos del handoff `design-reference/README.md`).

### Acceso al portal administrativo

`/admin` — usuarios de muestra (clave `valema2026`):

| Correo | Rol |
| --- | --- |
| `marcela@valema.co` | Propietario (acceso total) |
| `admin@valema.co` | Administrador |
| `recepcion@valema.co` | Recepción |
| `contabilidad@valema.co` | Contabilidad |
| `contenido@valema.co` | Editor de contenido |

## Stack

- **Next.js 16** (App Router, React 19, TypeScript) — `next dev` usa Turbopack.
- **PostgreSQL** vía **Prisma 6**.
  - Local: PostgreSQL embebido (`embedded-postgres`), sin Docker — `scripts/pg.mjs`.
  - Producción: **Supabase** (mismo `provider`, misma migración; sólo cambia `DATABASE_URL`).
- **Tailwind CSS 4** con los tokens del sistema de diseño en `app/globals.css`.
- **Zod** para validación.
- Pasarela de pago: abstracción en `lib/payments/gateway.ts`. Fase 1 usa un `mock`;
  Wompi / Mercado Pago se conectan implementando un adaptador con la misma interfaz.

## Puesta en marcha

```bash
npm install                 # instala + genera el cliente Prisma
npm run db:start            # inicia PostgreSQL local (deja la terminal abierta)
npm run db:migrate          # aplica las migraciones  (otra terminal)
npm run db:seed             # carga datos de muestra
npm run dev:web             # levanta Next en http://localhost:3000
```

O todo junto (base + web en el mismo proceso):

```bash
npm run dev                 # concurrently: PostgreSQL local + next dev
```

Scripts de base de datos: `db:start` · `db:stop` · `db:status` · `db:nuke`
(borra los datos) · `db:migrate` · `db:seed` · `db:reset` · `db:studio`.

### Variables de entorno

Copia `.env.example` a `.env`. Para local, `.env` ya viene listo.
Para producción con Supabase:

```
DATABASE_URL="postgresql://…@…pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://…@…supabase.com:5432/postgres"
NEXT_PUBLIC_SITE_URL="https://valema.co"
PAYMENTS_PROVIDER="wompi"        # o mercadopago
PAYMENTS_WEBHOOK_SECRET="…"
EMAIL_PROVIDER="resend"          # implementar adaptador en lib/email/send.ts
ADMIN_EMAIL="reservas@valema.co"
HOLD_TTL_MINUTES="15"
```

## Arquitectura

```
app/
  (site)/            Sitio público (header + footer + WhatsApp + cookies)
    page.tsx         Inicio
    la-casa · rooftop · servicios · galeria · ubicacion · resenas
    contacto · preguntas-frecuentes · legales/[slug]
    habitaciones/                 Listado con búsqueda y estados
    habitaciones/[slug]/          Ficha + calendario + tarjeta de reserva
  (booking)/         Flujo de reserva (chrome mínimo, no indexable)
    reservar/                     Asistente: servicios → datos → revisión → pago
    reserva/[code]/               Confirmación
    mi-reserva · mi-reserva/[token]   Portal del huésped sin cuenta
  comprobante/[token]/            Comprobante imprimible
  emails/            Previsualización de las 21 plantillas (solo dev)
  admin/            Portal administrativo (proxy.ts gatea /admin)
    login · recuperar · sin-permiso · logout
    (panel)/         Shell con barra lateral; requireUser() valida sesión + permiso
      page.tsx (dashboard) · calendario · reservas · reservas/[codigo] · reservas/nueva
      habitaciones · habitaciones/[id] · tarifas · pagos · huespedes · huespedes/[id]
      servicios · resenas · mensajes · contenido · galeria · reportes · usuarios · configuracion
  api/
    availability · rooms/[slug]/calendar · holds
    bookings · bookings/[id]/payments · webhooks/payments
    bookings/lookup · calendario/[token] · ical/[token] (exportación a Airbnb)

lib/
  booking/           availability · pricing · hold · lock · create · payments
                     calendar · search · codes · links · get
  auth/              password (scrypt) · session (cookie + AdminSession) · rbac (matriz por rol)
  admin/             nav · estados · metrics (dashboard + calendario) · reportes
  ical/              parser + exportador + syncRoomIcal
  email/             render (plantilla base) · templates (las 21) · send
  payments/          gateway (interfaz + mock)
  db · dates · format · catalog · nav · search-params · validation · http · queries

prisma/schema.prisma  ~35 modelos + enums   ·   prisma/seed.ts  datos de muestra
components/ui         Sistema de diseño (Button, Badge, Field, Callout, …)
components/site       Header, Footer, WhatsappButton, CookieBanner, GalleryGrid, …
components/booking    SearchForm, ResultsBrowser, RoomBooking, BookingWizard, …
components/admin      AdminShell, CalendarStrip, BlockPanel, IcalPanel, ConfirmAction, …
```

## Portal administrativo

- **Autenticación** propia: contraseña con `scrypt` (sin dependencias nativas),
  sesión en cookie httpOnly + tabla `AdminSession`, `proxy.ts` como comprobación
  optimista y `requireUser(modulo, "read"|"write")` como validación real.
- **Roles y permisos**: 6 roles (propietario, administrador, recepción, contabilidad,
  editor, solo lectura) con una matriz módulo × rol en `lib/auth/rbac.ts`. La barra
  lateral sólo muestra lo accesible; las acciones comprueban `write`.
- **Historial**: cada acción sensible escribe en `ActivityLog` (actor, entidad,
  valor anterior/nuevo).
- **Módulos**: dashboard con KPIs y alerta de conflicto · **calendario maestro**
  (cinta de 14 días, 8 estados por color, bloqueo con vista previa de consecuencias,
  panel iCal por habitación) · reservas (listado, detalle, check-in/out, cancelar,
  reembolsar, pago manual, notas, reserva manual) · habitaciones (editor de contenido,
  fotos, servicios, reglas, precios, SEO) · tarifas (editor masivo por rango, grilla,
  temporadas, códigos promocionales) · pagos (transacciones, aprobar/rechazar
  transferencias) · huéspedes (ficha, consentimientos, exportación, solicitud de
  eliminación) · servicios · reseñas (moderación con caso "sin validar") · mensajes y
  plantillas · contenido/CMS · galería · reportes (rango de fechas, exportación) ·
  usuarios (matriz de permisos, registro de actividad) · configuración.
- **iCal ↔ Airbnb**: importación por habitación (`syncRoomIcal` — parsea el enlace,
  crea bloqueos `AIRBNB`, detecta solapamientos con reservas directas y **no cancela
  nada automáticamente**) y enlace propio de exportación (`/api/ical/[token]`). La
  interfaz advierte que la sincronización no es instantánea.

## Reglas de negocio (todas en el servidor)

Están en `design-reference/README.md §"Reglas de negocio no negociables"`. Implementación:

1. **Disponibilidad siempre en el servidor.** `lib/booking/availability.ts` —
   la búsqueda, la creación de la retención y la creación de la reserva la
   comprueban de forma independiente.
2. **Retención con expiración.** `BookingHold` con `expiraEn`. Al entrar al pago
   se crea; mientras vive, esas noches no se venden. `releaseExpiredHolds()` y
   `releaseStaleBookings()` liberan lo vencido (falta el cron que las llame — ver abajo).
3. **Una noche, una fuente.** `takenNights()` une reservas activas + `Block` +
   retenciones vivas + inventario cerrado.
4. **Concurrencia.** `withRoomLock()` usa `pg_advisory_xact_lock` por habitación:
   crear retención, crear reserva y confirmar pago se serializan.
5. **Precio transparente desde el paso 1.** Impuestos incluidos en el precio que
   se ve; `quote()` es la fuente de verdad y el total no cambia hasta el pago.
6. **El webhook es la verdad del pago**, no el retorno del navegador
   (`app/api/webhooks/payments`).
7. **Cambios y cancelaciones = solicitud.** `ChangeRequest` en estado `EN_REVISION`;
   nada se aprueba solo.
8. **Historial.** `BookingEvent` registra estado, fecha, pago y notas.

## Verificado end-to-end

- Búsqueda → disponibilidad con estados (disponible / última / no disponible /
  estadía mínima) y fechas alternativas.
- Ficha con calendario, selección de fechas y tarifas, cotización en vivo.
- Asistente de reserva completo con retención y cuenta atrás visible.
- Pago (tarjeta/PSE aprueban en el mock; transferencia queda pendiente de verificación).
- Confirmación, comprobante imprimible, `.ics`, portal del huésped.
- Tras confirmar, la habitación deja de estar disponible; una segunda reserva de
  las mismas noches se rechaza con `409` (no hay sobreventa).
- Las 21 notificaciones se disparan (registradas en consola).
- Portal admin: los 15 módulos cargan; login con roles; el calendario maestro
  muestra reservas, bloqueos y estados; el bloqueo pide confirmación con las
  consecuencias antes de aplicarse.
- `npm run build`, `npm run typecheck`, `npm run lint` — sin errores.

## Pendiente

- **Fotografía real**: los marcos (`ImageSlot`) están vacíos; toda imagen se
  administra desde la Galería / el editor de habitación.
- **Envío de correo real**: implementar un adaptador en `lib/email/send.ts`
  (`EMAIL_PROVIDER`). Igual para WhatsApp (`queueWhatsapp`).
- **Cron**: llamar a `releaseExpiredHolds()` / `releaseStaleBookings()` cada pocos
  minutos, ejecutar `syncRoomIcal` por hora, y disparar los recordatorios
  (pago, pre-check-in, instrucciones, reseña).
- **Almacenamiento de imágenes** (Supabase Storage) para subir fotos en vez de
  pegar URLs.
- **2FA** real y recuperación de contraseña por correo (hoy la recuperación se
  hace desde Usuarios).
- **Google Maps / MapLibre** real en Ubicación y en la confirmación.
- **Migración a Supabase**: cambiar `DATABASE_URL` / `DIRECT_URL` y
  `prisma migrate deploy`. El esquema no usa nada específico del Postgres local.

## Referencia de diseño

`design-reference/` contiene el handoff original de Claude Design: el prototipo
(`Casa Valema.dc.html`), el manual de tokens y el `README.md` con el modelo de
datos, las reglas de negocio y el orden de construcción. No es código de producción.
