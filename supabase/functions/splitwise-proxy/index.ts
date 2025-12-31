// Supabase Edge Function to proxy Splitwise API requests
// This bypasses CORS restrictions by making requests server-side

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const SPLITWISE_API_BASE = 'https://secure.splitwise.com/api/v3.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get API key from request header
    const apiKey = req.headers.get('x-api-key')
    if (!apiKey) {
      throw new Error('Missing API key in x-api-key header')
    }

    // Get the Splitwise endpoint from query params
    const url = new URL(req.url)
    const endpoint = url.searchParams.get('endpoint') || '/get_current_user'

    // Remove 'endpoint' param and keep others (like dated_after, limit, etc.)
    url.searchParams.delete('endpoint')
    const queryString = url.search

    // Build Splitwise API URL
    const splitwiseUrl = `${SPLITWISE_API_BASE}${endpoint}${queryString}`

    console.log('Proxying request to:', splitwiseUrl)

    // Make request to Splitwise
    const response = await fetch(splitwiseUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Splitwise API error:', data)
      throw new Error(data.error || data.errors?.base?.[0] || 'Splitwise API error')
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({
        error: error.message || 'Unknown error',
        details: error.toString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
