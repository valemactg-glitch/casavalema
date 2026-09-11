import { PrismaClient, Prisma } from "@prisma/client";
import { addDays, format } from "date-fns";
import { hashPassword } from "../lib/auth/password";

const db = new PrismaClient();

// ════════════════════════════════════════════════════════════════
// Contenido de muestra creíble. Todo esto es editable desde el
// portal administrativo (Fase 2) — no es relleno ni placeholder.
// Las etiquetas de amenidades viven en lib/catalog.ts.
// ════════════════════════════════════════════════════════════════

type RoomSeed = {
  slug: string;
  nombre: string;
  descripcionCorta: string;
  descripcionLarga: string;
  capacidadAdultos: number;
  capacidadNinos: number;
  cama: string;
  tamanoM2: number;
  vista: string;
  banoPrivado: boolean;
  ubicacionEnCasa: string;
  precioBase: number;
  estadiaMin: number;
  servicios: string[];
  reglas: { clave: string; valor: string }[];
  imagenes: { alt: string; pie?: string }[];
};

const REGLAS_COMUNES = [
  { clave: "Check-in", valor: "Desde las 15:00, con llegada coordinada" },
  { clave: "Check-out", valor: "Hasta las 11:00" },
  { clave: "Niños", valor: "Bienvenidos. Menores de 3 años sin costo, sin cuna disponible" },
  { clave: "Mascotas", valor: "No se admiten, salvo perros de asistencia" },
  { clave: "Fumar", valor: "Prohibido en toda la casa. Permitido en el rooftop" },
  { clave: "Eventos", valor: "No se permiten fiestas ni reuniones" },
];

