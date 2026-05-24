# BAAS — Prompt Lovable V3 (Integração Completa)

> Cole isto inteiro no Lovable. Backend 100% funcional em produção.

---

## Visão geral

Plataforma de acompanhantes premium (marketplace). Backend NestJS em produção com **100+ endpoints REST** + **WebSocket** para chat real-time. O frontend deve ser um PWA dark-mode com glassmorphism.

**Backend produção:** `https://baas-production-5a08.up.railway.app/api`
**WebSocket:** `https://baas-production-5a08.up.railway.app` (Socket.IO, namespace raiz)
**Swagger docs:** `https://baas-production-5a08.up.railway.app/api/docs`

---

## Design System

- **Tema:** Dark mode exclusivo, fundo `#020617` (slate-950)
- **Accent:** Pink/Rose — `#ec4899` (brand-500), gradient `linear-gradient(135deg, #ec4899, #be185d)`
- **Glass:** `background: rgba(255,255,255,0.05); backdrop-filter: blur(24px); border: 1px solid rgba(255,255,255,0.1);`
- **Fontes:** Inter (body) + Plus Jakarta Sans (display/headings)
- **Radius:** 10px padrão, cards 16px
- **Gold accent:** `#fbbf24` para badges premium/VIP

---

## Autenticação (JWT Bearer)

Salve `accessToken` no localStorage após login/register. Envie em toda requisição:
```
Authorization: Bearer {accessToken}
```

### Cadastro (2 etapas — código por email)
1. `POST /api/auth/register/request-code` — `{ email }` → envia código 6 dígitos
2. `POST /api/auth/register` — `{ email, name, password, phone?, role?, city?, state? }` — **password = código recebido por email**. Retorna `{ accessToken, tokenType }`

### Login
`POST /api/auth/login` — `{ email, password, mfaToken? }`
- Se MFA habilitado e `mfaToken` ausente: retorna `{ mfaRequired: true }` → peça TOTP, reenvie
- Senão: `{ accessToken, tokenType }`

### Esqueci senha
1. `POST /api/auth/forgot-password` — `{ email }` (sempre 200)
2. `POST /api/auth/reset-password` — `{ email, code, newPassword }`

### MFA (TOTP)
- `POST /api/auth/mfa/setup` → `{ secret, qrCode (base64 png), otpAuthUrl }`
- `POST /api/auth/mfa/enable` — `{ token }` → retorna 10 backup codes
- `POST /api/auth/mfa/disable` — `{ password }`
- `POST /api/auth/mfa/backup-codes/regenerate` → novos 10 códigos

### Perfil
- `GET /api/auth/me` — dados do user logado (inclui `client` ou `professional` aninhado)
- `GET /api/users/profile` — perfil completo
- `PATCH /api/users/profile` — `{ name?, phone?, avatar? }`

---

## Roles

Existem 3 roles: `CLIENT`, `PROFESSIONAL`, `ADMIN`. O role vem no JWT e no `/auth/me`.

- **CLIENT** — pode buscar profissionais, agendar, pagar, favoritar, enviar gorjetas, assinar
- **PROFESSIONAL** — pode gerenciar perfil, aceitar/recusar bookings, criar conteúdo PPV, ver dashboard analytics
- **ADMIN** — pode ver stats da plataforma, aprovar/rejeitar KYC, banir/desbanir usuários

---

## Endpoints completos

### Profissionais (busca pública)
- `GET /api/professionals?city=&category=&minPrice=&maxPrice=&verified=&online=&sortBy=&page=&limit=`
- `GET /api/professionals/:slug` — perfil público
- `PATCH /api/professionals/profile` — (PRO) atualizar perfil
- `GET /api/professionals/dashboard` — (PRO) estatísticas básicas
- `POST /api/professionals/:id/favorite` — toggle favorito
- `GET /api/professionals/:id/is-favorited`
- `GET /api/professionals/me/favorites`

