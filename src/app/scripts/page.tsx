'use client'

import { useState, useEffect } from 'react'
import { Copy, Check, Plus, X, Edit2, Trash2 } from 'lucide-react'
import { type Script, type CategoriaScript } from '@/lib/types'

const CATEGORIAS: { id: CategoriaScript; label: string; cor: string }[] = [
  { id: 'abordagem', label: 'Abordagem', cor: 'rgba(59,130,246,0.2)' },
  { id: 'demo', label: 'Demo', cor: 'rgba(139,92,246,0.2)' },
  { id: 'follow-up', label: 'Follow-up', cor: 'rgba(245,158,11,0.2)' },
  { id: 'breakup', label: 'Breakup', cor: 'rgba(239,68,68,0.2)' },
  { id: 'resposta', label: 'Resposta', cor: 'rgba(16,185,129,0.2)' },
  { id: 'outro', label: 'Outro', cor: 'rgba(100,116,139,0.2)' },
]

const CATEGORIA_TEXT: Record<CategoriaScript, string> = {
  abordagem: '#60a5fa',
  demo: '#a78bfa',
  'follow-up': '#fbbf24',
  breakup: '#f87171',
  resposta: '#34d399',
  outro: '#94a3b8',
}

function ScriptCard({ script, onDelete }: { script: Script; onDelete: (id: string) => void }) {
  const [copied, setCopied] = useState(false)
  const cat = CATEGORIAS.find((c) => c.id === script.categoria)

  async function handleCopy() {
    await navigator.clipboard.writeText(script.texto)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="glass-card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h3 style={{ margin: '0 0 6px', fontSize: '14px', fontWeight: 700 }}>{script.nome}</h3>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '2px 10px',
            borderRadius: '999px',
            fontSize: '11px',
            fontWeight: 600,
            background: cat?.cor ?? 'rgba(100,116,139,0.2)',
            color: CATEGORIA_TEXT[script.categoria] ?? '#94a3b8',
          }}>
            {cat?.label ?? script.categoria}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={handleCopy}
            className="btn-primary"
            style={{ fontSize: '12px', padding: '6px 12px', background: copied ? 'linear-gradient(135deg, #10b981, #059669)' : undefined }}
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? 'Copiado!' : 'Copiar'}
          </button>
          <button
            onClick={() => onDelete(script.id)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '6px' }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <pre style={{
        margin: 0,
        padding: '12px 14px',
        background: 'var(--bg-elevated)',
        borderRadius: '8px',
        fontSize: '13px',
        lineHeight: 1.6,
        color: 'var(--text-secondary)',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        fontFamily: 'inherit',
        border: '1px solid var(--border)',
        maxHeight: '200px',
        overflowY: 'auto',
      }}>
        {script.texto}
      </pre>
    </div>
  )
}

export default function ScriptsPage() {
  const [scripts, setScripts] = useState<Script[]>([])
  const [filtro, setFiltro] = useState<CategoriaScript | 'todos'>('todos')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ nome: '', categoria: 'abordagem' as CategoriaScript, texto: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchScripts() }, [])

  async function fetchScripts() {
    setLoading(true)
    const res = await fetch('/api/scripts')
    const data = await res.json()
    setScripts(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nome || !form.texto) return
    setSaving(true)
    const res = await fetch('/api/scripts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      const novo = await res.json()
      setScripts((prev) => [...prev, novo])
      setForm({ nome: '', categoria: 'abordagem', texto: '' })
      setShowForm(false)
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir este script?')) return
    const res = await fetch('/api/scripts', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    if (res.ok) setScripts((prev) => prev.filter((s) => s.id !== id))
  }

  const filtrados = filtro === 'todos' ? scripts : scripts.filter((s) => s.categoria === filtro)

  return (
    <div style={{ padding: '24px', maxWidth: '960px', margin: '0 auto' }}>
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>Scripts de Prospecção</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '13px' }}>
            {scripts.length} scripts · Clique em Copiar antes de abordar
          </p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary" style={{ fontSize: '13px' }}>
          <Plus size={14} />
          Novo Script
        </button>
      </div>

      {/* Filtros por categoria */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setFiltro('todos')}
          className={filtro === 'todos' ? 'btn-primary' : 'btn-ghost'}
          style={{ fontSize: '12px', padding: '6px 14px' }}
        >
          Todos ({scripts.length})
        </button>
        {CATEGORIAS.map((cat) => {
          const count = scripts.filter((s) => s.categoria === cat.id).length
          return (
            <button
              key={cat.id}
              onClick={() => setFiltro(cat.id)}
              className={filtro === cat.id ? 'btn-primary' : 'btn-ghost'}
              style={{ fontSize: '12px', padding: '6px 14px', color: filtro !== cat.id ? CATEGORIA_TEXT[cat.id] : undefined }}
            >
              {cat.label} ({count})
            </button>
          )
        })}
      </div>

      {/* Formulário novo script */}
      {showForm && (
        <div className="glass-card" style={{ padding: '20px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>Novo Script</h3>
            <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
              <X size={16} />
            </button>
          </div>
          <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '10px' }}>
              <input required placeholder="Nome do script (ex: 1A — Pet shop)" value={form.nome} onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))} className="input-base" />
              <select value={form.categoria} onChange={(e) => setForm((p) => ({ ...p, categoria: e.target.value as CategoriaScript }))} className="input-base" style={{ width: 'auto' }}>
                {CATEGORIAS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            <textarea required placeholder="Texto do script..." value={form.texto} onChange={(e) => setForm((p) => ({ ...p, texto: e.target.value }))} rows={6} className="input-base" style={{ resize: 'vertical' }} />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowForm(false)} className="btn-ghost">Cancelar</button>
              <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Salvando...' : 'Salvar Script'}</button>
            </div>
          </form>
        </div>
      )}

      {/* Scripts grid */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
          <div className="spinner" />
        </div>
      ) : filtrados.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
          Nenhum script encontrado
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtrados.map((script) => (
            <ScriptCard key={script.id} script={script} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  )
}