const ROOMS: RoomSeed[] = [
  {
    slug: "valentina",
    nombre: "Valentina",
    descripcionCorta:
      "La primera del corredor, con ventana al patio y una silla junto a la luz. Tranquila y fresca a toda hora.",
    descripcionLarga:
      "Valentina abre el corredor de la casa. Es la habitación de las mañanas lentas: la ventana da al patio de la bugambilia y entra una luz suave que nunca encandila. Tiene lo justo y bien puesto —una cama cómoda, un rincón para leer, un clóset de verdad— y el baño privado a un paso. Si viajas por trabajo o quieres descansar sin ruido, esta es la que te recomendamos.",
    capacidadAdultos: 2,
    capacidadNinos: 0,
    cama: "Cama queen",
    tamanoM2: 18,
    vista: "Patio interior",
    banoPrivado: true,
    ubicacionEnCasa: "Planta baja, inicio del corredor",
    precioBase: 210000,
    estadiaMin: 1,
    servicios: ["wifi", "agua_caliente", "ropa_cama_algodon", "toallas", "amenities_bano", "secador", "closet", "ventana_patio", "acceso_rooftop"],
    reglas: REGLAS_COMUNES,
    imagenes: [
      { alt: "Valentina — vista general de la habitación con la cama y la ventana al patio" },
      { alt: "Valentina — rincón de lectura junto a la ventana" },
      { alt: "Valentina — baño privado" },
    ],
  },
  {
    slug: "elena",
    nombre: "Elena",
    descripcionCorta:
      "Amplia, con escritorio junto a la ventana y buena ventilación cruzada. Cómoda para estadías largas.",
    descripcionLarga:
      "Elena es la habitación para quedarse varios días. Tiene un escritorio real frente a la ventana, ventilación cruzada que mantiene el cuarto fresco y espacio de sobra para desarmar la maleta. La cama es queen, con ropa de cama de algodón, y el baño privado tiene ducha de agua caliente y buena presión. Desde aquí se sube al rooftop en menos de un minuto.",
    capacidadAdultos: 2,
    capacidadNinos: 1,
    cama: "Cama queen",
    tamanoM2: 22,
    vista: "Calle tranquila",
    banoPrivado: true,
    ubicacionEnCasa: "Planta baja, mitad del corredor",
    precioBase: 260000,
    estadiaMin: 1,
    servicios: ["wifi", "agua_caliente", "ropa_cama_algodon", "toallas", "amenities_bano", "secador", "closet", "escritorio", "ventilador", "tv", "acceso_rooftop"],
    reglas: REGLAS_COMUNES,
    imagenes: [
      { alt: "Elena — vista general con la cama y el escritorio junto a la ventana" },
      { alt: "Elena — escritorio de trabajo" },
      { alt: "Elena — baño privado con ducha" },
    ],
  },
  {
    slug: "magdalena",
    nombre: "Magdalena",
    descripcionCorta:
      "La más grande de la casa. Cabe una tercera persona y tiene el mejor rincón para trabajar.",
    descripcionLarga:
      "Magdalena es nuestra habitación más espaciosa. Entra una tercera persona con comodidad —cama queen más un sofá cama— y hay un escritorio con silla ergonómica y buena luz para quienes trabajan viajando. El baño privado es el más grande de la casa. Tiene aire acondicionado además del ventilador de techo, para las tardes de calor.",
    capacidadAdultos: 3,
    capacidadNinos: 1,
    cama: "Cama queen + sofá cama",
    tamanoM2: 26,
    vista: "Patio interior",
    banoPrivado: true,
    ubicacionEnCasa: "Planta baja, final del corredor",
    precioBase: 290000,
    estadiaMin: 2,
    servicios: ["wifi", "agua_caliente", "ropa_cama_algodon", "toallas", "amenities_bano", "secador", "closet", "escritorio", "tv", "aire", "ventilador", "cafetera", "acceso_rooftop"],
    reglas: REGLAS_COMUNES,
    imagenes: [
      { alt: "Magdalena — vista general de la habitación" },
      { alt: "Magdalena — escritorio y ventana" },
      { alt: "Magdalena — baño privado" },
      { alt: "Magdalena — rincón del sofá cama" },
    ],
  },
  {
    slug: "aurora",
    nombre: "Aurora",
    descripcionCorta:
      "Acogedora y luminosa, la de mejor relación precio. Ideal para una noche o un fin de semana corto.",
    descripcionLarga:
      "Aurora es pequeña, luminosa y sin pretensiones —y por eso muchos vuelven a ella. Tiene todo lo necesario para dormir bien: cama cómoda, ropa de cama de algodón, baño privado y una ventana alta por la que entra el sol de la mañana. Es la opción más económica de la casa sin renunciar a nada esencial.",
    capacidadAdultos: 2,
    capacidadNinos: 0,
    cama: "Cama matrimonial",
    tamanoM2: 14,
    vista: "Tejados del barrio",
    banoPrivado: true,
    ubicacionEnCasa: "Planta alta, junto a la escalera",
    precioBase: 185000,
    estadiaMin: 1,
    servicios: ["wifi", "agua_caliente", "ropa_cama_algodon", "toallas", "amenities_bano", "closet", "ventilador", "acceso_rooftop"],
    reglas: REGLAS_COMUNES,
    imagenes: [
      { alt: "Aurora — vista general con la cama y la ventana alta" },
      { alt: "Aurora — detalle de la ropa de cama" },
      { alt: "Aurora — baño privado" },
    ],
  },
  {
    slug: "alma",
    nombre: "Alma",
    descripcionCorta:
      "La habitación familiar. Dos camas, espacio para cuatro y salida directa al rooftop.",
    descripcionLarga:
      "Alma está pensada para viajar en familia o entre amigos. Tiene una cama queen y dos individuales, clóset amplio y la salida más directa al rooftop de toda la casa: se abre la puerta y ya estás arriba. El baño privado es cómodo y hay aire acondicionado para las noches cálidas. Es la más grande en capacidad y la que mejor funciona para grupos.",
    capacidadAdultos: 4,
    capacidadNinos: 2,
    cama: "Cama queen + dos individuales",
    tamanoM2: 28,
    vista: "Rooftop y cielo abierto",
    banoPrivado: true,
    ubicacionEnCasa: "Planta alta, acceso al rooftop",
    precioBase: 340000,
    estadiaMin: 2,
    servicios: ["wifi", "agua_caliente", "ropa_cama_algodon", "toallas", "amenities_bano", "secador", "closet", "tv", "aire", "ventilador", "cafetera", "acceso_rooftop"],
    reglas: REGLAS_COMUNES,
    imagenes: [
      { alt: "Alma — vista general con las tres camas" },
      { alt: "Alma — salida al rooftop" },
      { alt: "Alma — baño privado" },
      { alt: "Alma — detalle del clóset" },
    ],
  },
];

const RATE_PLANS = [
  {
    nombre: "Tarifa flexible",
    reembolsable: true,
    anticipoPct: 30,
    descuentoPct: 0,
    politicaCancelacion:
      "Cancelación gratuita hasta 5 días antes de la llegada. Después, se retiene el anticipo del 30 %.",
  },
  {
    nombre: "No reembolsable",
    reembolsable: false,
    anticipoPct: 100,
    descuentoPct: 12,
    politicaCancelacion:
      "Tarifa con 12 % de descuento. El pago es total por adelantado y no admite cambios ni reembolsos.",
  },
];

