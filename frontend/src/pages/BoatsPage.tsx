import { FormEvent, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useBoats, useFilters } from '../api/queries';
import { BoatCard } from '../components/cards/EntityCards';
import { Breadcrumbs, SectionHeader } from '../components/ui/PageChrome';
import { EmptyState, ErrorState, LoadingState, Notice } from '../components/ui/States';
import { Pagination } from '../components/ui/Pagination';
import { usePageTitle } from '../hooks/usePageTitle';
import { formatCount } from '../utils/format';

export function BoatsPage() {
  usePageTitle('Barcos');

  const [searchParams, setSearchParams] = useSearchParams();
  const rawPage = Number(searchParams.get('page') ?? '1');
  const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.trunc(rawPage) : 1;
  const search = searchParams.get('search') ?? '';
  const crew = searchParams.get('crew') ?? '';
  const sort = searchParams.get('sort') ?? 'name_asc';

  const [searchInput, setSearchInput] = useState(search);
  useEffect(() => setSearchInput(search), [search]);

  const filters = useFilters();
  const query = useBoats({
    page,
    limit: 24,
    search: search || undefined,
    crew: crew ? Number(crew) : undefined,
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

  const hasFilters = Boolean(search || crew || sort !== 'name_asc');
  const meta = query.data?.meta;

  return (
    <div className="page container">
      <Breadcrumbs items={[{ label: 'Barcos' }]} />

      <SectionHeader
        eyebrow="Naves de la Grand Line"
        title="Barcos"
        description="Embarcaciones registradas con su tipo, tripulación asociada y capitán cuando el proveedor los proporciona."
      />

      <div className="filter-panel">
        <form className="filter-panel__search" onSubmit={handleSearch} role="search">
          <label htmlFor="boat-search" className="sr-only">
            Buscar barcos
          </label>
          <input
            id="boat-search"
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Buscar por nombre, tipo, tripulación o capitán…"
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
            <span>Orden</span>
            <select
              value={sort}
              onChange={(event) =>
                apply({ sort: event.target.value === 'name_asc' ? undefined : event.target.value })
              }
            >
              <option value="name_asc">Nombre (A–Z)</option>
              <option value="name_desc">Nombre (Z–A)</option>
              <option value="id_asc">ID de origen</option>
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
          {formatCount(meta.total)} {meta.total === 1 ? 'barco' : 'barcos'}
          {search && <> para «{search}»</>}
        </p>
      )}

      {query.isLoading && <LoadingState count={8} />}
      {query.isError && <ErrorState error={query.error} onRetry={() => void query.refetch()} />}

      {query.data && query.data.data.length === 0 && (
        <EmptyState
          title="No hay barcos con esos criterios"
          message="Prueba otro nombre o elimina los filtros aplicados."
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
          <div className="grid grid--boats">
            {query.data.data.map((boat) => (
              <BoatCard key={boat.id} boat={boat} />
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
        Las imágenes se asocian por nombre oficial o romanizado. Si la fuente no
        ofrece una imagen verificada, se muestra un marcador generado por la interfaz.
      </Notice>
    </div>
  );
}
