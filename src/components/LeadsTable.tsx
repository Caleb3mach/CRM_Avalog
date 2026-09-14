'use client'

import { useState } from 'react'
import type { Lead, Segmento } from '@/lib/types'
import { SEGMENTO_LABELS, SEGMENTO_CORES } from '@/lib/types'
import { formatarTelefone, whatsappLink, diasDesdeContato, corDiasContato } from '@/lib/utils'
import Link from 'next/link'
import { MessageCircle, Star, ExternalLink, ThumbsDown } from 'lucide-react'
import LoteEditSegmento from '@/components/LoteEditSegmento'
import { useEffect } from 'react'

const STATUS_CLASS: Record<string, string> = {
  novo: 'status-novo',
  contatado: 'status-contatado',
  respondeu: 'status-respondeu',
  'respondeu_conexao': 'status-respondeu',
  'pitch_enviado': 'status-demo-enviada',
  'demo-enviada': 'status-demo-enviada',
  'follow-up': 'status-follow-up',
  'reuniao-marcada': 'status-reuniao-marcada',
  fechado: 'status-fechado',
  rejeitou: 'status-perdido',
  perdido: 'status-perdido',
}

const STATUS_LABELS: Record<string, string> = {
  novo: 'Novo',
  contatado: 'Contatado',
  'respondeu_conexao': 'Resp. Conexão',
  'pitch_enviado': 'Pitch Enviado',
  respondeu: 'Respondeu',
  'demo-enviada': 'Demo Enviada',
  'follow-up': 'Follow-up',
  'reuniao-marcada': 'Reunião',
  fechado: 'Fechado',
  rejeitou: 'Rejeitou',
  perdido: 'Perdido',
}

