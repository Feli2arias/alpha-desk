# Alpha Desk — mockup de dashboard de trading con agentes de IA

Maqueta funcional de un dashboard donde dos agentes trabajan en cadena:

- **Research Agent** (modelo rápido, alto volumen) recorre el universo de acciones, aplica filtros cuantitativos y resume las noticias relevantes.
- **Decision Agent** (modelo de razonamiento profundo) recibe lo que sobrevivió y elige las **10 mejores acciones del día**, con tesis completa, precio objetivo, stop y asignación sugerida.

> **Todo son datos falsos.** No hay APIs, ni agentes reales, ni autenticación. El objetivo de esta fase es validar la idea y el flujo de UX antes de conectar nada.

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
src/
├── types/          Modelos de dominio (Pick, Quote, Candle, Metric, ChatMessage…)
├── data/           Mocks puros: empresas, picks + tesis, noticias, logs del pipeline,
│                   respuestas del chat, y el generador de series (random walk determinista)
├── services/       ⚠️ ÚNICA fuente de datos de la UI
│   ├── marketDataService.ts   precios, series, índices, ticks en vivo
│   ├── agentService.ts        Top 10, tesis, métricas, noticias, último run
│   ├── chatService.ts         respuestas del chat (global y por acción)
│   └── latency.ts             latencia simulada
├── hooks/          useAsync, useLiveQuotes / useLiveIndices, useChat
├── context/        WatchlistProvider (watchlist en memoria), ChatDockProvider (panel de chat)
├── lib/            format (moneda, %, fechas), signals (etiquetas), random (PRNG), cn
├── components/
│   ├── layout/     AppShell, Sidebar
│   ├── ui/         Card, Badge, Delta, ScoreRing, Sparkline, Skeleton, SegmentedControl…
│   ├── charts/     PriceChart (área y velas, sobre Recharts)
│   ├── dashboard/  PickCard, PipelineStatus
│   ├── detail/     ThesisPanel, MetricsTable, NewsFeed, TargetBar
│   ├── markets/    IndexStrip, Watchlist
│   ├── chat/       ChatWindow, ChatDock, Bubble, TypingIndicator
│   └── pipeline/   FlowDiagram, RunLog
└── pages/          Dashboard, StockDetail, Markets, Pipeline
```

**Regla de arquitectura:** ningún componente importa nada de `src/data/`. Todo pasa por `src/services/`. Es lo que hace que conectar APIs reales sea cambiar tres archivos y nada más.

## Cómo conectar APIs reales

Cada servicio ya tiene las firmas definitivas. Solo hay que cambiar el cuerpo de las funciones.

### 1. Datos de mercado → `src/services/marketDataService.ts`

Reemplazar cada método por el fetch al proveedor (Polygon, Finnhub o la API de IBKR):

| Método | Endpoint típico |
|---|---|
| `getQuote(ticker)` / `getQuotes(tickers)` | snapshot de cotizaciones |
| `getSeries(ticker, range)` | agregados OHLC (mapear el rango a la resolución del proveedor) |
| `getIndices()` | snapshot de índices |
| `listCompanies()` / `getCompany()` | referencia de tickers |

Los ticks simulados (`tick()` + `subscribe()`) se reemplazan por un WebSocket: el suscriptor se mantiene igual, así que `useLiveQuotes` y todos los componentes que lo usan no cambian. Borrar `src/data/companies.ts` y `src/data/seriesGenerator.ts` cuando ya no se usen.

### 2. Pipeline de agentes → `src/services/agentService.ts`

El pipeline real corre fuera de la app (cron/worker) y persiste el resultado. Acá solo se lee:

- `getTopPicks()` → leer el último run desde la base (Supabase, S3, lo que sea).
- `getPick(ticker)` / `getNews(ticker)` → misma fuente, filtrada.
- `getLatestRun()` → metadata del run: etapas, duraciones, logs, tokens y costo.

Conviene guardar la salida del Decision Agent con el mismo shape que `Pick` para no traducir en el cliente.

### 3. Chat → `src/services/chatService.ts`

`sendMessage(context, message, history)` pasa a llamar a un endpoint propio que invoca la Claude API. El `context` ya distingue entre `scope: 'global'` y `scope: 'stock'` con su ticker — eso es exactamente lo que define el system prompt y qué se inyecta como contexto (tesis + métricas + noticias de esa acción, o el run completo).

Importante: la clave de la API **nunca** va en el cliente. La llamada tiene que pasar por un backend o una serverless function.

### 4. Lo que hay que agregar

Autenticación, persistencia de la watchlist por usuario, manejo de rate limits y caché de cotizaciones. Nada de eso existe hoy porque no hacía falta para validar el flujo.

## Notas de diseño

Dark mode fijo, estética de terminal financiera. Todos los valores visuales (colores, tipografía, espaciado, radios, sombras, duraciones) están como tokens en el bloque `@theme` de `src/index.css`; los componentes no hardcodean valores. Verde/rojo se reservan exclusivamente para performance y el violeta identifica todo lo que produce la IA. Los números usan cifras tabulares (clase `.num`) para que las columnas de precios no bailen.

Cada componente tiene su contrato documentado arriba del archivo: props, variantes, estados, accesibilidad y comportamiento responsive.

---

Los precios, métricas, noticias y razonamientos de este proyecto son ficticios y no constituyen asesoramiento financiero.
