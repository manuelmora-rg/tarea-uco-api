# One Piece Explorer · Archivo de la Grand Line

Aplicación web completa para explorar el universo de One Piece con **datos reales** de APIs públicas. Incluye un frontend en React + Vite y un backend propio en Node + Express que actúa como única puerta de entrada a los datos.

> **El navegador nunca llama a las APIs externas.** Todo el tráfico pasa por nuestro backend, que normaliza, valida, filtra, pagina, cachea y protege las peticiones.

La aplicación combina dos fuentes de forma independiente:

- **Datos base** ([api-onepiece.com v2](https://api.api-onepiece.com/v2)): personajes, frutas, tripulaciones, sagas, arcos, barcos y recompensas. Sigue siendo la fuente principal y puede usarse sola con `DATA_PROVIDER=onepiece_v2`.
- **Imágenes y datos complementarios** ([onepieceapi.com](https://onepieceapi.com)): retratos de personajes, imágenes de barcos, arte específico de frutas y relleno de edad, estado o recompensa cuando falta en la fuente base.

---

## 1. Qué incluye

| Sección | Contenido |
| --- | --- |
| **Inicio** | Héroe, cifras reales del catálogo, carteles destacados con retrato, accesos rápidos, frutas con imagen y explicación de la arquitectura |
| **Personajes** | Listado con búsqueda, filtros por tripulación/estado, orden y paginación · retrato real cuando existe una correspondencia segura · ficha individual |
| **Frutas** | Catálogo con tipo, descripción y arte específico de la fruta · ficha individual |
| **Tripulaciones** | Listado ordenado por recompensa total, estado y número de integrantes · ficha con miembros derivados, capitán y retratos |
| **Recompensas** | Carteles *Wanted* generados con las recompensas reales, siempre de mayor a menor |
| **Arcos** | Arcos agrupados por saga, con rangos de capítulos, volúmenes y episodios · ficha individual |
| **Barcos** | Catálogo con tipo, tripulación, capitán e imagen real · ficha individual |
| **Buscador global** | Búsqueda simultánea en personajes, frutas, tripulaciones, barcos y arcos, agrupada por categoría |

Además: estados de carga, error y vacío; *fallbacks* de imagen; paginación; diseño responsive; navegación por teclado y etiquetas ARIA; metadatos del proveedor activo visibles en la interfaz.

---

## 2. Stack

- **Frontend:** React 19, TypeScript, Vite 6, React Router 7, TanStack Query 5, CSS propio (sistema de diseño con tokens).
- **Backend:** Node 20+, Express 4, TypeScript, Zod, Helmet, CORS, express-rate-limit.
- **Tests:** Vitest + Supertest (unitarios, API y una suite de integración real opcional).
- **Monorepo:** npm workspaces (`backend`, `frontend`).

---

## 3. Requisitos

- Node.js **≥ 20** (validado con Node 26.13.0 y npm 11.20.0).
- npm ≥ 10.
- Conexión a Internet para consultar la API de origen.

---

## 4. Puesta en marcha

```bash
# 1. Instalar dependencias (desde la raíz)
npm install

# 2. Crear la configuración local
#    En Windows PowerShell:
Copy-Item .env.example .env
#    En bash/macOS/Linux:
#    cp .env.example .env

# 3. Arrancar backend y frontend a la vez
npm run dev
```

- Frontend: <http://localhost:5173>
- API propia: <http://localhost:4000/api/health>

Vite hace *proxy* de `/api` hacia `http://localhost:4000`, por lo que el frontend usa siempre la ruta relativa `/api`. No hay claves ni URLs privadas en el cliente.

### Producción

```bash
npm run build     # compila backend (dist/server.js) y frontend (frontend/dist)
NODE_ENV=production npm start   # bash / macOS / Linux
# PowerShell: $env:NODE_ENV='production'; npm start
# el frontend compilado se sirve con cualquier servidor estático o CDN
```

`npm run build` fuerza `NODE_ENV=production` en el build del frontend, de modo que el bundle nunca incluye el runtime de desarrollo de React.

También existe `npm run preview -w frontend` para previsualizar el build con el proxy `/api` activo.

### Scripts

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Backend con recarga (`tsx watch`) + Vite en paralelo |
| `npm run build` | Compila backend y frontend |
| `npm start` | Ejecuta el backend compilado |
| `npm run typecheck` | TypeScript estricto en ambos paquetes |
| `npm test` | Tests unitarios y de API con proveedor falso |
| `npm run test:live` | Tests de integración contra la API real |

---

## 5. Variables de entorno

Definidas en `.env.example`:

| Variable | Por defecto | Uso |
| --- | --- | --- |
| `PORT` | `4000` | Puerto del backend |
| `DATA_PROVIDER` | `onepiece_multisource` | Proveedor activo: `onepiece_multisource` (datos + imágenes) u `onepiece_v2` (solo datos) |
| `ONEPIECE_API_BASE_URL` | `https://api.api-onepiece.com/v2` | Base de la API de datos |
| `ONEPIECE_API_LOCALE` | `en` | Idioma solicitado (`en` o `fr`) |
| `ONEPIECE_API_TIMEOUT_MS` | `15000` | Timeout de cada petición a la API de datos |
| `IMAGE_PROVIDER` | `onepieceapi` | Fuente de imágenes: `onepieceapi` o `none` |
| `ONEPIECEAPI_BASE_URL` | `https://www.onepieceapi.com/api` | Base de la API de imágenes (el host `www` evita el 308) |
| `ONEPIECEAPI_TIMEOUT_MS` | `15000` | Timeout de cada petición a la API de imágenes |
| `ONEPIECEAPI_PAGE_SIZE` | `100` | Registros por página (máximo real de la API: 100) |
| `ONEPIECEAPI_MAX_PAGES` | `60` | Límite duro de páginas por catálogo |
| `IMAGE_ENRICHMENT_WAIT_MS` | `4000` | Espera máxima al catálogo de imágenes antes de responder con los datos base; la carga sigue en segundo plano (`0` desactiva el límite) |
| `CACHE_TTL_MS` | `600000` | TTL de las cachés en memoria (datos e imágenes) |
| `CORS_ORIGIN` | `http://localhost:5173` | Orígenes permitidos, separados por coma |
| `RATE_LIMIT_WINDOW_MS` | `60000` | Ventana del límite de peticiones |
| `RATE_LIMIT_MAX` | `300` | Peticiones por ventana y por IP |
| `MEDIA_ALLOWED_HOSTS` | `images.api-onepiece.com,hlryizauzapedkefdviw.supabase.co` | Hosts permitidos por el proxy de imágenes |
| `MEDIA_MAX_BYTES` | `8000000` | Tamaño máximo de imagen proxificada |
| `VITE_API_URL` | `/api` | Ruta base que consume el frontend |

Copia `.env.example` a `.env`. El archivo `.env` está excluido por `.gitignore`.

`NODE_ENV` **no** se define en `.env`: Vite comparte ese archivo y usa `NODE_ENV` para decidir entre build de desarrollo y de producción. El backend asume `development` por defecto; en producción se define en el proceso (ver arriba).

---

## 6. Arquitectura

```text
frontend (React)               backend (Express)                    APIs externas
      │                              │                                    │
      │ GET /api/characters?search=  │                                    │
      ├─────────────────────────────▶│ valida (Zod)                       │
      │                              │ caché TTL + deduplicación          │
      │                              │                                    │
      │                              │  ┌─ onepiece_multisource ────────┐ │
      │                              │  │ datos base ──────────────────▶ api-onepiece.com v2
      │                              │  │ imágenes / relleno ──────────▶ onepieceapi.com
      │                              │  │ correspondencia segura        │ │
      │                              │  └───────────────────────────────┘ │
      │                              │ normaliza a modelo de dominio      │
      │◀─────────────────────────────┤ filtra / ordena / pagina           │
      │ JSON { data, meta }          │ responde                           │
```

El proveedor compuesto **nunca sobrescribe** los datos de la fuente base: solo añade imágenes verificadas y rellena edad, estado o recompensa cuando la fuente principal los devuelve vacíos. Cada entidad incluye un bloque opcional `source` con la procedencia:

```json
"source": { "data": "onepiece_v2", "image": "onepieceapi", "match": "name" }
```

```text
tarea-uco-api/
├─ backend/
│  ├─ src/
│  │  ├─ config/env.ts                 # validación de entorno con Zod
│  │  ├─ types/domain.ts               # modelo interno (frontera con el frontend)
│  │  ├─ providers/
│  │  │  ├─ provider.interface.ts      # contratos DataProvider e ImageEnrichmentSource
│  │  │  ├─ provider.factory.ts        # registro y selección por env
│  │  │  ├─ onepiece-v2/               # datos base (adaptador independiente)
│  │  │  │  ├─ client.ts               # transporte, timeout y reintentos
│  │  │  │  ├─ mappers.ts              # normalización y corrección de erratas
│  │  │  │  └─ provider.ts             # implementación del contrato
│  │  │  ├─ onepieceapi/               # imágenes y datos complementarios
│  │  │  │  ├─ client.ts               # paginación secuencial y reintentos
│  │  │  │  ├─ mappers.ts              # normalización y descarte de arte genérico
│  │  │  │  ├─ provider.ts             # catálogos cacheados con TTL
│  │  │  │  └─ types.ts                # tipos de la API complementaria
│  │  │  └─ multisource/
│  │  │     ├─ matcher.ts              # correspondencia segura entre fuentes
│  │  │     └─ provider.ts             # composición, precedencia y degradación
│  │  ├─ services/catalog.service.ts   # filtros, orden, paginación, búsqueda, stats
│  │  ├─ controllers/                  # serialización de respuestas
│  │  ├─ routes/                       # montaje de /api
│  │  ├─ middleware/                   # validación, errores, logging
│  │  ├─ utils/                        # caché TTL, errores HTTP, texto
│  │  ├─ app.ts                        # CORS, Helmet, rate limit, rutas
│  │  └─ server.ts
│  └─ tests/                           # mappers, API con proveedor falso, integración real
├─ frontend/
│  ├─ src/
│  │  ├─ api/                          # cliente HTTP y hooks de React Query
│  │  ├─ types/                        # contrato público de la API
│  │  ├─ components/                   # layout, tarjetas, UI, buscador
│  │  ├─ pages/                        # una página por sección
│  │  ├─ hooks/                        # título de página
│  │  ├─ utils/                        # formato
│  │  └─ styles/                       # tokens, base, componentes, layout, páginas
│  └─ vite.config.ts                   # proxy /api → backend
└─ .env.example
```

### Cambiar de proveedor sin tocar el frontend

1. Crear un adaptador que implemente `DataProvider` y devuelva el modelo de `types/domain.ts`.
2. Registrarlo en `backend/src/providers/provider.factory.ts`:

```ts
registerProvider('mi_api', () => new MiApiProvider(/* ... */));
```

3. Arrancar con `DATA_PROVIDER=mi_api`.

El frontend no cambia: sigue consumiendo `/api`. El proveedor activo y sus limitaciones se exponen en `/api/meta` y se muestran en la interfaz.

### Fuentes intercambiables

| Configuración | Comportamiento |
| --- | --- |
| `DATA_PROVIDER=onepiece_multisource` + `IMAGE_PROVIDER=onepieceapi` | Datos base + imágenes y relleno de huecos (por defecto) |
| `DATA_PROVIDER=onepiece_multisource` + `IMAGE_PROVIDER=none` | Datos base con marcadores, sin contactar con la segunda API |
| `DATA_PROVIDER=onepiece_v2` | Comportamiento original: solo datos base, sin enriquecimiento |

Las dos fuentes se implementan con adaptadores separados (`DataProvider` e `ImageEnrichmentSource`). Para sustituir la fuente de imágenes basta con crear otro adaptador que implemente `ImageEnrichmentSource`, registrarlo y apuntar `IMAGE_PROVIDER` a él; el matcher y el frontend no cambian.

---

## 7. API propia

Base: `http://localhost:4000/api`

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/health` | Estado del servicio y proveedor activo |
| GET | `/health/upstream` | Comprueba la conexión real con el proveedor |
| GET | `/meta` | Proveedor, capacidades, limitaciones y endpoints externos |
| GET | `/stats` | Cifras del catálogo y destacados |
| GET | `/filters` | Opciones para los filtros (tripulaciones, tipos de fruta, sagas) |
| GET | `/search?q=` | Búsqueda global agrupada (mínimo 2 caracteres) |
| GET | `/bounties` | Personajes con recompensa, orden descendente |
| GET | `/characters` | Listado paginado de personajes |
| GET | `/characters/:id` | Ficha de personaje |
| GET | `/fruits` | Listado paginado de frutas |
| GET | `/fruits/:id` | Ficha de fruta |
| GET | `/crews` | Listado paginado de tripulaciones |
| GET | `/crews/:id` | Ficha con integrantes derivados y capitán |
| GET | `/arcs` | Listado de arcos |
| GET | `/arcs/:id` | Ficha de arco |
| GET | `/sagas` | Listado de sagas |
| GET | `/boats` | Listado paginado de barcos |
| GET | `/boats/:id` | Ficha de barco |
| GET | `/media?src=` | Proxy de imágenes con lista blanca de hosts |

### Parámetros comunes

- `page` (entero ≥ 1, por defecto `1`)
- `limit` (entero 1–60, por defecto `24`)
- `search` (texto, máx. 100)

Específicos: `sort` (`bounty_desc`, `bounty_asc`, `name_asc`, `name_desc`, `id_asc` según recurso), `crew`, `status`, `hasBounty`, `type`, `saga`.

### Formato de respuesta

```json
{
  "data": [ /* … */ ],
  "meta": {
    "provider": "onepiece_multisource",
    "generatedAt": "2026-11-15T17:04:49.884Z",
    "page": 1,
    "limit": 24,
    "total": 786,
    "totalPages": 33
  }
}
```

Errores centralizados:

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "…", "details": [ … ] } }
```

Códigos usados: `VALIDATION_ERROR`, `NOT_FOUND`, `ROUTE_NOT_FOUND`, `UPSTREAM_ERROR`, `CORS_FORBIDDEN`, `RATE_LIMITED`, `MEDIA_HOST_NOT_ALLOWED`, `MEDIA_INVALID_PROTOCOL`, `MEDIA_TOO_LARGE`, `INTERNAL_ERROR`.

---

## 8. APIs externas utilizadas

### 8.1 Datos base · api-onepiece.com v2

**Proveedor:** [api-onepiece.com](https://api.api-onepiece.com) · versión `v2`.

Endpoints reales (verificados por inspección directa):

```text
GET /v2/characters/:locale
GET /v2/fruits/:locale
GET /v2/crews/:locale
GET /v2/sagas/:locale
GET /v2/arcs/:locale
GET /v2/boats/:locale
```

- Solo se admiten los locales **`en`** y **`fr`**; cualquier otro (`es`, `pt`, `de`…) devuelve `400 {"message":"The locale is wrong"}`.
- La URL pública de documentación (`https://api.api-onepiece.com/documentation`) devuelve **404**; los endpoints se documentaron tras validarlos directamente.
- No existen parámetros de paginación, filtrado ni búsqueda. El backend descarga el catálogo una vez, lo normaliza y lo cachea; los filtros y la paginación se resuelven en memoria.

Volumen validado (2026-11-15):

| Recurso | Registros |
| --- | ---: |
| Personajes | 786 |
| Frutas | 213 |
| Tripulaciones | 149 |
| Arcos | 50 |
| Sagas | 10 |
| Barcos | 99 |

### 8.2 Imágenes y datos complementarios · onepieceapi.com

**Proveedor:** [onepieceapi.com](https://onepieceapi.com) · base canónica `https://www.onepieceapi.com/api`.

| Endpoint | Uso |
| --- | --- |
| `GET /api/characters?page=&limit=` | Retratos, edad, estado y recompensas de personajes |
| `GET /api/devil-fruits?page=&limit=` | Arte específico de frutas |
| `GET /api/ships?page=&limit=` | Imágenes de barcos |
| `GET /api/bounties` | Recompensas (también vienen anidadas en cada personaje) |

- API pública **sin autenticación**, con código publicado bajo licencia **MIT**.
- El dominio sin `www` responde **308**; se usa el host `www` directamente.
- Máximo real de **100 registros por página**. No hay metadatos de total; se avanza hasta recibir una página incompleta.
- Las peticiones se hacen **de forma secuencial**: la API responde `500` al solicitar una página fuera de rango, por lo que pedir páginas en paralelo provocaba errores al final de cada catálogo. Un `500` en una página posterior a la primera se interpreta como fin de catálogo.
- Los catálogos se cachean con TTL y se deduplican las cargas concurrentes.
- Los IDs son **UUID** y no guardan relación con los IDs numéricos de la fuente base.

Volumen y cobertura de imagen medidos (2026-11-15):

| Recurso | Registros | Con imagen | Observaciones |
| --- | ---: | ---: | --- |
| Personajes | 1.431 | 912 | Retratos en Supabase Storage |
| Frutas | 114 | 114 URLs | Solo **27** son arte específico; **87** usan arte genérico por tipo y se descartan |
| Barcos | 50 | 50 | Todas las naves tienen imagen |
| Recompensas | 225 | — | También anidadas en cada personaje |

Las ilustraciones `generic-paramecia`, `generic-zoan`, `generic-logra` y `generic-unknown` **nunca** se presentan como arte de una fruta concreta.

### 8.3 Cobertura combinada

| Categoría | Resultado |
| --- | --- |
| Personajes | 476 de 786 emparejados de forma segura; **410 con retrato** en el catálogo final |
| Barcos | 33 de 99 emparejados; **los 33 con imagen** |
| Frutas | 86 emparejadas por nombre romanizado; 21 con arte específico nuevo; **44 frutas con imagen** en total (se conserva la imagen anterior cuando no hay arte nuevo válido) |
| Casos ambiguos | 4 frutas descartadas antes que asociar una imagen incorrecta |

Los totales pueden variar si los proveedores actualizan sus catálogos.

---

## 9. Normalización y calidad del dato

El origen contiene inconsistencias. Se aplican correcciones **de formato**, nunca de contenido:

- **Recompensas:** el origen usa puntos como separador de miles y contiene erratas como `67.0000.000` (grupo de cuatro ceros). Se corrige el agrupamiento → `67.000.000` conservando el texto original en `bounty.raw`.
- **Alturas:** `2 200cm` → `2200 cm`; se separa la unidad y se eliminan espacios internos.
- **Edades:** `19 ans` → `19 años` (el origen mezcla francés e inglés).
- **Estados:** `vivant`, `living`, `alive` → `alive`; `deceased`, `dead` → `deceased`; `assets`, `actif` → `active`; `arrêté` → `inactive`.
- **Tripulaciones:** no existe endpoint de miembros; los integrantes se derivan cruzando `character.crew.id`. El capitán se identifica por el rol publicado (`captain`, `capitán`, `comandante`). Si no aparece, se indica que no se pudo identificar.
- **Campos ausentes:** se devuelve `null` y la interfaz muestra «No disponible». Nunca se inventan datos.

### Correspondencia entre fuentes

La imagen solo se asocia cuando la identificación es fiable:

1. **IDs primero.** No se usan para cruzar fuentes porque los UUID de la API nueva no equivalen a los IDs numéricos de la fuente base.
2. **Nombre normalizado.** Se comparan nombres oficiales y romanizados en minúsculas, sin diacríticos ni puntuación, eliminando paréntesis y separando alias por `/` o `|`.
3. **Duplicados.** Si el mismo nombre aparece varias veces, solo se acepta cuando todos los candidatos comparten exactamente la misma imagen, o cuando una verificación adicional (recompensa, edad y estado) deja un único candidato.
4. **Frutas.** Se cruza el `roman_name` antiguo con el `romanName` nuevo. Si varias frutas comparten la base (por ejemplo `Hito Hito no Mi`), se desambigua por el modelo (`Nika`, `Buddha`).
5. **Barcos.** Se cruzan `name` y `roman_name` con `en` y `romaji`.
6. **Precedencia.** Se prefiere el arte específico nuevo de una fruta; si no existe, se conserva la imagen anterior o el marcador. En personajes y barcos, la imagen nueva solo rellena el hueco.
7. **Degradación.** Si la API de imágenes falla, se devuelve el catálogo base con marcadores; la aplicación no se bloquea.

---

## 10. Seguridad y rendimiento

- **CORS** con lista de orígenes permitidos; origen no autorizado → `403`.
- **Helmet** para cabeceras de seguridad.
- **Rate limiting** por IP sobre `/api` (desactivable en tests).
- **Validación** de todos los parámetros con Zod (tipos, rangos, enumeraciones, IDs).
- **Errores centralizados** sin filtrar trazas en producción.
- **Caché TTL** en memoria con deduplicación de peticiones concurrentes, tanto para los datos base como para los catálogos de imágenes.
- **Timeout y reintentos** en ambos clientes externos.
- **Paginación secuencial** en la API de imágenes para no solicitar páginas fuera de rango que devuelven `500`.
- **Respuesta provisional sin bloquear:** si el catálogo de imágenes tarda más de `IMAGE_ENRICHMENT_WAIT_MS`, se responden los datos base con marcadores. Esa respuesta no se cachea: la carga continúa en segundo plano y la siguiente petición ya incluye las imágenes.
- **Carga diferida** de imágenes en el frontend (`loading="lazy"` y `decoding="async"`), con marcador si la imagen no existe o falla.
- **Proxy de imágenes** con protocolo HTTPS obligatorio, lista blanca de hosts (`images.api-onepiece.com` y el bucket de Supabase), verificación de `content-type`, tamaño máximo y `nosniff`. Esto evita SSRF y evita que el navegador contacte con los proveedores.
- **Sin secretos en el frontend:** solo se expone `VITE_API_URL=/api`.

---

## 11. Tests y verificación

Ejecutado el **2026-11-15** en Windows con Node 26.13.0:

| Comprobación | Resultado |
| --- | --- |
| `npm run typecheck` | ✅ Backend y frontend sin errores |
| `npm test` | ✅ **77 tests** (17 mappers + 11 API nueva + 10 multifuente + 39 API) · 14 de integración omitidos |
| `npm run test:live` | ✅ **14 tests** contra las APIs reales: catálogos, paginación, imágenes reales, personajes principales, barcos, frutas con modelo, proxy y modo sin enriquecimiento |
| `npm run build` | ✅ Backend `dist/server.js` (66,90 KB) · Frontend JS 375,62 KB / 111,18 KB gzip · CSS 41,03 KB / 8,93 KB gzip |
| Build de producción | ✅ 115 módulos, runtime de producción de React (`jsxDEV` ausente) |
| Endpoints reales | ✅ stats, characters, bounties, fruits, search, arcs, crews, filters, meta |
| Cobertura real | ✅ 786 personajes (410 con retrato), 213 frutas (44 con imagen), 99 barcos (33 con imagen) |
| Proxy de imágenes | ✅ retrato WebP real servido (200, `image/webp`, 129.180 bytes) desde el nuevo host |
| Errores | ✅ 404, 400 de validación, host de imagen no permitido, CORS bloqueado (403) |
| SPA en producción | ✅ build servido, *deep links* y proxy `/api` funcionando |
| Renderizado de React | ✅ comprobado con Edge headless: Inicio (11 imágenes proxificadas), detalle de personaje, barco y fruta (imagen real + procedencia) |

La suite de API usa un proveedor falso inyectado, por lo que no depende de Internet. La suite `test:live` sí requiere conexión y se ejecuta solo con `LIVE_API_TESTS=1`.

---

## 12. Limitaciones conocidas

1. **Cobertura parcial de retratos: 410 de 786 personajes.** La API de imágenes tiene 912 retratos, pero sus UUID no equivalen a los IDs antiguos. Sin una coincidencia de nombre segura se muestra un marcador generado por la interfaz; nunca se asocia una imagen dudosa.
2. **Cobertura parcial de barcos: 33 de 99.** La API nueva incluye 50 naves y solo 33 se corresponden de forma segura con el catálogo base.
3. **Frutas: 44 de 213 con imagen.** La API nueva ofrece 114 frutas, pero solo 27 tienen arte específico; las 87 restantes usan arte genérico por tipo y se descartan. Se conserva la imagen anterior cuando existe.
4. **Tripulaciones y arcos sin imagen.** La API complementaria no ofrece ilustraciones para estas categorías; se mantiene el marcador.
5. **Contenido en inglés y francés.** La interfaz está en español, pero los nombres, descripciones y sinopsis se muestran en el idioma original para no alterarlos.
6. **La API base no tiene búsqueda ni paginación.** Se resuelven en el backend sobre el catálogo cacheado; el primer acceso descarga todos los recursos.
7. **Correspondencias ambiguas descartadas.** Cuando dos registros comparten nombre y no se pueden verificar por recompensa, edad o estado, se prefiere no mostrar imagen antes que mostrar una incorrecta.
8. **Erratas del origen.** Se corrigen agrupamientos evidentes (recompensas) y formatos, conservando el valor original. Otras erratas de contenido no se modifican.
9. **El campo «integrantes» de una tripulación** procede del proveedor y puede no coincidir con el número de personajes que la API asocia a esa tripulación. Ambos datos se muestran por separado.
10. **Sin autenticación de usuario.** El proyecto es de solo lectura; la «protección básica» consiste en validación, CORS, rate limit y proxy restringido.
11. **Caché en memoria.** Adecuada para un catálogo pequeño y un solo proceso; para varias instancias habría que sustituirla por Redis. El primer acceso tras expirar el TTL descarga ambos catálogos.
12. **Sin tests de interfaz automatizados.** El renderizado se verificó con Edge headless; no se añadió Playwright para no ampliar el alcance.

---

## 13. Decisiones de diseño

- **TypeScript en ambos lados** para que el contrato `data/meta` sea verificable.
- **Modelo de dominio propio** como frontera: los componentes React no conocen la forma del JSON externo.
- **Backend como único intermediario**, lo que permite cachear, filtrar, combinar fuentes y proteger sin exponer los proveedores.
- **Adaptadores independientes** para datos e imágenes: sustituir una fuente no obliga a tocar la otra ni el frontend.
- **Proveedor compuesto con precedencia explícita**: los datos base nunca se sobrescriben; el enriquecimiento solo rellena huecos y adjunta imágenes verificadas.
- **Procedencia visible**: cada entidad puede exponer `source.data`, `source.image` y `source.match`; las fichas muestran la fuente de la imagen.
- **Seguridad ante todo en la correspondencia**: se descarta una imagen antes que asociarla a un personaje, fruta o barco equivocado.
- **Búsqueda por relevancia** (coincidencia exacta > prefijo > palabra > subcadena), normalizando mayúsculas y acentos.
- **Carteles Wanted** como representación visual del dato real, sin añadir información ficticia.
- **Sistema de diseño propio** (océano, rojo Luffy, oro, verde, morado y pergamino) en lugar de una librería genérica.

---

## 14. Estado del proyecto

Todas las secciones solicitadas están implementadas y verificadas con datos e imágenes reales de dos APIs independientes. El proyecto compila, pasa los tests y se ejecuta localmente sin pasos adicionales más allá de instalar dependencias y copiar `.env.example`.

**Aviso:** One Piece es una obra de Eiichiro Oda. Este es un proyecto académico sin ánimo de lucro y sin afiliación oficial. Las imágenes disponibles pertenecen a sus respectivos titulares.
