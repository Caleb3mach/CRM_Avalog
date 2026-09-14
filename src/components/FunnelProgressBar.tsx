'use client'

import { type StatusFunil, COLUNAS_FUNIL } from '@/lib/types'
import { Mail, MessageSquare, MessageCircle, Send, PhoneCall, Calendar, CheckCircle, XCircle } from 'lucide-react'

interface FunnelData {
  status: StatusFunil
  count: number
}

interface FunnelProgressBarProps {
  data: FunnelData[]
  total: number
}

const FUNNEL_COLORS: Record<StatusFunil, string> = {
  novo: '#64748b',
  contatado: '#3b82f6',
  respondeu_conexao: '#3b82f6',
  pitch_enviado: '#6366f1',
  respondeu: '#06b6d4',
  'demo-enviada': '#8b5cf6',
  'follow-up': '#f59e0b',
  'reuniao-marcada': '#f97316',
  fechado: '#10b981',
  rejeitou: '#ef4444',
  perdido: '#ef4444',
}

const STATUS_ICONS: Record<StatusFunil, React.ReactNode> = {
  novo: <Mail size={12} />,
  contatado: <MessageSquare size={12} />,
  respondeu_conexao: <MessageCircle size={12} />,
  pitch_enviado: <Send size={12} />,
  respondeu: <MessageCircle size={12} />,
  'demo-enviada': <Send size={12} />,
  'follow-up': <PhoneCall size={12} />,
  'reuniao-marcada': <Calendar size={12} />,
  fechado: <CheckCircle size={12} />,
  rejeitou: <XCircle size={12} />,
  perdido: <XCircle size={12} />,
}

export default function FunnelProgressBar({ data, total }: FunnelProgressBarProps) {
  if (total === 0) return null

  // Calculate worked leads (anything not 'novo')
  const worked = data.filter((d) => d.status !== 'novo').reduce((sum, d) => sum + d.count, 0)
  const workedPct = (worked / total) * 100

  return (
    <div>
      {/* Overall progress */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
          Progresso do Funil
        </span>
        <span style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>
          {workedPct.toFixed(0)}%
          <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)', marginLeft: '4px' }}>
            trabalhados
          </span>
        </span>
      </div>

      {/* Stacked bar */}
      <div style={{ display: 'flex', height: '12px', borderRadius: '6px', overflow: 'hidden', background: 'var(--bg-elevated)', gap: '1px' }}>
        {data
          .filter((d) => d.count > 0)
          .map((d) => {
            const pct = (d.count / total) * 100
            return (
              <div
                key={d.status}
                title={`${COLUNAS_FUNIL.find((c) => c.id === d.status)?.label}: ${d.count} (${pct.toFixed(1)}%)`}
                style={{
                  width: `${pct}%`,
                  background: FUNNEL_COLORS[d.status],
                  transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                  minWidth: d.count > 0 ? '4px' : '0',
                }}
              />
            )
          })}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '12px' }}>
        {data
          .filter((d) => d.count > 0)
          .map((d) => (
            <div key={d.status} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: FUNNEL_COLORS[d.status] }} />
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                {COLUNAS_FUNIL.find((c) => c.id === d.status)?.label}
              </span>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {d.count}
              </span>
            </div>
          ))}
      </div>
    </div>
  )
}