### Descoberta inteligente
- `GET /api/discovery/search` — busca avançada: `city, category, minPrice, maxPrice, minAge, maxAge, language, service, verified, online, minRating, hasContent, hasSubscription, sortBy, page, limit`
- `GET /api/discovery/nearby?lat=&lng=&radius=` — por proximidade (km)
- `GET /api/discovery/available-now?city=&maxPrice=&verified=&lat=&lng=`
- `GET /api/discovery/for-you` — (CLIENT) matches personalizados
- `GET /api/discovery/recommendations` — (CLIENT) "quem agendou X também agendou Y"
- `GET /api/discovery/preferences` — (CLIENT) buscar preferências
- `PATCH /api/discovery/preferences` — `{ ageMin, ageMax, preferredCities, preferredCategories, preferredLanguages, preferredServices, maxPricePerHour, minRating, onlyVerified, preferOnline }`
- `POST /api/discovery/travel-mode` — (PRO) `{ city, state, lat, lng, startsAt, endsAt, notes }`
- `DELETE /api/discovery/travel-mode/:id`
- `GET /api/discovery/travel-mode/mine`
- `GET /api/discovery/travel-mode/coming-to/:city`
- `PATCH /api/discovery/online-status` — (PRO) `{ online: boolean }`
- `PATCH /api/discovery/location` — (PRO) `{ lat, lng }`

### Agendamentos
- `POST /api/bookings` — `{ professionalId, date, startTime, endTime, durationHours, location?, notes? }` **(apenas CLIENT)**
- `POST /api/bookings/recurring` — `{ professionalId, startDate, startTime, endTime, durationHours, recurrence: 'weekly'|'biweekly'|'monthly', occurrences (2-12) }` **(apenas CLIENT)**
- `GET /api/bookings/my` — (CLIENT) `?status=`
- `GET /api/bookings/professional` — (PRO) `?status=`
- `PATCH /api/bookings/:id/confirm` — (PRO)
- `PATCH /api/bookings/:id/cancel` — `{ reason? }`
- `PATCH /api/bookings/:id/complete` — (PRO)
- `PATCH /api/bookings/:id/reschedule` — `{ date, startTime, endTime, durationHours }`
- `POST /api/bookings/:id/refund` — `{ reason? }` (tier: >48h=100%, 24-48h=75%, 12-24h=50%, <12h=0%)

### Pagamentos (Stripe)
- `POST /api/payments/bookings/:bookingId/intent` — `{ clientSecret, paymentIntentId }`
- `POST /api/payments/connect/onboarding` — (PRO) → `{ url }` para Stripe Connect

### Gorjetas (Tips)
- `POST /api/tips/intent` — `{ professionalId, amount (5-5000), message?, isPublic? }` → `{ clientSecret }`
- `GET /api/tips/sent` — (CLIENT)
- `GET /api/tips/received` — (PRO)
- `GET /api/tips/public/:professionalId` — gorjetas públicas

### Boost (destaque no perfil)
- `GET /api/boost/plans` → 3 planos: STANDARD (R$50/1d/2x), PREMIUM (R$200/7d/3x), ULTRA (R$700/30d/5x)
- `POST /api/boost/intent` — `{ type: 'STANDARD'|'PREMIUM'|'ULTRA' }` → `{ clientSecret }`
- `GET /api/boost/my` — boost ativo
- `GET /api/boost/history` — histórico

### Conteúdo Premium (PPV)
- `POST /api/content` — (PRO) `{ type: 'PHOTO'|'VIDEO'|'AUDIO', url, thumbnailUrl?, blurUrl?, title?, description?, price (3-1000), durationSeconds? }`
- `GET /api/content/mine` — (PRO) meu conteúdo
- `GET /api/content/professional/:professionalId` — lista conteúdo (locked items retornam blur preview, sem url real)
- `POST /api/content/:contentId/unlock-intent` — (CLIENT) → `{ clientSecret }`
- `PATCH /api/content/:contentId` — (PRO) `{ title?, description?, price?, visible? }`
- `DELETE /api/content/:contentId` — (PRO) soft-delete

### Assinatura por Profissional (pro-subscription)
- `PATCH /api/pro-subscription/enable` — (PRO) `{ monthlyPrice: 15-500 }`
- `PATCH /api/pro-subscription/disable` — (PRO)
- `POST /api/pro-subscription/:professionalId/intent` — (CLIENT) → `{ clientSecret }`
- `DELETE /api/pro-subscription/:professionalId` — (CLIENT) cancelar
- `GET /api/pro-subscription/mine` — (CLIENT) minhas assinaturas
- `GET /api/pro-subscription/subscribers` — (PRO) meus assinantes

