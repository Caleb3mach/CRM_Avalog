const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || '';
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || '';
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE_NAME || '';

type SendMessageParams = {
  number: string;
  text: string;
  delayMs?: number;
};

export async function sendEvolutionMessage({ number, text, delayMs = 1500 }: SendMessageParams) {
  if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY || !EVOLUTION_INSTANCE) {
    throw new Error('Configurações da Evolution API ausentes nas variáveis de ambiente.');
  }

  // O Evolution API exige o número com o DDI (ex: 5521999999999)
  let formattedNumber = number.replace(/\D/g, '');
  
  // Limpar DDD com zero (ex: 02199999999)
  if (formattedNumber.startsWith('0')) {
    formattedNumber = formattedNumber.substring(1);
  }
  
  // Se tiver só DDD + Número (10 ou 11 dígitos), coloca o 55 do Brasil
  if (formattedNumber.length === 10 || formattedNumber.length === 11) {
    formattedNumber = `55${formattedNumber}`;
  }

  try {
    // A API Evolution V2 já possui a opção de delay e presence no próprio envio de texto.
    // Remover a chamada dupla evita bugs de false positive ou desconexão por rate limit.
    
    // Passo 2: Enviar a mensagem
    const response = await fetch(`${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY,
      },
      body: JSON.stringify({
        number: formattedNumber,
        text: text,
        options: {
          delay: delayMs,
          linkPreview: true,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro ao enviar mensagem: ${response.status} - ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Evolution API Error:', error);
    throw error;
  }
}