const SERVICES = [
  {
    slug: "desayuno",
    nombre: "Desayuno casero",
    descripcion:
      "Fruta de la temporada, huevos al gusto, pan del día y café de origen. Servido en el rooftop entre las 7:30 y las 9:30.",
    precio: 22000,
    tipoCobro: "POR_HUESPED" as const,
    disponibilidad: "ADICIONAL" as const,
    cupo: 10,
    anticipacionHoras: 18,
    orden: 1,
  },
  {
    slug: "traslado-aeropuerto",
    nombre: "Traslado desde el aeropuerto",
    descripcion:
      "Recogida en el aeropuerto o la terminal con un conductor de confianza. Un vehículo para hasta 4 personas con equipaje.",
    precio: 75000,
    tipoCobro: "UNA_VEZ" as const,
    disponibilidad: "ADICIONAL" as const,
    cupo: null,
    anticipacionHoras: 24,
    orden: 2,
  },
  {
    slug: "check-in-temprano",
    nombre: "Check-in anticipado",
    descripcion:
      "Entra antes de las 15:00, sujeto a que la habitación esté lista. Confirmamos el mismo día de la llegada.",
    precio: 35000,
    tipoCobro: "UNA_VEZ" as const,
    disponibilidad: "BAJO_SOLICITUD" as const,
    cupo: null,
    anticipacionHoras: 12,
    orden: 3,
  },
  {
    slug: "check-out-tardio",
    nombre: "Check-out tardío",
    descripcion:
      "Quédate hasta las 14:00 el día de salida. Sujeto a disponibilidad de la habitación.",
    precio: 35000,
    tipoCobro: "UNA_VEZ" as const,
    disponibilidad: "BAJO_SOLICITUD" as const,
    cupo: null,
    anticipacionHoras: 12,
    orden: 4,
  },
  {
    slug: "decoracion-especial",
    nombre: "Decoración de celebración",
    descripcion:
      "Flores frescas, globos y una nota escrita a mano para un cumpleaños o un aniversario. Lista antes de tu llegada.",
    precio: 90000,
    tipoCobro: "UNA_VEZ" as const,
    disponibilidad: "ADICIONAL" as const,
    cupo: 2,
    anticipacionHoras: 48,
    orden: 5,
  },
  {
    slug: "lavanderia",
    nombre: "Lavandería",
    descripcion:
      "Lavado, secado y doblado. Entregas antes de las 10:00 y recibes tu ropa al día siguiente.",
    precio: 28000,
    tipoCobro: "POR_HABITACION" as const,
    disponibilidad: "BAJO_SOLICITUD" as const,
    cupo: null,
    anticipacionHoras: 0,
    orden: 6,
  },
];

const FAQ = [
  { categoria: "Reservas", pregunta: "¿Puedo reservar más de una habitación?", respuesta: "Sí. En el buscador indica el número de habitaciones y podrás elegirlas y pagarlas en una sola compra." },
  { categoria: "Reservas", pregunta: "¿Con cuánta anticipación debo reservar?", respuesta: "Puedes reservar hasta el mismo día si hay disponibilidad. Para fechas de temporada alta te recomendamos hacerlo con varias semanas de anticipación." },
  { categoria: "Reservas", pregunta: "¿Hay estadía mínima?", respuesta: "Depende de la habitación y la fecha. El buscador te lo indica antes de reservar; en temporada alta suele ser de dos o tres noches." },
  { categoria: "Pagos", pregunta: "¿Qué medios de pago aceptan?", respuesta: "Tarjeta débito y crédito, PSE y transferencia bancaria. Los pagos con tarjeta y PSE los procesa una pasarela; Valema nunca guarda los datos de tu tarjeta." },
  { categoria: "Pagos", pregunta: "¿Debo pagar todo al reservar?", respuesta: "Con la tarifa flexible pagas un anticipo del 30 % y el saldo al llegar. La tarifa no reembolsable se paga completa por adelantado." },
  { categoria: "Pagos", pregunta: "¿La transferencia confirma la reserva de inmediato?", respuesta: "No. La transferencia queda pendiente de verificación; la revisamos y te confirmamos, normalmente en menos de 12 horas. Mientras tanto, mantenemos tus fechas apartadas." },
  { categoria: "Cancelaciones", pregunta: "¿Puedo cancelar sin costo?", respuesta: "Con la tarifa flexible, sí: hasta 5 días antes de la llegada. Después se retiene el anticipo. La tarifa no reembolsable no admite cancelación." },
  { categoria: "Cancelaciones", pregunta: "¿Puedo cambiar las fechas de mi reserva?", respuesta: "Puedes solicitarlo desde 'Mi reserva'. Si el cambio cumple la política, lo aprobamos; si no, queda como solicitud y te contactamos." },
  { categoria: "Llegada y salida", pregunta: "¿A qué hora es el check-in y el check-out?", respuesta: "Check-in desde las 15:00 y check-out hasta las 11:00. Coordinamos contigo la hora exacta de llegada." },
  { categoria: "Llegada y salida", pregunta: "¿Cómo recibo las instrucciones para llegar?", respuesta: "Te llegan por correo al confirmar la reserva y un recordatorio el día antes. Incluyen la dirección exacta y cómo entrar." },
  { categoria: "Niños", pregunta: "¿Puedo viajar con niños?", respuesta: "Sí, son bienvenidos. Los menores de 3 años no pagan; no tenemos cuna, así que si la necesitas avísanos y te decimos opciones cercanas." },
  { categoria: "Mascotas", pregunta: "¿Aceptan mascotas?", respuesta: "No podemos recibir mascotas, salvo perros de asistencia debidamente acreditados." },
  { categoria: "Rooftop", pregunta: "¿El rooftop tiene costo?", respuesta: "No. El rooftop es de uso libre para quienes se hospedan, entre las 7:00 y las 22:00." },
  { categoria: "Rooftop", pregunta: "¿Se puede reservar el rooftop para un evento?", respuesta: "Hoy no ofrecemos el rooftop para eventos privados. Es un espacio compartido de la casa." },
  { categoria: "Ubicación", pregunta: "¿Dónde está la casa exactamente?", respuesta: "Compartimos la dirección exacta al confirmar la reserva, por seguridad. Antes de reservar te indicamos el sector y las distancias a los puntos de interés." },
  { categoria: "Ubicación", pregunta: "¿Hay parqueadero?", respuesta: "No tenemos parqueadero propio. Hay parqueaderos públicos a menos de dos cuadras; te pasamos las opciones." },
  { categoria: "Facturación", pregunta: "¿Me pueden dar factura?", respuesta: "Sí. Indícalo en el paso de datos de la reserva o escríbenos con tus datos de facturación." },
  { categoria: "Seguridad", pregunta: "¿La casa es segura?", respuesta: "El sector es residencial y tranquilo. La casa tiene acceso controlado y cada habitación cierra con llave. Te explicamos todo al llegar." },
];

