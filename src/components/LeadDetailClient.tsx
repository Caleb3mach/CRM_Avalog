'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Trash2 } from 'lucide-react'
import { type Lead, type Interacao, type Canal, type StatusFunil, COLUNAS_FUNIL } from '@/lib/types'
import { formatarDistancia, canalLabel } from '@/lib/utils'

interface Props {
  lead: Lead
  initialInteracoes: Interacao[]
}

export default function LeadDetailClient({ lead, initialInteracoes }: Props) {
  const router = useRouter()
  const [interacoes, setInteracoes] = useState<Interacao[]>(initialInteracoes)
  const [canal, setCanal] = useState<Canal>('whatsapp-pessoal')
  const [scriptUsado, setScriptUsado] = useState('')
  const [notas, setNotas] = useState('')
  const [statusResultante, setStatusResultante] = useState<StatusFunil | ''>(lead.status_funil)
  const [enviando, setEnviando] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  async function handleMarcarContatado() {
    const res = await fetch(`/api/leads/${lead.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status_funil: 'contatado' }),
    })
    if (res.ok) {
      await fetch('/api/interacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_id: lead.id, canal: 'whatsapp-pessoal', notas: 'Marcado como contatado via botão rápido', status_resultante: 'contatado' }),
      })
      showToast('✅ Marcado como contatado!')
      router.refresh()
    }
  }

  async function handleRegistrar(e: React.FormEvent) {
    e.preventDefault()
    if (!notas.trim() && !scriptUsado.trim()) return
    setEnviando(true)

    const body: Record<string, string> = { lead_id: lead.id, canal, script_usado: scriptUsado, notas }
    if (statusResultante) body.status_resultante = statusResultante

    const res = await fetch('/api/interacoes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (res.ok) {
      const interacao = await res.json()
      setInteracoes((prev) => [interacao, ...prev])
      setNotas('')
      setScriptUsado('')
      showToast('✅ Interação registrada!')
      if (statusResultante) router.refresh()
    }
    setEnviando(false)
  }

  async function handleDelete() {
    if (!confirm(`Excluir lead "${lead.nome}"?`)) return
    const res = await fetch(`/api/leads/${lead.id}`, { method: 'DELETE' })
    if (res.ok) router.push('/leads')
  }

  return (
    <>
      {/* Quick action */}
      {lead.status_funil !== 'contatado' && (
        <button onClick={handleMarcarContatado} className="btn-ghost" style={{ marginBottom: '20px', fontSize: '13px' }}>
          <CheckCircle2 size={14} />
          Marcar como contatado hoje
        </button>
      )}

      {/* Registrar interação */}
      <div className="glass-card" style={{ padding: '20px', marginBottom: '20px' }}>
        <h2 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 600 }}>Registrar interação</h2>
        <form onSubmit={handleRegistrar} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <select value={canal} onChange={(e) => setCanal(e.target.value as Canal)} className="input-base">
              <option value="whatsapp-pessoal">WhatsApp Pessoal</option>
              <option value="whatsapp-business">WhatsApp Business</option>
              <option value="outro">Outro</option>
            </select>
            <input
              type="text"
              placeholder="Script (ex: 1A, 1B, follow-up)"
              value={scriptUsado}
              onChange={(e) => setScriptUsado(e.target.value)}
              className="input-base"
            />
          </div>
          <textarea
            placeholder="Notas sobre a interação..."
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            rows={3}
            className="input-base"
            style={{ resize: 'vertical' }}
          />
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <select value={statusResultante} onChange={(e) => setStatusResultante(e.target.value as StatusFunil | '')} className="input-base" style={{ maxWidth: '200px' }}>
              <option value="">Não mudar status</option>
              {COLUNAS_FUNIL.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
            <button type="submit" disabled={enviando} className="btn-primary">
              {enviando ? 'Salvando...' : 'Registrar'}
            </button>
          </div>
        </form>
      </div>

      {/* Timeline */}
      <div className="glass-card" style={{ padding: '20px', marginBottom: '20px' }}>
        <h2 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 600 }}>
          Histórico de interações ({interacoes.length})
        </h2>
        {interacoes.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Nenhuma interação registrada.</p>
        ) : (
          <div>
            {interacoes.map((int) => (
              <div key={int.id} className="timeline-item">
                <div className="timeline-dot" />
                <div style={{ background: 'var(--bg-elevated)', borderRadius: '8px', padding: '12px 14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600 }}>{int.canal ? canalLabel(int.canal) : 'Interação'}</span>
                      {int.script_usado && (
                        <span style={{ padding: '1px 8px', background: 'rgba(139,92,246,0.2)', borderRadius: '4px', color: '#a78bfa', fontSize: '11px', fontWeight: 600 }}>
                          {int.script_usado}
                        </span>
                      )}
                      {int.status_resultante && (
                        <span style={{ padding: '1px 8px', background: 'rgba(59,130,246,0.15)', borderRadius: '4px', color: 'var(--accent-blue)', fontSize: '11px' }}>
                          → {int.status_resultante}
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {formatarDistancia(int.data)}
                    </span>
                  </div>
                  {int.notas && (
                    <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{int.notas}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={handleDelete} className="btn-danger">
          <Trash2 size={14} />
          Excluir lead
        </button>
      </div>

      {toast && (
        <div className="toast-container">
          <div className="toast success">{toast}</div>
        </div>
      )}
    </>
  )
}
