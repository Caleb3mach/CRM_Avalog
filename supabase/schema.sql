-- ================================================================
-- CRM Machado Soluções Digitais — Schema completo
-- Execute no SQL Editor do Supabase
-- ================================================================

-- Habilitar extensão uuid
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================================
-- TABELA: leads
-- ================================================================
CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  telefone text UNIQUE NOT NULL,
  bairro text,
  cidade text DEFAULT 'Rio de Janeiro',
  segmento text CHECK (segmento IN (
    'pet-comercio','pet-servico','pet-ambos',
    'salao','estetica','dentista','advogado',
    'corretor','oficina-mecanica','barbeiro',
    'oficina-estetica-automotiva','outro'
  )),
  avaliacoes_google int DEFAULT 0,
  nota_google numeric(2,1),
  status_site text DEFAULT 'sem-site' CHECK (status_site IN (
    'sem-site','linktree','site-quebrado','site-ok'
  )),
  instagram_url text,
  instagram_ativo text DEFAULT 'nao-verificado' CHECK (
    instagram_ativo IN ('sim','nao','nao-verificado')
  ),
  status_funil text DEFAULT 'novo' CHECK (status_funil IN (
    'novo','contatado','respondeu','demo-enviada',
    'follow-up','reuniao-marcada','fechado','perdido'
  )),
  contatado_em timestamptz,
  follow_up_em timestamptz,
  criado_em timestamptz DEFAULT now(),
  ultima_interacao_em timestamptz,
  notas_gerais text,
  tags text[] DEFAULT '{}'::text[]
);

-- ================================================================
-- TABELA: interacoes
-- ================================================================
CREATE TABLE IF NOT EXISTS interacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES leads(id) ON DELETE CASCADE NOT NULL,
  data timestamptz DEFAULT now(),
  canal text CHECK (canal IN (
    'whatsapp-pessoal','whatsapp-business','outro'
  )),
  script_usado text,
  notas text,
  status_resultante text
);

-- ================================================================
-- TABELA: scripts
-- ================================================================
CREATE TABLE IF NOT EXISTS scripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  categoria text CHECK (categoria IN (
    'abordagem','demo','follow-up','breakup','resposta','outro'
  )),
  texto text NOT NULL,
  criado_em timestamptz DEFAULT now()
);

-- ================================================================
-- TABELA: campanhas
-- ================================================================
CREATE TABLE IF NOT EXISTS campanhas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  script_id uuid REFERENCES scripts(id),
  status text DEFAULT 'rascunho' CHECK (status IN (
    'rascunho','ativa','pausada','concluida'
  )),
  criado_em timestamptz DEFAULT now(),
  atualizado_em timestamptz DEFAULT now()
);

-- ================================================================
-- TABELA: fila_disparos
-- ================================================================
CREATE TABLE IF NOT EXISTS fila_disparos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campanha_id uuid REFERENCES campanhas(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES leads(id) ON DELETE CASCADE,
  mensagem_processada text NOT NULL,
  status text DEFAULT 'pendente' CHECK (status IN (
    'pendente','processando','enviado','erro'
  )),
  agendado_para timestamptz NOT NULL,
  processado_em timestamptz,
  erro_log text,
  criado_em timestamptz DEFAULT now()
);

-- ================================================================
-- ÍNDICES
-- ================================================================
CREATE INDEX IF NOT EXISTS idx_leads_status_funil ON leads(status_funil);
CREATE INDEX IF NOT EXISTS idx_leads_ultima_interacao ON leads(ultima_interacao_em);
CREATE INDEX IF NOT EXISTS idx_leads_contatado_em ON leads(contatado_em);
CREATE INDEX IF NOT EXISTS idx_leads_follow_up_em ON leads(follow_up_em);
CREATE INDEX IF NOT EXISTS idx_leads_segmento ON leads(segmento);
CREATE INDEX IF NOT EXISTS idx_interacoes_lead_id ON interacoes(lead_id, data);

-- Índices compostos para queries de dashboard (performance)
CREATE INDEX IF NOT EXISTS idx_leads_status_ultima ON leads(status_funil, ultima_interacao_em DESC);
CREATE INDEX IF NOT EXISTS idx_leads_segmento_status ON leads(segmento, status_funil);

-- ================================================================
-- ROW LEVEL SECURITY
-- ================================================================
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE interacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE campanhas ENABLE ROW LEVEL SECURITY;
ALTER TABLE fila_disparos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all leads" ON leads FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all interacoes" ON interacoes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all scripts" ON scripts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all campanhas" ON campanhas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all fila_disparos" ON fila_disparos FOR ALL USING (true) WITH CHECK (true);

-- ================================================================
-- SEED: Scripts reais de prospecção
-- ================================================================
INSERT INTO scripts (nome, categoria, texto) VALUES

