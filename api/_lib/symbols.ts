import type { AssetClass } from './providers/nasdaq'

/**
 * Índices de referencia de la barra superior.
 *
 * Nasdaq sólo publica COMP y NDX como índice real. Para S&P 500, Dow y Russell
 * se usa el ETF que los replica: son instrumentos reales y líquidos, y la UI los
 * marca como proxy para no presentarlos como si fueran el índice mismo.
 */
export interface IndexDefinition {
  /** Símbolo que se le pide al proveedor. */
  symbol: string
  /** Símbolo canónico del índice, para mostrar. */
  displaySymbol: string
  name: string
  assetClass: AssetClass
  /** True si el valor viene de un ETF que replica el índice. */
  proxy: boolean
}

export const INDEX_DEFINITIONS: readonly IndexDefinition[] = [
  { symbol: 'SPY', displaySymbol: 'SPX', name: 'S&P 500', assetClass: 'etf', proxy: true },
  { symbol: 'NDX', displaySymbol: 'NDX', name: 'Nasdaq 100', assetClass: 'index', proxy: false },
  { symbol: 'COMP', displaySymbol: 'COMP', name: 'Nasdaq Composite', assetClass: 'index', proxy: false },
  { symbol: 'DIA', displaySymbol: 'DJI', name: 'Dow Jones', assetClass: 'etf', proxy: true },
]

/**
 * ETFs conocidos del universo. Saber la clase de antemano evita el pedido
 * fallido contra `assetclass=stocks` que haría el descubrimiento automático.
 */
const KNOWN_ETFS = new Set(['SPY', 'QQQ', 'DIA', 'IWM', 'VOO', 'VTI', 'ARKK', 'SMH', 'XLK', 'VIXY'])

/** Orden de clases a probar para un símbolo cualquiera. */
export function assetClassCandidates(symbol: string): readonly AssetClass[] {
  return KNOWN_ETFS.has(symbol) ? ['etf', 'stocks'] : ['stocks', 'etf']
}
