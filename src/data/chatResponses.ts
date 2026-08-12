/**
 * Respuestas simuladas del chat. La detección de intención es por palabras
 * clave: alcanza para que la maqueta se sienta viva. Cuando se conecte la
 * Claude API, `chatService` reemplaza esto por una llamada real y el resto
 * de la app no se entera.
 */

export interface Intent {
  id: string
  /** Si alguna aparece en el mensaje del usuario, matchea. */
  keywords: readonly string[]
}

export const GLOBAL_INTENTS: readonly Intent[] = [
  { id: 'top_picks', keywords: ['top', 'picks', 'elecciones', 'mejores', 'ranking', 'hoy', 'lista'] },
  { id: 'market_view', keywords: ['mercado', 'market', 'índice', 'indice', 'macro', 'contexto', 'panorama'] },
  { id: 'risk', keywords: ['riesgo', 'riesgos', 'peligro', 'caída', 'caida', 'crash', 'burbuja'] },
  { id: 'sector', keywords: ['sector', 'semiconductor', 'chips', 'tecnología', 'tecnologia', 'concentración', 'concentracion', 'diversif'] },
  { id: 'how_it_works', keywords: ['cómo', 'como', 'funciona', 'agente', 'pipeline', 'proceso', 'criterio', 'filtro'] },
  { id: 'allocation', keywords: ['asignación', 'asignacion', 'portafolio', 'cartera', 'cuánto', 'cuanto', 'invertir', 'plata', 'capital'] },
  { id: 'compare', keywords: ['comparar', 'versus', 'vs', 'mejor que', 'diferencia', 'elegir entre'] },
  { id: 'sell', keywords: ['vender', 'salir', 'stop', 'cerrar', 'tomar ganancia'] },
]

export const GLOBAL_ANSWERS: Readonly<Record<string, readonly string[]>> = {
  top_picks: [
    'El Top 10 de hoy está bastante inclinado hacia infraestructura de IA: NVDA, MSFT y META se llevan el 43% de la asignación sugerida entre las tres. La convicción media del run fue 80,3/100, un poco más alta que el promedio de la semana.\n\nLo que más me llamó la atención es META en el puesto 3: cayó 9% por el anuncio de capex y el Decision Agent lo leyó como oportunidad, no como deterioro. Es la posición donde la desconexión entre precio y fundamentals es más clara.\n\nEn el otro extremo, TSLA entró décima con señal de Mantener y solo 5% de asignación — entra casi exclusivamente por el negocio de energía.',
  ],
  market_view: [
    'El contexto general está constructivo pero angosto. El Nasdaq sube 0,74% mientras el Dow cae 0,20%: eso es rotación hacia tecnología, no un mercado subiendo parejo. El VIX en 14,8 indica que nadie está pagando por protección.\n\nEso tiene una lectura de doble filo. Mientras el flujo siga favoreciendo crecimiento, las posiciones del Top 10 se benefician. Pero un mercado angosto es frágil: si la rotación se da vuelta, las posiciones de alta beta del portafolio (PLTR, AMD, TSLA) van a caer más rápido que el índice.\n\nPor eso la cartera de hoy mezcla deliberadamente megacaps defensivas con nombres de momentum.',
  ],
  risk: [
    'Los tres riesgos que veo en la cartera de hoy, en orden de importancia:\n\n**1. Concentración sectorial.** Cuatro de las diez posiciones son semiconductores o dependen directamente del capex de IA. El Decision Agent ya redujo asignaciones por esto, pero la correlación entre NVDA, AMD, MSFT y META en un escenario de "digestión de capex" es alta.\n\n**2. Valuación en la cola.** PLTR a 178x y TSLA a 72x son posiciones donde no hay margen de error. Juntas son 13% del portafolio.\n\n**3. Riesgo regulatorio binario en GOOGL.** No se puede modelar con probabilidades honestas, por eso la asignación quedó en 9% y no más.',
  ],
  sector: [
    'La concentración en semiconductores es el punto débil declarado del run de hoy. NVDA (16%) y AMD (10%) son exposición directa; MSFT (14%) y META (13%) son exposición indirecta vía capex de infraestructura.\n\nEn total, alrededor del 53% del portafolio se mueve con la misma narrativa. El Decision Agent lo marcó explícitamente en los logs y redujo la asignación de AMD por ese motivo.\n\nSi querés diversificar, los candidatos que quedaron afuera con mejor puntaje eran de sectores no correlacionados — bancos y salud. Puedo revisarlos si te interesa.',
  ],
  how_it_works: [
    'El pipeline corre todos los días a las 6:00 y tiene dos etapas.\n\n**Research Agent** (modelo rápido, alto volumen): arranca con 500 tickers, aplica tus filtros cuantitativos — liquidez, capitalización, momentum, crecimiento — y quedan 47. Después busca noticias de las últimas 48 horas de esos 47 y las clasifica por sentimiento y relevancia.\n\n**Decision Agent** (modelo de razonamiento profundo): recibe los 47 candidatos con métricas y noticias, y decide. Descartó 19 por valuación y 18 por riesgo, y redactó la tesis completa de los 10 que quedaron.\n\nEl run de hoy tardó 9 minutos 58 segundos y costó USD 2,84.',
  ],
  allocation: [
    'Las asignaciones sugeridas no son iguales entre posiciones: reflejan convicción y riesgo, no reparto parejo.\n\nNVDA 16%, MSFT 14%, META 13% y AMZN 11% forman el núcleo — 54% en cuatro posiciones de alta convicción y riesgo acotado.\n\nAMD 10%, GOOGL 9%, PLTR 8% son exposición con riesgo asumido. AAPL 7% y NFLX 7% son posiciones de menor upside. TSLA 5% es la mínima expresión.\n\nAclaración importante: son porcentajes de la porción de capital que decidas destinar a esta estrategia, no de tu patrimonio total. Y esto es un mockup con datos falsos — no es asesoramiento financiero.',
  ],
  compare: [
    'Si la comparación es NVDA contra AMD, la respuesta corta es que no compiten por lo mismo dentro del portafolio.\n\nNVDA es la posición de convicción: mejores márgenes (74,8% contra 54,2%), mejor ecosistema de software y —paradójicamente— múltiplo más barato (38x contra 41x). Es rara la situación donde el líder cotiza más barato que el retador.\n\nAMD es una apuesta a una dinámica de compras, no a superioridad técnica: los hyperscalers necesitan un segundo proveedor y no hay otro con software funcional. Es una tesis válida pero de menor calidad, y por eso lleva 10% y no 16%.\n\nSi tuvieras que quedarte con una sola, es NVDA.',
  ],
  sell: [
    'Cada posición del Top 10 tiene stop definido por el Decision Agent, y están calculados sobre invalidación de tesis, no sobre porcentajes redondos.\n\nLos más ajustados son AMD (164, a 13% del spot) y PLTR (142, a 16%) — justamente las posiciones donde el riesgo es mayor y la salida tiene que ser rápida.\n\nEn el otro extremo, GOOGL tiene el stop más ancho porque la tesis es de 9 a 18 meses y necesita margen para el ruido regulatorio.\n\nDel lado de las ganancias: los precios objetivo asumen los horizontes indicados en cada tesis. Llegar antes de tiempo al objetivo es motivo para revisar la tesis, no para vender automáticamente.',
  ],
}

