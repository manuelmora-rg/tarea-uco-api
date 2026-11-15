import { Link, useParams } from 'react-router-dom';
import { useBoat } from '../api/queries';
import { Breadcrumbs } from '../components/ui/PageChrome';
import { EntityImage } from '../components/ui/EntityImage';
import { FactList } from '../components/ui/FactList';
import { Badge } from '../components/ui/Badge';
import { ErrorState, LoadingState, Notice } from '../components/ui/States';
import { usePageTitle } from '../hooks/usePageTitle';
import { ApiError } from '../api/client';

export function BoatDetailPage() {
  const { id } = useParams<{ id: string }>();
  const query = useBoat(id);
  usePageTitle(query.data?.data.name ?? 'Barco');

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
        <Breadcrumbs items={[{ label: 'Barcos', to: '/barcos' }, { label: 'No encontrado' }]} />
        <ErrorState
          error={query.error}
          title={notFound ? 'Barco no encontrado' : 'No se pudo cargar el barco'}
          onRetry={notFound ? undefined : () => void query.refetch()}
        />
        <p className="center">
          <Link className="text-link" to="/barcos">
            ← Volver al listado de barcos
          </Link>
        </p>
      </div>
    );
  }

  const boat = query.data.data;

  return (
    <div className="page container">
      <Breadcrumbs items={[{ label: 'Barcos', to: '/barcos' }, { label: boat.name }]} />

      <article className="detail-hero detail-hero--boat">
        <div className="detail-hero__media">
          <EntityImage src={boat.image} name={boat.name} kind="boat" />
        </div>

        <div className="detail-hero__info">
          <p className="eyebrow">Ficha de embarcación</p>
          <h1>{boat.name}</h1>
          {boat.romanName && <p className="detail-hero__role">{boat.romanName}</p>}

          {boat.type && <Badge tone="blue">{boat.type}</Badge>}

          <p className="detail-hero__description">
            {boat.description ?? 'La API de origen no proporciona una descripción para este barco.'}
          </p>

          <div className="detail-hero__links">
            {boat.crew ? (
              boat.crew.id ? (
                <Link className="tag-link" to={`/tripulaciones/${boat.crew.id}`}>
                  ☠ {boat.crew.name}
                </Link>
              ) : (
                <span className="tag-link">☠ {boat.crew.name}</span>
              )
            ) : (
              <span className="tag-link tag-link--muted">Sin tripulación registrada</span>
            )}

            {boat.captain ? (
              boat.captain.id ? (
                <Link className="tag-link" to={`/personajes/${boat.captain.id}`}>
                  ⚓ {boat.captain.name}
                </Link>
              ) : (
                <span className="tag-link">⚓ {boat.captain.name}</span>
              )
            ) : (
              <span className="tag-link tag-link--muted">Capitán no disponible</span>
            )}
          </div>
        </div>
      </article>

      <div className="detail-grid">
        <section className="panel">
          <FactList
            title="Datos disponibles"
            items={[
              { label: 'Nombre', value: boat.name },
              { label: 'Nombre romanizado', value: boat.romanName ?? 'No disponible' },
              { label: 'Tipo', value: boat.type ?? 'No disponible' },
              {
                label: 'Tripulación',
                value: boat.crew ? (
                  boat.crew.id ? (
                    <Link to={`/tripulaciones/${boat.crew.id}`}>{boat.crew.name}</Link>
                  ) : (
                    boat.crew.name
                  )
                ) : (
                  'No disponible'
                ),
              },
              {
                label: 'Capitán',
                value: boat.captain ? (
                  boat.captain.id ? (
                    <Link to={`/personajes/${boat.captain.id}`}>{boat.captain.name}</Link>
                  ) : (
                    boat.captain.name
                  )
                ) : (
                  'No disponible'
                ),
              },
              { label: 'Descripción', value: boat.description ?? 'No disponible' },
              { label: 'Imagen', value: boat.image ? 'Disponible' : 'No disponible' },
              { label: 'ID en el proveedor', value: boat.id },
              ...(boat.source
                ? [
                    { label: 'Fuente de datos', value: boat.source.data },
                    {
                      label: 'Fuente de la imagen',
                      value: boat.source.image ?? 'No disponible',
                    },
                  ]
                : []),
            ]}
          />
        </section>

        <aside className="detail-aside">
          <div className="panel panel--accent">
            <h2>Sobre la imagen</h2>
            <p>
              {boat.image
                ? 'La imagen se asocia por nombre oficial o romanizado y se sirve a través del proxy del backend.'
                : 'No se ha encontrado una imagen verificada para esta nave. El marcador mostrado es generado por la interfaz y no representa el barco real.'}
            </p>
          </div>

          <div className="panel">
            <h2>Continuar explorando</h2>
            <div className="stack">
              {boat.crew?.id && (
                <Link className="text-link" to={`/tripulaciones/${boat.crew.id}`}>
                  Ver la tripulación →
                </Link>
              )}
              <Link className="text-link" to="/barcos">
                Catálogo de barcos →
              </Link>
            </div>
          </div>
        </aside>
      </div>

      <Notice>
        Los campos ausentes se indican explícitamente. No se completan con
        información de otras fuentes.
      </Notice>
    </div>
  );
}
