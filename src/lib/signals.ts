import type { MetricVerdict, Sentiment, Signal } from '@/types'

export const SIGNAL_LABEL: Record<Signal, string> = {
  strong_buy: 'Comprar fuerte',
  buy: 'Comprar',
  hold: 'Mantener',
}

export const SIGNAL_TONE: Record<Signal, 'gain' | 'ai' | 'warn'> = {
  strong_buy: 'gain',
  buy: 'ai',
  hold: 'warn',
}

export const SENTIMENT_LABEL: Record<Sentiment, string> = {
  positive: 'Positivo',
  neutral: 'Neutral',
  negative: 'Negativo',
}

export const SENTIMENT_TONE: Record<Sentiment, 'gain' | 'neutral' | 'loss'> = {
  positive: 'gain',
  neutral: 'neutral',
  negative: 'loss',
}

export const VERDICT_LABEL: Record<MetricVerdict, string> = {
  bullish: 'A favor',
  neutral: 'Neutral',
  bearish: 'En contra',
}

export const VERDICT_TONE: Record<MetricVerdict, 'gain' | 'neutral' | 'loss'> = {
  bullish: 'gain',
  neutral: 'neutral',
  bearish: 'loss',
}
