const preguntas = [
    {
        tipo: "texto",
        pregunta: "¿Cuál fue el mes en que comenzamos a hablar y nuestra historia empezó?",
        respuesta: "noviembre",
    },
    {
        tipo: "opcion",
        pregunta: "De todos los apodos, ¿cuál es el que te identifica como única para mí?",
        opciones: ["Minion", "Peruana", "Señorita"],
        respuesta: "Señorita",
    },
    {
        tipo: "texto",
        pregunta: "¿Qué serie nos enseñó a robar... al menos nuestra atención?",
        respuesta: "lupin",
    },
    {
        tipo: "opcion",
        pregunta: "Si tuvieras que elegir lo que más atesoro de nosotros, ¿qué sería?",
        opciones: ["Nuestros momentos juntos", "Las videollamadas", "Los mensajes largos"],
        respuesta: "Nuestros momentos juntos", // Correcta o no, es narrativa.
    }
];

let indiceActual = 0;
let correctas = 0;
let respuestasUsuario = [];

const contPregunta = document.getElementById("contenedor-pregunta");
const barraProgreso = document.getElementById("progreso-fill");
const btnAccion = document.getElementById("btn-responder");
const msjFinal = document.getElementById("mensaje");
const titulo = document.getElementById("titulo");
const intro = document.getElementById("intro");

// ✍️ EFECTO ESCRITURA INICIAL
const tituloTexto = "Solo alguien muy especial puede cruzar este umbral...";
let i = 0;
function escribirTitulo() {
    if (i < tituloTexto.length) {
        titulo.innerHTML += tituloTexto.charAt(i);
        i++;
        setTimeout(escribirTitulo, 50);
    } else {
        setTimeout(mostrarPregunta, 500);
    }
}

// Iniciar
window.onload = () => {
    escribirTitulo();
    actualizarProgreso();
};

function actualizarProgreso() {
    const porcentaje = (indiceActual / preguntas.length) * 100;
    barraProgreso.style.width = `${porcentaje}%`;
}

function mostrarPregunta() {
    if (indiceActual >= preguntas.length) {
        evaluarFinal();
        return;
    }

    const item = preguntas[indiceActual];

    // Animación de salida de la pregunta actual
    contPregunta.classList.remove("slide-in");
    contPregunta.classList.add("slide-out");

    setTimeout(() => {
        let html = `<div class="pregunta-box"><p class="enunciado">${item.pregunta}</p>`;

        if (item.tipo === "texto") {
            html += `<input type="text" id="respuestaActual" placeholder="Tu respuesta..." autocomplete="off">`;
        }

        if (item.tipo === "opcion") {
            html += `<div class="opciones-grupo">`;
            item.opciones.forEach((opcion, i) => {
                html += `
          <label class="opcion-radio">
            <input type="radio" name="resOp" value="${opcion}" id="op${i}">
            <span class="custom-radio"></span>
            ${opcion}
          </label>
        `;
            });
            html += `</div>`;
        }

        html += `</div>`;
        contPregunta.innerHTML = html;

        btnAccion.style.display = "inline-block";
        btnAccion.innerText = indiceActual < preguntas.length - 1 ? "Siguiente ✨" : "Descubrir 💖";

        // Animación de entrada
        contPregunta.classList.remove("slide-out");
        contPregunta.classList.add("slide-in");

        // Foco si es texto
        if (item.tipo === "texto") {
            document.getElementById("respuestaActual").focus();
        }
    }, 400); // 400ms dura la animación slide-out
}

function procesarRespuesta() {
    const item = preguntas[indiceActual];
    let res = "";

    if (item.tipo === "texto") {
        const input = document.getElementById("respuestaActual");
        if (!input || input.value.trim() === "") return; // Exigir texto
        res = input.value.toLowerCase().trim();
    }

    if (item.tipo === "opcion") {
        const seleccion = document.querySelector('input[name="resOp"]:checked');
        if (!seleccion) return; // Obligar a seleccionar
        res = seleccion.value.toLowerCase();
    }

    // Validación estricta
    let esCorrecta = false;

    // Tratamiento especial para la última pregunta que es subjetiva/narrativa
    if (indiceActual === preguntas.length - 1) {
        esCorrecta = true; // Cualquier respuesta es cálida y correcta para el final
        correctas++;
    } else {
        // Validación exacta para las primeras 3
        if (res === item.respuesta.toLowerCase()) {
            esCorrecta = true;
            correctas++;
        }
    }

    if (esCorrecta) {
        // Respuesta correcta: Avanzar
        respuestasUsuario.push(res);
        indiceActual++;
        actualizarProgreso();
        mostrarPregunta();
    } else {
        // Respuesta incorrecta: Efecto de error visual en lugar de alert intrusivo
        const btn = document.getElementById("btn-responder");
        btn.style.background = "linear-gradient(135deg, #ff5e78, #d63031)";
        btn.style.color = "#fff";
        btn.innerText = "Mmm... Esa no es la respuesta correcta 🤔";

        // Shake animation
        contPregunta.style.transform = "translateX(5px)";
        setTimeout(() => contPregunta.style.transform = "translateX(-5px)", 50);
        setTimeout(() => contPregunta.style.transform = "translateX(5px)", 100);
        setTimeout(() => contPregunta.style.transform = "translateX(0)", 150);

        setTimeout(() => {
            btn.style.background = "linear-gradient(135deg, #fbc531, #e1b12c)";
            btn.style.color = "#1a1025";
            btn.innerText = "Responder";
            if (item.tipo === "texto") {
                document.getElementById("respuestaActual").value = "";
                document.getElementById("respuestaActual").focus();
            }
        }, 2000);
    }
}

btnAccion.addEventListener("click", procesarRespuesta);

// Soportar Enter
document.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && btnAccion.style.display !== "none") {
        // Evita enter si seleccionó la opción de radio por foco pero no fue este botón
        procesarRespuesta();
    }
});

function evaluarFinal() {
    contPregunta.style.display = "none";
    btnAccion.style.display = "none";
    document.querySelector(".barra-progreso").style.opacity = "0";

    msjFinal.style.display = "block";
    msjFinal.classList.add("fade-in-msg");

    // Filtro Narrativo según puntuación
    let mensajeTexto = "";
    if (correctas === preguntas.length) {
        mensajeTexto = "Sabía que recordarías cada detalle... Eres tú.";
    } else if (correctas >= preguntas.length / 2) {
        mensajeTexto = "Lo importante no es recordar cada fecha, es haber estado allí para vivirlo.";
    } else {
        mensajeTexto = "No importa si algunos detalles escapan... porque esta historia apenas comienza.";
    }

    // Guardar estado (opcional, para futuras continuaciones)
    localStorage.setItem("accesoOtorgado", "true");
    localStorage.setItem("puntaje", correctas.toString());

    msjFinal.innerHTML = `<h2>${mensajeTexto}</h2><p class="sub-msj">Preparando el portal...</p>`;

    // Oscurecimiento de pantalla y transición
    setTimeout(() => {
        document.querySelector(".contenedor").classList.add("fade-out-portal");
        setTimeout(() => {
            window.location.href = "comenzar.html";
        }, 2500);
    }, 3500);
}
