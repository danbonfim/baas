# BAAS — Bitch As A Service
## Prompt completo para implementação no Lovable

---

## 🎯 Visão Geral

Construa um **marketplace premium de acompanhantes** chamado **BAAS — Bitch As A Service**. É uma plataforma sofisticada, discreta e segura que conecta clientes a profissionais verificadas. Pense em algo como Airbnb meets OnlyFans meets LinkedIn — com foco em design luxury, dark mode, glassmorphism e UX premium.

A plataforma tem **3 perfis de usuário**: Cliente, Profissional e Admin. Cada um acessa um dashboard diferente após login.

---

## 🎨 Design System

### Tema
- **Fundo**: Dark profundo (`#020617` → `#0f172a`)
- **Primária (brand)**: Pink/Rose — `#ec4899` (brand-500), `#db2777` (brand-600)
- **Dourada (gold)**: `#f59e0b` para badges premium e destaques VIP
- **Glassmorphism**: `backdrop-blur-xl`, `bg-white/5`, `border border-white/10`
- **Modo**: Sempre dark mode
- **Tipografia**: Inter (corpo), Plus Jakarta Sans (títulos)

### Classes CSS Customizadas (definir globalmente)
```css
.glass { background: rgba(255,255,255,0.03); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.08); }
.glass-strong { background: rgba(255,255,255,0.06); backdrop-filter: blur(40px); border: 1px solid rgba(255,255,255,0.12); }
.gradient-brand { background: linear-gradient(135deg, #ec4899, #db2777); }
.gradient-gold { background: linear-gradient(135deg, #f59e0b, #d97706); }
.text-gradient { background: linear-gradient(135deg, #f472b6, #ec4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.text-gradient-gold { background: linear-gradient(135deg, #fbbf24, #f59e0b); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
```

### Paleta de Cores Tailwind (estender config)
```js
brand: { 50:'#fdf2f8', 400:'#f472b6', 500:'#ec4899', 600:'#db2777', 700:'#be185d', 950:'#500724' }
gold:  { 400:'#fbbf24', 500:'#f59e0b', 600:'#d97706' }
dark:  { 800:'#1e293b', 900:'#0f172a', 950:'#020617' }
```

### Componentes Base (shadcn/ui)
Use: Button, Input, Badge, Avatar, Dialog, Sheet, Select, Slider, Switch, Tabs, Textarea, ScrollArea, Separator, DropdownMenu, Label, Sonner (toasts)

### Animações
Use Framer Motion em todas as páginas:
- `initial={{ opacity:0, y:20 }}` → `animate={{ opacity:1, y:0 }}` com `delay` escalonado
- Cards com `whileHover={{ y:-4 }}` e `transition={{ duration:0.2 }}`
- Stagger nos grids: delay `i * 0.05` ou `i * 0.1`

---

## 📐 Estrutura de Navegação

```
/                          → Homepage
/search                    → Busca com filtros
/profile/[slug]            → Perfil da profissional
/auth/login                → Login
/auth/register             → Cadastro
/booking                   → Fluxo de agendamento (3 steps)
/chat                      → Mensagens em tempo real
/dashboard/client          → Painel do cliente
/dashboard/professional    → Painel da profissional
/dashboard/admin           → Admin dashboard
```

---

## 🧩 Componentes de Layout

### Navbar (fixo no topo, `top-0 sticky z-50`)
```
[Logo BAAS ✦] ──── [Explorar] [Mensagens] ──────────── [♡] [Entrar] [Cadastre-se →]
```
- Quando autenticado: substitui botões por avatar com dropdown (Meu painel, Perfil, Sair)
- Avatar com inicial do nome em circle pink
- Badge de notificação no ícone de mensagens
- Fundo: `glass` + `border-b border-white/10`
- Logo: ícone ✦ (sparkles) em fundo pink rounded + texto "BAAS" bold

### Footer
- Links: Sobre, Como funciona, Para Profissionais, Planos, Privacidade, Termos
- Disclaimer discreto de conteúdo adulto
- Background `dark-950`

