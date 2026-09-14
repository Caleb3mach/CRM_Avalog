import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/interacoes?lead_id=xxx
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const leadId = new URL(request.url).searchParams.get('lead_id')

  if (!leadId) return NextResponse.json({ error: 'lead_id obrigatório' }, { status: 400 })

  const { data, error } = await supabase
    .from('interacoes')
    .select('*')
    .eq('lead_id', leadId)
    .order('data', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST /api/interacoes — registrar nova interação
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const body = await request.json()

  const { data: interacao, error: interacaoError } = await supabase
    .from('interacoes')
    .insert(body)
    .select()
    .single()

  if (interacaoError) return NextResponse.json({ error: interacaoError.message }, { status: 500 })

  // Atualizar ultima_interacao_em do lead
  const updateData: Record<string, unknown> = {
    ultima_interacao_em: new Date().toISOString(),
  }

  if (body.status_resultante) {
    updateData.status_funil = body.status_resultante
    if (body.status_resultante === 'contatado') {
      updateData.contatado_em = new Date().toISOString()
    }
    if (body.status_resultante === 'follow-up') {
      updateData.follow_up_em = new Date().toISOString()
    }
  }

  await supabase.from('leads').update(updateData).eq('id', body.lead_id)

  return NextResponse.json(interacao, { status: 201 })
}
