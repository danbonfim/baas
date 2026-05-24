# 🚀 Prompt completo para Lovable — BAAS Backend Integration v2

> Cole isto inteiro no Lovable em https://basaservice.lovable.app

---

## Visão geral

O backend está em produção em **`https://baas-production-5a08.up.railway.app/api`** e expõe 80+ endpoints REST cobrindo: autenticação, perfis, agendamentos, pagamentos, segurança (MFA + pânico + KYC), monetização (gorjetas, conteúdo PPV, assinaturas, boost), descoberta inteligente e ferramentas profissionais.

**WebSocket:** `https://baas-production-5a08.up.railway.app` (mesmo host, namespace `/chat`)

**Documentação interativa:** `https://baas-production-5a08.up.railway.app/api/docs` (Swagger UI completo)

---

## Autenticação

JWT Bearer. Salve `accessToken` no localStorage após login/register. Envie em toda requisição autenticada como header:

```
Authorization: Bearer {accessToken}
```

### Fluxo de cadastro (2 etapas — código por email)

1. **`POST /api/auth/register/request-code`** — body `{ email }` → envia código de 6 dígitos por email
2. **`POST /api/auth/register`** — body `{ email, name, password, phone?, role?, city?, state? }` — onde **`password`** é o **código recebido** por email. Retorna `{ accessToken, tokenType }`

### Login

**`POST /api/auth/login`** — `{ email, password, mfaToken? }`
- Se MFA habilitado e `mfaToken` ausente: retorna `{ mfaRequired: true }` (peça o código TOTP, reenvie)
- Senão retorna `{ accessToken, tokenType }`

### Esqueci a senha

1. **`POST /api/auth/forgot-password`** — `{ email }` (sempre 200, anti-enumeração)
2. **`POST /api/auth/reset-password`** — `{ email, code, newPassword }` (mínimo 6 chars)

### MFA (Multi-Factor Auth — TOTP)

- `POST /api/auth/mfa/setup` → retorna `{ secret, qrCode (base64 png), otpAuthUrl }`. Mostre o QR para o usuário escanear no Google Authenticator
- `POST /api/auth/mfa/enable` — `{ token }` (6 dígitos) → retorna 10 backup codes **uma única vez**
- `POST /api/auth/mfa/disable` — `{ password }`
- `POST /api/auth/mfa/backup-codes/regenerate` → novos 10 códigos

---

## Endpoints (todas as 80+ rotas)

### 👤 Usuários
- `GET /api/auth/me` — perfil do usuário logado
- `GET /api/users/profile` — perfil completo
- `PATCH /api/users/profile` — `{ name?, phone?, avatar? }`

### 💼 Profissionais (busca pública)
- `GET /api/professionals?city=&category=&minPrice=&maxPrice=&verified=&online=&sortBy=&page=&limit=`
- `GET /api/professionals/:slug` — perfil público
- `PATCH /api/professionals/profile` — (PRO) atualizar perfil
- `GET /api/professionals/dashboard` — (PRO) estatísticas
- `POST /api/professionals/:id/favorite` — toggle favorito
- `GET /api/professionals/:id/is-favorited`
- `GET /api/professionals/me/favorites`

### 🔍 Descoberta inteligente (use estes para listagens!)
- `GET /api/discovery/search` — busca avançada: `city, category, minPrice, maxPrice, minAge, maxAge, language, service, verified, online, minRating, hasContent, hasSubscription, sortBy, page, limit`
- `GET /api/discovery/nearby?lat=&lng=&radius=` — busca por proximidade (raio km, max 100)
- `GET /api/discovery/available-now?city=&maxPrice=&verified=&lat=&lng=` — quem está online agora
- `GET /api/discovery/for-you` — (CLIENT) matches personalizados (score-ranked)
- `GET /api/discovery/recommendations` — (CLIENT) "quem agendou X também agendou Y"
- `GET /api/discovery/preferences` — (CLIENT) buscar preferências
- `PATCH /api/discovery/preferences` — `{ ageMin, ageMax, preferredCities, preferredCategories, preferredLanguages, preferredServices, maxPricePerHour, minRating, onlyVerified, preferOnline }`
- `POST /api/discovery/travel-mode` — (PRO) `{ city, state, lat, lng, startsAt, endsAt, notes }`
- `DELETE /api/discovery/travel-mode/:id`
- `GET /api/discovery/travel-mode/mine`
- `GET /api/discovery/travel-mode/coming-to/:city`
- `PATCH /api/discovery/online-status` — (PRO) `{ online: boolean }`
- `PATCH /api/discovery/location` — (PRO) `{ lat, lng }`

