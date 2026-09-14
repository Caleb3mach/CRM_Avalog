'use client'

import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { MessageCircle, Star, Clock, Phone, ThumbsDown, ExternalLink } from 'lucide-react'
import { type Lead, SEGMENTO_LABELS, SEGMENTO_CORES } from '@/lib/types'
import { diasDesdeContato, formatarTelefone, corDiasContato, whatsappLink } from '@/lib/utils'

interface LeadCardProps {
  lead: Lead
  onClick: (lead: Lead) => void
  onUpdate?: (lead: Lead) => void
}

function LeadCardInner({ lead, onClick, onUpdate }: LeadCardProps) {
  const [loadingTag, setLoadingTag] = React.useState(false)
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const dias = diasDesdeContato(lead.ultima_interacao_em)
  const corDias = corDiasContato(dias)
  const segmentoCor = lead.segmento ? SEGMENTO_CORES[lead.segmento] : 'seg-outro'
  const segmentoLabel = lead.segmento ? SEGMENTO_LABELS[lead.segmento] : 'Outro'

  const isFavorito = lead.tags?.includes('favorito')
  const isRuim = lead.tags?.includes('ruim')

  async function toggleTag(e: React.MouseEvent, tagToToggle: string) {
    e.stopPropagation()
    if (loadingTag) return

    setLoadingTag(true)
    try {
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

      const res = await fetch(`/api/leads/${lead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags: currentTags })
      })

      if (res.ok) {
        const updatedLead = await res.json()
        onUpdate?.(updatedLead)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingTag(false)
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`lead-card${isDragging ? ' dragging' : ''}`}
      onClick={() => onClick(lead)}
    >
      {/* Nome e Ações */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
        <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.3, paddingRight: '8px' }}>
          {lead.nome}
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button 
            onClick={(e) => toggleTag(e, 'favorito')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: loadingTag ? 0.5 : 1, padding: 0 }}
          >
            <Star size={14} style={{ color: isFavorito ? '#eab308' : 'var(--text-muted)', fill: isFavorito ? '#eab308' : 'none' }} />
          </button>
          <button 
            onClick={(e) => toggleTag(e, 'ruim')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: loadingTag ? 0.5 : 1, padding: 0 }}
          >
            <ThumbsDown size={14} style={{ color: isRuim ? '#ef4444' : 'var(--text-muted)', fill: isRuim ? '#ef4444' : 'none' }} />
          </button>
        </div>
      </div>

      {/* Segmento badge */}
      <div style={{ marginBottom: '6px' }}>
        <span className={`badge ${segmentoCor}`}>
          {segmentoLabel}
        </span>
      </div>

      {/* Info compacto */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
        {lead.nota_google && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--text-secondary)' }}>
            <Star size={11} style={{ color: '#eab308' }} />
            <span style={{ color: '#eab308', fontWeight: 600 }}>{lead.nota_google}</span>
            {lead.avaliacoes_google ? (
              <span style={{ color: 'var(--text-muted)' }}>({lead.avaliacoes_google})</span>
            ) : null}
          </div>
        )}

        {lead.bairro && (
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            📍 {lead.bairro}
          </div>
        )}

        {/* Telefone + WhatsApp */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
            <Phone size={10} style={{ color: 'var(--text-muted)' }} />
            <span style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>{formatarTelefone(lead.telefone)}</span>
          </div>
          <a
            href={whatsappLink(lead.telefone)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              padding: '2px 7px',
              borderRadius: '5px',
              background: 'rgba(37, 211, 102, 0.12)',
              border: '1px solid rgba(37, 211, 102, 0.25)',
              color: '#25d366',
              fontSize: '10px',
              textDecoration: 'none',
              fontWeight: 500,
            }}
          >
            <MessageCircle size={9} />
            Msg
          </a>
        </div>

        {/* Dias + status site compacto */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
          {lead.ultima_interacao_em ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px' }} className={corDias}>
              <Clock size={9} />
              {dias === 0 ? 'Hoje' : `${dias}d`}
            </div>
          ) : (
            <span />
          )}
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            {lead.status_site !== 'site-ok' && (
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                {lead.status_site === 'sem-site' ? '🚫' :
                 lead.status_site === 'linktree' ? '🌳' :
                 lead.status_site === 'site-quebrado' ? '⚠️' : ''}
              </span>
            )}
            {lead.website && (
              <a
                href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                style={{ color: 'var(--text-secondary)' }}
              >
                <ExternalLink size={10} />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const LeadCard = React.memo(LeadCardInner)
export default LeadCard
