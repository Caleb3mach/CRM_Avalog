import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// PATCH /api/leads/lote — Atualiza múltiplos leads
export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const body = await request.json()

  const { lead_ids, segmento } = body

  if (!lead_ids || !lead_ids.length || !segmento) {
    return NextResponse.json({ error: 'Dados incompletos (lead_ids, segmento)' }, { status: 400 })
  }

  // A API do Supabase permite update com .in()
  const { data, error } = await supabase
    .from('leads')
    .update({ segmento })
    .in('id', lead_ids)
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, count: data.length })
}