---

## 📄 Páginas

---

### 1. HOMEPAGE `/`

**HeroSection** (viewport 90vh):
- Fundo com blobs animados pink (blur-3xl, opacity 10-15%)
- Badge pill: `🛡 Plataforma 100% verificada e segura`
- Título gigante (7xl): "Encontre **companhia** premium com **segurança**" (palavras "companhia" e "segurança" com text-gradient e text-gradient-gold)
- Subtítulo: "Acompanhantes verificadas, pagamentos seguros via Stripe, assinaturas com benefícios exclusivos. A experiência que você merece."
- Barra de busca: input "Digite sua cidade..." + botão "🔍 Explorar" (gradient-brand)
- 4 feature pills: `🛡 Verificação facial / Perfis autenticados`, `💳 Pagamento seguro / Via Stripe`, `⭐ Avaliações reais / Comunidade confiável`, `📍 Geolocalização / Perto de você`

**FeaturedProfiles** (grid de profissionais em destaque):
- Título: "Perfis em **destaque**" + "Ver todas →"
- Grid horizontal scroll com cards de profissionais
- Cards com foto (aspect 3/4), badges (Verificada 🛡, Premium 👑, Online 🟢), nome, cidade, rating ⭐, preço "A partir de R$ XXX/h", categorias como chips

**HowItWorks** (3 steps):
1. 🔍 Explore perfis verificados
2. 📅 Agende com segurança
3. ✨ Viva a experiência

**PlansSection** (3 colunas):
- **Basic** (Zap icon) — R$ 49,90/mês — 5 créditos/mês
  - 5 créditos mensais, Chat ilimitado, Suporte prioritário, Cancelamento grátis
- **Premium** (Sparkles icon) — R$ 99,90/mês — "Mais popular" badge — 15 créditos/mês
  - Tudo do Basic + 15 créditos mensais, 10% cashback, Perfis exclusivos, Acesso antecipado
- **VIP** (Crown icon) — R$ 199,90/mês — 40 créditos/mês
  - Tudo do Premium + 40 créditos mensais, 20% cashback, Concierge dedicado, Acesso VIP total

**CTASection**:
- "Pronta para começar?" com botão de cadastro para profissionais

---

### 2. BUSCA `/search`

**Barra de filtros sticky** (abaixo do navbar):
- Input "🔍 Buscar por nome, cidade..."
- Select "📍 Cidade" (Todas, São Paulo, Rio de Janeiro, Belo Horizonte, Curitiba, Florianópolis, Brasília, Salvador, Recife)
- Select "Categoria" (Todas, Acompanhante, Massagista, Modelo, Dançarina)
- Select "Ordenar" (Relevância, Melhor avaliação, Menor preço, Maior preço, Mais recentes)
- Botão "🔧 Filtros" que abre Sheet lateral com:
  - Slider de preço: R$0 — R$1000+
  - Toggle "Apenas verificadas"
  - Toggle "Online agora"

**Resultados**:
- Contador: "20 profissionais encontradas"
- Ícones grid/lista (toggle viewMode)
- **Grid View**: 3 colunas (responsivo), cards com:
  - Foto full com overlay gradient-to-top na base
  - Badges top-left: `Verificada` (pink), `Premium` (gold/crown), `Online` (emerald dot)
  - Nome, Idade, Cidade com ⭐ rating e contagem
  - Preço `R$ XXX/h`, categoria chip
  - Hover: `whileHover={{ y:-4 }}`
- **List View**: linhas com foto thumb + info expandida
- Loading state: skeleton cards com shimmer

---

### 3. PERFIL DA PROFISSIONAL `/profile/[slug]`

**Layout**: 2 colunas (foto | info), colapsa em mobile

**Coluna esquerda — Galeria**:
- Foto principal grande (aspect 4/5)
- Thumbnails abaixo (scroll horizontal)
- Navegação prev/next
- Lightbox ao clicar (dialog fullscreen com animação)
- Badges overlay: Verificada, Premium, Online

