/* =====================
   VIDEO & ROMANTIC EFFECTS LOGIC
   ===================== */

const video = document.getElementById('reproductorPrincipal');
const body = document.body;
const mensajeFinal = document.getElementById('mensajeFinal');
const contenedorPetalos = document.getElementById('contenedorPetalos');

// 1. Generación de Pétalos Dinámicos
function crearPetalo() {
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
setInterval(crearPetalo, 500);

// Inicializar algunos pétalos
for (let i = 0; i < 10; i++) {
    setTimeout(crearPetalo, Math.random() * 5000);
}

// 2. Efecto al iniciar la reproducción
video.onplay = () => {
    body.classList.add('reproduciendo');
};

// 3. Efecto al pausar
video.onpause = () => {
    body.classList.remove('reproduciendo');
};

// 4. Al finalizar el video
video.onended = () => {
    body.classList.remove('reproduciendo');

    // Esperar 1 segundo antes de mostrar la frase emocional
    setTimeout(() => {
        mensajeFinal.classList.add('visible');
    }, 1000);
};

// Lógica para manejar el botón Atrás con transiciones suaves
document.querySelector('.btn-volver').addEventListener('click', (e) => {
    e.preventDefault();
    const href = e.currentTarget.href;
    body.style.opacity = '0';
    body.style.transition = 'opacity 0.8s ease';
    setTimeout(() => {
        window.location.href = href;
    }, 800);
});
