import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { action, user_email, gmail_id, supabase_id } = await req.json()
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    if (action === 'trash') {
      // 1. Obtener refresh_token del usuario
      const { data: user, error: userError } = await supabase
        .from('profiles')
        .select('refresh_token')
        .eq('email', user_email)
        .single()

      if (userError || !user?.refresh_token) throw new Error("No refresh token found for user")

      // 2. Obtener access_token
      const tokenResp = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        body: JSON.stringify({
          client_id: "41901937320-a384a2r3if5f4gl5sg68ivv8mq21ddhn.apps.googleusercontent.com",
          client_secret: Deno.env.get('GMAIL_CLIENT_SECRET'),
          refresh_token: user.refresh_token,
          grant_type: 'refresh_token',
        }),
      })
      const tokenData = await tokenResp.json()
      if (tokenData.error) throw new Error("Failed to get access token")

      // 3. Mover a la papelera en Gmail
      const trashResp = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${gmail_id}/trash`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
      })

      if (!trashResp.ok) throw new Error("Failed to trash message in Gmail")

      // 4. Borrar de Supabase
      await supabase.from('messages').delete().eq('id', supabase_id)

      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } })
    }

    if (action === 'delete_user') {
      // 1. Borrar todos los mensajes asociados
      const { error: msgError } = await supabase.from('messages').delete().eq('user_email', user_email)
      if (msgError) throw msgError

      // 2. Borrar el perfil
      const { error: profError } = await supabase.from('profiles').delete().eq('email', user_email)
      if (profError) throw profError

      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } })
    }

    if (action === 'empty_trash') {
      // 1. Obtener refresh_token
      const { data: user, error: userError } = await supabase
        .from('profiles')
        .select('refresh_token')
        .eq('email', user_email)
        .single()

      if (userError || !user?.refresh_token) throw new Error("No refresh token found")

      // 2. Obtener access_token
      const tokenResp = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        body: JSON.stringify({
          client_id: "41901937320-a384a2r3if5f4gl5sg68ivv8mq21ddhn.apps.googleusercontent.com",
          client_secret: Deno.env.get('GMAIL_CLIENT_SECRET'),
          refresh_token: user.refresh_token,
          grant_type: 'refresh_token',
        }),
      })
      const tokenData = await tokenResp.json()
      if (tokenData.error) throw new Error("Token refresh failed")

      // 3. Listar mensajes en la papelera
      console.log("Listando papelera para:", user_email);
      const listResp = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?labelIds=TRASH&maxResults=500`, {
        headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
      });
      
      const listData = await listResp.json();
      if (!listResp.ok) throw new Error(`List Trash failed: ${listData.error?.message || listResp.statusText}`);

      const messages = listData.messages || [];
      if (messages.length === 0) {
        return new Response(JSON.stringify({ success: true, message: "La papelera ya estaba vacía" }), { 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        });
      }

      // 4. Batch Delete (Eliminación permanente)
      const ids = messages.map((m: any) => m.id);
      console.log(`Eliminando ${ids.length} mensajes permanentemente...`);
      
      const deleteResp = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/batchDelete`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ids })
      });

      if (!deleteResp.ok) {
        const errorText = await deleteResp.text();
        throw new Error(`Batch Delete failed: ${deleteResp.status} - ${errorText}`);
      }

      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } })
    }

    throw new Error("Invalid action")
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("Function Error:", errorMsg);
    
    // Devolvemos 200 con success: false para que Supabase no oculte el detalle del error en un 400 genérico
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMsg 
    }), { 
      status: 200, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    })
  }
})