**Coluna direita — Info e booking**:
- Botão Voltar `← Voltar`
- Nome, idade — badges status
- Cidade com 📍, Rating ⭐ (X.X), reviews (XXX avaliações)
- Tagline em itálico
- Preço destaque: "A partir de **R$ XXX/h**"
- Botões de ação:
  - `❤ Favoritar` (toggle, fica filled quando favoritado)
  - `🔗 Compartilhar`
  - `💬 Enviar mensagem` (gradient-brand)
  - `📅 Agendar agora` (gradient-brand, maior)
- Card glassmorphism com info rápida:
  - Categorias (chips/tags)
  - Idiomas falados
  - Serviços oferecidos (Jantar, Viagens, Eventos Sociais, Cinema)
  - Disponibilidade (dias da semana: Seg-Sex 18h-23h)

**Tabs**: Sobre | Avaliações | Disponibilidade
- **Sobre**: bio longa com description
- **Avaliações**: lista de reviews com avatar, nome, rating, comentário, data
- **Disponibilidade**: grid semanal com horários

---

### 4. AUTH — LOGIN `/auth/login`

Card centralizado (max-w-md), fundo com blobs sutis:
- Logo BAAS centralizado
- "Bem-vindo de volta" (título), "Entre para acessar sua conta" (subtítulo)
- Campo Email (ícone envelope)
- Campo Senha (ícone cadeado) + olho para mostrar/esconder + link "Esqueceu?"
- Botão "Entrar" (gradient-brand, full width)
- Divisor "ou continue com"
- Botões: Google | GitHub (outline, com logos)
- "Não tem conta? **Cadastre-se**" (link brand)

---

### 5. AUTH — REGISTRO `/auth/register`

Card similar ao login, com tabs "Sou Cliente" | "Sou Profissional":

**Cliente**:
- Nome completo, Email, Telefone (opcional), Senha, Confirmar senha
- Checkbox "Li e aceito os Termos de Uso"

**Profissional**:
- Todos os campos de Cliente +
- Cidade, Estado
- Mensagem info: "Seu perfil passará por verificação KYC antes de aparecer na plataforma"

---

### 6. BOOKING `/booking`

**Step 1 — Escolher data e horário**:
- Card da profissional (mini, lado esquerdo): foto, nome, cidade, preço/h
- Calendário (grid 7 dias do mês atual, próximos 30 dias)
  - Dias disponíveis clicáveis, dia selecionado fica gradient-brand
  - Dias passados desabilitados (opacity-30)
- Grid de horários: `10:00 11:00 12:00 14:00 15:00 16:00 18:00 19:00 20:00 21:00 22:00`
  - Slot selecionado: gradient-brand
- Selector de duração: `1 hora | 2 horas | 3 horas | Pernoite (8h)`

**Step 2 — Detalhes**:
- Input "Endereço / Local do encontro"
- Textarea "Notas ou pedidos especiais (opcional)"
- Resumo: profissional, data, horário, duração, valor calculado

**Step 3 — Pagamento**:
- Resumo completo do agendamento
- Stripe Card Element (ou mock do campo de cartão)
- Breakdown de valores:
  - Valor da hora × duração
  - Taxa da plataforma (15%)
  - **Total**
- Botão "Confirmar e pagar" (gradient-brand)
- Ícone 🔒 "Pagamento 100% seguro via Stripe"

**Barra de progresso** no topo: `① Data e horário → ② Detalhes → ③ Pagamento`

---

### 7. CHAT `/chat`

Layout split-screen (sidebar conversas | área de mensagens):

**Sidebar esquerda**:
- "💬 Mensagens" título
- Search input "Buscar conversa..."
- Lista de conversas:
  - Avatar + Nome profissional/cliente
  - Preview última mensagem (truncado)
  - Timestamp
  - Badge não-lidas (número)
  - Item selecionado: `bg-brand-500/10 border-l-2 border-brand-500`

