import { formatDistanceToNow, differenceInDays, differenceInHours } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { type StatusFunil, type Segmento } from './types'

export function formatarDistancia(data: string | null): string {
  if (!data) return 'Nunca'
  return formatDistanceToNow(new Date(data), { addSuffix: true, locale: ptBR })
}

export function diasDesdeContato(data: string | null): number {
  if (!data) return 0
  return differenceInDays(new Date(), new Date(data))
}

export function horasDesdeContato(data: string | null): number {
  if (!data) return 0
  return differenceInHours(new Date(), new Date(data))
}

export function formatarTelefone(tel: string): string {
  const nums = tel.replace(/\D/g, '')
  if (nums.length === 11) {
    return `(${nums.slice(0, 2)}) ${nums.slice(2, 7)}-${nums.slice(7)}`
  }
  if (nums.length === 10) {
    return `(${nums.slice(0, 2)}) ${nums.slice(2, 6)}-${nums.slice(6)}`
  }
  return tel
}

export function whatsappLink(telefone: string): string {
  const nums = telefone.replace(/\D/g, '')
  const comCodigo = nums.startsWith('55') ? nums : `55${nums}`
  return `https://wa.me/${comCodigo}`
}

export function corDiasContato(dias: number): string {
  if (dias === 0) return 'dias-ok'
  if (dias <= 1) return 'dias-warn'
  if (dias <= 3) return 'dias-alert'
  return 'dias-danger'
}

export function statusFunilLabel(status: StatusFunil): string {
  const labels: Record<StatusFunil, string> = {
    novo: 'Novo',
    contatado: 'Contatado',
    'respondeu_conexao': 'Resp. Conexão',
    'pitch_enviado': 'Pitch Enviado',
    respondeu: 'Respondeu',
    'demo-enviada': 'Demo Enviada',
    'follow-up': 'Follow-up',
    'reuniao-marcada': 'Reunião Marcada',
    fechado: 'Fechado',
    rejeitou: 'Rejeitou',
    perdido: 'Perdido',
  }
  return labels[status]
}

import { SEGMENTO_LABELS } from './types'

export function segmentoLabel(segmento: Segmento | null): string {
  if (!segmento) return '—'
  return SEGMENTO_LABELS[segmento] || 'Outro'
}

export function canalLabel(canal: string | null): string {
  if (!canal) return '—'
  const labels: Record<string, string> = {
    'whatsapp-pessoal': 'WhatsApp Pessoal',
    'whatsapp-business': 'WhatsApp Business',
    outro: 'Outro',
  }
  return labels[canal] ?? canal
}

export function normalizarTelefone(tel: string): string {
  return tel.replace(/\D/g, '')
}
