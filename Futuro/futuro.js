document.addEventListener('DOMContentLoaded', () => {
    const listaDeseos = document.getElementById('listaDeseos');
    const tituloFuturo = document.getElementById('tituloFuturo');
    const btnAddDeseo = document.getElementById('btnAddDeseo');
    const btnBloqueo = document.getElementById('btnBloqueo');
    const body = document.body;
    const fraseCierre = document.getElementById('fraseCierre');

    // 1. CARGA Y PERSISTENCIA INITIAL
    const isLocked = localStorage.getItem('futuro_locked') === 'true';
    if (isLocked) {
        body.classList.add('locked');
        btnBloqueo.classList.add('locked');
        btnBloqueo.innerHTML = '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M18,8h-1V6c0-2.76-2.24-5-5-5S7,3.24,7,6v2H6c-1.1,0-2,0.9-2,2v10c0,1.1,0.9,2,2,2h12c1.1,0,2-0.9,2-2V10C20,8.9,19.1,8,18,8z M9,6c0-1.66,1.34-3,3-3s3,1.34,3,3v2H9V6z"/></svg>';
    }

    const savedTitle = localStorage.getItem('futuro_titulo');
    if (savedTitle) tituloFuturo.textContent = savedTitle;

    tituloFuturo.addEventListener('input', () => {
        localStorage.setItem('futuro_titulo', tituloFuturo.textContent);
    });

    const countDoneEl = document.getElementById('countDone');
    const countPendingEl = document.getElementById('countPending');

    // Fuente de verdad compartida con Recuerdos
    let deseosCount = parseInt(localStorage.getItem('futuro_count'));

    const initialDeseos = [
        { p: "1. Ir a la playa al atardecer", s: "Un cielo de colores frente al mar." },
        { p: "2. Un día en el parque de atracciones", s: "Risas, juegos y mucha adrenalina." },
        { p: "3. Pintar un cuadro juntos", s: "Creando nuestra propia obra de arte." },
        { p: "4. Café de gatos", s: "Rodeados de ternura y ronroneos." },
        { p: "5. Ver ballenas en el mar", s: "Un encuentro mágico con la naturaleza." },
        { p: "6. Visitar nuestros países", s: "Conociendo el lugar donde crecimos." },
        { p: "7. Rompecabezas o LEGO complejo", s: "Construyendo algo grande pieza a pieza." },
        { p: "8. Noche de juegos de mesa", s: "Competencia sana y mucha diversión." },
        { p: "9. Montar a caballo", s: "Un paseo tranquilo respirando aire puro." },
        { p: "10. Probar dulces de otro país", s: "Un viaje de sabores sin salir de casa." },
        { p: "11. Hacer un picnic", s: "Comida rica y naturaleza a nuestro alrededor." },
        { p: "12. Maratón de películas o series", s: "Palomitas, manta y nuestras historias favoritas." },
        { p: "13. Cocinar una receta nueva", s: "Experimentando sabores desde cero." },
        { p: "14. Desayunar viendo el amanecer", s: "Empezar el día con la mejor luz posible." },
        { p: "15. Ir a un concierto o evento en vivo", s: "Vibrando con la música y la energía." },
        { p: "16. Sesión de fotos improvisada", s: "Capturando nuestras sonrisas más reales." },
        { p: "17. Ver fuegos artificiales", s: "Luces mágicas iluminando nuestro cielo." },
        { p: "18. Cabaña en un lugar aislado", s: "Desconexión total para conectar con nosotros." },
        { p: "19. Aprender algo nuevo juntos", s: "Creciendo y descubriendo nuevos intereses." },
        { p: "20. Museo o exposición", s: "Un paseo por el arte y la historia." },
        { p: "21. Cena romántica", s: "Disfrutando de una noche especial." },
        { p: "22. Celebrar un aniversario", s: "Brindando por cada momento vivido." }
    ];

    // Lógica para migrar/añadir los nuevos deseos si el usuario tiene la versión vieja o está vacío
    const versionActual = "2.0"; // Salto a 22 deseos
    const versionGuardada = localStorage.getItem('futuro_version');

    if (isNaN(deseosCount) || deseosCount < 22 || versionGuardada !== versionActual) {
        // Guardamos los 22 deseos iniciales si es necesario
        initialDeseos.forEach((d, i) => {
            if (!localStorage.getItem(`futuro_p_${i}`) || versionGuardada !== versionActual) {
                localStorage.setItem(`futuro_p_${i}`, d.p);
                localStorage.setItem(`futuro_s_${i}`, d.s);
            }
        });
        deseosCount = 22;
        localStorage.setItem('futuro_count', deseosCount);
        localStorage.setItem('futuro_version', versionActual);
    }

    renderAllDeseos();

    function renderAllDeseos() {
        listaDeseos.innerHTML = "";
        let done = 0;
        for (let i = 0; i < deseosCount; i++) {
            const p = localStorage.getItem(`futuro_p_${i}`) || "";
            const s = localStorage.getItem(`futuro_s_${i}`) || "";
            const isDone = localStorage.getItem(`futuro_done_${i}`) === 'true';
            const date = localStorage.getItem(`futuro_date_${i}`) || "";
            const place = localStorage.getItem(`futuro_place_${i}`) || "";

            if (isDone) done++;
            crearItemDeseo(i, p, s, isDone, date, place);
        }
        updateCounters(done);
    }

    function updateCounters(doneCount) {
        const total = deseosCount;
        countDoneEl.textContent = doneCount;
        countPendingEl.textContent = Math.max(0, total - doneCount);
    }

    // 2. FUNCIONALIDAD AÑADIR/BLOQUEAR
    btnAddDeseo.addEventListener('click', () => {
        if (body.classList.contains('locked')) return;

        const newIndex = deseosCount;
        localStorage.setItem(`futuro_p_${newIndex}`, "Nuevo deseo compartido");
        localStorage.setItem(`futuro_s_${newIndex}`, "Haz clic para editar");

        deseosCount++;
        localStorage.setItem('futuro_count', deseosCount);

        renderAllDeseos();

        const newItem = listaDeseos.lastElementChild;
        setTimeout(() => newItem.classList.add('visible'), 100);
    });

    btnBloqueo.addEventListener('click', () => {
        const locking = !body.classList.contains('locked');
        body.classList.toggle('locked');
        btnBloqueo.classList.toggle('locked');
        localStorage.setItem('futuro_locked', locking);

        btnBloqueo.innerHTML = locking ?
            '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M18,8h-1V6c0-2.76-2.24-5-5-5S7,3.24,7,6v2H6c-1.1,0-2,0.9-2,2v10c0,1.1,0.9,2,2,2h12c1.1,0,2-0.9,2-2V10C20,8.9,19.1,8,18,8z M9,6c0-1.66,1.34-3,3-3s3,1.34,3,3v2H9V6z"/></svg>' :
            '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M12,17c1.1,0,2-0.9,2-2s-0.9-2-2-2s-2,0.9-2,2S10.9,17,12,17z M18,8h-1V6c0-2.76-2.24-5-5-5S7,3.24,7,6v2H6c-1.1,0-2,0.9-2,2v10c0,1.1,0.9,2,2,2h12c1.1,0,2-0.9,2-2V10C20,8.9,19.1,8,18,8z M8.9,8c0-1.71,1.39-3.1,3.1-3.1s3.1,1.39,3.1,3.1v2H8.9V8z"/></svg>';
    });

    function crearItemDeseo(index, p, s, isDone, date, place) {
        const div = document.createElement('div');
        div.className = `deseo-item ${isDone ? 'cumplido' : ''}`;
        div.innerHTML = `
            <button class="btn-delete" title="Eliminar">&times;</button>
            <label class="check-cumplido">
                <input type="checkbox" ${isDone ? 'checked' : ''}>
                Cumplido
            </label>
            <h2 class="frase-principal" contenteditable="true">${p}</h2>
            <span class="frase-secundaria" contenteditable="true">${s}</span>
            
            <div class="meta-cumplido">
                <div class="meta-field">
                    <span class="meta-label">Fecha</span>
                    <input type="text" class="meta-input val-date" placeholder="DD/MM/AAAA" value="${date}">
                </div>
                <div class="meta-field">
                    <span class="meta-label">Lugar</span>
                    <input type="text" class="meta-input val-place" placeholder="Ciudad, País..." value="${place}">
                </div>
            </div>
        `;
        listaDeseos.appendChild(div);

        const h2 = div.querySelector('.frase-principal');
        const span = div.querySelector('.frase-secundaria');
        const btnDelete = div.querySelector('.btn-delete');
        const checkbox = div.querySelector('input[type="checkbox"]');
        const inDate = div.querySelector('.val-date');
        const inPlace = div.querySelector('.val-place');

        h2.addEventListener('input', () => localStorage.setItem(`futuro_p_${index}`, h2.textContent));
        span.addEventListener('input', () => localStorage.setItem(`futuro_s_${index}`, span.textContent));

        checkbox.addEventListener('change', () => {
            const checked = checkbox.checked;
            div.classList.toggle('cumplido', checked);
            localStorage.setItem(`futuro_done_${index}`, checked);

            // Recalcular contadores sin re-renderizar todo
            let currentDone = parseInt(countDoneEl.textContent);
            updateCounters(checked ? currentDone + 1 : currentDone - 1);
        });

        inDate.addEventListener('input', () => localStorage.setItem(`futuro_date_${index}`, inDate.value));
        inPlace.addEventListener('input', () => localStorage.setItem(`futuro_place_${index}`, inPlace.value));

        btnDelete.addEventListener('click', () => {
            if (confirm('¿Eliminar esta promesa? (También se eliminará su cuadro en el álbum)')) {
                // Shift items down to close the gap
                for (let i = index; i < deseosCount - 1; i++) {
                    localStorage.setItem(`futuro_p_${i}`, localStorage.getItem(`futuro_p_${i + 1}`));
                    localStorage.setItem(`futuro_s_${i}`, localStorage.getItem(`futuro_s_${i + 1}`));
                    localStorage.setItem(`futuro_done_${i}`, localStorage.getItem(`futuro_done_${i + 1}`));
                    localStorage.setItem(`futuro_date_${i}`, localStorage.getItem(`futuro_date_${i + 1}`));
                    localStorage.setItem(`futuro_place_${i}`, localStorage.getItem(`futuro_place_${i + 1}`));
                    localStorage.setItem(`album_foto_${i}`, localStorage.getItem(`album_foto_${i + 1}`));
                }
                // Clear the last one
                localStorage.removeItem(`futuro_p_${deseosCount - 1}`);
                localStorage.removeItem(`futuro_s_${deseosCount - 1}`);
                localStorage.removeItem(`futuro_done_${deseosCount - 1}`);
                localStorage.removeItem(`futuro_date_${deseosCount - 1}`);
                localStorage.removeItem(`futuro_place_${deseosCount - 1}`);
                localStorage.removeItem(`album_foto_${deseosCount - 1}`);

                deseosCount--;
                localStorage.setItem('futuro_count', deseosCount);
                renderAllDeseos();
            }
        });
    }

    // 3. REVELACIÓN PROGRESIVA (Intersection Observer)
    const observerOptions = {
        threshold: 0.2
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');

                // Si es el último item de la lista real, mostrar frase de cierre
                if (entry.target === listaDeseos.lastElementChild) {
                    setTimeout(() => fraseCierre.classList.add('visible'), 1000);
                }
            }
        });
    }, observerOptions);

    // Observar items existentes y futuros
    const observeItems = () => {
        document.querySelectorAll('.deseo-item').forEach(item => observer.observe(item));
    };

    observeItems();

    // MutationObserver para observar nuevos items añadidos dinámicamente
    const mutationObserver = new MutationObserver(observeItems);
    mutationObserver.observe(listaDeseos, { childList: true });
});
