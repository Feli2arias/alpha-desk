# Alpha Desk — mockup de dashboard de trading con agentes de IA

Maqueta funcional de un dashboard donde dos agentes trabajan en cadena:

- **Research Agent** (modelo rápido, alto volumen) recorre el universo de acciones, aplica filtros cuantitativos y resume las noticias relevantes.
- **Decision Agent** (modelo de razonamiento profundo) recibe lo que sobrevivió y elige las **10 mejores acciones del día**, con tesis completa, precio objetivo, stop y asignación sugerida.

> **Qué es real y qué no.** Los precios, los gráficos, los fundamentales y las
> noticias son datos reales del mercado estadounidense, servidos por las funciones
> de `api/`. Lo que sigue simulado es la capa de agentes: la selección del Top 10,
> los puntajes de confianza, las tesis y el chat. No hay autenticación ni
> persistencia por usuario.

## Arrancar

```bash
npm install
npm run dev
```

Otros comandos: `npm run build` (build de producción + chequeo de tipos), `npm run lint`, `npm run preview`.

## Stack

React 19 · Vite · TypeScript · Tailwind CSS v4 · React Router · Recharts · Lucide.

## Pantallas

| Ruta | Qué es |
|---|---|
| `/` | **Top 10 del día** — grid de 10 cards con score de confianza, señal, precio en vivo y sparkline. Header con el estado del pipeline. |
| `/stock/:ticker` | **El porqué** — tesis del Decision Agent, tabla de métricas con veredicto, noticias con sentimiento, gráfico de precio y chat contextual. |
| `/markets` | **Markets** — gráfico grande (línea o velas), rangos 1D–1Y, índices y watchlist editable. Los precios se mueven cada 3 segundos. |
| `/pipeline` | **Pipeline de agentes** — el flujo Research → Decisión → Top 10 con los logs del último run. |

El chat global se abre desde el botón flotante en cualquier pantalla. El chat contextual (limitado a una acción) se abre desde el botón *"Hablar sobre esta acción"* en la vista de detalle.

## Estructura

```
api/                          Funciones serverless — el único lugar que habla con el proveedor
├── quote.ts  series.ts  profile.ts  news.ts  indices.ts  search.ts
└── _lib/
    ├── handler.ts            contrato de request/response + envolvente de la respuesta
    ├── http.ts               fetch con timeout y reintento
    ├── cache.ts              caché TTL en memoria de la lambda
    ├── parse.ts              "$1.234,56" -> number + validación de símbolos
    └── providers/            nasdaq (precios), nasdaqContent (noticias, universo), finnhub (opcional)

vite/devApiPlugin.ts          sirve api/ durante npm run dev

src/
├── types/          Modelos de dominio (Quote, Candle, Fundamentals, Pick, MarketStatus…)
├── data/           Respaldo determinista para cuando el proveedor no responde
├── services/       ⚠️ ÚNICA fuente de datos de la UI
│   ├── apiClient.ts           el único fetch de la app: dedupe, caché y errores
│   ├── marketDataService.ts   precios, series, fundamentales, índices, búsqueda
│   ├── quoteStream.ts         polling compartido, con cadencia según la sesión
│   ├── agentService.ts        Top 10, tesis, métricas, noticias, último run
│   └── chatService.ts         respuestas del chat (global y por acción)
├── hooks/          useAsync, useLiveQuotes / useLiveIndices / useMarketStatus, useChat
├── context/        WatchlistProvider, AnalysisProvider, AgentChatProvider
├── lib/            format, signals, marketStatus (sesión en horario de Nueva York),
│                   brandColors, random (PRNG), cn
├── components/
│   ├── layout/     AppShell, Sidebar
│   ├── ui/         Card, Badge, Delta, Stat, PageHeader, ScoreRing, Skeleton…
│   ├── charts/     PriceChart (área y velas, con panel de volumen, sobre Recharts)
│   ├── dashboard/  PickCard, PipelineStatus
│   ├── detail/     ThesisPanel, MetricsTable, NewsFeed, TargetBar
│   ├── markets/    IndexStrip, Watchlist, SymbolSearch, MarketStatusPill
│   ├── chat/       ChatStream, ChatComposer, AnalysisMessage, VerdictCard…
│   └── pipeline/   FlowDiagram, RunLog
└── pages/          Dashboard, AgentPage, WatchlistPage, Markets, StockDetail, Pipeline
```