const LEGALES = [
  ["terminos-y-condiciones", "Términos y condiciones"],
  ["politica-de-privacidad", "Política de privacidad"],
  ["tratamiento-de-datos", "Política de tratamiento de datos personales"],
  ["politica-de-cookies", "Política de cookies"],
  ["politica-de-reservas", "Política de reservas"],
  ["politica-de-pagos", "Política de pagos"],
  ["politica-de-cancelaciones", "Política de cancelaciones, cambios y reembolsos"],
  ["reglamento-de-alojamiento", "Reglamento de alojamiento"],
  ["politica-de-ninos", "Política de niños"],
  ["politica-de-mascotas", "Política de mascotas"],
  ["autorizacion-de-comunicaciones", "Autorización para comunicaciones"],
];

const legalBody = (titulo: string) =>
  [
    `# ${titulo}`,
    "",
    "_Documento de muestra. El texto legal definitivo lo revisa el cliente antes de publicar._",
    "",
    "## 1. Responsable",
    "Casa Turística Valema, con domicilio en Colombia. Datos de contacto y registro comercial editables desde Configuración del portal administrativo.",
    "",
    "## 2. Alcance",
    "Este documento regula la relación entre Casa Turística Valema y las personas que reservan o se hospedan a través del sitio web.",
    "",
    "## 3. Contenido",
    "El contenido específico de esta política se completará con el texto aprobado por el cliente. Mientras tanto, aplican las condiciones comunicadas durante el proceso de reserva y confirmadas por correo.",
    "",
    "## 4. Vigencia",
    "Esta versión rige desde su publicación y reemplaza cualquier versión anterior.",
  ].join("\n");

const REVIEWS = [
  { autor: "María C.", roomSlug: "magdalena", limpieza: 5, ubicacion: 5, atencion: 5, comodidad: 5, precio: 4, texto: "Nos quedamos cuatro noches y no quisimos irnos. La habitación es grande de verdad y el rooftop al atardecer es otra cosa. Marcela estuvo pendiente de todo sin ser invasiva.", destacada: true, diasAtras: 22 },
  { autor: "Andrés y Paula", roomSlug: "elena", limpieza: 5, ubicacion: 4, atencion: 5, comodidad: 5, precio: 5, texto: "Viajamos por trabajo y el escritorio de Elena nos salvó la semana. Wifi impecable, cama muy cómoda y el barrio es tranquilísimo.", destacada: false, diasAtras: 35 },
  { autor: "Laura V.", roomSlug: "valentina", limpieza: 5, ubicacion: 5, atencion: 5, comodidad: 4, precio: 5, texto: "La ventana al patio, el silencio, el café de la mañana. Valentina es pequeña pero está pensada con cariño. Volvería sin dudarlo.", destacada: true, diasAtras: 48 },
  { autor: "J. Restrepo", roomSlug: "aurora", limpieza: 4, ubicacion: 5, atencion: 5, comodidad: 4, precio: 5, texto: "Fui por una noche entre vuelos y fue justo lo que necesitaba: limpio, cómodo y a buen precio. La llegada fue muy fácil.", destacada: false, diasAtras: 60 },
  { autor: "Familia Ochoa", roomSlug: "alma", limpieza: 5, ubicacion: 4, atencion: 5, comodidad: 5, precio: 4, texto: "Éramos cuatro y en Alma cupimos sin apretarnos. Los niños felices con el rooftop. La casa entera huele a limpio y a flores.", destacada: false, diasAtras: 74 },
  { autor: "Camila S.", roomSlug: "elena", limpieza: 5, ubicacion: 5, atencion: 4, comodidad: 5, precio: 4, texto: "Todo tal cual las fotos. El desayuno casero vale cada peso. Pedimos check-out tardío y no hubo problema.", destacada: false, diasAtras: 91 },
];

