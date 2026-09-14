import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { processMessageTemplate } from '@/lib/spintax';
import fs from 'fs';
import path from 'path';

function logDebug(message: string, data?: any) {
  try {
    const logPath = path.join(process.cwd(), 'webhook-debug.log');
    const time = new Date().toISOString();
    const dataStr = data ? JSON.stringify(data) : '';
    fs.appendFileSync(logPath, `[${time}] ${message} ${dataStr}\n`);
  } catch (e) { }
}

// Usamos o client com Service Role para ignorar o RLS
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    logDebug('Webhook recebido:', body?.event);

    // Verificando se é um evento válido do Evolution API
    // Na V2 o formato do webhook vem como event, e o body dentro de data
    const eventType = body.event?.toLowerCase();
    
    // Ignora eventos que não sejam de mensagens recebidas
    if (eventType !== 'messages.upsert') {
      return NextResponse.json({ success: true, message: 'Ignorado' });
    }

    logDebug('MESSAGES.UPSERT body.data:', body.data);

    const { data } = body;
    
    // A estrutura do Evolution API pode retornar 'data' como array ou objeto.
    let messageItem = Array.isArray(data) ? data[0] : data;
    
    // Em algumas versões, os dados estão dentro de 'message'
    const messageData = messageItem?.message?.key ? messageItem.message : messageItem;
    
    const messageInfo = messageData?.message;
    const remoteJid = messageData?.key?.remoteJid;
    const fromMe = messageData?.key?.fromMe;
    
    if (!remoteJid) {
      logDebug('Sem remoteJid na mensagem', messageData);
      return NextResponse.json({ success: false, message: 'Sem remoteJid' });
    }

    // Ignora mensagens enviadas pelo próprio robô (fromMe: true)
    // E ignora mensagens de grupos (@g.us)
    if (fromMe || remoteJid.includes('@g.us')) {
      logDebug(`Ignorado fromMe=${fromMe} remoteJid=${remoteJid}`);
      return NextResponse.json({ success: true, message: 'Mensagem do próprio bot ou de grupo ignorada' });
    }

    // Pega o número do lead limpo (apenas os dígitos do remoteJid)
    const numeroLimpo = remoteJid.split('@')[0];
    
    // Pega o texto da mensagem recebida
    let messageText = '';
    if (messageInfo?.conversation) {
      messageText = messageInfo.conversation;
    } else if (messageInfo?.extendedTextMessage?.text) {
      messageText = messageInfo.extendedTextMessage.text;
    }

    if (!messageText) {
      return NextResponse.json({ success: true, message: 'Sem texto na mensagem' });
    }

    // =====================================
    // REGRA DE NEGÓCIO: Buscar o Lead no CRM
    // =====================================
    
    // O número recebido costuma ter o DDI + DDI (ex: 5521999999999).
    // Faremos um 'ilike' (contains) para contornar problemas de máscara no BD.
    const { data: leads, error: leadError } = await supabase
      .from('leads')
      .select('id, nome, status_funil, cidade, segmento, notas_gerais, instagram_url')
      .ilike('telefone', `%${numeroLimpo.substring(numeroLimpo.length - 8)}%`)
      .limit(1);

    if (leadError || !leads || leads.length === 0) {
      logDebug(`Lead não encontrado. Erro:`, leadError || `Nenhum lead com final ${numeroLimpo.substring(numeroLimpo.length - 8)}`);
      return NextResponse.json({ success: true, message: 'Lead não encontrado no CRM' });
    }

    const lead = leads[0];
    logDebug(`Lead Encontrado: ${lead.nome} | Status Atual: ${lead.status_funil}`);

    // =====================================
    // TRAVA 1: Máquina de Estados Anti-Loop
    // Só prossegue se o status for 'contatado' ou 'pitch_enviado'
    // =====================================
    if (lead.status_funil !== 'contatado' && lead.status_funil !== 'pitch_enviado') {
      // Se não for nenhum desses, o lead apenas mandou outra mensagem no meio de outro processo. 
      // Não engatilhamos a automação, mas atualizamos o lead_interacao.
      await supabase.from('leads').update({ ultima_interacao_em: new Date().toISOString() }).eq('id', lead.id);
      return NextResponse.json({ success: true, message: `Status atual é ${lead.status_funil}. Nenhuma ação automática.` });
    }

    // =====================================
    // TRAVA 2: Filtro de Rejeição Básica
    // =====================================
    const textLower = messageText.toLowerCase();
    const rejectRegex = /(n[aã]o|para|remover|quem [eé]|sai|denunciar)/i;
    
    if (rejectRegex.test(textLower)) {
      // É uma possível rejeição! Muda o status para rejeitou e encerra o ciclo aqui.
      await supabase
        .from('leads')
        .update({ status_funil: 'rejeitou', ultima_interacao_em: new Date().toISOString() })
        .eq('id', lead.id);
        
      return NextResponse.json({ success: true, message: 'Mensagem classificada como rejeição. Status alterado.' });
    }

    // =====================================
    // TRAVA 3: Captura de Resposta ao Pitch
    // =====================================
    if (lead.status_funil === 'pitch_enviado') {
      await supabase
        .from('leads')
        .update({ status_funil: 'respondeu', ultima_interacao_em: new Date().toISOString() })
        .eq('id', lead.id);
      return NextResponse.json({ success: true, message: 'Lead respondeu ao pitch! Movido para a etapa: respondeu.' });
    }

    // =====================================
    // SUCESSO! Lead respondeu positivamente.
    // Avançar status para 'respondeu_conexao' e engatilhar Pitch.
    // =====================================

    // 1. Atualizar o status do lead
    await supabase
      .from('leads')
      .update({ status_funil: 'respondeu_conexao', ultima_interacao_em: new Date().toISOString() })
      .eq('id', lead.id);

    // 2. Descobrir qual Campanha originou esse contato para pegar o script_pitch_id
    // Pegamos o último disparo da fila para este lead
    const { data: filas } = await supabase
      .from('fila_disparos')
      .select('campanha_id')
      .eq('lead_id', lead.id)
      .order('criado_em', { ascending: false })
      .limit(1);

    if (filas && filas.length > 0) {
      const campanhaId = filas[0].campanha_id;
      
      const { data: campanhaInfo } = await supabase
        .from('campanhas')
        .select('script_pitch_id')
        .eq('id', campanhaId)
        .single();
      
      if (campanhaInfo && campanhaInfo.script_pitch_id) {
        
        // Buscar o conteúdo do script
        const { data: scriptInfo } = await supabase
          .from('scripts')
          .select('texto')
          .eq('id', campanhaInfo.script_pitch_id)
          .single();

        if (scriptInfo && scriptInfo.texto) {
          const mensagemFinal = processMessageTemplate(scriptInfo.texto, {
            nome: lead.nome ? lead.nome.split(' ')[0] : '', // Pega apenas o primeiro nome
            nome_empresa: lead.nome || '',
            empresa: lead.nome || '',
            cidade: lead.cidade || '',
            especialidade: lead.segmento || '',
            nicho: lead.segmento || '',
            instagram: lead.instagram_url || '',
            observacao_personalizada: lead.notas_gerais || '',
            diferencial: lead.notas_gerais || ''
          });

          logDebug(`Pitch processado. Enfileirando mensagem para campanha ${campanhaId}`);
          
          // Enfileira a segunda mensagem (Pitch) para disparar em breve (ex: 20 seg a partir de agora)
          const agendadoPara = new Date();
          agendadoPara.setSeconds(agendadoPara.getSeconds() + 20); // Delay simulando tempo humano pra "pensar"

          await supabase.from('fila_disparos').insert({
            campanha_id: campanhaId,
            lead_id: lead.id,
            status: 'pendente',
            mensagem_processada: mensagemFinal,
            agendado_para: agendadoPara.toISOString()
            // is_pitch não precisa, pois o process-queue já infere isso pelo status_funil = 'respondeu_conexao'
          });
          logDebug(`Sucesso! Fila_disparos inserida.`);
        } else {
          logDebug(`Erro: Script não encontrado ou vazio.`);
        }
      } else {
         logDebug(`Erro: Campanha ${campanhaId} sem script_pitch_id.`);
      }
    } else {
      logDebug(`Erro: Nenhuma fila de disparo anterior encontrada para o lead ${lead.id}.`);
    }

    return NextResponse.json({ success: true, message: 'Resposta recebida. Pitch enfileirado com sucesso!' });

  } catch (error) {
    console.error('Erro no webhook:', error);
    return NextResponse.json({ error: 'Erro interno no processamento do webhook' }, { status: 500 });
  }
}
