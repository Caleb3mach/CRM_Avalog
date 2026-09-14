# Documentação e Pitch: CRM de Prospecção Outbound

## 1. Casos de Teste para o Fluxo do WhatsApp

Para garantir que a máquina de estados está robusta, execute estes cenários práticos com o número da sua namorada (lembre-se de mudar o status do lead dela manualmente para `novo` no banco de dados entre os testes ou criar leads falsos):

| Cenário | Ação do Lead (Namorada) | Comportamento Esperado do CRM |
| :--- | :--- | :--- |
| **1. Caminho Feliz Absoluto** | Responde "Oi, sou eu sim" para a 1ª msg. E responde "Quero sim" para a 2ª msg. | `novo` ➔ `contatado` ➔ `respondeu_conexao` ➔ Envia Pitch ➔ `pitch_enviado` ➔ `respondeu`. |
| **2. Rejeição na Abordagem** | Responde "Não sou eu" ou "Não tenho interesse". | O regex pega o "Não". Status muda de `contatado` ➔ `rejeitou`. O Pitch **não** entra na fila. |
| **3. Rejeição no Pitch** | Responde "Oi, sou eu" (recebe o pitch). Depois responde: "Não, obrigado". | Muda para `respondeu_conexao`, envia o pitch, muda para `pitch_enviado`. Ao receber o "Não", cai no regex e vai para `rejeitou`. |
| **4. Ansiedade (Múltiplas mensagens)** | Responde "Oi". Segundos depois manda "Quem é?". | A 1ª msg dispara a transição pra `respondeu_conexao`. A 2ª msg chega, o status já não é mais `contatado` nem `pitch_enviado`, então o CRM **ignora** e não envia 2 pitches. |
| **5. Áudio ou Imagem** | Envia uma figurinha, áudio ou imagem. | O CRM foi programado para ler texto (`conversation` ou `extendedTextMessage.text`). Como é mídia, ele não encontra texto, ignora o webhook e não quebra. |

---

## 2. Checklist de Inicialização Diária (Ambiente Local)

Para ligar o seu "Frankenstein" tecnológico amanhã e botar pra rodar, abra 4 abas no terminal e execute:

1. **Evolution API (Docker):**
   *(Se o Docker não iniciar junto com o Windows, abra o Docker Desktop).*
   `docker-compose up -d` (na pasta onde está o seu docker-compose da Evolution).
2. **Servidor do CRM (Next.js):**
   `npm run dev` (na raiz do projeto).
3. **Túnel Webhook (Ngrok):**
   `ngrok http 3000` (copie a URL HTTPS gerada e atualize no Evolution Manager se ela mudar, o Ngrok free muda a URL a cada reinício, a menos que você use um domínio estático gratuito deles).
4. **Motor de Disparos (Worker):**
   `node worker.mjs` (na raiz do projeto).

---

## 3. Visão de Negócios (Business Pitch)

**O que o projeto representa?**
É uma máquina de vendas Outbound (Prospecção Ativa) B2B focada em WhatsApp, que automatiza o "trabalho braçal e repetitivo" dos SDRs (Pré-vendas), entregando apenas os leads quentes (que já disseram "sim") para o fechamento humano.

**Dores Sanadas:**
- **Falta de tempo e alto Custo de SDR:** Um SDR humano perde 70% do tempo dizendo "Oi, tudo bem? É da empresa X?" e tomando vácuo. O CRM automatiza a triagem.
- **Bloqueios no WhatsApp:** O uso inteligente de *Spintax* `{Oi|Olá}` e o delay aleatório (Worker) simulam comportamento humano perfeitamente, drásticamente reduzindo a taxa de banimento.
- **Limitações da API Oficial (Meta):** A API oficial exige templates pré-aprovados e cobra por envio, inviabilizando prospecção fria agressiva.

