/* =====================
   LÓGICA CARTAS - INTERACCIÓN Y REVELACIÓN
   ===================== */

document.addEventListener('DOMContentLoaded', () => {

    const sobres = document.querySelectorAll('.sobre-item');
    const overlay = document.getElementById('lecturaOverlay');
    const contenidoCarta = document.getElementById('contenidoCarta');
    const btnCerrar = document.querySelector('.btn-cerrar-lectura');

    // 1. ABRIR CARTAS
    sobres.forEach(sobre => {
        sobre.addEventListener('click', () => {
            const cartaId = sobre.getAttribute('data-carta');
            const template = document.getElementById(`template-carta-${cartaId}`);

            // Inyectar contenido del template
            contenidoCarta.innerHTML = template.innerHTML;

            // Activar overlay
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden'; // Evitar scroll de fondo

            // Iniciar animación de líneas con delay
            iniciarRevelacionLineas();
        });
    });

    // 2. CERRAR CARTAS
    const cerrarModal = () => {
        overlay.classList.remove('active');
        document.body.style.overflow = 'auto';
        contenidoCarta.innerHTML = ''; // Limpiar para resetear animaciones
    };

    btnCerrar.addEventListener('click', cerrarModal);

    // Cerrar con Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') cerrarModal();
    });

    // 3. REVELACIÓN PROGRESIVA DE LÍNEAS
    function iniciarRevelacionLineas() {
        const lineas = contenidoCarta.querySelectorAll('.fade-line');
        const scrollContainer = document.querySelector('.lectura-scroll');

        // Reset scroll position del modal
        scrollContainer.scrollTop = 0;

        // Usamos Intersection Observer para que las líneas aparezcan al hacer scroll DENTRO del modal
        const lineObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const index = Array.from(lineas).indexOf(entry.target);
                    setTimeout(() => {
                        entry.target.classList.add('visible');
                    }, 100); // Ritmo más rápido para cursiva
                }
            });
        }, {
            threshold: 0.5,
            root: scrollContainer,
            rootMargin: "0px 0px -100px 0px"
        });

        lineas.forEach(line => lineObserver.observe(line));
    }
});
