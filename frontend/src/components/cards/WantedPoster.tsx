import { Link } from 'react-router-dom';
import type { Character } from '../../types/api';
import { EntityImage } from '../ui/EntityImage';

/**
 * Cartel Wanted.
 *
 * Es una representación visual de la recompensa real; no añade datos que la
 * API no proporcione. Si falta la imagen, se usa el marcador del sistema.
 */
export function WantedPoster({ character }: { character: Character }) {
  return (
    <Link
      to={`/personajes/${character.id}`}
      className="wanted"
      aria-label={`Ver ficha de ${character.name}, recompensa ${character.bounty?.formatted ?? 'no disponible'}`}
    >
      <div className="wanted__paper">
        <span className="wanted__label">WANTED</span>
        <div className="wanted__portrait">
          <EntityImage src={character.image} name={character.name} kind="character" />
        </div>
        <h3 className="wanted__name">{character.name}</h3>
        <div className="wanted__bounty">
          {character.bounty?.formatted ?? 'Recompensa no disponible'}
        </div>
        <span className="wanted__footer">MARINE · DEAD OR ALIVE</span>
      </div>
    </Link>
  );
}
