import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/cron/auto-followup
 *
 * Regras de avanço automático:
 * - contatado → follow-up: após 24 horas sem resposta
 * - follow-up → perdido (breakup): após 2 dias (48h) adicionais sem resposta
 *
 * Chamado por:
 * 1. Vercel Cron Job (cron.json) — a cada hora em produção
 * 2. layout.tsx ao abrir o app — garante atualização mesmo sem cron
 */
export async function GET() {
  const supabase = await createClient()
  const agora = new Date()

  // 1. contatado → follow-up (24h sem resposta)
  const limite24h = new Date(agora.getTime() - 24 * 60 * 60 * 1000).toISOString()

  const { data: paraFollowUp, error: err1 } = await supabase
    .from('leads')
    .update({
      status_funil: 'follow-up',
      follow_up_em: agora.toISOString(),
    })
    .eq('status_funil', 'contatado')
    .lt('contatado_em', limite24h)
    .select('id, nome')

  if (err1) {
    console.error('[auto-followup] Erro ao avançar para follow-up:', err1)
    return NextResponse.json({ error: err1.message }, { status: 500 })
  }

  // 2. follow-up → perdido (2 dias = 48h adicionais após virar follow-up)
  const limite48h = new Date(agora.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()

  const { data: paraPerdido, error: err2 } = await supabase
    .from('leads')
    .update({ status_funil: 'perdido' })
    .eq('status_funil', 'follow-up')
    .lt('follow_up_em', limite48h)
    .select('id, nome')

  if (err2) {
    console.error('[auto-followup] Erro ao avançar para perdido:', err2)
    return NextResponse.json({ error: err2.message }, { status: 500 })
  }

  const resultado = {
    atualizados_em: agora.toISOString(),
    para_follow_up: paraFollowUp?.length ?? 0,
    para_perdido: paraPerdido?.length ?? 0,
    leads_follow_up: paraFollowUp?.map((l) => l.nome) ?? [],
    leads_perdido: paraPerdido?.map((l) => l.nome) ?? [],
  }

  console.log('[auto-followup]', resultado)
  return NextResponse.json(resultado)
}