export default function LeadsTable({ leads }: { leads: Lead[] }) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  function toggleSelectAll() {
    if (selectedIds.size === leads.length && leads.length > 0) {
      setSelectedIds(new Set())
    } else {
      const newSet = new Set<string>()
      leads.forEach(l => newSet.add(l.id))
      setSelectedIds(newSet)
    }
  }

  function toggleRow(id: string) {
    const newSet = new Set(selectedIds)
    if (newSet.has(id)) newSet.delete(id)
    else newSet.add(id)
    setSelectedIds(newSet)
  }

  const [localLeads, setLocalLeads] = useState<Lead[]>(leads)
  const [loadingLeadId, setLoadingLeadId] = useState<string | null>(null)

  useEffect(() => {
    setLocalLeads(leads)
  }, [leads])

  async function toggleTag(e: React.MouseEvent, leadId: string, tagToToggle: string) {
    e.stopPropagation()
    e.preventDefault()
    if (loadingLeadId) return

    setLoadingLeadId(leadId)
    try {
      const lead = localLeads.find(l => l.id === leadId)
      if (!lead) return

      let currentTags = lead.tags || []
      
      if (tagToToggle === 'favorito') {
        if (currentTags.includes('favorito')) {
          currentTags = currentTags.filter(t => t !== 'favorito')
        } else {
          currentTags = currentTags.filter(t => t !== 'ruim')
          currentTags.push('favorito')
        }
      } else if (tagToToggle === 'ruim') {
        if (currentTags.includes('ruim')) {
          currentTags = currentTags.filter(t => t !== 'ruim')
        } else {
          currentTags = currentTags.filter(t => t !== 'favorito')
          currentTags.push('ruim')
        }
      }

      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags: currentTags })
      })

      if (res.ok) {
        const updatedLead = await res.json()
        setLocalLeads(prev => prev.map(l => l.id === leadId ? updatedLead : l))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingLeadId(null)
    }
  }

  return (
    <>
      <div className="glass-card" style={{ marginTop: '16px', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="table-base">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>
                  <input 
                    type="checkbox" 
                    checked={selectedIds.size === leads.length && leads.length > 0}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th>Nome</th>
                <th>Segmento</th>
                <th>Bairro</th>
                <th>Avaliações</th>
                <th>Site</th>
                <th>Etapa</th>
                <th>Último contato</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {localLeads.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    Nenhum lead encontrado
                  </td>
                </tr>
              ) : (
                [...localLeads].sort((a, b) => {
                  const aFav = a.tags?.includes('favorito') ? 1 : 0;
                  const bFav = b.tags?.includes('favorito') ? 1 : 0;
                  const aRuim = a.tags?.includes('ruim') ? 1 : 0;
                  const bRuim = b.tags?.includes('ruim') ? 1 : 0;

                  if (aFav !== bFav) return bFav - aFav;
                  if (aRuim !== bRuim) return aRuim - bRuim;
                  return 0;
                }).map((lead: Lead) => {
                  const dias = diasDesdeContato(lead.ultima_interacao_em)
                  const isSelected = selectedIds.has(lead.id)
                  const isFavorito = lead.tags?.includes('favorito')
                  const isRuim = lead.tags?.includes('ruim')
                  const isLoading = loadingLeadId === lead.id
                  
                  return (
                    <tr key={lead.id} style={{ cursor: 'pointer', background: isSelected ? 'rgba(59, 130, 246, 0.05)' : 'transparent' }}>
                      <td>
                        <input 
                          type="checkbox" 
                          checked={isSelected}
                          onChange={() => toggleRow(lead.id)}
                        />
                      </td>
                      <td>
                        <Link href={`/leads/${lead.id}`} style={{ textDecoration: 'none', color: 'var(--text-primary)', fontWeight: 600, fontSize: '14px' }}>
                          {lead.nome}
                        </Link>
                      </td>
                      <td>
                        {lead.segmento && (
                          <span className={`badge ${SEGMENTO_CORES[lead.segmento as Segmento]}`}>
                            {SEGMENTO_LABELS[lead.segmento as Segmento]}
                          </span>
                        )}
                      </td>
                      <td style={{ fontSize: '13px' }}>{lead.bairro ?? '—'}</td>
                      <td>
                        {lead.nota_google ? (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#eab308' }}>
                            <Star size={12} />
                            {lead.nota_google}
                            <span style={{ color: 'var(--text-muted)' }}>({lead.avaliacoes_google})</span>
                          </span>
                        ) : '—'}
                      </td>
                      <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>
                            {lead.status_site === 'sem-site' ? '🚫 Sem site' :
                             lead.status_site === 'linktree' ? '🌳 Linktree' :
                             lead.status_site === 'site-quebrado' ? '⚠️ Quebrado' : '✅ Ok'}
                          </span>
                          {lead.website && (
                            <a
                              href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              style={{ color: 'var(--text-secondary)' }}
                            >
                              <ExternalLink size={12} />
                            </a>
                          )}
                        </div>
                      </td>
                      <td>
                        <span
                          className={STATUS_CLASS[lead.status_funil] ?? 'status-novo'}
                          style={{
                            padding: '3px 10px',
                            borderRadius: '999px',
                            fontSize: '12px',
                            fontWeight: 600,
                          }}
                        >
                          {STATUS_LABELS[lead.status_funil] ?? lead.status_funil}
                        </span>
                      </td>
                      <td>
                        {lead.ultima_interacao_em ? (
                          <span className={corDiasContato(dias)} style={{ fontSize: '12px' }}>
                            {dias === 0 ? 'Hoje' : `${dias}d atrás`}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Nunca</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button 
                            onClick={(e) => toggleTag(e, lead.id, 'favorito')}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', borderRadius: '5px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', cursor: 'pointer', opacity: isLoading ? 0.5 : 1 }}
                          >
                            <Star size={12} style={{ color: isFavorito ? '#eab308' : 'var(--text-muted)', fill: isFavorito ? '#eab308' : 'none' }} />
                          </button>
                          <button 
                            onClick={(e) => toggleTag(e, lead.id, 'ruim')}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', borderRadius: '5px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', cursor: 'pointer', opacity: isLoading ? 0.5 : 1 }}
                          >
                            <ThumbsDown size={12} style={{ color: isRuim ? '#ef4444' : 'var(--text-muted)', fill: isRuim ? '#ef4444' : 'none' }} />
                          </button>
                          <a href={whatsappLink(lead.telefone)} target="_blank" rel="noopener noreferrer"
                            style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', padding: '3px 8px', borderRadius: '5px', background: 'rgba(37,211,102,0.12)', border: '1px solid rgba(37,211,102,0.25)', color: '#25d366', textDecoration: 'none' }}>
                            <MessageCircle size={10} />
                          </a>
                          <Link href={`/leads/${lead.id}`}
                            style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', padding: '3px 8px', borderRadius: '5px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)', textDecoration: 'none' }}>
                            <ExternalLink size={10} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <LoteEditSegmento 
        selectedIds={selectedIds} 
        onClearSelection={() => setSelectedIds(new Set())} 
      />
    </>
  )
}
