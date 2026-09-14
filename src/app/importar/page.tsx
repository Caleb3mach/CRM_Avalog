'use client'

import { useState, useCallback } from 'react'
import Papa from 'papaparse'
import { Upload, CheckCircle2, XCircle, AlertTriangle, FileSpreadsheet } from 'lucide-react'
import { type Segmento, type StatusSite, SEGMENTO_LABELS } from '@/lib/types'
import { normalizarTelefone } from '@/lib/utils'

interface ParsedRow {
  nome: string
  telefone: string
  bairro?: string
  cidade?: string
  segmento?: string
  avaliacoes_google?: string
  nota_google?: string
  status_site?: string
  instagram_url?: string
  instagram_ativo?: string
}

interface ImportResult {
  importados: number
  duplicatas: number
  erros: number
  nomes: string[]
}

const SEGMENTOS: Segmento[] = [
  'pet-comercio','pet-servico','pet-ambos','salao','estetica',
  'dentista','advogado','corretor','oficina-mecanica','barbeiro','outro'
]

export default function ImportarPage() {
  const [dragging, setDragging] = useState(false)
  const [preview, setPreview] = useState<ParsedRow[]>([])
  const [fileName, setFileName] = useState('')
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)

  function processFile(file: File) {
    setFileName(file.name)
    setResult(null)
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setPreview(results.data as ParsedRow[])
      },
    })
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && (file.name.endsWith('.csv') || file.name.endsWith('.txt'))) {
      processFile(file)
    }
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  async function handleImport() {
    if (!preview.length) return
    setImporting(true)

    let importados = 0
    let duplicatas = 0
    let erros = 0
    const nomes: string[] = []

    for (const row of preview) {
      if (!row.nome || !row.telefone) { erros++; continue }

      const tel = normalizarTelefone(String(row.telefone))
      if (!tel) { erros++; continue }

      // Mapear segmento
      let seg: Segmento | null = null
      if (row.segmento) {
        const segLower = row.segmento.toLowerCase().trim()
        const match = SEGMENTOS.find((s) =>
          s === segLower ||
          SEGMENTO_LABELS[s].toLowerCase() === segLower
        )
        seg = match ?? null
      }

      const body = {
        nome: String(row.nome).trim(),
        telefone: tel,
        bairro: row.bairro?.trim() || null,
        cidade: row.cidade?.trim() || 'Rio de Janeiro',
        segmento: seg,
        avaliacoes_google: row.avaliacoes_google ? parseInt(String(row.avaliacoes_google)) : 0,
        nota_google: row.nota_google ? parseFloat(String(row.nota_google)) : null,
        status_site: (row.status_site as StatusSite) || 'sem-site',
        instagram_url: row.instagram_url?.trim() || null,
        instagram_ativo: row.instagram_ativo?.trim() || 'nao-verificado',
      }

      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        importados++
        nomes.push(body.nome)
      } else {
        const data = await res.json()
        if (data.error?.includes('unique') || data.error?.includes('duplicate')) {
          duplicatas++
        } else {
          erros++
        }
      }
    }

    setResult({ importados, duplicatas, erros, nomes })
    setImporting(false)
    if (importados > 0) setPreview([])
  }

  return (
    <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>Importar Leads via CSV</h1>
        <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '13px' }}>
          Faça upload de um arquivo CSV com seus leads. Duplicatas (mesmo telefone) serão ignoradas automaticamente.
        </p>
      </div>

      {/* Formato esperado */}
      <div className="alert-card info" style={{ marginBottom: '20px' }}>
        <AlertTriangle size={16} />
        <div>
          <strong>Colunas esperadas no CSV:</strong>
          <div style={{ fontSize: '12px', marginTop: '4px', fontFamily: 'monospace', opacity: 0.85 }}>
            nome, telefone, bairro, cidade, segmento, avaliacoes_google, nota_google, status_site, instagram_url, instagram_ativo
          </div>
          <div style={{ fontSize: '12px', marginTop: '4px', opacity: 0.7 }}>
            Apenas <strong>nome</strong> e <strong>telefone</strong> são obrigatórios. Segmentos aceitos: {SEGMENTOS.join(', ')}
          </div>
        </div>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${dragging ? 'var(--accent-blue)' : 'var(--border)'}`,
          borderRadius: '12px',
          padding: '48px',
          textAlign: 'center',
          transition: 'all 0.2s ease',
          background: dragging ? 'rgba(59,130,246,0.05)' : 'var(--bg-surface)',
          cursor: 'pointer',
          marginBottom: '20px',
        }}
        onClick={() => document.getElementById('csv-input')?.click()}
      >
        <FileSpreadsheet size={40} style={{ color: dragging ? 'var(--accent-blue)' : 'var(--text-muted)', marginBottom: '12px' }} />
        <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '6px' }}>
          {fileName || 'Arraste o CSV aqui ou clique para selecionar'}
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Suporta .csv e .txt com separador por vírgula
        </div>
        <input id="csv-input" type="file" accept=".csv,.txt" onChange={handleFileInput} style={{ display: 'none' }} />
      </div>

      {/* Resultado da importação */}
      {result && (
        <div className="glass-card" style={{ padding: '20px', marginBottom: '20px' }}>
          <h3 style={{ margin: '0 0 14px', fontSize: '15px', fontWeight: 600 }}>Resultado da Importação</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '14px' }}>
            <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(16,185,129,0.1)', borderRadius: '10px', border: '1px solid rgba(16,185,129,0.2)' }}>
              <CheckCircle2 size={20} color="#34d399" style={{ marginBottom: '6px' }} />
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#34d399' }}>{result.importados}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Importados</div>
            </div>
            <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(245,158,11,0.1)', borderRadius: '10px', border: '1px solid rgba(245,158,11,0.2)' }}>
              <AlertTriangle size={20} color="#fbbf24" style={{ marginBottom: '6px' }} />
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#fbbf24' }}>{result.duplicatas}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Duplicatas ignoradas</div>
            </div>
            <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(239,68,68,0.1)', borderRadius: '10px', border: '1px solid rgba(239,68,68,0.2)' }}>
              <XCircle size={20} color="#f87171" style={{ marginBottom: '6px' }} />
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#f87171' }}>{result.erros}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Erros</div>
            </div>
          </div>
          {result.nomes.length > 0 && (
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Importados: {result.nomes.slice(0, 10).join(', ')}{result.nomes.length > 10 ? ` e +${result.nomes.length - 10}` : ''}
            </div>
          )}
        </div>
      )}

      {/* Preview */}
      {preview.length > 0 && (
        <div className="glass-card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontWeight: 600, fontSize: '14px' }}>Preview</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '13px', marginLeft: '8px' }}>{preview.length} linha{preview.length !== 1 ? 's' : ''}</span>
            </div>
            <button
              onClick={handleImport}
              disabled={importing}
              className="btn-primary"
              style={{ fontSize: '13px' }}
            >
              <Upload size={14} />
              {importing ? `Importando... (${preview.length} leads)` : `Importar ${preview.length} leads`}
            </button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="table-base">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Telefone</th>
                  <th>Bairro</th>
                  <th>Segmento</th>
                  <th>Avaliações</th>
                  <th>Nota</th>
                  <th>Status Site</th>
                </tr>
              </thead>
              <tbody>
                {preview.slice(0, 20).map((row, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{row.nome}</td>
                    <td>{row.telefone}</td>
                    <td>{row.bairro ?? '—'}</td>
                    <td>{row.segmento ?? '—'}</td>
                    <td>{row.avaliacoes_google ?? '—'}</td>
                    <td>{row.nota_google ?? '—'}</td>
                    <td>{row.status_site ?? '—'}</td>
                  </tr>
                ))}
                {preview.length > 20 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                      ... e mais {preview.length - 20} linhas
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
