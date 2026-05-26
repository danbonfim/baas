# BAAS — Prompt de Atualização Completa para Lovable

## Contexto

Você está trabalhando no **BAAS (Bitch As A Service)**, uma plataforma marketplace de acompanhantes premium. O backend NestJS está 100% pronto e deployado. O frontend TanStack Router também está funcional. Preciso que você replique/atualize o frontend Lovable para ficar em paridade com o que já temos implementado.

## Stack & Infra

- **Backend**: `https://baas-production-5a08.up.railway.app/api` (NestJS + Prisma + PostgreSQL)
- **Auth**: JWT Bearer token no header `Authorization: Bearer <token>`
- **Pagamentos**: Stripe Connect + Stripe Elements
- **Uploads**: Cloudinary (upload assinado via backend)
- **WebSocket**: Socket.IO em `wss://baas-production-5a08.up.railway.app`
- **Roles**: `CLIENT`, `PROFESSIONAL`, `ADMIN`

## Design System

- Background: `#020617` (slate-950)
- Accent/Brand: `#ec4899` (pink-500)
- Glass: `bg-white/5 backdrop-blur-xl border border-white/10`
- Gradients: `gradient-brand` = pink-500 → rose-500, `gradient-gold` = amber-400 → yellow-500
- Cards: `rounded-2xl` com glass effect
- Dark mode only, fontes Inter

## Usuários Demo para Teste

- **Cliente**: `carlos@demo.baas.app` / `Demo123!Senha`
- **Profissional**: `isabela@demo.baas.app` / `Demo123!Senha`
- **Admin**: `admin@demo.baas.app` / `Demo123!Senha`

---

## API COMPLETA — Todos os Endpoints

### Auth (`/api/auth`)
```
POST /register/request-code     — { email } → envia código de verificação
POST /register                  — { email, code, password, name, role }
POST /login                     — { email, password, mfaToken? } → { accessToken, user }
POST /forgot-password           — { email }
POST /reset-password            — { token, newPassword }
GET  /me                        — retorna user completo (com phone, mfaEnabled)
POST /mfa/setup                 — { qrCode, secret }
POST /mfa/enable                — { token } → backupCodes[]
POST /mfa/disable               — { password }
POST /mfa/backup-codes/regenerate
```

### Users (`/api/users`)
```
GET   /profile                  — perfil do user logado
PATCH /profile                  — { name?, phone?, avatar? }
```

### Professionals (`/api/professionals`)
```
GET    /                        — lista com filtros (city, category, minPrice, maxPrice, verified, online, sortBy, page, limit)
GET    /:slug                   — perfil público por slug
GET    /dashboard               — dashboard do profissional logado
PATCH  /profile                 — atualiza perfil profissional (bio, pricePerHour, photos[], categories[], languages[], availability[])
GET    /me/favorites            — favoritos do cliente logado
POST   /:id/favorite            — toggle favorito
GET    /:id/is-favorited        — { favorited: boolean }
```

### Discovery (`/api/discovery`)
```
GET    /search                  — busca avançada (query, city, category, minPrice, maxPrice, verified, online, sortBy, lat, lng, radius)
GET    /nearby                  — { lat, lng, radius? }
GET    /available-now           — profissionais online agora
GET    /for-you                 — recomendações personalizadas
GET    /recommendations         — { lat?, lng?, limit? }
GET    /preferences             — preferências de descoberta do user
PATCH  /preferences             — { preferredCategories[], maxDistance, priceRange }
POST   /travel-mode             — { city, startDate, endDate }
DELETE /travel-mode/:id
GET    /travel-mode/mine
GET    /travel-mode/coming-to/:city
PATCH  /online-status           — { isOnline: boolean }
PATCH  /location                — { lat, lng }
```

### Bookings (`/api/bookings`)
```
POST   /                        — { professionalId, date, startTime, endTime, durationHours, location?, notes? }
POST   /recurring               — { professionalId, dayOfWeek, startTime, endTime, durationHours, startDate, endDate, location? }
GET    /my                      — bookings do cliente
GET    /professional             — bookings do profissional
PATCH  /:id/confirm             — profissional confirma
PATCH  /:id/cancel              — cancela booking
PATCH  /:id/complete            — marca como completo
PATCH  /:id/reschedule          — { date, startTime, endTime }
POST   /:id/refund              — solicita reembolso
```

### Payments (`/api/payments`)
```
POST   /bookings/:bookingId/intent  — cria PaymentIntent para booking
POST   /connect/onboarding          — cria link de onboarding Stripe Connect
POST   /webhook                     — webhook do Stripe (não autenticado)
```