### Assinatura da Plataforma (subscriptions)
- `GET /api/subscriptions/plans` → `[{ id: 'BASIC', credits: 3, price: 49.9 }, { id: 'PREMIUM', credits: 8, price: 99.9 }, { id: 'VIP', credits: 20, price: 199.9 }]`
- `GET /api/subscriptions/my` — minha assinatura ativa
- `POST /api/subscriptions` — `{ plan: 'BASIC'|'PREMIUM'|'VIP' }`
- `DELETE /api/subscriptions` — cancelar

### Reviews
- `POST /api/reviews` — `{ bookingId, rating (1-5), comment? }`
- `GET /api/reviews/professional/:id` — reviews de um profissional
- `GET /api/reviews/reviewable` — bookings pendentes de review

### Chat (REST + WebSocket)
**REST:**
- `GET /api/chat/conversations` — listar conversas
- `POST /api/chat/conversations` — `{ professionalId }` → get or create
- `GET /api/chat/conversations/:id/messages` — mensagens
- `POST /api/chat/conversations/:id/messages` — `{ content, ttlSeconds? }` (ttl = auto-destruct)
- `DELETE /api/chat/messages/:messageId` — soft-delete (só suas)
- `POST /api/chat/conversations/:id/read` — marcar como lidas

**WebSocket (Socket.IO):**
Conectar com `{ auth: { token: JWT } }` no handshake. Eventos:
- Emit `sendMessage` → `{ conversationId, content, ttlSeconds? }`
- Listen `newMessage` → mensagem recebida
- Listen `messageDeleted` → `{ messageId }`
- Listen `messagesRead` → `{ conversationId, readBy }`

### Notificações
- `GET /api/notifications?limit=` — listar
- `GET /api/notifications/unread-count` → `{ count }`
- `PATCH /api/notifications/read-all`
- `PATCH /api/notifications/:id/read`

### Uploads (Cloudinary — upload direto do frontend)
- `GET /api/uploads/status` → `{ configured, cloudName, kinds[] }`
- `POST /api/uploads/signature` — `{ kind: 'avatar'|'photo'|'kyc_selfie'|'kyc_document'|'content'|'story'|'message_attachment' }` → retorna `{ uploadUrl, signature, timestamp, apiKey, cloudName, publicId, folder, tags, transformation, maxBytes, allowedFormats, hint }`
- `GET /api/uploads/private-url/:publicId?ttl=&type=` — URL assinada temporária

**Como fazer upload:**
1. Chame `POST /api/uploads/signature` com o `kind`
2. Faça POST multipart/form-data para o `uploadUrl` retornado, com os campos: `file, api_key, timestamp, signature, public_id, folder, tags, transformation`
3. Cloudinary retorna `{ secure_url, public_id }` — use `secure_url` como a URL da imagem

### KYC (verificação de identidade)
- `GET /api/kyc/me` — meu status KYC
- `POST /api/kyc/submit` — `{ selfieUrl, documentUrl, documentType?: 'RG'|'CNH'|'PASSPORT' }`

### Segurança (Safety)

**Contatos de emergência (max 3):**
- `GET /api/safety/emergency-contacts`
- `POST /api/safety/emergency-contacts` — `{ name, phone, email?, relationship?, isPrimary? }`
- `DELETE /api/safety/emergency-contacts/:id`

**Check-ins de segurança (PRO):**
- `POST /api/safety/checkins` — `{ bookingId?, intervalMinutes?, lat?, lng? }`
- `PATCH /api/safety/checkins/:id/confirm` — `{ lat?, lng? }`
- `GET /api/safety/checkins/active`

**Botão de pânico:**
- `POST /api/safety/panic` — `{ lat?, lng?, accuracy?, message?, audioUrl?, bookingId? }` → notifica contatos de emergência
- `PATCH /api/safety/panic/:id/resolve` — `{ resolution: 'RESOLVED'|'FALSE_ALARM', note? }`
- `GET /api/safety/panic` — meus alertas

**Verificação de clientes (PRO):**
- `GET /api/safety/clients/:clientId/profile` — reputação do cliente
- `POST /api/safety/clients/:clientId/block` — `{ reason? }`
- `DELETE /api/safety/clients/:clientId/block`
- `GET /api/safety/blocked-clients`
- `POST /api/safety/client-review` — `{ bookingId, rating, punctuality?, respectful?, paidOnTime?, comment? }`

