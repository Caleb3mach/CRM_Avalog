import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendEvolutionMessage } from '@/lib/evolution-api';

// Configurando o cliente Supabase com a Service Role Key para ignorar RLS na API de background
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: Request) {
  // Opcional: Adicionar autenticação via Bearer token para proteger esta rota
  // const authHeader = request.headers.get('authorization');
  // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) return new NextResponse('Unauthorized', { status: 401 });

  try {
    // 1. Buscar UMA mensagem pendente na fila cujo horário já chegou
    const { data: mensagens, error: fetchError } = await supabase
      .from('fila_disparos')
      .select(`
        id,
        mensagem_processada,
        lead_id,
        leads ( telefone, nome, status_funil )
      `)
      .eq('status', 'pendente')
      .lte('agendado_para', new Date().toISOString())
      .order('agendado_para', { ascending: true })
      .limit(1);

    if (fetchError) {
      console.error('Erro ao buscar fila:', fetchError);
      return NextResponse.json({ error: 'Erro ao acessar banco de dados' }, { status: 500 });
    }

    if (!mensagens || mensagens.length === 0) {
      return NextResponse.json({ message: 'Nenhuma mensagem pendente na fila.' }, { status: 200 });
    }

    const disparo = mensagens[0];

    // Verifica se os dados do lead vieram corretamente (se foi um join bem sucedido)
    const leadData = Array.isArray(disparo.leads) ? disparo.leads[0] : disparo.leads;
    if (!leadData || !leadData.telefone) {
      // Falha ao obter o número do lead
      await supabase
        .from('fila_disparos')
        .update({ status: 'erro', erro_log: 'Número de telefone do lead não encontrado' })
        .eq('id', disparo.id);
      return NextResponse.json({ error: 'Número não encontrado para o lead' }, { status: 400 });
    }

    // 2. Marcar como "processando" para evitar duplicidade caso a rota seja chamada 2x muito rápido
    await supabase
      .from('fila_disparos')
      .update({ status: 'processando' })
      .eq('id', disparo.id);

    try {
      // 3. Enviar mensagem via Evolution API
      // delay randomico entre 10 e 15 segundos para simular digitação realística
      const delayMs = Math.floor(Math.random() * (15000 - 10000 + 1)) + 10000; 

      await sendEvolutionMessage({
        number: leadData.telefone,
        text: disparo.mensagem_processada,
        delayMs: delayMs
      });

      // 4. Marcar como "enviado"
      await supabase
        .from('fila_disparos')
        .update({ 
          status: 'enviado',
          processado_em: new Date().toISOString()
        })
        .eq('id', disparo.id);

      // Descobre se essa mensagem que acabou de enviar era o pitch (A flag que colocamos no webhook)
      // Como a flag is_pitch não existe nativamente no schema, podemos inferir pelo status_funil atual do lead
      // Se ele for respondeu_conexao, essa mensagem era o pitch.
      const isPitch = leadData.status_funil === 'respondeu_conexao';

      // Também registra na tabela de interacoes
      await supabase.from('interacoes').insert({
        lead_id: disparo.lead_id,
        canal: 'whatsapp-business', // ou evolution
        script_usado: disparo.mensagem_processada,
        notas: isPitch ? 'Disparo do Pitch Automático' : 'Disparo via campanha automatizada',
        status_resultante: isPitch ? 'pitch_enviado' : 'contatado'
      });
      
      // Atualizar o status do lead apenas se for um avanço lógico
      if (isPitch) {
        await supabase.from('leads').update({
          status_funil: 'pitch_enviado',
          ultima_interacao_em: new Date().toISOString()
        }).eq('id', disparo.lead_id);
      } else if (leadData.status_funil === 'novo' || !leadData.status_funil) {
        // Só muda pra contatado se ele era novo (não rebaixa um lead que já tava lá na frente)
        await supabase.from('leads').update({
          status_funil: 'contatado',
          contatado_em: new Date().toISOString(),
          ultima_interacao_em: new Date().toISOString()
        }).eq('id', disparo.lead_id);
      }

      return NextResponse.json({ success: true, message: 'Mensagem enviada com sucesso.' }, { status: 200 });

    } catch (sendError: any) {
      // 5. Em caso de erro na API de envio, marcar como erro
      console.error('Erro no Evolution API:', sendError);
      await supabase
        .from('fila_disparos')
        .update({ 
          status: 'erro',
          erro_log: sendError.message || JSON.stringify(sendError)
        })
        .eq('id', disparo.id);

      return NextResponse.json({ error: 'Erro ao enviar mensagem', details: sendError.message }, { status: 500 });
    }

  } catch (error) {
    console.error('Erro na rota de processamento:', error);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}
