/* ==========================================================================
   NUESTRA AVENTURA · game.js
   --------------------------------------------------------------------------
   ÍNDICE
   1. PERSONALIZACIÓN DEL REGALO  ← TODO lo que tienes que editar está aquí
   2. Utilidades
   3. Sonido (efectos y música generados con WebAudio: no hay archivos de audio)
   4. Estado y guardado (localStorage)
   5. Sprites de los personajes
   6. Arte pixel-art procedural (mapa y escenas)
   7. Interfaz: diálogos, avisos, transiciones, mochila, HUD
   8. Mapa: dibujo, caminos, personajes, zonas
   9. Escenas (una función por zona)
   10. Final y arranque
   ========================================================================== */
'use strict';

// =============================
// PERSONALIZACIÓN DEL REGALO
// =============================
// Todo lo que sigue hasta la línea "FIN DE LA PERSONALIZACIÓN" es contenido
// editable. No necesitas tocar nada más del archivo para cambiar textos,
// nombres, lugares, canciones, colores, imágenes o sprites.
//
// Para las imágenes: si el archivo NO existe, el juego muestra un dibujo
// automático o un recuadro con la ruta exacta del archivo que debes agregar.
// Cuando termines de personalizar, pon  mostrarAyudas: false  para ocultar
// esos avisos.
// =============================

const CONFIG = {
  // --- Nombres y fecha ---
  miNombre: "TU NOMBRE",
  nombrePareja: "SU NOMBRE",
  fechaAniversario: "2025-01-01",   // AAAA-MM-DD (sirve para calcular "días juntos" en el final)

  // --- Pantalla de inicio ---
  tituloInicio: "NUEVA AVENTURA",
  subtituloInicio: "1 AÑO JUNTOS",
  textoBotonInicio: "COMENZAR AVENTURA",

  // --- Comportamiento ---
  mostrarAyudas: true,              // true = muestra en pantalla qué archivo agregar; false = las oculta
  efectosPorDefecto: true,          // sonidos cortos (clics, pasos, recuerdos)
  musicaPorDefecto: true,           // melodía suave de fondo (se puede apagar con el botón 🎵)
  musicaFondo: "",                  // "" = melodía chiptune original generada por el navegador.
                                    // O una ruta a TU archivo libre de derechos: "assets/musica/fondo.mp3"
  claveGuardado: "nuestra-aventura-v1", // cambia el número si quieres reiniciar el progreso guardado

  // --- Cómo se calcula "AVENTURA COMPLETADA: X%" ---
  // (cada zona visitada, la próxima ruta y cada recuerdo encontrado suman puntos)
  pesos: { zona: 8, proximaRuta: 10, recuerdo: 5 }
};

// --- Colores ---
// "ui" se aplica a la interfaz (cajas, botones, barras). "mapa" al arte pixel-art.
const COLORES = {
  ui: {
    fondo: "#2a1b33",       // fondo general (ciruela oscuro)
    fondo2: "#43305a",
    panel: "#fff6e3",       // cajas de diálogo (crema)
    panelSombra: "#ead9b4",
    borde: "#3b2a4d",
    texto: "#3b2a4d",
    acento: "#e8657a",      // coral
    acentoOsc: "#b8425a",
    oro: "#f5b84a",
    oroOsc: "#c98a1c",
    azul: "#5b8fd9",
    verde: "#5fb878"
  },
  mapa: {
    pasto1: "#8ccb68", pasto2: "#a2dc7a", pasto3: "#74b957",
    camino1: "#ead29e", camino2: "#f4e2b8", camino3: "#cfb47c",
    agua1: "#4f9be0", agua2: "#7dbdf2", agua3: "#3a7cc4", orilla: "#f2e3b1",
    madera1: "#b9803f", madera2: "#8f5e2c", madera3: "#5f3d20",
    arbol1: "#3f8f4a", arbol2: "#58ad5a", arbol3: "#2c6e3d", tronco: "#7a4f36",
    rosa1: "#f08ab0", rosa2: "#f7b5cf", rosa3: "#d5628f",
    roca1: "#b7b3c4", roca2: "#8f8aa3", roca3: "#6a6580", nieve: "#f6f8ff"
  }
};

// --- Personajes ---
// SPRITES PNG: coloca tus dibujos en assets/personajes/ con estos nombres
// (fondo transparente, mirando al frente, recomendado 32x32 o 48x48 píxeles):
//     assets/personajes/yo.png
//     assets/personajes/pareja.png
// Si el archivo no existe, se usa un personaje pixel-art automático con los
// colores de abajo (pelo: "corto" o "largo").
const PERSONAJES = {
  yo: {
    imagen: "assets/personajes/yo.png",
    pelo: "largo", colorPelo: "#3a2a2a", piel: "#f2c9a5", camiseta: "#e88aa8", pantalon: "#5d5a86"
  },
  pareja: {
    imagen: "assets/personajes/pareja.png",
    pelo: "corto", colorPelo: "#241c26", piel: "#e8b98f", camiseta: "#39394f", pantalon: "#3e4a6b"
  }
};

// --- Tipos de recuerdos coleccionables ---
const TIPOS = {
  recuerdo: { icono: "❤️", nombre: "Recuerdo" },
  cancion:  { icono: "🎵", nombre: "Canción" },
  foto:     { icono: "📸", nombre: "Fotografía" },
  entrada:  { icono: "🎟️", nombre: "Entrada" },
  mensaje:  { icono: "💌", nombre: "Mensaje" },
  especial: { icono: "⭐", nombre: "Momento especial" }
};

// --- Textos generales del juego ---
// Puedes usar {yo} y {pareja} dentro de cualquier texto: se reemplazan por los nombres.
// Un salto de línea se escribe \n
const TEXTOS = {
  mapaBienvenida: [
    "¡Esta es nuestra aventura!",
    "Cada zona del mapa guarda un pedacito de nuestra historia. Toca un lugar para recordarlo."
  ],
  mapaPista: "Elige un lugar para recordar...",
  rumbo: "Rumbo a: {zona}...",
  bloqueada: "🔒 PRÓXIMA RUTA\nEsta zona todavía no está disponible.",
  desbloqueada: "¡Se ha desbloqueado una nueva zona! Toca la PRÓXIMA RUTA.",
  bannerLinea1: "¡NUEVA RUTA",
  bannerLinea2: "DESBLOQUEADA!",
  avisoRecuerdo: "¡Has encontrado un recuerdo!",
  pistaBrillo: "Algo brilla por aquí... ✨"
};

// --- ZONAS ---
// Cada zona tiene su nombre (etiqueta del mapa), sus diálogos (una frase por cada
// toque del jugador), y las rutas de imágenes de su escena.
const ZONAS = {
  // ---------- 1. COLEGIO ----------
  colegio: {
    nombre: "Colegio",
    imagen: "assets/lugares/colegio.png",          // ilustración pixel-art del colegio (opcional)
    foto: "assets/recuerdos/foto-colegio.png",     // fotografía (opcional)
    objeto: { imagen: "assets/objetos/colegio.png", nombre: "Objeto de ese día" }, // p. ej. una nota, un cuaderno...
    tituloLibreta: "Nuestro primer encuentro",
    notaLibreta: "Siempre tú y yo ♥",
    dialogos: [
      "Aquí empezó todo...",
      // REEMPLAZAR CON NUESTRO RECUERDO REAL
      "[REEMPLAZAR] Cuenta aquí cómo se conocieron: dónde estaban, qué pasó y qué pensaste de esa persona ese día.",
      "Nadie imaginaba que ese día era el comienzo de una gran aventura."
    ]
  },

  // ---------- 2. PRIMEROS MESES ----------
  primeros: {
    nombre: "Primeros meses",
    imagen: "assets/lugares/primeros-meses.png",
    foto: "assets/recuerdos/foto-primeros-meses.png",
    tituloLibreta: "Cuando todo comenzó",
    momentos: [
      "[REEMPLAZAR] Nuestra primera salida",
      "[REEMPLAZAR] Algo que nos hizo reír muchísimo",
      "[REEMPLAZAR] Un momento que no quiero olvidar"
    ],
    dialogos: [
      "Empezamos a conocernos, a compartir risas, locuras y pequeños momentos que se volvieron grandes.",
      // REEMPLAZAR CON NUESTRO RECUERDO REAL
      "[REEMPLAZAR] Aquí puedes escribir cómo se sintieron los primeros meses de la relación."
    ]
  },

  // ---------- 3. NUESTROS LUGARES ----------
  // Los lugares se editan en el array LUGARES (más abajo).
  lugares: {
    nombre: "Nuestros lugares",
    sinSeleccion: "Toca un punto del mapa para recordar ese lugar.",
    dialogos: [
      "Cada lugar tiene una historia, y cada historia tiene nuestros nombres.",
      "Toca los puntos del mapa para ver qué pasó en cada uno."
    ]
  },

  // ---------- 4. BANDA SONORA ----------
  // Las canciones se editan en el array CANCIONES (más abajo).
  banda: {
    nombre: "Banda sonora",
    dialogos: [
      "Hay canciones que me recuerdan a ti, a nosotros, a lo que somos y a lo que todavía vamos a ser.",
      "Elige una pista para ver el recuerdo que tiene guardado."
    ]
  },

  // ---------- 5. UNIVERSIDAD ----------
  // Las secciones se editan en UNIVERSIDAD (más abajo).
  universidad: {
    nombre: "Universidad",
    dialogos: [
      "Ahora estamos en una nueva etapa: la universidad, los cambios, la distancia... y todo lo que seguimos construyendo.",
      "Cambia de pestaña para ver recuerdos, cosas que admiro, retos y mensajes."
    ]
  },

  // ---------- 6. PRÓXIMA RUTA ----------
  // Los contenidos se editan en PROXIMA_RUTA (más abajo).
  proxima: {
    nombre: "Próxima ruta",
    imagen: "assets/lugares/proxima-ruta.png"
  }
};

// --- NUESTROS LUGARES ---
// Agrega, quita o edita lugares a tu gusto: el mapa se reorganiza solo.
//   nombre      → título del lugar
//   imagen      → boceto/imagen (assets/lugares/...). Si no existe, se muestra un dibujo automático
//   arte        → dibujo automático de reemplazo: "parque" | "cafe" | "ciudad" | "mirador" | "plaza" | "atardecer"
//   fecha       → opcional (déjala "" si no quieres mostrarla)
//   descripcion → cómo es el lugar
//   recuerdo    → el recuerdo escrito (se muestra como diálogo)
//   x, y        → opcional: posición del punto en el mapa, de 0 a 100 (si no las pones, se acomodan solas)
const LUGARES = [
  {
    nombre: "Lugar 1 · Parque",
    imagen: "assets/lugares/lugar1.png",
    arte: "parque",
    fecha: "Fecha",
    descripcion: "[REEMPLAZAR] Describe cómo es este lugar.",
    recuerdo: "[REEMPLAZAR] Nuestro recuerdo en este lugar..."
  },
  {
    nombre: "Lugar 2 · Cafetería",
    imagen: "assets/lugares/lugar2.png",
    arte: "cafe",
    fecha: "Fecha",
    descripcion: "[REEMPLAZAR] Describe cómo es este lugar.",
    recuerdo: "[REEMPLAZAR] Nuestro recuerdo en este lugar..."
  },
  {
    nombre: "Lugar 3 · Centro comercial",
    imagen: "assets/lugares/lugar3.png",
    arte: "ciudad",
    fecha: "Fecha",
    descripcion: "[REEMPLAZAR] Describe cómo es este lugar.",
    recuerdo: "[REEMPLAZAR] Nuestro recuerdo en este lugar..."
  },
  {
    nombre: "Lugar 4 · Mirador",
    imagen: "assets/lugares/lugar4.png",
    arte: "mirador",
    fecha: "Fecha",
    descripcion: "[REEMPLAZAR] Describe cómo es este lugar.",
    recuerdo: "[REEMPLAZAR] Nuestro recuerdo en este lugar..."
  },
  {
    nombre: "Lugar 5 · Plaza",
    imagen: "assets/lugares/lugar5.png",
    arte: "plaza",
    fecha: "Fecha",
    descripcion: "[REEMPLAZAR] Describe cómo es este lugar.",
    recuerdo: "[REEMPLAZAR] Nuestro recuerdo en este lugar..."
  },
  {
    nombre: "Lugar 6 · Un lugar especial",
    imagen: "assets/lugares/lugar6.png",
    arte: "atardecer",
    fecha: "",
    descripcion: "[REEMPLAZAR] Describe cómo es este lugar.",
    recuerdo: "[REEMPLAZAR] Nuestro recuerdo en este lugar..."
  }
];

// --- BANDA SONORA ---
// Cada canción se asocia a un recuerdo. NO incluyas archivos de audio con copyright:
// usa enlaces legales a plataformas.
//   spotify / youtube / apple → enlace a la canción ("" = todavía sin enlace)
//   embed                     → (opcional) enlace de "insertar" de Spotify o YouTube, p. ej.
//                               "https://open.spotify.com/embed/track/ID_DE_LA_CANCION"
//                               "https://www.youtube.com/embed/ID_DEL_VIDEO"
const CANCIONES = [
  { titulo: "Canción 1", artista: "Artista", fecha: "", recuerdo: "[REEMPLAZAR] Esta canción me recuerda a...", spotify: "", youtube: "", apple: "", embed: "" },
  { titulo: "Canción 2", artista: "Artista", fecha: "", recuerdo: "[REEMPLAZAR] Esta canción me recuerda a...", spotify: "", youtube: "", apple: "", embed: "" },
  { titulo: "Canción 3", artista: "Artista", fecha: "", recuerdo: "[REEMPLAZAR] Esta canción me recuerda a...", spotify: "", youtube: "", apple: "", embed: "" },
  { titulo: "Canción 4", artista: "Artista", fecha: "", recuerdo: "[REEMPLAZAR] Esta canción me recuerda a...", spotify: "", youtube: "", apple: "", embed: "" },
  { titulo: "Canción 5", artista: "Artista", fecha: "", recuerdo: "[REEMPLAZAR] Esta canción me recuerda a...", spotify: "", youtube: "", apple: "", embed: "" }
];

