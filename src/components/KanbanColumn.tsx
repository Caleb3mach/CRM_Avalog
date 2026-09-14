'use client'

import React, { useState, useMemo } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { ChevronDown } from 'lucide-react'
import { type Lead, type StatusFunil, COLUNAS_FUNIL } from '@/lib/types'
import LeadCard from './LeadCard'

interface KanbanColumnProps {
  status: StatusFunil
  leads: Lead[]
  onLeadClick: (lead: Lead) => void
  onUpdate?: (lead: Lead) => void
}

const INITIAL_VISIBLE = 20
const LOAD_MORE_COUNT = 15

const BORDER_COLORS: Record<StatusFunil, string> = {
  novo: 'border-slate-500',
  contatado: 'border-blue-500',
  respondeu_conexao: 'border-sky-500',
  pitch_enviado: 'border-indigo-500',
  respondeu: 'border-cyan-500',
  'demo-enviada': 'border-violet-500',
  'follow-up': 'border-amber-500',
  'reuniao-marcada': 'border-orange-500',
  fechado: 'border-emerald-500',
  rejeitou: 'border-rose-500',
  perdido: 'border-red-500',
}

function KanbanColumnInner({ status, leads, onLeadClick, onUpdate }: KanbanColumnProps) {
  const colDef = COLUNAS_FUNIL.find((c) => c.id === status)!
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE)

  const { setNodeRef, isOver } = useDroppable({ id: status })

  const visibleLeads = useMemo(() => leads.slice(0, visibleCount), [leads, visibleCount])
  const hasMore = leads.length > visibleCount

  return (
    <div
      className="kanban-column"
      style={{
        borderColor: isOver ? 'var(--accent-blue)' : undefined,
        background: isOver ? 'rgba(59, 130, 246, 0.04)' : undefined,
        transition: 'border-color 0.2s, background 0.2s',
      }}
    >
      {/* Header */}
      <div className="kanban-column-header">
        <div
          style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            flexShrink: 0,
            background: colDef?.cor?.replace('bg-', '') || '#94a3b8' // fallback
          }}
        />
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', flex: 1 }}>
          {colDef.label}
        </span>
        <span
          style={{
            fontSize: '11px',
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: '999px',
            background: 'var(--bg-elevated)',
            color: 'var(--text-muted)',
          }}
        >
          {leads.length}
        </span>
      </div>

      {/* Cards */}
      <SortableContext items={visibleLeads.map((l) => l.id)} strategy={verticalListSortingStrategy}>
        <div ref={setNodeRef} className="kanban-cards">
          {leads.length === 0 && (
            <div
              style={{
                textAlign: 'center',
                padding: '24px 12px',
                color: 'var(--text-muted)',
                fontSize: '12px',
                border: '1px dashed var(--border)',
                borderRadius: '8px',
              }}
            >
              Arraste um lead aqui
            </div>
          )}
          {visibleLeads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} onClick={onLeadClick} onUpdate={onUpdate} />
          ))}
          {hasMore && (
            <button
              onClick={() => setVisibleCount((prev) => prev + LOAD_MORE_COUNT)}
              style={{
                width: '100%',
                padding: '8px',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                color: 'var(--text-secondary)',
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                transition: 'border-color 0.2s',
              }}
              onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--accent-blue)' }}
              onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--border)' }}
            >
              <ChevronDown size={12} />
              Ver mais {leads.length - visibleCount} leads
            </button>
          )}
        </div>
      </SortableContext>
    </div>
  )
}

const KanbanColumn = React.memo(KanbanColumnInner)
export default KanbanColumn
