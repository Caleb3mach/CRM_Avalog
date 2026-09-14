'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Send } from 'lucide-react'
import type { Lead, Script, StatusFunil } from '@/lib/types'

export default function NovaCampanhaPage() {
  const router = useRouter()
  const [nome, setNome] = useState('')
  const [scriptId, setScriptId] = useState('')
  const [scriptPitchId, setScriptPitchId] = useState('')
  const [scripts, setScripts] = useState<Script[]>([])
  
  // Leads state
  const [leads, setLeads] = useState<Lead[]>([])
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set())
  const [filtroStatus, setFiltroStatus] = useState<StatusFunil | 'todos'>('novo')
  const [busca, setBusca] = useState('')
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([fetchScripts(), fetchLeads()])
      .finally(() => setLoading(false))
  }, [])

  async function fetchScripts() {
    const res = await fetch('/api/scripts')
    if (res.ok) {
      setScripts(await res.json())
    }
  }

  async function fetchLeads() {
    // Busca todos os leads simplificados para seleção
    const res = await fetch('/api/leads')
    if (res.ok) {
      const data = await res.json()
      setLeads(data)
    }
  }

  const leadsFiltrados = leads.filter(l => {
    const matchStatus = filtroStatus === 'todos' || l.status_funil === filtroStatus;
    const searchLower = busca.toLowerCase();
    const matchBusca = !busca || 
      l.nome?.toLowerCase().includes(searchLower) ||
      l.segmento?.toLowerCase().includes(searchLower) ||
      l.cidade?.toLowerCase().includes(searchLower) ||
      l.telefone?.includes(busca);
    return matchStatus && matchBusca;
  })

  function toggleSelectAll() {
    if (selectedLeads.size === leadsFiltrados.length && leadsFiltrados.length > 0) {
      setSelectedLeads(new Set())
    } else {
      const newSet = new Set<string>()
      leadsFiltrados.forEach(l => newSet.add(l.id))
      setSelectedLeads(newSet)
    }
  }

  function toggleLead(id: string) {
    const newSet = new Set(selectedLeads)
    if (newSet.has(id)) newSet.delete(id)
    else newSet.add(id)
    setSelectedLeads(newSet)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nome || !scriptId || !scriptPitchId || selectedLeads.size === 0) return

    setSaving(true)
    try {
      const res = await fetch('/api/campanhas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome,
          script_id: scriptId,
          script_pitch_id: scriptPitchId,
          lead_ids: Array.from(selectedLeads)
        })
      })

      if (res.ok) {
        router.push('/campanhas')
      } else {
        const err = await res.json()
        alert('Erro: ' + err.error)
        setSaving(false)
      }
    } catch (err) {
      console.error(err)
      alert('Erro ao criar campanha')
      setSaving(false)
    }
  }

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <Link href="/campanhas" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', textDecoration: 'none', fontSize: '13px', marginBottom: '16px' }}>
          <ArrowLeft size={14} /> Voltar
        </Link>
        <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>Nova Campanha</h1>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Nome da Campanha</label>
            <input 
              required
              className="input-base"
              placeholder="Ex: Disparo Frio - Estética SP"
              value={nome}
              onChange={e => setNome(e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Script 1 (Conexão inicial)</label>
            <select 
              required
              className="input-base"
              value={scriptId}
              onChange={e => setScriptId(e.target.value)}
            >
              <option value="">-- Selecione o script de Oi/Conexão --</option>
              {scripts.map(s => (
                <option key={s.id} value={s.id}>{s.nome} ({s.categoria})</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Script 2 (Pitch após resposta)</label>
            <select 
              required
              className="input-base"
              value={scriptPitchId}
              onChange={e => setScriptPitchId(e.target.value)}
            >
              <option value="">-- Selecione o script de Pitch --</option>
              {scripts.map(s => (
                <option key={s.id} value={s.id}>{s.nome} ({s.categoria})</option>
              ))}
            </select>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '16px', flexWrap: 'wrap' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600 }}>
              Leads Selecionados: <span style={{ color: 'var(--accent-blue)' }}>{selectedLeads.size}</span>
            </label>
            
            <div style={{ display: 'flex', gap: '12px', flex: 1, justifyContent: 'flex-end' }}>
              <input 
                type="text"
                placeholder="Buscar por nome, segmento ou cidade..."
                className="input-base"
                style={{ maxWidth: '300px', fontSize: '13px' }}
                value={busca}
                onChange={e => setBusca(e.target.value)}
              />

              <select 
                className="input-base" 
                style={{ width: 'auto', padding: '4px 8px', fontSize: '13px' }}
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value as any)}
              >
                <option value="todos">Todos os status</option>
                <option value="novo">Apenas Novos</option>
                <option value="follow-up">Apenas Follow-up</option>
              </select>
            </div>
          </div>

          <div style={{ border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{ background: 'var(--bg-elevated)', padding: '10px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <input 
                type="checkbox" 
                checked={selectedLeads.size === leadsFiltrados.length && leadsFiltrados.length > 0}
                onChange={toggleSelectAll}
                style={{ cursor: 'pointer' }}
              />
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Selecionar todos os {leadsFiltrados.length} desta vista</span>
            </div>
            
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {loading ? (
                <div style={{ padding: '20px', textAlign: 'center' }}><div className="spinner" style={{ display: 'inline-block' }}/></div>
              ) : leadsFiltrados.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>Nenhum lead encontrado com esse filtro.</div>
              ) : (
                leadsFiltrados.map(lead => (
                  <label key={lead.id} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px', 
                    padding: '10px 16px', 
                    borderBottom: '1px solid var(--border)',
                    cursor: 'pointer',
                    background: selectedLeads.has(lead.id) ? 'rgba(59, 130, 246, 0.05)' : 'transparent'
                  }}>
                    <input 
                      type="checkbox"
                      checked={selectedLeads.has(lead.id)}
                      onChange={() => toggleLead(lead.id)}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '14px', fontWeight: 500 }}>{lead.nome}</span>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {lead.telefone} • {lead.segmento || 'Sem segmento'} {lead.cidade ? `• ${lead.cidade}` : ''}
                      </span>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button 
            type="submit" 
            disabled={saving || selectedLeads.size === 0 || !scriptId || !scriptPitchId || !nome}
            className="btn-primary" 
            style={{ padding: '10px 24px', opacity: (saving || selectedLeads.size === 0 || !scriptId || !scriptPitchId || !nome) ? 0.5 : 1 }}
          >
            {saving ? 'Enviando para a fila...' : (
              <>
                <Send size={16} /> Iniciar Disparo ({selectedLeads.size})
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