const GALLERY: [string, string, string | null, string][] = [
  ["fachada", "Fachada de la casa con la bugambilia sobre la entrada", "La bugambilia da nombre a la casa", "/foto3.png"],
  ["fachada", "Zaguán de entrada con piso de baldosa antigua", null, ""],
  ["comunes", "Patio interior con plantas y una banca de madera", "El patio, corazón de la casa", ""],
  ["comunes", "Sala común con sillones y biblioteca", null, ""],
  ["comunes", "Comedor con mesa larga de madera", null, ""],
  ["rooftop", "Rooftop al atardecer con pérgola de bugambilia y vista al valle", "El rooftop cuando baja el sol", "/foto4.png"],
  ["rooftop", "Desayuno servido en la terraza con vista a las montañas", null, "/foto1.png"],
  ["rooftop", "Vista de los tejados del barrio desde el rooftop", null, ""],
  ["habitaciones", "Detalle de ropa de cama de algodón con luz de mañana", null, ""],
  ["habitaciones", "Baño privado con acabados contemporáneos", null, ""],
  ["entorno", "Calle arbolada del barrio", "Un barrio residencial y tranquilo", ""],
  ["entorno", "Café de esquina a una cuadra de la casa", null, ""],
  ["experiencias", "Rama de bugambilia en flor", null, "/foto2.png"],
  ["experiencias", "Mercado de frutas local", null, ""],
];

const SITE_PAGES = [
  {
    clave: "home",
    titulo: "Inicio",
    contenido: {
      heroKicker: "Bienvenido a",
      heroTitulo: "Valema",
      heroTexto:
        "Cinco habitaciones independientes, cada una con su nombre y su carácter, y un rooftop donde la tarde se alarga. Consulta disponibilidad ahora mismo y reserva sin intermediarios.",
      cifras: [
        { valor: "5", etiqueta: "Habitaciones" },
        { valor: "4,9", etiqueta: "Calificación" },
        { valor: "2 min", etiqueta: "Al rooftop" },
      ],
    },
  },
  {
    clave: "la-casa",
    titulo: "La casa",
    contenido: {
      kicker: "La casa · nuestra historia",
      titulo: "Una casa de familia que aprendió a recibir",
      intro: "Tradición de la casa, comodidad de ahora.",
      historia:
        "Valema fue durante décadas la casa de una familia. Cuando quedó grande, en lugar de dividirla o venderla, decidimos abrirla: arreglamos las cinco habitaciones una por una, respetando la baldosa, los techos altos y el patio, y les pusimos nombre de las mujeres que vivieron aquí. Hoy la casa recibe huéspedes, pero sigue oliendo a lo mismo —a flores del patio y a café de la mañana.",
      capacidad: "Hasta 13 huéspedes en total, en cinco habitaciones independientes.",
    },
  },
  {
    clave: "rooftop",
    titulo: "Rooftop",
    contenido: {
      kicker: "El rooftop",
      titulo: "Donde termina el día",
      texto:
        "El rooftop es el lugar al que todo el mundo sube sin planearlo. Tiene mesas, hamacas, sombra para el mediodía y luz cálida para la noche. Desde arriba se ven los tejados del barrio y, si hay suerte, un atardecer largo. Es de uso libre para quienes se hospedan.",
      horario: "Abierto de 7:00 a 22:00",
      normas: [
        "Uso compartido: cuida el volumen después de las 21:00.",
        "No se permite mover el mobiliario ni usarlo para eventos privados.",
        "Fumar está permitido solo aquí, en la zona señalizada.",
        "Los niños suben siempre acompañados de un adulto.",
      ],
      futuro:
        "Más adelante queremos ofrecer desayunos servidos, cenas de olla y pequeñas experiencias en el rooftop. Si te interesa, escríbenos y te avisamos cuando estén listas.",
    },
  },
  {
    clave: "ubicacion",
    titulo: "Ubicación",
    contenido: {
      kicker: "Cómo llegar",
      titulo: "En un barrio tranquilo, cerca de todo lo que importa",
      sector:
        "Estamos en un sector residencial, a pocos minutos a pie del centro histórico y de la zona de restaurantes. Por seguridad, la dirección exacta se comparte al confirmar la reserva.",
      distancias: [
        { lugar: "Centro histórico", detalle: "8 min a pie" },
        { lugar: "Zona de restaurantes y cafés", detalle: "5 min a pie" },
        { lugar: "Terminal de transporte", detalle: "15 min en carro" },
        { lugar: "Aeropuerto", detalle: "25–35 min en carro" },
        { lugar: "Parqueadero público más cercano", detalle: "2 cuadras" },
      ],
      recomendaciones: [
        "Café de origen a una cuadra, abre a las 7:00.",
        "Mercado de frutas los sábados en la mañana.",
        "Mirador del cerro: taxi de 10 minutos, mejor al atardecer.",
      ],
    },
  },
  {
    clave: "contacto",
    titulo: "Contacto",
    contenido: {
      telefono: "+57 300 000 0000",
      whatsapp: "573000000000",
      correo: "hola@valema.co",
      horario: "Atendemos todos los días de 8:00 a 20:00 (hora de Colombia)",
      instagram: "casavalema",
    },
  },
];

