import { Link } from 'react-router-dom';
import { usePageTitle } from '../hooks/usePageTitle';

export function NotFoundPage() {
  usePageTitle('Página no encontrada');

  return (
    <div className="page container">
      <div className="not-found">
        <p className="not-found__code">404</p>
        <h1>Esta isla no aparece en la carta de navegación</h1>
        <p>
          La página que buscas no existe o el enlace ha cambiado. Vuelve al inicio o
          utiliza el buscador global para encontrar lo que necesitas.
        </p>
        <div className="not-found__actions">
          <Link className="button button--primary" to="/">
            Volver al inicio
          </Link>
          <Link className="button button--ghost" to="/buscar">
            Abrir el buscador
          </Link>
        </div>
      </div>
    </div>
  );
}