**Área principal**:
- Header: avatar + nome + status (Online 🟢 / Offline)
- ScrollArea com mensagens:
  - Minhas mensagens: alinhadas à direita, `gradient-brand`, rounded-xl rounded-br-sm
  - Mensagens recebidas: alinhadas à esquerda, `glass`, rounded-xl rounded-bl-sm
  - Timestamp em xs abaixo de cada mensagem
  - Separador de data (ex: "Hoje", "Ontem")
- Input na base: texto + botão Send → (gradient-brand)
- Indicador de conexão WebSocket: `● Online` (emerald) ou `○ Reconectando...` (gold)

**Mobile**: sidebar vira full-screen, tap em conversa → abre chat

---

### 8. DASHBOARD CLIENTE `/dashboard/client`

Header: "Meu Painel" + "Olá, [Nome]! Bem-vindo de volta." + botão "❤ Explorar perfis"

**Bloco de assinatura** (glassmorphism):
- Ícone Crown (gradient-gold)
- Plano atual (ex: "Plano Premium") + badge status (Ativo / Gratuito)
- Data de renovação
- Botões: "Gerenciar plano" | "Upgrade para VIP"
- Se sem assinatura: "Sem assinatura — Gratuito" + botão "Assinar agora"

**Cards de stats** (row):
- 🎁 **5** Créditos disponíveis
- (expandível: bookings pendentes, avaliações pendentes)

**Seção "Meus agendamentos"** + "Ver todos →":
- Lista últimos 3 bookings:
  - Foto profissional thumb + Nome + Data/Hora + Status badge colorido:
    - CONFIRMADO: emerald, PENDENTE: gold, CONCLUÍDO: brand-pink, CANCELADO: red
  - Se vazio: ícone calendário + "Nenhum agendamento ainda." + "Explorar profissionais"

**Wallet** (card lateral):
- "Saldo disponível: **R$ 120,00**"
- Tabs: Créditos | Cashback
- Botão "Adicionar créditos"
- Lista últimas transações (data, descrição, valor ±)

---

### 9. DASHBOARD PROFISSIONAL `/dashboard/professional`

Header: "Painel Profissional" + "Bem-vinda, [Nome]!" + aviso se verificação pendente ⚠ + botão "Ver perfil"

**Stats cards** (grid 2×2 ou 4 colunas):
- 💰 Receita total (R$ calculado de bookings COMPLETED)
- 📅 Agendamentos (total)
- 👁 Visualizações (—)
- ⭐ Avaliação média (—)
- Cada card com ícone, valor grande, variação % (seta cima/baixo, verde/vermelho)

**Tabs**: Agendamentos | Financeiro | Perfil

**Aba Agendamentos**:
- Lista de todos os bookings:
  - Avatar cliente (placeholder) + "Cliente" + data/hora formatada + duração + valor + status badge
  - Botões de ação: "Confirmar" (PENDING) | "Cancelar"
- Se vazio: "Nenhum agendamento ainda. Complete seu perfil para aparecer nas buscas."

**Aba Financeiro**:
- Saldo disponível para saque
- Histórico de ganhos (data, booking ID, valor bruto, taxa, líquido)
- Botão "Solicitar saque"

**Aba Perfil**:
- Preview do perfil público + link "Editar perfil"
- Status KYC: APROVADO (emerald badge) / PENDENTE (gold badge)

---

### 10. ADMIN DASHBOARD `/dashboard/admin`

Header: "Admin Dashboard" + "Visão geral da plataforma" + botões "📊 Relatórios" + "⚠ 3 pendências" (gold)

**6 KPI cards** (grid 3×2 em mobile, 6 colunas em desktop):
- 💰 Receita total: R$ 245.8k (+18%)
- 👥 Usuários ativos: 12.4k (+8%)
- ✅ Profissionais: 1.2k (+15%)
- 📅 Agendamentos/dia: 340 (+22%)
- 👁 Visualizações: 89k (+35%)
- 📈 Taxa conversão: 4.2% (+0.3%)
- Cada card: ícone brand-pink + valor bold + variação com seta verde

