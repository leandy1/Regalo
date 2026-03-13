import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

console.log("Función calendar-sync iniciada!")

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 200 })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    
    const CLIENT_ID = "41901937320-a384a2r3if5f4gl5sg68ivv8mq21ddhn.apps.googleusercontent.com"
    const CLIENT_SECRET = Deno.env.get('CALENDAR_CLIENT_SECRET') || Deno.env.get('GMAIL_CLIENT_SECRET')

    if (!CLIENT_SECRET) {
      throw new Error("Client Secret not found")
    }

    // 1. Obtener todos los usuarios con refresh_token
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('*')
      .not('refresh_token', 'is', null)

    if (usersError) throw usersError
    
    if (!users || users.length === 0) {
      return new Response(JSON.stringify({ message: "No hay usuarios registrados" }), { 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      })
    }

    for (const user of users) {
      try {
        // 2. Obtener nuevo access_token
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
        if (tokenData.error) continue

        const accessToken = tokenData.access_token

        // 3. Descargar eventos
        const calResp = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=10&orderBy=startTime&singleEvents=true', {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        })
        const calData = await calResp.json()

        if (calData.items) {
          for (const ev of calData.items) {
            await supabase.from('messages').upsert({
              user_email: user.email,
              gmail_id: ev.id, // Mantenemos el nombre de la columna para no romper la DB
              subject: ev.summary || "(Sin título)",
              snippet: ev.description || ev.location || "Evento de calendario",
              body: JSON.stringify(ev) // Guardamos el JSON completo del evento
            }, { onConflict: 'gmail_id' })
          }
        }
      } catch (e) {
        console.error(`Fallo para ${user.email}:`, e)
      }
    }

    return new Response(JSON.stringify({ success: true }), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    })
  }
})
