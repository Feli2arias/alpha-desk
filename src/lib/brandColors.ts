import { seedFromString } from './random'

/**
 * Color de marca por ticker. Se usa en avatares y gráficos.
 *
 * Las marcas conocidas llevan su color real; para cualquier otro símbolo se
 * deriva un tono estable del propio ticker, así el universo completo del
 * proveedor tiene identidad visual sin mantener una lista infinita.
 */

const BRAND_COLORS: Readonly<Record<string, string>> = {
  NVDA: '#76b900',
  MSFT: '#4c9df8',
  META: '#5b8cff',
  AMZN: '#ff9900',
  AMD: '#ed1c24',
  GOOGL: '#f9ab00',
  GOOG: '#f9ab00',
  PLTR: '#a0aab8',
  AAPL: '#d0d3d8',
  NFLX: '#e50914',
  TSLA: '#e82127',
  AVGO: '#cc092f',
  COIN: '#0052ff',
  JPM: '#5c7fa3',
  UBER: '#8e9aa6',
  SPY: '#5b8cff',
  QQQ: '#6f7ce8',
  DIA: '#7f93ad',
}

/** Saturación y luminosidad fijas: cualquier tono generado se ve parejo con los reales. */
function derivedColor(ticker: string): string {
  const hue = seedFromString(ticker) % 360
  return `oklch(0.72 0.14 ${hue})`
}

export function brandColor(ticker: string): string {
  return BRAND_COLORS[ticker] ?? derivedColor(ticker)
}