**Tabs**: Visão geral | Usuários | Profissionais | Financeiro | Moderação

**Aba Visão geral**:
- Tabela "Atividade recente":
  - Tipo (new/verified/alert/payment) com ícone colorido
  - Ação, Detalhe, Tempo atrás
  - Tipos: Nova profissional cadastrada, KYC aprovado, Disputa aberta, Pagamento processado, Perfil reportado, Nova assinatura VIP
- Gráfico de receita (placeholder visual com barras)

**Aba Profissionais**:
- Tabela com: Nome, Cidade, Status (Verificada/Pendente), KYC, Rating, Agendamentos
- Botões por linha: "Aprovar KYC" | "Banir"

**Aba Usuários**:
- Tabela clientes com: Nome, Email, Plano, Créditos, Último acesso
- Botão "Banir usuário"

---

## 📦 Tipos de Dados

```typescript
interface Professional {
  id: string
  name: string
  slug: string
  tagline: string
  description: string
  age: number
  city: string
  state: string
  rating: number
  reviewCount: number
  pricePerHour: number
  verified: boolean
  premium: boolean
  online: boolean
  photos: string[]        // URLs de imagens
  categories: string[]    // ['Acompanhante', 'Social', 'Eventos']
  languages: string[]     // ['Português', 'Inglês']
  services: string[]      // ['Jantar', 'Viagens', 'Eventos Sociais', 'Cinema']
  availability: { dayOfWeek: number; startTime: string; endTime: string }[]
}

interface Booking {
  id: string
  professionalId: string
  clientId: string
  date: string
  startTime: string
  endTime: string
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'
  totalAmount: number
  platformFee: number
  professionalAmount: number
  paymentStatus: 'PENDING' | 'PAID' | 'REFUNDED'
}

interface User {
  id: string
  email: string
  name: string
  role: 'CLIENT' | 'PROFESSIONAL' | 'ADMIN'
  avatar?: string
  client?: { credits: number; balance: number; subscription?: Subscription }
  professional?: { slug: string; verified: boolean; kycStatus: string }
}

interface Subscription {
  plan: 'BASIC' | 'PREMIUM' | 'VIP'
  status: 'ACTIVE' | 'CANCELLED' | 'PAST_DUE'
  credits: number
  currentPeriodEnd: string
}

interface Message {
  id: string
  senderId: string
  content: string
  createdAt: string
  read: boolean
}

interface Review {
  id: string
  clientName: string
  rating: number
  comment: string
  createdAt: string
}
```

---

## 🔌 API (Backend NestJS — `http://localhost:3001/api`)

### Auth
```
POST /auth/login       → { email, password } → { accessToken }
POST /auth/register    → { email, password, name, role, city?, state? } → { accessToken }
GET  /auth/me          → User (requer Bearer token)
```

### Profissionais
```
GET  /professionals            → { items: Professional[], total, page, totalPages }
GET  /professionals/:slug      → Professional
```

### Bookings
```
POST /bookings                 → { professionalId, date, startTime, endTime, location, notes }
GET  /bookings/my              → Booking[] (cliente)
GET  /bookings/professional    → Booking[] (profissional)
PATCH /bookings/:id/confirm    → Booking
PATCH /bookings/:id/cancel     → Booking
POST /bookings/:id/payment-intent → { clientSecret }
```

### Chat
```
POST /chat/conversations       → { professionalId } → Conversation
GET  /chat/conversations       → Conversation[]
GET  /chat/conversations/:id/messages → Message[]
POST /chat/conversations/:id/messages → { content } → Message
WebSocket: ws://localhost:3001 (Socket.IO)
  emit: 'join_conversation' { conversationId }
  emit: 'send_message' { conversationId, content }
  on:   'new_message' Message
```