### Chat (`/api/chat`)
```
GET    /conversations                — lista conversas do user
POST   /conversations               — { professionalId } cria nova conversa
GET    /conversations/:id/messages   — mensagens de uma conversa (page, limit)
POST   /conversations/:id/messages   — { content, type?, replyToId? }
DELETE /messages/:messageId          — deleta mensagem
POST   /conversations/:id/read       — marca como lida
```

**WebSocket Events (Socket.IO):**
```
connect     — auth: { token: accessToken }
newMessage  — recebe mensagem em tempo real
typing      — recebe indicador de digitação
emit('joinConversation', conversationId)
emit('sendMessage', { conversationId, content, type?, replyToId? })
emit('typing', { conversationId })
```

### Reviews (`/api/reviews`)
```
POST   /                        — { professionalId, bookingId, rating, comment? }
GET    /professional/:id         — reviews de um profissional
GET    /reviewable               — bookings que podem ser avaliados
```

### Tips (`/api/tips`)
```
POST   /intent                   — { professionalId, amount, message?, isPublic? } → { clientSecret }
GET    /sent                     — gorjetas enviadas
GET    /received                 — gorjetas recebidas
GET    /public/:professionalId   — gorjetas públicas de um profissional
```

### Boost (`/api/boost`)
```
GET    /plans                    — lista planos de boost disponíveis
POST   /intent                   — { type } → { clientSecret }
GET    /my                       — boost ativo do profissional
GET    /history                  — histórico de boosts
```

### Content PPV (`/api/content`)
```
POST   /                         — cria conteúdo (multipart: file, title?, price, type)
GET    /mine                     — conteúdos do profissional
GET    /professional/:professionalId — conteúdos de um profissional (retorna blur/thumbnail se não comprado)
POST   /:contentId/unlock-intent — { } → { clientSecret } para desbloquear
PATCH  /:contentId               — atualiza (title?, price?)
DELETE /:contentId               — remove conteúdo
```

### Subscriptions (`/api/subscriptions`)
```
GET    /plans                    — planos de assinatura
GET    /my                       — assinatura ativa do user
POST   /                         — { planId } cria assinatura
DELETE /                         — cancela assinatura
```

### Pro Subscriptions (`/api/pro-subscription`)
```
PATCH  /enable                   — { priceMonthly } ativa assinatura de fãs
PATCH  /disable                  — desativa
POST   /:professionalId/intent   — cliente cria intent para assinar profissional
DELETE /:professionalId           — cliente cancela assinatura
GET    /mine                     — assinaturas do cliente
GET    /subscribers              — assinantes do profissional
```

### Safety (`/api/safety`)
```
GET    /emergency-contacts       — lista contatos de emergência (max 3)
POST   /emergency-contacts       — { name, phone, email?, relationship?, isPrimary? }
DELETE /emergency-contacts/:id
POST   /checkins                 — { bookingId, lat?, lng?, message? } cria check-in
PATCH  /checkins/:id/confirm     — confirma check-in
GET    /checkins/active          — check-ins ativos
POST   /panic                    — { lat?, lng?, accuracy?, bookingId?, message? } ALERTA DE PÂNICO
PATCH  /panic/:id/resolve
GET    /panic                    — histórico de alertas
GET    /clients/:clientId/profile — perfil de segurança de um cliente
POST   /clients/:clientId/block  — bloqueia cliente
DELETE /clients/:clientId/block  — desbloqueia
GET    /blocked-clients          — lista bloqueados
POST   /client-review            — { clientId, bookingId, rating, comment? } avalia cliente
```

### Notifications (`/api/notifications`)
```
GET    /                         — lista notificações (page, limit)
GET    /unread-count             — { count: number }
PATCH  /read-all                 — marca todas como lidas
PATCH  /:id/read                 — marca uma como lida
```

### Uploads (`/api/uploads`)
```
GET    /status                   — status do Cloudinary
POST   /signature                — { kind: 'avatar'|'photo'|'content'|'kyc'|'chat' } → { signature, timestamp, uploadUrl, apiKey, folder }
GET    /private-url/:publicId    — URL temporária para conteúdo privado
```

### KYC (`/api/kyc`)
```
GET    /me                       — status KYC do profissional
POST   /submit                   — { selfieUrl, documentUrl, documentType }
GET    /admin/pending             — (admin) pendentes
GET    /admin/:professionalId     — (admin) detalhe
PATCH  /admin/:professionalId/approve — (admin) { level? }
PATCH  /admin/:professionalId/reject  — (admin) { reason }
```

