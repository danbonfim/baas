# BAAS Frontend — TanStack Start

Porta do frontend Next.js 16 para **TanStack Router v1 + Vite 7 + React 19 + Tailwind v4**.

## Stack

| Camada | Tecnologia |
|---|---|
| Roteamento | `@tanstack/react-router` v1 (file-based) |
| Bundler | Vite 7 |
| UI | React 19 + Tailwind v4 |
| Estado | Zustand v5 |
| HTTP | Axios |
| WebSocket | Socket.IO Client |
| Componentes | shadcn/ui + Radix UI |
| Animações | Framer Motion |
| Formulários | React state nativo |

## Rodar localmente

```bash
npm install
npm run dev
```

Acessa em: http://localhost:5173

## Configurar backend

Edite `.env`:
```
VITE_API_URL=http://localhost:3001/api
VITE_WS_URL=http://localhost:3001
```

## Em produção

Quando hospedado (Vercel/Netlify/Railway), o backend NestJS precisa estar em HTTPS:
```
VITE_API_URL=https://seu-backend.railway.app/api
VITE_WS_URL=https://seu-backend.railway.app
```

## Estrutura de rotas

```
src/routes/
├── __root.tsx                        → Layout global (Navbar + Footer)
├── index.tsx                         → / (Homepage)
├── search.tsx                        → /search
├── auth.login.tsx                    → /auth/login
├── auth.register.tsx                 → /auth/register
├── profile.$slug.tsx                 → /profile/:slug
└── _authenticated/                   → Layout protegido (requer auth)
    ├── chat.tsx                      → /chat
    ├── booking.tsx                   → /booking?slug=&professionalId=
    ├── dashboard.client.tsx          → /dashboard/client
    ├── dashboard.professional.tsx    → /dashboard/professional
    └── dashboard.admin.tsx           → /dashboard/admin
```

## Scripts

```bash
npm run dev        # Inicia o servidor de desenvolvimento
npm run build      # Build de produção
npm run preview    # Preview do build
npm run typecheck  # Verifica tipos TypeScript
```