### Admin
```
GET  /admin/stats              → { totalRevenue, totalUsers, ... }
GET  /admin/kyc/pending        → Professional[]
PATCH /admin/kyc/:id/approve   → Professional
PATCH /admin/users/:id/ban     → User
```

### Pagamento
```
POST /payments/create-intent   → { bookingId } → { clientSecret }
POST /payments/subscription    → { planId } → { url } (Stripe Checkout)
POST /payments/webhook         → Stripe webhook
```

---

## 🧪 Dados Mock (para usar quando API não disponível)

```typescript
// 8 profissionais de exemplo
const professionals = [
  { name: 'Isabella Santos', age: 24, city: 'São Paulo', state: 'SP', 
    rating: 4.8, reviewCount: 127, pricePerHour: 350, verified: true, premium: true, online: false,
    categories: ['Acompanhante', 'Social', 'Eventos'], slug: 'isabella-santos',
    tagline: 'Experiência premium para momentos especiais',
    photos: ['https://picsum.photos/seed/isabella/600/800'] },
  { name: 'Valentina Costa', age: 27, city: 'Rio de Janeiro', state: 'RJ',
    rating: 4.5, reviewCount: 43, pricePerHour: 450, verified: true, premium: false, online: false,
    categories: ['Acompanhante', 'Eventos'], slug: 'valentina-costa',
    photos: ['https://picsum.photos/seed/valentina/600/800'] },
  { name: 'Sofia Oliveira', age: 23, city: 'Belo Horizonte', state: 'MG',
    rating: 4.9, reviewCount: 89, pricePerHour: 500, verified: true, premium: true, online: true,
    categories: ['Acompanhante', 'Social'], slug: 'sofia-oliveira',
    photos: ['https://picsum.photos/seed/sofia/600/800'] },
  { name: 'Laura Martins', age: 26, city: 'Curitiba', state: 'PR',
    rating: 4.3, reviewCount: 15, pricePerHour: 280, verified: false, premium: false, online: true,
    categories: ['Social', 'Eventos'], slug: 'laura-martins',
    photos: ['https://picsum.photos/seed/laura/600/800'] },
  { name: 'Helena Rodrigues', age: 25, city: 'São Paulo', state: 'SP',
    rating: 4.7, reviewCount: 76, pricePerHour: 600, verified: true, premium: true, online: false,
    categories: ['Acompanhante', 'Eventos'], slug: 'helena-rodrigues',
    photos: ['https://picsum.photos/seed/helena/600/800'] },
  { name: 'Manuela Silva', age: 24, city: 'Rio de Janeiro', state: 'RJ',
    rating: 4.6, reviewCount: 98, pricePerHour: 380, verified: true, premium: false, online: true,
    categories: ['Social', 'Acompanhante'], slug: 'manuela-silva',
    photos: ['https://picsum.photos/seed/manuela/600/800'] },
  { name: 'Alice Ferreira', age: 22, city: 'Belo Horizonte', state: 'MG',
    rating: 4.4, reviewCount: 32, pricePerHour: 320, verified: false, premium: true, online: false,
    categories: ['Acompanhante'], slug: 'alice-ferreira',
    photos: ['https://picsum.photos/seed/alice/600/800'] },
  { name: 'Júlia Almeida', age: 29, city: 'Curitiba', state: 'PR',
    rating: 4.8, reviewCount: 112, pricePerHour: 550, verified: true, premium: true, online: false,
    categories: ['Acompanhante', 'Social', 'Eventos'], slug: 'julia-almeida',
    photos: ['https://picsum.photos/seed/julia/600/800'] },
]

// Credenciais de teste
// Cliente:      cliente@baas.com / cliente123
// Admin:        admin@baas.com   / admin123
// Profissional: isabella.santos@baas.com / senha123
```

---

## 🔐 Estado de Autenticação (Zustand)

