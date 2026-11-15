import { useEffect } from 'react';

const SUFFIX = 'One Piece Explorer';

/** Actualiza el título del documento al cambiar de página. */
export function usePageTitle(title?: string): void {
  useEffect(() => {
    document.title = title ? `${title} · ${SUFFIX}` : `${SUFFIX} · Archivo de la Grand Line`;
  }, [title]);
}