// --- UNIVERSIDAD ---
// Cada sección es una pestaña. "arte" es el dibujo automático de reemplazo:
// "universidad" | "atardecer" | "distancia" | "noche"
const UNIVERSIDAD = {
  secciones: [
    {
      icono: "⭐", titulo: "Ahora",
      arte: "universidad", imagen: "assets/lugares/universidad.png",
      dialogo: "Esta es nuestra etapa actual: nuevos retos, nuevos horarios y las mismas ganas de compartirlo todo.",
      items: [
        "[REEMPLAZAR] Un recuerdo de esta etapa",
        "[REEMPLAZAR] Otro momento de estos días",
        "[REEMPLAZAR] Algo pequeño que me hizo feliz"
      ],
      fotos: ["assets/recuerdos/universidad-1.png"]
    },
    {
      icono: "❤️", titulo: "Admiro",
      arte: "atardecer", imagen: "",
      dialogo: "Cosas que admiro de ti:",
      items: [
        "[REEMPLAZAR] Tu forma de pensar",
        "[REEMPLAZAR] Tu esfuerzo",
        "[REEMPLAZAR] Cómo me haces sentir"
      ],
      fotos: []
    },
    {
      icono: "🌙", titulo: "Retos",
      arte: "distancia", imagen: "",
      dialogo: "La distancia no cambia lo que siento; solo hace que valore más cada momento juntos.",
      items: [
        "[REEMPLAZAR] Una dificultad que superamos",
        "[REEMPLAZAR] Algo que aprendimos de la distancia"
      ],
      fotos: []
    },
    {
      icono: "💌", titulo: "Mensajes",
      arte: "noche", imagen: "",
      dialogo: "Pequeños mensajes para leer cuando quieras:",
      items: [
        "[REEMPLAZAR] Mensaje 1",
        "[REEMPLAZAR] Mensaje 2",
        "[REEMPLAZAR] Mensaje 3"
      ],
      fotos: []
    }
  ]
};

// --- PRÓXIMA RUTA ---
// Escena simbólica: casillas vacías que representan los recuerdos que aún nos faltan vivir.
const PROXIMA_RUTA = {
  dialogos: [
    "Esta zona estuvo bloqueada porque hay recuerdos que todavía no existen...",
    "Y tendremos que vivirlos para poder dibujarlos.",
    "Toca cada casilla para descubrir lo que nos espera."
  ],
  casillas: [
    { icono: "🌅", texto: "Amaneceres que todavía no hemos visto." },
    { icono: "🗺️", texto: "Lugares que todavía no conocemos." },
    { icono: "🎵", texto: "Canciones que todavía no suenan." },
    { icono: "📸", texto: "Fotos que todavía no existen." },
    { icono: "🎟️", texto: "Planes que todavía no hicimos." },
    { icono: "⭐", texto: "Sueños que aún nos esperan." }
  ],
  textoFinalCasillas: "Todo esto todavía está por dibujarse...",
  textoBoton: "SEGUIR ADELANTE"
};

// --- RECUERDOS COLECCIONABLES ---
// Aparecen como destellos ✨ escondidos en cada zona. Al tocarlos se guardan en la mochila.
//   zona   → colegio | primeros | lugares | banda | universidad | proxima
//   tipo   → recuerdo | cancion | foto | entrada | mensaje | especial
//   x, y   → posición del destello dentro de la escena (0 a 100)
// Puedes agregar o quitar recuerdos: el contador y el progreso se ajustan solos.
const RECUERDOS = [
  { id: "r-colegio-1",     zona: "colegio",     tipo: "recuerdo", titulo: "El primer hola",       texto: "[REEMPLAZAR] Aquí va el recuerdo del primer día que hablamos.", x: 14, y: 52 },
  { id: "r-colegio-2",     zona: "colegio",     tipo: "foto",     titulo: "Foto del colegio",     texto: "[REEMPLAZAR] Describe una foto de esa época.",                  x: 90, y: 78 },
  { id: "r-primeros-1",    zona: "primeros",    tipo: "mensaje",  titulo: "Nota secreta",         texto: "[REEMPLAZAR] Un mensaje de los primeros meses.",                x: 10, y: 60 },
  { id: "r-primeros-2",    zona: "primeros",    tipo: "especial", titulo: "Momento especial",     texto: "[REEMPLAZAR] Un momento que marcó los primeros meses.",         x: 78, y: 50 },
  { id: "r-lugares-1",     zona: "lugares",     tipo: "entrada",  titulo: "Entrada guardada",     texto: "[REEMPLAZAR] Una entrada, ticket o plan que hicieron juntos.",  x: 93, y: 10 },
  { id: "r-lugares-2",     zona: "lugares",     tipo: "foto",     titulo: "Foto de un lugar",     texto: "[REEMPLAZAR] Una foto de alguno de los lugares.",               x: 7,  y: 90 },
  { id: "r-banda-1",       zona: "banda",       tipo: "cancion",  titulo: "Nuestra canción",      texto: "[REEMPLAZAR] La canción que más nos representa.",               x: 90, y: 14 },
  { id: "r-universidad-1", zona: "universidad", tipo: "mensaje",  titulo: "Carta a la distancia", texto: "[REEMPLAZAR] Un mensaje para los días en que estamos lejos.",   x: 8,  y: 22 },
  { id: "r-universidad-2", zona: "universidad", tipo: "especial", titulo: "Lo que admiro",        texto: "[REEMPLAZAR] Algo que admiro mucho de ti.",                     x: 92, y: 84 },
  { id: "r-proxima-1",     zona: "proxima",     tipo: "recuerdo", titulo: "Semilla del futuro",   texto: "Un recuerdo que todavía no existe... pero que ya tiene lugar en la mochila.", x: 50, y: 30 }
];

// --- FINAL ---
const FINAL = {
  titulo: "¡AVENTURA COMPLETADA!",
  subtitulo: "1 AÑO JUNTOS",
  // Cada elemento es una "página" de diálogo que aparece letra por letra.
  // Para escribir más páginas, agrega más textos separados por comas.
  mensaje: [
    "[ESCRIBIR AQUÍ EL MENSAJE FINAL]"
  ],
  pregunta: "¿LISTO PARA LA SIGUIENTE AVENTURA?",
  textoBoton: "CONTINUAR",
  despues: "Esta aventura todavía no termina...",
  textoVolver: "VOLVER AL MAPA",
  medalla: "Medalla del Primer Año"
};

// =============================
// FIN DE LA PERSONALIZACIÓN
// =============================


/* ==========================================================================
   2. UTILIDADES
   ========================================================================== */
const $ = (sel, raiz) => (raiz || document).querySelector(sel);
const $$ = (sel, raiz) => Array.from((raiz || document).querySelectorAll(sel));
const esperar = ms => new Promise(r => setTimeout(r, ms));
const movimientoReducido = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

/** Crea un elemento: el(etiqueta, clases, texto) */
function el(tag, clase, texto) {
  const e = document.createElement(tag);
  if (clase) e.className = clase;
  if (texto !== undefined) e.textContent = texto;
  return e;
}

/** Reemplaza {yo} y {pareja} por los nombres configurados */
function sustituir(t) {
  return String(t).replace(/\{yo\}/g, CONFIG.miNombre).replace(/\{pareja\}/g, CONFIG.nombrePareja);
}

function hexARgb(h) {
  h = h.replace("#", "");
  if (h.length === 3) h = h.split("").map(c => c + c).join("");
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgbAHex(a) { return "#" + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join(""); }
function mezclar(a, b, t) {
  const A = hexARgb(a), B = hexARgb(b);
  return rgbAHex(A.map((v, i) => v + (B[i] - v) * t));
}
const aclarar = (c, t) => mezclar(c, "#ffffff", t);
const oscurecer = (c, t) => mezclar(c, "#000000", t);

/** Número pseudoaleatorio estable (0..1) a partir de coordenadas */
function hash(x, y, s) {
  let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul((s || 0) | 0, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

/** Comprueba si una imagen existe (con tiempo máximo). Resultado en caché. */
const cacheImg = new Map();
function cargarImagen(src, espera) {
  if (!src) return Promise.resolve(false);
  if (cacheImg.has(src)) return cacheImg.get(src);
  const p = new Promise(res => {
    const i = new Image();
    let fin = false;
    const acabar = ok => { if (!fin) { fin = true; res(ok); } };
    i.onload = () => acabar(true);
    i.onerror = () => acabar(false);
    setTimeout(() => acabar(false), espera || 2500);
    i.src = src;
  });
  cacheImg.set(src, p);
  return p;
}

function diasJuntos() {
  const d = new Date(CONFIG.fechaAniversario + "T00:00:00");
  if (isNaN(d)) return null;
  const n = Math.floor((Date.now() - d.getTime()) / 86400000);
  return n >= 0 ? n : null;
}
function fechaBonita() {
  const d = new Date(CONFIG.fechaAniversario + "T00:00:00");
  return isNaN(d) ? "" : d.toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric" });
}


/* ==========================================================================
   4. ESTADO Y GUARDADO   (declarado antes que el sonido porque éste lo consulta)
   ========================================================================== */
const ZONAS_PRINCIPALES = ["colegio", "primeros", "lugares", "banda", "universidad"];
const NUMERO_ZONA = { colegio: 1, primeros: 2, lugares: 3, banda: 4, universidad: 5, proxima: 6 };

function estadoInicial() {
  return {
    zonas: {},              // zonas visitadas: { colegio: true, ... }
    recuerdos: {},          // recuerdos encontrados: { "r-colegio-1": true, ... }
    lugaresVistos: {},
    proximaLibre: false,    // ¿ya se desbloqueó la próxima ruta?
    finalVisto: false,
    hayProgreso: false,
    efectos: CONFIG.efectosPorDefecto,
    musica: CONFIG.musicaPorDefecto
  };
}
let juego = estadoInicial();

function cargarPartida() {
  try {
    const j = JSON.parse(localStorage.getItem(CONFIG.claveGuardado));
    if (j && typeof j === "object") return Object.assign(estadoInicial(), j);
  } catch (e) { /* sin guardado */ }
  return null;
}
function guardarPartida() {
  try { localStorage.setItem(CONFIG.claveGuardado, JSON.stringify(juego)); } catch (e) { /* modo privado */ }
}

const contarRecuerdos = () => RECUERDOS.filter(r => juego.recuerdos[r.id]).length;
const todasPrincipalesVisitadas = () => ZONAS_PRINCIPALES.every(z => juego.zonas[z]);

/** Porcentaje de aventura completada (0-100) */
function calcularProgreso() {
  const p = CONFIG.pesos;
  const total = ZONAS_PRINCIPALES.length * p.zona + p.proximaRuta + RECUERDOS.length * p.recuerdo;
  const actual =
    ZONAS_PRINCIPALES.filter(z => juego.zonas[z]).length * p.zona +
    (juego.zonas.proxima ? p.proximaRuta : 0) +
    contarRecuerdos() * p.recuerdo;
  return total ? Math.round((actual / total) * 100) : 0;
}


/* ==========================================================================
   3. SONIDO  (WebAudio: sin archivos, sin copyright)
   ========================================================================== */
const Sonido = (() => {
  let ctx = null, gSfx = null, gMus = null, audioFondo = null, timer = null, paso = 0, proxT = 0;
  // Acordes de la melodía de fondo: Do, La menor, Fa, Sol
  const ACORDES = [[261.63, 329.63, 392.0], [220.0, 261.63, 329.63], [174.61, 220.0, 261.63], [196.0, 246.94, 293.66]];
  const PATRON = [0, 1, 2, 1, 2, 1, 0, 1];

  /** Debe llamarse dentro de un toque del usuario (los navegadores lo exigen) */
  function iniciar() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      try { ctx = new AC(); } catch (e) { ctx = null; return; }
      gSfx = ctx.createGain(); gMus = ctx.createGain();
      gSfx.connect(ctx.destination); gMus.connect(ctx.destination);
    }
    if (ctx.state === "suspended") ctx.resume();
    aplicar();
  }

  function tono(f, dur, o) {
    if (!ctx) return;
    o = o || {};
    const t = ctx.currentTime + Math.max(0, o.t0 || 0);
    const osc = ctx.createOscillator(), g = ctx.createGain();
    osc.type = o.tipo || "square";
    osc.frequency.setValueAtTime(f, t);
    if (o.hasta) osc.frequency.exponentialRampToValueAtTime(o.hasta, t + dur);
    g.gain.setValueAtTime(o.vol || 0.05, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g); g.connect(o.canal || gSfx);
    osc.start(t); osc.stop(t + dur + 0.03);
  }

  const efectos = {
    click()      { tono(660, 0.06, { vol: 0.04 }); },
    tecla()      { tono(380 + Math.random() * 90, 0.03, { vol: 0.012 }); },
    paso()       { tono(150, 0.05, { vol: 0.03, tipo: "triangle" }); },
    abrir()      { [523, 659, 784].forEach((f, i) => tono(f, 0.12, { t0: i * 0.07, vol: 0.045 })); },
    item()       { [784, 988, 1319, 1568].forEach((f, i) => tono(f, 0.14, { t0: i * 0.08, vol: 0.05 })); },
    error()      { tono(210, 0.18, { tipo: "sawtooth", vol: 0.035, hasta: 110 }); },
    pagina()     { tono(880, 0.05, { vol: 0.03 }); tono(1175, 0.06, { vol: 0.03, t0: 0.05 }); },
    desbloqueo() { [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => tono(f, 0.16, { t0: i * 0.1, vol: 0.05 })); },
    victoria()   { [523, 523, 523, 659, 784, 659, 784, 1047].forEach((f, i) => tono(f, 0.22, { t0: i * 0.15, vol: 0.055 })); }
  };
  function sfx(nombre) {
    if (!ctx || !juego.efectos) return;
    if (efectos[nombre]) efectos[nombre]();
  }

  /** Melodía de fondo: arpegios suaves programados por adelantado */
  function programar() {
    if (!ctx) return;
    while (proxT < ctx.currentTime + 0.4) {
      const n = paso % 32, ac = ACORDES[Math.floor(n / 8)], t0 = proxT - ctx.currentTime;
      tono(ac[PATRON[n % 8]] * 2, 0.32, { tipo: "triangle", vol: 0.05, t0, canal: gMus });
      if (n % 4 === 0) tono(ac[0] / 2, 0.55, { tipo: "square", vol: 0.016, t0, canal: gMus });
      if (n % 8 === 4) tono(ac[2] * 4, 0.5, { tipo: "sine", vol: 0.02, t0, canal: gMus });
      proxT += 0.3; paso++;
    }
  }

  /** Aplica las preferencias (efectos / música) */
  function aplicar() {
    if (gSfx) gSfx.gain.value = juego.efectos ? 1 : 0;
    const quiere = juego.musica && !document.hidden && !!ctx;
    if (CONFIG.musicaFondo) {
      if (quiere) {
        if (!audioFondo) { audioFondo = new Audio(CONFIG.musicaFondo); audioFondo.loop = true; audioFondo.volume = 0.35; }
        audioFondo.play().catch(() => {});
      } else if (audioFondo) audioFondo.pause();
    } else if (quiere && !timer) {
      paso = 0; proxT = ctx.currentTime + 0.1; timer = setInterval(programar, 120);
    } else if (!quiere && timer) {
      clearInterval(timer); timer = null;
    }
  }

  function alternar(cual) {
    juego[cual] = !juego[cual];
    guardarPartida(); aplicar(); actualizarToggles();
    if (cual === "efectos" && juego.efectos) sfx("click");
  }

  document.addEventListener("visibilitychange", aplicar);
  return { iniciar, sfx, aplicar, alternar };
})();

function actualizarToggles() {
  $$('[data-accion="efectos"]').forEach(b => { b.classList.toggle("apagado", !juego.efectos); b.setAttribute("aria-pressed", String(juego.efectos)); });
  $$('[data-accion="musica"]').forEach(b => { b.classList.toggle("apagado", !juego.musica); b.setAttribute("aria-pressed", String(juego.musica)); });
}


/* ==========================================================================
   5. SPRITES DE LOS PERSONAJES
   Si existe assets/personajes/yo.png se usa ese archivo; si no, se genera un
   personaje pixel-art original con los colores de PERSONAJES.
   ========================================================================== */
const SPRITES = {};  // aquí queda la fuente final de cada personaje (ruta o data-URL)

// Plantilla 16x21. H=pelo h=brillo S=piel E=ojos M=mejillas C=camiseta P=pantalón B=zapatos
const FILAS_PERSONAJE = [
  "....HHHHHHHH....",
  "...HHHHHHHHHH...",
  "..HHHhHHHHhHHH..",
  "..HHHHHHHHHHHH..",
  "..HHSSSSSSSSHH..",
  "..HSSSSSSSSSSH..",
  "..HSEESSSSEESH..",
  "..HSEESSSSEESH..",
  "..HSMSSSSSSMSH..",
  "...SSSSSSSSSS...",
  "....SSSSSSSS....",
  "......SSSS......",
  "....CCCCCCCC....",
  "...CCCCCCCCCC...",
  "..CCCCCCCCCCCC..",
  "..SCCCCCCCCCCS..",
  "....CCCCCCCC....",
  "....PPPPPPPP....",
  "....PPP..PPP....",
  "....PPP..PPP....",
  "...BBBB..BBBB..."
];

function generarSprite(cfg) {
  const filas = FILAS_PERSONAJE.map(f => f.split(""));
  if (cfg.pelo === "largo") {
    for (let r = 5; r <= 14; r++) for (const c of [1, 2, 13, 14]) filas[r][c] = "H";
  }
  const pal = {
    H: cfg.colorPelo, h: aclarar(cfg.colorPelo, 0.28), S: cfg.piel, E: "#2b1d2f",
    M: mezclar(cfg.piel, "#e8657a", 0.45), C: cfg.camiseta, P: cfg.pantalon, B: "#3a2b3f"
  };
  const w = 18, h = 23;
  const cv = document.createElement("canvas");
  cv.width = w; cv.height = h;
  const g = cv.getContext("2d");
  const lleno = Array.from({ length: h }, () => Array(w).fill(false));
  filas.forEach((fila, r) => fila.forEach((ch, c) => {
    if (ch === ".") return;
    g.fillStyle = pal[ch] || "#ff00ff";
    g.fillRect(c + 1, r + 1, 1, 1);
    lleno[r + 1][c + 1] = true;
  }));
  // contorno oscuro alrededor de todo el personaje
  g.fillStyle = "#2b1d2f";
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (lleno[y][x]) continue;
    if ((y > 0 && lleno[y - 1][x]) || (y < h - 1 && lleno[y + 1][x]) || (x > 0 && lleno[y][x - 1]) || (x < w - 1 && lleno[y][x + 1])) g.fillRect(x, y, 1, 1);
  }
  return cv.toDataURL();
}