### Ferramentas Pro
- `GET /api/pro-tools/dashboard?days=30` — analytics completo (bookings por status, earnings, tips, timeseries)
- `GET /api/pro-tools/earnings/balance` — saldo (pending/available/paid)
- `PATCH /api/pro-tools/vacation` — `{ active, until? }` — modo férias
- `GET /api/pro-tools/templates` — templates de resposta rápida
- `POST /api/pro-tools/templates` — `{ id?, title, content }`
- `DELETE /api/pro-tools/templates/:id`
- `GET /api/pro-tools/fiscal-report/:year` — relatório fiscal

### Admin (requer role ADMIN)
- `GET /api/admin/stats` → `{ totalUsers, totalProfessionals, completedBookings, platformRevenue }`
- `GET /api/admin/kyc/pending` — profissionais com KYC pendente
- `GET /api/admin/kyc/:id` — detalhe KYC (selfie, documento, dados)
- `PATCH /api/admin/kyc/:id/approve` — `{ level?: 'DOCUMENT'|'BIOMETRIC'|'FULL' }`
- `PATCH /api/admin/kyc/:id/reject` — `{ reason }`
- `GET /api/admin/bookings/recent` — últimos 20 bookings
- `GET /api/admin/users?page=` → `{ users[], total, page, totalPages }`
- `PATCH /api/admin/users/:id/ban` — `{ reason }`
- `PATCH /api/admin/users/:id/unban`

---

## Páginas a implementar

### 1. Landing Page `/`
- Hero com busca por cidade
- Grid de profissionais em destaque (use `GET /api/discovery/search?verified=true&online=true&limit=6`)
- Seção "Como funciona" (3 passos)
- Planos da plataforma (use `GET /api/subscriptions/plans`)
- CTA final

### 2. Busca `/search`
- Filtros: cidade, categoria, faixa de preço, idade, idioma, verificada, online agora
- Use `GET /api/discovery/search` com todos os filtros
- Cards com foto, nome, tagline, cidade, preço/h, rating, badges (verified, online, premium)
- Ordenação: relevância, preço, rating, distância

### 3. Perfil público `/profile/:slug`
- Use `GET /api/professionals/:slug`
- Galeria de fotos (carousel)
- Info: tagline, descrição, categorias, idiomas, serviços, idade, cidade
- Badges: verificada (KYC BIOMETRIC/FULL), online, premium
- Seção reviews (`GET /api/reviews/professional/:id`)
- Conteúdo premium com paywall blur (`GET /api/content/professional/:professionalId`)
- Botões: Agendar, Enviar Gorjeta, Chat, Favoritar, Assinar (se subscription enabled)
- Se o viewer já é assinante, mostrar conteúdo desbloqueado

### 4. Auth `/auth/login` e `/auth/register`
- Login: email + senha, link "esqueci senha"
- Register: etapa 1 (email → request-code), etapa 2 (preencher dados com código)
- Suporte a MFA (modal TOTP quando `mfaRequired: true`)

### 5. Booking `/booking?slug=&professionalId=`
- Selecionar data, horário, duração
- Opção de booking recorrente (weekly/biweekly/monthly, 2-12 ocorrências)
- Resumo com preço calculado
- Integrar Stripe Elements para pagamento (`POST /api/payments/bookings/:id/intent` → `clientSecret`)

### 6. Chat `/chat`
- Lista de conversas à esquerda
- Mensagens à direita com scroll infinito
- Input com opção de mensagem auto-destrutiva (TTL)
- Indicador de online/typing via WebSocket
- Timestamp relativo nas mensagens

### 7. Dashboard Cliente `/dashboard/client`
- Meus agendamentos (pendentes, confirmados, completos)
- Meus favoritos
- Minhas assinaturas (plataforma + profissionais)
- Gorjetas enviadas
- Preferências de busca
- Conteúdo desbloqueado