### 📅 Agendamentos
- `POST /api/bookings` — `{ professionalId, date, startTime, endTime, durationHours, location?, notes? }`
- `POST /api/bookings/recurring` — `{ professionalId, startDate, startTime, endTime, durationHours, recurrence: 'weekly'|'biweekly'|'monthly', occurrences (2-12), location?, notes? }`
- `GET /api/bookings/my` — (CLIENT) `?status=`
- `GET /api/bookings/professional` — (PRO) `?status=`
- `PATCH /api/bookings/:id/confirm` — (PRO)
- `PATCH /api/bookings/:id/cancel` — `{ reason? }`
- `PATCH /api/bookings/:id/complete` — (PRO)
- `PATCH /api/bookings/:id/reschedule` — `{ date, startTime, endTime, durationHours }` (≥12h notice para client)
- `POST /api/bookings/:id/refund` — `{ reason? }` (tier: >48h=100%, 24-48h=75%, 12-24h=50%, <12h=0%; PRO cancel sempre 100%)

### 💰 Pagamentos (Stripe)
- `POST /api/payments/bookings/:bookingId/intent` — cria PaymentIntent, retorna `{ clientSecret, paymentIntentId }` (use com @stripe/stripe-js)
- `POST /api/payments/connect/onboarding` — (PRO) inicia Stripe Connect Express, retorna `{ url }` (redirecione)
- `POST /api/payments/webhook` — endpoint de webhook (não use no frontend)

### 💸 Gorjetas (Tips)
- `POST /api/tips/intent` — `{ professionalId, amount (5-5000), message?, isPublic? }` → `{ clientSecret, ... }`
- `GET /api/tips/sent` — (CLIENT) minhas gorjetas enviadas
- `GET /api/tips/received` — (PRO) recebidas
- `GET /api/tips/public/:professionalId` — últimas gorjetas públicas (social proof)

### 🚀 Boost / Impulso
- `GET /api/boost/plans` — 3 planos
- `POST /api/boost/intent` — `{ type: 'STANDARD'|'PREMIUM'|'ULTRA' }` → `{ clientSecret, ... }`
- `GET /api/boost/my` — (PRO) boost ativo
- `GET /api/boost/history`

### 📸 Conteúdo PPV (Pay-Per-View)
- `POST /api/content` — (PRO) `{ type: 'PHOTO'|'VIDEO'|'AUDIO', url, thumbnailUrl?, blurUrl?, title?, description?, price (3-1000), durationSeconds? }`
- `GET /api/content/mine` — (PRO) meus conteúdos
- `GET /api/content/professional/:professionalId` — listagem pública (locked items vêm com `url:null` + `blurUrl`)
- `POST /api/content/:id/unlock-intent` — (CLIENT) gera pagamento de desbloqueio
- `PATCH /api/content/:id` — `{ title?, description?, price?, visible? }`
- `DELETE /api/content/:id` — soft delete

### 👑 Pro Subscription (estilo OnlyFans)
- `PATCH /api/pro-subscription/enable` — (PRO) `{ monthlyPrice (15-500) }`
- `PATCH /api/pro-subscription/disable`
- `POST /api/pro-subscription/:professionalId/intent` — (CLIENT) assina
- `DELETE /api/pro-subscription/:professionalId` — cancelar (mantém até fim do período)
- `GET /api/pro-subscription/mine` — (CLIENT) minhas assinaturas
- `GET /api/pro-subscription/subscribers` — (PRO) meus assinantes