### Admin (`/api/admin`)
```
POST   /seed-demo                — (sem auth) popula dados demo
DELETE /wipe-demo                — (sem auth) limpa dados demo
POST   /create-admin             — (sem auth) { email, password, name }
GET    /stats                    — estatísticas gerais
GET    /kyc/pending              — KYCs pendentes
GET    /kyc/:id                  — detalhe KYC
PATCH  /kyc/:id/approve          — { level? }
PATCH  /kyc/:id/reject           — { reason }
PATCH  /users/:id/ban            — { reason }
PATCH  /users/:id/unban
GET    /bookings/recent          — últimos bookings
GET    /users                    — lista users (page, limit, role?, search?)
```

### Pro Tools (`/api/pro-tools`)
```
GET    /dashboard                — dashboard completo do profissional
GET    /earnings/balance         — saldo e balanço
PATCH  /vacation                 — { enabled, startDate?, endDate? }
GET    /templates                — templates de mensagem
POST   /templates                — { name, content, category? }
DELETE /templates/:id
GET    /fiscal-report/:year      — relatório fiscal anual
```

---

## Páginas Necessárias

### 1. Landing Page (`/`)
- Hero com search por cidade
- Perfis em destaque (`GET /discovery/search?verified=true&online=true&limit=8&sortBy=rating`)
- Seção "Como funciona" (3 steps)
- Planos de assinatura (`GET /subscriptions/plans`)
- CTA final

### 2. Search/Explorar (`/search`)
- Grid de cards de profissionais
- Filtros: cidade, categoria, preço min/max, verificada, online
- Ordenação: relevância, preço, avaliação, distância
- Paginação
- Geolocalização opcional para "perto de mim"

### 3. Perfil Profissional (`/profile/:slug`)
- Galeria de fotos com lightbox
- Info: bio, categorias, idiomas, verificação, avaliação
- Tabela de disponibilidade semanal
- Reviews listadas
- Conteúdo PPV (com `ContentPaywall` para itens não comprados)
- Botões: Agendar, Chat, Enviar Gorjeta (`TipModal`)
- Gorjetas públicas

### 4. Booking (`/booking?slug=X&professionalId=Y`)
- Step 1: Seleção de data (14 dias) + horário + duração
- Step 2: Local + notas + resumo com valores
- Step 3: Pagamento com **Stripe Elements** (`StripePayment` component)
  - Usa `POST /payments/bookings/:id/intent` para obter `clientSecret`
  - Renderiza `PaymentElement` do Stripe

### 5. Chat (`/chat`)
- Lista de conversas à esquerda
- Mensagens à direita com scroll infinito
- Input com envio + indicador de typing
- WebSocket para tempo real
- Delete mensagem

### 6. Dashboard Cliente (`/dashboard/client`)
- Meus bookings (próximos + passados)
- Favoritas
- Assinaturas ativas
- Reviews pendentes (`GET /reviews/reviewable`)

### 7. Dashboard Profissional (`/dashboard/professional`)
- Stats: faturamento, bookings, avaliação média
- Bookings pendentes (confirmar/cancelar/completar)
- Editar perfil completo (fotos com `CloudinaryUploader`, bio, preço, categorias, disponibilidade)
- Gerenciar conteúdo PPV
- Modo férias
- Templates de mensagem
- Boost de perfil (`BoostSelector`)
- Relatório fiscal
- Assinantes

### 8. Dashboard Admin (`/dashboard/admin`)
- Stats gerais (`GET /admin/stats`)
- KYC pendentes: lista + modal de review (selfie/documento, aprovar com nível, rejeitar com motivo)
- Lista de users com busca, filtro por role, ban/unban
- Bookings recentes

### 9. Settings (`/settings`)
- **Tab Perfil**: Nome, telefone, avatar (upload via `CloudinaryUploader`)
- **Tab Segurança**: MFA setup (QR code + código 6 dígitos), enable/disable, backup codes
- **Tab Emergência**: CRUD de contatos de emergência (máx 3)

### 10. Auth (`/auth/login`, `/auth/register`)
- Login com email + senha + MFA token opcional
- Register com verificação por código de email
- Seleção de role (CLIENT ou PROFESSIONAL)
- Forgot/reset password

### 11. Páginas Institucionais (já implementadas no TanStack — replicar)

| Rota | Conteúdo |
|------|----------|
| `/como-funciona` | 7 steps visuais com ícones explicando o fluxo da plataforma |
| `/planos` | Grid de 3 planos (Grátis/Premium/VIP) com features e CTA — puxa `GET /subscriptions/plans` |
| `/para-profissionais` | 8 benefícios de se cadastrar (segurança, pagamentos, dashboard, boost, PPV, etc.) |
| `/seguranca` | 8 features de segurança (KYC, pânico, check-in, LGPD, etc.) |
| `/ajuda` | FAQ com busca + accordion por categoria (Busca, Agendamentos, Pagamentos, Segurança, Chat) |
| `/contato` | Formulário de contato (nome, email, assunto, mensagem) |
| `/denunciar` | Formulário de denúncia com selector de motivo (8 opções) |
| `/faq` | Redirect para `/ajuda` |
| `/termos` | Termos de uso em 9 seções |
| `/privacidade` | Política de privacidade em 7 seções |
| `/lgpd` | Direitos LGPD (8 direitos listados) + contato DPO |
| `/cookies` | Política de cookies com 4 categorias (essenciais, funcionais, analíticos, marketing) |