### 8. Dashboard Profissional `/dashboard/professional`
- Analytics (use `GET /api/pro-tools/dashboard`): bookings, earnings, views, rating, tips
- Gráfico timeseries de bookings por dia
- Agendamentos pendentes de confirmação
- Gerenciar perfil (editar bio, fotos, preços, categorias)
- Toggle online/offline
- Modo férias
- Gerenciar conteúdo premium (criar/editar/deletar)
- Templates de resposta rápida
- Configurar assinatura mensal (habilitar/desabilitar, definir preço)
- Boost (comprar destaque)
- Upload de fotos via Cloudinary (usar `/api/uploads/signature`)
- KYC: submeter selfie + documento
- Contatos de emergência
- Check-ins de segurança
- Clientes bloqueados
- Relatório fiscal

### 9. Dashboard Admin `/dashboard/admin`
- Stats cards: usuários, profissionais, bookings completos, receita
- Tab KYC: lista pendentes, modal de revisão com selfie/documento, aprovar (com nível) ou rejeitar (com motivo)
- Tab Agendamentos: últimos 20 bookings
- Tab Usuários: lista paginada com busca, badges de role/KYC/banned, botões banir/desbanir

### 10. Configurações `/settings`
- Editar perfil (nome, telefone, avatar)
- MFA: setup (QR code), enable/disable
- Contatos de emergência (CRUD)
- Alterar senha

---

## Componentes especiais

### PanicButton
Botão flutuante vermelho visível durante booking ativo (profissional). Toque longo (2s) aciona `POST /api/safety/panic` com geolocalização do browser. Mostrar confirmação antes de enviar.

### ContentPaywall
Para conteúdo PPV: thumbnail com blur overlay + cadeado + preço. Click → `POST /api/content/:id/unlock-intent` → Stripe payment → após sucesso, revelar conteúdo.

### TipModal
Dialog com input de valor (min R$5, max R$5000), campo mensagem opcional, checkbox "gorjeta pública". Integrar com Stripe Elements.

### BoostSelector
Cards dos 3 planos de boost. Mostrar multiplicador e duração. Integrar Stripe.

### CloudinaryUploader
Componente reutilizável: chama `/api/uploads/signature` com o `kind`, faz POST multipart para Cloudinary, retorna `secure_url`. Usar para avatar, fotos do perfil, KYC, conteúdo PPV.

### VerifiedBadge
Badge rosa/dourada quando `verified === true` ou `kycLevel` é `BIOMETRIC`/`FULL`. Tooltip com "Identidade verificada".

### OnlineIndicator
Bolinha verde pulsante quando `online === true`.

---

## Convenções importantes

- **Datas** em ISO 8601 UTC — converter para timezone local ao exibir
- **Valores monetários** em reais (R$), sem centavos na API
- **Paginação:** `{ items, total, page, limit, totalPages }`
- **Erros:** `{ statusCode, message, error }` com HTTP correto
- **Rate limits:** 100 req/min/IP geral, 10/min login, 5/min em register e forgot-password
- **Roles:** CLIENT pode agendar/pagar, PROFESSIONAL pode gerenciar, ADMIN pode moderar
- **Bookings só por CLIENT** — se `role !== CLIENT`, o endpoint retorna 403

---

## Dados de demonstração

10 profissionais seedados. Para testar login:
- Email: `isabela@demo.baas.app` (ou qualquer nome@demo.baas.app)
- Senha: `Demo123!Senha`
- Cidades: São Paulo, Rio, BH, Brasília, Curitiba, Porto Alegre, Salvador, Floripa, Recife

---

## Stack frontend recomendada

- React 19 + Vite
- TanStack Router (file-based routing)
- Tailwind CSS v4 (dark mode only)
- Zustand para state management
- Axios para HTTP
- Socket.IO Client para WebSocket
- Framer Motion para animações
- shadcn/ui + Radix UI para componentes
- Stripe.js + @stripe/react-stripe-js para pagamentos
- Sonner para toasts
- date-fns + locale ptBR para datas
- Lucide React para ícones

---

## Prioridades de implementação

1. **Auth completo** (register com código, login, MFA, forgot password)
2. **Busca e perfil público** (discovery/search, profile/:slug)
3. **Booking + pagamento Stripe**
4. **Chat real-time** (REST + WebSocket)
5. **Dashboards** (client, professional, admin com KYC review)
6. **Monetização** (tips, boost, conteúdo PPV, assinaturas)
7. **Segurança** (panic button, check-ins, contatos emergência)
8. **Upload Cloudinary** integrado em todos os fluxos
