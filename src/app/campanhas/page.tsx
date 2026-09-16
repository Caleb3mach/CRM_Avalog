'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Play, Pause, CheckCircle, AlertTriangle, Clock } from 'lucide-react'
import type { Campanha } from '@/lib/types'

export default function CampanhasPage() {
  const [campanhas, setCampanhas] = useState<Campanha[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCampanhas()
  }, [])

  async function fetchCampanhas() {
    setLoading(true)
    try {
      const res = await fetch('/api/campanhas')
      const data = await res.json()
      if (!res.ok) {
        console.error('Erro:', data.error)
        alert('Erro ao carregar campanhas: ' + data.error)
        setCampanhas([])
      } else {
        setCampanhas(data)
      }
    } catch (err) {
      console.error(err)
      setCampanhas([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>Campanhas de Prospecção</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '13px' }}>
            Gerencie envios em massa e acompanhe a fila de disparos.
          </p>
        </div>
        <Link href="/campanhas/nova" className="btn-primary" style={{ textDecoration: 'none', fontSize: '13px' }}>
          <Plus size={14} />
          Nova Campanha
        </Link>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
          <div className="spinner" />
        </div>
      ) : campanhas.length === 0 ? (
        <div className="glass-card" style={{ padding: '48px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>Você ainda não criou nenhuma campanha.</p>
          <Link href="/campanhas/nova" className="btn-primary" style={{ display: 'inline-flex', textDecoration: 'none' }}>Criar primeira campanha</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {campanhas.map((camp) => (
            <div key={camp.id} className="glass-card" style={{ padding: '20px' }}>
              <div className="flex flex-col md:flex-row justify-between items-start mb-4 gap-2">
                <div>
                  <h3 className="m-0 text-[16px] font-semibold">{camp.nome}</h3>
                  <div className="text-[12px] text-[var(--text-muted)] flex flex-wrap gap-2 items-center mt-1">
                    <span style={{ 
                      padding: '2px 8px', 
                      borderRadius: '4px', 
                      background: camp.status === 'ativa' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(100, 116, 139, 0.15)',
                      color: camp.status === 'ativa' ? '#10b981' : '#64748b',
                      fontWeight: 600
                    }}>
                      {camp.status.toUpperCase()}
                    </span>
                    <span className="hidden sm:inline">•</span>
                    <span>Script: {camp.scripts?.nome || 'Desconhecido'}</span>
                    <span className="hidden sm:inline">•</span>
                    <span>{new Date(camp.criado_em).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
              </div>

              {/* Progress Bar & Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div style={{ background: 'var(--bg-elevated)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '4px' }}>
                    <Clock size={14} /> Fila / Pendente
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 700 }}>{camp.stats?.pendentes || 0}</div>
                </div>
                
                <div style={{ background: 'var(--bg-elevated)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#3b82f6', fontSize: '12px', marginBottom: '4px' }}>
                    <Play size={14} /> Processando
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: '#3b82f6' }}>{camp.stats?.processando || 0}</div>
                </div>

                <div style={{ background: 'rgba(16, 185, 129, 0.05)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontSize: '12px', marginBottom: '4px' }}>
                    <CheckCircle size={14} /> Enviados
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: '#10b981' }}>{camp.stats?.enviados || 0}</div>
                </div>

                <div style={{ background: 'rgba(239, 68, 68, 0.05)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ef4444', fontSize: '12px', marginBottom: '4px' }}>
                    <AlertTriangle size={14} /> Erros
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: '#ef4444' }}>{camp.stats?.erros || 0}</div>
                </div>
              </div>
              
              <div style={{ marginTop: '16px', background: 'var(--bg-elevated)', height: '6px', borderRadius: '3px', overflow: 'hidden', display: 'flex' }}>
                <div style={{ width: `${((camp.stats?.enviados || 0) / Math.max(camp.stats?.total || 1, 1)) * 100}%`, background: '#10b981' }} />
                <div style={{ width: `${((camp.stats?.erros || 0) / Math.max(camp.stats?.total || 1, 1)) * 100}%`, background: '#ef4444' }} />
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px', textAlign: 'right' }}>
                Progresso: {camp.stats?.enviados || 0} de {camp.stats?.total || 0}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
