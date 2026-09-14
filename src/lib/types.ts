export type StatusFunil =
  | 'novo'
  | 'contatado'
  | 'respondeu_conexao'
  | 'pitch_enviado'
  | 'respondeu'
  | 'rejeitou'
  | 'demo-enviada'
  | 'follow-up'
  | 'reuniao-marcada'
  | 'fechado'
  | 'perdido'

export type Segmento =
  | 'pet-comercio'
  | 'pet-servico'
  | 'pet-ambos'
  | 'salao'
  | 'estetica'
  | 'clinica-estetica'
  | 'dentista'
  | 'advogado'
  | 'corretor'
  | 'oficina-mecanica'
  | 'barbeiro'
  | 'oficina-estetica-automotiva'
  | 'psicologo'
  | 'tatuagem'
  | 'pilates'
  | 'alimentacao'
  | 'outro'

export type StatusSite = 'sem-site' | 'linktree' | 'site-quebrado' | 'site-ok'
export type InstagramAtivo = 'sim' | 'nao' | 'nao-verificado'
export type Canal = 'whatsapp-pessoal' | 'whatsapp-business' | 'outro'
export type CategoriaScript = 'abordagem' | 'demo' | 'follow-up' | 'breakup' | 'resposta' | 'outro'

export interface Lead {
  id: string
  nome: string
  telefone: string
  bairro: string | null
  cidade: string
  segmento: Segmento | null
  avaliacoes_google: number
  nota_google: number | null
  status_site: StatusSite
  website: string | null
  instagram_url: string | null
  instagram_ativo: InstagramAtivo
  status_funil: StatusFunil
  contatado_em: string | null
  follow_up_em: string | null
  criado_em: string
  ultima_interacao_em: string | null
  notas_gerais: string | null
  tags: string[]
}

export interface Campanha {
  id: string
  nome: string
  script_id: string
  script_pitch_id: string | null
  status: 'rascunho' | 'ativa' | 'pausada' | 'concluida'
  criado_em: string
  atualizado_em: string
  scripts?: { nome: string } // para queries com join
  stats?: {
    total: number
    pendentes: number
    processando: number
    enviados: number
    erros: number
  }
}

export interface FilaDisparo {
  id: string
  campanha_id: string
  lead_id: string
  mensagem_processada: string
  status: 'pendente' | 'processando' | 'enviado' | 'erro'
  agendado_para: string
  processado_em: string | null
  erro_log: string | null
  criado_em: string
}

export interface Interacao {
  id: string
  lead_id: string
  data: string
  canal: Canal | null
  script_usado: string | null
  notas: string | null
  status_resultante: string | null
}

export interface Script {
  id: string
  nome: string
  categoria: CategoriaScript
  texto: string
  criado_em: string
}

export const COLUNAS_FUNIL: { id: StatusFunil; label: string; cor: string }[] = [
  { id: 'novo', label: 'Novo', cor: 'bg-slate-500' },
  { id: 'contatado', label: 'Contatado', cor: 'bg-blue-500' },
  { id: 'respondeu_conexao', label: 'Resp. Conexão', cor: 'bg-sky-500' },
  { id: 'pitch_enviado', label: 'Pitch Enviado', cor: 'bg-indigo-500' },
  { id: 'respondeu', label: 'Respondeu', cor: 'bg-cyan-500' },
  { id: 'demo-enviada', label: 'Demo Enviada', cor: 'bg-violet-500' },
  { id: 'follow-up', label: 'Follow-up', cor: 'bg-amber-500' },
  { id: 'reuniao-marcada', label: 'Reunião Marcada', cor: 'bg-orange-500' },
  { id: 'fechado', label: 'Fechado ✓', cor: 'bg-emerald-500' },
  { id: 'rejeitou', label: 'Rejeitou', cor: 'bg-rose-500' },
  { id: 'perdido', label: 'Perdido', cor: 'bg-red-500' },
]