async function prepararSprites() {
  for (const k of Object.keys(PERSONAJES)) {
    const cfg = PERSONAJES[k];
    const existe = cfg.imagen ? await cargarImagen(cfg.imagen, 1500) : false;
    SPRITES[k] = existe ? cfg.imagen : generarSprite(cfg);
  }
}

/** Crea un <img> con el sprite de "yo" o "pareja" */
function crearSprite(quien, clase) {
  const i = new Image();
  i.src = SPRITES[quien];
  i.alt = quien === "yo" ? CONFIG.miNombre : CONFIG.nombrePareja;
  i.draggable = false;
  i.className = clase || "sprite";
  return i;
}

/* ==========================================================================
   6. ARTE PIXEL-ART PROCEDURAL
   Todo el mapa y los dibujos de las escenas se generan con rectángulos en un
   <canvas> pequeño que luego se escala sin suavizar (image-rendering: pixelated).
   Así el proyecto funciona sin ninguna imagen. Si agregas tus propios PNG,
   reemplazan a estos dibujos.
   ========================================================================== */
const AW = 160, AH = 96;   // tamaño lógico de los dibujos de escena

function R(g, c, x, y, w, h) {
  g.fillStyle = c;
  g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}
function disco(g, c, cx, cy, r) {
  r = Math.round(r);
  for (let dy = -r; dy <= r; dy++) {
    const w = Math.floor(Math.sqrt(r * r - dy * dy));
    R(g, c, cx - w, cy + dy, w * 2 + 1, 1);
  }
}
/** Dibuja un patrón de texto ('X' = píxel) a escala s */
function patron(g, filas, x, y, color, s) {
  s = s || 1;
  filas.forEach((f, j) => { for (let i = 0; i < f.length; i++) if (f[i] === "X") R(g, color, x + i * s, y + j * s, s, s); });
}
const PAT = {
  corazon: [".XX.XX.", "XXXXXXX", "XXXXXXX", ".XXXXX.", "..XXX..", "...X..."],
  nota: ["..XXXXXX", "..XXXXXX", "..X....X", "..X....X", "..X....X", "XXX..XXX", "XXX..XXX"],
  interrogacion: [".XXX.", "X...X", "....X", "..XX.", "..X..", ".....", "..X.."],
  candado: ["..XXX..", ".X...X.", ".X...X.", "XXXXXXX", "XXXXXXX", "XXX.XXX", "XXX.XXX", "XXXXXXX"],
  estrella: ["..X..", "..X..", "XXXXX", ".XXX.", ".X.X."]
};

/* ---- Primitivas de paisaje ---- */
function cielo(g, cols, alto, ancho) {
  const n = cols.length;
  cols.forEach((c, i) => R(g, c, 0, (i * alto) / n, ancho || AW, alto / n + 1));
}
function colinas(g, c, base, amp, fase, ancho, alto) {
  ancho = ancho || AW; alto = alto || AH;
  for (let x = 0; x < ancho; x++) {
    const y = base - Math.sin((x / ancho) * Math.PI * 2.4 + fase) * amp - Math.sin(x * 0.11 + fase * 3) * amp * 0.35;
    R(g, c, x, y, 1, alto - y);
  }
}
function estrellas(g, n, semilla, hmax, ancho) {
  for (let i = 0; i < n; i++) {
    R(g, i % 5 === 0 ? "#fff6c8" : "#cfd8ff", hash(i, semilla, 1) * (ancho || AW), hash(i, semilla, 2) * hmax, 1, 1);
  }
}
function nube(g, x, y, c) {
  c = c || "#ffffff";
  R(g, c, x + 4, y - 2, 7, 3); R(g, c, x + 2, y, 13, 3); R(g, c, x, y + 2, 17, 3);
}
function arbol(g, x, y, s, copa, copa2, tronco) {
  copa = copa || "#4d9a4a"; copa2 = copa2 || "#6fbd5c"; tronco = tronco || "#7a4f36";
  R(g, tronco, x - 1, y - s * 0.42, 3, s * 0.42);
  disco(g, copa, x, y - s * 0.7, s * 0.5);
  disco(g, copa2, x - s * 0.12, y - s * 0.8, s * 0.3);
}
function flores(g, x, y, n, semilla) {
  const cols = ["#f08ab0", "#fff3a6", "#ffffff", "#f5a15a"];
  for (let i = 0; i < n; i++) {
    const fx = x + hash(i, semilla, 3) * 26, fy = y + hash(i, semilla, 4) * 5;
    R(g, cols[i % 4], fx, fy, 2, 2); R(g, "#4d9a4a", fx, fy + 2, 1, 2);
  }
}
function camino(g, col, y0, y1, cx, w0, paso) {
  for (let y = y0; y < y1; y++) { const w = w0 + (y - y0) * paso; R(g, col, cx - w / 2, y, w, 1); }
}

/**
 * Edificio genérico en píxeles.  (x, y, w, h) = caja; o = opciones:
 *   techo, pared  → colores
 *   doorX         → centro de la puerta (relativo a x), o null
 *   extra         → "reloj" | "torre" | "corazon" | "nota"
 */
function edificioPx(g, x, y, w, h, o) {
  const r = (c, dx, dy, ww, hh) => R(g, c, x + dx, y + dy, ww, hh);
  const tejado = Math.round(h * 0.42), cuerpoY = tejado, cuerpoH = h - tejado;
  const oscuro = oscurecer(o.pared, 0.18);

  // sombra en el suelo + pared
  r("rgba(40,20,50,.25)", 2, h - 2, w, 3);
  r(o.pared, 0, cuerpoY, w, cuerpoH);
  r(oscuro, 0, h - 3, w, 3);
  r(oscuro, w - 2, cuerpoY, 2, cuerpoH);

  // tejado (trapecio con alero)
  for (let i = 0; i < tejado; i++) {
    const ins = Math.round((tejado - 1 - i) * 0.5) - 2;
    r(i % 4 === 3 ? oscurecer(o.techo, 0.22) : o.techo, ins, i, w - ins * 2, 1);
  }
  r(aclarar(o.techo, 0.3), Math.round((tejado - 1) * 0.5) - 2, 0, w - (Math.round((tejado - 1) * 0.5) - 2) * 2, 1);

  // decoración del tejado
  if (o.extra === "corazon") patron(g, PAT.corazon, x + w / 2 - 3.5, y + tejado / 2 - 2, "#fff6e3");
  if (o.extra === "nota") patron(g, PAT.nota, x + w / 2 - 4, y + tejado / 2 - 3, "#fff6e3");

  // Torre / reloj que sobresale por encima del tejado (se dibuja sobre él)
  if (o.extra === "reloj" || o.extra === "torre") {
    const cx = w / 2, torre = o.extra === "torre";
    const tw = torre ? 18 : 14, th = torre ? 14 : 12, ty = -th + 4;
    if (torre) disco(g, o.techo, x + cx, y + ty, 7);
    r(o.pared, cx - tw / 2, ty, tw, th + 6);
    r(oscuro, cx + tw / 2 - 2, ty, 2, th + 6);
    if (!torre) { r(o.techo, cx - tw / 2 - 1, ty - 3, tw + 2, 4); r(aclarar(o.techo, 0.25), cx - tw / 2 - 1, ty - 3, tw + 2, 1); }
    const ry = ty + (torre ? 7 : 6);
    disco(g, "#fffaf0", x + cx, y + ry, torre ? 5 : 4);
    r("#3b2a4d", cx, ry - 3, 1, 4); r("#3b2a4d", cx, ry, 3, 1);
    if (o.bandera !== false) {   // mástil y bandera
      const my = ty - (torre ? 15 : 12);
      r("#5b3a29", cx, my, 1, 11); r("#e8657a", cx + 1, my, 6, 3);
    }
  }

  // ventanas repartidas parejo
  const n = Math.max(1, Math.floor(w / 16)), filasV = cuerpoH >= 26 ? 2 : 1;
  for (let k = 0; k < n; k++) {
    const cx = (w * (k + 0.5)) / n;
    for (let f = 0; f < filasV; f++) {
      const wy = cuerpoY + 4 + f * 13;
      if (o.doorX != null && Math.abs(cx - o.doorX) < 8 && wy + 7 > h - 12) continue;
      r("#5a3b6e", cx - 4, wy - 1, 8, 9);
      r("#a8d8f0", cx - 3, wy, 6, 7);
      r("#5a3b6e", cx, wy, 1, 7); r("#5a3b6e", cx - 3, wy + 3, 6, 1);
      r("#e6f6ff", cx - 3, wy, 2, 2);
    }
  }
  // puerta
  if (o.doorX != null) {
    const dx = o.doorX - 4;
    r("#c9b48a", dx - 2, h - 2, 12, 2);
    r("#5b3a29", dx, h - 12, 8, 11);
    r("#7a4f36", dx + 1, h - 11, 6, 10);
    r("#f5d36b", dx + 5, h - 6, 1, 1);
  }
}

