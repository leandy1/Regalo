/* =====================
   LÓGICA TIEMPO - DOS PUNTOS. UNA HISTORIA.
   ===================== */

/* --- DECORATIVE LOGIC: ROMANTIC BACKGROUND --- */
const contenedorPetalos = document.getElementById('contenedorPetalos');

function crearPetalo() {
    if (!contenedorPetalos) return;
    const petalo = document.createElement('div');
    petalo.classList.add('petalo');

    // Posición y tamaño aleatorio
    const size = Math.random() * 15 + 10 + 'px';
    petalo.style.width = size;
    petalo.style.height = size;
    petalo.style.left = Math.random() * 100 + 'vw';
    petalo.style.top = '-5%';

    // Retraso y duración aleatoria
    petalo.style.animationDuration = Math.random() * 5 + 10 + 's';
    petalo.style.opacity = Math.random() * 0.3 + 0.1;

    contenedorPetalos.appendChild(petalo);

    // Eliminar pétalo cuando termine la animación
    setTimeout(() => {
        petalo.remove();
    }, 15000);
}

// Crear pétalos periódicamente
setInterval(crearPetalo, 600);

// Inicializar algunos pétalos
for (let i = 0; i < 8; i++) {
    setTimeout(crearPetalo, Math.random() * 5000);
}

/* --- CORE LOGIC --- */

