import { Link, useParams } from 'react-router-dom';
import { useArc } from '../api/queries';
import { Breadcrumbs } from '../components/ui/PageChrome';
import { FactList } from '../components/ui/FactList';
import { Badge } from '../components/ui/Badge';
import { ErrorState, LoadingState, Notice } from '../components/ui/States';
import { usePageTitle } from '../hooks/usePageTitle';
import { ApiError } from '../api/client';
import type { Saga } from '../types/api';

export function ArcDetailPage() {
  const { id } = useParams<{ id: string }>();
  const query = useArc(id);
  usePageTitle(query.data?.data.title ?? 'Arco argumental');

  if (query.isLoading) {
    return (
      <div className="page container">
        <LoadingState variant="list" count={3} />
      </div>
    );
  }

  if (query.isError || !query.data) {
    const notFound = query.error instanceof ApiError && query.error.status === 404;
    return (
      <div className="page container">
        <Breadcrumbs items={[{ label: 'Arcos', to: '/arcos' }, { label: 'No encontrado' }]} />
        <ErrorState
          error={query.error}
          title={notFound ? 'Arco no encontrado' : 'No se pudo cargar el arco'}
          onRetry={notFound ? undefined : () => void query.refetch()}
        />
        <p className="center">
          <Link className="text-link" to="/arcos">
            ← Volver a los arcos
          </Link>
        </p>
      </div>
    );
  }

  const arc = query.data.data;
  const paragraphs = (arc.description ?? '').split(/\n{2,}/).filter(Boolean);

  return (
    <div className="page container page--reading">
      <Breadcrumbs items={[{ label: 'Arcos', to: '/arcos' }, { label: arc.title }]} />

      <article>
        <header className="arc-header">
          <p className="eyebrow">Arco argumental · ID {arc.id}</p>
          <h1>{arc.title}</h1>
          <div className="arc-header__meta">
            {arc.saga && <Badge tone="blue">Saga: {arc.saga.title}</Badge>}
            {arc.saga?.number != null && <Badge tone="gold">Saga {arc.saga.number}</Badge>}
          </div>
        </header>

        <div className="detail-grid">
          <section className="panel prose">
            <h2>Sinopsis</h2>
            {paragraphs.length > 0 ? (
              paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)
            ) : (
              <p className="muted">La API de origen no proporciona descripción para este arco.</p>
            )}
          </section>

          <aside className="detail-aside">
            {arc.saga && (
              <div className="panel panel--accent">
                <FaSagaSummary arcSaga={arc.saga} />
              </div>
            )}

            <div className="panel">
              <h2>Ficha del arco</h2>
              <FactList
                items={[
                  { label: 'Título', value: arc.title },
                  { label: 'Saga', value: arc.saga?.title ?? 'No disponible' },
                  { label: 'ID en el proveedor', value: arc.id },
                ]}
              />
            </div>
          </aside>
        </div>
      </article>

      <Notice>
        La sinopsis se muestra en el idioma original del proveedor (inglés o francés).
        No se ha traducido ni resumido para no alterar el contenido.
      </Notice>
    </div>
  );
}

function FaSagaSummary({ arcSaga }: { arcSaga: Saga }) {
  return (
    <>
      <p className="eyebrow">Saga</p>
      <h2>{arcSaga.title}</h2>
      <dl className="saga-ranges">
        {arcSaga.chapters && (
          <div>
            <dt>Capítulos</dt>
            <dd>{arcSaga.chapters}</dd>
          </div>
        )}
        {arcSaga.volumes && (
          <div>
            <dt>Volúmenes</dt>
            <dd>{arcSaga.volumes}</dd>
          </div>
        )}
        {arcSaga.episodes && (
          <div>
            <dt>Episodios</dt>
            <dd>{arcSaga.episodes}</dd>
          </div>
        )}
      </dl>
      <Link className="text-link" to={`/arcos?saga=${arcSaga.id}`}>
        Ver arcos de esta saga →
      </Link>
    </>
  );
}
