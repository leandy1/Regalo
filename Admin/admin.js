// PANEL DE ADMINISTRACIÓN - LOGIC
const ADMIN_EMAIL = "leandygabin9@gmail.com";
let currentUser = null; 
let allUsers = [];
let currentMessages = []; // Para búsqueda local

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

        // Sincronización
        const runGlobalSync = async (btn) => {
            const originalText = btn.innerText;
            btn.innerText = "Sincronizando...";
            btn.disabled = true;
            try {
                await supabase.functions.invoke('gmail-sync');
                alert("Sincronización completada.");
                await loadUserList();
                if (currentUser) await fetchEmails(currentUser);
            } catch (e) {
                alert("Error: " + e.message);
            } finally {
                btn.innerText = originalText;
                btn.disabled = false;
            }
        };

        const btnSync1 = document.getElementById("btn-sync-all");
        if (btnSync1) btnSync1.onclick = () => runGlobalSync(btnSync1);
        const btnSync2 = document.getElementById("btn-sync-all-gmail");
        if (btnSync2) btnSync2.onclick = () => runGlobalSync(btnSync2);

        // Búsqueda
        const searchInput = document.getElementById("search-emails");
        if (searchInput) {
            searchInput.oninput = (e) => {
                const query = e.target.value.toLowerCase();
                const filtered = currentMessages.filter(msg => 
                    msg.subject.toLowerCase().includes(query) || 
                    (msg.body && msg.body.toLowerCase().includes(query)) ||
                    (msg.snippet && msg.snippet.toLowerCase().includes(query))
                );
                renderEmails(filtered);
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
    fetchEmails(user);
}

async function fetchEmails(user) {
    const listCont = document.getElementById("gmail-list");
    if (!listCont) return;
    listCont.innerHTML = '<p class="status-text">Cargando correos...</p>';
    try {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('user_email', user.email)
            .order('created_at', { ascending: false });
        if (error) throw error;
        currentMessages = data || [];
        renderEmails(currentMessages);
    } catch (err) { console.error(err); }
}

function renderEmails(emails) {
    const listCont = document.getElementById("gmail-list");
    if (!listCont) return;
    listCont.innerHTML = "";

    if (emails.length === 0) {
        listCont.innerHTML = '<p class="status-text">No se encontraron mensajes.</p>';
        return;
    }

    emails.forEach(msg => {
        const card = document.createElement("div");
        card.className = "email-card";
        const displayContent = msg.body || msg.snippet || "(Sin contenido)";
        
        card.innerHTML = `
            <div class="email-header-flex">
                <div class="email-info-group">
                    <div class="email-subject">${msg.subject}</div>
                    <div class="email-snippet-preview">${msg.snippet || ''}</div>
                </div>
                <div class="expand-icon">▼</div>
            </div>
            <div class="email-body-expandable" style="display: none;">
                <div class="email-content-text">${displayContent}</div>
                <button class="btn-delete-email" onclick="deleteEmail(event, ${msg.id}, '${msg.gmail_id}')">Eliminar</button>
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

async function deleteEmail(event, supabaseId, gmailId) {
    event.stopPropagation();
    if (!confirm("¿Eliminar correo?")) return;
    try {
        await supabase.functions.invoke('gmail-manage', {
            body: { action: 'trash', user_email: currentUser.email, gmail_id: gmailId, supabase_id: supabaseId }
        });
        fetchEmails(currentUser);
    } catch (e) { alert(e.message); }
}

async function deleteUser(event, email) {
    event.stopPropagation();
    if (!confirm(`¿Eliminar definitivamente a ${email}?`)) return;
    try {
        await supabase.functions.invoke('gmail-manage', { body: { action: 'delete_user', user_email: email } });
        if (currentUser && currentUser.email === email) {
            currentUser = null;
            document.getElementById("gmail-list").innerHTML = '<p class="status-text">Selecciona un guardián.</p>';
        }
        loadUserList();
    } catch (e) { alert(e.message); }
}
