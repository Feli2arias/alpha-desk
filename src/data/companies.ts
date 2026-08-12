import type { Company } from '@/types'

/**
 * Universo de empresas del mockup. `basePrice` es el ancla desde la que se
 * generan las series y los ticks en vivo. Cuando se conecte una API real,
 * este archivo desaparece y `marketDataService` consulta el proveedor.
 */
export interface CompanySeed extends Company {
  basePrice: number
  /** Deriva anual usada por el random walk (0.18 = +18% tendencial). */
  drift: number
  /** Volatilidad diaria aproximada. */
  volatility: number
  sharesOutstanding: number
  avgVolume: number
}

export const COMPANY_SEEDS: readonly CompanySeed[] = [
  {
    ticker: 'NVDA',
    name: 'NVIDIA Corporation',
    sector: 'Semiconductores',
    brandColor: '#76b900',
    basePrice: 212.4,
    drift: 0.34,
    volatility: 0.028,
    sharesOutstanding: 24_400_000_000,
    avgVolume: 198_000_000,
  },
  {
    ticker: 'MSFT',
    name: 'Microsoft Corporation',
    sector: 'Software',
    brandColor: '#4c9df8',
    basePrice: 528.9,
    drift: 0.19,
    volatility: 0.015,
    sharesOutstanding: 7_430_000_000,
    avgVolume: 21_400_000,
  },
  {
    ticker: 'META',
    name: 'Meta Platforms, Inc.',
    sector: 'Publicidad digital',
    brandColor: '#5b8cff',
    basePrice: 748.2,
    drift: 0.22,
    volatility: 0.021,
    sharesOutstanding: 2_530_000_000,
    avgVolume: 13_800_000,
  },
  {
    ticker: 'AMZN',
    name: 'Amazon.com, Inc.',
    sector: 'E-commerce / Cloud',
    brandColor: '#ff9900',
    basePrice: 258.6,
    drift: 0.17,
    volatility: 0.018,
    sharesOutstanding: 10_700_000_000,
    avgVolume: 38_200_000,
  },
  {
    ticker: 'AMD',
    name: 'Advanced Micro Devices, Inc.',
    sector: 'Semiconductores',
    brandColor: '#ed1c24',
    basePrice: 189.3,
    drift: 0.26,
    volatility: 0.031,
    sharesOutstanding: 1_630_000_000,
    avgVolume: 44_600_000,
  },
  {
    ticker: 'GOOGL',
    name: 'Alphabet Inc.',
    sector: 'Publicidad digital / Cloud',
    brandColor: '#f9ab00',
    basePrice: 224.1,
    drift: 0.15,
    volatility: 0.017,
    sharesOutstanding: 12_100_000_000,
    avgVolume: 29_700_000,
  },
  {
    ticker: 'PLTR',
    name: 'Palantir Technologies Inc.',
    sector: 'Software / Defensa',
    brandColor: '#a0aab8',
    basePrice: 168.7,
    drift: 0.41,
    volatility: 0.038,
    sharesOutstanding: 2_390_000_000,
    avgVolume: 62_100_000,
  },
  {
    ticker: 'AAPL',
    name: 'Apple Inc.',
    sector: 'Hardware de consumo',
    brandColor: '#d0d3d8',
    basePrice: 268.4,
    drift: 0.09,
    volatility: 0.014,
    sharesOutstanding: 14_800_000_000,
    avgVolume: 47_300_000,
  },
  {
    ticker: 'NFLX',
    name: 'Netflix, Inc.',
    sector: 'Streaming',
    brandColor: '#e50914',
    basePrice: 1184.5,
    drift: 0.2,
    volatility: 0.023,
    sharesOutstanding: 424_000_000,
    avgVolume: 3_100_000,
  },
  {
    ticker: 'TSLA',
    name: 'Tesla, Inc.',
    sector: 'Automotriz / Energía',
    brandColor: '#e82127',
    basePrice: 372.8,
    drift: 0.06,
    volatility: 0.036,
    sharesOutstanding: 3_500_000_000,
    avgVolume: 88_900_000,
  },
  // Fuera del Top 10 — existen para la watchlist y el buscador de Markets.
  {
    ticker: 'AVGO',
    name: 'Broadcom Inc.',
    sector: 'Semiconductores',
    brandColor: '#cc092f',
    basePrice: 342.7,
    drift: 0.24,
    volatility: 0.024,
    sharesOutstanding: 4_700_000_000,
    avgVolume: 22_500_000,
  },
  {
    ticker: 'COIN',
    name: 'Coinbase Global, Inc.',
    sector: 'Fintech / Cripto',
    brandColor: '#0052ff',
    basePrice: 318.9,
    drift: 0.28,
    volatility: 0.048,
    sharesOutstanding: 258_000_000,
    avgVolume: 11_700_000,
  },
  {
    ticker: 'JPM',
    name: 'JPMorgan Chase & Co.',
    sector: 'Banca',
    brandColor: '#5c7fa3',
    basePrice: 296.2,
    drift: 0.11,
    volatility: 0.013,
    sharesOutstanding: 2_780_000_000,
    avgVolume: 8_900_000,
  },
  {
    ticker: 'UBER',
    name: 'Uber Technologies, Inc.',
    sector: 'Movilidad',
    brandColor: '#8e9aa6',
    basePrice: 102.4,
    drift: 0.14,
    volatility: 0.025,
    sharesOutstanding: 2_100_000_000,
    avgVolume: 19_400_000,
  },
]

export const COMPANY_BY_TICKER: Readonly<Record<string, CompanySeed>> = Object.fromEntries(
  COMPANY_SEEDS.map((seed) => [seed.ticker, seed]),
)
