import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RecurringTemplate {
  id: string
  user_id: string
  template_type: 'expense' | 'income'
  amount: number
  description: string | null
  expense_type_id: string | null
  is_split: boolean
  original_amount: number | null
  split_with: string | null
  source: string | null
  frequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly'
  start_date: string
  end_date: string | null
  last_generated_date: string | null
  next_generation_date: string | null
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify request is from GitHub Actions (optional: add secret token)
    const authHeader = req.headers.get('Authorization')
    const expectedToken = Deno.env.get('RECURRING_TRANSACTION_TOKEN')

    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      throw new Error('Unauthorized')
    }

    // Initialize Supabase client with service role key (bypasses RLS)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get current date and future generation window (e.g., 3 months ahead)
    const today = new Date()
    const futureWindow = new Date(today)
    futureWindow.setMonth(futureWindow.getMonth() + 3)

    const todayStr = today.toISOString().split('T')[0]
    const futureWindowStr = futureWindow.toISOString().split('T')[0]

    console.log(`Generating recurring transactions from ${todayStr} to ${futureWindowStr}`)

    // Fetch active templates that need generation
    const { data: templates, error: fetchError } = await supabase
      .from('recurring_templates')
      .select('*')
      .eq('is_active', true)
      .or(`next_generation_date.is.null,next_generation_date.lte.${futureWindowStr}`)

    if (fetchError) throw fetchError

    let generatedCount = 0
    let skippedCount = 0

    // Process each template
    for (const template of (templates as RecurringTemplate[]) || []) {
      try {
        const generated = await generateInstancesForTemplate(supabase, template, today, futureWindow)
        generatedCount += generated
      } catch (err) {
        console.error(`Error processing template ${template.id}:`, err)
        skippedCount++
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: templates?.length || 0,
        generated: generatedCount,
        skipped: skippedCount,
        timestamp: today.toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error: any) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({
        error: error.message || 'Unknown error',
        details: error.toString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

async function generateInstancesForTemplate(
  supabase: any,
  template: RecurringTemplate,
  today: Date,
  futureWindow: Date
): Promise<number> {
  // Determine starting point for generation
  let currentDate = template.last_generated_date
    ? new Date(template.last_generated_date)
    : new Date(template.start_date)

  // If we've never generated, start from start_date
  // Otherwise, calculate next date from last generated
  if (template.last_generated_date) {
    currentDate = calculateNextDate(currentDate, template.frequency)
  }

  const instancesToGenerate: any[] = []

  // Generate instances up to the future window
  while (currentDate <= futureWindow) {
    // Check if we've exceeded end_date
    if (template.end_date && currentDate > new Date(template.end_date)) {
      break
    }

    const currentDateStr = currentDate.toISOString().split('T')[0]

    // Check if this date already has an instance (idempotency)
    const existingCheck = template.template_type === 'expense'
      ? await supabase
          .from('expenses')
          .select('id')
          .eq('recurring_template_id', template.id)
          .eq('date', currentDateStr)
          .maybeSingle()
      : await supabase
          .from('income')
          .select('id')
          .eq('recurring_template_id', template.id)
          .eq('date', currentDateStr)
          .maybeSingle()

    if (!existingCheck.data) {
      // Create new instance
      if (template.template_type === 'expense') {
        instancesToGenerate.push({
          user_id: template.user_id,
          expense_type_id: template.expense_type_id,
          amount: template.amount,
          description: template.description,
          date: currentDateStr,
          is_recurring: true,
          recurring_template_id: template.id,
          is_generated: true,
          is_split: template.is_split,
          original_amount: template.original_amount,
          split_with: template.split_with,
        })
      } else {
        instancesToGenerate.push({
          user_id: template.user_id,
          source: template.source,
          amount: template.amount,
          description: template.description,
          date: currentDateStr,
          is_recurring: true,
          recurring_template_id: template.id,
          is_generated: true,
        })
      }
    }

    // Move to next date
    currentDate = calculateNextDate(currentDate, template.frequency)
  }

  // Batch insert all instances
  if (instancesToGenerate.length > 0) {
    const tableName = template.template_type === 'expense' ? 'expenses' : 'income'
    const { error } = await supabase.from(tableName).insert(instancesToGenerate)
    if (error) throw error
  }

  return instancesToGenerate.length
}

function calculateNextDate(date: Date, frequency: string): Date {
  const next = new Date(date)
  switch (frequency) {
    case 'weekly':
      next.setDate(next.getDate() + 7)
      break
    case 'biweekly':
      next.setDate(next.getDate() + 14)
      break
    case 'monthly':
      next.setMonth(next.getMonth() + 1)
      break
    case 'quarterly':
      next.setMonth(next.getMonth() + 3)
      break
    case 'yearly':
      next.setFullYear(next.getFullYear() + 1)
      break
  }
  return next
}
