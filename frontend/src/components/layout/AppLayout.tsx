import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Logo } from './Logo';
import { GlobalSearchForm } from '../search/GlobalSearchForm';
import { useHealth, useApiMeta } from '../../api/queries';

const NAV_ITEMS = [
  { to: '/', label: 'Inicio', end: true },
  { to: '/personajes', label: 'Personajes' },
  { to: '/frutas', label: 'Frutas' },
  { to: '/tripulaciones', label: 'Tripulaciones' },
  { to: '/recompensas', label: 'Recompensas' },
  { to: '/arcos', label: 'Arcos' },
  { to: '/barcos', label: 'Barcos' },
];

function ApiStatus() {
  const health = useHealth();

  if (health.isLoading) {
    return <span className="api-status api-status--loading">Comprobando API…</span>;
  }

  if (health.isError) {
    return <span className="api-status api-status--offline">API no disponible</span>;
  }

  return <span className="api-status api-status--online">API conectada · {health.data?.provider}</span>;
}

export function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const meta = useApiMeta();

  useEffect(() => {
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [location.pathname]);

  return (
    <div className="app-shell">
      <a className="skip-link" href="#contenido">
        Saltar al contenido
      </a>

      <header className="site-header">
        <div className="container site-header__inner">
          <Logo />

          <nav className="main-nav" aria-label="Navegación principal">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => (isActive ? 'is-active' : undefined)}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="site-header__search">
            <GlobalSearchForm variant="header" />
          </div>

          <button
            type="button"
            className="menu-toggle"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span aria-hidden="true">{menuOpen ? '✕' : '☰'}</span>
          </button>
        </div>

        {menuOpen && (
          <div id="mobile-menu" className="mobile-menu">
            <GlobalSearchForm variant="header" />
            <nav aria-label="Navegación móvil">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) => (isActive ? 'is-active' : undefined)}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        )}
      </header>

      <main id="contenido" className="site-main">
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="container site-footer__grid">
          <div className="site-footer__brand">
            <Logo compact />
            <p>
              Explorador no oficial del universo One Piece. Proyecto académico con
              datos servidos por una API propia.
            </p>
            <ApiStatus />
          </div>

          <div>
            <h2 className="site-footer__title">Explorar</h2>
            <ul>
              {NAV_ITEMS.slice(1).map((item) => (
                <li key={item.to}>
                  <Link to={item.to}>{item.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="site-footer__title">Datos</h2>
            <ul>
              <li>
                <Link to="/buscar">Buscador global</Link>
              </li>
              <li>
                <a
                  href="https://api.api-onepiece.com/v2/characters/en"
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  API de datos base
                </a>
              </li>
              {meta.data?.data.imageProvider && (
                <li>
                  <a
                    href="https://onepieceapi.com/documentation"
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    API de imágenes
                  </a>
                </li>
              )}
              <li>
                <span className="muted">
                  Proveedor: {meta.data?.data.provider.key ?? 'onepiece_multisource'}
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="container site-footer__bottom">
          <p>
            One Piece es una obra de Eiichiro Oda. Este sitio es un proyecto de
            aprendizaje sin ánimo de lucro y sin afiliación oficial.
          </p>
          <p>Las imágenes disponibles pertenecen a sus respectivos titulares.</p>
        </div>
      </footer>
    </div>
  );
}
