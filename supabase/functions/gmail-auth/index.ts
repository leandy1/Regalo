import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { code, redirect_uri } = await req.json()
    
    const CLIENT_ID = "41901937320-a384a2r3if5f4gl5sg68ivv8mq21ddhn.apps.googleusercontent.com"
    const CLIENT_SECRET = Deno.env.get('GMAIL_CLIENT_SECRET')

    // 1. Intercambiar código por tokens
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      body: JSON.stringify({
        code,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri,
        grant_type: 'authorization_code',
      }),
    })
    
    const tokens = await response.json()
    
    if (tokens.error) {
      console.error("Error de Google Auth:", tokens);
      throw new Error(`Google Error: ${tokens.error_description || tokens.error}`);
    }

    // 2. Obtener info del usuario
    const userResp = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { 'Authorization': `Bearer ${tokens.access_token}` }
    })
    const userInfo = await userResp.json()

    // 3. Guardar en Supabase - Solo actualizamos el refresh_token si viene uno nuevo
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    
    const updateData: any = {
      email: userInfo.email,
      name: userInfo.name,
      picture: userInfo.picture,
      last_login: new Date().toISOString()
    };
    
    if (tokens.refresh_token) {
      updateData.refresh_token = tokens.refresh_token;
    }

    await supabase.from('profiles').upsert(updateData, { onConflict: 'email' })

    return new Response(JSON.stringify({ success: true, userInfo, access_token: tokens.access_token }), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    })
  }
})
