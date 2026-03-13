document.addEventListener('DOMContentLoaded', async () => {
    const listaDeseos = document.getElementById('listaDeseos');
    const tituloFuturo = document.getElementById('tituloFuturo');
    const btnAddDeseo = document.getElementById('btnAddDeseo');
    const btnBloqueo = document.getElementById('btnBloqueo');
    const body = document.body;
    const fraseCierre = document.getElementById('fraseCierre');
    const countDoneEl = document.getElementById('countDone');
    const countPendingEl = document.getElementById('countPending');

    // Email compartido para que ambos vean lo mismo
    const SHARED_EMAIL = 'leandygabin9@gmail.com';
    const CURRENT_USER = localStorage.getItem("userEmail");

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

    let allWishes = [];

    // --- CARGA DE DATOS ---
    async function init() {
        console.log("Iniciando carga de deseos...");
        listaDeseos.innerHTML = '<p style="text-align:center; color:white;">Conectando con la nube... ✨</p>';

        try {
            // 1. Cargar deseos existentes
            const { data: wishes, error: wishesErr } = await window.supabase
                .from('wishes')
                .select('*')
                .eq('owner_email', SHARED_EMAIL)
                .order('sort_order', { ascending: true });

            if (wishesErr) throw wishesErr;

            allWishes = wishes || [];

            // 2. Si la tabla está vacía, insertar los 22 iniciales
            if (allWishes.length === 0) {
                console.log("Tabla vacía. Insertando deseos iniciales...");
                const inserts = initialDeseos.map((d, i) => ({
                    owner_email: SHARED_EMAIL,
                    created_by: 'sistema', // Los iniciales son del sistema
                    sort_order: i,
                    titulo: d.p,
                    subtitulo: d.s,
                    is_done: false
                }));

                const { data: inserted, error: insertErr } = await window.supabase
                    .from('wishes')
                    .insert(inserts)
                    .select();

                if (insertErr) throw insertErr;
                allWishes = inserted;
            }

            // 3. Cargar ajustes (título y bloqueo)
            const { data: settings } = await window.supabase
                .from('app_settings')
                .select('*')
                .eq('owner_email', SHARED_EMAIL);
            
            const settingsObj = {};
            (settings || []).forEach(s => settingsObj[s.key] = s.value);

            if (settingsObj.futuro_titulo) tituloFuturo.textContent = settingsObj.futuro_titulo;
            if (settingsObj.futuro_locked === 'true') {
                body.classList.add('locked');
                btnBloqueo.classList.add('locked');
            }

            // 4. Renderizar todo
            renderAll();

        } catch (err) {
            console.error("ERROR CRÍTICO:", err);
            listaDeseos.innerHTML = `
                <div style="color: #ff5e78; text-align: center; padding: 20px;">
                    <h3>¡Ops! Algo salió mal</h3>
                    <p>${err.message}</p>
                    <small>Asegúrate de haber creado las tablas en Supabase.</small>
                </div>
            `;
        }
    }

    function renderAll() {
        listaDeseos.innerHTML = '';
        let done = 0;
        allWishes.forEach(wish => {
            if (wish.is_done) done++;
            crearItemDeseo(wish);
        });
        updateCounters(done);
        
        // Forzar visibilidad si el IntersectionObserver falla
        setTimeout(() => {
            document.querySelectorAll('.deseo-item').forEach(item => {
                item.classList.add('visible');
            });
        }, 500);
    }

    function updateCounters(doneCount) {
        countDoneEl.textContent = doneCount;
        countPendingEl.textContent = Math.max(0, allWishes.length - doneCount);
    }

    function crearItemDeseo(wish) {
        const div = document.createElement('div');
        div.className = `deseo-item ${wish.is_done ? 'cumplido' : ''} visible`; // Añadimos visible por defecto
        div.innerHTML = `
            <button class="btn-delete" title="Eliminar">&times;</button>
            <label class="check-cumplido">
                <input type="checkbox" ${wish.is_done ? 'checked' : ''}>
                Cumplido
            </label>
            <h2 class="frase-principal" contenteditable="true">${wish.titulo}</h2>
            <span class="frase-secundaria" contenteditable="true">${wish.subtitulo}</span>
            <div class="meta-cumplido">
                <div class="meta-field"><span class="meta-label">Fecha</span><input type="text" class="meta-input val-date" value="${wish.fecha || ''}"></div>
                <div class="meta-field"><span class="meta-label">Lugar</span><input type="text" class="meta-input val-place" value="${wish.lugar || ''}"></div>
            </div>
        `;
        listaDeseos.appendChild(div);

        // Guardar cambios
        const save = async (update) => {
            await window.supabase.from('wishes').update({
                ...update,
                created_by: CURRENT_USER // Marcamos quién hizo la última edición
            }).eq('id', wish.id);
        };

        div.querySelector('.frase-principal').oninput = (e) => save({ titulo: e.target.textContent });
        div.querySelector('.frase-secundaria').oninput = (e) => save({ subtitulo: e.target.textContent });
        div.querySelector('.val-date').oninput = (e) => save({ fecha: e.target.value });
        div.querySelector('.val-place').oninput = (e) => save({ lugar: e.target.value });
        
        div.querySelector('input[type="checkbox"]').onchange = async (e) => {
            const checked = e.target.checked;
            div.classList.toggle('cumplido', checked);
            await save({ is_done: checked });
            renderAll(); // Recargar contadores
        };

        div.querySelector('.btn-delete').onclick = async () => {
            if (confirm('¿Borrar?')) {
                await window.supabase.from('wishes').delete().eq('id', wish.id);
                allWishes = allWishes.filter(w => w.id !== wish.id);
                renderAll();
            }
        };
    }

    // Botón añadir
    btnAddDeseo.onclick = async () => {
        if (body.classList.contains('locked')) return;
        const { data, error } = await window.supabase.from('wishes').insert({
            owner_email: SHARED_EMAIL,
            created_by: CURRENT_USER, // Quién creó este nuevo deseo
            sort_order: allWishes.length,
            titulo: 'Nuevo deseo',
            subtitulo: 'Haz clic para editar'
        }).select().single();
        if (data) {
            allWishes.push(data);
            renderAll();
        }
    };

    // Botón bloqueo
    btnBloqueo.onclick = async () => {
        const locking = !body.classList.contains('locked');
        body.classList.toggle('locked');
        await window.supabase.from('app_settings').upsert({ 
            owner_email: SHARED_EMAIL, key: 'futuro_locked', value: locking.toString() 
        }, { onConflict: 'owner_email,key' });
    };

    init();
});