/** Puerta de la PRÓXIMA RUTA: cerrada (candado) o abierta (portal luminoso) */
function dibujarPuerta(g, x, y, w, h, libre) {
  const r = (c, dx, dy, ww, hh) => R(g, c, x + dx, y + dy, ww, hh);
  const piedra = "#8a8199", piedraOsc = "#5f5772", piedraCl = "#b0a8c0";
  r("rgba(30,10,50,.3)", 2, h - 2, w, 3);
  // pilares
  r(piedra, 0, 6, 10, h - 6); r(piedra, w - 10, 6, 10, h - 6);
  r(piedraCl, 0, 6, 3, h - 6); r(piedraCl, w - 10, 6, 3, h - 6);
  r(piedraOsc, 8, 6, 2, h - 6); r(piedraOsc, w - 2, 6, 2, h - 6);
  // arco
  r(piedra, 2, 0, w - 4, 8); r(piedraCl, 4, 0, w - 8, 2); r(piedraOsc, 2, 6, w - 4, 2);
  // interior
  r(libre ? "#2b1f5e" : "#1a1030", 10, 8, w - 20, h - 8);
  if (libre) {
    for (let i = 0; i < 6; i++) r(i % 2 ? "#7fe8ff" : "#ffb4e6", 12 + i, 10, w - 24 - i * 2, 2 + (i % 2));
    r("#c8f4ff", 14, 12, w - 28, h - 14);
    r("#ffffff", w / 2 - 2, 14, 4, h - 18);
    patron(g, PAT.estrella, x + w / 2 - 2, y - 6, "#ffd77a");
    r("#fff", 15, 16, 1, 1); r("#fff", w - 16, 22, 1, 1); r("#fff", 20, 24, 1, 1);
  } else {
    patron(g, PAT.interrogacion, x + w / 2 - 5, y + 11, "#7a6a9a", 2);
    patron(g, PAT.candado, x + w / 2 - 3.5, y - 10, "#f5b84a");
    r("#c98a1c", w / 2 - 3, -3, 7, 1);
  }
}

/* --------------------------------------------------------------------------
   ARTE DE ESCENAS (160 x 96)
   -------------------------------------------------------------------------- */
const Arte = {
  dibujar(canvas, tipo) {
    const g = canvas.getContext("2d");
    g.imageSmoothingEnabled = false;
    g.clearRect(0, 0, canvas.width, canvas.height);
    (this.tipos[tipo] || this.tipos.parque)(g);
  },

  tipos: {
    colegio(g) {
      cielo(g, ["#7cc6f0", "#96d2f2", "#b3dff3", "#d3ecee", "#f7e7c3"], 66);
      disco(g, "#fff3a6", 134, 16, 8); nube(g, 14, 16); nube(g, 74, 28); nube(g, 112, 40, "#f6fbff");
      colinas(g, "#86c98a", 60, 3, 0.4);
      R(g, "#93d46d", 0, 64, AW, 32);
      camino(g, "#ecd6a0", 66, AH, 80, 8, 0.9);
      edificioPx(g, 44, 21, 72, 46, { techo: "#c0504f", pared: "#f3dfb2", doorX: 36, extra: "reloj" });
      arbol(g, 18, 78, 30); arbol(g, 146, 76, 28);
      flores(g, 100, 84, 6, 1); flores(g, 30, 88, 5, 2);
    },

    atardecer(g) {
      cielo(g, ["#33285a", "#5a3577", "#9a4a7f", "#d8677c", "#f39a62", "#f8c86c"], 62);
      estrellas(g, 16, 3, 26);
      disco(g, "#ffe08a", 80, 58, 11);
      colinas(g, "#3f2f5e", 62, 4, 1.6);
      R(g, "#5a4585", 0, 62, AW, 34);
      for (let i = 0; i < 7; i++) R(g, i % 2 ? "#f5b060" : "#f8d27a", 68 + (i % 3) * 2, 63 + i * 4, 24 - i * 2, 2);
      R(g, "#7a5a78", 0, 76, AW, 20); R(g, "#94708f", 0, 76, AW, 3);
      for (let x = 0; x < AW; x += 16) R(g, "#684a68", x, 79, 1, 17);
      arbol(g, 14, 76, 36, "#2f2650", "#3d3163", "#251d3d"); arbol(g, 148, 76, 32, "#2f2650", "#3d3163", "#251d3d");
    },

    universidad(g) {
      cielo(g, ["#86cdf2", "#a3d9f3", "#c2e6f1", "#e3f0e8", "#f9e9c9"], 62);
      disco(g, "#fff3a6", 20, 16, 7); nube(g, 90, 14); nube(g, 122, 30);
      colinas(g, "#8ccc8a", 60, 3, 2);
      R(g, "#95d66f", 0, 62, AW, 34);
      camino(g, "#ecd6a0", 66, AH, 80, 8, 0.8);
      edificioPx(g, 30, 19, 100, 47, { techo: "#4a6fb5", pared: "#efd9b0", doorX: 50, extra: "torre" });
      arbol(g, 12, 80, 30); arbol(g, 150, 78, 28);
      R(g, "#8a5a3a", 108, 80, 20, 2); R(g, "#8a5a3a", 108, 76, 20, 2); R(g, "#5f3d20", 110, 82, 2, 4); R(g, "#5f3d20", 124, 82, 2, 4);
    },

    distancia(g) {
      cielo(g, ["#0f0b26", "#171040", "#211757", "#2d1f6b"], AH);
      estrellas(g, 34, 7, 60);
      [[12, "#3a2a4a", "#f08ab0"], [100, "#5a2f3c", "#6a86c8"]].forEach(([vx, pelo, ropa]) => {
        R(g, "#4b3768", vx - 3, 14, 52, 70);
        R(g, "#f4c26a", vx, 17, 46, 64);
        disco(g, "#e8b98f", vx + 12, 55, 6); R(g, pelo, vx + 6, 47, 13, 6); R(g, ropa, vx + 4, 62, 17, 19);
        R(g, "#5a3f72", vx + 22, 17, 2, 64); R(g, "#5a3f72", vx, 47, 46, 2);
        R(g, "#4b3768", vx - 5, 82, 56, 4);
      });
      for (let x = 60; x < 100; x += 2) R(g, "#e8657a", x, 48 + Math.round(Math.sin((x - 60) / 6) * 3), 1, 1);
      patron(g, PAT.corazon, 76, 40, "#ff8fa3", 1);
      R(g, "#ffd0da", 77, 41, 1, 1);
    },

    noche(g) {
      cielo(g, ["#0c0a1e", "#141033", "#1d1745", "#2a1e5a", "#3a2a6e"], 66);
      estrellas(g, 42, 5, 50);
      colinas(g, "#1f1838", 64, 5, 0.8); colinas(g, "#2a2049", 72, 3, 2.2);
      R(g, "#231a3f", 0, 74, AW, 22);
      camino(g, "#3a2d5f", 66, AH, 80, 3, 1.4);
      for (let y = 70; y < AH; y += 6) R(g, "#5b4a88", 79, y, 2, 2);
      disco(g, "#2c2258", 80, 46, 18);
      patron(g, PAT.interrogacion, 72, 36, "#c9b8ff", 3);
    },

    parque(g) {
      cielo(g, ["#88d0f2", "#a6dcf3", "#c6e9ee", "#eaf1de"], 58);
      disco(g, "#fff3a6", 128, 16, 8); nube(g, 20, 18); nube(g, 70, 30);
      colinas(g, "#7fc88a", 56, 3, 1);
      R(g, "#95d66f", 0, 58, AW, 38);
      camino(g, "#ecd6a0", 60, AH, 84, 6, 0.7);
      arbol(g, 30, 74, 44); arbol(g, 122, 72, 38, "#e57ba0", "#f7a9c4");
      R(g, "#8a5a3a", 56, 74, 26, 3); R(g, "#8a5a3a", 56, 70, 26, 2); R(g, "#5f3d20", 58, 77, 2, 5); R(g, "#5f3d20", 78, 77, 2, 5);
      flores(g, 96, 86, 6, 5);
    },

    ciudad(g) {
      cielo(g, ["#f6b98a", "#f8cf98", "#fbe2ab", "#fdeec2"], 60);
      const bloques = [[4, 30, 22, "#8c7aa8"], [28, 18, 26, "#a894c0"], [56, 34, 20, "#7a689a"], [78, 14, 28, "#b39fc8"], [108, 28, 22, "#8c7aa8"], [132, 22, 24, "#a894c0"]];
      bloques.forEach(([bx, by, bw, col], i) => {
        R(g, col, bx, by + 20, bw, 60 - by);
        for (let wy = by + 24; wy < 74; wy += 8) for (let wx = bx + 3; wx < bx + bw - 3; wx += 6) R(g, hash(wx, wy, i) > 0.4 ? "#ffe9a0" : "#5a4a78", wx, wy, 3, 4);
      });
      R(g, "#5c5670", 0, 78, AW, 18); R(g, "#7a7490", 0, 78, AW, 2);
      for (let x = 4; x < AW; x += 20) R(g, "#f3d97a", x, 88, 10, 2);
    },

    mirador(g) {
      cielo(g, ["#7b6cc0", "#b57fc0", "#eaa0a8", "#f8c99a", "#fce3a8"], 58);
      disco(g, "#fff0b0", 112, 46, 9);
      colinas(g, "#7d6aa8", 56, 9, 0.3); colinas(g, "#5d4d8a", 66, 8, 1.7); colinas(g, "#3f3266", 76, 5, 2.9);
      R(g, "#6e4f3a", 0, 80, AW, 16); R(g, "#84603f", 0, 80, AW, 2);
      R(g, "#4a3327", 0, 72, AW, 3);
      for (let x = 4; x < AW; x += 12) R(g, "#4a3327", x, 72, 2, 14);
    },

    cafe(g) {
      R(g, "#f3d9b1", 0, 0, AW, AH);
      R(g, "#d9a066", 0, 74, AW, 22);
      for (let x = 0; x < AW; x += 10) R(g, (x / 10) % 2 ? "#e8657a" : "#fff2dc", x, 8, 10, 16);
      R(g, "#b8425a", 0, 24, AW, 2);
      R(g, "#5a3b6e", 14, 34, 44, 36); R(g, "#ffe9a0", 16, 36, 40, 32); R(g, "#5a3b6e", 36, 36, 2, 32);
      R(g, "#5b3a29", 104, 30, 26, 44); R(g, "#7a4f36", 106, 32, 22, 40); R(g, "#f5d36b", 124, 54, 2, 2);
      // mesa con taza
      R(g, "#8a5a3a", 66, 66, 26, 3); R(g, "#5f3d20", 78, 69, 3, 12);
      R(g, "#fff6e3", 74, 60, 8, 6); R(g, "#7a4f36", 75, 61, 6, 2); R(g, "#fff6e3", 82, 61, 2, 3);
      R(g, "rgba(255,255,255,.8)", 76, 55, 1, 3); R(g, "rgba(255,255,255,.8)", 79, 53, 1, 4);
    },

    plaza(g) {
      cielo(g, ["#8fd0f0", "#abdcf2", "#c9e8ee", "#efeed8"], 50);
      nube(g, 18, 14); nube(g, 110, 22);
      R(g, "#b58fa8", 6, 22, 30, 32); R(g, "#d96b78", 4, 14, 34, 9);
      R(g, "#9fb6d8", 122, 18, 32, 36); R(g, "#e8a13a", 120, 11, 36, 8);
      for (let i = 0; i < 3; i++) { R(g, "#ffe9a0", 12 + i * 8, 32, 4, 5); R(g, "#ffe9a0", 128 + i * 9, 30, 4, 5); }
      R(g, "#dfd0a8", 0, 54, AW, 42);
      for (let x = 0; x < AW; x += 16) for (let y = 58; y < AH; y += 12) R(g, "#cbbb90", x + ((y / 12) % 2 ? 8 : 0), y, 8, 1);
      R(g, "#b0a07a", 54, 74, 52, 8); R(g, "#8fd1f0", 58, 68, 44, 8); R(g, "#6db6e8", 58, 74, 44, 2);
      R(g, "#e8f6ff", 78, 50, 4, 20); R(g, "#e8f6ff", 72, 58, 16, 2); R(g, "#e8f6ff", 68, 64, 24, 2);
      arbol(g, 14, 84, 30, "#4d9a4a", "#6fbd5c"); arbol(g, 148, 84, 30, "#4d9a4a", "#6fbd5c");
    }
  },

  /** Pergamino del álbum "Nuestros lugares". pos = [{x,y}] en % */
  tablero(canvas, pos) {
    const g = canvas.getContext("2d");
    g.imageSmoothingEnabled = false;
    R(g, "#e9cf98", 0, 0, AW, AH);
    for (let i = 0; i < 120; i++) R(g, i % 3 ? "#f1dcaa" : "#dcc082", hash(i, 1, 1) * AW, hash(i, 1, 2) * AH, 2, 1);
    R(g, "#b8804a", 0, 0, AW, 2); R(g, "#b8804a", 0, AH - 2, AW, 2); R(g, "#b8804a", 0, 0, 2, AH); R(g, "#b8804a", AW - 2, 0, 2, AH);
    // adornos: arbolitos y casitas
    [[10, 86], [148, 30], [140, 84], [70, 90]].forEach(([x, y], i) => arbol(g, x, y, 16, "#7fae6a", "#9cc884", "#8f6a45"));
    edificioPx(g, 96, 6, 18, 14, { techo: "#c98a6a", pared: "#f6e2b8", doorX: 9 });
    // ruta punteada entre puntos
    for (let i = 0; i < pos.length - 1; i++) {
      const a = pos[i], b = pos[i + 1], ax = a.x * 1.6, ay = a.y * 0.96, bx = b.x * 1.6, by = b.y * 0.96;
      const pasos = Math.max(4, Math.round(Math.hypot(bx - ax, by - ay) / 4));
      for (let k = 1; k < pasos; k++) R(g, "#b8693f", ax + ((bx - ax) * k) / pasos, ay + ((by - ay) * k) / pasos, 2, 2);
    }
  },

  /** Fondo de la pantalla de título (144 x 256) */
  titulo(canvas) {
    const g = canvas.getContext("2d");
    g.imageSmoothingEnabled = false;
    const W = 144, H = 256;
    const bandas = ["#0d0a24", "#150f38", "#1f1450", "#2d1a63", "#43206f", "#66297a", "#93407f", "#c85f80", "#ee8d75", "#f7b56b"];
    bandas.forEach((c, i) => R(g, c, 0, i * 17, W, 18));
    estrellas(g, 40, 11, 110, W);
    disco(g, "#fff4c9", 106, 34, 11); disco(g, "#ecdcaa", 102, 31, 3); disco(g, "#ecdcaa", 110, 38, 2);
    colinas(g, "#3a2466", 150, 12, 0.4, W, H);
    for (let i = 0; i < 16; i++) R(g, "#ffd77a", hash(i, 4, 1) * W, 156 + hash(i, 4, 2) * 12, 1, 1);
    colinas(g, "#2a1a4e", 168, 9, 2, W, H);
    colinas(g, "#2f5a48", 192, 6, 1, W, H);
    R(g, "#24463a", 0, 200, W, H - 200);
    for (let x = 0; x < W; x += 3) R(g, "#3a6a54", x, 193 + Math.round(hash(x, 5, 1) * 3), 1, 2);
    arbol(g, 12, 208, 42, "#173a2e", "#20493a", "#12211c");
    arbol(g, 132, 214, 50, "#173a2e", "#20493a", "#12211c");
    for (let i = 0; i < 26; i++) R(g, i % 4 ? "#2f5a48" : "#f5a15a", hash(i, 6, 1) * W, 210 + hash(i, 6, 2) * 40, 1, 1);
  }
};

