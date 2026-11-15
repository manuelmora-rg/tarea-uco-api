import { Link, useParams } from 'react-router-dom';
import { useCrew } from '../api/queries';
import { Breadcrumbs } from '../components/ui/PageChrome';
import { EntityImage } from '../components/ui/EntityImage';
import { Badge, StatusBadge } from '../components/ui/Badge';
import { CharacterCard } from '../components/cards/EntityCards';
import { EmptyState, ErrorState, LoadingState, Notice } from '../components/ui/States';
import { usePageTitle } from '../hooks/usePageTitle';
import { crewStatusLabel, formatCount } from '../utils/format';
import { ApiError } from '../api/client';

export function CrewDetailPage() {
  const { id } = useParams<{ id: string }>();
  const query = useCrew(id);
  usePageTitle(query.data?.data.name ?? 'Tripulación');

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
        <Breadcrumbs items={[{ label: 'Tripulaciones', to: '/tripulaciones' }, { label: 'No encontrada' }]} />
        <ErrorState
          error={query.error}
          title={notFound ? 'Tripulación no encontrada' : 'No se pudo cargar la tripulación'}
          onRetry={notFound ? undefined : () => void query.refetch()}
        />
        <p className="center">
          <Link className="text-link" to="/tripulaciones">
            ← Volver al listado de tripulaciones
          </Link>
        </p>
      </div>
    );
  }

  const crew = query.data.data;

  return (
    <div className="page container">
      <Breadcrumbs items={[{ label: 'Tripulaciones', to: '/tripulaciones' }, { label: crew.name }]} />

      <article className="crew-hero">
        <EntityImage src={null} name={crew.name} kind="crew" className="crew-hero__emblem" />

        <div className="crew-hero__info">
          <p className="eyebrow">Ficha de tripulación</p>
          <h1>{crew.name}</h1>
          {crew.romanName && <p className="detail-hero__role">{crew.romanName}</p>}

          <div className="detail-hero__links">
            <StatusBadge status={crewStatusLabel(crew.status)} />
            {crew.isYonko && <Badge tone="gold">Yonko</Badge>}
          </div>

          {crew.description && <p className="detail-hero__description">{crew.description}</p>}
        </div>

        <dl className="crew-hero__stats">
          <div>
            <dt>Integrantes (origen)</dt>
            <dd>{crew.memberCount ?? 'Sin datos'}</dd>
          </div>
          <div>
            <dt>Recompensa total</dt>
            <dd>{crew.totalBounty?.formatted ?? 'No disponible'}</dd>
          </div>
          <div>
            <dt>Fichas asociadas</dt>
            <dd>{formatCount(crew.members.length)}</dd>
          </div>
        </dl>
      </article>

      <div className="detail-grid">
        <section className="panel">
          <h2>Información de la tripulación</h2>
          <dl className="fact-list__compact">
            <div className="fact-list__row">
              <dt>Nombre</dt>
              <dd>{crew.name}</dd>
            </div>
            <div className="fact-list__row">
              <dt>Nombre romanizado</dt>
              <dd>{crew.romanName ?? 'No disponible'}</dd>
            </div>
            <div className="fact-list__row">
              <dt>Estado</dt>
              <dd>{crewStatusLabel(crew.status)}</dd>
            </div>
            <div className="fact-list__row">
              <dt>Capitán</dt>
              <dd>
                {crew.captain ? (
                  crew.captain.id ? (
                    <Link to={`/personajes/${crew.captain.id}`}>{crew.captain.name}</Link>
                  ) : (
                    crew.captain.name
                  )
                ) : (
                  'No identificado en los datos de origen'
                )}
              </dd>
            </div>
            <div className="fact-list__row">
              <dt>Recompensa total</dt>
              <dd>{crew.totalBounty?.formatted ?? 'No disponible'}</dd>
            </div>
            <div className="fact-list__row">
              <dt>Descripción</dt>
              <dd>{crew.description ?? 'No disponible'}</dd>
            </div>
          </dl>
        </section>

        <aside className="detail-aside">
          <div className="panel panel--accent">
            <h2>Cómo se calcula esta ficha</h2>
            <p>
              El proveedor no ofrece un endpoint de integrantes. Nuestro backend
              cruza los personajes cuyo campo «crew» apunta a esta tripulación.
            </p>
            <p>
              El capitán se identifica por el rol publicado; si no aparece, se indica
              que no se ha podido identificar.
            </p>
          </div>
        </aside>
      </div>

      <section className="home-section">
        <h2 className="subsection-title">Integrantes registrados</h2>

        {crew.members.length === 0 ? (
          <EmptyState
            title="Sin integrantes asociados"
            message="La API de origen no vincula ningún personaje a esta tripulación. No se muestran datos inventados."
          />
        ) : (
          <div className="grid grid--characters">
            {crew.members.map((member) => (
              <CharacterCard key={member.id} character={member} />
            ))}
          </div>
        )}
      </section>

      <Notice>
        La recompensa total también procede del proveedor; no se recalcula a partir
        de las recompensas individuales para no contradecir el dato original.
      </Notice>
    </div>
  );
}
