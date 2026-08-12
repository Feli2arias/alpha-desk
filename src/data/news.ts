import type { Sentiment } from '@/types'

/**
 * Titulares "encontrados" por el Research Agent. `hoursAgo` se convierte a
 * fecha absoluta en el servicio, así las noticias siempre se ven recientes.
 */
export interface NewsSeed {
  id: string
  ticker: string
  headline: string
  source: string
  hoursAgo: number
  summary: string
  sentiment: Sentiment
  relevance: number
}

export const NEWS_SEEDS: readonly NewsSeed[] = [
  // NVDA
  { id: 'n-nvda-1', ticker: 'NVDA', headline: 'Blackwell Ultra supera en 2,9x la eficiencia energética de la generación previa en pruebas independientes', source: 'SemiAnalysis', hoursAgo: 5, summary: 'Tres laboratorios independientes replicaron los benchmarks de inferencia con resultados consistentes.', sentiment: 'positive', relevance: 96 },
  { id: 'n-nvda-2', ticker: 'NVDA', headline: 'Los tres mayores hyperscalers elevan su guidance de capex un 22% promedio', source: 'Reuters', hoursAgo: 19, summary: 'Las llamadas de resultados mencionaron restricción energética, no escasez de chips, como principal limitante.', sentiment: 'positive', relevance: 93 },
  { id: 'n-nvda-3', ticker: 'NVDA', headline: 'Washington evalúa ampliar las restricciones de exportación de aceleradores a mercados asiáticos', source: 'Bloomberg', hoursAgo: 31, summary: 'Un borrador en circulación incluiría configuraciones hoy permitidas; sin fecha de resolución.', sentiment: 'negative', relevance: 88 },
  { id: 'n-nvda-4', ticker: 'NVDA', headline: 'TSMC adelanta la asignación de capacidad en N2 para clientes de cómputo acelerado', source: 'DigiTimes', hoursAgo: 44, summary: 'La reasignación favorece a los diseñadores de GPU frente a los de silicio móvil.', sentiment: 'positive', relevance: 79 },
  { id: 'n-nvda-5', ticker: 'NVDA', headline: 'Un fondo soberano reduce 8% su posición tras el máximo de julio', source: 'Financial Times', hoursAgo: 62, summary: 'La venta se atribuye a rebalanceo de cartera, no a un cambio de visión sobre la compañía.', sentiment: 'neutral', relevance: 64 },

  // MSFT
  { id: 'n-msft-1', ticker: 'MSFT', headline: 'El margen operativo de Intelligent Cloud se expande 340 puntos básicos interanuales', source: 'CNBC', hoursAgo: 8, summary: 'La compañía prioriza rentabilidad sobre crecimiento en el segmento de nube por primera vez.', sentiment: 'positive', relevance: 94 },
  { id: 'n-msft-2', ticker: 'MSFT', headline: 'La adopción de Copilot llega al 11% de la base comercial elegible', source: 'The Information', hoursAgo: 26, summary: 'Muy por encima del 7% que modela el consenso del sell-side, según encuesta a 400 empresas.', sentiment: 'positive', relevance: 91 },
  { id: 'n-msft-3', ticker: 'MSFT', headline: 'La Comisión Europea abre consulta sobre el empaquetado de Copilot en Microsoft 365', source: 'Politico EU', hoursAgo: 40, summary: 'Etapa preliminar, sin cargos formales; el precedente de Teams sugiere una resolución negociada.', sentiment: 'negative', relevance: 73 },
  { id: 'n-msft-4', ticker: 'MSFT', headline: 'Nuevo centro de datos en Wisconsin con contrato de energía nuclear a 20 años', source: 'Wall Street Journal', hoursAgo: 55, summary: 'Asegura suministro a costo fijo en el insumo que más presiona los márgenes del sector.', sentiment: 'positive', relevance: 81 },

  // META
  { id: 'n-meta-1', ticker: 'META', headline: 'Los anunciantes reportan una mejora del 14% en conversión con el nuevo ranking de anuncios', source: 'Ad Age', hoursAgo: 6, summary: 'Encuesta a 220 compradores de medios; la mejora se sostiene en formatos de video y catálogo.', sentiment: 'positive', relevance: 95 },
  { id: 'n-meta-2', ticker: 'META', headline: 'La acción cae 9% tras anunciar un capex de USD 128.000 millones para el próximo año', source: 'Bloomberg', hoursAgo: 22, summary: 'La reacción replica el patrón de 2022, cuando la caída por capex resultó ser oportunidad de compra.', sentiment: 'negative', relevance: 92 },
  { id: 'n-meta-3', ticker: 'META', headline: 'WhatsApp Business supera los 200 millones de cuentas activas mensuales', source: 'TechCrunch', hoursAgo: 37, summary: 'La monetización de la capa de IA en el producto aún no aparece en las estimaciones del consenso.', sentiment: 'positive', relevance: 86 },
  { id: 'n-meta-4', ticker: 'META', headline: 'Reality Labs reduce su quema trimestral a USD 4.400 millones', source: 'CNBC', hoursAgo: 51, summary: 'Primera reducción secuencial en once trimestres; sigue siendo el principal argumento bajista.', sentiment: 'neutral', relevance: 70 },

  // AMZN
  { id: 'n-amzn-1', ticker: 'AMZN', headline: 'AWS vuelve a acelerar y crece 20% tras cuatro trimestres de desaceleración', source: 'Reuters', hoursAgo: 11, summary: 'El backlog contratado y no reconocido alcanza los USD 214.000 millones.', sentiment: 'positive', relevance: 93 },
  { id: 'n-amzn-2', ticker: 'AMZN', headline: 'El margen operativo del retail norteamericano toca 6,8%, un récord histórico', source: 'Wall Street Journal', hoursAgo: 28, summary: 'La regionalización de la red logística consolida la mejora como estructural, no cíclica.', sentiment: 'positive', relevance: 89 },
  { id: 'n-amzn-3', ticker: 'AMZN', headline: 'El negocio publicitario crece 24% y se acerca en tamaño al de YouTube', source: 'Business Insider', hoursAgo: 43, summary: 'Sigue sin desglosarse por separado en los reportes, lo que oculta su margen real.', sentiment: 'positive', relevance: 84 },
  { id: 'n-amzn-4', ticker: 'AMZN', headline: 'El capex de infraestructura crece por encima de los ingresos del segmento cloud', source: 'The Information', hoursAgo: 58, summary: 'Comprime el flujo de caja libre en el corto plazo; la compañía lo defiende como inversión de ciclo.', sentiment: 'negative', relevance: 71 },

  // AMD
  { id: 'n-amd-1', ticker: 'AMD', headline: 'Los ingresos de data center saltan 81% interanual hasta USD 4.300 millones', source: 'CNBC', hoursAgo: 9, summary: 'La compañía comunicó visibilidad de contratos por USD 9.500 millones para el próximo año.', sentiment: 'positive', relevance: 94 },
  { id: 'n-amd-2', ticker: 'AMD', headline: 'Dos hyperscalers formalizan políticas de segunda fuente para aceleradores de IA', source: 'SemiAnalysis', hoursAgo: 24, summary: 'AMD es hoy el único proveedor alternativo con pila de software funcional en producción.', sentiment: 'positive', relevance: 90 },
  { id: 'n-amd-3', ticker: 'AMD', headline: 'ROCm sigue por detrás de CUDA en cargas de entrenamiento, según un estudio de MLCommons', source: 'IEEE Spectrum', hoursAgo: 39, summary: 'La brecha se achicó en inferencia pero permanece amplia en entrenamiento a gran escala.', sentiment: 'negative', relevance: 85 },
  { id: 'n-amd-4', ticker: 'AMD', headline: 'La serie MI400 entra en muestreo con clientes seleccionados', source: 'Tom’s Hardware', hoursAgo: 66, summary: 'El lanzamiento comercial define si la tesis de segundo proveedor se sostiene.', sentiment: 'positive', relevance: 78 },

  // GOOGL
  { id: 'n-googl-1', ticker: 'GOOGL', headline: 'El volumen de consultas de búsqueda crece 9% pese a la expansión de los asistentes de IA', source: 'Search Engine Land', hoursAgo: 7, summary: 'El ingreso por consulta también sube, lo que contradice la tesis de canibalización.', sentiment: 'positive', relevance: 92 },
  { id: 'n-googl-2', ticker: 'GOOGL', headline: 'Google Cloud crece 32% y encadena seis trimestres de rentabilidad operativa', source: 'Reuters', hoursAgo: 21, summary: 'A múltiplos de comparables, el segmento justifica una porción relevante de la capitalización.', sentiment: 'positive', relevance: 88 },
  { id: 'n-googl-3', ticker: 'GOOGL', headline: 'El tribunal fija audiencia sobre los acuerdos de distribución en dispositivos', source: 'Wall Street Journal', hoursAgo: 34, summary: 'Un fallo adverso cambiaría materialmente la economía del negocio de búsqueda.', sentiment: 'negative', relevance: 90 },
  { id: 'n-googl-4', ticker: 'GOOGL', headline: 'Waymo habilita operación comercial en su quinta ciudad', source: 'The Verge', hoursAgo: 49, summary: 'Ningún modelo de sell-side revisado le asigna valuación explícita al activo.', sentiment: 'positive', relevance: 76 },

  // PLTR
  { id: 'n-pltr-1', ticker: 'PLTR', headline: 'Los ingresos comerciales en EE.UU. crecen 71% interanual', source: 'Barron’s', hoursAgo: 10, summary: 'El Rule of 40 alcanza 84, un nivel que muy pocas compañías de software sostienen.', sentiment: 'positive', relevance: 93 },
  { id: 'n-pltr-2', ticker: 'PLTR', headline: 'La acción cotiza a 178x ganancias forward, el múltiplo más alto de su capitalización', source: 'Financial Times', hoursAgo: 23, summary: 'Varios analistas mantienen recomendación positiva pero con precio objetivo por debajo del spot.', sentiment: 'negative', relevance: 91 },
  { id: 'n-pltr-3', ticker: 'PLTR', headline: 'Nuevo contrato plurianual con una agencia de defensa por USD 480 millones', source: 'Defense News', hoursAgo: 36, summary: 'El pipeline gubernamental sigue creciendo aunque baje su peso relativo en los ingresos.', sentiment: 'positive', relevance: 87 },
  { id: 'n-pltr-4', ticker: 'PLTR', headline: 'La dilución por compensación en acciones alcanza el 5,8% anual', source: 'Seeking Alpha', hoursAgo: 54, summary: 'Casi tres veces la mediana del sector; erosiona el retorno por acción de forma sostenida.', sentiment: 'negative', relevance: 74 },

  // AAPL
  { id: 'n-aapl-1', ticker: 'AAPL', headline: 'Los ingresos de servicios crecen 14% con márgenes del 74%', source: 'CNBC', hoursAgo: 12, summary: 'Ya representan 28% de los ingresos totales y sostienen prácticamente toda la tesis.', sentiment: 'positive', relevance: 89 },
  { id: 'n-aapl-2', ticker: 'AAPL', headline: 'El ciclo de renovación de iPhone se estira a 4,3 años, el más largo registrado', source: 'Counterpoint Research', hoursAgo: 25, summary: 'Sin evidencia todavía de que las funciones de IA aceleren la decisión de recambio.', sentiment: 'negative', relevance: 92 },
  { id: 'n-aapl-3', ticker: 'AAPL', headline: 'El uso semanal de las funciones de IA se estanca en el 23% de la base compatible', source: 'The Information', hoursAgo: 41, summary: 'No se observa correlación entre uso de IA e intención de compra de hardware nuevo.', sentiment: 'negative', relevance: 86 },
  { id: 'n-aapl-4', ticker: 'AAPL', headline: 'La compañía retira 3,4% del capital en los últimos doce meses vía recompras', source: 'Bloomberg', hoursAgo: 57, summary: 'Sostiene el crecimiento del EPS aun con ingresos prácticamente planos.', sentiment: 'positive', relevance: 72 },

  // NFLX
  { id: 'n-nflx-1', ticker: 'NFLX', headline: 'El ARPU del plan con publicidad supera al del plan básico sin avisos', source: 'Variety', hoursAgo: 14, summary: 'USD 11,40 contra USD 9,80 en los mercados donde ambos conviven hace más de un año.', sentiment: 'positive', relevance: 91 },
  { id: 'n-nflx-2', ticker: 'NFLX', headline: 'El margen operativo llega a 29,4%, ocho puntos arriba del año anterior', source: 'Reuters', hoursAgo: 27, summary: 'La mejora ocurre mientras el contenido en vivo sigue en fase de inversión.', sentiment: 'positive', relevance: 88 },
  { id: 'n-nflx-3', ticker: 'NFLX', headline: 'La puja por derechos deportivos eleva el costo por evento en la industria', source: 'Sportico', hoursAgo: 45, summary: 'El retorno se mide en retención, una métrica difícil de atribuir con precisión.', sentiment: 'negative', relevance: 79 },
  { id: 'n-nflx-4', ticker: 'NFLX', headline: 'El plan con avisos se expande a cuatro mercados de Asia-Pacífico', source: 'Nikkei Asia', hoursAgo: 60, summary: 'Región con menor ARPU pero mayor potencial de volumen de suscriptores.', sentiment: 'positive', relevance: 75 },

  // TSLA
  { id: 'n-tsla-1', ticker: 'TSLA', headline: 'El negocio de almacenamiento de energía crece 78% con márgenes brutos del 31%', source: 'Bloomberg', hoursAgo: 13, summary: 'Mejores márgenes que el negocio automotriz, pero solo 12% de los ingresos totales.', sentiment: 'positive', relevance: 90 },
  { id: 'n-tsla-2', ticker: 'TSLA', headline: 'Las entregas caen 4% interanual y el precio promedio baja por séptimo trimestre', source: 'Reuters', hoursAgo: 29, summary: 'Los recortes de precio ya no están defendiendo volumen de forma efectiva.', sentiment: 'negative', relevance: 94 },
  { id: 'n-tsla-3', ticker: 'TSLA', headline: 'Fabricantes chinos ganan participación en Europa por sexto trimestre consecutivo', source: 'Financial Times', hoursAgo: 46, summary: 'La tendencia parece estructural más que cíclica según los datos de matriculaciones.', sentiment: 'negative', relevance: 87 },
  { id: 'n-tsla-4', ticker: 'TSLA', headline: 'La compañía amplía el programa de robotaxi sin publicar métricas de utilización', source: 'The Verge', hoursAgo: 63, summary: 'Buena parte de la valuación depende de un negocio que aún no reporta datos operativos.', sentiment: 'neutral', relevance: 82 },
]
