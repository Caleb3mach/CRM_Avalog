import { createClient } from '@/lib/supabase/server'
import KanbanBoard from '@/components/KanbanBoard'
import { type Lead } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function KanbanPage() {
  const supabase = await createClient()
  const { data: leads, error } = await supabase
    .from('leads')
    .select('*')
    .order('criado_em', { ascending: false })

  if (error) {
    return (
      <div style={{ padding: '24px', color: '#dc2626' }}>
        Erro ao carregar leads: {error.message}
      </div>
    )
  }

  return (
    <div style={{ padding: '20px 20px 0' }}>
      <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>
            Pipeline de Prospecção
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
            {leads?.length ?? 0} leads · Filtre e arraste para mover entre etapas
          </p>
        </div>
      </div>
      <KanbanBoard initialLeads={(leads ?? []) as Lead[]} />
    </div>
  )
}
