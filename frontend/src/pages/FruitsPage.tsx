import { FormEvent, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useFilters, useFruits } from '../api/queries';
import { FruitCard } from '../components/cards/EntityCards';
import { Breadcrumbs, SectionHeader } from '../components/ui/PageChrome';
import { EmptyState, ErrorState, LoadingState, Notice } from '../components/ui/States';
import { Pagination } from '../components/ui/Pagination';
import { usePageTitle } from '../hooks/usePageTitle';
import { formatCount, fruitTypeLabel } from '../utils/format';

export function FruitsPage() {
  usePageTitle('Frutas del diablo');

  const [searchParams, setSearchParams] = useSearchParams();
  const rawPage = Number(searchParams.get('page') ?? '1');
  const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.trunc(rawPage) : 1;
  const search = searchParams.get('search') ?? '';
  const type = searchParams.get('type') ?? '';
  const sort = searchParams.get('sort') ?? 'name_asc';

  const [searchInput, setSearchInput] = useState(search);
  useEffect(() => setSearchInput(search), [search]);

  const filters = useFilters();
  const query = useFruits({
    page,
    limit: 24,
    search: search || undefined,
    type: type || undefined,
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

  const hasFilters = Boolean(search || type || sort !== 'name_asc');
  const meta = query.data?.meta;

  return (
    <div className="page container">
      <Breadcrumbs items={[{ label: 'Frutas del diablo' }]} />

      <SectionHeader
        eyebrow="Poderes del mar"
        title="Frutas del diablo"
        description="Catálogo de frutas con su tipo y descripción. Se muestra arte específico cuando existe; las ilustraciones genéricas por tipo se descartan."
      />

      <div className="filter-panel">
        <form className="filter-panel__search" onSubmit={handleSearch} role="search">
          <label htmlFor="fruit-search" className="sr-only">
            Buscar frutas
          </label>
          <input
            id="fruit-search"
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Buscar por nombre, nombre romanizado o poder…"
          />
          <button type="submit" className="button button--primary">
            Buscar
          </button>
        </form>

        <div className="filter-panel__selects">
          <label>
            <span>Tipo</span>
            <select value={type} onChange={(event) => apply({ type: event.target.value || undefined })}>
              <option value="">Todos</option>
              {filters.data?.data.fruitTypes.map((fruitType) => (
                <option key={fruitType} value={fruitType}>
                  {fruitTypeLabel(fruitType)}
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
          {formatCount(meta.total)} {meta.total === 1 ? 'fruta' : 'frutas'}
          {search && <> para «{search}»</>}
        </p>
      )}

      {query.isLoading && <LoadingState count={8} />}
      {query.isError && <ErrorState error={query.error} onRetry={() => void query.refetch()} />}

      {query.data && query.data.data.length === 0 && (
        <EmptyState
          title="No hay frutas con esos criterios"
          message="Cambia el tipo seleccionado o busca otro término."
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
          <div className="grid grid--fruits">
            {query.data.data.map((fruit) => (
              <FruitCard key={fruit.id} fruit={fruit} />
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
        Algunas frutas usan arte genérico por tipo en la fuente de imágenes; ese arte
        no se presenta como propio. Si no hay una ilustración específica, se conserva
        la imagen anterior o se muestra un marcador.
      </Notice>
    </div>
  );
}
