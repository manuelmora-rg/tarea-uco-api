import { Link } from 'react-router-dom';
import { useApiMeta, useStats } from '../api/queries';
import { GlobalSearchForm } from '../components/search/GlobalSearchForm';
import { WantedPoster } from '../components/cards/WantedPoster';
import { FruitCard } from '../components/cards/EntityCards';
import { SectionHeader } from '../components/ui/PageChrome';
import { ErrorState } from '../components/ui/States';
import { usePageTitle } from '../hooks/usePageTitle';
import { formatCount } from '../utils/format';

const QUICK_LINKS = [
  { to: '/personajes', label: 'Personajes', description: 'Fichas, roles y afiliaciones', icon: '⚓', tone: 'blue' },
  { to: '/frutas', label: 'Frutas del diablo', description: 'Tipos, poderes y descripciones', icon: '✺', tone: 'purple' },
  { to: '/tripulaciones', label: 'Tripulaciones', description: 'Capitanes, integrantes y poder', icon: '☠', tone: 'red' },
  { to: '/recompensas', label: 'Recompensas', description: 'Carteles Wanted ordenados', icon: '฿', tone: 'gold' },
  { to: '/arcos', label: 'Arcos y sagas', description: 'La cronología de la aventura', icon: '🗺', tone: 'green' },
  { to: '/barcos', label: 'Barcos', description: 'Naves y tripulación asociada', icon: '⛵', tone: 'blue' },
];

