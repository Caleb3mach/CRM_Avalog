'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { type Segmento, type StatusFunil, type StatusSite, SEGMENTO_LABELS, COLUNAS_FUNIL } from '@/lib/types'

const SEGMENTOS: Segmento[] = [
  'oficina-estetica-automotiva','pet-comercio','pet-servico','pet-ambos','salao','estetica',
  'dentista','advogado','corretor','oficina-mecanica','barbeiro','outro'
]

export default function LeadFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [open, setOpen] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const get = (key: string) => searchParams.get(key) ?? ''

  const update = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== 'todos') {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.delete('page')
    router.push(`/leads?${params.toString()}`)
  }, [searchParams, router])

  // Debounced text search
  const handleSearchChange = useCallback((value: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      update('q', value)
    }, 400)
  }, [update])

  const clearAll = () => router.push('/leads')
  const hasFilters = searchParams.toString().length > 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        {/* Busca por nome */}
        <div style={{ position: 'relative', flex: 1, maxWidth: '320px' }}>
          <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Buscar por nome ou bairro..."
            defaultValue={get('q')}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="input-base"
            style={{ paddingLeft: '36px' }}
          />
        </div>

        <button
          onClick={() => setOpen(!open)}
          className={open ? 'btn-primary' : 'btn-ghost'}
          style={{ fontSize: '13px', padding: '8px 14px' }}
        >
          <SlidersHorizontal size={14} />
          Filtros
          {hasFilters && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fbbf24', marginLeft: '2px' }} />}
        </button>

        {hasFilters && (
          <button onClick={clearAll} className="btn-ghost" style={{ fontSize: '13px', padding: '8px 14px', color: '#dc2626', borderColor: 'rgba(220,38,38,0.3)' }}>
            <X size={14} />
            Limpar
          </button>
        )}
      </div>

      {open && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px', padding: '16px', background: 'var(--bg-surface)', borderRadius: '10px', border: '1px solid var(--border)' }}>
          {/* Segmento */}
          <div>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>SEGMENTO</label>
            <select value={get('segmento') || 'todos'} onChange={(e) => update('segmento', e.target.value)} className="input-base">
              <option value="todos">Todos</option>
              {SEGMENTOS.map((s) => <option key={s} value={s}>{SEGMENTO_LABELS[s]}</option>)}
            </select>
          </div>

          {/* Status funil */}
          <div>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>ETAPA DO FUNIL</label>
            <select value={get('status_funil') || 'todos'} onChange={(e) => update('status_funil', e.target.value)} className="input-base">
              <option value="todos">Todas</option>
              {COLUNAS_FUNIL.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>

          {/* Status site */}
          <div>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>STATUS SITE</label>
            <select value={get('status_site') || 'todos'} onChange={(e) => update('status_site', e.target.value)} className="input-base">
              <option value="todos">Todos</option>
              <option value="sem-site">Sem site</option>
              <option value="linktree">Linktree</option>
              <option value="site-quebrado">Site quebrado</option>
              <option value="site-ok">Site ok</option>
            </select>
          </div>

          {/* Instagram */}
          <div>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>INSTAGRAM</label>
            <select value={get('instagram_ativo') || 'todos'} onChange={(e) => update('instagram_ativo', e.target.value)} className="input-base">
              <option value="todos">Todos</option>
              <option value="sim">Ativo</option>
              <option value="nao">Inativo</option>
              <option value="nao-verificado">Não verificado</option>
            </select>
          </div>

          {/* Avaliações mín */}
          <div>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>AVALIAÇÕES (MÍN)</label>
            <input
              type="number"
              min={0}
              placeholder="Ex: 50"
              defaultValue={get('avaliacoes_min')}
              onChange={(e) => {
                if (debounceRef.current) clearTimeout(debounceRef.current)
                debounceRef.current = setTimeout(() => update('avaliacoes_min', e.target.value), 500)
              }}
              className="input-base"
            />
          </div>

          {/* Nota mín */}
          <div>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>NOTA GOOGLE (MÍN)</label>
            <input
              type="number"
              min={0}
              max={5}
              step={0.1}
              placeholder="Ex: 4.5"
              defaultValue={get('nota_min')}
              onChange={(e) => {
                if (debounceRef.current) clearTimeout(debounceRef.current)
                debounceRef.current = setTimeout(() => update('nota_min', e.target.value), 500)
              }}
              className="input-base"
            />
          </div>
        </div>
      )}
    </div>
  )
}