export const GLOBAL_FALLBACKS: readonly string[] = [
  'No tengo un dato específico sobre eso en el run de hoy. Lo que sí puedo contarte: el pipeline analizó 500 acciones, 47 pasaron los filtros y el Decision Agent eligió 10 con una convicción media de 80,3/100.\n\n¿Querés que profundice en alguna posición en particular, en los riesgos del portafolio o en cómo funciona el proceso de selección?',
  'Esa pregunta se sale de lo que analizó el pipeline hoy. Puedo ayudarte con las 10 posiciones seleccionadas, las métricas que evaluó el Research Agent, los riesgos de la cartera o el contexto de mercado.\n\nSi querés algo puntual de una acción, abrí su detalle y usá el chat contextual — ahí tengo toda la tesis cargada.',
]

/** Intenciones del chat contextual de una acción. */
export const STOCK_INTENTS: readonly Intent[] = [
  { id: 'why', keywords: ['por qué', 'por que', 'porque', 'razón', 'razon', 'tesis', 'motivo', 'justific'] },
  { id: 'risk', keywords: ['riesgo', 'riesgos', 'peligro', 'contra', 'malo', 'preocup'] },
  { id: 'target', keywords: ['objetivo', 'target', 'precio', 'cuánto', 'cuanto', 'upside', 'llegar'] },
  { id: 'metrics', keywords: ['métrica', 'metrica', 'p/e', 'pe', 'eps', 'rsi', 'margen', 'número', 'numero', 'ratio', 'valuación', 'valuacion'] },
  { id: 'news', keywords: ['noticia', 'noticias', 'titular', 'novedad', 'pasó', 'paso', 'sentimiento'] },
  { id: 'horizon', keywords: ['horizonte', 'plazo', 'cuándo', 'cuando', 'tiempo', 'meses', 'largo'] },
  { id: 'sell', keywords: ['vender', 'stop', 'salir', 'cerrar', 'perder'] },
  { id: 'buy_now', keywords: ['comprar', 'entrar', 'ahora', 'momento', 'timing', 'esperar'] },
]
