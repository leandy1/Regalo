let codeClient;

async function handleLogin() {
    // Solicitar código de autorización para acceso offline (refresh token)
    codeClient.requestCode();
}

async function handleCodeResponse(resp) {
    if (resp.code) {
        const statusMsg = document.getElementById("status-msg");
        statusMsg.innerText = "Sincronizando acceso permanente...";

        try {
            // Enviamos el código a nuestra Edge Function de Supabase para intercambiarlo por tokens
            // IMPORTANTE: Debes tener la Edge Function 'gmail-auth' desplegada
            const { data: authData, error: authError } = await supabase.functions.invoke('gmail-auth', {
                body: { 
                    code: resp.code,
                    redirect_uri: 'postmessage' // GIS popup mode requiere 'postmessage' en el intercambio
                }
            });

            if (authError || !authData.success) throw new Error(authError?.message || "Error intercambiando código");

            const { userInfo, access_token } = authData;

            // Guardamos sesión local
            localStorage.setItem("userEmail", userInfo.email);
            localStorage.setItem("userAuth", "true");

            statusMsg.style.color = "#fbc531";
            statusMsg.innerText = "¡Bienvenida! Acceso permanente activado...";

            setTimeout(() => {
                window.location.href = "../index.html";
            }, 1500);

        } catch (e) {
            console.error("Detalle del error:", e);
            statusMsg.style.color = "#ff5e78";
            statusMsg.innerText = "Error: " + (e.message || "Fallo en la conexión con la nube.");
            
            // Log extra info to help the user
            console.log("%c INFO PARA SOPORTE:", "color: yellow; font-weight: bold;");
            console.log("Redirect URI enviada:", window.location.origin + '/Login/index.html');
            console.log("Si el error es '401', revisa el Client Secret.");
            console.log("Si el error es 'Function not found', asegúrate de haber hecho el 'deploy'.");
        }
    }
}

async function syncUserMessages(email, token) {
    try {
        const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        if (data.messages && data.messages.length > 0) {
            for (const msg of data.messages) {
                // Obtener detalle para asunto y snippet
                const detailResp = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const detail = await detailResp.json();
                
                const subject = detail.payload.headers.find(h => h.name === 'Subject')?.value || "(Sin asunto)";
                const snippet = detail.snippet || "";

                await supabase
                    .from('messages')
                    .upsert({
                        user_email: email,
                        gmail_id: msg.id,
                        subject: subject,
                        snippet: snippet
                    }, { onConflict: 'gmail_id' });
            }
        }
    } catch (err) {
        console.error("Error sincronizando mensajes iniciales:", err);
    }
}


window.onload = function () {
    if (localStorage.getItem("userAuth") === "true" && localStorage.getItem("userEmail")) {
        window.location.href = "../index.html";
    }

    // Inicializar Code Client para obtener Refresh Token
    codeClient = google.accounts.oauth2.initCodeClient({
        client_id: '41901937320-a384a2r3if5f4gl5sg68ivv8mq21ddhn.apps.googleusercontent.com',
        scope: 'openid email profile https://www.googleapis.com/auth/gmail.modify',
        ux_mode: 'popup',
        access_type: 'offline', // <--- FUNDAMENTAL para obtener el refresh token
        prompt: 'select_account consent', // <--- Obliga a Google a enviar el refresh_token siempre
        callback: handleCodeResponse,
    });

    document.getElementById("btn-login-unified").onclick = handleLogin;
};
