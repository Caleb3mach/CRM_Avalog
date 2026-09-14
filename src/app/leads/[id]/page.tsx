import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MessageCircle, Phone, Star, ExternalLink } from 'lucide-react'
import { type Lead, type Interacao, COLUNAS_FUNIL, SEGMENTO_LABELS, SEGMENTO_CORES, type Segmento } from '@/lib/types'
import { formatarTelefone, formatarDistancia, whatsappLink } from '@/lib/utils'
import LeadDetailClient from '@/components/LeadDetailClient'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

export default async function LeadDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: lead }, { data: interacoes }] = await Promise.all([
    supabase.from('leads').select('*').eq('id', id).single(),
    supabase.from('interacoes').select('*').eq('lead_id', id).order('data', { ascending: false }),
  ])

  if (!lead) notFound()

  const seg = lead.segmento as Segmento | null
  const segCor = seg ? SEGMENTO_CORES[seg] : 'seg-outro'

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      {/* Back */}
      <Link href="/leads" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', textDecoration: 'none', fontSize: '13px', marginBottom: '20px' }}>
        <ArrowLeft size={14} />
        Voltar para leads
      </Link>

      {/* Header card */}
      <div className="glass-card" style={{ padding: '24px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '8px' }}>
              <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800 }}>{lead.nome}</h1>
              {seg && <span className={`badge ${segCor}`}>{SEGMENTO_LABELS[seg]}</span>}
            </div>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '14px', color: 'var(--text-secondary)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Phone size={13} />
                {formatarTelefone(lead.telefone)}
              </span>
              {lead.bairro && <span>📍 {lead.bairro}, {lead.cidade}</span>}
              {lead.nota_google && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#eab308' }}>
                  <Star size={13} />
                  {lead.nota_google} ({lead.avaliacoes_google} avaliações)
                </span>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <a href={whatsappLink(lead.telefone)} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ fontSize: '13px' }}>
              <MessageCircle size={14} />
              WhatsApp
            </a>
            {lead.instagram_url && (
              <a href={lead.instagram_url} target="_blank" rel="noopener noreferrer" className="btn-ghost" style={{ fontSize: '13px' }}>
                <ExternalLink size={14} />
                Instagram
              </a>
            )}
          </div>
        </div>

        {/* Info grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
          {[
            { label: 'Status Funil', value: COLUNAS_FUNIL.find((c) => c.id === lead.status_funil)?.label ?? lead.status_funil },
            { label: 'Status Site', value: lead.status_site === 'sem-site' ? '🚫 Sem site' : lead.status_site === 'linktree' ? '🌳 Linktree' : lead.status_site === 'site-quebrado' ? '⚠️ Quebrado' : '✅ Ok' },
            { label: 'Instagram', value: lead.instagram_ativo === 'sim' ? '✅ Ativo' : lead.instagram_ativo === 'nao' ? '❌ Inativo' : '❓ Não verificado' },
            { label: 'Cadastrado', value: formatarDistancia(lead.criado_em) },
            { label: 'Último contato', value: lead.ultima_interacao_em ? formatarDistancia(lead.ultima_interacao_em) : 'Nunca' },
          ].map(({ label, value }) => (
            <div key={label}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
              <div style={{ fontSize: '14px', fontWeight: 500 }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Client part: interactions + forms */}
      <LeadDetailClient lead={lead as Lead} initialInteracoes={(interacoes ?? []) as Interacao[]} />
    </div>
  )
}
