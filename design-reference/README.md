# Handoff: Casa Turística Valema — sitio público, motor de reservas y portal administrativo

## Overview
Producto digital completo para Casa Turística Valema, una casa de alojamiento turístico
con cinco habitaciones independientes (Valentina, Elena, Magdalena, Aurora, Alma) y un
rooftop compartido. Vende por su propio sitio y por Airbnb.

Objetivo del producto: conseguir reservas directas desde la web, reducir la dependencia
de intermediarios y dar al administrador control total de la operación sin editar código.

El entregable cubre 27 pantallas agrupadas en tres áreas:

1. **Sitio público** — Inicio, Habitaciones (listado con estados), ficha de habitación,
   flujo de reserva de 7 pasos, confirmación y portal del huésped ("Mi reserva").
2. **Correos y notificaciones** — dos plantillas renderizadas y el catálogo de las 21
   notificaciones con su canal (correo, WhatsApp o ambos).
3. **Portal administrativo** — login y sus estados, dashboard, calendario maestro,
   reservas, habitaciones, tarifas y disponibilidad, pagos, huéspedes, servicios,
   reseñas, mensajes y plantillas, contenido (CMS), galería, reportes, usuarios y
   configuración.

Más dos pantallas de documentación dentro del propio archivo: **Mapa y flujos**
(sitemap + los cuatro flujos críticos) y **Especificaciones dev** (modelo de datos,
reglas de negocio, endpoints, tokens, breakpoints, QA y fases).

## About the Design Files
Los archivos de este paquete son **referencias de diseño creadas en HTML**: prototipos que
muestran el aspecto y el comportamiento previstos, **no código de producción para copiar
directamente**.

La tarea es **reconstruir estos diseños en el entorno del codebase destino** (React, Vue,
Next.js, Laravel + Blade, lo que corresponda) usando sus patrones y librerías ya
establecidos. Si todavía no existe un codebase, elegir el framework más adecuado al
proyecto e implementar los diseños allí.

