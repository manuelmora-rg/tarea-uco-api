import type { ReactNode } from 'react';
import { ApiError } from '../../api/client';

export function LoadingState({
  variant = 'grid',
  count = 8,
  label = 'Cargando datos del archivo…',
}: {
  variant?: 'grid' | 'posters' | 'list';
  count?: number;
  label?: string;
}) {
  return (
    <div className={`loading loading--${variant}`} role="status" aria-live="polite">
      <span className="sr-only">{label}</span>
      <div className="skeleton-grid">
        {Array.from({ length: count }, (_, index) => (
          <div className="skeleton-card" key={index} aria-hidden="true">
            <div className="skeleton skeleton--media" />
            <div className="skeleton skeleton--line" />
            <div className="skeleton skeleton--line skeleton--short" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ErrorState({
  error,
  title = 'No se pudo cargar la información',
  onRetry,
}: {
  error?: unknown;
  title?: string;
  onRetry?: () => void;
}) {
  let message =
    'Ha ocurrido un problema al consultar nuestra API. Inténtalo de nuevo en unos segundos.';

  if (error instanceof ApiError) {
    message = error.message;
    if (error.status === 0) {
      message =
        'No hay conexión con el backend. Inicia el servidor con "npm run dev" y vuelve a intentarlo.';
    }
  } else if (error instanceof Error && error.message) {
    message = error.message;
  }

  return (
    <div className="state-panel state-panel--error" role="alert">
      <span className="state-panel__icon" aria-hidden="true">
        ⚠
      </span>
      <h3>{title}</h3>
      <p>{message}</p>
      {onRetry && (
        <button type="button" className="button button--primary" onClick={onRetry}>
          Reintentar
        </button>
      )}
    </div>
  );
}

export function EmptyState({
  title,
  message,
  action,
}: {
  title: string;
  message: string;
  action?: ReactNode;
}) {
  return (
    <div className="state-panel">
      <span className="state-panel__icon" aria-hidden="true">
        ⚓
      </span>
      <h3>{title}</h3>
      <p>{message}</p>
      {action}
    </div>
  );
}

export function Notice({ children, tone = 'info' }: { children: ReactNode; tone?: 'info' | 'warning' }) {
  return <div className={`notice notice--${tone}`}>{children}</div>;
}
