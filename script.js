/* =========================================================
   CONFIGURACIÓN
   Pega acá la URL de la aplicación web de Apps Script
   (ver LEEME.txt). Esa URL sube la planilla de Excel
   a tu carpeta de Google Drive en cada confirmación.
   ========================================================= */
const URL_APPS_SCRIPT = "https://script.google.com/macros/s/AKfycbz5O15bOfLE_y9fXdspw-eusUSsTliLe8GJXzf61XP_wq9DMdhOqhrZMnKYyM2vcPh4/exec";

const FECHA_EVENTO = new Date("2026-12-06T00:00:00-03:00");
const CLAVE_RESPALDO = "confirmaciones_candela_xv";

/* Parte 1: abrir la invitación */
document.getElementById("btnAbrir").addEventListener("click", () => {
  document.getElementById("abierta").scrollIntoView({ behavior: "smooth" });
});

/* Parte 2: las fotos salen de la invitación al llegar a ella */
const wrap = document.getElementById("abiertaWrap");
new IntersectionObserver((entradas) => {
  entradas.forEach((e) => { if (e.isIntersecting) wrap.classList.add("visible"); });
}, { threshold: 0.35 }).observe(wrap);

/* Parte 2: contador */
const $d = document.getElementById("cDias"), $h = document.getElementById("cHoras"),
      $m = document.getElementById("cMin"),  $s = document.getElementById("cSeg"),
      $msg = document.getElementById("msgContador");
const dos = (n) => String(n).padStart(2, "0");

function actualizarContador() {
  const resto = FECHA_EVENTO - new Date();
  if (resto <= 0) {
    [$d, $h, $m, $s].forEach((el) => (el.textContent = "00"));
    $msg.textContent = "¡Hoy celebramos mis 15!";
    return;
  }
  const seg = Math.floor(resto / 1000);
  $d.textContent = dos(Math.floor(seg / 86400));
  $h.textContent = dos(Math.floor((seg % 86400) / 3600));
  $m.textContent = dos(Math.floor((seg % 3600) / 60));
  $s.textContent = dos(seg % 60);
}
actualizarContador();
setInterval(actualizarContador, 1000);

/* Parte 5: subventana y envío a Drive */
const modal = document.getElementById("modal");
const input = document.getElementById("inputNombre");
const error = document.getElementById("error");
const ok = document.getElementById("ok");
const btnConfirma = document.getElementById("btnConfirma");

function abrirModal() {
  error.hidden = true; ok.hidden = true; input.value = ""; btnConfirma.disabled = false;
  modal.hidden = false;
  setTimeout(() => input.focus(), 50);
}
function cerrarModal() { modal.hidden = true; }

document.getElementById("btnConfirmar").addEventListener("click", abrirModal);
document.getElementById("btnCerrar").addEventListener("click", cerrarModal);
modal.addEventListener("click", (e) => { if (e.target === modal) cerrarModal(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !modal.hidden) cerrarModal(); });
input.addEventListener("keydown", (e) => { if (e.key === "Enter") confirmar(); });
btnConfirma.addEventListener("click", confirmar);

function mostrarError(texto) { error.textContent = texto; error.hidden = false; }

async function confirmar() {
  if (btnConfirma.disabled) return;
  const nombre = input.value.trim().replace(/\s+/g, " ");
  if (nombre.length < 3 || nombre.split(" ").length < 2) {
    mostrarError("Escribe tu nombre y apellido para confirmar.");
    input.focus();
    return;
  }
  error.hidden = true;

  const ahora = new Date();
  const registro = {
    nombre,
    fecha: ahora.toLocaleDateString("es-AR"),
    hora: ahora.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }),
  };

  // Copia de seguridad en el dispositivo del invitado
  try {
    const lista = JSON.parse(localStorage.getItem(CLAVE_RESPALDO) || "[]");
    lista.push(registro);
    localStorage.setItem(CLAVE_RESPALDO, JSON.stringify(lista));
  } catch {}

  if (!URL_APPS_SCRIPT) {
    console.error("Falta configurar URL_APPS_SCRIPT en script.js (ver LEEME.txt).");
    mostrarError("No se pudo enviar la confirmación. Avisale a Candela.");
    return;
  }

  btnConfirma.disabled = true;
  try {
    // El Apps Script agrega la fila a la planilla y sube el Excel a la carpeta de Drive
    await fetch(URL_APPS_SCRIPT, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(registro),
    });
    ok.textContent = "¡Gracias " + nombre.split(" ")[0] + "! Tu asistencia quedó confirmada.";
    ok.hidden = false;
    input.value = "";
  } catch (err) {
    console.error(err);
    mostrarError("No se pudo enviar. Revisa tu conexión e intenta de nuevo.");
    btnConfirma.disabled = false;
  }
}