**Footer**: Todos os links devem apontar para essas rotas (não `#`).

---

## Componentes Reutilizáveis Necessários

### StripePayment
```tsx
// Props: clientSecret, amount, onSuccess, onError, buttonLabel?
// Usa @stripe/react-stripe-js: Elements + PaymentElement
// Aparência dark theme matching o design system
// Chama stripe.confirmPayment() no submit
```

### CloudinaryUploader
```tsx
// Props: kind ('avatar'|'photo'|'content'|'kyc'), onUpload(url, publicId), accept?, maxSizeMB?
// 1. POST /uploads/signature { kind } → { signature, timestamp, uploadUrl, apiKey, folder }
// 2. POST multipart para uploadUrl do Cloudinary com signature
// 3. Callback com secure_url
```

### TipModal
```tsx
// Props: open, onClose, professionalId, professionalName
// Quick amounts: R$10, 25, 50, 100, 250
// Custom amount (R$5-5000)
// Mensagem opcional + toggle público
// POST /tips/intent → clientSecret → StripePayment
```

### BoostSelector
```tsx
// Props: open, onClose
// GET /boost/plans → lista planos
// POST /boost/intent { type } → clientSecret → StripePayment
// 3 tiers visuais: Basic (Zap), Pro (Rocket), Premium (Crown)
```

### ContentPaywall
```tsx
// Props: contentId, thumbnailUrl, blurUrl, price, title, type, onUnlocked(url)
// Overlay com blur + lock icon + preço
// POST /content/:id/unlock-intent → clientSecret → StripePayment inline
```

### PanicButton
```tsx
// Floating button fixo bottom-right (apenas para PROFESSIONAL)
// Segurar 2 segundos para disparar
// Pega geolocalização
// POST /safety/panic { lat, lng, accuracy, message }
// Progresso circular SVG durante hold
```

### NotificationBell
```tsx
// GET /notifications/unread-count para badge
// Dropdown com lista de notificações
// PATCH /notifications/read-all
// PATCH /notifications/:id/read
```

### ReviewForm
```tsx
// Props: professionalId, bookingId, onSubmitted
// Rating 1-5 estrelas clicáveis
// Comentário opcional
// POST /reviews { professionalId, bookingId, rating, comment? }
```

---

## Fluxo de Upload Cloudinary

```
1. Frontend chama POST /api/uploads/signature { kind: 'avatar' }
2. Backend retorna: { signature, timestamp, uploadUrl, apiKey, folder }
3. Frontend faz POST multipart para uploadUrl:
   - file: arquivo
   - api_key: apiKey
   - timestamp: timestamp
   - signature: signature
   - folder: folder
4. Cloudinary retorna: { secure_url, public_id, ... }
5. Frontend usa secure_url para salvar no perfil
```

---

## Fluxo de Pagamento Stripe

```
1. Frontend chama endpoint de intent (ex: POST /payments/bookings/:id/intent)
2. Backend cria PaymentIntent no Stripe e retorna { clientSecret }
3. Frontend renderiza <Elements stripe={stripePromise} options={{ clientSecret }}>
4. Dentro: <PaymentElement /> mostra formulário de cartão
5. No submit: stripe.confirmPayment({ elements, confirmParams: { return_url } })
6. Backend recebe webhook e atualiza status
```

**Stripe Publishable Key**: variável de ambiente `VITE_STRIPE_PUBLISHABLE_KEY`

---

## PWA

O app deve ter:
- `manifest.json` com `display: standalone`, `theme_color: #ec4899`, `background_color: #020617`
- Meta tags: `theme-color`, `apple-mobile-web-app-capable`
- Service worker básico para cache offline

---

## Regras Importantes

1. **NUNCA use dados mock** — tudo vem da API real
2. **Sempre envie o token JWT** no header Authorization para rotas protegidas
3. **Trate erros** com toast notifications (sonner)
4. **Loading states** em todas as chamadas async
5. **Responsivo**: mobile-first, funciona em qualquer tela
6. **Todas as strings em português** (pt-BR)
7. **Moeda**: Real brasileiro (R$), formato `amount.toFixed(2)`
8. **Rotas autenticadas** devem redirecionar para `/auth/login` se não logado
9. **Role-based rendering**: mostrar/esconder elementos conforme role do user
10. **WebSocket**: reconectar automaticamente, heartbeat
