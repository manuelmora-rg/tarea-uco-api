import { Link } from 'react-router-dom';
import type { Arc, Boat, Character, Crew, Fruit } from '../../types/api';
import {
  characterStatusLabel,
  crewStatusLabel,
  fruitTypeClass,
  fruitTypeLabel,
  translateFruitName,
  truncate,
} from '../../utils/format';
import { EntityImage } from '../ui/EntityImage';
import { Badge, StatusBadge } from '../ui/Badge';

export function CharacterCard({ character }: { character: Character }) {
  return (
    <Link to={`/personajes/${character.id}`} className="card char-card">
      <div className="char-card__media">
        <EntityImage src={character.image} name={character.name} kind="character" />
        <span className="char-card__status">
          <StatusBadge status={characterStatusLabel(character.status)} />
        </span>
      </div>
      <div className="char-card__body">
        <h3>{character.name}</h3>
        <p className="card__subtitle">{character.job ?? 'Rol no disponible'}</p>
        <p className="card__crew">{character.crew?.name ?? 'Sin tripulación registrada'}</p>

        <div className="char-card__footer">
          {character.bounty ? (
            <span className="bounty-chip" title={`Recompensa original: ${character.bounty.raw}`}>
              {character.bounty.formatted}
            </span>
          ) : (
            <span className="muted small">Recompensa no disponible</span>
          )}
          {character.fruit && (
            <Badge tone="purple" className="card__fruit">
              {character.fruit.name}
            </Badge>
          )}
        </div>
      </div>
    </Link>
  );
}

export function FruitCard({ fruit }: { fruit: Fruit }) {
  return (
    <Link to={`/frutas/${fruit.id}`} className="card fruit-card">
      <div className="fruit-card__media">
        <EntityImage src={fruit.image} name={fruit.name} kind="fruit" />
        <span className={`fruit-type ${fruitTypeClass(fruit.type)}`}>
          {fruitTypeLabel(fruit.type)}
        </span>
      </div>
      <div className="fruit-card__body">
        <h3>{translateFruitName(fruit.name)}</h3>
        {fruit.romanName && <p className="card__subtitle">{fruit.romanName}</p>}
        <p className="card__description">
          {fruit.description
            ? truncate(fruit.description, 130)
            : 'La API no proporciona descripción para esta fruta.'}
        </p>
      </div>
    </Link>
  );
}

export function CrewCard({ crew }: { crew: Crew }) {
  return (
    <Link to={`/tripulaciones/${crew.id}`} className="card crew-card">
      <div className="crew-card__header">
        <EntityImage src={null} name={crew.name} kind="crew" className="crew-card__emblem" />
        <div>
          <h3>{crew.name}</h3>
          {crew.romanName && <p className="card__subtitle">{crew.romanName}</p>}
        </div>
        {crew.isYonko && <Badge tone="gold">Yonko</Badge>}
      </div>

      <div className="crew-card__stats">
        <div>
          <span>Integrantes</span>
          <strong>{crew.memberCount ?? 'Sin datos'}</strong>
        </div>
        <div>
          <span>Recompensa total</span>
          <strong>{crew.totalBounty?.formatted ?? 'No disponible'}</strong>
        </div>
      </div>

      <div className="crew-card__footer">
        <StatusBadge status={crewStatusLabel(crew.status)} />
        {crew.description && <p>{truncate(crew.description, 90)}</p>}
      </div>
    </Link>
  );
}

export function ArcCard({ arc, index }: { arc: Arc; index?: number }) {
  return (
    <Link to={`/arcos/${arc.id}`} className="card arc-card">
      <div className="arc-card__index" aria-hidden="true">
        {String(index ?? arc.id).padStart(2, '0')}
      </div>
      <div className="arc-card__body">
        <div className="arc-card__meta">
          {arc.saga && <Badge tone="blue">{arc.saga.title}</Badge>}
          {arc.saga?.number != null && <span className="muted small">Saga {arc.saga.number}</span>}
        </div>
        <h3>{arc.title}</h3>
        <p>{arc.description ? truncate(arc.description, 180) : 'Sin descripción disponible.'}</p>
      </div>
      <span className="arc-card__arrow" aria-hidden="true">
        →
      </span>
    </Link>
  );
}

export function BoatCard({ boat }: { boat: Boat }) {
  return (
    <Link to={`/barcos/${boat.id}`} className="card boat-card">
      <div className="boat-card__media">
        <EntityImage src={boat.image} name={boat.name} kind="boat" />
      </div>
      <div className="boat-card__body">
        <div className="boat-card__meta">
          {boat.type && <Badge tone="blue">{boat.type}</Badge>}
        </div>
        <h3>{boat.name}</h3>
        {boat.romanName && <p className="card__subtitle">{boat.romanName}</p>}
        <dl className="boat-card__facts">
          <div>
            <dt>Tripulación</dt>
            <dd>{boat.crew?.name ?? 'Sin datos'}</dd>
          </div>
          <div>
            <dt>Capitán</dt>
            <dd>{boat.captain?.name ?? 'Sin datos'}</dd>
          </div>
        </dl>
      </div>
    </Link>
  );
}
