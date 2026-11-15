import { useId, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';

interface GlobalSearchFormProps {
  variant?: 'header' | 'hero';
  initialValue?: string;
}

export function GlobalSearchForm({
  variant = 'hero',
  initialValue = '',
}: GlobalSearchFormProps) {
  const [value, setValue] = useState(initialValue);
  const navigate = useNavigate();
  const inputId = useId();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = value.trim();
    if (query.length < 2) {
      navigate('/buscar');
      return;
    }
    navigate(`/buscar?q=${encodeURIComponent(query)}`);
  }

  return (
    <form
      className={`search-form search-form--${variant}`}
      role="search"
      onSubmit={handleSubmit}
    >
      <label className="sr-only" htmlFor={inputId}>
        Buscar en el universo One Piece
      </label>
      <span className="search-form__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="7" />
          <path d="m16.5 16.5 4 4" strokeLinecap="round" />
        </svg>
      </span>
      <input
        id={inputId}
        type="search"
        name="q"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Personajes, frutas, tripulaciones, arcos…"
        autoComplete="off"
        minLength={2}
      />
      <button type="submit" className="search-form__button">
        Buscar
      </button>
    </form>
  );
}