### 🛡️ Segurança / Safety
- `GET /api/safety/emergency-contacts` — lista (máx 3)
- `POST /api/safety/emergency-contacts` — `{ name, phone, email?, relationship?, isPrimary? }`
- `DELETE /api/safety/emergency-contacts/:id`
- `POST /api/safety/checkins` — (PRO) `{ bookingId?, intervalMinutes?, lat?, lng? }` cria ciclo
- `PATCH /api/safety/checkins/:id/confirm` — `{ lat?, lng? }` (PRO confirma "estou bem")
- `GET /api/safety/checkins/active`
- `POST /api/safety/panic` — `{ lat?, lng?, accuracy?, message?, audioUrl?, bookingId? }` (envia email automático aos contatos!)
- `PATCH /api/safety/panic/:id/resolve` — `{ resolution: 'RESOLVED'|'FALSE_ALARM', note? }`
- `GET /api/safety/panic` — últimos alertas
- `GET /api/safety/clients/:clientId/profile` — (PRO) ver reputação do cliente antes de aceitar booking
- `POST /api/safety/clients/:clientId/block` — `{ reason? }`
- `DELETE /api/safety/clients/:clientId/block`
- `GET /api/safety/blocked-clients`
- `POST /api/safety/client-review` — (PRO) `{ bookingId, rating, punctuality?, respectful?, paidOnTime?, comment? }`

### ✅ KYC (Verificação)
- `GET /api/kyc/me` — meu status
- `POST /api/kyc/submit` — `{ selfieUrl, documentUrl, documentType? }` (PRO)
- `GET /api/kyc/admin/pending` — (ADMIN)
- `PATCH /api/kyc/admin/:id/approve` — `{ level: 'DOCUMENT'|'BIOMETRIC'|'FULL' }`
- `PATCH /api/kyc/admin/:id/reject` — `{ reason }`

### 💬 Chat (WebSocket + REST)
- `GET /api/chat/conversations` — lista
- `POST /api/chat/conversations` — `{ professionalId }`
- `GET /api/chat/conversations/:id/messages`
- `POST /api/chat/conversations/:id/messages` — `{ content, ttlSeconds? }` (ttlSeconds = mensagem autodestrutiva: 60/3600/86400)
- `DELETE /api/chat/messages/:messageId` — soft delete
- `POST /api/chat/conversations/:id/read`
- **WebSocket:** namespace `/chat`, eventos: `join`, `message`, `typing`

### 📊 Pro Tools (ferramentas profissional)
- `GET /api/pro-tools/dashboard?days=30` — analytics completo
- `GET /api/pro-tools/earnings/balance` — pending/available/paid
- `PATCH /api/pro-tools/vacation` — `{ active, until? }` pausa perfil sem perder rating
- `GET /api/pro-tools/templates` — quick-replies
- `POST /api/pro-tools/templates` — `{ id?, title, content }` (criar ou editar)
- `DELETE /api/pro-tools/templates/:id`
- `GET /api/pro-tools/fiscal-report/:year` — relatório fiscal completo (IR)

### 🌟 Reviews
- `POST /api/reviews` — `{ bookingId, rating, comment? }`
- `GET /api/reviews/professional/:id`
- `GET /api/reviews/reviewable` — meus bookings que posso avaliar

### 🔔 Notificações
- `GET /api/notifications`
- `GET /api/notifications/unread-count` → `{ count }`
- `PATCH /api/notifications/read-all`
- `PATCH /api/notifications/:id/read`

### 🛒 Subscriptions de plataforma (créditos)
- `GET /api/subscriptions/plans`
- `GET /api/subscriptions/my`
- `POST /api/subscriptions` — `{ plan: 'BASIC'|'PREMIUM'|'VIP' }`
- `DELETE /api/subscriptions`

---

## Estrutura sugerida no frontend