export const SEGMENTO_LABELS: Record<Segmento, string> = {
  'pet-comercio': 'Pet Comércio',
  'pet-servico': 'Pet Serviço',
  'pet-ambos': 'Pet (ambos)',
  salao: 'Salão',
  estetica: 'Estética',
  'clinica-estetica': 'Clínica de Estética',
  dentista: 'Dentista',
  advogado: 'Advogado',
  corretor: 'Corretor',
  'oficina-mecanica': 'Oficina Mecânica',
  barbeiro: 'Barbeiro',
  'oficina-estetica-automotiva': 'Estética Automotiva',
  psicologo: 'Psicólogo/Terapeuta',
  tatuagem: 'Tatuagem',
  pilates: 'Pilates/Crossfit',
  alimentacao: 'Alimentação Artesanal',
  outro: 'Outro',
}

export const SEGMENTO_CORES: Record<Segmento, string> = {
  'pet-comercio': 'seg-pet-comercio',
  'pet-servico': 'seg-pet-servico',
  'pet-ambos': 'seg-pet-ambos',
  salao: 'seg-salao',
  estetica: 'seg-estetica',
  'clinica-estetica': 'seg-estetica',
  dentista: 'seg-dentista',
  advogado: 'seg-advogado',
  corretor: 'seg-corretor',
  'oficina-mecanica': 'seg-oficina-mecanica',
  barbeiro: 'seg-barbeiro',
  'oficina-estetica-automotiva': 'seg-estetica-automotiva',
  psicologo: 'seg-advogado',
  tatuagem: 'seg-outro',
  pilates: 'seg-pet-comercio',
  alimentacao: 'seg-oficina-mecanica',
  outro: 'seg-outro',
}

// Cores inline para usar em contextos que não suportam className
export const SEGMENTO_INLINE_CORES: Record<Segmento, { bg: string; text: string; border: string }> = {
  'pet-comercio': { bg: 'rgba(34,197,94,0.15)', text: '#22c55e', border: 'rgba(34,197,94,0.3)' },
  'pet-servico': { bg: 'rgba(16,185,129,0.15)', text: '#10b981', border: 'rgba(16,185,129,0.3)' },
  'pet-ambos': { bg: 'rgba(20,184,166,0.15)', text: '#14b8a6', border: 'rgba(20,184,166,0.3)' },
  salao: { bg: 'rgba(236,72,153,0.15)', text: '#ec4899', border: 'rgba(236,72,153,0.3)' },
  estetica: { bg: 'rgba(244,63,94,0.15)', text: '#f43f5e', border: 'rgba(244,63,94,0.3)' },
  'clinica-estetica': { bg: 'rgba(244,63,94,0.15)', text: '#f43f5e', border: 'rgba(244,63,94,0.3)' },
  dentista: { bg: 'rgba(14,165,233,0.15)', text: '#0ea5e9', border: 'rgba(14,165,233,0.3)' },
  advogado: { bg: 'rgba(99,102,241,0.15)', text: '#6366f1', border: 'rgba(99,102,241,0.3)' },
  corretor: { bg: 'rgba(245,158,11,0.15)', text: '#f59e0b', border: 'rgba(245,158,11,0.3)' },
  'oficina-mecanica': { bg: 'rgba(249,115,22,0.15)', text: '#f97316', border: 'rgba(249,115,22,0.3)' },
  barbeiro: { bg: 'rgba(168,85,247,0.15)', text: '#a855f7', border: 'rgba(168,85,247,0.3)' },
  'oficina-estetica-automotiva': { bg: 'rgba(6,182,212,0.15)', text: '#06b6d4', border: 'rgba(6,182,212,0.3)' },
  psicologo: { bg: 'rgba(99,102,241,0.15)', text: '#6366f1', border: 'rgba(99,102,241,0.3)' },
  tatuagem: { bg: 'rgba(15,23,42,0.15)', text: '#0f172a', border: 'rgba(15,23,42,0.3)' },
  pilates: { bg: 'rgba(34,197,94,0.15)', text: '#22c55e', border: 'rgba(34,197,94,0.3)' },
  alimentacao: { bg: 'rgba(249,115,22,0.15)', text: '#f97316', border: 'rgba(249,115,22,0.3)' },
  outro: { bg: 'rgba(100,116,139,0.15)', text: '#64748b', border: 'rgba(100,116,139,0.3)' },
}