('1A — Pet shop / Boutique', 'abordagem',
'Olá, boa tarde! Consegue passar essa mensagem pro dono(a)?
Sou o Calebe, moro aqui em São João de Meriti e trabalho criando sites e sistemas de agendamento pra negócios locais. Fui procurar o site e a agenda de vocês pra reservar um banho, mas não encontrei nada além do Google Maps.
Criei uma versão rápida de como ficaria o site de vocês, já com a cara da marca. Faço isso como serviço — a demonstração eu mando sem custo, e se fizer sentido pra vocês a gente conversa sobre deixar no ar de verdade.
Posso te mandar? Envio em 24h!'),

('1B — Saúde / Estética / Salão', 'abordagem',
'Oi, [Nome do negócio]! Tudo bem?
Pesquisei vocês no Google pra ver os serviços e tentar marcar um horário, mas não encontrei um site oficial — só as redes sociais.
As avaliações de vocês são ótimas, então imagino que estejam perdendo clientes que buscam marcar direto pela internet sem falar com ninguém.
Trabalho criando sites e agendamento online pra negócios como o de vocês. Montei uma demonstração de como ficaria — é sem custo, e serve só pra vocês visualizarem o potencial. Se fizer sentido, a gente conversa sobre a versão completa.
Posso te mandar o link?'),

('1C — Corretor de Imóveis', 'abordagem',
'Oi, [Nome]! Tudo bem?
Vi seus imóveis anunciados só em portais como OLX/Imovelweb. Isso significa que o lead que chega até você também está vendo o anúncio do concorrente do lado.
Crio sites próprios pra corretores, onde o cliente cai direto no seu WhatsApp, sem concorrência ao lado. Montei uma demonstração de como ficaria pra você — sem custo nenhum agora. Se fizer sentido, a gente vê os próximos passos.
Posso te mandar?'),

('1D — Oficina Mecânica', 'abordagem',
'Oi, [Nome]! Tudo bem?
Vi que o agendamento de vocês é só por ligação e WhatsApp. Sei que isso interrompe o serviço toda hora que toca o celular.
Crio sites com agendamento online pra oficinas, o cliente escolhe o serviço e o horário sozinho. Montei uma demonstração rápida de como ficaria — sem custo. Se fizer sentido pra vocês, a gente conversa sobre implementar de verdade.
Posso mandar o link?'),

('1E — Estética Automotiva', 'abordagem',
'Oi, [Nome]! Tudo bem?
Vi que vocês fazem um trabalho incrível com estética automotiva — polimento, vitrificação, PPF... Os resultados nos reviews do Google são ótimos!
Mas percebi que vocês não têm um site profissional pra agendar serviços online. Hoje em dia, o cliente que busca "estética automotiva perto de mim" quer ver portfólio e agendar na hora, sem precisar ligar.
Crio sites com agendamento e galeria de antes/depois pra negócios como o de vocês. Montei uma demonstração rápida — sem custo. Se fizer sentido, a gente conversa.
Posso mandar o link?'),

('Envio da Demo', 'demo',
'Boa noite!!
Aqui está a demonstração: [link]
Pra melhor experiência, acesse pelo notebook e pelo celular — o site está com design pensado pras duas telas!
Foquei em deixar o design moderno, com a identidade visual do Instagram e da marca de vocês bem visível, facilitando a vida do cliente de vocês.
Se puder dar uma olhada de 2 minutos, me avise o que achou. Conseguimos colocar uma versão completa no ar essa semana, com base nos apontamentos e fotos de vocês.
Faz sentido pra vocês? Qual o melhor horário pra falarmos rapidinho sobre a personalização e como seria a entrega?'),

('Follow-up', 'follow-up',
'Oi, [Nome]! Aqui é o Calebe, te chamei semana passada sobre o site/agendamento de vocês.
Imagino que a rotina aí seja corrida — por isso mesmo montei aquela demonstração pra mostrar como um site no Google atrai cliente no automático, enquanto você foca no atendimento.
Posso te mandar o link agora?'),

('Breakup', 'breakup',
'Oi, [Nome]! Tudo bem?
Como não tive retorno, imagino que o momento aí esteja corrido ou que ter um site não seja prioridade agora. Sem problemas!
Vou arquivar o modelo que desenhei pro negócio de vocês pra liberar espaço nos meus servidores. Se no futuro quiserem posicionar a empresa no topo do Google e automatizar os agendamentos, é só me chamar.
Sucesso com as vendas! Abraço.'),

('Resposta — Dúvida sobre gratuidade', 'resposta',
'Fica tranquilo(a)! A demonstração eu crio sem custo mesmo, é minha forma de mostrar o trabalho. Só a versão completa no ar (com domínio próprio, ajustada com fotos e informações reais de vocês) é que é o serviço pago — aí a gente conversa valores só se fizer sentido pra vocês.');
