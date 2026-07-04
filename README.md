# ESP32 Monitor

Plataforma industrial de monitoramento de dispositivos ESP32 em tempo real.

## Stack

- **Frontend**: React 19 · Vite · TypeScript · Tailwind v4 · shadcn/ui · TanStack Router · TanStack Query · Framer Motion · Chart.js
- **Backend**: Lovable Cloud (PostgreSQL + Realtime + Storage + Auth) — servido via Supabase
- **E-mails**: EmailJS (100% no cliente — o Supabase **não** envia nenhum e-mail)
- **Deploy**: Vercel

## Características

- 🔐 Autenticação por e-mail e senha com **código de verificação de 6 dígitos** enviado via EmailJS
- 🔑 Recuperação de senha por código (sem links de e-mail)
- 📊 Dashboard em tempo real com telemetria (temperatura, umidade, energia, gerador, LEDs, botões)
- 🚨 Alertas e logs em tempo real via Supabase Realtime
- 📱 Design moderno com glassmorphism leve, tema claro/escuro, tipografia Inter
- 🔌 Endpoints públicos para ingestão HTTPS a partir do ESP32
- 🛡️ RLS ativo — cada usuário só vê seus próprios dispositivos e dados
- 📟 Firmware Arduino de exemplo incluído (`firmware/esp32_lovable_client.ino`)

## Estrutura

```
src/
├── components/
│   ├── layout/          # AppShell, Sidebar
│   └── ui/              # shadcn/ui primitives
├── hooks/
│   ├── useAuth.tsx      # Contexto de autenticação
│   ├── useTheme.tsx     # Tema claro/escuro
│   └── useTelemetry.ts  # Devices, telemetria, alertas, logs (com Realtime)
├── lib/
│   ├── emailjs.ts       # Integração EmailJS
│   ├── verification.ts  # Geração/validação de códigos 6 dígitos
│   └── utils.ts
├── integrations/
│   └── supabase/        # (gerado) client + types
├── routes/
│   ├── __root.tsx
│   ├── index.tsx        # Landing
│   ├── auth.tsx         # Login/Cadastro
│   ├── verify.tsx       # Validação do código
│   ├── forgot.tsx       # Solicitar reset
│   ├── reset.tsx        # Nova senha
│   ├── _authenticated/  # Rotas protegidas
│   │   ├── route.tsx
│   │   ├── dashboard.tsx
│   │   ├── devices.tsx
│   │   ├── devices.$deviceId.tsx
│   │   ├── alerts.tsx
│   │   ├── logs.tsx
│   │   └── settings.tsx
│   └── api/public/      # Endpoints ESP32 (sem auth de sessão)
│       ├── ingest.ts    # POST telemetria
│       ├── log.ts       # POST log
│       ├── alert.ts     # POST alerta
│       └── reset-password.ts
└── styles.css           # Design system (oklch tokens)
firmware/
└── esp32_lovable_client.ino
```

## Fluxo de cadastro (sem e-mail do Supabase)

1. Usuário informa e-mail + senha em `/auth`.
2. `supabase.auth.signUp` cria a conta com **auto_confirm** habilitado.
3. Um código de 6 dígitos é gerado, salvo na tabela `verification_codes` (expira em 15 min).
4. EmailJS envia o código para o usuário.
5. Em `/verify`, o código é validado, `profiles.is_active` vira `true`.
6. Redirecionamento para `/dashboard`.

O layout `_authenticated` bloqueia usuários cuja `profiles.is_active = false` — eles são enviados para `/verify` até ativar a conta.

## Fluxo de recuperação de senha

1. Em `/forgot`, usuário informa o e-mail.
2. Código de 6 dígitos gerado e enviado via EmailJS.
3. Em `/reset`, o código é validado.
4. Nova senha enviada para `/api/public/reset-password`, que valida o código novamente e chama `auth.admin.updateUserById` no backend.

## Ingestão ESP32

Endpoint: `POST /api/public/ingest`

```json
{
  "device_id": "esp32-001",
  "device_key": "<gerada no painel>",
  "temperature": 24.5,
  "humidity": 62,
  "status": "ok",
  "energy": true,
  "generator": false,
  "leds": { "led1": true, "led2": false },
  "buttons": { "btn1": false, "btn2": false },
  "uptime": 12345,
  "ip": "192.168.0.42",
  "mac": "AA:BB:CC:DD:EE:FF",
  "wifi": "MinhaRede",
  "rssi": -55
}
```

O endpoint valida `device_id` + `device_key` contra a tabela `devices`, insere em `telemetry` e atualiza `online=true, last_seen=now()`. Realtime propaga a linha para todos os clientes conectados.

Endpoints análogos: `/api/public/log` e `/api/public/alert`.

## Instalação

```bash
bun install
cp .env.example .env
# preencha VITE_EMAILJS_*
bun dev
```

## Deploy na Vercel

1. Faça push do repositório.
2. Importe na Vercel — o preset TanStack Start é detectado automaticamente.
3. Configure as variáveis de ambiente (todas do `.env.example`).
4. Deploy.

## Notas de segurança

- Todos os e-mails nativos do Supabase (confirmação, magic link, OTP, reset) estão **desligados**.
- A chave `service_role` **nunca** é exposta ao cliente — só é usada dentro dos server routes `/api/public/*`.
- A tabela `verification_codes` permite inserção anônima intencionalmente (é como o fluxo funciona sem magic links). Os códigos são aleatórios (6 dígitos) e expiram em 15 minutos.
- RLS ativo em todas as tabelas de dados; usuários só acessam recursos que possuem.
"# ja-to-loco" 
