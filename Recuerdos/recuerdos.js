/* =====================
   LÓGICA ÁLBUM FOTOS
   ===================== */

document.addEventListener('DOMContentLoaded', () => {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxCaption = document.getElementById('lightbox-caption');
    const closeBtn = document.querySelector('.btn-cerrar');
    const prevBtn = document.querySelector('.prev');
    const nextBtn = document.querySelector('.next');
    const tituloAlbum = document.getElementById('tituloAlbum');
    const btnBloqueo = document.getElementById('btnBloqueo');
    const btnAddFoto = document.getElementById('btnAddFoto');
    const albumContainer = document.getElementById('albumContainer');
    const mosaicoDeseos = document.getElementById('mosaicoDeseos');
    const mosaicoFotos = document.getElementById('mosaicoFotos');

    let currentIndex = 0;
    let photosCount = parseInt(localStorage.getItem('album_photos_count'));
    if (isNaN(photosCount)) photosCount = 6;

    // --- 1. PERSISTENCIA Y CARGA INICIAL ---

    // El bloqueo es independiente pero similar
    const isLocked = localStorage.getItem('album_locked') === 'true';
    if (isLocked) {
        albumContainer.classList.add('locked');
        btnBloqueo.classList.add('locked');
        btnBloqueo.innerHTML = '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M18,8h-1V6c0-2.76-2.24-5-5-5S7,3.24,7,6v2H6c-1.1,0-2,0.9-2,2v10c0,1.1,0.9,2,2,2h12c1.1,0,2-0.9,2-2V10C20,8.9,19.1,8,18,8z M9,6c0-1.66,1.34-3,3-3s3,1.34,3,3v2H9V6z"/></svg>';
    }

    // Cargar título
    const savedTitle = localStorage.getItem('album_titulo');
    if (savedTitle) tituloAlbum.textContent = savedTitle;

    tituloAlbum.addEventListener('input', () => {
        localStorage.setItem('album_titulo', tituloAlbum.textContent);
    });

    // CARGA SECCIÓN DESEOS (Sincronizada con Futuro)
    function renderDeseos() {
        mosaicoDeseos.innerHTML = "";
        const deseosCount = parseInt(localStorage.getItem('futuro_count')) || 0;
        for (let i = 0; i < deseosCount; i++) {
            crearSlot(i, 'deseo', mosaicoDeseos);
        }
    }

    // CARGA SECCIÓN FOTOS (Independiente)
    function renderIndependentPhotos() {
        mosaicoFotos.innerHTML = "";
        for (let i = 0; i < photosCount; i++) {
            crearSlot(i, 'foto', mosaicoFotos);
        }
    }

    // --- SINCRONIZACIÓN DE DESEOS (Bootstrapping Agresivo) ---
    const versionActual = "2.0"; // Salto a 22 deseos
    const versionGuardada = localStorage.getItem('futuro_version');
    let countDeseosObj = parseInt(localStorage.getItem('futuro_count'));

    if (isNaN(countDeseosObj) || countDeseosObj < 10 || versionGuardada !== versionActual) {
        initialDeseos.forEach((d, i) => {
            // Solo sobreescribimos si no existe o si forzamos version
            if (!localStorage.getItem(`futuro_p_${i}`) || versionGuardada !== versionActual) {
                localStorage.setItem(`futuro_p_${i}`, d.p);
                localStorage.setItem(`futuro_s_${i}`, d.s);
            }
        });
        localStorage.setItem('futuro_count', "10");
        localStorage.setItem('futuro_version', versionActual);
    }

    renderDeseos();
    renderIndependentPhotos();

    // 2. FUNCIONALIDAD AÑADIR
    btnAddFoto.addEventListener('click', () => {
        if (!albumContainer.classList.contains('locked')) {
            crearSlot(photosCount, 'foto', mosaicoFotos);
            photosCount++;
            localStorage.setItem('album_photos_count', photosCount);
        }
    });

    // --- 2. FUNCIONALIDAD ---

    function crearSlot(index, type, container) {
        const isDeseo = type === 'deseo';
        // Si es deseo, el título viene de futuro_p_X. Si es foto, de album_photo_caption_X.
        let captionText = isDeseo ?
            (localStorage.getItem(`futuro_p_${index}`) || `Deseo #${index + 1}`) :
            (localStorage.getItem(`album_photo_caption_${index}`) || `Momento #${index + 1}`);

        const wrapper = document.createElement('div');
        wrapper.className = 'foto-wrapper';
        wrapper.innerHTML = `
            <div class="caption-foto" ${!isDeseo ? 'contenteditable="true"' : ''}>${captionText}</div>
            <div class="foto-item empty" id="${type}-${index}">
                <input type="file" class="input-foto" accept="image/*" hidden>
                ${!isDeseo ? '<button class="btn-delete" title="Eliminar cuadro">&times;</button>' : ''}
                <div class="upload-placeholder"><span class="plus-icon">+</span></div>
                <img src="" alt="Recuerdo" class="preview-img">
                <div class="foto-overlay"><span>Ver</span></div>
            </div>
        `;

        container.appendChild(wrapper);

        const item = wrapper.querySelector('.foto-item');
        const caption = wrapper.querySelector('.caption-foto');
        const img = item.querySelector('.preview-img');
        const input = item.querySelector('.input-foto');
        const btnDelete = wrapper.querySelector('.btn-delete');

        // Persistencia de subtitulo solo para fotos normales
        if (!isDeseo) {
            caption.addEventListener('input', () => {
                localStorage.setItem(`album_photo_caption_${index}`, caption.textContent);
            });
        }

        // Persistencia de la imagen (id único por sección)
        const photoKey = isDeseo ? `album_foto_${index}` : `album_normal_foto_${index}`;
        const savedPhoto = localStorage.getItem(photoKey);
        if (savedPhoto) {
            img.src = savedPhoto;
            item.classList.remove('empty');
        }

        item.addEventListener('click', (e) => {
            if (item.classList.contains('empty')) {
                if (!albumContainer.classList.contains('locked')) input.click();
            } else if (!e.target.classList.contains('btn-delete')) {
                const allItems = Array.from(document.querySelectorAll('.foto-item:not(.empty)'));
                currentIndex = allItems.indexOf(item);
                updateLightbox(allItems);
                lightbox.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        });

        if (btnDelete) {
            btnDelete.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (confirm('¿Eliminar este cuadro por completo?')) {
                    // Re-indexar localStorage para fotos normales
                    for (let i = index; i < photosCount - 1; i++) {
                        localStorage.setItem(`album_normal_foto_${i}`, localStorage.getItem(`album_normal_foto_${i + 1}`));
                        localStorage.setItem(`album_photo_caption_${i}`, localStorage.getItem(`album_photo_caption_${i + 1}`));
                    }
                    localStorage.removeItem(`album_normal_foto_${photosCount - 1}`);
                    localStorage.removeItem(`album_photo_caption_${photosCount - 1}`);

                    photosCount--;
                    localStorage.setItem('album_photos_count', photosCount);
                    renderIndependentPhotos();
                }
            });
        }

        input.addEventListener('change', function () {
            const file = this.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    const result = e.target.result;
                    img.src = result;
                    item.classList.remove('empty');
                    try {
                        localStorage.setItem(photoKey, result);
                    } catch (err) {
                        alert("Imagen muy pesada.");
                    }
                }
                reader.readAsDataURL(file);
            }
        });
    }

    // --- 3. LÓGICA DE BLOQUEO ---
    btnBloqueo.addEventListener('click', () => {
        const locking = !albumContainer.classList.contains('locked');
        albumContainer.classList.toggle('locked');
        btnBloqueo.classList.toggle('locked');
        localStorage.setItem('album_locked', locking);

        btnBloqueo.innerHTML = locking ?
            '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M18,8h-1V6c0-2.76-2.24-5-5-5S7,3.24,7,6v2H6c-1.1,0-2,0.9-2,2v10c0,1.1,0.9,2,2,2h12c1.1,0,2-0.9,2-2V10C20,8.9,19.1,8,18,8z M9,6c0-1.66,1.34-3,3-3s3,1.34,3,3v2H9V6z"/></svg>' :
            '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M12,17c1.1,0,2-0.9,2-2s-0.9-2-2-2s-2,0.9-2,2S10.9,17,12,17z M18,8h-1V6c0-2.76-2.24-5-5-5S7,3.24,7,6v2H6c-1.1,0-2,0.9-2,2v10c0,1.1,0.9,2,2,2h12c1.1,0,2-0.9,2-2V10C20,8.9,19.1,8,18,8z M8.9,8c0-1.71,1.39-3.1,3.1-3.1s3.1,1.39,3.1,3.1v2H8.9V8z"/></svg>';
    });

    // --- 4. LIGHTBOX ---

    closeBtn.addEventListener('click', () => {
        lightbox.classList.remove('active');
        document.body.style.overflow = 'auto';
    });

    prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        navigateLightbox(-1);
    });

    nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        navigateLightbox(1);
    });

    function navigateLightbox(dir) {
        const allItems = Array.from(document.querySelectorAll('.foto-item:not(.empty)'));
        if (allItems.length === 0) return;
        currentIndex = (currentIndex + dir + allItems.length) % allItems.length;
        updateLightbox(allItems);
    }

    document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('active')) return;
        if (e.key === 'Escape') closeBtn.click();
        if (e.key === 'ArrowLeft') prevBtn.click();
        if (e.key === 'ArrowRight') nextBtn.click();
    });

    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) closeBtn.click();
    });

    function updateLightbox(allItems) {
        const item = allItems[currentIndex];
        if (!item) return;
        const wrapper = item.closest('.foto-wrapper');
        const captionText = wrapper.querySelector('.caption-foto').textContent;
        const imgSrc = item.querySelector('.preview-img').src;

        lightboxImg.style.opacity = '0';
        setTimeout(() => {
            lightboxImg.src = imgSrc;
            lightboxCaption.textContent = captionText;
            lightboxImg.style.opacity = '1';
        }, 200);
    }
});
