import { createClient } from '@/lib/supabase/server'
import { type Lead, SEGMENTO_LABELS, SEGMENTO_CORES, type Segmento, type StatusFunil } from '@/lib/types'
import { formatarTelefone, whatsappLink, diasDesdeContato, corDiasContato } from '@/lib/utils'
import { Suspense } from 'react'
import LeadFilters from '@/components/LeadFilters'
import Link from 'next/link'
import { MessageCircle, Star, ExternalLink } from 'lucide-react'
import AddLeadModal from '@/components/AddLeadModal'
import LeadsTable from '@/components/LeadsTable'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ [key: string]: string | undefined }>
}

const STATUS_CLASS: Record<string, string> = {
  novo: 'status-novo',
  contatado: 'status-contatado',
  respondeu: 'status-respondeu',
  'demo-enviada': 'status-demo-enviada',
  'follow-up': 'status-follow-up',
  'reuniao-marcada': 'status-reuniao-marcada',
  fechado: 'status-fechado',
  perdido: 'status-perdido',
}

const STATUS_LABELS: Record<string, string> = {
  novo: 'Novo',
  contatado: 'Contatado',
  respondeu: 'Respondeu',
  'demo-enviada': 'Demo Enviada',
  'follow-up': 'Follow-up',
  'reuniao-marcada': 'Reunião',
  fechado: 'Fechado',
  perdido: 'Perdido',
}

export default async function LeadsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const supabase = await createClient()

  let query = supabase.from('leads').select('*').order('criado_em', { ascending: false })

  if (params.segmento && params.segmento !== 'todos') query = query.eq('segmento', params.segmento)
  if (params.status_funil && params.status_funil !== 'todos') query = query.eq('status_funil', params.status_funil)
  if (params.status_site && params.status_site !== 'todos') query = query.eq('status_site', params.status_site)
  if (params.instagram_ativo && params.instagram_ativo !== 'todos') query = query.eq('instagram_ativo', params.instagram_ativo)
  if (params.avaliacoes_min) query = query.gte('avaliacoes_google', parseInt(params.avaliacoes_min))
  if (params.nota_min) query = query.gte('nota_google', parseFloat(params.nota_min))
  if (params.q) {
    query = query.or(`nome.ilike.%${params.q}%,bairro.ilike.%${params.q}%`)
  }

  const { data: leads, error } = await query

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>Leads</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '13px' }}>
            {leads?.length ?? 0} resultado{leads?.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link href="/importar" className="btn-ghost" style={{ fontSize: '13px' }}>
            Importar CSV
          </Link>
          <AddLeadModal />
        </div>
      </div>

      <Suspense>
        <LeadFilters />
      </Suspense>

      {error ? (
        <div style={{ padding: '24px', color: '#dc2626' }}>Erro: {error.message}</div>
      ) : (
        <LeadsTable leads={leads ?? []} />
      )}
    </div>
  )
}
