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
        // Verificar administrador
        console.log("Verificando acceso para:", userEmail);
        const { data: adminData, error: adminError } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', userEmail)
            .single();

        if (adminError || !adminData || adminData.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
            console.error("Acceso denegado. Error:", adminError);
            console.log("Datos del perfil:", adminData);
            alert("Acceso denegado: No tienes permisos de administrador.");
            window.location.href = "../index.html";
            return;
        }
        console.log("¡Acceso concedido! Bienvenido Admin.");

        // Cargar todos los usuarios
        await loadUserList();

        // 🔄 FUNCIÓN DE SINCRONIZACIÓN GLOBAL
        const runGlobalSync = async (btn) => {
            const originalText = btn.innerText;
            btn.innerText = "Sincronizando...";
            btn.disabled = true;

            try {
                const { data, error } = await supabase.functions.invoke('gmail-sync');
                if (error) throw error;
                
                alert("Sincronización global completada.");
                await loadUserList();
                if (currentUser) await fetchEmails(currentUser);

            } catch (e) {
                console.error("Error en sync global:", e);
                alert("Error al ejecutar la sincronización: " + (e.message || "Revisa la consola"));
            } finally {
                btn.innerText = originalText;
                btn.disabled = false;
            }
        };

        const btnSidebar = document.getElementById("btn-sync-all");
        if (btnSidebar) btnSidebar.onclick = () => runGlobalSync(btnSidebar);

        const btnMain = document.getElementById("btn-sync-all-gmail");
        if (btnMain) btnMain.onclick = () => runGlobalSync(btnMain);

        // Búsqueda de emails
        const searchInput = document.getElementById("search-emails");
        if (searchInput) {
            searchInput.oninput = (e) => {
                const query = e.target.value.toLowerCase();
                const filtered = currentMessages.filter(msg => 
                    msg.subject.toLowerCase().includes(query) || 
                    msg.snippet.toLowerCase().includes(query)
                );
                renderEmails(filtered);
            };
        }

        // Botón de cerrar sesión
        const btnLogout = document.getElementById("btn-logout");
        if (btnLogout) {
            btnLogout.onclick = () => {
                localStorage.clear();
                window.location.href = "../Login/index.html";
            };
        }

    } catch (e) {
        console.error("Error cargando panel Admin:", e);
        window.location.href = "../index.html";
    }
};

async function loadUserList() {
    const listCont = document.getElementById("user-list");
    if (!listCont) return;
    
    listCont.innerHTML = '<p class="status-inner">Conectando...</p>';

    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('last_login', { ascending: false });

        if (error) throw error;
        allUsers = data;

        if (allUsers.length === 0) {
            listCont.innerHTML = '<p class="status-inner">No hay usuarios aún.</p>';
            return;
        }

        listCont.innerHTML = "";
        allUsers.forEach(user => {
            if (user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) return;

            const item = document.createElement("div");
            item.className = "user-item";
            item.innerHTML = `
                <img src="${user.picture || '../assets/default-avatar.png'}" class="user-avatar" alt="Avatar">
                <div class="user-info">
                    <span class="user-name">${user.name || 'Anónimo'}</span>
                    <span class="user-email-small">${user.email}</span>
                </div>
                <button class="btn-delete-user" onclick="deleteUser(event, '${user.email}')" title="Eliminar Guardián">×</button>
            `;
            
            item.onclick = () => selectUser(user, item);
            listCont.appendChild(item);
        });

        if (listCont.innerHTML === "") {
            listCont.innerHTML = '<p class="status-inner">No hay otros guardianes registrados.</p>';
        }

    } catch (e) {
        console.error("Error cargando usuarios:", e);
        listCont.innerHTML = '<p class="status-inner">Error al listar guardianes.</p>';
    }
}

function selectUser(user, element) {
    currentUser = user;
    
    document.querySelectorAll(".user-item").forEach(i => i.classList.remove("active"));
    element.classList.add("active");

    const searchInput = document.getElementById("search-emails");
    if (searchInput) searchInput.value = ""; // Limpiar búsqueda al cambiar usuario
    
    fetchEmails(user);
}

async function fetchEmails(user) {
    const listCont = document.getElementById("gmail-list");
    if (!listCont) return;

    listCont.innerHTML = '<p class="status-text">Consultando archivos estelares...</p>';

    try {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('user_email', user.email)
            .order('created_at', { ascending: false });

        if (error) throw error;

        currentMessages = data || [];
        renderEmails(currentMessages);
        
    } catch (err) {
        console.error("Error cargando mensajes de Supabase:", err);
        listCont.innerHTML = '<p class="status-text">Error al cargar mensajes guardados.</p>';
    }
}

function renderEmails(emails) {
    const listCont = document.getElementById("gmail-list");
    if (!listCont) return;

    if (emails && emails.length > 0) {
        listCont.innerHTML = "";
        emails.forEach(msg => {
            const card = document.createElement("div");
            card.className = "email-card";
            
            // Usar el body si existe, sino el snippet
            const displayContent = msg.body || msg.snippet;
            
            card.innerHTML = `
                <div class="email-subject">${msg.subject}</div>
                <div class="email-content-full">${displayContent}</div>
                <button class="btn-delete-email" onclick="deleteEmail(${msg.id}, '${msg.gmail_id}')">Eliminar de Gmail</button>
            `;
            listCont.appendChild(card);
        });
    } else {
        listCont.innerHTML = '<p class="status-text">No se encontraron mensajes.</p>';
    }
}

async function deleteEmail(supabaseId, gmailId) {
    if (!currentUser) return;

    if (!confirm("¿Estás seguro? Esto eliminará el correo de Gmail (lo moverá a la papelera) y del portal.")) return;

    try {
        const { data, error } = await supabase.functions.invoke('gmail-manage', {
            body: { 
                action: 'trash',
                user_email: currentUser.email,
                gmail_id: gmailId,
                supabase_id: supabaseId
            }
        });

        if (error || (data && data.error)) throw new Error(error?.message || data?.error || "Error al eliminar");

        alert("Mensaje eliminado con éxito.");
        if (currentUser) fetchEmails(currentUser);

    } catch (e) {
        console.error("Error en proceso de borrado:", e);
        alert("Fallo al eliminar: " + e.message);
    }
}

async function deleteUser(event, email) {
    event.stopPropagation(); // Evitar que se seleccione el usuario al hacer clic en eliminar

    if (!confirm(`¿Estás SEGURO? Esto eliminará DEFINITIVAMENTE al usuario ${email} y todos sus mensajes guardados en el portal.`)) return;

    try {
        const { data, error } = await supabase.functions.invoke('gmail-manage', {
            body: { 
                action: 'delete_user',
                user_email: email
            }
        });

        if (error || (data && data.error)) throw new Error(error?.message || data?.error || "Error al eliminar usuario");

        alert("Usuario eliminado correctamente.");
        
        // Si el usuario eliminado era el seleccionado, limpiar la vista
        if (currentUser && currentUser.email === email) {
            currentUser = null;
            document.getElementById("gmail-list").innerHTML = '<p class="status-text">Los mensajes aparecerán aquí después de seleccionar a alguien.</p>';
        }

        await loadUserList();

    } catch (e) {
        console.error("Error eliminando usuario:", e);
        alert("Fallo al eliminar usuario: " + e.message);
    }
}