/* ==========================================================================
   7. INTERFAZ: pantallas, diálogos, avisos, transición, mochila y HUD
   ========================================================================== */
const Pantallas = {
  mostrar(id) {
    $$(".pantalla").forEach(p => p.classList.toggle("activa", p.id === id));
    $("#juego").classList.toggle("con-hud", id === "pantalla-mapa" || id === "pantalla-escena");
  }
};

let ocupado = false;   // true mientras hay una transición o los personajes caminan

/**
 * Caja de diálogo estilo videojuego: escribe el texto letra por letra.
 * Un toque completa la línea; otro toque pasa a la siguiente.
 *   decir(lineas, alFinal)  → muestra una o varias líneas; alFinal se llama al terminar la última
 */
function crearDialogo(caja) {
  const texto = $(".dialogo-texto", caja), flecha = $(".dialogo-flecha", caja);
  let lineas = [], idx = 0, timer = null, escribiendo = false, alFinal = null, completo = "";

  function terminarLinea() {
    clearInterval(timer);
    escribiendo = false;
    texto.textContent = completo;
    const ultima = idx >= lineas.length - 1;
    flecha.textContent = ultima ? "■" : "▼";
    flecha.style.visibility = "visible";
    if (ultima && alFinal) { const f = alFinal; alFinal = null; f(); }
  }
  function escribir(t) {
    clearInterval(timer);
    completo = sustituir(t);
    texto.textContent = "";
    flecha.style.visibility = "hidden";
    escribiendo = true;
    if (movimientoReducido) { terminarLinea(); return; }
    let n = 0;
    timer = setInterval(() => {
      n++;
      texto.textContent = completo.slice(0, n);
      if (n % 3 === 0) Sonido.sfx("tecla");
      if (n >= completo.length) terminarLinea();
    }, 24);
  }
  function avanzar() {
    if (escribiendo) { terminarLinea(); return; }
    if (idx < lineas.length - 1) { idx++; Sonido.sfx("pagina"); escribir(lineas[idx]); }
  }
  caja.addEventListener("click", avanzar);
  return {
    decir(nuevas, fin) {
      lineas = Array.isArray(nuevas) ? nuevas : [nuevas];
      idx = 0; alFinal = fin || null;
      escribir(lineas[0]);
    },
    detener() { clearInterval(timer); }
  };
}

/** Crea el HTML de una caja de diálogo */
function crearCajaDialogo(clase) {
  const c = el("div", "dialogo caja " + (clase || ""));
  c.append(el("p", "dialogo-texto"), el("span", "dialogo-flecha", "▼"));
  return c;
}

/* ---- Aviso "¡Has encontrado un recuerdo!" ---- */
let timerToast = null;
function mostrarToast(icono, titulo, sub) {
  const t = $("#toast");
  $(".toast-icono", t).textContent = icono;
  $(".toast-titulo", t).textContent = titulo;
  $(".toast-sub", t).textContent = sub || "";
  t.hidden = false;
  t.classList.remove("ver"); void t.offsetWidth; t.classList.add("ver");
  clearTimeout(timerToast);
  timerToast = setTimeout(() => { t.classList.remove("ver"); t.hidden = true; }, 2600);
}

/* ---- Banner grande: "¡NUEVA RUTA DESBLOQUEADA!" ---- */
function mostrarBanner(l1, l2) {
  return new Promise(res => {
    const b = $("#banner");
    $(".banner-l1", b).textContent = l1;
    $(".banner-l2", b).textContent = l2;
    b.hidden = false; b.classList.remove("ver"); void b.offsetWidth; b.classList.add("ver");
    let cerrado = false;
    const cerrar = () => {
      if (cerrado) return;
      cerrado = true;
      b.classList.remove("ver"); b.hidden = true;
      b.removeEventListener("click", cerrar);
      res();
    };
    b.addEventListener("click", cerrar);
    setTimeout(cerrar, 3200);
  });
}

/* ---- Transición de pantalla: mosaico de píxeles que cubre y descubre ---- */
const Transicion = (() => {
  const COLS = 8, FILAS = 12, PASO = 18, DUR = (COLS + FILAS) * PASO + 260;
  let raiz, titulo;
  function montar() {
    raiz = $("#transicion"); titulo = $(".tr-titulo", raiz);
    const cont = $(".tr-celdas", raiz);
    for (let f = 0; f < FILAS; f++) for (let c = 0; c < COLS; c++) {
      const i = document.createElement("i");
      i.style.setProperty("--d", (f + c) * PASO + "ms");
      cont.append(i);
    }
  }
  /** Cubre la pantalla, ejecuta alMedio() (cambia de escena) y la descubre */
  async function ejecutar(nombre, alMedio) {
    if (movimientoReducido) { if (alMedio) await alMedio(); return; }
    raiz.hidden = false; titulo.textContent = nombre || ""; titulo.classList.remove("ver");
    void raiz.offsetWidth;
    raiz.classList.add("cubre");
    await esperar(DUR);
    titulo.classList.add("ver");
    if (alMedio) await alMedio();
    await esperar(560);
    titulo.classList.remove("ver");
    raiz.classList.remove("cubre");
    await esperar(DUR);
    raiz.hidden = true;
  }
  return { montar, ejecutar };
})();

/* ---- HUD (barra superior) ---- */
function actualizarHUD() {
  const n = contarRecuerdos(), p = calcularProgreso();
  $("#hud-contador").textContent = n + "/" + RECUERDOS.length;
  $("#hud-progreso-texto").textContent = "AVENTURA COMPLETADA: " + p + "%";
  $("#hud-barra-relleno").style.width = p + "%";
}

/* ---- Mochila (inventario) ---- */
function abrirMochila() {
  renderMochila();
  $("#mochila").hidden = false;
  Sonido.sfx("abrir");
}
function cerrarMochila() {
  $("#mochila").hidden = true;
  Sonido.sfx("click");
}
function renderMochila() {
  const rej = $("#mochila-rejilla"), det = $("#mochila-detalle");
  rej.replaceChildren();
  det.textContent = "Toca un objeto para verlo.";
  RECUERDOS.forEach(r => {
    const hallado = !!juego.recuerdos[r.id], t = TIPOS[r.tipo] || TIPOS.recuerdo;
    const b = el("button", "slot" + (hallado ? " hallado" : ""));
    b.append(el("span", "slot-icono", hallado ? t.icono : "❔"), el("span", "slot-nombre", hallado ? r.titulo : "???"));
    b.addEventListener("click", () => {
      Sonido.sfx("click");
      $$(".slot", rej).forEach(s => s.classList.remove("activo"));
      b.classList.add("activo");
      det.replaceChildren();
      if (hallado) {
        det.append(el("strong", "", t.icono + " " + t.nombre + ": " + r.titulo), el("p", "", sustituir(r.texto)),
          el("small", "", "Encontrado en: " + ZONAS[r.zona].nombre));
      } else {
        det.append(el("strong", "", "❔ ???"), el("p", "", "Un recuerdo todavía escondido."),
          el("small", "", "Pista: busca destellos ✨ en «" + ZONAS[r.zona].nombre + "»."));
      }
    });
    rej.append(b);
  });
  $("#mochila-resumen").textContent = "RECUERDOS: " + contarRecuerdos() + "/" + RECUERDOS.length + "  ·  AVENTURA: " + calcularProgreso() + "%";
}

/** Se llama cuando el jugador toca un destello ✨ */
function encontrarRecuerdo(r, boton) {
  if (juego.recuerdos[r.id]) return;
  juego.recuerdos[r.id] = true;
  guardarPartida();
  Sonido.sfx("item");
  if (boton) { boton.classList.add("recogido"); setTimeout(() => boton.remove(), 650); }
  const t = TIPOS[r.tipo] || TIPOS.recuerdo;
  mostrarToast(t.icono, TEXTOS.avisoRecuerdo, t.nombre + ": " + r.titulo + "  ·  " + contarRecuerdos() + "/" + RECUERDOS.length);
  actualizarHUD();
  const bolsa = $("#btn-mochila");
  bolsa.classList.remove("pulso"); void bolsa.offsetWidth; bolsa.classList.add("pulso");
}


/* ==========================================================================
   8. MAPA
   La cuadrícula es de 20 x 20 casillas de 16 px. Leyenda del dibujo:
     .  pasto      f  flores      =  camino      B  puente     ~  agua
     #  árbol      p  árbol rosa  M  montaña     r  roca       w  cartel
   Los edificios se colocan aparte (MAPA.edificios) y bloquean el paso.
   ========================================================================== */
const MAPA = {
  T: 16, cols: 20, filas: 20,
  grid: [
    "####p#####p###MMMMMM",
    "#.......p....~.~.MMM",
    "#......f.....~~~..MM",
    "#.........=...~....M",
    "#.....f...=.....f..#",
    "#..=....p.=........#",
    "#..=.f....=........#",
    "#..=============.f.#",
    "#...f...=w....f....#",
    "#.....r.=........p.#",
    "#...f...=.........f#",
    "#..f....=====......#",
    "~~~~~~~~B~..=.....p#",
    "~~~~~~~~B~.f=......#",
    "#.......=...=......#",
    "#.......=.f.=......#",
    "#.......=...=====..#",
    "#.......=.....MMMMMM",
    "#...=====....MMMMMMM",
    "####p#######p#######"
  ],
  edificios: [
    { zona: "colegio",     tipo: "colegio", x: 2,  y: 2,  w: 4, h: 3 },
    { zona: "primeros",    tipo: "casa",    x: 9,  y: 1,  w: 3, h: 2 },
    { zona: "lugares",     tipo: "pueblo",  x: 14, y: 5,  w: 4, h: 2 },
    { zona: "banda",       tipo: "sala",    x: 11, y: 9,  w: 3, h: 2 },
    { zona: "universidad", tipo: "uni",     x: 2,  y: 15, w: 5, h: 3 },
    { zona: "proxima",     tipo: "puerta",  x: 15, y: 14, w: 3, h: 2 }
  ],
  inicio: { lider: { x: 8, y: 8 }, seguidor: { x: 8, y: 7 } }
};
let frameAgua = 0;

// Puerta y casilla de entrada de cada edificio (la casilla justo debajo de la puerta)
MAPA.edificios.forEach(e => {
  e.puertaX = e.x + Math.floor((e.w - 1) / 2);
  e.entrada = { x: e.puertaX, y: e.y + e.h };
});
const edificioDe = zona => MAPA.edificios.find(e => e.zona === zona);

function tileEn(x, y) {
  return x < 0 || y < 0 || x >= MAPA.cols || y >= MAPA.filas ? null : MAPA.grid[y][x];
}
function enEdificio(x, y) {
  return MAPA.edificios.some(e => x >= e.x && x < e.x + e.w && y >= e.y && y < e.y + e.h);
}
function caminable(x, y) {
  const c = tileEn(x, y);
  return c !== null && ".f=B".indexOf(c) >= 0 && !enEdificio(x, y);
}
const esCamino = (x, y) => { const c = tileEn(x, y); return c === "=" || c === "B"; };

/** Ruta más corta (prefiere caminos sobre pasto). Devuelve las casillas SIN incluir el inicio. */
function buscarCamino(a, b) {
  const W = MAPA.cols, N = W * MAPA.filas;
  const costo = Array(N).fill(Infinity), previo = Array(N).fill(-1), hecho = Array(N).fill(false);
  const ini = a.y * W + a.x, fin = b.y * W + b.x;
  costo[ini] = 0;
  for (;;) {
    let u = -1, m = Infinity;
    for (let i = 0; i < N; i++) if (!hecho[i] && costo[i] < m) { m = costo[i]; u = i; }
    if (u < 0) break;
    hecho[u] = true;
    if (u === fin) break;
    const ux = u % W, uy = (u / W) | 0;
    [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
      const nx = ux + dx, ny = uy + dy;
      if (!caminable(nx, ny)) return;
      const v = ny * W + nx, c = m + (esCamino(nx, ny) ? 1 : 4);
      if (c < costo[v]) { costo[v] = c; previo[v] = u; }
    });
  }
  if (ini === fin || previo[fin] < 0) return [];
  const ruta = [];
  for (let cur = fin; cur !== ini; cur = previo[cur]) ruta.unshift({ x: cur % W, y: (cur / W) | 0 });
  return ruta;
}

