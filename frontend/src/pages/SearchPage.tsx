import { Link, useSearchParams } from 'react-router-dom';
import { useSearch } from '../api/queries';
import { GlobalSearchForm } from '../components/search/GlobalSearchForm';
import { Breadcrumbs } from '../components/ui/PageChrome';
import { EntityImage } from '../components/ui/EntityImage';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/States';
import { usePageTitle } from '../hooks/usePageTitle';
import { fruitTypeLabel, formatCount } from '../utils/format';
import type { MediaKind } from '../components/ui/EntityImage';

const SUGGESTIONS = ['Luffy', 'Gomu', 'Mugiwara', 'Alabasta', 'Thousand Sunny'];

interface SearchRowProps {
  to: string;
  title: string;
  subtitle?: string | null;
  meta?: string | null;
  image?: string | null;
  kind?: MediaKind;
}

function SearchRow({ to, title, subtitle, meta, image, kind = 'character' }: SearchRowProps) {
  return (
    <Link to={to} className="search-row">
      <EntityImage src={image} name={title} kind={kind} className="search-row__thumb" />
      <div className="search-row__main">
        <h3>{title}</h3>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {meta && <span className="search-row__meta">{meta}</span>}
    </Link>
  );
}

export function SearchPage() {
  const [params] = useSearchParams();
  const q = (params.get('q') ?? '').trim();
  usePageTitle(q ? `Búsqueda: ${q}` : 'Buscador global');

  const query = useSearch(q);
  const results = query.data?.data;
  const hasQuery = q.length >= 2;

  const groupLinks = results
    ? [
        { key: 'characters', label: 'Personajes', total: results.groups.characters.total },
        { key: 'fruits', label: 'Frutas', total: results.groups.fruits.total },
        { key: 'crews', label: 'Tripulaciones', total: results.groups.crews.total },
        { key: 'boats', label: 'Barcos', total: results.groups.boats.total },
        { key: 'arcs', label: 'Arcos', total: results.groups.arcs.total },
      ].filter((group) => group.total > 0)
    : [];

  return (
    <div className="page container">
      <Breadcrumbs items={[{ label: 'Buscador' }]} />

      <header className="search-page__header">
        <p className="eyebrow">Buscador global</p>
        <h1>Encuentra cualquier rastro</h1>
        <p>
          Busca simultáneamente en personajes, frutas, tripulaciones, barcos y arcos.
          Los resultados se agrupan por categoría y enlazan a su ficha.
        </p>
        <GlobalSearchForm key={q} initialValue={q} />
      </header>

      {!hasQuery && (
        <EmptyState
          title="Escribe al menos dos caracteres"
          message="Prueba con un nombre, una fruta, una tripulación o un arco. También puedes usar una de estas sugerencias."
          action={
            <div className="suggestion-list">
              {SUGGESTIONS.map((suggestion) => (
                <Link key={suggestion} to={`/buscar?q=${encodeURIComponent(suggestion)}`} className="chip">
                  {suggestion}
                </Link>
              ))}
            </div>
          }
        />
      )}

      {hasQuery && query.isLoading && <LoadingState variant="list" count={5} />}
      {hasQuery && query.isError && (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      )}

      {hasQuery && results && (
        <>
          <div className="search-summary" aria-live="polite">
            <p>
              <strong>{formatCount(results.total)}</strong>{' '}
              {results.total === 1 ? 'resultado' : 'resultados'} para «{results.query}»
            </p>
            {groupLinks.length > 0 && (
              <nav className="search-summary__nav" aria-label="Categorías con resultados">
                {groupLinks.map((group) => (
                  <a key={group.key} href={`#resultados-${group.key}`} className="chip chip--small">
                    {group.label} · {group.total}
                  </a>
                ))}
              </nav>
            )}
          </div>

          {results.total === 0 && (
            <EmptyState
              title="Sin resultados"
              message="No se ha encontrado ninguna coincidencia. Revisa la ortografía o prueba con un término más general."
              action={
                <div className="suggestion-list">
                  {SUGGESTIONS.slice(0, 3).map((suggestion) => (
                    <Link key={suggestion} to={`/buscar?q=${encodeURIComponent(suggestion)}`} className="chip">
                      {suggestion}
                    </Link>
                  ))}
                </div>
              }
            />
          )}

          {results.groups.characters.items.length > 0 && (
            <section className="search-group" id="resultados-characters">
              <header className="search-group__header">
                <h2>Personajes</h2>
                <span>{results.groups.characters.total}</span>
              </header>
              <div className="search-group__list">
                {results.groups.characters.items.map((character) => (
                  <SearchRow
                    key={character.id}
                    to={`/personajes/${character.id}`}
                    title={character.name}
                    subtitle={[character.job, character.crew?.name].filter(Boolean).join(' · ')}
                    meta={character.bounty?.formatted ?? 'Sin recompensa'}
                    image={character.image}
                    kind="character"
                  />
                ))}
              </div>
              {results.groups.characters.total > results.groups.characters.items.length && (
                <Link
                  className="text-link"
                  to={`/personajes?search=${encodeURIComponent(q)}`}
                >
                  Ver los {results.groups.characters.total} personajes →
                </Link>
              )}
            </section>
          )}

          {results.groups.fruits.items.length > 0 && (
            <section className="search-group" id="resultados-fruits">
              <header className="search-group__header">
                <h2>Frutas del diablo</h2>
                <span>{results.groups.fruits.total}</span>
              </header>
              <div className="search-group__list">
                {results.groups.fruits.items.map((fruit) => (
                  <SearchRow
                    key={fruit.id}
                    to={`/frutas/${fruit.id}`}
                    title={fruit.name}
                    subtitle={fruit.romanName}
                    meta={fruitTypeLabel(fruit.type)}
                    image={fruit.image}
                    kind="fruit"
                  />
                ))}
              </div>
              {results.groups.fruits.total > results.groups.fruits.items.length && (
                <Link className="text-link" to={`/frutas?search=${encodeURIComponent(q)}`}>
                  Ver las {results.groups.fruits.total} frutas →
                </Link>
              )}
            </section>
          )}

          {results.groups.crews.items.length > 0 && (
            <section className="search-group" id="resultados-crews">
              <header className="search-group__header">
                <h2>Tripulaciones</h2>
                <span>{results.groups.crews.total}</span>
              </header>
              <div className="search-group__list">
                {results.groups.crews.items.map((crew) => (
                  <SearchRow
                    key={crew.id}
                    to={`/tripulaciones/${crew.id}`}
                    title={crew.name}
                    subtitle={crew.romanName}
                    meta={crew.totalBounty?.formatted ?? 'Sin recompensa total'}
                    kind="crew"
                  />
                ))}
              </div>
              {results.groups.crews.total > results.groups.crews.items.length && (
                <Link
                  className="text-link"
                  to={`/tripulaciones?search=${encodeURIComponent(q)}`}
                >
                  Ver las {results.groups.crews.total} tripulaciones →
                </Link>
              )}
            </section>
          )}

          {results.groups.boats.items.length > 0 && (
            <section className="search-group" id="resultados-boats">
              <header className="search-group__header">
                <h2>Barcos</h2>
                <span>{results.groups.boats.total}</span>
              </header>
              <div className="search-group__list">
                {results.groups.boats.items.map((boat) => (
                  <SearchRow
                    key={boat.id}
                    to={`/barcos/${boat.id}`}
                    title={boat.name}
                    subtitle={boat.crew?.name}
                    meta={boat.type ?? 'Sin tipo'}
                    image={boat.image}
                    kind="boat"
                  />
                ))}
              </div>
              {results.groups.boats.total > results.groups.boats.items.length && (
                <Link className="text-link" to={`/barcos?search=${encodeURIComponent(q)}`}>
                  Ver los {results.groups.boats.total} barcos →
                </Link>
              )}
            </section>
          )}

          {results.groups.arcs.items.length > 0 && (
            <section className="search-group" id="resultados-arcs">
              <header className="search-group__header">
                <h2>Arcos argumentales</h2>
                <span>{results.groups.arcs.total}</span>
              </header>
              <div className="search-group__list">
                {results.groups.arcs.items.map((arc) => (
                  <SearchRow
                    key={arc.id}
                    to={`/arcos/${arc.id}`}
                    title={arc.title}
                    subtitle={arc.description}
                    meta={arc.saga?.title ?? 'Sin saga'}
                    kind="arc"
                  />
                ))}
              </div>
              {results.groups.arcs.total > results.groups.arcs.items.length && (
                <Link className="text-link" to={`/arcos?search=${encodeURIComponent(q)}`}>
                  Ver los {results.groups.arcs.total} arcos →
                </Link>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}