// ════════════════════════════════════════════════════════════════

function precioNoche(base: number, fecha: Date): number {
  const dow = fecha.getDay(); // 0 dom … 6 sáb
  const finDeSemana = dow === 5 || dow === 6;
  const mes = fecha.getMonth(); // 0-11
  const temporadaAlta = mes === 11 || mes === 0 || mes === 5 || mes === 6; // dic, ene, jun, jul
  let precio = base;
  if (finDeSemana) precio = Math.round((precio * 1.15) / 1000) * 1000;
  if (temporadaAlta) precio = Math.round((precio * 1.2) / 1000) * 1000;
  return precio;
}

async function main() {
  console.log("→ Limpiando…");
  await db.$transaction([
    db.bookingService.deleteMany(),
    db.bookingEvent.deleteMany(),
    db.changeRequest.deleteMany(),
    db.companion.deleteMany(),
    db.payment.deleteMany(),
    db.bookingHold.deleteMany(),
    db.review.deleteMany(),
    db.booking.deleteMany(),
    db.guest.deleteMany(),
    db.availability.deleteMany(),
    db.block.deleteMany(),
    db.roomImage.deleteMany(),
    db.ratePlan.deleteMany(),
    db.room.deleteMany(),
    db.service.deleteMany(),
    db.faqItem.deleteMany(),
    db.legalDoc.deleteMany(),
    db.galleryImage.deleteMany(),
    db.sitePage.deleteMany(),
    db.contactMessage.deleteMany(),
  ]);

  console.log("→ Habitaciones, tarifas, imágenes y disponibilidad…");
  const hoy = new Date();
  const desde = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  const DIAS = 540; // ~18 meses

  for (const [i, r] of ROOMS.entries()) {
    const room = await db.room.create({
      data: {
        slug: r.slug,
        nombre: r.nombre,
        descripcionCorta: r.descripcionCorta,
        descripcionLarga: r.descripcionLarga,
        capacidadAdultos: r.capacidadAdultos,
        capacidadNinos: r.capacidadNinos,
        cama: r.cama,
        tamanoM2: r.tamanoM2,
        vista: r.vista,
        banoPrivado: r.banoPrivado,
        ubicacionEnCasa: r.ubicacionEnCasa,
        precioBase: r.precioBase,
        estadiaMin: r.estadiaMin,
        servicios: r.servicios,
        reglas: r.reglas as unknown as Prisma.InputJsonValue,
        orden: i,
        seoTitulo: `${r.nombre} · habitación en Casa Turística Valema`,
        seoDescripcion: r.descripcionCorta,
        images: {
          create: r.imagenes.map((img, j) => ({
            url: "",
            alt: img.alt,
            pie: img.pie ?? null,
            portada: j === 0,
            orden: j,
          })),
        },
        ratePlans: {
          create: RATE_PLANS.map((p) => ({
            nombre: p.nombre,
            reembolsable: p.reembolsable,
            anticipoPct: p.anticipoPct,
            descuentoPct: p.descuentoPct,
            politicaCancelacion: p.politicaCancelacion,
          })),
        },
      },
    });

    const filas: Prisma.AvailabilityCreateManyInput[] = [];
    for (let d = 0; d < DIAS; d++) {
      const fecha = addDays(desde, d);
      filas.push({
        roomId: room.id,
        fecha,
        precio: precioNoche(r.precioBase, fecha),
        estadiaMin: r.estadiaMin,
        cerrado: false,
        anticipacionMin: 0,
      });
    }
    await db.availability.createMany({ data: filas });
    console.log(`   · ${r.nombre}: ${filas.length} noches`);
  }

  console.log("→ Bloqueos de muestra (mantenimiento + Airbnb)…");
  const alma = await db.room.findUniqueOrThrow({ where: { slug: "alma" } });
  const valentina = await db.room.findUniqueOrThrow({ where: { slug: "valentina" } });
  await db.block.createMany({
    data: [
      {
        roomId: alma.id,
        desde: addDays(desde, 12),
        hasta: addDays(desde, 15),
        tipo: "MANTENIMIENTO",
        motivo: "Pintura y revisión del aire acondicionado",
        origen: "admin:marcela",
      },
      {
        roomId: valentina.id,
        desde: addDays(desde, 5),
        hasta: addDays(desde, 8),
        tipo: "AIRBNB",
        motivo: "Reserva importada de Airbnb",
        origen: "airbnb",
        icalUid: "seed-airbnb-valentina-001",
      },
    ],
  });

  console.log("→ Servicios adicionales…");
  for (const s of SERVICES) {
    await db.service.create({ data: s });
  }

  console.log("→ Preguntas frecuentes…");
  for (const [i, f] of FAQ.entries()) {
    await db.faqItem.create({ data: { ...f, orden: i } });
  }

  console.log("→ Documentos legales…");
  for (const [slug, titulo] of LEGALES) {
    await db.legalDoc.create({
      data: { slug, titulo, cuerpo: legalBody(titulo), version: "1.0" },
    });
  }

  console.log("→ Reseñas verificadas…");
  for (const rv of REVIEWS) {
    const room = await db.room.findUniqueOrThrow({ where: { slug: rv.roomSlug } });
    await db.review.create({
      data: {
        roomId: room.id,
        autor: rv.autor,
        fechaEstadia: addDays(hoy, -rv.diasAtras),
        limpieza: rv.limpieza,
        ubicacion: rv.ubicacion,
        atencion: rv.atencion,
        comodidad: rv.comodidad,
        precio: rv.precio,
        texto: rv.texto,
        estado: "PUBLICADA",
        destacada: rv.destacada,
        respuesta:
          rv.autor === "María C."
            ? "¡Gracias, María! Nos alegra que el rooftop les haya gustado tanto. Aquí los esperamos la próxima."
            : null,
      },
    });
  }

  console.log("→ Galería…");
  for (const [i, [categoria, alt, pie, url]] of GALLERY.entries()) {
    await db.galleryImage.create({
      data: { url, alt, pie: pie ?? null, categoria, orden: i },
    });
  }

  console.log("→ Contenido editable del sitio…");
  for (const p of SITE_PAGES) {
    await db.sitePage.create({
      data: { clave: p.clave, titulo: p.titulo, contenido: p.contenido as Prisma.InputJsonValue },
    });
  }

  await seedAdmin();

  console.log(`\n✔ Seed completo — ${format(new Date(), "yyyy-MM-dd HH:mm")}`);
}

