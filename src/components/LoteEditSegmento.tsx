'use client'

import { useState } from 'react'
import type { Lead, Segmento } from '@/lib/types'
import { SEGMENTO_LABELS } from '@/lib/types'
import { Check, Edit2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function LoteEditSegmento({ 
  selectedIds, 
  onClearSelection 
}: { 
  selectedIds: Set<string>;
  onClearSelection: () => void;
}) {
  const router = useRouter()
  const [segmento, setSegmento] = useState<Segmento | ''>('')
  const [loading, setLoading] = useState(false)

  if (selectedIds.size === 0) return null

  async function handleUpdate() {
    if (!segmento) return
    setLoading(true)
    
    try {
      const res = await fetch('/api/leads/lote', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_ids: Array.from(selectedIds),
          segmento
        })
      })

      if (res.ok) {
        onClearSelection()
        router.refresh()
      } else {
        alert('Erro ao atualizar leads')
      }
    } catch (err) {
      console.error(err)
      alert('Erro ao atualizar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'var(--bg-elevated)',
      border: '1px solid var(--border)',
      boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
      padding: '16px 24px',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      zIndex: 50
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ background: 'var(--accent-blue)', color: 'white', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 600 }}>
          {selectedIds.size}
        </div>
        <span style={{ fontSize: '14px', fontWeight: 500 }}>leads selecionados</span>
      </div>

      <div style={{ width: '1px', height: '24px', background: 'var(--border)' }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <select 
          className="input-base"
          style={{ width: '200px', padding: '6px 12px', fontSize: '13px' }}
          value={segmento}
          onChange={e => setSegmento(e.target.value as Segmento)}
        >
          <option value="">Alterar Segmento...</option>
          {Object.entries(SEGMENTO_LABELS).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>

        <button 
          onClick={handleUpdate}
          disabled={!segmento || loading}
          className="btn-primary"
          style={{ padding: '6px 16px', fontSize: '13px', opacity: (!segmento || loading) ? 0.5 : 1 }}
        >
          {loading ? 'Atualizando...' : 'Aplicar'}
        </button>

        <button onClick={onClearSelection} className="btn-ghost" style={{ padding: '6px 12px', fontSize: '13px', color: 'var(--text-muted)' }}>
          Cancelar
        </button>
      </div>
    </div>
  )
}
