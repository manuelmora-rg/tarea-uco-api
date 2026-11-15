import { Link, useParams } from 'react-router-dom';
import { useFruit } from '../api/queries';
import { Breadcrumbs } from '../components/ui/PageChrome';
import { EntityImage } from '../components/ui/EntityImage';
import { FactList } from '../components/ui/FactList';
import { Badge } from '../components/ui/Badge';
import { ErrorState, LoadingState, Notice } from '../components/ui/States';
import { usePageTitle } from '../hooks/usePageTitle';
import { fruitTypeClass, fruitTypeLabel, translateFruitName } from '../utils/format';
import { ApiError } from '../api/client';

export function FruitDetailPage() {
  const { id } = useParams<{ id: string }>();
  const query = useFruit(id);
  usePageTitle(query.data?.data.name ?? 'Fruta del diablo');

  if (query.isLoading) {
    return (
      <div className="page container">
        <LoadingState count={4} />
      </div>
    );
  }

  if (query.isError || !query.data) {
    const notFound = query.error instanceof ApiError && query.error.status === 404;
    return (
      <div className="page container">
        <Breadcrumbs items={[{ label: 'Frutas', to: '/frutas' }, { label: 'No encontrada' }]} />
        <ErrorState
          error={query.error}
          title={notFound ? 'Fruta no encontrada' : 'No se pudo cargar la fruta'}
          onRetry={notFound ? undefined : () => void query.refetch()}
        />
        <p className="center">
          <Link className="text-link" to="/frutas">
            ← Volver al catálogo de frutas
          </Link>
        </p>
      </div>
    );
  }

  const fruit = query.data.data;

  return (
    <div className="page container">
      <Breadcrumbs items={[{ label: 'Frutas', to: '/frutas' }, { label: translateFruitName(fruit.name) }]} />

      <article className="detail-hero detail-hero--fruit">
        <div className="detail-hero__media">
          <EntityImage src={fruit.image} name={fruit.name} kind="fruit" />
        </div>

        <div className="detail-hero__info">
          <p className="eyebrow">Ficha de fruta del diablo</p>
          <h1>{translateFruitName(fruit.name)}</h1>
          {fruit.romanName && <p className="detail-hero__role">{fruit.romanName}</p>}

          <p>
            <span className={`fruit-type ${fruitTypeClass(fruit.type)}`}>
              {fruitTypeLabel(fruit.type)}
            </span>
          </p>

          <p className="detail-hero__description">
            {fruit.description ??
              'La API de origen no proporciona una descripción para esta fruta.'}
          </p>
        </div>
      </article>

      <div className="detail-grid">
        <section className="panel">
          <FactList
            title="Datos disponibles"
            items={[
              { label: 'Nombre', value: fruit.name },
              { label: 'Nombre romanizado', value: fruit.romanName ?? 'No disponible' },
              {
                label: 'Tipo',
                value: (
                  <Badge tone="purple">{fruitTypeLabel(fruit.type)}</Badge>
                ),
              },
              {
                label: 'Descripción',
                value: fruit.description ?? 'No disponible',
              },
              {
                label: 'Imagen',
                value: fruit.image ? 'Disponible' : 'No disponible',
              },
              { label: 'ID en el proveedor', value: fruit.id },
              ...(fruit.source
                ? [
                    { label: 'Fuente de datos', value: fruit.source.data },
                    {
                      label: 'Fuente de la imagen',
                      value: fruit.source.image ?? 'No disponible',
                    },
                  ]
                : []),
            ]}
          />
        </section>

        <aside className="detail-aside">
          <div className="panel panel--accent">
            <h2>Imagen de origen</h2>
            {fruit.image ? (
              <p>
                La imagen se sirve a través del proxy de nuestro backend, nunca
                directamente desde el navegador al proveedor externo.
              </p>
            ) : (
              <p>
                Esta fruta no tiene una ilustración específica verificada. El marcador mostrado es
                generado por la interfaz y no representa el aspecto real de la fruta.
              </p>
            )}
          </div>

          <div className="panel">
            <h2>Continuar explorando</h2>
            <div className="stack">
              <Link className="text-link" to="/personajes">
                Personajes que consumieron frutas →
              </Link>
              <Link className="text-link" to="/frutas">
                Volver al catálogo completo →
              </Link>
            </div>
          </div>
        </aside>
      </div>

      <Notice>
        Los tipos se muestran con una etiqueta traducida al español; el valor original
        del proveedor se conserva en el backend.
      </Notice>
    </div>
  );
}
