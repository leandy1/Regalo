let codeClient;

async function handleLogin() {
    // Solicitar código de autorización para acceso offline (refresh token)
    codeClient.requestCode();
}

async function handleCodeResponse(resp) {
    if (resp.code) {
        const statusMsg = document.getElementById("status-msg");
        statusMsg.innerText = "Iniciando sesión...";

        try {
            // Usamos la nueva función específica para calendario
            const { data: authData, error: authError } = await supabase.functions.invoke('calendar-auth', {
                body: { code: resp.code, redirect_uri: 'postmessage' }
            });

            if (authError || !authData.success) throw new Error(authError?.message || "Error al entrar");

            localStorage.setItem("userEmail", authData.userInfo.email);
            localStorage.setItem("userAuth", "true");

            // Preparado para el futuro: Sincronizar eventos si ya existe un token válido
            if (authData.access_token) {
                await syncUserEvents(authData.userInfo.email, authData.access_token);
            }

            statusMsg.style.color = "#fbc531";
            statusMsg.innerText = "¡Bienvenida/o! Entrando al portal...";

            setTimeout(() => {
                window.location.href = "../index.html";
            }, 1000);

        } catch (e) {
            const statusMsg = document.getElementById("status-msg");
            statusMsg.innerText = "Error: " + e.message;
        }
    }
}

async function syncUserEvents(email, token) {
    try {
        const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=10', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        if (data.items && data.items.length > 0) {
            for (const event of data.items) {
                await supabase
                    .from('messages') 
                    .upsert({
                        user_email: email,
                        gmail_id: event.id,
                        subject: event.summary || "(Sin título)",
                        snippet: event.description || "Evento de calendario"
                    }, { onConflict: 'gmail_id' });
            }
        }
    } catch (err) {
        console.error("Error en sincronización futura:", err);
    }
}

window.onload = function () {
    if (localStorage.getItem("userAuth") === "true" && localStorage.getItem("userEmail")) {
        window.location.href = "../index.html";
    }

    codeClient = google.accounts.oauth2.initCodeClient({
        client_id: '41901937320-a384a2r3if5f4gl5sg68ivv8mq21ddhn.apps.googleusercontent.com',
        scope: 'openid email profile https://www.googleapis.com/auth/calendar.readonly', // Scopes restaurados
        ux_mode: 'popup',
        access_type: 'offline', // Necesario para refrescar tokens más tarde
        prompt: 'select_account consent', // Obliga a pedir permisos para asegurar el refresh token
        callback: handleCodeResponse,
    });

    document.getElementById("btn-login-unified").onclick = () => codeClient.requestCode();
};
