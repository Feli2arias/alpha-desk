import fs from 'node:fs'
import path from 'node:path'
import type { Connect, Plugin } from 'vite'
import type { ApiHandler, ApiRequest, ApiResponse } from '../api/_lib/handler'

/**
 * Sirve las funciones de `api/` durante `npm run dev`.
 *
 * En producción las ejecuta Vercel; Vite no sabe nada de ellas. Este plugin
 * replica el mismo contrato (`ApiRequest`/`ApiResponse`) y carga los handlers
 * con `ssrLoadModule`, así que el hot reload también aplica al backend y lo que
 * se prueba en local es exactamente lo que corre desplegado.
 */

/** Sólo rutas planas en minúscula: bloquea `_lib` y cualquier salto de directorio. */
const ROUTE_PATTERN = /^[a-z][a-z0-9-]*$/

export function devApiPlugin(apiDir = 'api'): Plugin {
  return {
    name: 'alpha-desk:dev-api',
    apply: 'serve',

    configureServer(server) {
      const middleware: Connect.NextHandleFunction = (req, res, next) => {
        const rawUrl = req.url ?? ''
        if (!rawUrl.startsWith('/api/')) {
          next()
          return
        }

        void handle(rawUrl, req.method ?? 'GET', res).catch((error: unknown) => {
          console.error('[dev-api] error no controlado:', error)
          if (!res.writableEnded) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.end(JSON.stringify({ ok: false, data: null, error: 'Error interno del dev server' }))
          }
        })
      }

      async function handle(rawUrl: string, method: string, res: ServerResponseLike) {
        const url = new URL(rawUrl, 'http://localhost')
        const routeName = url.pathname.slice('/api/'.length)

        if (!ROUTE_PATTERN.test(routeName)) {
          respond(res, 404, { ok: false, data: null, error: 'Ruta de API no encontrada' })
          return
        }

        const file = path.resolve(process.cwd(), apiDir, `${routeName}.ts`)
        if (!fs.existsSync(file)) {
          respond(res, 404, { ok: false, data: null, error: `No existe /api/${routeName}` })
          return
        }

        const module = (await server.ssrLoadModule(file)) as { default?: ApiHandler }
        const handler = module.default
        if (typeof handler !== 'function') {
          respond(res, 500, {
            ok: false,
            data: null,
            error: `/api/${routeName} no exporta un handler por defecto`,
          })
          return
        }

        const request: ApiRequest = {
          method,
          url: rawUrl,
          query: Object.fromEntries(url.searchParams.entries()),
        }

        await handler(request, adaptResponse(res))
      }

      // Se registra antes que el middleware de SPA para que /api/* no caiga en index.html.
      server.middlewares.use(middleware)
    },
  }
}

/** Lo mínimo de `http.ServerResponse` que necesita el adaptador. */
interface ServerResponseLike {
  statusCode: number
  writableEnded: boolean
  setHeader(name: string, value: string): unknown
  end(chunk?: string): unknown
}

/** Envuelve la respuesta de Node en la forma que esperan los handlers de Vercel. */
function adaptResponse(res: ServerResponseLike): ApiResponse {
  const api: ApiResponse = {
    status(code) {
      res.statusCode = code
      return api
    },
    setHeader(name, value) {
      res.setHeader(name, value)
    },
    json(body) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.end(JSON.stringify(body))
    },
  }
  return api
}

function respond(res: ServerResponseLike, status: number, body: unknown): void {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(body))
}
