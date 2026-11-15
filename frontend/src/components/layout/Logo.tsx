import { Link } from 'react-router-dom';

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="logo" aria-label="One Piece Explorer, ir al inicio">
      <span className="logo__mark" aria-hidden="true">
        <svg viewBox="0 0 64 64" width="40" height="40">
          <circle cx="32" cy="32" r="29" fill="currentColor" stroke="#d4a020" strokeWidth="3" />
          <path d="M14 26h36c2 0 3 2 2 4l-3 4H15l-3-4c-1-2 0-4 2-4Z" fill="#d4a020" />
          <path d="M18 34h28v3c0 6-6 9-14 9s-14-3-14-9v-3Z" fill="#f6efdf" />
          <circle cx="26" cy="44" r="3" fill="#0b2c4d" />
          <circle cx="38" cy="44" r="3" fill="#0b2c4d" />
          <path d="M23 52c5 3 13 3 18 0" fill="none" stroke="#c8102e" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </span>
      <span className="logo__text">
        <span className="logo__title">One Piece</span>
        <span className="logo__subtitle">Explorer</span>
        {!compact && <span className="logo__tagline">Archivo de la Grand Line</span>}
      </span>
    </Link>
  );
}
