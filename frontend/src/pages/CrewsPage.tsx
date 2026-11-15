import { FormEvent, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCrews } from '../api/queries';
import { CrewCard } from '../components/cards/EntityCards';
import { Breadcrumbs, SectionHeader } from '../components/ui/PageChrome';
import { EmptyState, ErrorState, LoadingState, Notice } from '../components/ui/States';
import { Pagination } from '../components/ui/Pagination';
import { usePageTitle } from '../hooks/usePageTitle';
import { formatCount } from '../utils/format';

export function CrewsPage() {
  usePageTitle('Tripulaciones');

  const [searchParams, setSearchParams] = useSearchParams();
  const rawPage = Number(searchParams.get('page') ?? '1');
  const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.trunc(rawPage) : 1;
  const search = searchParams.get('search') ?? '';
  const status = searchParams.get('status') ?? '';
  const sort = searchParams.get('sort') ?? 'bounty_desc';

  const [searchInput, setSearchInput] = useState(search);
  useEffect(() => setSearchInput(search), [search]);

  const query = useCrews({
    page,
    limit: 24,
    search: search || undefined,
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

  const hasFilters = Boolean(search || status || sort !== 'bounty_desc');
  const meta = query.data?.meta;

  return (
    <div className="page container">
      <Breadcrumbs items={[{ label: 'Tripulaciones' }]} />

      <SectionHeader
        eyebrow="Bandas del mar"
        title="Tripulaciones"
        description="Recompensa total, número de integrantes y estado según el catálogo externo. Los integrantes se derivan de los personajes asociados."
      />

      <div className="filter-panel">
        <form className="filter-panel__search" onSubmit={handleSearch} role="search">
          <label htmlFor="crew-search" className="sr-only">
            Buscar tripulaciones
          </label>
          <input
            id="crew-search"
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Buscar por nombre o nombre romanizado…"
          />
          <button type="submit" className="button button--primary">
            Buscar
          </button>
        </form>

        <div className="filter-panel__selects">
          <label>
            <span>Estado</span>
            <select value={status} onChange={(event) => apply({ status: event.target.value || undefined })}>
              <option value="">Cualquiera</option>
              <option value="active">Activa</option>
              <option value="inactive">Inactiva</option>
              <option value="dissolved">Disuelta</option>
              <option value="unknown">Desconocida</option>
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
              <option value="bounty_desc">Mayor recompensa total</option>
              <option value="bounty_asc">Menor recompensa total</option>
              <option value="name_asc">Nombre (A–Z)</option>
              <option value="name_desc">Nombre (Z–A)</option>
            </select>
          </label>

          {hasFilters && (
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
          {formatCount(meta.total)} {meta.total === 1 ? 'tripulación' : 'tripulaciones'}
          {search && <> para «{search}»</>}
        </p>
      )}

      {query.isLoading && <LoadingState count={6} />}
      {query.isError && <ErrorState error={query.error} onRetry={() => void query.refetch()} />}

      {query.data && query.data.data.length === 0 && (
        <EmptyState
          title="No hay tripulaciones con esos criterios"
          message="Prueba otro nombre o elimina los filtros."
          action={
            <button
              type="button"
              className="button button--primary"
              onClick={() => setSearchParams(new URLSearchParams())}
            >
              Restablecer búsqueda
            </button>
          }
        />
      )}

      {query.data && query.data.data.length > 0 && (
        <>
          <div className="grid grid--crews">
            {query.data.data.map((crew) => (
              <CrewCard key={crew.id} crew={crew} />
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
        El campo «integrantes» procede del proveedor y puede no coincidir con el
        número de personajes que la propia API asocia a la tripulación.
      </Notice>
    </div>
  );
}
