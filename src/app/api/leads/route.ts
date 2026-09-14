import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/leads — lista leads com filtros
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)

  let query = supabase.from('leads').select('*').order('criado_em', { ascending: false })

  const segmento = searchParams.get('segmento')
  const statusFunil = searchParams.get('status_funil')
  const statusSite = searchParams.get('status_site')
  const instagramAtivo = searchParams.get('instagram_ativo')
  const avaliacoesMin = searchParams.get('avaliacoes_min')
  const avaliacoesMax = searchParams.get('avaliacoes_max')

  if (segmento && segmento !== 'todos') query = query.eq('segmento', segmento)
  if (statusFunil && statusFunil !== 'todos') query = query.eq('status_funil', statusFunil)
  if (statusSite && statusSite !== 'todos') query = query.eq('status_site', statusSite)
  if (instagramAtivo && instagramAtivo !== 'todos') query = query.eq('instagram_ativo', instagramAtivo)
  if (avaliacoesMin) query = query.gte('avaliacoes_google', parseInt(avaliacoesMin))
  if (avaliacoesMax) query = query.lte('avaliacoes_google', parseInt(avaliacoesMax))

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST /api/leads — criar lead
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const body = await request.json()

  const { data, error } = await supabase
    .from('leads')
    .insert(body)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
