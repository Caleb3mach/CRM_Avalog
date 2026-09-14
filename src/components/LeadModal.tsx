'use client'

import { useState, useEffect } from 'react'
import { X, MessageCircle, Phone, Clock, CheckCircle2, Trash2, ExternalLink, Star } from 'lucide-react'
import { type Lead, type StatusFunil, type Canal, COLUNAS_FUNIL, SEGMENTO_LABELS, SEGMENTO_CORES } from '@/lib/types'
import { formatarDistancia, formatarTelefone, whatsappLink, canalLabel } from '@/lib/utils'

interface LeadModalProps {
  lead: Lead
  onClose: () => void
  onUpdate: (lead: Lead) => void
  onDelete: (id: string) => void
}

interface Interacao {
  id: string
  data: string
  canal: string | null
  script_usado: string | null
  notas: string | null
  status_resultante: string | null
}

export default function LeadModal({ lead, onClose, onUpdate, onDelete }: LeadModalProps) {
  const [interacoes, setInteracoes] = useState<Interacao[]>([])
  const [loading, setLoading] = useState(true)
  const [novoStatus, setNovoStatus] = useState<StatusFunil>(lead.status_funil)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  // Form nova interação
  const [canal, setCanal] = useState<Canal>('whatsapp-pessoal')
  const [scriptUsado, setScriptUsado] = useState('')
  const [notas, setNotas] = useState('')
  const [statusResultante, setStatusResultante] = useState<StatusFunil | ''>(lead.status_funil)
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    fetchInteracoes()
  }, [lead.id])

  async function fetchInteracoes() {
    setLoading(true)
    const res = await fetch(`/api/interacoes?lead_id=${lead.id}`)
    const data = await res.json()
    setInteracoes(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  async function handleMarcarContatado() {
    setSaving(true)
    const res = await fetch(`/api/leads/${lead.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status_funil: 'contatado' }),
    })
    if (res.ok) {
      const updated = await res.json()
      onUpdate(updated)
      showToast('✅ Marcado como contatado!')
      // Registrar interação automática
      await fetch('/api/interacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_id: lead.id,
          canal: 'whatsapp-pessoal',
          notas: 'Marcado como contatado via botão rápido',
          status_resultante: 'contatado',
        }),
      })
      fetchInteracoes()
    }
    setSaving(false)
  }

  async function handleChangeStatus() {
    if (novoStatus === lead.status_funil) return
    setSaving(true)
    const res = await fetch(`/api/leads/${lead.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status_funil: novoStatus }),
    })
    if (res.ok) {
      const updated = await res.json()
      onUpdate(updated)
      showToast('✅ Status atualizado!')
    }
    setSaving(false)
  }

  async function handleRegistrarInteracao(e: React.FormEvent) {
    e.preventDefault()
    if (!notas.trim() && !scriptUsado.trim()) return
    setEnviando(true)

    const body: Record<string, string> = {
      lead_id: lead.id,
      canal,
      script_usado: scriptUsado,
      notas,
    }
    if (statusResultante) body.status_resultante = statusResultante

    const res = await fetch('/api/interacoes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (res.ok) {
      setNotas('')
      setScriptUsado('')
      showToast('✅ Interação registrada!')
      fetchInteracoes()
      if (statusResultante) {
        const updatedLead = { ...lead, status_funil: statusResultante as StatusFunil }
        onUpdate(updatedLead)
      }
    }
    setEnviando(false)
  }

  async function handleDelete() {
    if (!confirm(`Excluir lead "${lead.nome}"? Esta ação não pode ser desfeita.`)) return
    const res = await fetch(`/api/leads/${lead.id}`, { method: 'DELETE' })
    if (res.ok) onDelete(lead.id)
  }

  const segCor = lead.segmento ? SEGMENTO_CORES[lead.segmento] : 'seg-outro'

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>{lead.nome}</h2>
              {lead.segmento && (
                <span className={`badge ${segCor}`}>{SEGMENTO_LABELS[lead.segmento]}</span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              {lead.nota_google && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#eab308' }}>
                  <Star size={12} />
                  {lead.nota_google} ({lead.avaliacoes_google} avaliações)
                </span>
              )}
              {lead.bairro && (
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>📍 {lead.bairro}</span>
              )}
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                <Clock size={12} style={{ display: 'inline', marginRight: '4px' }} />
                {lead.ultima_interacao_em ? formatarDistancia(lead.ultima_interacao_em) : 'Nunca contactado'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Quick actions */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <a href={whatsappLink(lead.telefone)} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ fontSize: '13px', padding: '7px 14px' }}>
              <MessageCircle size={14} />
              WhatsApp
            </a>
            {lead.status_funil !== 'contatado' && (
              <button onClick={handleMarcarContatado} disabled={saving} className="btn-ghost" style={{ fontSize: '13px', padding: '7px 14px' }}>
                <CheckCircle2 size={14} />
                Marcar como contatado hoje
              </button>
            )}
            {lead.instagram_url && (
              <a href={lead.instagram_url} target="_blank" rel="noopener noreferrer" className="btn-ghost" style={{ fontSize: '13px', padding: '7px 14px' }}>
                <ExternalLink size={14} />
                Instagram
              </a>
            )}
          </div>

          {/* Status */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <select
              value={novoStatus}
              onChange={(e) => setNovoStatus(e.target.value as StatusFunil)}
              className="input-base"
              style={{ maxWidth: '220px' }}
            >
              {COLUNAS_FUNIL.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
            {novoStatus !== lead.status_funil && (
              <button onClick={handleChangeStatus} disabled={saving} className="btn-primary" style={{ fontSize: '13px', padding: '7px 14px' }}>
                Salvar status
              </button>
            )}
          </div>

          {/* Dados do lead */}
          <div style={{ background: 'var(--bg-elevated)', borderRadius: '10px', padding: '14px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>TELEFONE</div>
              <div style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Phone size={12} style={{ color: 'var(--text-muted)' }} />
                {formatarTelefone(lead.telefone)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>STATUS SITE</div>
              <div style={{ fontSize: '14px' }}>
                {lead.status_site === 'sem-site' ? '🚫 Sem site' :
                 lead.status_site === 'linktree' ? '🌳 Linktree' :
                 lead.status_site === 'site-quebrado' ? '⚠️ Site quebrado' : '✅ Site ok'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>INSTAGRAM</div>
              <div style={{ fontSize: '14px' }}>
                {lead.instagram_ativo === 'sim' ? '✅ Ativo' :
                 lead.instagram_ativo === 'nao' ? '❌ Inativo' : '❓ Não verificado'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>CADASTRADO</div>
              <div style={{ fontSize: '14px' }}>{formatarDistancia(lead.criado_em)}</div>
            </div>
          </div>

          {/* Registrar nova interação */}
          <div>
            <h3 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Registrar interação
            </h3>
            <form onSubmit={handleRegistrarInteracao} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <select value={canal} onChange={(e) => setCanal(e.target.value as Canal)} className="input-base">
                  <option value="whatsapp-pessoal">WhatsApp Pessoal</option>
                  <option value="whatsapp-business">WhatsApp Business</option>
                  <option value="outro">Outro</option>
                </select>
                <input
                  type="text"
                  placeholder="Script usado (ex: 1A, follow-up)"
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
                <select
                  value={statusResultante}
                  onChange={(e) => setStatusResultante(e.target.value as StatusFunil | '')}
                  className="input-base"
                  style={{ maxWidth: '180px' }}
                >
                  <option value="">Não mudar status</option>
                  {COLUNAS_FUNIL.map((c) => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
                <button type="submit" disabled={enviando} className="btn-primary" style={{ fontSize: '13px', padding: '7px 16px' }}>
                  {enviando ? 'Salvando...' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>

          {/* Timeline de interações */}
          <div>
            <h3 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Histórico ({interacoes.length})
            </h3>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
                <div className="spinner" />
              </div>
            ) : interacoes.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Nenhuma interação registrada ainda.</p>
            ) : (
              <div>
                {interacoes.map((int) => (
                  <div key={int.id} className="timeline-item">
                    <div className="timeline-dot" />
                    <div style={{ background: 'var(--bg-elevated)', borderRadius: '8px', padding: '10px 12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {int.canal ? canalLabel(int.canal) : 'Interação'}
                          {int.script_usado && (
                            <span style={{ marginLeft: '8px', padding: '1px 6px', background: 'rgba(139, 92, 246, 0.2)', borderRadius: '4px', color: '#a78bfa', fontSize: '11px' }}>
                              {int.script_usado}
                            </span>
                          )}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {formatarDistancia(int.data)}
                        </span>
                      </div>
                      {int.notas && (
                        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>{int.notas}</p>
                      )}
                      {int.status_resultante && (
                        <div style={{ marginTop: '4px', fontSize: '11px', color: 'var(--accent-blue)' }}>
                          → {int.status_resultante}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Delete */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={handleDelete} className="btn-danger">
              <Trash2 size={14} />
              Excluir lead
            </button>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="toast-container">
          <div className="toast success">{toast}</div>
        </div>
      )}
    </div>
  )
}