export function HomePage() {
  usePageTitle();
  const stats = useStats();
  const meta = useApiMeta();

  const counts = stats.data?.data.counts;
  const limitations = meta.data?.data.provider.limitations ?? [];

  return (
    <div className="page page--home">
      <section className="hero">
        <div className="container hero__inner">
          <div className="hero__content">
            <p className="eyebrow">Grand Line · Archivo de datos</p>
            <h1>
              Explora el universo <span>One Piece</span>
            </h1>
            <p className="hero__lead">
              Personajes, frutas del diablo, tripulaciones, recompensas, arcos y barcos.
              Información real obtenida de una API pública, normalizada y servida por
              nuestro propio backend.
            </p>

            <GlobalSearchForm />

            <div className="hero__actions">
              <Link className="button button--primary" to="/personajes">
                Explorar personajes
              </Link>
              <Link className="button button--ghost" to="/recompensas">
                Ver carteles Wanted
              </Link>
            </div>

            <ul className="hero__badges" aria-label="Características del proyecto">
              <li>Datos en vivo</li>
              <li>API propia</li>
              <li>Proveedor intercambiable</li>
            </ul>
          </div>

          <div className="hero__art" aria-hidden="true">
            <div className="compass">
              <svg viewBox="0 0 420 420" className="compass__svg">
                <circle cx="210" cy="210" r="190" className="compass__ring" />
                <circle cx="210" cy="210" r="150" className="compass__ring compass__ring--thin" />
                <circle cx="210" cy="210" r="80" className="compass__ring compass__ring--thin" />
                {Array.from({ length: 36 }, (_, index) => {
                  const angle = (index * 10 * Math.PI) / 180;
                  const inner = index % 3 === 0 ? 168 : 180;
                  const x1 = 210 + Math.cos(angle) * inner;
                  const y1 = 210 + Math.sin(angle) * inner;
                  const x2 = 210 + Math.cos(angle) * 188;
                  const y2 = 210 + Math.sin(angle) * 188;
                  return <line key={index} x1={x1} y1={y1} x2={x2} y2={y2} className="compass__tick" />;
                })}
                <path d="M210 60 245 210 210 360 175 210Z" className="compass__needle" />
                <path d="M60 210 210 175 360 210 210 245Z" className="compass__needle compass__needle--cross" />
                <circle cx="210" cy="210" r="12" className="compass__center" />
                <path
                  d="M95 300c40-18 52-62 92-58s44 44 84 36 32-56 54-68"
                  className="compass__route"
                />
                <circle cx="95" cy="300" r="7" className="compass__island" />
                <circle cx="325" cy="210" r="9" className="compass__island" />
              </svg>
              <div className="compass__card compass__card--top">
                <span>Personajes</span>
                <strong>{counts ? formatCount(counts.characters) : '—'}</strong>
              </div>
              <div className="compass__card compass__card--bottom">
                <span>Recompensas</span>
                <strong>{counts ? formatCount(counts.charactersWithBounty) : '—'}</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container home-section">
        <SectionHeader
          eyebrow="El archivo en cifras"
          title="Un mapa de datos del mundo de One Piece"
          description="Cada cifra procede de las fuentes externas y se actualiza desde nuestro backend."
        />

        {stats.isLoading && <div className="skeleton skeleton--stats" aria-hidden="true" />}
        {stats.isError && (
          <ErrorState error={stats.error} onRetry={() => void stats.refetch()} />
        )}

        {counts && (
          <div className="stats-grid">
            {[
              { label: 'Personajes', value: counts.characters, to: '/personajes', tone: 'blue' },
              { label: 'Frutas', value: counts.fruits, to: '/frutas', tone: 'purple' },
              { label: 'Tripulaciones', value: counts.crews, to: '/tripulaciones', tone: 'red' },
              { label: 'Recompensas', value: counts.charactersWithBounty, to: '/recompensas', tone: 'gold' },
              { label: 'Arcos', value: counts.arcs, to: '/arcos', tone: 'green' },
              { label: 'Barcos', value: counts.boats, to: '/barcos', tone: 'blue' },
            ].map((item) => (
              <Link key={item.label} to={item.to} className={`stat-card stat-card--${item.tone}`}>
                <span className="stat-card__label">{item.label}</span>
                <strong>{formatCount(item.value)}</strong>
                <span className="stat-card__hint">Ver catálogo →</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="container home-section">
        <SectionHeader
          eyebrow="Los más buscados"
          title="Recompensas destacadas"
          description="Carteles generados con las recompensas reales ordenadas de mayor a menor."
          action={
            <Link className="text-link" to="/recompensas">
              Todos los carteles →
            </Link>
          }
        />

        {stats.isLoading && <div className="skeleton skeleton--posters" aria-hidden="true" />}
        {stats.isError && !counts && (
          <ErrorState error={stats.error} onRetry={() => void stats.refetch()} />
        )}
        {stats.data && (
          <div className="wanted-grid wanted-grid--compact">
            {stats.data.data.featuredCharacters.map((character) => (
              <WantedPoster key={character.id} character={character} />
            ))}
          </div>
        )}
      </section>

      <section className="container home-section">
        <SectionHeader eyebrow="Accesos rápidos" title="Elige tu ruta por la Grand Line" />
        <div className="quick-grid">
          {QUICK_LINKS.map((link) => (
            <Link key={link.to} to={link.to} className={`quick-card quick-card--${link.tone}`}>
              <span className="quick-card__icon" aria-hidden="true">
                {link.icon}
              </span>
              <span>
                <strong>{link.label}</strong>
                <small>{link.description}</small>
              </span>
              <span className="quick-card__arrow" aria-hidden="true">
                →
              </span>
            </Link>
          ))}
        </div>
      </section>

      {stats.data && stats.data.data.featuredFruits.length > 0 && (
        <section className="container home-section">
          <SectionHeader
            eyebrow="Poderes del mar"
            title="Frutas con ilustración disponible"
            description="Se muestran solo ilustraciones específicas de cada fruta; el arte genérico por tipo se descarta."
            action={
              <Link className="text-link" to="/frutas">
                Ver todas →
              </Link>
            }
          />
          <div className="grid grid--fruits">
            {stats.data.data.featuredFruits.slice(0, 5).map((fruit) => (
              <FruitCard key={fruit.id} fruit={fruit} />
            ))}
          </div>
        </section>
      )}

      <section className="container home-section">
        <div className="architecture-panel">
          <div className="architecture-panel__intro">
            <p className="eyebrow">Arquitectura</p>
            <h2>Una sola puerta de entrada a los datos</h2>
            <p>
              El navegador nunca llama a la API externa. El frontend consume nuestra
              API REST, que normaliza cada respuesta a un modelo común. Cambiar de
              proveedor no requiere tocar React.
            </p>
            <ol className="architecture-flow">
              <li>
                <span>01</span>
                <div>
                  <strong>Frontend React</strong>
                  <small>Consulta únicamente /api</small>
                </div>
              </li>
              <li>
                <span>02</span>
                <div>
                  <strong>Backend Express</strong>
                  <small>Valida, filtra, pagina y cachea</small>
                </div>
              </li>
              <li>
                <span>03</span>
                <div>
                  <strong>Adaptador</strong>
                  <small>Transforma el JSON externo</small>
                </div>
              </li>
              <li>
                <span>04</span>
                <div>
                  <strong>APIs de origen</strong>
                  <small>Datos base + imágenes verificadas</small>
                </div>
              </li>
            </ol>
          </div>

          <aside className="data-note">
            <h3>Sobre la fuente de datos</h3>
            <p>
              Proveedor activo: <strong>{meta.data?.data.provider.label ?? 'cargando…'}</strong>
            </p>
            {meta.data?.data.imageProvider && (
              <p>
                Imágenes:{' '}
                <strong>{meta.data.data.imageProvider.label}</strong>
              </p>
            )}
            <Link className="text-link" to="/buscar">
              Probar el buscador global →
            </Link>

            {limitations.length > 0 && (
              <details>
                <summary>Limitaciones conocidas del origen</summary>
                <ul>
                  {limitations.map((limitation) => (
                    <li key={limitation}>{limitation}</li>
                  ))}
                </ul>
              </details>
            )}
          </aside>
        </div>
      </section>
    </div>
  );
}