/* ---- Dibujo de cada casilla ---- */
function dibujarTile(g, ch, tx, ty, frame) {
  const P = COLORES.mapa, x = tx * 16, y = ty * 16;
  const r = (c, dx, dy, w, h) => { g.fillStyle = c; g.fillRect(x + dx, y + dy, w, h); };
  const pasto = () => {
    r(P.pasto1, 0, 0, 16, 16);
    for (let i = 0; i < 4; i++) {
      const hx = Math.floor(hash(tx, ty, i) * 14), hy = Math.floor(hash(tx, ty, i + 9) * 13);
      r(i % 2 ? P.pasto2 : P.pasto3, hx, hy, 1, 2);
      r(i % 2 ? P.pasto2 : P.pasto3, hx + 1, hy + 1, 1, 1);
    }
  };
  switch (ch) {
    case "~": case "B": {
      r(P.agua1, 0, 0, 16, 16);
      for (let i = 0; i < 3; i++) {
        const wx = Math.floor(hash(tx, ty, i) * 9) + (frame ? 3 : 0), wy = 2 + i * 5;
        r(P.agua2, wx, wy, 4, 1); r(P.agua3, (wx + 7) % 12, wy + 2, 3, 1);
      }
      const agua = (a, b) => { const c = tileEn(a, b); return c === null || c === "~" || c === "B"; };
      if (ch === "~") {
        if (!agua(tx, ty - 1)) { r(P.orilla, 0, 0, 16, 2); r(P.agua2, 0, 2, 16, 1); }
        if (!agua(tx, ty + 1)) { r(P.orilla, 0, 14, 16, 2); r(P.agua2, 0, 13, 16, 1); }
        if (!agua(tx - 1, ty)) r(P.orilla, 0, 0, 2, 16);
        if (!agua(tx + 1, ty)) r(P.orilla, 14, 0, 2, 16);
      } else {
        // puente de madera (vertical): tablones y barandas
        r(P.madera1, 2, 0, 12, 16);
        for (let k = 0; k < 4; k++) { r(P.madera2, 2, k * 4 + 3, 12, 1); r(P.madera3, 2, k * 4 + 4, 12, 1); }
        r(P.madera3, 0, 0, 2, 16); r(P.madera3, 14, 0, 2, 16);
        r(P.madera2, 1, 0, 1, 16); r(P.madera2, 14, 0, 1, 16);
        r("rgba(0,0,0,.18)", 2, 0, 1, 16);
      }
      break;
    }
    case "=": {
      r(P.camino1, 0, 0, 16, 16);
      for (let i = 0; i < 3; i++) {
        const hx = Math.floor(hash(tx, ty, i + 20) * 12), hy = Math.floor(hash(tx, ty, i + 30) * 13);
        r(P.camino2, hx, hy, 2, 1); r(P.camino3, hx + 4, hy + 1, 1, 1);
      }
      if (!esCamino(tx, ty - 1)) r(P.camino3, 0, 0, 16, 2);
      if (!esCamino(tx, ty + 1)) r(P.camino3, 0, 14, 16, 2);
      if (!esCamino(tx - 1, ty)) r(P.camino3, 0, 0, 2, 16);
      if (!esCamino(tx + 1, ty)) r(P.camino3, 14, 0, 2, 16);
      break;
    }
    case "#": case "p": {
      pasto();
      const rosa = ch === "p";
      r("rgba(30,60,40,.28)", 3, 12, 10, 3);
      r(P.tronco, 7, 9, 3, 6);
      disco(g, rosa ? P.rosa3 : P.arbol3, x + 8, y + 6, 6);
      disco(g, rosa ? P.rosa1 : P.arbol1, x + 7, y + 5, 5);
      disco(g, rosa ? P.rosa2 : P.arbol2, x + 5, y + 3, 2);
      break;
    }
    case "M": {
      r(P.roca2, 0, 0, 16, 16);
      const px = 5 + Math.floor(hash(tx, ty, 1) * 6), alto = 9 + Math.floor(hash(tx, ty, 2) * 5);
      for (let j = 0; j < alto; j++) {
        const hw = Math.floor((j + 1) * 0.6), fy = 15 - alto + j + 1;
        r(P.roca1, px - hw, fy, hw, 1); r(P.roca3, px, fy, hw, 1);
      }
      r(P.nieve, px - 1, 15 - alto + 1, 2, 1); r(P.nieve, px - 2, 15 - alto + 2, 4, 1);
      break;
    }
    case "f": {
      pasto();
      const cols = [P.rosa1, "#fff3a6", "#ffffff", "#f5a15a"];
      for (let i = 0; i < 3; i++) {
        const fx = 2 + Math.floor(hash(tx, ty, i + 40) * 11), fy = 2 + Math.floor(hash(tx, ty, i + 50) * 10);
        r(cols[(tx + ty + i) % 4], fx, fy, 2, 2); r(P.arbol3, fx, fy + 2, 1, 2);
      }
      break;
    }
    case "r": {
      pasto();
      r(P.roca3, 3, 12, 11, 2); r(P.roca2, 3, 8, 10, 5); r(P.roca1, 4, 7, 6, 3); r(P.roca1, 5, 6, 3, 1);
      break;
    }
    case "w": {
      pasto();
      r(P.madera3, 7, 7, 2, 8); r(P.madera2, 3, 2, 10, 7); r(P.madera1, 4, 3, 8, 5);
      r(P.rosa3, 7, 4, 2, 2); r(P.rosa3, 6, 5, 4, 1);
      break;
    }
    default: pasto();
  }
}

function dibujarEdificioMapa(g, e) {
  const x = e.x * 16, y = e.y * 16, w = e.w * 16, h = e.h * 16, dx = (e.puertaX - e.x) * 16 + 8;
  switch (e.tipo) {
    case "colegio": edificioPx(g, x, y, w, h, { techo: "#c0504f", pared: "#f3dfb2", doorX: dx, extra: "reloj" }); break;
    case "casa":    edificioPx(g, x, y, w, h, { techo: "#e0709c", pared: "#fff0d6", doorX: dx, extra: "corazon" }); break;
    case "pueblo":
      edificioPx(g, x, y, 32, h, { techo: "#4f86c6", pared: "#f6e2b8", doorX: dx });
      edificioPx(g, x + 32, y, 32, h, { techo: "#e8a13a", pared: "#f3d3c0", doorX: 8 });
      break;
    case "sala":    edificioPx(g, x, y, w, h, { techo: "#2f9c98", pared: "#f7e6c4", doorX: dx, extra: "nota" }); break;
    case "uni":     edificioPx(g, x, y, w, h, { techo: "#4a6fb5", pared: "#efd9b0", doorX: dx, extra: "torre", bandera: false }); break;
    case "puerta":  dibujarPuerta(g, x, y, w, h, juego.proximaLibre); break;
  }
}

function dibujarMapaBase() {
  const g = $("#mapa-canvas").getContext("2d");
  g.imageSmoothingEnabled = false;
  for (let y = 0; y < MAPA.filas; y++) for (let x = 0; x < MAPA.cols; x++) dibujarTile(g, MAPA.grid[y][x], x, y, frameAgua);
  MAPA.edificios.forEach(e => dibujarEdificioMapa(g, e));
}
/** El agua se anima redibujando solo sus casillas cada ~0.7 s */
function animarAgua() {
  if (document.hidden || !$("#pantalla-mapa").classList.contains("activa")) return;
  frameAgua ^= 1;
  const g = $("#mapa-canvas").getContext("2d");
  for (let y = 12; y <= 13; y++) for (let x = 0; x <= 9; x++) dibujarTile(g, MAPA.grid[y][x], x, y, frameAgua);
  [[13, 1], [15, 1], [13, 2], [14, 2], [15, 2], [14, 3]].forEach(([x, y]) => dibujarTile(g, "~", x, y, frameAgua));
}

/* ---- Personajes en el mapa ---- */
const VELOCIDAD = 150;   // píxeles lógicos por segundo
const DIST_SEG = 16;     // distancia a la que el segundo personaje sigue al primero
const grupo = {
  lider: { x: 0, y: 0, dir: 1, el: null }, seguidor: { x: 0, y: 0, dir: 1, el: null },
  dist: 0, rastro: [], idx: 0, tile: { x: 8, y: 8 }
};

function crearPersonajesMapa() {
  const cont = $("#mapa-personajes");
  cont.replaceChildren();
  ["seguidor", "lider"].forEach(k => {
    const quien = k === "lider" ? "yo" : "pareja";
    const pj = el("div", "pj");
    pj.append(crearSprite(quien, "sprite"));
    cont.append(pj);
    grupo[k].el = pj;
  });
}
function reiniciarPersonajes() {
  const L = MAPA.inicio.lider, F = MAPA.inicio.seguidor;
  grupo.lider.x = L.x * 16 + 8; grupo.lider.y = L.y * 16 + 14;
  grupo.seguidor.x = F.x * 16 + 8; grupo.seguidor.y = F.y * 16 + 14;
  grupo.dist = 0; grupo.idx = 0;
  grupo.rastro = [{ x: grupo.seguidor.x, y: grupo.seguidor.y, d: -DIST_SEG }, { x: grupo.lider.x, y: grupo.lider.y, d: 0 }];
  grupo.tile = { x: L.x, y: L.y };
  pintarGrupo();
}
function pintarGrupo() {
  ["lider", "seguidor"].forEach(k => {
    const p = grupo[k];
    p.el.style.left = (p.x / (MAPA.cols * 16)) * 100 + "%";
    p.el.style.top = (p.y / (MAPA.filas * 16)) * 100 + "%";
    p.el.style.zIndex = 10 + Math.round(p.y);
    p.el.style.setProperty("--dir", p.dir);
  });
}
function posicionarSeguidor() {
  const g = grupo, ds = g.dist - DIST_SEG;
  while (g.idx < g.rastro.length - 2 && g.rastro[g.idx + 1].d <= ds) g.idx++;
  const a = g.rastro[g.idx], b = g.rastro[g.idx + 1];
  let nx = a.x, ny = a.y;
  if (b && b.d > a.d) {
    const t = Math.max(0, Math.min(1, (ds - a.d) / (b.d - a.d)));
    nx = a.x + (b.x - a.x) * t; ny = a.y + (b.y - a.y) * t;
  }
  if (nx < g.seguidor.x - 0.01) g.seguidor.dir = -1; else if (nx > g.seguidor.x + 0.01) g.seguidor.dir = 1;
  g.seguidor.x = nx; g.seguidor.y = ny;
  if (g.idx > 300) { g.rastro.splice(0, g.idx); g.idx = 0; }
}
function setCaminando(si) {
  grupo.lider.el.classList.toggle("caminando", si);
  grupo.seguidor.el.classList.toggle("caminando", si);
}
/** Mueve al grupo por una lista de casillas. Devuelve una promesa que se cumple al llegar. */
function caminar(ruta) {
  return new Promise(resolver => {
    if (!ruta.length) { resolver(); return; }
    const g = grupo;
    const puntos = ruta.map(t => ({ x: t.x * 16 + 8, y: t.y * 16 + 14 }));
    let i = 0, ultimo = performance.now(), acumulado = 0;
    setCaminando(true);
    function frame(ahora) {
      const dt = Math.min(0.05, (ahora - ultimo) / 1000);
      ultimo = ahora;
      let restante = VELOCIDAD * dt;
      while (restante > 0 && i < puntos.length) {
        const p = puntos[i], dx = p.x - g.lider.x, dy = p.y - g.lider.y, d = Math.hypot(dx, dy);
        if (dx < 0) g.lider.dir = -1; else if (dx > 0) g.lider.dir = 1;
        if (d <= restante) {
          g.lider.x = p.x; g.lider.y = p.y; restante -= d; g.dist += d; acumulado += d; i++;
        } else {
          g.lider.x += (dx / d) * restante; g.lider.y += (dy / d) * restante; g.dist += restante; acumulado += restante; restante = 0;
        }
        g.rastro.push({ x: g.lider.x, y: g.lider.y, d: g.dist });
      }
      if (acumulado > 26) { Sonido.sfx("paso"); acumulado = 0; }
      posicionarSeguidor();
      pintarGrupo();
      if (i < puntos.length) requestAnimationFrame(frame);
      else { setCaminando(false); resolver(); }
    }
    requestAnimationFrame(frame);
  });
}
async function caminarHasta(destino) {
  const ruta = buscarCamino(grupo.tile, destino);
  await caminar(ruta);
  grupo.tile = { x: destino.x, y: destino.y };
}

/* ---- Zonas tocables del mapa ---- */
let mapaDialogo = null;

function crearZonasMapa() {
  const cont = $("#mapa-zonas");
  cont.replaceChildren();
  MAPA.edificios.forEach(e => {
    const b = el("button", "zona zona-" + e.zona);
    b.dataset.zona = e.zona;
    b.style.left = ((e.x - 0.4) / MAPA.cols) * 100 + "%";
    b.style.top = (e.y / MAPA.filas) * 100 + "%";
    b.style.width = ((e.w + 0.8) / MAPA.cols) * 100 + "%";
    b.style.height = ((e.h + 1) / MAPA.filas) * 100 + "%";
    const etiqueta = el("span", "zona-etiqueta");
    etiqueta.append(el("span", "zona-icono", "▼"), el("span", "zona-nombre", ZONAS[e.zona].nombre));
    b.append(etiqueta);
    b.setAttribute("aria-label", ZONAS[e.zona].nombre);
    b.addEventListener("click", () => abrirZona(e.zona));
    cont.append(b);
  });
}
/** Actualiza etiquetas del mapa: visitada ♥, bloqueada 🔒, nueva ▼ */
function refrescarMapa() {
  $$("#mapa-zonas .zona").forEach(b => {
    const id = b.dataset.zona, bloqueada = id === "proxima" && !juego.proximaLibre, visitada = !!juego.zonas[id];
    b.classList.toggle("bloqueada", bloqueada);
    b.classList.toggle("visitada", visitada);
    b.classList.toggle("nueva", !visitada && !bloqueada);
    $(".zona-icono", b).textContent = bloqueada ? "🔒" : visitada ? "♥" : "▼";
  });
  $("#mapa-niebla").classList.toggle("disipada", juego.proximaLibre);
  dibujarMapaBase();
}
function montarMapa() {
  crearZonasMapa();
  crearPersonajesMapa();
  mapaDialogo = crearDialogo($("#mapa-dialogo"));
  reiniciarPersonajes();
  refrescarMapa();
  setInterval(animarAgua, 700);
}