Un detalle importante sobre el archivo principal: es un componente único con un
conmutador de pantallas en la barra superior. Ese conmutador es un andamio de
presentación, **no** parte del producto: en la implementación real cada pantalla es una
ruta propia, y la navegación pública y la administrativa viven en accesos separados
(\`valema.co\` y \`admin.valema.co\`).

## Fidelity
**Alta fidelidad (hifi).** Colores, tipografías, espaciados, radios, estados y copy son
finales. El copy en español está escrito para producción: no es relleno y no debe
reescribirse sin acuerdo con el cliente. Los datos numéricos (precios, códigos de
reserva, nombres de huéspedes, cifras de reportes) son de muestra creíble y deben venir
del backend.

Las zonas de imagen son marcos vacíos: el cliente aún no entregó fotografía real. Toda
imagen del sitio se administra desde el módulo Galería y se asocia a habitaciones.

## Screens / Views

### Público

**1. Inicio**
Propósito: mostrar de inmediato que es un alojamiento y que se puede comprobar
disponibilidad sin salir de la página.
Layout, de arriba abajo:
- Hero a pantalla completa, \`min-height: 640px\`, imagen de fondo \`object-fit: cover\`,
  con degradado \`linear-gradient(180deg, rgba(29,42,58,.66) 0%, rgba(29,42,58,.22) 42%, rgba(29,42,58,.80) 100%)\`
  y \`pointer-events: none\`.
- Header sobre el hero: logotipo tipográfico (Merriweather 21px, #F5F5F0) + descriptor
  "Casa turística" (9px, letter-spacing .26em, uppercase, #D4AF37), menú de 8 enlaces
  (12px, 500, rgba(245,245,240,.9)), selector "ES · EN", botón "Reservar ahora"
  (fondo #D4AF37, texto #1D2A3A, pill, padding 10px 20px).
- Bloque editorial centrado verticalmente: antetítulo "Bienvenido a" en Merriweather
  300 itálica 19px #D4AF37; título "Valema" 74px/1 #F5F5F0 letter-spacing -.02em; regla
  dorada de 54×2px; párrafo 16px/1.7 rgba(245,245,240,.9), ancho máximo 520px.
- Cinta inferior del hero: tres celdas iguales, fondo rgba(29,42,58,.72), borde
  izquierdo 1px rgba(212,175,55,.28); cifra en Merriweather 17px #D4AF37 y etiqueta 11px
  uppercase letter-spacing .1em.
- Buscador de disponibilidad: tarjeta blanca, \`border-radius: 26px\`,
  \`box-shadow: 0 14px 38px rgba(29,42,58,.18)\`, \`margin-top: -40px\` sobre el hero,
  grid \`repeat(auto-fit, minmax(128px, 1fr))\` con 6 campos (llegada, salida, adultos,
  niños, habitaciones, código promocional) + botón primario "Ver disponibilidad".
  Debajo, línea de confianza 11.5px #767f8c: zona horaria, mejor precio, cancelación.
- Secciones siguientes, todas con \`max-width: 1180px\` y \`padding: 76px 38px 0\`:
  la casa (texto + tres imágenes en grid asimétrico + tres cifras con regla dorada
  superior), habitaciones (grid \`minmax(205px,1fr)\`, tarjetas blancas radio 24 con badge
  de estado sobre la foto), beneficios de reserva directa (bloque #1D2A3A radio 30),
  rooftop (imagen + texto + chips), servicios (grid de 6 celdas separadas por
  \`gap: 2px\` sobre fondo rgba(29,42,58,.1) — el truco que dibuja las líneas divisorias),
  galería (tira horizontal desplazable de 262px), ubicación (texto + mapa), reseñas,
  CTA final y footer.
- Footer: fondo #1D2A3A, cuatro columnas (marca + Explorar + Reservas + Legal), línea
  inferior con © y datos legales editables.
- Botón flotante de WhatsApp abajo a la derecha: fondo #50C878, texto #0f2e1a, pill,
  \`box-shadow: 0 8px 24px rgba(29,42,58,.28)\`.

**2. Habitaciones (listado)**
Buscador compacto de 3 campos, fila de filtros en chips, contador "3 de 5 disponibles".
Cada habitación es una tarjeta horizontal radio 26: foto a la izquierda con badge de
estado, especificaciones y chips de servicios en el centro, y a la derecha el precio
total para el rango buscado, el desglose y dos acciones. Estados diseñados:
- **Disponible** — badge #E8F7EC / #1E6B32, CTA primario azul carbón.
- **Última habitación** — badge #FFF3F6 / #C2385A, CTA #C2385A, nota de urgencia honesta.
- **No disponible** — tarjeta a \`opacity: .58\`, CTA secundario que ofrece fechas
  alternativas, nota "te avisamos si se libera".
- **Estadía mínima** — badge #EDF4FB / #1F5A8C con la condición explícita.
- **Tarifa promocional** — badge #FFF6DC / #8A6A0B.
Al final, banda #EDF4FB con la propuesta de fechas alternativas.

**3. Ficha de habitación**
Galería en grid 2fr/1fr (una imagen grande de 400px + dos apiladas). Columna izquierda:
antetítulo, nombre 38px, línea de especificaciones, descripción 15px/1.8, tabla de 8
datos en grid con \`gap: 2px\`, chips de servicios, tabla de reglas y políticas, y
calendario mensual de 7 columnas con celdas \`aspect-ratio: 1\` que muestran precio por
noche y cuatro estados (disponible, seleccionado, ocupada con \`line-through\`, estadía
mínima). Columna derecha: tarjeta de reserva \`position: sticky; top: 80px\` con precio,
selector de fechas y huéspedes, desglose, total, anticipo y CTA de ancho completo.

**4. Motor de reservas (pasos 3 a 6)**
Cuatro marcos de móvil de 330px de ancho y 624px de alto (bisel #1D2A3A radio 36,
pantalla #F5F5F0 radio 28). Cada marco tiene cabecera con volver, título y contador
"n/7", barra de progreso de 7 segmentos (completado #D4AF37, actual #1D2A3A, pendiente
#DFDDD3), contenido desplazable y pie fijo con el total y el CTA de ancho completo.
- Paso 3, servicios: tarjetas seleccionables con casilla, precio y unidad de cobro
  (por huésped/noche, por trayecto, una vez, bajo solicitud).
- Paso 4, datos: seis campos con un error de validación real ("Escribe el número
  completo, sin puntos.") y consentimiento de políticas.
- Paso 5, revisión: desglose completo de 7 líneas y aviso de retención con cuenta atrás
  visible ("14:32").
- Paso 6, pago: tres métodos (tarjeta, PSE, transferencia), elección entre anticipo 30%
  y total, y sello de que la pasarela procesa el pago y Valema no guarda la tarjeta.
Al lado, cinco tarjetas con los estados del pago: aprobado, pendiente, rechazado, sesión
expirada y conflicto de disponibilidad, cada uno con su acción de salida.

**5. Confirmación**
Marca de éxito circular #E8F7EC / #2F8F45, título, aviso del correo enviado, tarjeta de
reserva con cabecera azul carbón (código en Merriweather 25px + badge de estado de pago),
ocho líneas de detalle, saldo pendiente destacado, cuatro acciones (comprobante,
calendario, gestionar, WhatsApp) y bloque de instrucciones de llegada numeradas.

**6. Mi reserva (portal del huésped)**
Acceso con código + correo o enlace firmado, sin cuenta. Tarjeta de reserva en azul
carbón, lista de acciones con su estado, banda de saldo pendiente, formulario de hora de
llegada y acompañantes, y solicitudes de cambio con estado (en revisión, aprobado, ver
política). La reseña aparece deshabilitada hasta el check-out.

**7. Correos**
Dos plantillas renderizadas a 392px de ancho: cabecera azul carbón con la marca, título
en Merriweather 19px, cuerpo 13px/1.75, bloque de datos sobre #F5F5F0 radio 16, CTA pill
y pie legal. Debajo, el catálogo de las 21 notificaciones con destinatario y canal.

### Administrativo

Todas las pantallas admin comparten un shell: barra lateral fija de 212px, fondo
#1D2A3A, 15 ítems de 12.5px; el activo lleva fondo rgba(212,175,55,.14) y borde
izquierdo de 3px #D4AF37. El área de contenido va sobre #F1F0EA con \`padding: 26px 30px 60px\`.

**8. Login** — cuatro estados en tarjetas de 320px: normal, credenciales incorrectas
(borde #F26B8A y mensaje específico, con intentos restantes), verificación en dos pasos
y sesión vencida.

**9. Dashboard** — saludo con fecha y hora de la última sincronización, banda de alerta
de conflicto (#FFF3F6 con CTA #C2385A), seis KPIs, ocupación por habitación con barra
apilada directa/Airbnb, llegadas y salidas del día, pagos por cobrar.

**10. Calendario maestro** — el módulo más importante. Cinta horizontal de 14 días con
una fila por habitación: cabecera de días con fines de semana en #B08D1F, retícula de 14
columnas y barras absolutas posicionadas en porcentaje (cada día = 7,143%). Ocho estados
por color: disponible, reserva directa (#1D2A3A), Airbnb (#D4AF37), pendiente de pago
(#FFF9E8 con borde discontinuo dorado), conflicto (#FFE3EA con borde #F26B8A), bloqueo
manual, mantenimiento y cortesía. Debajo, panel de confirmación antes de aplicar un
bloqueo (con la consecuencia escrita) y panel de sincronización iCal por habitación con
sus cinco estados.

**11. Reservas** — buscador, filtros por estado, tabla de 4 columnas con los 10 estados
de reserva y el canal, paginación, y panel de detalle con datos del titular, siete
líneas de reserva, nota interna, siete acciones e historial cronológico.

**12. Habitaciones** — lista reordenable con estado (visible, editando, oculta) y editor
de cinco pestañas: contenido, fotos con portada marcada en dorado, servicios y reglas,
precios y SEO. Aviso de que una habitación con reservas futuras no se elimina, solo se
cierra la venta; el botón Eliminar aparece deshabilitado.

**13. Tarifas y disponibilidad** — editor masivo por rango (habitaciones, fechas, días
de la semana, precio, estadía mínima) y grilla de 10 días × 5 habitaciones con celdas
seleccionadas en rgba(212,175,55,.22) + borde dorado, inventario cerrado en #E4E2DA y
marca "mín 3". Debajo, temporadas y códigos promocionales.

**14. Pagos y reembolsos** — cuatro KPIs, tabla de transacciones con método, estado,
valor y comisión, y dos paneles de acción: transferencia por verificar (con vista previa
del comprobante, aprobar en #2F8F45 o rechazar) y reembolso solicitado con el cálculo
según política.

**15. Huéspedes** — tabla con procedencia, estadías y gasto; ficha con preferencias,
consentimientos, nota privada, exportación de datos y solicitud de eliminación.

**16. Servicios adicionales** — tabla con precio, tipo de cobro, cupo y estado (activo,
bajo solicitud, sin cupo) y la regla de qué pasa cuando el cupo se agota.

**17. Reseñas** — seis puntajes por categoría con barra, y cola de moderación con tres
casos: por aprobar, publicada con respuesta, y una sin reserva asociada que el sistema
marca "Sin validar" y no permite publicar.

**18. Mensajes y plantillas** — bandeja con estado de gestión y editor de plantilla con
asunto, cuerpo, chips de variables disponibles, momento de envío y canales.

**19. Galería multimedia** — filtros por carpeta, grid \`repeat(auto-fill, minmax(150px,1fr))\`
con portada marcada, aviso de imagen sin texto alternativo, un archivo en estado de
carga y zona de arrastre.

**20. Reportes** — cinco KPIs, barras apiladas de ingresos por mes y canal, mezcla de
canales con barra de proporción, y tabla de desempeño por habitación con una lectura
escrita del dato.

**21. Usuarios, roles y seguridad** — tabla de usuarios con último acceso, matriz de
permisos de 7 módulos × 4 roles y registro de actividad.

**22. Configuración** — seis tarjetas: alojamiento, pagos y pasarela, integraciones
Airbnb/iCal, contacto y redes, impuestos y legales, sitio y privacidad.

## Interactions & Behavior

- **Navegación**: el conmutador superior del prototipo se reemplaza por rutas reales.
  Público y admin en accesos separados; el admin exige sesión.
- **Buscador de disponibilidad**: valida que la salida sea posterior a la llegada, que
  la ocupación no supere la capacidad, la estadía mínima y máxima y la anticipación
  mínima. Cuando no hay disponibilidad, ofrece fechas alternativas en lugar de un vacío.
- **Calendario de la ficha**: las noches ocupadas no son seleccionables (\`line-through\`,
  color #b7bcc4). Las noches con estadía mínima muestran la condición al seleccionarse.
- **Reserva**: cada paso conserva el resumen. El total no cambia entre la revisión y el
  pago. La retención temporal se muestra con cuenta atrás y, al expirar, se revalida
  disponibilidad antes de reconstruir el carrito.
- **Pago**: redirección a la pasarela y regreso a una página de resultado por estado
  (aprobado, pendiente, rechazado, cancelado, expirado). El webhook es la fuente de
  verdad, no el retorno del navegador.
- **Acciones críticas del admin** (bloquear, mover, cambiar precio, cancelar, reembolsar,
  eliminar): confirmación previa que enumera habitación, fechas, reservas afectadas y
  disponibilidad resultante.
- **Hover y foco**: los botones primarios oscurecen a #2c4159; el foco es un anillo de
  2px #D4AF37 con \`outline-offset: 2px\` sobre fondos claros. Nunca dejar el anillo azul
  por defecto del navegador.
- **Estados que hay que implementar, no solo el caso ideal**: cargando (skeletons),
  sin resultados, sin disponibilidad, fechas inválidas, formulario incompleto, error de
  conexión, error de pago, pago pendiente, sesión expirada, reserva duplicada, conflicto
  de disponibilidad, habitación fuera de servicio, calendario vacío, sin reseñas, sin
  fotografías, sin reservas, permiso insuficiente y error de sincronización con Airbnb.
- **Responsive**: móvil primero. El buscador se divide en pasos, el CTA de reserva queda
  fijo abajo, las galerías responden a gestos, el calendario nunca se comprime hasta
  volverse ambiguo, y el administrador debe poder bloquear fechas y revisar reservas
  desde el teléfono.

## State Management

Estado del prototipo: una sola variable, \`screen\`, que elige la pantalla visible. En la
implementación real desaparece y la sustituye el router.

Estado que sí necesita la aplicación:
- **Búsqueda**: llegada, salida, adultos, niños con edades, habitaciones, código
  promocional. Persistente entre páginas (query string o store).
- **Selección**: lista de habitaciones elegidas con su plan tarifario y sus servicios.
- **Retención**: id del hold y \`expira_en\`, con temporizador visible y revalidación al
  expirar.
- **Reserva en curso**: datos del titular, acompañantes, facturación, consentimientos.
- **Pago**: estado de la transacción, sincronizado por webhook, nunca solo por el retorno.
- **Admin**: filtros de tabla, rango del calendario, selección múltiple de celdas para la
  edición masiva de tarifas, y cola de acciones pendientes de confirmación.

Datos a traer del servidor: disponibilidad por habitación y noche, precio por noche,
reglas de estadía, servicios activos con cupo, políticas vigentes y estado de
sincronización iCal.

## Design Tokens

Colores de marca:
- Marfil (base) #F5F5F0
- Azul carbón (texto, header, primario) #1D2A3A
- Dorado mostaza (detalles, líneas, botón secundario) #D4AF37
- Rosa bugambilia (alertas y errores) #F26B8A
- Verde natural (éxito, disponible, WhatsApp) #50C878
- Azul fresco (información) #337AB7

Superficies y texto:
- Superficie clara #FFFFFF · superficie cálida #EAE9E1 · panel admin #F1F0EA
- Texto principal #1D2A3A · secundario #4a5462 · terciario #767f8c · deshabilitado #b7bcc4
- Divisor rgba(29,42,58,.08) a rgba(29,42,58,.14)

Pares de estado (fondo / texto):
- Éxito #E8F7EC / #1E6B32
- Advertencia #FFF6DC / #8A6A0B · pendiente #FFF9E8 / #8A6A0B
- Error #FFE3EA / #C2385A · error suave #FFF3F6 / #C2385A
- Información #EDF4FB / #1F5A8C
- Neutro #EDECE5 / #5b6472 · bloqueo #E4E2DA / #5b6472
- Dorado sobre texto pequeño: usar #B08D1F, nunca #D4AF37 (no alcanza 4,5:1 sobre marfil)

Tipografía:
- Encabezados Merriweather 700, letter-spacing -.012em, line-height 1.12-1.2
  Escala: 74 (hero) · 38 · 34 · 33 · 30 · 26 · 25 · 22 · 21 · 20 · 19 · 18 · 17
  Antetítulo editorial: Merriweather 300 itálica, 17-19px, color #B08D1F o #D4AF37
- Cuerpo Montserrat 300/400/500/600
  Escala: 16 · 15 · 14.5 · 13.5 · 13 · 12.5 · 12 · 11.5 · 11 · 10.5 · 10 · 9.5
- Etiqueta de sección: 10px, 600, uppercase, letter-spacing .20-.22em
- Etiqueta de dato: 10.5px, uppercase, letter-spacing .06-.08em, color #8b939f

Espaciado (escala en px): 4 · 9 · 13 · 18 · 26 · 35
Ritmo de sección pública: \`padding: 76px 38px 0\`; contenedor \`max-width: 1180px\`.
Ritmo admin: \`padding: 26px 30px 60px\`; separación entre tarjetas 16px.

Radios: 8 (menor) · 14-16 (campos y bloques internos) · 20-22 (tarjetas admin) ·
24-30 (tarjetas y secciones públicas) · 999 (todos los botones, chips y campos).

Sombras:
- Tarjeta \`0 2px 10px rgba(29,42,58,.07)\`
- Elevada \`0 4px 18px rgba(29,42,58,.09)\`
- Flotante \`0 12px 34px rgba(29,42,58,.16)\` y \`0 14px 38px rgba(29,42,58,.18)\`
- Header adherido \`0 2px 14px rgba(29,42,58,.28)\`

Iconografía: el diseño evita el icono decorativo. Donde hace falta una marca, usa un
rombo dorado de 9px (\`transform: rotate(45deg)\`) o un punto de 5-6px. Si el codebase ya
tiene un set de iconos, usarlo; no introducir uno nuevo por esta entrega.

## Breakpoints

- Móvil ≤ 599 px — prioridad; buscador en pasos, CTA fijo abajo, galerías por gestos.
- Tablet 600-1023 px — dos columnas; el resumen de precio pasa a bloque fijo inferior.
- Escritorio 1024-1439 px — resumen pegajoso a la derecha, tablas admin completas.
- Amplio ≥ 1440 px — contenido centrado a 1180 px máximo.

## Accesibilidad y SEO

- Contraste 4,5:1 en texto y 3:1 en titulares. El dorado #D4AF37 solo en texto grande,
  íconos y bordes; para texto pequeño en dorado usar #B08D1F.
- Áreas táctiles mínimas de 44 px, incluidas las celdas del calendario.
- Foco visible con anillo de 2px dorado y \`outline-offset: 2px\`.
- Cada campo con \`label\` asociado; errores específicos junto al campo.
- Texto alternativo obligatorio al subir imágenes: sin él la galería no publica.
- Datos estructurados schema.org: LodgingBusiness, Room, Offer, Review, FAQPage.
- Imágenes en WebP con \`srcset\` y carga diferida bajo el primer pantallazo.
- Navegación completa por teclado en el calendario maestro y en el motor de reservas.

## Modelo de datos mínimo

Nueve entidades sostienen el producto. La pantalla "Especificaciones dev" del prototipo
las lista con sus campos; resumen:

- **Room** — id, nombre, slug, capacidad_adultos, capacidad_ninos, cama, m2, vista, bano,
  precio_base, anticipo_pct, estadia_min, orden, visible, venta_cerrada, seo.
  No se elimina si tiene reservas futuras.
- **RatePlan** — id, room_id, nombre, reembolsable, anticipo_pct, politica_cancelacion_id.
- **Availability** — room_id, fecha, precio, estadia_min, estadia_max, cerrado,
  anticipacion_min. Una fila por habitación y noche: es la fuente de verdad del precio.
- **Booking** — id, codigo, room_id, rate_plan_id, llegada, salida, adultos, ninos,
  estado, canal, total, impuestos, anticipo, saldo, hold_expira_en.
  Estados: borrador, pendiente_pago, pago_parcial, confirmada, en_curso, completada,
  cancelada, no_show, reembolsada, reembolso_parcial.
  Canales: directo, airbnb, whatsapp, telefono.
- **BookingHold** — id, room_id, llegada, salida, session_id, expira_en.
- **Guest** — id, nombre, apellidos, doc_tipo, doc_numero, pais, ciudad, telefono, correo,
  consentimientos, etiquetas, notas_privadas. Acompañantes como filas hijas del booking.
- **Payment** — id, booking_id, referencia, metodo, estado, valor, comision,
  comprobante_url, fecha. **Nunca guardar PAN, CVV ni datos de tarjeta.**
- **Block** — id, room_id, desde, hasta, tipo (manual | mantenimiento | cortesia | airbnb),
  motivo, origen, ical_uid.
- **Review** — id, booking_id, autor, puntajes[5], texto, estado, respuesta, destacada.
  Sin booking_id no se puede publicar.

## Reglas de negocio no negociables

Se implementan **en el servidor**. Si alguna falla, el negocio sobrevende.

1. **Disponibilidad en el servidor, siempre.** La consulta pública, la creación de la
   reserva y la confirmación del pago comprueban disponibilidad de forma independiente.
   El cliente nunca decide si hay cupo.
2. **Retención con expiración.** Al entrar al pago se crea un BookingHold con
   \`expira_en\`. Mientras vive, esas noches no se venden. Un job libera los vencidos;
   una reserva pendiente nunca bloquea inventario de forma indefinida.
3. **Una noche, una fuente.** La disponibilidad de una noche es la unión de Booking
   activos y Block. Si aparece en cualquiera de los dos, la web la muestra ocupada.
4. **iCal no es tiempo real.** La importación corre cada hora y la exportación depende de
   cuándo Airbnb consulte el enlace. La interfaz debe decirlo, y el bloqueo manual queda
   como respaldo para fechas críticas.
5. **Los conflictos se resuelven a mano.** Un solapamiento entre reserva directa y evento
   importado genera alerta y no cancela nada automáticamente.
6. **Precio transparente desde el paso 1.** Impuestos y cargos se muestran en los
   resultados de búsqueda, no en el último paso. El total no cambia entre revisión y pago.
7. **Cambios y cancelaciones como solicitud.** Si la petición incumple la política, se
   guarda como solicitud pendiente y notifica al administrador. Nada se aprueba solo.
8. **Historial de todo lo importante.** Cambios de fecha, habitación, precio, estado y
   pago quedan registrados con usuario, fecha y valor anterior.

## Endpoints previstos

Núcleo de reservas y disponibilidad. Los CRUD del admin siguen el patrón habitual.

    GET   /api/availability?in=&out=&adults=&children=&rooms=
          Habitaciones disponibles con precio, impuestos y condiciones
    GET   /api/rooms/:slug/calendar?month=
          Calendario por habitación con precio y estadía mínima por noche
    POST  /api/holds
          Crea la retención temporal y devuelve expira_en
    POST  /api/bookings
          Revalida disponibilidad y crea la reserva en estado pendiente
    POST  /api/bookings/:id/payments
          Inicia el pago en la pasarela y devuelve la URL de redirección
    POST  /api/webhooks/payments
          Webhook de la pasarela: confirma, revalida y libera o consolida el hold
    GET   /api/bookings/lookup?code=&email=
          Portal del huésped sin cuenta, con enlace firmado
    POST  /api/admin/blocks
          Bloqueo manual con motivo y vista previa del impacto
    POST  /api/admin/ical/sync
          Importación manual por habitación y registro del resultado

## Pasarela de pagos

Diseñado para una pasarela colombiana (Wompi o Mercado Pago; la elección final es del
cliente). Contempla tarjeta débito y crédito, PSE, transferencia bancaria manual con
carga de comprobante y aprobación administrativa, pago total o anticipo porcentual, y
moneda COP con USD previsto pero desactivado. Estados a implementar: aprobado,
pendiente, rechazado, cancelado, sesión expirada y reintento.

## Notificaciones

21 plantillas, dos renderizadas en el prototipo. Cada una se activa o desactiva por
separado y declara su canal: correo, WhatsApp o ambos. Las variables entre dobles llaves
(\`nombre\`, \`codigo\`, \`habitacion\`, \`fecha_llegada\`, \`fecha_salida\`, \`saldo\`) se
resuelven en el envío. La integración de WhatsApp se implementa después, pero el diseño y
el modelo ya la contemplan.

## Orden de construcción sugerido

Cada fase deja algo utilizable en producción.

- **Fase 1 — Disponibilidad y reserva.** Modelo de datos, motor de búsqueda, retención,
  pago y confirmación. Sitio público mínimo: Inicio, Habitaciones y ficha.
  *Lo que ya vende.*
- **Fase 2 — Operación diaria.** Calendario maestro, reservas, bloqueos manuales, pagos y
  transferencias por verificar. Login con roles. *Lo que evita sobreventa.*
- **Fase 3 — Contenido y canales.** CMS, galería, reseñas verificadas, sincronización
  iCal, plantillas de correo y WhatsApp, portal del huésped.
  *Lo que reduce trabajo manual.*
- **Fase 4 — Medición y ajuste.** Reportes, tarifas por temporada, códigos promocionales,
  analítica de conversión y datos estructurados. *Lo que sube el margen.*

## Assets

- **Fotografía**: pendiente. El cliente no entregó imágenes. Todos los marcos de imagen
  del prototipo están vacíos y llevan una descripción de lo que corresponde
  ("Fachada, patio o rooftop al atardecer", "Patio de la bugambilia", "Magdalena — vista
  general", etc.). Sustituir por la fotografía real; toda imagen se administra desde el
  módulo Galería y se asocia a habitaciones.
- **Logotipo**: el prototipo usa un logotipo tipográfico en Merriweather ("Valema" +
  descriptor "Casa turística" en dorado). Si el cliente entrega un logotipo del manual de
  marca, sustituirlo manteniendo la proporción y el uso del dorado.
- **Tipografías**: Merriweather y Montserrat, ambas en Google Fonts.
  \`https://fonts.googleapis.com/css2?family=Merriweather:ital,wght@0,300;0,400;0,700;0,900;1,300&family=Montserrat:wght@300;400;500;600;700&display=swap\`
- **Iconos**: el diseño no depende de un set. Usar el que ya tenga el codebase.
- **Mapa**: el prototipo dibuja un mapa esquemático como referencia de composición.
  Sustituir por Google Maps embebido o MapLibre. La dirección exacta se muestra u oculta
  según una opción de Configuración.

## Nota sobre la referencia de categoría

El cliente mencionó El Marqués Hotel Boutique como referencia. Se tomó únicamente su
**estructura comercial** — hero editorial a pantalla completa, casa con historia y
cifras, grilla de habitaciones, espacios, galería, ubicación con mapa, footer de tres
columnas y botón flotante de WhatsApp. Paleta, tipografía, composición y copy son
originales de Valema. No reproducir diseño, fotografías ni textos de ese sitio.

## Files

- \`Casa Valema.dc.html\` — el prototipo completo: 27 pantallas con conmutador en la barra
  superior. Incluye dos pantallas de documentación ("Mapa y flujos" y
  "Especificaciones dev") que conviene leer antes de empezar.
- \`image-slot.js\` — componente de los marcos de imagen del prototipo. Es andamiaje de
  diseño: no se lleva a producción.
- \`support.js\` — runtime del prototipo. No se lleva a producción.
- \`_ds/\` — hoja de tokens del sistema visual base sobre la que se construyó el
  prototipo. Los valores finales que importan están listados en "Design Tokens" arriba.

Para ver el prototipo: abrir \`Casa Valema.dc.html\` en un navegador y recorrer las
pantallas con la barra superior.
