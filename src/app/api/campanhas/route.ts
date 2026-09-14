import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { processMessageTemplate } from '@/lib/spintax';

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('campanhas')
    .select('*, scripts!script_id(nome)')
    .order('criado_em', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Pegar estatísticas da fila para cada campanha
  const statsPromessas = data.map(async (campanha) => {
    const { data: fila, error: filaError } = await supabase
      .from('fila_disparos')
      .select('status')
      .eq('campanha_id', campanha.id);

    if (filaError) return { ...campanha, stats: { total: 0, pendentes: 0, enviados: 0, erros: 0 } };

    const stats = {
      total: fila.length,
      pendentes: fila.filter((f) => f.status === 'pendente').length,
      processando: fila.filter((f) => f.status === 'processando').length,
      enviados: fila.filter((f) => f.status === 'enviado').length,
      erros: fila.filter((f) => f.status === 'erro').length,
    };
    return { ...campanha, stats };
  });

  const campanhasComStats = await Promise.all(statsPromessas);

  return NextResponse.json(campanhasComStats);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const body = await request.json();
  const { nome, script_id, script_pitch_id, lead_ids } = body;

  if (!nome || !script_id || !script_pitch_id || !lead_ids || !lead_ids.length) {
    return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
  }

  try {
    // 1. Criar a campanha
    const { data: campanha, error: campanhaError } = await supabase
      .from('campanhas')
      .insert({ nome, script_id, script_pitch_id, status: 'ativa' })
      .select()
      .single();

    if (campanhaError) throw campanhaError;

    // 2. Buscar o texto do script
    const { data: script, error: scriptError } = await supabase
      .from('scripts')
      .select('texto')
      .eq('id', script_id)
      .single();

    if (scriptError) throw scriptError;

    // 3. Buscar os leads selecionados (para ter o nome e outros dados para as variáveis)
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('id, nome, telefone, cidade, segmento, notas_gerais, instagram_url')
      .in('id', lead_ids);

    if (leadsError) throw leadsError;

    // 4. Preparar as mensagens para a fila com agendamento estocástico
    const filaInsertions = leads.map((lead, index) => {
      // Resolve Spintax e Variáveis
      const mensagemFinal = processMessageTemplate(script.texto, {
        nome: lead.nome.split(' ')[0], // Pega apenas o primeiro nome
        nome_empresa: lead.nome, // Para cenários B2B onde o nome cadastrado é a empresa
        empresa: lead.nome, // Mantido por compatibilidade
        cidade: lead.cidade || '',
        especialidade: lead.segmento || '',
        nicho: lead.segmento || '',
        instagram: lead.instagram_url || '',
        observacao_personalizada: lead.notas_gerais || '',
        diferencial: lead.notas_gerais || '' // pode usar no lugar da observacao
      });

      // Lógica de espaçamento:
      // Cada envio vai ter um delay de 1 a 2 minutos entre eles.
      const minutosDelay = index * (Math.floor(Math.random() * 2) + 1); // 1 a 2 minutos
      const agendadoPara = new Date();
      agendadoPara.setMinutes(agendadoPara.getMinutes() + minutosDelay);

      return {
        campanha_id: campanha.id,
        lead_id: lead.id,
        mensagem_processada: mensagemFinal,
        status: 'pendente',
        agendado_para: agendadoPara.toISOString(),
      };
    });

    // 5. Inserir na fila de disparos
    const { error: filaError } = await supabase
      .from('fila_disparos')
      .insert(filaInsertions);

    if (filaError) throw filaError;

    return NextResponse.json({ success: true, campanha }, { status: 201 });
  } catch (error: any) {
    console.error('Erro ao criar campanha:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