**Regla de arquitectura:** ningún componente hace `fetch` ni importa nada de `src/data/`. Todo pasa por `src/services/`. Gracias a eso, conectar los datos reales no obligó a tocar ni un componente: sólo cambió el cuerpo de los servicios.

## Datos de mercado

Los datos salen de funciones serverless en `api/`, no del cliente. Hacerlo del
lado del servidor permite ocultar claves, cachear y esquivar el CORS de los
proveedores.

| Endpoint | Devuelve |
|---|---|
| `GET /api/quote?symbols=NVDA,MSFT` | cotización en vivo de hasta 25 símbolos |
| `GET /api/series?symbol=NVDA&range=1M` | velas OHLC (`1D` intradía de 5 min; el resto diarias) |
| `GET /api/profile?symbol=NVDA` | fundamentales: rangos, volumen, capitalización, dividendo |
| `GET /api/news?symbol=NVDA` | titulares con fuente, resumen y link |
| `GET /api/indices` | S&P 500, Nasdaq 100, Nasdaq Composite y Dow |
| `GET /api/search?q=nvidia` | busca por ticker o nombre en ~7000 papeles listados en EE.UU. |

**Proveedor:** la API pública de Nasdaq, que no necesita clave. `FINNHUB_API_KEY`
es opcional y sólo agrega P/E, BPA y beta — ver `.env.example`.

**Índices:** Nasdaq sólo publica COMP y NDX como índice. El S&P 500 y el Dow se
leen del ETF que los replica (SPY y DIA) y la UI los marca con "vía SPY" para no
presentarlos como si fueran el índice.

**Si el proveedor falla,** cada método de `marketDataService` cae al generador
determinista de `src/data/` y marca el resultado con `source: 'simulated'`, que la
interfaz muestra en pantalla. Nunca se hace pasar un dato simulado por real.

**En desarrollo,** `npm run dev` sirve las mismas funciones a través de
`vite/devApiPlugin.ts`, así que local y producción se comportan igual.

## Cómo conectar el resto

### 1. Pipeline de agentes → `src/services/agentService.ts`

El pipeline real corre fuera de la app (cron/worker) y persiste el resultado. Acá solo se lee:

- `getTopPicks()` → leer el último run desde la base (Supabase, S3, lo que sea).
- `getPick(ticker)` / `getNews(ticker)` → misma fuente, filtrada.
- `getLatestRun()` → metadata del run: etapas, duraciones, logs, tokens y costo.

Conviene guardar la salida del Decision Agent con el mismo shape que `Pick` para no traducir en el cliente.

### 2. Chat → `src/services/chatService.ts`

`sendMessage(context, message, history)` pasa a llamar a un endpoint propio que invoca la Claude API. El `context` ya distingue entre `scope: 'global'` y `scope: 'stock'` con su ticker — eso es exactamente lo que define el system prompt y qué se inyecta como contexto (tesis + métricas + noticias de esa acción, o el run completo).

Importante: la clave de la API **nunca** va en el cliente. La llamada tiene que pasar por un backend o una serverless function.

### 3. Lo que hay que agregar

Autenticación y persistencia de la watchlist por usuario. El caché y los límites de pedidos ya están resueltos en `api/_lib/cache.ts` y en las cabeceras `s-maxage` de cada endpoint.

## Notas de diseño

Dark mode fijo, estética de terminal financiera. Todos los valores visuales (colores, tipografía, espaciado, radios, sombras, duraciones) están como tokens en el bloque `@theme` de `src/index.css`; los componentes no hardcodean valores. Verde/rojo se reservan exclusivamente para performance y el violeta identifica todo lo que produce la IA. Los números usan cifras tabulares (clase `.num`) para que las columnas de precios no bailen.

Cada componente tiene su contrato documentado arriba del archivo: props, variantes, estados, accesibilidad y comportamiento responsive.

---

Los precios, métricas, noticias y razonamientos de este proyecto son ficticios y no constituyen asesoramiento financiero.
