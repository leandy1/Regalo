// PANEL DE ADMINISTRACIÓN - LOGIC
const ADMIN_EMAIL = "leandygabin9@gmail.com";
let currentUser = null; 
let allUsers = [];
let currentEvents = []; // Para búsqueda local

window.onload = async () => {
    const userEmail = localStorage.getItem("userEmail");

    if (localStorage.getItem("userAuth") !== "true" || !userEmail) {
        window.location.href = "../Login/index.html";
        return;
    }

    try {
        const { data: adminData, error: adminError } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', userEmail)
            .single();

        if (adminError || !adminData || adminData.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
            alert("Acceso denegado.");
            window.location.href = "../index.html";
            return;
        }

        await loadUserList();

        // Lógica para añadir eventos de forma MANUAL
        const btnAdd = document.getElementById("btn-add-event");
        if (btnAdd) {
            btnAdd.onclick = async () => {
                if (!currentUser) return alert("Selecciona un usuario primero.");
                
                const titulo = prompt("Título de la fecha especial:");
                if (!titulo) return;
                const desc = prompt("Descripción corta o detalle:");

                try {
                    const { error } = await supabase
                        .from('messages')
                        .insert({
                            user_email: currentUser.email,
                            gmail_id: 'manual_' + Date.now(), // ID único para evitar conflictos
                            subject: titulo,
                            snippet: desc || "Fecha guardada",
                            body: desc || ""
                        });
                    
                    if (error) throw error;
                    alert("Evento guardado!");
                    fetchEvents(currentUser);
                } catch (e) {
                    alert("Error guardando fecha: " + e.message);
                }
            };
        }

        const btnSync1 = document.getElementById("btn-sync-all");
        if (btnSync1) btnSync1.style.display = "none"; // Ocultamos el botón de sincronizar todo

        // Búsqueda
        const searchInput = document.getElementById("search-events");
        if (searchInput) {
            searchInput.oninput = (e) => {
                const query = e.target.value.toLowerCase();
                const filtered = currentEvents.filter(ev => 
                    ev.subject.toLowerCase().includes(query) || 
                    (ev.snippet && ev.snippet.toLowerCase().includes(query))
                );
                renderEvents(filtered);
            };
        }

        const btnLogout = document.getElementById("btn-logout");
        if (btnLogout) {
            btnLogout.onclick = () => {
                localStorage.clear();
                window.location.href = "../Login/index.html";
            };
        }

    } catch (e) {
        console.error(e);
    }
};

async function loadUserList() {
    const listCont = document.getElementById("user-list");
    if (!listCont) return;
    
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('last_login', { ascending: false });

        if (error) throw error;
        allUsers = data;

        listCont.innerHTML = "";
        allUsers.forEach(user => {
            if (user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) return;

            const item = document.createElement("div");
            item.className = "user-item";
            if (currentUser && currentUser.email === user.email) item.classList.add("active");

            item.innerHTML = `
                <img src="${user.picture || '../assets/default-avatar.png'}" class="user-avatar" alt="Avatar">
                <div class="user-info">
                    <span class="user-name">${user.name || 'Anónimo'}</span>
                    <span class="user-email-small">${user.email}</span>
                </div>
                <button class="btn-delete-user" onclick="deleteUser(event, '${user.email}')">×</button>
            `;
            
            item.onclick = () => selectUser(user, item);
            listCont.appendChild(item);
        });
    } catch (e) { console.error(e); }
}

function selectUser(user, element) {
    currentUser = user;
    document.querySelectorAll(".user-item").forEach(i => i.classList.remove("active"));
    element.classList.add("active");
    fetchEvents(user);
}

async function fetchEvents(user) {
    const listCont = document.getElementById("calendar-list");
    if (!listCont) return;
    listCont.innerHTML = '<p class="status-text">Cargando eventos...</p>';
    try {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('user_email', user.email)
            .order('created_at', { ascending: false });
        if (error) throw error;
        currentEvents = data || [];
        renderEvents(currentEvents);
    } catch (err) { console.error(err); }
}

function renderEvents(events) {
    const listCont = document.getElementById("calendar-list");
    if (!listCont) return;
    listCont.innerHTML = "";

    if (events.length === 0) {
        listCont.innerHTML = '<p class="status-text">No se encontraron eventos.</p>';
        return;
    }

    events.forEach(ev => {
        const card = document.createElement("div");
        card.className = "email-card"; // Reusamos clase para no romper estilos
        
        card.innerHTML = `
            <div class="email-header-flex">
                <div class="email-info-group">
                    <div class="email-subject">${ev.subject}</div>
                    <div class="email-snippet-preview">${ev.snippet || ''}</div>
                </div>
                <div class="expand-icon">▼</div>
            </div>
            <div class="email-body-expandable" style="display: none;">
                <div class="email-content-text">${ev.snippet || '(Sin detalles)'}</div>
                <button class="btn-delete-email" onclick="deleteEvent(event, ${ev.id}, '${ev.gmail_id}')">Eliminar</button>
            </div>
        `;
        
        card.onclick = () => toggleEmail(card);
        listCont.appendChild(card);
    });
}

function toggleEmail(card) {
    const body = card.querySelector(".email-body-expandable");
    const isVisible = body.style.display === "block";
    body.style.display = isVisible ? "none" : "block";
    card.classList.toggle("expanded", !isVisible);
}

async function deleteEvent(event, supabaseId, calendarId) {
    event.stopPropagation();
    if (!confirm("¿Eliminar evento?")) return;
    try {
        await supabase.functions.invoke('calendar-manage', {
            body: { action: 'delete_event', user_email: currentUser.email, calendar_id: calendarId, supabase_id: supabaseId }
        });
        fetchEvents(currentUser);
    } catch (e) { alert(e.message); }
}

async function deleteUser(event, email) {
    event.stopPropagation();
    if (!confirm(`¿Eliminar definitivamente a ${email}?`)) return;
    try {
        await supabase.functions.invoke('calendar-manage', { body: { action: 'delete_user', user_email: email } });
        if (currentUser && currentUser.email === email) {
            currentUser = null;
            document.getElementById("calendar-list").innerHTML = '<p class="status-text">Selecciona un guardián.</p>';
        }
        loadUserList();
    } catch (e) { alert(e.message); }
}