### 1. Criar `src/lib/api.ts`

```typescript
const BASE = 'https://baas-production-5a08.up.railway.app/api'

export async function api(path: string, init: RequestInit = {}) {
  const token = localStorage.getItem('accessToken')
  const headers = new Headers(init.headers)
  headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)
  
  const res = await fetch(BASE + path, { ...init, headers })
  if (res.status === 401) {
    localStorage.removeItem('accessToken')
    window.location.href = '/login'
    return
  }
  return res.json()
}

export const api_get  = (path: string) => api(path)
export const api_post = (path: string, body: any) => api(path, { method: 'POST', body: JSON.stringify(body) })
export const api_patch = (path: string, body: any) => api(path, { method: 'PATCH', body: JSON.stringify(body) })
export const api_delete = (path: string) => api(path, { method: 'DELETE' })
```

### 2. Substituir TODOS os mocks pelas chamadas reais

Use o índice de endpoints acima. Os principais fluxos:

- **Home/listagem:** `GET /api/discovery/search` (ou `/nearby` se geolocalização permitida)
- **Para você:** `GET /api/discovery/for-you` (após login)
- **Disponível agora:** `GET /api/discovery/available-now`
- **Recomendações:** `GET /api/discovery/recommendations`
- **Perfil pro:** `GET /api/professionals/:slug` + `GET /api/content/professional/:id` + `GET /api/tips/public/:id`
- **Agendar:** `POST /api/bookings` → `POST /api/payments/bookings/:id/intent` → integrar Stripe Elements
- **Dashboard pro:** `GET /api/pro-tools/dashboard`
- **Chat:** REST inicial + WebSocket para real-time

### 3. Componentes específicos a criar

- **PanicButton component** — botão flutuante na tela durante booking ativo. Toque longo aciona `POST /api/safety/panic` com geolocalização do navegador
- **EmergencyContactsSettings** — em config, CRUD com `/api/safety/emergency-contacts`
- **MfaSetupModal** — 2 passos: mostrar QR (img src do qrCode) → input código → mostrar 10 backup codes
- **BoostSelector** — `GET /api/boost/plans` → cards dos 3 planos
- **TipModal** — input valor + mensagem + checkbox público
- **ContentPaywall** — para conteúdo PPV: blur + botão "Desbloquear por R$X"
- **VerifiedBadge** — mostrar selo quando `kycLevel === 'BIOMETRIC'` ou `FULL`

### 4. Anti-screenshot (Categoria 1 item pendente)

No CSS global, adicione:
```css
.protected-content { 
  -webkit-user-select: none; user-select: none;
  -webkit-touch-callout: none;
}
@media print { .protected-content { display: none !important; } }
```

E para mobile/PWA: usar `screen.orientation` API + detectar print via `window.matchMedia('print')`.

---

## Convenções importantes

- **Datas** vêm em ISO 8601 UTC. Converta para timezone local exibindo
- **Valores monetários** em reais (R$), centavos não usados na API REST (apenas internamente no Stripe)
- **Paginação padrão:** `{ items, total, page, limit, totalPages }`
- **Erros:** `{ statusCode, message, error }` com HTTP correto (400/401/403/404/409/429/500)
- **Rate limits:** 100 req/min/IP geral, 10 req/min em `/auth/login`, 5 req/min em `/auth/forgot-password` e `/register/request-code`
- **MFA:** quando habilitado, `login` retorna `{ mfaRequired: true }` se faltar `mfaToken` — peça o código TOTP e refaça a chamada

---

## Pronto para integrar 🎉

**O que fazer:**
1. Remover todos os dados mockados
2. Implementar fluxo de auth completo (request-code → register → JWT no localStorage)
3. Substituir listagens pelos endpoints reais (`/api/discovery/*`)
4. Integrar Stripe Elements para pagamentos
5. Adicionar componentes de segurança (panic button, emergency contacts)
6. Implementar PWA com push notifications

Mantenha o design visual atual. Apenas troque o data source.
