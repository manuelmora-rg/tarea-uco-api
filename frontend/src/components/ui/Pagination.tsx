interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}

function pageWindow(page: number, totalPages: number): Array<number | '…'> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set<number>([1, totalPages, page - 1, page, page + 1]);
  pages.delete(0);
  pages.delete(totalPages + 1);

  const sorted = [...pages].sort((a, b) => a - b);
  const result: Array<number | '…'> = [];

  for (let index = 0; index < sorted.length; index += 1) {
    const current = sorted[index];
    const previous = sorted[index - 1];
    if (current !== undefined && previous !== undefined && current - previous > 1) {
      result.push('…');
    }
    if (current !== undefined) result.push(current);
  }

  return result;
}

export function Pagination({ page, totalPages, total, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav className="pagination" aria-label="Paginación">
      <p className="pagination__summary">
        Página {page} de {totalPages} · {total} registros
      </p>
      <div className="pagination__controls">
        <button
          type="button"
          className="pagination__button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          <span aria-hidden="true">←</span> Anterior
        </button>

        <div className="pagination__pages">
          {pageWindow(page, totalPages).map((item, index) =>
            item === '…' ? (
              <span key={`gap-${index}`} className="pagination__gap" aria-hidden="true">
                …
              </span>
            ) : (
              <button
                key={item}
                type="button"
                className={`pagination__page ${item === page ? 'is-active' : ''}`}
                onClick={() => onPageChange(item)}
                aria-current={item === page ? 'page' : undefined}
                aria-label={`Página ${item}`}
              >
                {item}
              </button>
            ),
          )}
        </div>

        <button
          type="button"
          className="pagination__button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          Siguiente <span aria-hidden="true">→</span>
        </button>
      </div>
    </nav>
  );
}