/** El jugador toca una zona: caminan hasta la puerta, transición y nueva escena */
async function abrirZona(id) {
  if (ocupado) return;
  if (id === "proxima" && !juego.proximaLibre) {
    Sonido.sfx("error");
    const b = $('.zona[data-zona="proxima"]');
    b.classList.remove("sacudir"); void b.offsetWidth; b.classList.add("sacudir");
    mapaDialogo.decir(TEXTOS.bloqueada);
    return;
  }
  ocupado = true;
  Sonido.sfx("click");
  mapaDialogo.decir(TEXTOS.rumbo.replace("{zona}", ZONAS[id].nombre));
  await caminarHasta(edificioDe(id).entrada);
  Sonido.sfx("abrir");
  await Transicion.ejecutar(ZONAS[id].nombre.toUpperCase(), () => entrarEscena(id));
  ocupado = false;
}

/** Al visitar las 5 zonas principales se abre la PRÓXIMA RUTA */
async function revisarDesbloqueo() {
  if (juego.proximaLibre || !todasPrincipalesVisitadas()) return;
  juego.proximaLibre = true;
  guardarPartida();
  ocupado = true;
  Sonido.sfx("desbloqueo");
  refrescarMapa();
  await mostrarBanner(TEXTOS.bannerLinea1, TEXTOS.bannerLinea2);
  mapaDialogo.decir(TEXTOS.desbloqueada);
  ocupado = false;
}

async function volverAlMapa() {
  if (ocupado) return;
  ocupado = true;
  Sonido.sfx("click");
  await Transicion.ejecutar("MAPA", () => {
    if (escenaActual) escenaActual.dlg.detener();
    Pantallas.mostrar("pantalla-mapa");
    refrescarMapa();
    actualizarHUD();
    mapaDialogo.decir(TEXTOS.mapaPista);
  });
  ocupado = false;
  await revisarDesbloqueo();
}

/* ==========================================================================
   9. ESCENAS
   Cada zona tiene una función render*: recibe { id, cfg, cuerpo, dlg } y
   agrega su contenido dentro de "cuerpo". "dlg" es la caja de diálogo de abajo.
   Los textos NO están aquí: se editan en la sección PERSONALIZACIÓN.
   ========================================================================== */
let escenaActual = null;

function entrarEscena(id) {
  juego.zonas[id] = true;
  guardarPartida();
  escenaActual = construirEscena(id);
  Pantallas.mostrar("pantalla-escena");
  actualizarHUD();
}

function construirEscena(id) {
  const cont = $("#pantalla-escena");
  cont.replaceChildren();
  const cfg = ZONAS[id];
  const shell = el("div", "escena escena-" + id);
  const barra = el("header", "escena-barra");
  const volver = el("button", "boton boton-mini", "◀ MAPA");
  volver.addEventListener("click", volverAlMapa);
  barra.append(volver, el("h2", "escena-titulo", NUMERO_ZONA[id] + ". " + cfg.nombre));
  const cuerpo = el("div", "escena-cuerpo");
  const cajaDlg = crearCajaDialogo("dialogo-escena");
  shell.append(barra, cuerpo, cajaDlg);
  cont.append(shell);
  const c = { id, cfg, cuerpo, dlg: crearDialogo(cajaDlg) };
  RENDER[id](c);
  cuerpo.scrollTop = 0;
  return c;
}

/* ---- Piezas reutilizables ---- */

/** Dibuja el arte automático y, si existe, lo reemplaza por tu imagen PNG */
function rellenarArte(cont, arte, src, vigente) {
  cont.replaceChildren();
  const cv = document.createElement("canvas");
  cv.width = AW; cv.height = AH; cv.className = "visual-arte";
  Arte.dibujar(cv, arte);
  cont.append(cv);
  if (!src) return;
  cont.append(el("span", "visual-ayuda ayuda", "🖼️ AGREGAR: " + src));
  cargarImagen(src).then(ok => {
    if (!ok || (vigente && !vigente())) return;
    const i = new Image();
    i.src = src; i.alt = ""; i.className = "visual-arte"; i.draggable = false;
    cont.replaceChildren(i);
  });
}

/** Cuadro de ilustración con los dos personajes (los destellos ✨ se colocan encima) */
function crearVisual(o) {
  const v = el("div", "visual arte");
  const fondo = el("div", "visual-fondo");
  v.append(fondo);
  v._token = 0;
  pintarFondo(v, o.arte, o.imagen);
  if (o.personajes !== false) {
    const pj = el("div", "visual-personajes");
    pj.append(crearSprite("yo", "sprite"), crearSprite("pareja", "sprite"));
    v.append(pj);
  }
  return v;
}
function pintarFondo(v, arte, imagen) {
  const token = ++v._token;
  rellenarArte($(".visual-fondo", v), arte, imagen, () => token === v._token);
}

/** Imagen con recuadro de aviso si el archivo todavía no existe */
function crearImagen(src, clase, icono, texto) {
  const cont = el("div", "img-caja " + (clase || ""));
  const ph = el("div", "placeholder");
  ph.append(el("span", "ph-icono", icono || "🖼️"), el("span", "ph-texto ayuda", texto || "AGREGAR IMAGEN:"), el("span", "ph-ruta ayuda", src));
  cont.append(ph);
  cargarImagen(src).then(ok => {
    if (!ok) return;
    const i = new Image();
    i.src = src; i.alt = ""; i.draggable = false;
    cont.replaceChildren(i);
  });
  return cont;
}
function crearFoto(src, leyenda) {
  const f = el("figure", "polaroid");
  f.append(crearImagen(src, "polaroid-marco", "📷", "AGREGAR FOTO:"));
  if (leyenda) f.append(el("figcaption", "polaroid-leyenda", leyenda));
  return f;
}
function crearObjeto(obj) {
  const f = el("figure", "polaroid objeto");
  f.append(crearImagen(obj.imagen, "polaroid-marco", "🎟️", "AGREGAR OBJETO:"), el("figcaption", "polaroid-leyenda", obj.nombre));
  return f;
}

/** Coloca los destellos ✨ (recuerdos por encontrar) de una zona sobre "visual" */
function colocarBrillos(visual, zona) {
  RECUERDOS.filter(r => r.zona === zona && !juego.recuerdos[r.id]).forEach(r => {
    const b = el("button", "brillo", "✨");
    b.style.left = r.x + "%"; b.style.top = r.y + "%";
    b.setAttribute("aria-label", "Algo brilla aquí");
    b.addEventListener("click", e => { e.stopPropagation(); encontrarRecuerdo(r, b); });
    visual.append(b);
  });
}

/* ---- 1. COLEGIO ---- */
function renderColegio(c) {
  const { cfg, cuerpo, dlg } = c;
  // REEMPLAZAR CON NUESTRO RECUERDO REAL:
  //   · ilustración  → ZONAS.colegio.imagen  (assets/lugares/colegio.png)
  //   · fotografía   → ZONAS.colegio.foto    (assets/recuerdos/foto-colegio.png)
  //   · objeto       → ZONAS.colegio.objeto  (assets/objetos/colegio.png)
  //   · texto        → ZONAS.colegio.dialogos
  const visual = crearVisual({ arte: "colegio", imagen: cfg.imagen });
  colocarBrillos(visual, "colegio");
  const libreta = el("div", "libreta caja");
  const fila = el("div", "libreta-fila");
  fila.append(crearFoto(cfg.foto, "Foto"), crearObjeto(cfg.objeto));
  libreta.append(el("h3", "libreta-titulo", cfg.tituloLibreta), fila, el("p", "libreta-nota", sustituir(cfg.notaLibreta)));
  cuerpo.append(visual, libreta);
  dlg.decir(cfg.dialogos);
}

/* ---- 2. PRIMEROS MESES ---- */
function renderPrimeros(c) {
  const { cfg, cuerpo, dlg } = c;
  const visual = crearVisual({ arte: "atardecer", imagen: cfg.imagen });
  colocarBrillos(visual, "primeros");
  const libreta = el("div", "libreta caja");
  const ul = el("ul", "lista-check");
  cfg.momentos.forEach(m => ul.append(el("li", "", sustituir(m))));
  libreta.append(el("h3", "libreta-titulo", cfg.tituloLibreta), ul, crearFoto(cfg.foto, "Foto"));
  cuerpo.append(visual, libreta);
  dlg.decir(cfg.dialogos);
}

/* ---- 3. NUESTROS LUGARES: álbum-mapa interactivo ---- */
function posicionPin(l, i, n) {
  if (typeof l.x === "number" && typeof l.y === "number") return { x: l.x, y: l.y };
  const filas = Math.ceil(n / 3), fila = Math.floor(i / 3), col = i % 3;
  const xs = [20, 50, 80], c2 = fila % 2 ? 2 - col : col;
  return { x: xs[c2], y: filas > 1 ? 20 + fila * (60 / (filas - 1)) : 50 };
}

function renderLugares(c) {
  const { cfg, cuerpo, dlg } = c;
  const n = LUGARES.length;
  const pos = LUGARES.map((l, i) => posicionPin(l, i, n));

  // tablero (pergamino) con puntos tocables
  const tablero = el("div", "visual arte tablero");
  const fondo = el("div", "visual-fondo");
  const cv = document.createElement("canvas");
  cv.width = AW; cv.height = AH; cv.className = "visual-arte";
  Arte.tablero(cv, pos);
  fondo.append(cv);
  tablero.append(fondo);
  const pins = LUGARES.map((l, i) => {
    const b = el("button", "pin" + (juego.lugaresVistos[i] ? " visto" : ""));
    b.style.left = pos[i].x + "%"; b.style.top = pos[i].y + "%";
    b.append(el("span", "pin-num", String(i + 1)));
    b.setAttribute("aria-label", l.nombre);
    b.addEventListener("click", () => elegir(i));
    tablero.append(b);
    return b;
  });
  colocarBrillos(tablero, "lugares");

  // ficha del lugar seleccionado
  const ficha = el("div", "ficha caja");
  let fImg = el("div", "ficha-imagen img-caja");
  const fInfo = el("div", "ficha-info");
  const fNombre = el("h3", "ficha-nombre"), fFecha = el("p", "ficha-fecha"), fDesc = el("p", "ficha-desc");
  fInfo.append(fNombre, fFecha, fDesc);
  const nav = el("div", "ficha-nav");
  const ant = el("button", "boton boton-mini", "◀"), sig = el("button", "boton boton-mini", "▶");
  ant.setAttribute("aria-label", "Lugar anterior"); sig.setAttribute("aria-label", "Lugar siguiente");
  nav.append(ant, el("span", "ficha-cuenta"), sig);
  ficha.append(fImg, fInfo, nav);
  fNombre.textContent = "¿Dónde estuvimos?";
  fDesc.textContent = cfg.sinSeleccion;
  fImg.append(el("div", "placeholder", "📍"));
  let actual = -1;

  function elegir(i) {
    if (!n) return;
    actual = (i + n) % n;
    const l = LUGARES[actual];
    Sonido.sfx("pagina");
    pins.forEach((p, k) => p.classList.toggle("activo", k === actual));
    pins[actual].classList.add("visto");
    juego.lugaresVistos[actual] = true;
    guardarPartida();
    const nuevaImg = el("div", "ficha-imagen img-caja pop");
    rellenarArte(nuevaImg, l.arte, l.imagen, () => document.contains(nuevaImg));
    fImg.replaceWith(nuevaImg);
    fImg = nuevaImg;
    fNombre.textContent = sustituir(l.nombre);
    fFecha.textContent = l.fecha ? "📅 " + l.fecha : "";
    fFecha.hidden = !l.fecha;
    fDesc.textContent = sustituir(l.descripcion || "");
    $(".ficha-cuenta", nav).textContent = actual + 1 + " / " + n;
    dlg.decir([l.recuerdo]);
  }
  ant.addEventListener("click", () => elegir(actual < 0 ? n - 1 : actual - 1));
  sig.addEventListener("click", () => elegir(actual + 1));
  $(".ficha-cuenta", nav).textContent = "0 / " + n;

  cuerpo.append(tablero, ficha);
  dlg.decir(cfg.dialogos);
}

/* ---- 4. BANDA SONORA: reproductor ---- */
function renderBanda(c) {
  const { cfg, cuerpo, dlg } = c;
  let actual = 0, sonando = false;

  const rep = el("div", "visual reproductor");
  const lcd = el("div", "lcd");
  const lPista = el("span", "lcd-pista"), lTitulo = el("strong", "lcd-titulo"), lArtista = el("span", "lcd-artista");
  const eq = el("div", "ecualizador");
  for (let i = 0; i < 7; i++) eq.append(document.createElement("i"));
  lcd.append(lPista, lTitulo, lArtista, eq);
  const controles = el("div", "controles");
  const bPrev = el("button", "boton boton-control", "⏮"), bPlay = el("button", "boton boton-control boton-oro", "▶"), bNext = el("button", "boton boton-control", "⏭");
  bPrev.setAttribute("aria-label", "Pista anterior"); bPlay.setAttribute("aria-label", "Reproducir"); bNext.setAttribute("aria-label", "Pista siguiente");
  controles.append(bPrev, bPlay, bNext);
  const enlaces = el("div", "enlaces");
  const embed = el("div", "embed");
  rep.append(lcd, controles, enlaces, embed);
  colocarBrillos(rep, "banda");

  const lista = el("div", "lista-pistas caja");
  const filas = CANCIONES.map((t, i) => {
    const b = el("button", "pista");
    b.append(el("span", "pista-num", String(i + 1)), el("span", "pista-titulo", t.titulo), el("span", "pista-artista", t.artista));
    b.addEventListener("click", () => { Sonido.sfx("click"); mostrar(i); });
    lista.append(b);
    return b;
  });

  function mostrar(i) {
    if (!CANCIONES.length) return;
    actual = (i + CANCIONES.length) % CANCIONES.length;
    const t = CANCIONES[actual];
    sonando = false;
    embed.replaceChildren(); eq.classList.remove("on"); bPlay.textContent = "▶";
    filas.forEach((f, k) => f.classList.toggle("activa", k === actual));
    lPista.textContent = "PISTA " + (actual + 1) + "/" + CANCIONES.length + (t.fecha ? "  ·  " + t.fecha : "");
    lTitulo.textContent = sustituir(t.titulo);
    lArtista.textContent = t.artista;
    // enlaces legales (solo aparecen los que hayas escrito en CANCIONES)
    enlaces.replaceChildren();
    [["spotify", "SPOTIFY"], ["youtube", "YOUTUBE"], ["apple", "APPLE MUSIC"]].forEach(([k, nombre]) => {
      if (!t[k]) return;
      const a = el("a", "boton boton-mini enlace", "♪ " + nombre);
      a.href = t[k]; a.target = "_blank"; a.rel = "noopener noreferrer";
      enlaces.append(a);
    });
    if (!enlaces.children.length) enlaces.append(el("span", "enlaces-vacio ayuda", "🔗 Sin enlace todavía: agrega spotify / youtube / apple en CANCIONES"));
    dlg.decir([t.recuerdo]);
  }
  bPrev.addEventListener("click", () => { Sonido.sfx("click"); mostrar(actual - 1); });
  bNext.addEventListener("click", () => { Sonido.sfx("click"); mostrar(actual + 1); });
  bPlay.addEventListener("click", () => {
    Sonido.sfx("click");
    const t = CANCIONES[actual];
    if (!t) return;
    if (t.embed) {
      // reproductor legal incrustado (Spotify / YouTube)
      sonando = !sonando;
      embed.replaceChildren();
      eq.classList.toggle("on", sonando);
      bPlay.textContent = sonando ? "⏸" : "▶";
      if (sonando) {
        const f = document.createElement("iframe");
        f.src = t.embed; f.title = t.titulo; f.loading = "lazy";
        f.allow = "autoplay; encrypted-media; clipboard-write; fullscreen";
        embed.append(f);
      }
    } else if (t.spotify || t.youtube || t.apple) {
      window.open(t.spotify || t.youtube || t.apple, "_blank", "noopener");
    } else {
      mostrarToast("🎵", "Sin enlace todavía", "Agrégalo en CANCIONES (game.js)");
    }
  });

  cuerpo.append(rep, lista);
  if (CANCIONES.length) {
    // muestra la primera pista y luego el diálogo de introducción
    mostrar(0);
    dlg.decir(cfg.dialogos);
  }
}