```typescript
// store/auth.store.ts
interface AuthStore {
  token: string | null
  user: AuthUser | null
  isAuthenticated: boolean
  setAuth: (token: string, user: AuthUser) => void
  setUser: (user: AuthUser) => void
  logout: () => void
}
// Persistir em localStorage com keys: 'baas_token', 'baas_user'
```

---

## 🔄 Fluxos de Usuário

### Fluxo Cliente
1. Acessa `/` → vê hero + perfis em destaque
2. Clica "Explorar" → `/search` com filtros
3. Clica em perfil → `/profile/[slug]`
4. Clica "Agendar agora" → redireciona para `/auth/login` se não autenticado
5. Após login → `/booking?slug=X&professionalId=Y`
6. Escolhe data → horário → duração → local → confirma → paga
7. Acessa `/dashboard/client` para ver agendamentos

### Fluxo Profissional
1. Cadastro com role "professional" → KYC pendente
2. Login → `/dashboard/professional`
3. Vê agendamentos pendentes → confirma/canceia
4. Acessa aba Financeiro para ver ganhos

### Redirecionamento pós-login por role
```typescript
if (role === 'ADMIN') router.push('/dashboard/admin')
else if (role === 'PROFESSIONAL') router.push('/dashboard/professional')
else router.push('/dashboard/client')
```

---

## 📋 Planos de Assinatura

```typescript
const PLANS = [
  {
    id: 'basic', name: 'Basic', price: 49.90, credits: 5,
    features: ['5 créditos mensais', 'Chat ilimitado', 'Suporte prioritário', 'Cancelamento grátis']
  },
  {
    id: 'premium', name: 'Premium', price: 99.90, credits: 15, popular: true,
    features: ['15 créditos mensais', '10% cashback', 'Perfis exclusivos', 'Acesso antecipado', 'Tudo do Basic']
  },
  {
    id: 'vip', name: 'VIP', price: 199.90, credits: 40,
    features: ['40 créditos mensais', '20% cashback', 'Concierge dedicado', 'Acesso VIP total', 'Tudo do Premium']
  },
]
```

---

## ✅ Requisitos Técnicos

- **Framework**: Next.js 14+ (App Router, 'use client' nos componentes interativos)
- **Styling**: Tailwind CSS 3 com as cores customizadas descritas acima
- **Componentes UI**: shadcn/ui (já incluso no Lovable)
- **Animações**: Framer Motion (`motion.div` com initial/animate/whileHover)
- **Estado global**: Zustand (auth store com persistência localStorage)
- **HTTP**: Axios com interceptors para JWT (`Authorization: Bearer <token>`)
- **Real-time**: Socket.IO client (chat)
- **Formulários**: React Hook Form + Zod validation
- **Toasts**: Sonner (`toast.success`, `toast.error`)
- **Datas**: date-fns com locale pt-BR
- **Ícones**: Lucide React

### Axios config
```typescript
const api = axios.create({ baseURL: 'http://localhost:3001/api', timeout: 15000 })
api.interceptors.request.use(config => {
  const token = localStorage.getItem('baas_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
api.interceptors.response.use(res => res, err => {
  if (err.response?.status === 401) { localStorage.clear(); window.location.href = '/auth/login' }
  return Promise.reject(err)
})
```

---

## 🎯 Prioridade de Implementação

**Fase 1 — Core** (implementar primeiro):
1. Layout base (Navbar + Footer)
2. Homepage completa
3. Página de busca com filtros
4. Perfil da profissional
5. Login / Registro

**Fase 2 — Autenticado**:
6. Dashboard do cliente
7. Dashboard da profissional
8. Chat

**Fase 3 — Transações**:
9. Booking (3 steps)
10. Admin dashboard

---

## 🖼 Imagens

Use `https://picsum.photos/seed/{nome}/600/800` para fotos das profissionais e `https://picsum.photos/seed/{nome}-bg/1920/1080` para backgrounds. Substitua `{nome}` pelo slug ou identificador único.

---

*BAAS v1.0 — Gerado automaticamente a partir do projeto local em desenvolvimento*
