import { setTimeout } from 'timers/promises';

const API_URL = 'http://localhost:3000/api/process-queue';

console.log('🤖 Worker de Disparo Iniciado!');
console.log(`📡 Monitorando a fila em: ${API_URL}\n`);

async function runWorker() {
  while (true) {
    try {
      // Faz o POST para processar 1 mensagem
      const response = await fetch(API_URL, { method: 'POST' });
      const data = await response.json();

      if (response.ok) {
        if (data.message === 'Nenhuma mensagem pendente na fila.') {
          // Fila vazia, aguarda 10 segundos antes de checar de novo
          process.stdout.write('.'); // Feedback visual de que está vivo
          await setTimeout(10000);
        } else if (data.success) {
          // Mensagem enviada com sucesso
          console.log(`\n✅ [ENVIADO] ${new Date().toLocaleTimeString()} - ${data.message}`);
          // Aguarda um curto intervalo antes de puxar a próxima, pois a própria API já tem o delay humano de 10~15s
          await setTimeout(2000);
        } else {
          console.log(`\n⚠️ [AVISO] ${new Date().toLocaleTimeString()} - ${JSON.stringify(data)}`);
          await setTimeout(5000);
        }
      } else {
        console.error(`\n❌ [ERRO API] ${new Date().toLocaleTimeString()} - ${JSON.stringify(data)}`);
        await setTimeout(10000);
      }
    } catch (error) {
      console.error(`\n🚨 [FALHA DE CONEXÃO] ${new Date().toLocaleTimeString()} - O servidor Next.js está rodando?`);
      await setTimeout(10000);
    }
  }
}

runWorker();
