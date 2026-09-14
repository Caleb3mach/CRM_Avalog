'use client'

import { useState } from 'react'
import { PlusCircle, X } from 'lucide-react'
import { type Segmento, type StatusSite, type InstagramAtivo, SEGMENTO_LABELS } from '@/lib/types'
import { useRouter } from 'next/navigation'

const SEGMENTOS: Segmento[] = [
  'oficina-estetica-automotiva','pet-comercio','pet-servico','pet-ambos','salao','estetica',
  'dentista','advogado','corretor','oficina-mecanica','barbeiro','outro'
]

export default function AddLeadModal() {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const [form, setForm] = useState({
    nome: '',
    telefone: '',
    bairro: '',
    cidade: 'Rio de Janeiro',
    segmento: '' as Segmento | '',
    avaliacoes_google: '',
    nota_google: '',
    status_site: 'sem-site' as StatusSite,
    instagram_url: '',
    instagram_ativo: 'nao-verificado' as InstagramAtivo,
  })

  function set(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nome || !form.telefone) return
    setSaving(true)
    setError(null)

    const body = {
      nome: form.nome,
      telefone: form.telefone.replace(/\D/g, ''),
      bairro: form.bairro || null,
      cidade: form.cidade,
      segmento: form.segmento || null,
      avaliacoes_google: form.avaliacoes_google ? parseInt(form.avaliacoes_google) : 0,
      nota_google: form.nota_google ? parseFloat(form.nota_google) : null,
      status_site: form.status_site,
      instagram_url: form.instagram_url || null,
      instagram_ativo: form.instagram_ativo,
    }

    const res = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (res.ok) {
      setOpen(false)
      setForm({ nome: '', telefone: '', bairro: '', cidade: 'Rio de Janeiro', segmento: '', avaliacoes_google: '', nota_google: '', status_site: 'sem-site', instagram_url: '', instagram_ativo: 'nao-verificado' })
      router.refresh()
    } else {
      const data = await res.json()
      setError(data.error ?? 'Erro ao salvar')
    }
    setSaving(false)
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary" style={{ fontSize: '13px' }}>
        <PlusCircle size={14} />
        Novo Lead
      </button>

      {open && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Novo Lead</h2>
              <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>NOME *</label>
                  <input required value={form.nome} onChange={(e) => set('nome', e.target.value)} placeholder="Pet Shop Exemplo" className="input-base" />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>TELEFONE *</label>
                  <input required value={form.telefone} onChange={(e) => set('telefone', e.target.value)} placeholder="(21) 99999-9999" className="input-base" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>BAIRRO</label>
                  <input value={form.bairro} onChange={(e) => set('bairro', e.target.value)} placeholder="Tijuca" className="input-base" />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>SEGMENTO</label>
                  <select value={form.segmento} onChange={(e) => set('segmento', e.target.value)} className="input-base">
                    <option value="">Selecionar...</option>
                    {SEGMENTOS.map((s) => <option key={s} value={s}>{SEGMENTO_LABELS[s]}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>AVALIAÇÕES</label>
                  <input type="number" min={0} value={form.avaliacoes_google} onChange={(e) => set('avaliacoes_google', e.target.value)} placeholder="120" className="input-base" />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>NOTA</label>
                  <input type="number" min={0} max={5} step={0.1} value={form.nota_google} onChange={(e) => set('nota_google', e.target.value)} placeholder="4.8" className="input-base" />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>STATUS SITE</label>
                  <select value={form.status_site} onChange={(e) => set('status_site', e.target.value)} className="input-base">
                    <option value="sem-site">Sem site</option>
                    <option value="linktree">Linktree</option>
                    <option value="site-quebrado">Site quebrado</option>
                    <option value="site-ok">Site ok</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>LINK INSTAGRAM</label>
                  <input value={form.instagram_url} onChange={(e) => set('instagram_url', e.target.value)} placeholder="https://instagram.com/..." className="input-base" />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>ATIVO?</label>
                  <select value={form.instagram_ativo} onChange={(e) => set('instagram_ativo', e.target.value)} className="input-base">
                    <option value="nao-verificado">Não verificado</option>
                    <option value="sim">Sim</option>
                    <option value="nao">Não</option>
                  </select>
                </div>
              </div>

              {error && <div style={{ color: '#dc2626', fontSize: '13px' }}>⚠️ {error}</div>}

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', paddingTop: '4px' }}>
                <button type="button" onClick={() => setOpen(false)} className="btn-ghost">Cancelar</button>
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? 'Salvando...' : 'Criar Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
