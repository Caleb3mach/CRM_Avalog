'use client'

import { useState, useMemo, useCallback, useRef } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { type Lead, type StatusFunil, type Segmento, COLUNAS_FUNIL, SEGMENTO_LABELS } from '@/lib/types'
import KanbanColumn from './KanbanColumn'
import LeadModal from './LeadModal'
import LeadCard from './LeadCard'

const SEGMENTOS: Segmento[] = [
  'oficina-estetica-automotiva','pet-comercio','pet-servico','pet-ambos',
  'salao','estetica','dentista','advogado','corretor','oficina-mecanica','barbeiro','outro'
]

interface KanbanBoardProps {
  initialLeads: Lead[]
}

export default function KanbanBoard({ initialLeads }: KanbanBoardProps) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [filterSegmento, setFilterSegmento] = useState<string>('')
  const [filterSite, setFilterSite] = useState<string>('')
  const [showFilters, setShowFilters] = useState(false)

  // Debounced search
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [debouncedSearch, setDebouncedSearch] = useState('')

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value)
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(value)
    }, 300)
  }, [])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  // Memoized filtered leads
  const filteredLeads = useMemo(() => {
    let result = leads

    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase()
      result = result.filter(
        (l) =>
          l.nome.toLowerCase().includes(q) ||
          (l.bairro && l.bairro.toLowerCase().includes(q))
      )
    }

    if (filterSegmento) {
      result = result.filter((l) => l.segmento === filterSegmento)
    }

    if (filterSite) {
      result = result.filter((l) => l.status_site === filterSite)
    }

    return result
  }, [leads, debouncedSearch, filterSegmento, filterSite])

  const getLeadsByStatus = useCallback(
    (status: StatusFunil) => {
      return filteredLeads
        .filter((l) => l.status_funil === status)
        .sort((a, b) => {
          const aFav = a.tags?.includes('favorito') ? 1 : 0;
          const bFav = b.tags?.includes('favorito') ? 1 : 0;
          const aRuim = a.tags?.includes('ruim') ? 1 : 0;
          const bRuim = b.tags?.includes('ruim') ? 1 : 0;

          // Favoritos no topo
          if (aFav !== bFav) return bFav - aFav;
          // Ruins no final
          if (aRuim !== bRuim) return aRuim - bRuim;
          
          return 0;
        })
    },
    [filteredLeads]
  )

  const activeLead = leads.find((l) => l.id === activeId) ?? null

  const hasActiveFilters = debouncedSearch || filterSegmento || filterSite
  const filteredCount = filteredLeads.length
  const totalCount = leads.length

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const activeLeadItem = leads.find((l) => l.id === active.id)
    if (!activeLeadItem) return

    // Determinar nova coluna
    const overIsColumn = COLUNAS_FUNIL.some((c) => c.id === over.id)
    let novoStatus: StatusFunil

    if (overIsColumn) {
      novoStatus = over.id as StatusFunil
    } else {
      // Dropped over another card — use that card's status
      const overLead = leads.find((l) => l.id === over.id)
      if (!overLead) return
      novoStatus = overLead.status_funil
    }

    if (activeLeadItem.status_funil === novoStatus) {
      // Reorder within same column
      const colLeads = getLeadsByStatus(novoStatus)
      const oldIndex = colLeads.findIndex((l) => l.id === active.id)
      const newIndex = colLeads.findIndex((l) => l.id === over.id)
      if (oldIndex !== newIndex) {
        const reordered = arrayMove(colLeads, oldIndex, newIndex)
        setLeads((prev) => {
          const other = prev.filter((l) => l.status_funil !== novoStatus)
          return [...other, ...reordered]
        })
      }
      return
    }

    // Move to different column — optimistic update
    setLeads((prev) =>
      prev.map((l) =>
        l.id === active.id
          ? { ...l, status_funil: novoStatus, ultima_interacao_em: new Date().toISOString() }
          : l
      )
    )

    // Persist to Supabase
    try {
      const res = await fetch(`/api/leads/${active.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status_funil: novoStatus }),
      })
      if (!res.ok) {
        // Revert on error
        setLeads((prev) =>
          prev.map((l) => (l.id === active.id ? activeLeadItem : l))
        )
      }
    } catch {
      setLeads((prev) =>
        prev.map((l) => (l.id === active.id ? activeLeadItem : l))
      )
    }
  }

  function handleLeadUpdate(updatedLead: Lead) {
    setLeads((prev) => prev.map((l) => (l.id === updatedLead.id ? updatedLead : l)))
  }

  function handleLeadDelete(leadId: string) {
    setLeads((prev) => prev.filter((l) => l.id !== leadId))
    setSelectedLead(null)
  }

  function clearFilters() {
    setSearchQuery('')
    setDebouncedSearch('')
    setFilterSegmento('')
    setFilterSite('')
  }

  return (
    <>
      {/* Kanban Filters */}
      <div className="kanban-filters">
        <div style={{ position: 'relative', minWidth: '220px' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Buscar por nome..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="filter-input"
            style={{ paddingLeft: '32px', width: '100%' }}
          />
        </div>

        <select
          value={filterSegmento}
          onChange={(e) => setFilterSegmento(e.target.value)}
          className="filter-input"
          style={{ minWidth: '160px' }}
        >
          <option value="">Todos segmentos</option>
          {SEGMENTOS.map((s) => (
            <option key={s} value={s}>{SEGMENTO_LABELS[s]}</option>
          ))}
        </select>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className="filter-input"
          style={{
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: showFilters ? 'var(--accent-blue)' : undefined,
            color: showFilters ? 'white' : undefined,
            borderColor: showFilters ? 'var(--accent-blue)' : undefined,
          }}
        >
          <SlidersHorizontal size={13} />
          Mais
        </button>

        {hasActiveFilters && (
          <>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {filteredCount}/{totalCount} leads
            </span>
            <button
              onClick={clearFilters}
              className="filter-input"
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', color: '#dc2626', borderColor: 'rgba(220,38,38,0.3)', fontSize: '12px', padding: '5px 10px' }}
            >
              <X size={12} />
              Limpar
            </button>
          </>
        )}
      </div>

      {/* Extra filters row */}
      {showFilters && (
        <div className="kanban-filters" style={{ marginTop: '-4px' }}>
          <select
            value={filterSite}
            onChange={(e) => setFilterSite(e.target.value)}
            className="filter-input"
            style={{ minWidth: '140px' }}
          >
            <option value="">Status site</option>
            <option value="sem-site">Sem site</option>
            <option value="linktree">Linktree</option>
            <option value="site-quebrado">Site quebrado</option>
            <option value="site-ok">Site ok</option>
          </select>
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={({ active }) => setActiveId(active.id as string)}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <div className="kanban-board">
          {COLUNAS_FUNIL.map((col) => (
            <KanbanColumn
              key={col.id}
              status={col.id}
              leads={getLeadsByStatus(col.id)}
              onLeadClick={setSelectedLead}
              onUpdate={handleLeadUpdate}
            />
          ))}
        </div>

        <DragOverlay>
          {activeLead && (
            <div style={{ transform: 'rotate(2deg)', opacity: 0.9 }}>
              <LeadCard lead={activeLead} onClick={() => {}} onUpdate={() => {}} />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {selectedLead && (
        <LeadModal
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onUpdate={handleLeadUpdate}
          onDelete={handleLeadDelete}
        />
      )}
    </>
  )
}