/* ---- 5. UNIVERSIDAD: libreta con pestañas ---- */
function renderUniversidad(c) {
  const { cfg, cuerpo, dlg } = c;
  const secs = UNIVERSIDAD.secciones;
  const visual = crearVisual({ arte: secs[0].arte, imagen: secs[0].imagen });
  colocarBrillos(visual, "universidad");
  const extra = el("div", "extra");
  const tabs = el("div", "pestanas");
  const panel = el("div", "libreta caja panel-uni");

  function abrir(i, hablar) {
    const s = secs[i];
    $$(".pestana", tabs).forEach((b, k) => b.classList.toggle("activa", k === i));
    pintarFondo(visual, s.arte, s.imagen);
    panel.replaceChildren(el("h3", "libreta-titulo", s.icono + " " + s.titulo));
    const ul = el("ul", "lista-check");
    s.items.forEach(t => ul.append(el("li", "", sustituir(t))));
    panel.append(ul);
    if (s.fotos && s.fotos.length) {
      const fr = el("div", "fotos-fila");
      s.fotos.forEach(f => fr.append(crearFoto(f, "")));
      panel.append(fr);
    }
    if (hablar) dlg.decir([s.dialogo]);
  }
  secs.forEach((s, i) => {
    const b = el("button", "pestana");
    b.append(el("span", "pestana-icono", s.icono), el("span", "pestana-nombre", s.titulo));
    b.addEventListener("click", () => { Sonido.sfx("click"); abrir(i, true); });
    tabs.append(b);
  });
  extra.append(tabs, panel);
  cuerpo.append(visual, extra);
  abrir(0, false);
  dlg.decir(cfg.dialogos);
}

/* ---- 6. PRÓXIMA RUTA ---- */
function renderProxima(c) {
  const { cfg, cuerpo, dlg } = c;
  const visual = crearVisual({ arte: "noche", imagen: cfg.imagen });
  colocarBrillos(visual, "proxima");
  const extra = el("div", "extra");
  const rej = el("div", "casillas caja");
  const total = PROXIMA_RUTA.casillas.length;
  let abiertas = 0;
  const seguir = el("button", "boton boton-grande boton-oro", PROXIMA_RUTA.textoBoton + " ▶");
  seguir.hidden = true;
  seguir.addEventListener("click", irAlFinal);

  PROXIMA_RUTA.casillas.forEach(cs => {
    const b = el("button", "casilla");
    const icono = el("span", "casilla-icono", "?");
    b.append(icono);
    b.addEventListener("click", () => {
      const nueva = !b.classList.contains("abierta");
      if (nueva) { b.classList.add("abierta"); icono.textContent = cs.icono; abiertas++; }
      Sonido.sfx("pagina");
      if (nueva && abiertas === total) {
        dlg.decir([cs.texto, PROXIMA_RUTA.textoFinalCasillas], () => { seguir.hidden = false; Sonido.sfx("desbloqueo"); });
      } else dlg.decir([cs.texto]);
    });
    rej.append(b);
  });
  extra.append(rej, seguir);
  cuerpo.append(visual, extra);
  dlg.decir(PROXIMA_RUTA.dialogos);
}

const RENDER = {
  colegio: renderColegio, primeros: renderPrimeros, lugares: renderLugares,
  banda: renderBanda, universidad: renderUniversidad, proxima: renderProxima
};


/* ==========================================================================
   10. FINAL Y ARRANQUE
   ========================================================================== */
let dlgFinal = null;

/** Medalla original de 48 x 64 píxeles */
function dibujarMedalla(cv) {
  const g = cv.getContext("2d");
  g.imageSmoothingEnabled = false;
  g.clearRect(0, 0, 48, 64);
  for (let y = 0; y < 27; y++) {
    const a = Math.round(y * 0.3);
    R(g, "#e8657a", 9 + a, y, 10, 1); R(g, "#5b8fd9", 29 - a, y, 10, 1);
    R(g, "#ff9db0", 9 + a, y, 2, 1); R(g, "#8fb8f0", 29 - a, y, 2, 1);
  }
  disco(g, "#8a5a12", 24, 42, 20);
  disco(g, "#f5b84a", 24, 42, 18);
  disco(g, "#ffd77a", 24, 42, 15);
  disco(g, "#f5b84a", 24, 42, 12);
  patron(g, PAT.corazon, 17, 36, "#b8425a", 2);
  patron(g, PAT.corazon, 17, 35, "#e8657a", 2);
  R(g, "#ffd0da", 19, 37, 2, 2);
  R(g, "#ffffff", 12, 33, 3, 2); R(g, "#ffffff", 14, 31, 2, 2); R(g, "#fff3c0", 34, 52, 2, 2);
}

function confeti() {
  const cont = $("#final-confeti");
  cont.replaceChildren();
  if (movimientoReducido) return;
  const cols = ["#e8657a", "#f5b84a", "#5b8fd9", "#5fb878", "#fff6e3", "#f08ab0"];
  for (let i = 0; i < 44; i++) {
    const p = document.createElement("i");
    p.style.left = Math.random() * 100 + "%";
    p.style.background = cols[i % cols.length];
    p.style.animationDelay = Math.random() * 4 + "s";
    p.style.animationDuration = 4 + Math.random() * 4 + "s";
    cont.append(p);
  }
}

function prepararFinal() {
  $("#final-titulo").textContent = FINAL.titulo;
  $("#final-sub").textContent = FINAL.subtitulo;
  dibujarMedalla($("#medalla"));
  $("#final-medalla-texto").textContent = FINAL.medalla;
  const dias = diasJuntos(), fecha = fechaBonita(), partes = [];
  if (fecha) partes.push("DESDE EL " + fecha.toUpperCase());
  if (dias !== null) partes.push(dias + " DÍAS JUNTOS");
  partes.push("RECUERDOS " + contarRecuerdos() + "/" + RECUERDOS.length);
  $("#final-stats").textContent = partes.join("  ·  ");
  const slot = $("#final-dialogo-slot");
  slot.replaceChildren();
  slot.hidden = true;
  const caja = crearCajaDialogo("dialogo-final");
  slot.append(caja);
  dlgFinal = crearDialogo(caja);
  $("#final-acciones").replaceChildren();
  confeti();
  juego.finalVisto = true;
  guardarPartida();
}

async function irAlFinal() {
  if (ocupado) return;
  ocupado = true;
  Sonido.sfx("click");
  await Transicion.ejecutar("FIN", () => {
    if (escenaActual) escenaActual.dlg.detener();
    Pantallas.mostrar("pantalla-final");
    prepararFinal();
  });
  ocupado = false;
  // el mensaje aparece progresivamente, como un diálogo de videojuego
  Sonido.sfx("victoria");
  await esperar(movimientoReducido ? 300 : 2600);
  $("#final-dialogo-slot").hidden = false;
  dlgFinal.decir(FINAL.mensaje, mostrarPregunta);
}

function mostrarPregunta() {
  const a = $("#final-acciones");
  a.replaceChildren(el("p", "final-pregunta", FINAL.pregunta));
  const b = el("button", "boton boton-grande boton-oro", "▶ " + FINAL.textoBoton);
  b.addEventListener("click", () => { Sonido.sfx("abrir"); mostrarContinuara(); });
  a.append(b);
}
function mostrarContinuara() {
  const a = $("#final-acciones");
  a.replaceChildren(el("p", "final-continuara", FINAL.despues));
  const faltan = RECUERDOS.length - contarRecuerdos();
  if (faltan > 0) {
    a.append(el("p", "final-nota", "Todavía " + (faltan > 1 ? "quedan " + faltan + " recuerdos escondidos" : "queda 1 recuerdo escondido") + " en el mapa ✨"));
  }
  const v = el("button", "boton", "◀ " + FINAL.textoVolver);
  v.addEventListener("click", volverDelFinal);
  a.append(v);
}
async function volverDelFinal() {
  if (ocupado) return;
  ocupado = true;
  Sonido.sfx("click");
  await Transicion.ejecutar("MAPA", () => {
    Pantallas.mostrar("pantalla-mapa");
    refrescarMapa();
    actualizarHUD();
    mapaDialogo.decir(TEXTOS.mapaPista);
  });
  ocupado = false;
}

/* ---- Pantalla de título ---- */
function montarTitulo() {
  Arte.titulo($("#titulo-arte"));
  $("#titulo-superior").textContent = CONFIG.tituloInicio;
  $("#titulo-yo").textContent = CONFIG.miNombre;
  $("#titulo-pareja").textContent = CONFIG.nombrePareja;
  $("#titulo-sub").textContent = CONFIG.subtituloInicio;
  $("#titulo-personajes").replaceChildren(crearSprite("yo", "sprite"), crearSprite("pareja", "sprite"));
  const cielo = $("#titulo-estrellas");
  cielo.replaceChildren();
  for (let i = 0; i < 18; i++) {
    const s = document.createElement("i");
    s.style.left = hash(i, 21, 1) * 100 + "%";
    s.style.top = hash(i, 21, 2) * 45 + "%";
    s.style.animationDelay = hash(i, 21, 3) * 3 + "s";
    cielo.append(s);
  }
  const btn = $("#btn-comenzar"), btn2 = $("#btn-nueva");
  btn.disabled = false;
  if (juego.hayProgreso) {
    btn.textContent = "▶ CONTINUAR (" + calcularProgreso() + "%)";
    btn2.hidden = false;
  } else {
    btn.textContent = "▶ " + CONFIG.textoBotonInicio;
    btn2.hidden = true;
  }
  btn.onclick = () => comenzar(!juego.hayProgreso);
  let armado = false, t = null;
  btn2.onclick = () => {
    if (!armado) {
      armado = true;
      btn2.textContent = "¿SEGURO? TOCA DE NUEVO";
      clearTimeout(t);
      t = setTimeout(() => { armado = false; btn2.textContent = "NUEVA AVENTURA"; }, 3000);
    } else comenzar(true);
  };
}

async function comenzar(nueva) {
  if (ocupado) return;
  ocupado = true;
  Sonido.iniciar();   // el audio solo puede arrancar después de un toque del usuario
  if (nueva) {
    const { efectos, musica } = juego;
    juego = estadoInicial();
    juego.efectos = efectos; juego.musica = musica;
  }
  juego.hayProgreso = true;
  guardarPartida();
  Sonido.aplicar();
  Sonido.sfx("abrir");
  await Transicion.ejecutar(nueva ? CONFIG.tituloInicio : "CONTINUAR", () => {
    Pantallas.mostrar("pantalla-mapa");
    reiniciarPersonajes();
    refrescarMapa();
    actualizarHUD();
  });
  mapaDialogo.decir(nueva ? TEXTOS.mapaBienvenida : [TEXTOS.mapaPista]);
  ocupado = false;
  await revisarDesbloqueo();
}

/* ---- Arranque ---- */
function aplicarColores() {
  Object.keys(COLORES.ui).forEach(k => {
    document.documentElement.style.setProperty("--c-" + k.replace(/[A-Z]/g, m => "-" + m.toLowerCase()), COLORES.ui[k]);
  });
}

async function arrancar() {
  aplicarColores();
  document.body.classList.toggle("sin-ayudas", !CONFIG.mostrarAyudas);
  document.title = "Nuestra aventura · " + CONFIG.subtituloInicio;
  const guardado = cargarPartida();
  if (guardado) juego = guardado;
  Transicion.montar();
  actualizarToggles();
  await prepararSprites();
  montarTitulo();
  montarMapa();
  actualizarHUD();
  Pantallas.mostrar("pantalla-titulo");
}

// Botones generales (efectos, música, mochila) por delegación de eventos
document.addEventListener("click", e => {
  const b = e.target.closest("[data-accion]");
  if (!b) return;
  const a = b.dataset.accion;
  if (a === "efectos") Sonido.alternar("efectos");
  else if (a === "musica") Sonido.alternar("musica");
  else if (a === "mochila") abrirMochila();
  else if (a === "cerrar-mochila") cerrarMochila();
});
document.addEventListener("keydown", e => {
  if (e.key === "Escape" && !$("#mochila").hidden) cerrarMochila();
});

// Ganchos para pruebas automáticas (no afectan al juego)
window.__aventura = { abrirZona, volverAlMapa, comenzar, irAlFinal, estado: () => juego, MAPA, buscarCamino };

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", arrancar);
else arrancar();
