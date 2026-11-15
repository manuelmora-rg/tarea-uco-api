import { FormEvent, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useCharacters, useFilters } from '../api/queries';
import { CharacterCard } from '../components/cards/EntityCards';
import { Breadcrumbs, SectionHeader } from '../components/ui/PageChrome';
import { EmptyState, ErrorState, LoadingState, Notice } from '../components/ui/States';
import { Pagination } from '../components/ui/Pagination';
import { usePageTitle } from '../hooks/usePageTitle';
import { formatCount } from '../utils/format';

const SORT_OPTIONS = [
  { value: 'bounty_desc', label: 'Mayor recompensa' },
  { value: 'bounty_asc', label: 'Menor recompensa' },
  { value: 'name_asc', label: 'Nombre (A–Z)' },
  { value: 'name_desc', label: 'Nombre (Z–A)' },
  { value: 'id_asc', label: 'ID de origen' },
];

export function CharactersPage() {
  usePageTitle('Personajes');

  const [searchParams, setSearchParams] = useSearchParams();
  const rawPage = Number(searchParams.get('page') ?? '1');
  const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.trunc(rawPage) : 1;
  const search = searchParams.get('search') ?? '';
  const crew = searchParams.get('crew') ?? '';
  const status = searchParams.get('status') ?? '';
  const sort = searchParams.get('sort') ?? 'bounty_desc';

  const [searchInput, setSearchInput] = useState(search);
  useEffect(() => setSearchInput(search), [search]);

  const filters = useFilters();
  const query = useCharacters({
    page,
    limit: 24,
    search: search || undefined,
    crew: crew ? Number(crew) : undefined,
    status: status || undefined,
    sort,
  });

  function apply(patch: Record<string, string | undefined>) {
    const next = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined || value === '') next.delete(key);
      else next.set(key, value);
    }
    next.delete('page');
    setSearchParams(next);
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    apply({ search: searchInput.trim() || undefined });
  }

  function reset() {
    setSearchParams(new URLSearchParams());
  }

  const hasFilters = Boolean(search || crew || status || sort !== 'bounty_desc');
  const meta = query.data?.meta;

  return (
    <div className="page container">
      <Breadcrumbs items={[{ label: 'Personajes' }]} />

      <SectionHeader
        eyebrow="El archivo de tripulantes"
        title="Personajes"
        description="Fichas normalizadas que combinan los datos base con retratos reales cuando existe una correspondencia segura."
      />

      <div className="filter-panel">
        <form className="filter-panel__search" onSubmit={handleSearch} role="search">
          <label htmlFor="character-search" className="sr-only">
            Buscar personajes
          </label>
          <input
            id="character-search"
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Buscar por nombre, rol, tripulación o fruta…"
          />
          <button type="submit" className="button button--primary">
            Buscar
          </button>
        </form>

        <div className="filter-panel__selects">
          <label>
            <span>Tripulación</span>
            <select value={crew} onChange={(event) => apply({ crew: event.target.value || undefined })}>
              <option value="">Todas</option>
              {filters.data?.data.crews.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Estado</span>
            <select value={status} onChange={(event) => apply({ status: event.target.value || undefined })}>
              <option value="">Cualquiera</option>
              <option value="alive">Vivo</option>
              <option value="deceased">Finado</option>
              <option value="unknown">Desconocido</option>
            </select>
          </label>

          <label>
            <span>Orden</span>
            <select
              value={sort}
              onChange={(event) =>
                apply({ sort: event.target.value === 'bounty_desc' ? undefined : event.target.value })
              }
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          {hasFilters && (
            <button type="button" className="button button--ghost button--small" onClick={reset}>
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {meta && (
        <p className="results-summary" aria-live="polite">
          {formatCount(meta.total)} {meta.total === 1 ? 'personaje' : 'personajes'}
          {search && <> para «{search}»</>}
        </p>
      )}

      {query.isLoading && <LoadingState count={8} />}

      {query.isError && (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      )}

      {query.data && query.data.data.length === 0 && (
        <EmptyState
          title="Ningún personaje coincide"
          message="Prueba con otro nombre o elimina alguno de los filtros aplicados."
          action={
            <button type="button" className="button button--primary" onClick={reset}>
              Restablecer búsqueda
            </button>
          }
        />
      )}

      {query.data && query.data.data.length > 0 && (
        <>
          <div className="grid grid--characters">
            {query.data.data.map((character) => (
              <CharacterCard key={character.id} character={character} />
            ))}
          </div>

          {meta && (
            <Pagination
              page={meta.page}
              totalPages={meta.totalPages}
              total={meta.total}
              onPageChange={(nextPage) => {
                const next = new URLSearchParams(searchParams);
                if (nextPage <= 1) next.delete('page');
                else next.set('page', String(nextPage));
                setSearchParams(next);
              }}
            />
          )}
        </>
      )}

      <Notice>
        Los retratos proceden de una segunda API y se asocian solo cuando el nombre
        coincide de forma segura. Si no hay imagen verificada, se muestra un marcador
        generado por la interfaz.{' '}
        <Link to="/frutas">Consulta también las frutas con ilustración real.</Link>
      </Notice>

    </div>
  );
}