document.addEventListener('DOMContentLoaded', () => {

    // FECHAS OBJETIVO
    const targetDate = new Date('August 1, 2027 00:00:00').getTime();
    const startDate = new Date('March 4, 2027 00:00:00').getTime();

    const puntoA = document.getElementById('puntoA');
    const puntoB = document.getElementById('puntoB');
    const ruta = document.getElementById('rutaConexion');
    const txtNarrativo = document.getElementById('textoNarrativo');
    const valFisica = document.getElementById('distanciaFisica');
    const valEmocional = document.getElementById('distanciaEmocional');
    const valFutura = document.getElementById('distanciaFutura');
    const extraFutura = document.getElementById('distanciaFuturaContainer');
    const controlesFinales = document.getElementById('controlesFinales');
    const countdownContainer = document.getElementById('countdownContainer');

    const uiReloj = {
        dias: document.getElementById('dias'),
        horas: document.getElementById('horas'),
        minutos: document.getElementById('minutos'),
        segundos: document.getElementById('segundos')
    };

    // Coordenadas fijas de inicio en el mapa combinado (Norteamérica-Caribe)
    // RD (posicionado visualmente)
    const coordRD = { x: 72, y: 78 };
    // Canadá (posicionado visualmente)
    const coordCanada = { x: 20, y: 20 };
    const distFisicaFinal = 3200;

    let etapaActual = 0;
    let autoAdvanced = false;

    // 1. DIBUJAR LÍNEA DINÁMICA
    function actualizarLinea(xA, yA, xB, yB) {
        const midX = (xA + xB) / 2;
        // Curvatura del arco (negativo sube la curva)
        const midY = ((yA + yB) / 2) - 15;
        // Sin porcentajes porque la linea usa viewBox "0 0 100 100"
        const d = `M ${xA} ${yA} Q ${midX} ${midY} ${xB} ${yB}`;
        ruta.setAttribute('d', d);
    }

    // 2. CONVERGENCIA EN TIEMPO REAL Y RELOJ
    function actualizarLoop() {
        const now = new Date().getTime();
        const tTotal = targetDate - startDate;
        const tRestante = targetDate - now;

        // Factor de convergencia: 0 (lejos) a 1 (juntos)
        const factor = Math.max(0, Math.min(1, 1 - (tRestante / tTotal)));

        const currA = {
            x: coordRD.x + (coordCanada.x - coordRD.x) * factor,
            y: coordRD.y + (coordCanada.y - coordRD.y) * factor
        };

        const currB = {
            x: coordCanada.x,
            y: coordCanada.y
        };

        // Permitimos el acercamiento visual en todo momento
        puntoA.style.left = currA.x + "%";
        puntoA.style.top = currA.y + "%";
        puntoB.style.left = currB.x + "%";
        puntoB.style.top = currB.y + "%";
        actualizarLinea(currA.x, currA.y, currB.x, currB.y);

        // Actualizar UI del Reloj
        if (tRestante > 0) {
            const d = Math.floor(tRestante / (1000 * 60 * 60 * 24));
            const h = Math.floor((tRestante % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const m = Math.floor((tRestante % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((tRestante % (1000 * 60)) / 1000);

            uiReloj.dias.innerText = d.toString().padStart(2, '0');
            uiReloj.horas.innerText = h.toString().padStart(2, '0');
            uiReloj.minutos.innerText = m.toString().padStart(2, '0');
            uiReloj.segundos.innerText = s.toString().padStart(2, '0');
        } else {
            // Meta alcanzada
            uiReloj.dias.innerText = "00";
            uiReloj.horas.innerText = "00";
            uiReloj.minutos.innerText = "00";
            uiReloj.segundos.innerText = "00";
        }

        // 2.5 Actualizar Distancia Física en tiempo real
        if (etapaActual >= 100 || tRestante <= 0) {
            valFisica.innerText = "0 km";
        } else {
            const distActual = Math.floor(distFisicaFinal * (1 - factor));
            valFisica.innerText = distActual + " km";
        }

        requestAnimationFrame(actualizarLoop);
    }

    // 3. SECUENCIA NARRATIVA
    const etapas = [
        { texto: "Todo empezó a miles de kilómetros.", emocional: null, delay: 4000 },
        { texto: "Pero una conversación lo cambió.", emocional: 800, claseRuta: "iluminada", delay: 4000 },
        { texto: "Dejó de ser casual.", emocional: 200, claseRuta: "solida", delay: 4000 },
        { texto: "Hoy estamos lejos… pero no separados.", emocional: 0, claseRuta: "solida", delay: 5000 },
        { texto: "Un día la distancia física también será cero.", emocional: 0, futura: 0, claseRuta: "punteada", delay: 6000 }
    ];

    function avanzarEtapa() {
        if (etapaActual >= etapas.length) {
            controlesFinales.classList.remove('hide');
            countdownContainer.classList.remove('hide');
            // Al terminar la narrativa, los puntos empiezan su baile de convergencia real
            etapaActual = 100; // Flag para indicar fin de narrativa
            return;
        }

        const e = etapas[etapaActual];

        // Texto
        txtNarrativo.classList.remove('visible');
        setTimeout(() => {
            txtNarrativo.innerText = e.texto;
            txtNarrativo.classList.add('visible');
        }, 500);

        // Animar counters
        if (etapaActual === 0) {
            // valFisica ahora se maneja en el loop principal
        }
        if (e.emocional !== null) animarNumero(valEmocional, e.emocional);
        if (e.futura !== undefined) {
            extraFutura.classList.remove('hide');
            animarNumero(valFutura, e.futura);
        }

        // Estilos ruta (Narrativos)
        if (e.claseRuta) {
            ruta.classList.remove('iluminada', 'solida', 'punteada');
            ruta.classList.add(e.claseRuta);
        }

        etapaActual++;
        setTimeout(avanzarEtapa, e.delay);
    }

    function animarNumero(elemento, fin, sufijo = " km", duracion = 2500) {
        let inicio = parseInt(elemento.innerText) || 0;
        if (elemento.innerText === "—") inicio = 2000;
        const startTime = performance.now();
        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duracion, 1);
            const actual = Math.floor(inicio + (fin - inicio) * progress);
            elemento.innerText = actual + sufijo;
            if (progress < 1) requestAnimationFrame(update);
        }
        requestAnimationFrame(update);
    }

    // Inicialización
    puntoA.style.left = coordRD.x + "%";
    puntoA.style.top = coordRD.y + "%";
    puntoB.style.left = coordCanada.x + "%";
    puntoB.style.top = coordCanada.y + "%";
    actualizarLinea(coordRD.x, coordRD.y, coordCanada.x, coordCanada.y);

    // 4. BOTÓN OMITIR
    const btnSaltar = document.getElementById('btnSaltarNarrativa');
    if (btnSaltar) {
        btnSaltar.addEventListener('click', () => {
            // Detener cualquier timeout pendiente de la narrativa
            etapaActual = 100; // Flag para indicar fin de narrativa

            // Mostrar elementos finales de golpe
            txtNarrativo.classList.remove('visible');
            setTimeout(() => {
                txtNarrativo.innerText = "Nuestra historia continúa...";
                txtNarrativo.classList.add('visible');
            }, 100);

            controlesFinales.classList.remove('hide');
            countdownContainer.classList.remove('hide');
            extraFutura.classList.remove('hide');
            valFisica.innerText = "0 km";

            // Estilo final de la ruta
            ruta.className.baseVal = "svg-mapa solid"; // O la clase que prefieras para el final
            ruta.classList.add('solida');

            // Ocultar el botón Omitir con fade
            btnSaltar.classList.add('fade-out');
            setTimeout(() => btnSaltar.remove(), 500);
        });
    }

    requestAnimationFrame(actualizarLoop);
    setTimeout(avanzarEtapa, 1500);
});
