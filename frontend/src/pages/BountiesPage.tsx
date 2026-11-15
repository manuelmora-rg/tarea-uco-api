import { FormEvent, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useBounties } from '../api/queries';
import { WantedPoster } from '../components/cards/WantedPoster';
import { Breadcrumbs, SectionHeader } from '../components/ui/PageChrome';
import { EmptyState, ErrorState, LoadingState, Notice } from '../components/ui/States';
import { Pagination } from '../components/ui/Pagination';
import { usePageTitle } from '../hooks/usePageTitle';
import { formatCount } from '../utils/format';

export function BountiesPage() {
  usePageTitle('Recompensas');

  const [searchParams, setSearchParams] = useSearchParams();
  const rawPage = Number(searchParams.get('page') ?? '1');
  const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.trunc(rawPage) : 1;
  const search = searchParams.get('search') ?? '';

  const [searchInput, setSearchInput] = useState(search);
  useEffect(() => setSearchInput(search), [search]);

  const query = useBounties({
    page,
    limit: 12,
    search: search || undefined,
  });

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = new URLSearchParams(searchParams);
    const value = searchInput.trim();
    if (value) next.set('search', value);
    else next.delete('search');
    next.delete('page');
    setSearchParams(next);
  }

  const meta = query.data?.meta;

  return (
    <div className="page container">
      <Breadcrumbs items={[{ label: 'Recompensas' }]} />

      <SectionHeader
        eyebrow="Se buscan · vivos o muertos"
        title="Carteles Wanted"
        description="Personajes con recompensa conocida, ordenados siempre de mayor a menor cantidad. El cartel es una representación visual del dato real."
      />

      <div className="filter-panel">
        <form className="filter-panel__search" onSubmit={handleSearch} role="search">
          <label htmlFor="bounty-search" className="sr-only">
            Buscar por personaje
          </label>
          <input
            id="bounty-search"
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Buscar un personaje por nombre…"
          />
          <button type="submit" className="button button--primary">
            Buscar
          </button>
        </form>

        {search && (
          <button
            type="button"
            className="button button--ghost button--small"
            onClick={() => setSearchParams(new URLSearchParams())}
          >
            Quitar búsqueda
          </button>
        )}
      </div>

      {meta && (
        <p className="results-summary" aria-live="polite">
          {formatCount(meta.total)} {meta.total === 1 ? 'recompensa' : 'recompensas'}
          {search && <> para «{search}»</>} · orden descendente
        </p>
      )}

      {query.isLoading && <LoadingState variant="posters" count={8} />}
      {query.isError && <ErrorState error={query.error} onRetry={() => void query.refetch()} />}

      {query.data && query.data.data.length === 0 && (
        <EmptyState
          title="No hay carteles que coincidan"
          message="Ningún personaje con recompensa registrada coincide con esa búsqueda."
          action={
            <button
              type="button"
              className="button button--primary"
              onClick={() => setSearchParams(new URLSearchParams())}
            >
              Ver todos los carteles
            </button>
          }
        />
      )}

      {query.data && query.data.data.length > 0 && (
        <>
          <div className="wanted-grid">
            {query.data.data.map((character) => (
              <WantedPoster key={character.id} character={character} />
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

      <Notice tone="warning">
        Solo se muestran personajes cuya recompensa existe en el origen. Algunas
        cifras del proveedor contienen erratas de agrupamiento; el backend las
        normaliza y conserva el valor original para poder auditarlo.
      </Notice>
    </div>
  );
}