async function seedAdmin() {
  console.log("→ Portal administrativo (usuarios, temporadas, promos, iCal, reservas de muestra)…");

  await db.$transaction([
    db.icalSyncLog.deleteMany(),
    db.icalLink.deleteMany(),
    db.adminSession.deleteMany(),
    db.activityLog.deleteMany(),
    db.user.deleteMany(),
    db.season.deleteMany(),
    db.promoCode.deleteMany(),
    db.emailTemplate.deleteMany(),
    db.setting.deleteMany(),
  ]);

  const pass = hashPassword("valema2026");
  await db.user.createMany({
    data: [
      { email: "marcela@valema.co", nombre: "Marcela Ríos", rol: "PROPIETARIO", passwordHash: pass },
      { email: "admin@valema.co", nombre: "Admin", rol: "ADMINISTRADOR", passwordHash: pass },
      { email: "recepcion@valema.co", nombre: "Recepción", rol: "RECEPCION", passwordHash: pass },
      { email: "contabilidad@valema.co", nombre: "Contabilidad", rol: "CONTABILIDAD", passwordHash: pass },
      { email: "contenido@valema.co", nombre: "Editorial", rol: "EDITOR", passwordHash: pass },
    ],
  });

  const anio = new Date().getFullYear();
  await db.season.createMany({
    data: [
      { nombre: "Temporada alta de fin de año", desde: new Date(Date.UTC(anio, 11, 15)), hasta: new Date(Date.UTC(anio + 1, 0, 15)), ajustePct: 25 },
      { nombre: "Vacaciones de mitad de año", desde: new Date(Date.UTC(anio + 1, 5, 15)), hasta: new Date(Date.UTC(anio + 1, 6, 15)), ajustePct: 18 },
      { nombre: "Semana Santa", desde: new Date(Date.UTC(anio + 1, 2, 24)), hasta: new Date(Date.UTC(anio + 1, 3, 6)), ajustePct: 20 },
    ],
  });

  await db.promoCode.createMany({
    data: [
      { codigo: "VUELVE10", descripcion: "10 % para huéspedes que repiten", tipo: "PORCENTAJE", valor: 10, minNoches: 2, activo: true },
      { codigo: "SEMANA", descripcion: "$120.000 de descuento en estadías de 7+ noches", tipo: "MONTO", valor: 120000, minNoches: 7, activo: true },
      { codigo: "LANZAMIENTO", descripcion: "15 % de apertura (vencido)", tipo: "PORCENTAJE", valor: 15, desde: new Date(Date.UTC(anio - 1, 0, 1)), hasta: new Date(Date.UTC(anio - 1, 11, 31)), activo: false },
    ],
  });

  const allRooms = await db.room.findMany({ orderBy: { orden: "asc" } });
  for (const [i, r] of allRooms.entries()) {
    await db.icalLink.create({
      data: {
        roomId: r.id,
        urlEntrada: i < 2 ? `https://www.airbnb.com/calendar/ical/${100000 + i}.ics?s=demo` : i === 2 ? null : `https://www.airbnb.com/calendar/ical/${100000 + i}.ics?s=demo`,
        ultimaSync: i === 2 ? null : new Date(Date.now() - (i + 1) * 47 * 60_000),
        ultimoResultado: i === 2 ? "Sin enlace iCal configurado" : i === 3 ? "Solapamiento con una reserva directa" : i === 4 ? "El enlace respondió con error 404" : "Al día",
        eventos: i === 0 ? 3 : i === 1 ? 1 : 0,
        activa: i !== 2,
      },
    });
  }

  // Reservas de muestra repartidas en el calendario, para el dashboard y el calendario maestro.
  const flexPlans = new Map(
    (await db.ratePlan.findMany({ where: { reembolsable: true } })).map((p) => [p.roomId, p]),
  );
  const guest = await db.guest.create({
    data: { nombre: "Laura", apellidos: "Medina", docTipo: "CC", docNumero: "52012345", pais: "Colombia", ciudad: "Bogotá", telefono: "3015550123", correo: "laura.medina@example.com", consentimientos: { politicas: true, datos: true } },
  });
  const muestras: { roomIdx: number; inOffset: number; noches: number; estado: string; canal: string }[] = [
    { roomIdx: 0, inOffset: 1, noches: 3, estado: "CONFIRMADA", canal: "DIRECTO" },
    { roomIdx: 1, inOffset: 2, noches: 4, estado: "EN_CURSO", canal: "DIRECTO" },
    { roomIdx: 2, inOffset: 9, noches: 2, estado: "PENDIENTE_PAGO", canal: "DIRECTO" },
    { roomIdx: 0, inOffset: 16, noches: 2, estado: "CONFIRMADA", canal: "AIRBNB" },
    { roomIdx: 3, inOffset: 4, noches: 5, estado: "CONFIRMADA", canal: "DIRECTO" },
    { roomIdx: 4, inOffset: 20, noches: 3, estado: "CONFIRMADA", canal: "AIRBNB" },
  ];
  const hoyUTC = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate()));
  let seq = 100;
  for (const m of muestras) {
    const room = allRooms[m.roomIdx];
    const plan = flexPlans.get(room.id)!;
    const llegada = addDays(hoyUTC, m.inOffset);
    const salida = addDays(llegada, m.noches);
    const rows = await db.availability.findMany({ where: { roomId: room.id, fecha: { gte: llegada, lt: salida } } });
    const subtotal = rows.reduce((s, x) => s + x.precio, 0);
    const total = subtotal;
    const anticipo = Math.round((total * 0.3) / 1000) * 1000;
    const abonado = m.estado === "PENDIENTE_PAGO" ? 0 : m.estado === "EN_CURSO" ? total : anticipo;
    await db.booking.create({
      data: {
        codigo: `VAL-${String(anio).slice(2)}-0${seq++}`,
        roomId: room.id,
        ratePlanId: plan.id,
        guestId: guest.id,
        llegada,
        salida,
        noches: m.noches,
        adultos: 2,
        estado: m.estado as never,
        canal: m.canal as never,
        subtotal,
        total,
        anticipo,
        saldo: Math.max(0, total - abonado),
        holdExpiraEn: m.estado === "PENDIENTE_PAGO" ? new Date(Date.now() + 15 * 60_000) : null,
        payments:
          abonado > 0
            ? { create: { referencia: `PAY-SEED-${seq}`, metodo: "TARJETA", estado: "APROBADO", valor: abonado, proveedor: "seed" } }
            : undefined,
        events: { create: { tipo: "estado", detalle: "Reserva de muestra", valorNuevo: m.estado, actor: "seed" } },
      },
    });
  }

  // Bloque de mantenimiento adicional visible en el calendario maestro.
  await db.block.create({
    data: {
      roomId: allRooms[4].id,
      desde: addDays(hoyUTC, 2),
      hasta: addDays(hoyUTC, 5),
      tipo: "MANTENIMIENTO",
      motivo: "Pintura y revisión del aire",
      origen: "admin:marcela",
    },
  });

  await db.setting.create({
    data: {
      data: {
        alojamiento: { nombre: "Casa Turística Valema", ciudad: "Colombia", zonaHoraria: "America/Bogota", moneda: "COP", idiomas: ["es"], checkIn: "15:00", checkOut: "11:00", capacidadTotal: 13 },
        contacto: { telefono: "+57 300 000 0000", whatsapp: "573000000000", correo: "hola@valema.co", instagram: "casavalema" },
        pagos: { proveedor: "mock", anticipoPct: 30, metodos: ["TARJETA", "PSE", "TRANSFERENCIA"], cuentaBancaria: "[BANCO] · Ahorros [NÚMERO]" },
        legal: { razonSocial: "Casa Turística Valema", rnt: "RNT en trámite", nit: "[NIT]", regimen: "No responsable de IVA" },
        privacidad: { mostrarDireccionAntesDeReservar: false },
        seo: { titulo: "Casa Turística Valema", descripcion: "Alojamiento boutique con rooftop." },
      },
    },
  });

  console.log("   · usuarios: marcela@valema.co … / clave: valema2026");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
