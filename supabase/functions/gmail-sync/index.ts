import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

console.log("Función gmail-sync iniciada!")

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Helper para decodificar Base64URL con soporte UTF-8
function decodeBase64(data: string): string {
  try {
    const binaryString = atob(data.replace(/-/g, '+').replace(/_/g, '/'));
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  } catch (e) {
    console.error("Error decodificando base64:", e);
    return "";
  }
}

// Helper para extraer el cuerpo del mensaje (HTML o Texto) de forma recursiva
function getMessageBody(payload: any): string {
  if (!payload) return "";

  // 1. Si es una parte con data directa
  if (payload.body && payload.body.data && (payload.mimeType === 'text/html' || payload.mimeType === 'text/plain')) {
    return decodeBase64(payload.body.data);
  }

  // 2. Si tiene partes (multipart), buscar recursivamente con prioridad
  if (payload.parts) {
    // Primero buscar HTML en este nivel
    for (const part of payload.parts) {
      if (part.mimeType === 'text/html' && part.body?.data) {
        return decodeBase64(part.body.data);
      }
    }
    // Luego buscar texto plano en este nivel
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        return decodeBase64(part.body.data);
      }
    }
    // Si no, buscar en profundidad en cada parte
    for (const part of payload.parts) {
      const body = getMessageBody(part);
      if (body) return body;
    }
  }

  return "";
}

serve(async (req) => {
  // Manejo explícito de CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 200 })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    
    const CLIENT_ID = "41901937320-a384a2r3if5f4gl5sg68ivv8mq21ddhn.apps.googleusercontent.com"
    const CLIENT_SECRET = Deno.env.get('GMAIL_CLIENT_SECRET')

    if (!CLIENT_SECRET) {
      console.error("GMAIL_CLIENT_SECRET no está configurado en los secretos de Supabase.")
      throw new Error("Secret not found")
    }

    // 1. Obtener todos los usuarios con refresh_token
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('*')
      .not('refresh_token', 'is', null)

    if (usersError) throw usersError
    
    console.log(`Sincronizando ${users?.length || 0} usuarios...`)

    if (!users || users.length === 0) {
      return new Response(JSON.stringify({ message: "No hay usuarios con acceso permanente aún" }), { 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      })
    }

    for (const user of users) {
      console.log(`Procesando guardian: ${user.email}`)
      try {
        // 2. Obtener nuevo access_token usando el refresh_token
        const tokenResp = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          body: JSON.stringify({
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            refresh_token: user.refresh_token,
            grant_type: 'refresh_token',
          }),
        })
        const tokenData = await tokenResp.json()
        
        if (tokenData.error) {
          console.error(`Error de token para ${user.email}:`, tokenData.error)
          continue
        }

        const newAccessToken = tokenData.access_token

        // 3. Descargar correos (últimos 10)
        const gmailResp = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10', {
          headers: { 'Authorization': `Bearer ${newAccessToken}` }
        })
        const gmailData = await gmailResp.json()

        if (gmailData.messages) {
          console.log(`- Encontrados ${gmailData.messages.length} mensajes para ${user.email}`)
          for (const msg of gmailData.messages) {
            const detailResp = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`, {
              headers: { 'Authorization': `Bearer ${newAccessToken}` }
            })
            const detail = await detailResp.json()
            
            const subject = detail.payload?.headers?.find((h: any) => h.name === 'Subject')?.value || "(Sin asunto)"
            const fullBody = getMessageBody(detail.payload)
            
            await supabase.from('messages').upsert({
              user_email: user.email,
              gmail_id: msg.id,
              subject: subject,
              snippet: detail.snippet || "",
              body: fullBody // Guardamos el contenido completo
            }, { onConflict: 'gmail_id' })
          }
        }
      } catch (e) {
        console.error(`Fallo individual para ${user.email}:`, e)
      }
    }

    return new Response(JSON.stringify({ success: true, processed: users.length }), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    })
  } catch (err) {
    console.error("Error crítico en gmail-sync:", err)
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    })
  }
})
