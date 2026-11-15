import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useArcs, useFilters } from '../api/queries';
import { ArcCard } from '../components/cards/EntityCards';
import { Breadcrumbs, SectionHeader } from '../components/ui/PageChrome';
import { EmptyState, ErrorState, LoadingState, Notice } from '../components/ui/States';
import { usePageTitle } from '../hooks/usePageTitle';
import { formatCount } from '../utils/format';
import type { Arc, Saga } from '../types/api';

interface ArcGroup {
  saga: Saga | null;
  arcs: Arc[];
}

export function ArcsPage() {
  usePageTitle('Arcos argumentales');

  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('search') ?? '';
  const saga = searchParams.get('saga') ?? '';

  const [searchInput, setSearchInput] = useState(search);
  useEffect(() => setSearchInput(search), [search]);

  const filters = useFilters();
  const query = useArcs({
    page: 1,
    limit: 60,
    search: search || undefined,
    saga: saga ? Number(saga) : undefined,
  });

  function apply(patch: Record<string, string | undefined>) {
    const next = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined || value === '') next.delete(key);
      else next.set(key, value);
    }
    setSearchParams(next);
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    apply({ search: searchInput.trim() || undefined });
  }

  const groups = useMemo<ArcGroup[]>(() => {
    const arcs = query.data?.data ?? [];
    const map = new Map<string, ArcGroup>();

    for (const arc of arcs) {
      const key = arc.saga ? `saga-${arc.saga.id}` : 'sin-saga';
      const existing = map.get(key);
      if (existing) existing.arcs.push(arc);
      else map.set(key, { saga: arc.saga, arcs: [arc] });
    }

    return [...map.values()];
  }, [query.data]);

  const meta = query.data?.meta;

  return (
    <div className="page container">
      <Breadcrumbs items={[{ label: 'Arcos argumentales' }]} />

      <SectionHeader
        eyebrow="La travesía, paso a paso"
        title="Arcos argumentales"
        description="Arcos ordenados cronológicamente y agrupados por saga. Los rangos de capítulos, volúmenes y episodios proceden del proveedor."
      />

      <div className="filter-panel">
        <form className="filter-panel__search" onSubmit={handleSearch} role="search">
          <label htmlFor="arc-search" className="sr-only">
            Buscar arcos
          </label>
          <input
            id="arc-search"
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Buscar por título, descripción o saga…"
          />
          <button type="submit" className="button button--primary">
            Buscar
          </button>
        </form>

        <div className="filter-panel__selects">
          <label>
            <span>Saga</span>
            <select value={saga} onChange={(event) => apply({ saga: event.target.value || undefined })}>
              <option value="">Todas las sagas</option>
              {filters.data?.data.sagas.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </select>
          </label>

          {(search || saga) && (
            <button
              type="button"
              className="button button--ghost button--small"
              onClick={() => setSearchParams(new URLSearchParams())}
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {meta && (
        <p className="results-summary" aria-live="polite">
          {formatCount(meta.total)} {meta.total === 1 ? 'arco' : 'arcos'} en{' '}
          {groups.length} {groups.length === 1 ? 'saga' : 'sagas'}
          {search && <> para «{search}»</>}
        </p>
      )}

      {query.isLoading && <LoadingState variant="list" count={6} />}
      {query.isError && <ErrorState error={query.error} onRetry={() => void query.refetch()} />}

      {query.data && query.data.data.length === 0 && (
        <EmptyState
          title="No hay arcos con esos criterios"
          message="Prueba otro término de búsqueda o selecciona otra saga."
          action={
            <button
              type="button"
              className="button button--primary"
              onClick={() => setSearchParams(new URLSearchParams())}
            >
              Ver todos los arcos
            </button>
          }
        />
      )}

      {groups.map((group) => (
        <section className="arc-group" key={group.saga?.id ?? 'sin-saga'}>
          <header className="arc-group__header">
            <div>
              <p className="eyebrow">Saga {group.saga?.number ?? '—'}</p>
              <h2>{group.saga?.title ?? 'Arcos sin saga asignada'}</h2>
            </div>
            {group.saga && (
              <dl className="arc-group__ranges">
                {group.saga.chapters && (
                  <div>
                    <dt>Capítulos</dt>
                    <dd>{group.saga.chapters}</dd>
                  </div>
                )}
                {group.saga.volumes && (
                  <div>
                    <dt>Volúmenes</dt>
                    <dd>{group.saga.volumes}</dd>
                  </div>
                )}
                {group.saga.episodes && (
                  <div>
                    <dt>Episodios</dt>
                    <dd>{group.saga.episodes}</dd>
                  </div>
                )}
              </dl>
            )}
          </header>

          <div className="arc-list">
            {group.arcs.map((arc) => (
              <ArcCard key={arc.id} arc={arc} />
            ))}
          </div>
        </section>
      ))}

      <Notice>
        La API externa mezcla títulos en inglés y francés. Se muestran tal como los
        publica el proveedor para no alterar la información.
      </Notice>
    </div>
  );
}
