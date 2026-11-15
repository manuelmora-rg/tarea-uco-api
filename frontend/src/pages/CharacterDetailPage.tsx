import { Link, useParams } from 'react-router-dom';
import { useCharacter } from '../api/queries';
import { Breadcrumbs } from '../components/ui/PageChrome';
import { EntityImage } from '../components/ui/EntityImage';
import { FactList } from '../components/ui/FactList';
import { StatusBadge } from '../components/ui/Badge';
import { ErrorState, LoadingState, Notice } from '../components/ui/States';
import { usePageTitle } from '../hooks/usePageTitle';
import { characterStatusLabel } from '../utils/format';
import { ApiError } from '../api/client';

export function CharacterDetailPage() {
  const { id } = useParams<{ id: string }>();
  const query = useCharacter(id);
  usePageTitle(query.data?.data.name ?? 'Personaje');

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
        <Breadcrumbs items={[{ label: 'Personajes', to: '/personajes' }, { label: 'No encontrado' }]} />
        <ErrorState
          error={query.error}
          title={notFound ? 'Personaje no encontrado' : 'No se pudo cargar el personaje'}
          onRetry={notFound ? undefined : () => void query.refetch()}
        />
        <p className="center">
          <Link className="text-link" to="/personajes">
            ← Volver al listado de personajes
          </Link>
        </p>
      </div>
    );
  }

  const character = query.data.data;

  return (
    <div className="page container">
      <Breadcrumbs items={[{ label: 'Personajes', to: '/personajes' }, { label: character.name }]} />

      <article className="detail-hero">
        <div className="detail-hero__media">
          <EntityImage src={character.image} name={character.name} kind="character" />
        </div>

        <div className="detail-hero__info">
          <p className="eyebrow">Ficha de personaje</p>
          <h1>{character.name}</h1>
          <p className="detail-hero__role">
            {character.job ?? 'Rol no disponible'} · {characterStatusLabel(character.status)}
          </p>

          <div className="detail-hero__bounty">
            <span>Recompensa</span>
            <strong>{character.bounty?.formatted ?? 'No disponible'}</strong>
            {character.bounty && (
              <small>Valor original del proveedor: {character.bounty.raw}</small>
            )}
          </div>

          <div className="detail-hero__links">
            {character.crew ? (
              character.crew.id ? (
                <Link className="tag-link" to={`/tripulaciones/${character.crew.id}`}>
                  ☠ {character.crew.name}
                </Link>
              ) : (
                <span className="tag-link">☠ {character.crew.name}</span>
              )
            ) : (
              <span className="tag-link tag-link--muted">Sin tripulación registrada</span>
            )}

            {character.fruit ? (
              character.fruit.id ? (
                <Link className="tag-link" to={`/frutas/${character.fruit.id}`}>
                  ✺ {character.fruit.name}
                </Link>
              ) : (
                <span className="tag-link">✺ {character.fruit.name}</span>
              )
            ) : (
              <span className="tag-link tag-link--muted">Sin fruta del diablo registrada</span>
            )}
          </div>
        </div>
      </article>

      <div className="detail-grid">
        <section className="panel">
          <FactList
            title="Datos disponibles"
            items={[
              { label: 'Nombre', value: character.name },
              { label: 'Rol', value: character.job ?? 'No disponible' },
              {
                label: 'Estado',
                value: <StatusBadge status={characterStatusLabel(character.status)} />,
              },
              { label: 'Edad', value: character.age ?? 'No disponible' },
              { label: 'Altura', value: character.height ?? 'No disponible' },
              {
                label: 'Recompensa',
                value: character.bounty?.formatted ?? 'No disponible',
              },
              {
                label: 'Tripulación',
                value: character.crew ? (
                  character.crew.id ? (
                    <Link to={`/tripulaciones/${character.crew.id}`}>{character.crew.name}</Link>
                  ) : (
                    character.crew.name
                  )
                ) : (
                  'No disponible'
                ),
              },
              {
                label: 'Fruta del diablo',
                value: character.fruit ? (
                  <span>
                    {character.fruit.id ? (
                      <Link to={`/frutas/${character.fruit.id}`}>{character.fruit.name}</Link>
                    ) : (
                      character.fruit.name
                    )}
                    {character.fruit.type && (
                      <span className="muted"> · {character.fruit.type}</span>
                    )}
                  </span>
                ) : (
                  'No disponible'
                ),
              },
              { label: 'ID en el proveedor', value: character.id },
              ...(character.source
                ? [
                    { label: 'Fuente de datos', value: character.source.data },
                    {
                      label: 'Fuente de la imagen',
                      value: character.source.image ?? 'No disponible',
                    },
                  ]
                : []),
            ]}
          />
        </section>

        <aside className="detail-aside">
          <div className="panel panel--accent">
            <h2>Sobre la ficha</h2>
            <p>
              Todos los campos mostrados provienen del proveedor activo. Si un dato no
              existe, se indica como «No disponible» en lugar de inventarlo.
            </p>
            <p>
              El retrato procede de la fuente de imágenes y solo se muestra cuando la
              correspondencia con este personaje es segura. Si no existe, aparece un
              marcador ilustrado.
            </p>
          </div>

          <div className="panel">
            <h2>Continuar explorando</h2>
            <div className="stack">
              <Link className="text-link" to="/recompensas">
                Ver todos los carteles Wanted →
              </Link>
              {character.crew?.id && (
                <Link className="text-link" to={`/tripulaciones/${character.crew.id}`}>
                  Explorar la tripulación →
                </Link>
              )}
              {character.fruit?.id && (
                <Link className="text-link" to={`/frutas/${character.fruit.id}`}>
                  Consultar la fruta →
                </Link>
              )}
            </div>
          </div>
        </aside>
      </div>

      <Notice>
        La edad, la altura y la recompensa se muestran tal como las publica el
        proveedor, con correcciones de formato cuando ha sido posible.
      </Notice>
    </div>
  );
}
