/* =====================
   LÓGICA ÁLBUM FOTOS - SUPABASE
   ===================== */

document.addEventListener('DOMContentLoaded', async () => {
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

    // Email compartido para que ambos vean lo mismo
    const SHARED_EMAIL = 'leandygabin9@gmail.com';
    const CURRENT_USER = localStorage.getItem("userEmail");
    const STORAGE_BUCKET = 'album-photos';

    let currentIndex = 0;
    let allWishes = [];
    let allPhotos = [];

    // --- HELPERS SUPABASE ---
    async function loadSettings() {
        const { data, error } = await window.supabase
            .from('app_settings')
            .select('*')
            .eq('owner_email', SHARED_EMAIL)
            .in('key', ['album_locked', 'album_titulo']);
        if (error) return {};
        const result = {};
        (data || []).forEach(row => { result[row.key] = row.value; });
        return result;
    }

    async function saveSetting(key, value) {
        await window.supabase
            .from('app_settings')
            .upsert({ owner_email: SHARED_EMAIL, key, value }, { onConflict: 'owner_email,key' });
    }

    async function loadWishes() {
        const { data, error } = await window.supabase
            .from('wishes')
            .select('*')
            .eq('owner_email', SHARED_EMAIL)
            .order('sort_order', { ascending: true });
        if (error) { console.error('Error cargando deseos:', error); return []; }
        return data || [];
    }

    async function loadPhotos() {
        const { data, error } = await window.supabase
            .from('album_photos')
            .select('*')
            .eq('owner_email', SHARED_EMAIL)
            .order('sort_order', { ascending: true });
        if (error) { console.error('Error cargando fotos:', error); return []; }
        return data || [];
    }

    // --- CARGA INICIAL ---
    const [settings, wishes, photos] = await Promise.all([loadSettings(), loadWishes(), loadPhotos()]);
    allWishes = wishes;
    allPhotos = photos;

    // Aplicar configuración guardada
    const isLocked = settings['album_locked'] === 'true';
    if (isLocked) {
        albumContainer.classList.add('locked');
        btnBloqueo.classList.add('locked');
        btnBloqueo.innerHTML = '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M18,8h-1V6c0-2.76-2.24-5-5-5S7,3.24,7,6v2H6c-1.1,0-2,0.9-2,2v10c0,1.1,0.9,2,2,2h12c1.1,0,2-0.9,2-2V10C20,8.9,19.1,8,18,8z M9,6c0-1.66,1.34-3,3-3s3,1.34,3,3v2H9V6z"/></svg>';
    }

    const savedTitle = settings['album_titulo'];
    if (savedTitle) tituloAlbum.textContent = savedTitle;

    tituloAlbum.addEventListener('input', () => {
        saveSetting('album_titulo', tituloAlbum.textContent);
    });

    // Renderizar ambas secciones
    renderDeseos();
    renderFotos();

    // --- RENDER DESEOS (desde tabla wishes) ---
    function renderDeseos() {
        mosaicoDeseos.innerHTML = '';
        allWishes.forEach((wish, i) => crearSlotDeseo(wish, i));
    }

    // --- RENDER FOTOS NORMALES (desde tabla album_photos) ---
    function renderFotos() {
        mosaicoFotos.innerHTML = '';
        allPhotos.forEach(photo => crearSlotFoto(photo));
    }

    // --- SLOT DESEO (vinculado a tabla wishes) ---
    function crearSlotDeseo(wish, index) {
        const wrapper = document.createElement('div');
        wrapper.className = 'foto-wrapper';
        wrapper.innerHTML = `
            <div class="caption-foto">${wish.titulo || `Deseo #${index + 1}`}</div>
            <div class="foto-item empty" id="deseo-${wish.id}">
                <input type="file" class="input-foto" accept="image/*" hidden>
                <button class="btn-delete" title="Quitar foto">&times;</button>
                <div class="upload-placeholder"><span class="plus-icon">+</span></div>
                <img src="" alt="Recuerdo" class="preview-img">
                <div class="foto-overlay"><span>Ver</span></div>
            </div>
        `;
        mosaicoDeseos.appendChild(wrapper);

        const item = wrapper.querySelector('.foto-item');
        const img = item.querySelector('.preview-img');
        const input = item.querySelector('.input-foto');
        const btnDelete = item.querySelector('.btn-delete');

        // Cargar foto guardada si existe
        if (wish.photo_url) {
            img.src = wish.photo_url;
            item.classList.remove('empty');
        }

        item.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-delete')) return; // No abrir lightbox si borra

            if (item.classList.contains('empty')) {
                if (!albumContainer.classList.contains('locked')) input.click();
            } else {
                openLightbox(item);
            }
        });

        // Lógica para borrar solo la foto del deseo
        btnDelete.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (confirm('¿Eliminar esta foto de la promesa?')) {
                await window.supabase.from('wishes').update({ photo_url: null }).eq('id', wish.id);
                wish.photo_url = null;
                img.src = "";
                item.classList.add('empty');
            }
        });

        input.addEventListener('change', async function () {
            const file = this.files[0];
            if (!file) return;

            // Subir al bucket de Supabase Storage
            const filePath = `wishes/${wish.id}/${Date.now()}_${file.name}`;
            const { data: uploadData, error: uploadError } = await window.supabase.storage
                .from(STORAGE_BUCKET)
                .upload(filePath, file, { upsert: true });

            if (uploadError) {
                console.error('Error subiendo foto:', uploadError);
                alert('Error subiendo la imagen. Intenta de nuevo.');
                return;
            }

            const { data: urlData } = window.supabase.storage
                .from(STORAGE_BUCKET)
                .getPublicUrl(filePath);

            const publicUrl = urlData.publicUrl;

            // Guardar URL y autor en la tabla wishes
            await window.supabase.from('wishes').update({ 
                photo_url: publicUrl,
                created_by: CURRENT_USER // Guardamos quién subió la foto
            }).eq('id', wish.id);
            wish.photo_url = publicUrl;

            img.src = publicUrl;
            item.classList.remove('empty');
        });
    }

    // --- SLOT FOTO NORMAL (vinculado a tabla album_photos) ---
    function crearSlotFoto(photo) {
        const wrapper = document.createElement('div');
        wrapper.className = 'foto-wrapper';
        wrapper.innerHTML = `
            <div class="caption-foto" contenteditable="true">${photo.caption || 'Momento'}</div>
            <div class="foto-item empty" id="foto-${photo.id}">
                <input type="file" class="input-foto" accept="image/*" hidden>
                <button class="btn-delete" title="Eliminar cuadro">&times;</button>
                <div class="upload-placeholder"><span class="plus-icon">+</span></div>
                <img src="" alt="Recuerdo" class="preview-img">
                <div class="foto-overlay"><span>Ver</span></div>
            </div>
        `;
        mosaicoFotos.appendChild(wrapper);

        const item = wrapper.querySelector('.foto-item');
        const caption = wrapper.querySelector('.caption-foto');
        const img = item.querySelector('.preview-img');
        const input = item.querySelector('.input-foto');
        const btnDelete = wrapper.querySelector('.btn-delete');

        // Caption con debounce
        let captionTimer;
        caption.addEventListener('input', () => {
            clearTimeout(captionTimer);
            captionTimer = setTimeout(async () => {
                await window.supabase.from('album_photos').update({ caption: caption.textContent }).eq('id', photo.id);
            }, 600);
        });

        // Cargar foto guardada si existe
        if (photo.photo_url) {
            img.src = photo.photo_url;
            item.classList.remove('empty');
        }

        item.addEventListener('click', (e) => {
            if (item.classList.contains('empty')) {
                if (!albumContainer.classList.contains('locked')) input.click();
            } else if (!e.target.classList.contains('btn-delete')) {
                openLightbox(item);
            }
        });

        btnDelete.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (confirm('¿Eliminar este cuadro por completo?')) {
                // Eliminar foto del storage si existe
                if (photo.storage_path) {
                    await window.supabase.storage.from(STORAGE_BUCKET).remove([photo.storage_path]);
                }
                await window.supabase.from('album_photos').delete().eq('id', photo.id);
                allPhotos = allPhotos.filter(p => p.id !== photo.id);
                renderFotos();
            }
        });

        input.addEventListener('change', async function () {
            const file = this.files[0];
            if (!file) return;

            const filePath = `normal/${photo.id}/${Date.now()}_${file.name}`;
            const { data: uploadData, error: uploadError } = await window.supabase.storage
                .from(STORAGE_BUCKET)
                .upload(filePath, file, { upsert: true });

            if (uploadError) {
                console.error('Error subiendo foto:', uploadError);
                alert('Error subiendo la imagen. Intenta de nuevo.');
                return;
            }

            const { data: urlData } = window.supabase.storage
                .from(STORAGE_BUCKET)
                .getPublicUrl(filePath);

            const publicUrl = urlData.publicUrl;

            await window.supabase.from('album_photos')
                .update({ photo_url: publicUrl, storage_path: filePath })
                .eq('id', photo.id);

            photo.photo_url = publicUrl;
            photo.storage_path = filePath;

            img.src = publicUrl;
            item.classList.remove('empty');
        });
    }

    // --- AÑADIR FOTO NUEVA ---
    btnAddFoto.addEventListener('click', async () => {
        if (albumContainer.classList.contains('locked')) return;

        const newOrder = allPhotos.length;
        const { data, error } = await window.supabase
            .from('album_photos')
            .insert({
                owner_email: SHARED_EMAIL,
                created_by: CURRENT_USER, // Identificamos al creador
                sort_order: newOrder,
                caption: `Momento #${newOrder + 1}`,
                photo_url: null,
                storage_path: null
            })
            .select()
            .single();

        if (!error && data) {
            allPhotos.push(data);
            crearSlotFoto(data);
        }
    });

    // --- BLOQUEO ---
    btnBloqueo.addEventListener('click', async () => {
        const locking = !albumContainer.classList.contains('locked');
        albumContainer.classList.toggle('locked');
        btnBloqueo.classList.toggle('locked');
        await saveSetting('album_locked', locking.toString());

        btnBloqueo.innerHTML = locking ?
            '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M18,8h-1V6c0-2.76-2.24-5-5-5S7,3.24,7,6v2H6c-1.1,0-2,0.9-2,2v10c0,1.1,0.9,2,2,2h12c1.1,0,2-0.9,2-2V10C20,8.9,19.1,8,18,8z M9,6c0-1.66,1.34-3,3-3s3,1.34,3,3v2H9V6z"/></svg>' :
            '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M12,17c1.1,0,2-0.9,2-2s-0.9-2-2-2s-2,0.9-2,2S10.9,17,12,17z M18,8h-1V6c0-2.76-2.24-5-5-5S7,3.24,7,6v2H6c-1.1,0-2,0.9-2,2v10c0,1.1,0.9,2,2,2h12c1.1,0,2-0.9,2-2V10C20,8.9,19.1,8,18,8z M8.9,8c0-1.71,1.39-3.1,3.1-3.1s3.1,1.39,3.1,3.1v2H8.9V8z"/></svg>';
    });

    // --- LIGHTBOX ---
    function openLightbox(item) {
        const allItems = Array.from(document.querySelectorAll('.foto-item:not(.empty)'));
        currentIndex = allItems.indexOf(item);
        updateLightbox(allItems);
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeBtn.addEventListener('click', () => {
        lightbox.classList.remove('active');
        document.body.style.overflow = 'auto';
    });

    prevBtn.addEventListener('click', (e) => { e.stopPropagation(); navigateLightbox(-1); });
    nextBtn.addEventListener('click', (e) => { e.stopPropagation(); navigateLightbox(1); });

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
