import type { AgentRun, NewsItem, Pick } from '@/types'
import { COMPANY_BY_TICKER } from '@/data/companies'
import { PICK_SEEDS } from '@/data/picks'
import { NEWS_SEEDS } from '@/data/news'
import { RUN_LOG_SEEDS, RUN_STAGES, RUN_TOTALS } from '@/data/pipelineRun'
import { generateSparkline } from '@/data/seriesGenerator'
import { delay, randomDelay } from './latency'

/**
 * ÚNICA fuente de salidas de los agentes para la UI.
 *
 * === PARA CONECTAR EL PIPELINE REAL ===
 * `getTopPicks()` pasa a leer el resultado persistido del último run
 * (Supabase, S3, lo que sea) y `runPipeline()` dispara el pipeline de verdad.
 * El resto de la app consume los mismos tipos.
 */

function buildPick(seed: (typeof PICK_SEEDS)[number]): Pick | null {
  const company = COMPANY_BY_TICKER[seed.ticker]
  if (!company) return null

  return {
    rank: seed.rank,
    company: {
      ticker: company.ticker,
      name: company.name,
      sector: company.sector,
      brandColor: company.brandColor,
    },
    signal: seed.signal,
    score: seed.score,
    thesis: seed.thesis,
    metrics: seed.metrics,
    sparkline: generateSparkline(seed.ticker),
    allocationPercent: seed.allocationPercent,
  }
}

/** Hora a la que corrió el pipeline hoy (6:00 local por defecto). */
function lastRunStartedAt(): Date {
  const date = new Date()
  date.setHours(RUN_TOTALS.scheduledHour, RUN_TOTALS.scheduledMinute, 0, 0)
  // Si todavía no llegó la hora del run de hoy, el último run fue ayer.
  if (date.getTime() > Date.now()) date.setDate(date.getDate() - 1)
  return date
}

export const agentService = {
  async getTopPicks(): Promise<Pick[]> {
    const picks = PICK_SEEDS.map(buildPick).filter((pick): pick is Pick => pick !== null)
    return delay(picks, randomDelay(280, 520))
  },

  async getPick(ticker: string): Promise<Pick | null> {
    const seed = PICK_SEEDS.find((item) => item.ticker === ticker.toUpperCase())
    return delay(seed ? buildPick(seed) : null, randomDelay(200, 380))
  },

  async getNews(ticker: string): Promise<NewsItem[]> {
    const items: NewsItem[] = NEWS_SEEDS.filter(
      (item) => item.ticker === ticker.toUpperCase(),
    ).map((item) => ({
      id: item.id,
      ticker: item.ticker,
      headline: item.headline,
      source: item.source,
      publishedAt: new Date(Date.now() - item.hoursAgo * 3_600_000).toISOString(),
      summary: item.summary,
      sentiment: item.sentiment,
      relevance: item.relevance,
    }))

    items.sort((a, b) => b.relevance - a.relevance)
    return delay(items, randomDelay(240, 460))
  },

  async getLatestRun(): Promise<AgentRun> {
    const startedAt = lastRunStartedAt()
    const totalMs = RUN_STAGES.reduce((sum, stage) => sum + stage.durationMs, 0)

    const run: AgentRun = {
      id: `run-${startedAt.toISOString().slice(0, 10)}`,
      startedAt: startedAt.toISOString(),
      finishedAt: new Date(startedAt.getTime() + totalMs).toISOString(),
      stages: RUN_STAGES.map((stage) => ({ ...stage, outputs: [...stage.outputs] })),
      logs: RUN_LOG_SEEDS.map((log) => ({
        at: new Date(startedAt.getTime() + log.offsetSeconds * 1000).toISOString(),
        role: log.role,
        message: log.message,
        level: log.level,
      })),
      universeSize: RUN_TOTALS.universeSize,
      survivorsAfterFilters: RUN_TOTALS.survivorsAfterFilters,
      newsProcessed: RUN_TOTALS.newsProcessed,
      tokensUsed: RUN_TOTALS.tokensUsed,
      costUsd: RUN_TOTALS.costUsd,
    }

    return delay(run, randomDelay(220, 400))
  },
}