**Potencial de Valor e Comercialização (Escala):**
Tem total aderência para se tornar um **SaaS B2B (Software as a Service)**. Agências de marketing, clínicas, e escritórios pagariam mensalidades (ex: R$ 497/mês) para ter essa esteira de aquecimento rodando. A escala se dá por "Instâncias" (cada cliente conecta seu próprio QR Code e roda suas próprias filas).

---

## 4. Visão Técnica para o CTO (Technical Pitch)

Nesta etapa, o CTO quer avaliar a sua capacidade de **tomada de decisão**, **visão arquitetural** e **conhecimento de escalabilidade**.

### Por que essas tecnologias no MVP?
* **Next.js (App Router):** Escolhido pela velocidade (Go-to-Market). Ter rotas de API (Backend) e Frontend (React) no mesmo repositório elimina o atrito inicial de CORS e deploys separados.
* **Supabase:** BaaS (Backend as a Service) baseado em PostgreSQL robusto. Acelera o desenvolvimento fornecendo Auth, Banco Relacional e APIs automáticas sem precisar escrever um CRUD monolítico no backend do zero.
* **Evolution API:** A joia da coroa. É open-source, construída em cima do Baileys. Permite enviar mensagens sem pagar a Meta por template, não engessa a copy e suporta simulação de presença (`composing`), crucial para evitar banimento.
* **Ngrok:** Túnel essencial para que a Evolution API (rodando num container local) conseguisse se comunicar com as Serverless Functions do Next.js.
* **Worker em Script:** Abordagem pragmática e *cost-effective* para não onerar o servidor principal e lidar perfeitamente com *rate-limits* usando delays aleatórios.

### Como seria isso numa Arquitetura Clássica (Microserviços) em Produção?

Se fôssemos evoluir isso para um produto escalável (SaaS atendendo 500 empresas), o monólito atual se dividiria para garantir alta disponibilidade e tolerância a falhas:

1. **Front-End (Client-Side):**
   * Aplicação em **React (Vite)** ou **Next.js** rodando puramente no front (Vercel/Netlify), focada apenas na UI do Kanban e relatórios.
2. **Core API (Backend Service):**
   * Um microserviço em **Node.js (NestJS)** ou **Go** hospedado no AWS ECS ou Render. Ele exporia uma API RESTful para o frontend e lidaria com a inteligência do negócio (Máquina de Estados).
3. **Database Layer:**
   * **PostgreSQL** gerenciado (AWS RDS), acessado pelo Backend usando Prisma ORM ou TypeORM.
4. **Queue Worker Service (Assíncrono):**
   * Sairia o script local. Usaríamos **RabbitMQ** ou **Redis (BullMQ)**.
   * Quando uma campanha é criada, o Backend joga 10.000 mensagens no RabbitMQ.
   * Teríamos múltiplos "Workers" (pods no Kubernetes) consumindo dessa fila lentamente, limitados a X requisições por minuto, fazendo as chamadas HTTP para a Evolution API.
5. **Integração WhatsApp (Evolution Cluster):**
   * A Evolution API rodaria em uma VPS robusta (AWS EC2 ou DigitalOcean Droplet), orquestrada via Docker. Se o SaaS crescesse, usaríamos o Redis integrado na Evolution (V2) para escalar instâncias de WhatsApp horizontalmente, atrás de um Nginx (Load Balancer).
6. **Webhooks:**
   * Sem Ngrok. A Evolution API bateria diretamente no IP/Domínio do Core API via API Gateway.

### A principal decisão de Engenharia explicada:
*"CTO, no ambiente de produção, eu não usaria o Next.js para rodar filas longas. O ambiente serverless tem timeout de 10 a 60 segundos, e prospecção de WhatsApp exige delays propositais de 15 segundos entre mensagens para imitar humanos. Por isso, a arquitetura com um **Worker Assíncrono** (como o script que criamos hoje, mas escalado via BullMQ no Redis) é a espinha dorsal de um produto de Outbound resiliente."*
