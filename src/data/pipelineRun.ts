import type { AgentStage, RunLogEntry } from '@/types'

/** Instantánea del último run del pipeline. Hoy es fija; mañana la escribe el orquestador. */
export const RUN_STAGES: readonly AgentStage[] = [
  {
    role: 'research',
    label: 'Research Agent',
    model: 'modelo rápido · alto volumen',
    status: 'done',
    durationMs: 412_000,
    summary:
      'Recorre el universo completo, aplica los filtros cuantitativos definidos por el usuario y resume las noticias relevantes de las últimas 48 horas para cada superviviente.',
    outputs: [
      { label: 'Acciones analizadas', value: '500' },
      { label: 'Pasaron filtros', value: '47' },
      { label: 'Noticias procesadas', value: '230' },
      { label: 'Métricas calculadas', value: '4.000' },
    ],
  },
  {
    role: 'decision',
    label: 'Decision Agent',
    model: 'modelo de razonamiento profundo',
    status: 'done',
    durationMs: 186_000,
    summary:
      'Recibe los 47 candidatos con sus métricas y noticias, los evalúa uno por uno, descarta los que no superan el umbral de convicción y redacta la tesis completa de los 10 elegidos.',
    outputs: [
      { label: 'Candidatos evaluados', value: '47' },
      { label: 'Seleccionados', value: '10' },
      { label: 'Descartados por valuación', value: '19' },
      { label: 'Descartados por riesgo', value: '18' },
    ],
  },
]

/** Logs del run. `offsetSeconds` es el desplazamiento desde el inicio del run. */
export interface RunLogSeed {
  offsetSeconds: number
  role: RunLogEntry['role']
  message: string
  level: RunLogEntry['level']
}

export const RUN_LOG_SEEDS: readonly RunLogSeed[] = [
  { offsetSeconds: 0, role: 'system', message: 'Pipeline iniciado — universo: S&P 500 + Nasdaq 100 (500 tickers únicos)', level: 'info' },
  { offsetSeconds: 6, role: 'research', message: 'Descargando fundamentals y precios de 500 tickers…', level: 'info' },
  { offsetSeconds: 42, role: 'research', message: 'Filtro de liquidez: descartados 84 tickers con volumen medio < 1M', level: 'info' },
  { offsetSeconds: 58, role: 'research', message: 'Filtro de capitalización: descartados 137 tickers por debajo de USD 10 B', level: 'info' },
  { offsetSeconds: 92, role: 'research', message: 'Filtro de momentum (RSI 30–75 y precio > SMA200): quedan 112 candidatos', level: 'info' },
  { offsetSeconds: 140, role: 'research', message: 'Filtro de crecimiento (ingresos YoY > 8%): quedan 47 candidatos', level: 'success' },
  { offsetSeconds: 168, role: 'research', message: 'Buscando noticias de las últimas 48 h para 47 tickers…', level: 'info' },
  { offsetSeconds: 215, role: 'research', message: '230 artículos recuperados de 34 fuentes — 18 descartados por baja relevancia', level: 'info' },
  { offsetSeconds: 252, role: 'research', message: 'Clasificación de sentimiento completada: 141 positivos, 52 neutrales, 37 negativos', level: 'success' },
  { offsetSeconds: 278, role: 'research', message: 'Advertencia: sin cobertura de noticias para 3 tickers, se evalúan solo con métricas', level: 'warn' },
  { offsetSeconds: 300, role: 'research', message: 'Paquete de hallazgos entregado al Decision Agent (47 candidatos, 4.000 métricas)', level: 'success' },
  { offsetSeconds: 318, role: 'decision', message: 'Evaluando candidatos contra el mandato: horizonte 3–12 meses, riesgo moderado', level: 'info' },
  { offsetSeconds: 352, role: 'decision', message: '19 candidatos descartados por valuación fuera de rango respecto a su crecimiento', level: 'info' },
  { offsetSeconds: 394, role: 'decision', message: '18 candidatos descartados por concentración de riesgo o catalizador no verificable', level: 'info' },
  { offsetSeconds: 430, role: 'decision', message: 'Advertencia: 4 de los 10 seleccionados pertenecen al sector semiconductores — se reduce asignación', level: 'warn' },
  { offsetSeconds: 468, role: 'decision', message: 'Redactando tesis y precios objetivo para los 10 seleccionados…', level: 'info' },
  { offsetSeconds: 545, role: 'decision', message: 'Top 10 finalizado — convicción media 80,3/100', level: 'success' },
  { offsetSeconds: 598, role: 'system', message: 'Pipeline completado en 9 m 58 s — costo estimado USD 2,84', level: 'success' },
]

export const RUN_TOTALS = {
  universeSize: 500,
  survivorsAfterFilters: 47,
  newsProcessed: 230,
  tokensUsed: 1_284_600,
  costUsd: 2.84,
  /** Hora local a la que corre el pipeline todos los días. */
  scheduledHour: 6,
  scheduledMinute: 0,
} as const
