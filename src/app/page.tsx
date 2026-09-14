import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Users, TrendingUp, CheckCircle2, AlertTriangle, Clock, ArrowRight, Zap, Car, Target, Flame, MessageCircle } from 'lucide-react'
import { type Lead, COLUNAS_FUNIL, SEGMENTO_LABELS, type Segmento, type StatusFunil } from '@/lib/types'
import { diasDesdeContato, formatarDistancia, formatarTelefone, whatsappLink } from '@/lib/utils'
import ActivityChart from '@/components/ActivityChart'
import FunnelProgressBar from '@/components/FunnelProgressBar'

export const dynamic = 'force-dynamic'

function pct(num: number, den: number) {
  if (den === 0) return '0'
  return ((num / den) * 100).toFixed(1)
}

function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Bom dia'
  if (hour < 18) return 'Boa tarde'
  return 'Boa noite'
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const [{ data: leads }, { data: interacoes }] = await Promise.all([
    supabase.from('leads').select('*').order('criado_em', { ascending: false }),
    supabase.from('interacoes').select('*').order('data', { ascending: false }),
  ])

  const allLeads = (leads ?? []) as Lead[]
  const allInteracoes = interacoes ?? []

  // ===== MÉTRICAS GERAIS =====
  const total = allLeads.length
  const responderam = allLeads.filter((l) => ['respondeu', 'demo-enviada', 'reuniao-marcada', 'fechado'].includes(l.status_funil)).length
  const fechados = allLeads.filter((l) => l.status_funil === 'fechado').length
  const ativos = allLeads.filter((l) => !['fechado', 'perdido'].includes(l.status_funil)).length

  // ===== LEADS TRABALHADOS (status != novo) =====
  const leadsTrabalhados = allLeads.filter((l) => l.status_funil !== 'novo')
  const leadsNovos = allLeads.filter((l) => l.status_funil === 'novo')

  // ===== FUNNEL DATA =====
  const funnelData = COLUNAS_FUNIL.map((col) => ({
    status: col.id as StatusFunil,
    count: allLeads.filter((l) => l.status_funil === col.id).length,
  }))

  // ===== FOLLOW-UP PENDENTES =====
  const followUpPendentes = allLeads.filter((l) => {
    if (l.status_funil !== 'demo-enviada') return false
    return diasDesdeContato(l.ultima_interacao_em) >= 5
  })

  // ===== LEADS SEM CONTATO (novos há +3 dias) =====
  const leadsSemContato = allLeads.filter((l) => {
    if (l.status_funil !== 'novo') return false
    return diasDesdeContato(l.criado_em) >= 3
  })

  // ===== AUTO-ADVANCE BADGE =====
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const avancadosHoje = allLeads.filter((l) => {
    if (!l.follow_up_em) return false
    const d = new Date(l.follow_up_em)
    d.setHours(0, 0, 0, 0)
    return d.getTime() === hoje.getTime()
  })

  // ===== ESTÉTICA AUTOMOTIVA (carro-chefe) =====
  const leadsEsteticaAuto = allLeads.filter((l) => l.segmento === 'oficina-estetica-automotiva')
  const eaTotal = leadsEsteticaAuto.length
  const eaTrabalhados = leadsEsteticaAuto.filter((l) => l.status_funil !== 'novo').length
  const eaResponderam = leadsEsteticaAuto.filter((l) => ['respondeu', 'demo-enviada', 'reuniao-marcada', 'fechado'].includes(l.status_funil)).length
  const eaFechados = leadsEsteticaAuto.filter((l) => l.status_funil === 'fechado').length
  const eaSemContato = leadsEsteticaAuto.filter((l) => l.status_funil === 'novo')

  // ===== TAXA POR SEGMENTO (ranking de conversão) =====
  const segmentos = [...new Set(allLeads.map((l) => l.segmento).filter(Boolean))] as Segmento[]
  const taxaPorSegmento = segmentos.map((seg) => {
    const total_seg = allLeads.filter((l) => l.segmento === seg).length
    const resp_seg = allLeads.filter((l) => l.segmento === seg && ['respondeu', 'demo-enviada', 'reuniao-marcada', 'fechado'].includes(l.status_funil)).length
    const trab_seg = allLeads.filter((l) => l.segmento === seg && l.status_funil !== 'novo').length
    return { segmento: seg, total: total_seg, responderam: resp_seg, trabalhados: trab_seg }
  }).sort((a, b) => {
    // Sort by response rate, then by total
    const rateA = a.total > 0 ? a.responderam / a.total : 0
    const rateB = b.total > 0 ? b.responderam / b.total : 0
    return rateB - rateA || b.total - a.total
  })

  // ===== TAXA POR CANAL =====
  const interacoesPessoal = allInteracoes.filter((i: Record<string, unknown>) => i.canal === 'whatsapp-pessoal').length
  const interacoesBusiness = allInteracoes.filter((i: Record<string, unknown>) => i.canal === 'whatsapp-business').length

  // ===== ATIVIDADE SEMANAL =====
  const semanas: { label: string; contatos: number }[] = []
  for (let i = 7; i >= 0; i--) {
    const inicio = new Date()
    inicio.setDate(inicio.getDate() - i * 7 - 6)
    inicio.setHours(0, 0, 0, 0)
    const fim = new Date()
    fim.setDate(fim.getDate() - i * 7)
    fim.setHours(23, 59, 59, 999)
    const contatos = allInteracoes.filter((int: Record<string, unknown>) => {
      const d = new Date(int.data as string)
      return d >= inicio && d <= fim
    }).length
    semanas.push({ label: `S${8 - i}`, contatos })
  }

  // ===== SUGESTÕES DE AÇÃO =====
  const sugestoes: { icon: React.ReactNode; text: string; action?: string; href?: string; urgency: 'high' | 'medium' | 'low' }[] = []

  if (leadsSemContato.length > 0) {
    sugestoes.push({
      icon: <Flame size={16} />,
      text: `${leadsSemContato.length} lead${leadsSemContato.length > 1 ? 's novos' : ' novo'} esperando contato há +3 dias`,
      href: '/leads?status_funil=novo',
      urgency: 'high',
    })
  }

  if (followUpPendentes.length > 0) {
    sugestoes.push({
      icon: <AlertTriangle size={16} />,
      text: `${followUpPendentes.length} lead${followUpPendentes.length > 1 ? 's' : ''} com demo enviada +5 dias sem resposta`,
      href: '/leads?status_funil=demo-enviada',
      urgency: 'high',
    })
  }

  if (eaSemContato.length > 0) {
    sugestoes.push({
      icon: <Car size={16} />,
      text: `${eaSemContato.length} lead${eaSemContato.length > 1 ? 's' : ''} de Estética Automotiva ainda sem contato`,
      href: '/leads?segmento=oficina-estetica-automotiva&status_funil=novo',
      urgency: 'medium',
    })
  }

  const contatados = allLeads.filter((l) => l.status_funil === 'contatado')
  const contatadosSemResposta = contatados.filter((l) => diasDesdeContato(l.ultima_interacao_em) >= 7)
  if (contatadosSemResposta.length > 0) {
    sugestoes.push({
      icon: <Clock size={16} />,
      text: `${contatadosSemResposta.length} contatado${contatadosSemResposta.length > 1 ? 's' : ''} há +7 dias sem resposta — envie follow-up`,
      href: '/leads?status_funil=contatado',
      urgency: 'medium',
    })
  }

  const urgencyColor = { high: '#dc2626', medium: '#d97706', low: '#3b82f6' }
  const urgencyBg = { high: 'rgba(220,38,38,0.08)', medium: 'rgba(217,119,6,0.08)', low: 'rgba(59,130,246,0.08)' }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700 }}>
          {greeting()}, Calebe 👋
        </h1>
        <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '14px' }}>
          Resumo da campanha de prospecção · Estética Automotiva é o foco 🚗
        </p>
      </div>

      {/* Auto-advance badge */}
      {avancadosHoje.length > 0 && (
        <div className="alert-card info" style={{ marginBottom: '20px' }}>
          <Zap size={16} />
          <div>
            <strong>{avancadosHoje.length} lead{avancadosHoje.length > 1 ? 's avançaram' : ' avançou'} automaticamente para Follow-up hoje</strong>
            <div style={{ fontSize: '12px', marginTop: '2px', opacity: 0.8 }}>
              {avancadosHoje.map((l) => l.nome).join(', ')}
            </div>
          </div>
        </div>
      )}

      {/* ===== SUGESTÕES DE AÇÃO ===== */}
      {sugestoes.length > 0 && (
        <div style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-primary)' }}>
            <Target size={15} />
            Ações Recomendadas
          </h3>
          {sugestoes.map((s, i) => (
            <Link key={i} href={s.href ?? '/leads'} style={{ textDecoration: 'none' }}>
              <div
                className="action-suggestion"
                style={{ background: urgencyBg[s.urgency], borderColor: urgencyColor[s.urgency] + '30' }}
              >
                <div style={{ color: urgencyColor[s.urgency] }}>{s.icon}</div>
                <span style={{ flex: 1, fontSize: '13px', color: 'var(--text-primary)' }}>{s.text}</span>
                <ArrowRight size={14} style={{ color: 'var(--text-muted)' }} />
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* ===== METRIC CARDS ===== */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div className="metric-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total de Leads</div>
              <div style={{ fontSize: '32px', fontWeight: 800, lineHeight: 1 }}>{total}</div>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={18} color="#3b82f6" />
            </div>
          </div>
          <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
            {ativos} ativos · {leadsTrabalhados.length} trabalhados
          </div>
        </div>

        <div className="metric-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Taxa de Resposta</div>
              <div style={{ fontSize: '32px', fontWeight: 800, lineHeight: 1 }}>
                {pct(responderam, total)}<span style={{ fontSize: '18px', color: 'var(--text-muted)' }}>%</span>
              </div>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(6, 182, 212, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={18} color="#0891b2" />
            </div>
          </div>
          <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
            {responderam} de {leadsTrabalhados.length} trabalhados responderam
          </div>
        </div>

        <div className="metric-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fechamentos</div>
              <div style={{ fontSize: '32px', fontWeight: 800, lineHeight: 1 }}>{fechados}</div>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={18} color="#059669" />
            </div>
          </div>
          <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
            taxa {pct(fechados, total)}% do total
          </div>
        </div>

        <div className="metric-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pendentes</div>
              <div style={{ fontSize: '32px', fontWeight: 800, lineHeight: 1, color: followUpPendentes.length > 0 ? '#d97706' : undefined }}>
                {followUpPendentes.length + leadsSemContato.length}
              </div>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={18} color="#d97706" />
            </div>
          </div>
          <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
            {followUpPendentes.length} follow-up · {leadsSemContato.length} sem contato
          </div>
        </div>
      </div>

      {/* ===== FUNNEL PROGRESS + ESTÉTICA AUTOMOTIVA ===== */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
        {/* Funnel Progress */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <FunnelProgressBar data={funnelData} total={total} />
        </div>

        {/* Estética Automotiva Highlight */}
        <div className="highlight-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Car size={18} style={{ color: '#0891b2' }} />
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Estética Automotiva
            </h3>
            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '999px', background: 'rgba(6,182,212,0.15)', color: '#0891b2', fontWeight: 600 }}>
              Carro-Chefe
            </span>
          </div>

          {eaTotal > 0 ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '12px' }}>
                {[
                  { label: 'Total', value: eaTotal },
                  { label: 'Trabalhados', value: eaTrabalhados },
                  { label: 'Responderam', value: eaResponderam },
                  { label: 'Fechados', value: eaFechados },
                ].map(({ label, value }) => (
                  <div key={label} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>{value}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{label}</div>
                  </div>
                ))}
              </div>
              {/* Mini progress bar */}
              <div style={{ marginTop: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  <span>Taxa de trabalho</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{pct(eaTrabalhados, eaTotal)}%</span>
                </div>
                <div className="funnel-bar">
                  <div className="funnel-bar-fill" style={{ width: `${pct(eaTrabalhados, eaTotal)}%`, background: 'linear-gradient(90deg, #06b6d4, #3b82f6)' }} />
                </div>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '13px' }}>
              <p style={{ margin: '0 0 8px' }}>Nenhum lead de Estética Automotiva ainda</p>
              <Link href="/importar" className="btn-primary" style={{ fontSize: '12px', padding: '6px 14px' }}>
                Importar contatos
              </Link>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
        {/* Follow-up pendentes lista */}
        {followUpPendentes.length > 0 && (
          <div className="glass-card" style={{ padding: '20px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={15} color="#d97706" />
              Follow-up pendentes
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {followUpPendentes.slice(0, 6).map((lead) => (
                <div key={lead.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'var(--bg-elevated)', borderRadius: '8px' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>{lead.nome}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {lead.segmento ? SEGMENTO_LABELS[lead.segmento as Segmento] : ''} · {diasDesdeContato(lead.ultima_interacao_em)}d sem resposta
                    </div>
                  </div>
                  <a href={whatsappLink(lead.telefone)} target="_blank" rel="noopener noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', padding: '4px 10px', borderRadius: '6px', background: 'rgba(37,211,102,0.12)', border: '1px solid rgba(37,211,102,0.25)', color: '#25d366', textDecoration: 'none' }}>
                    <MessageCircle size={10} />
                    Contatar
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ranking de Conversão por Segmento */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 600 }}>
            🏆 Ranking de Conversão por Segmento
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {taxaPorSegmento.slice(0, 8).map(({ segmento, total: t, responderam: r, trabalhados: tr }, idx) => (
              <div key={segmento} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ width: '20px', fontSize: '14px', textAlign: 'center' }}>
                  {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`}
                </span>
                <span style={{ flex: 1, color: 'var(--text-secondary)' }}>{SEGMENTO_LABELS[segmento]}</span>
                <span>
                  <span style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>{pct(r, t)}%</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '11px', marginLeft: '4px' }}>({r}/{t})</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ===== TAXA POR CANAL + DISTRIBUIÇÃO ===== */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
        {/* Taxa por canal */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 600 }}>
            Taxa por Canal
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { label: 'WhatsApp Pessoal', count: interacoesPessoal, cor: '#25d366' },
              { label: 'WhatsApp Business', count: interacoesBusiness, cor: '#128c7e' },
            ].map(({ label, count, cor }) => {
              const total_int = interacoesPessoal + interacoesBusiness || 1
              return (
                <div key={label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '13px' }}>
                    <span>{label}</span>
                    <span style={{ color: 'var(--text-muted)' }}>{count} ({pct(count, total_int)}%)</span>
                  </div>
                  <div className="funnel-bar">
                    <div className="funnel-bar-fill" style={{ width: `${pct(count, total_int)}%`, background: cor }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Funil clicável */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 600 }}>Distribuição no Funil</h3>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {COLUNAS_FUNIL.map((col) => {
              const count = allLeads.filter((l) => l.status_funil === col.id).length
              return (
                <Link key={col.id} href={`/leads?status_funil=${col.id}`}
                  style={{ flex: '1 1 100px', textAlign: 'center', padding: '14px 8px', background: 'var(--bg-elevated)', borderRadius: '10px', textDecoration: 'none', transition: 'transform 0.2s, box-shadow 0.2s', border: '1px solid var(--border)' }}
                >
                  <div style={{ fontSize: '22px', fontWeight: 800, marginBottom: '4px' }}>{count}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{col.label}</div>
                </Link>
              )
            })}
          </div>
        </div>
      </div>

      {/* Activity chart */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 600 }}>Atividade Semanal</h3>
        <ActivityChart data={semanas} />
      </div>
    </div>
  )
}
