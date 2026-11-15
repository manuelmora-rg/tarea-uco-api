import { useEffect, useState, type CSSProperties } from 'react';
import { assetUrl } from '../../api/client';
import { hashHue, initials } from '../../utils/format';

export type MediaKind = 'character' | 'fruit' | 'boat' | 'crew' | 'arc';

interface EntityImageProps {
  src?: string | null;
  name: string;
  kind?: MediaKind;
  className?: string;
}

const KIND_NOUN: Record<MediaKind, string> = {
  character: 'personaje',
  fruit: 'fruta',
  boat: 'barco',
  crew: 'tripulación',
  arc: 'arco',
};

/**
 * Imagen con placeholder ilustrado.
 *
 * Las imágenes se sirven mediante el proxy del backend. Si una entidad no tiene
 * imagen verificada, o la carga falla, no se inventa un retrato: se muestra un
 * marcador generado a partir del nombre.
 */
export function EntityImage({
  src,
  name,
  kind = 'character',
  className = '',
}: EntityImageProps) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  const resolved = assetUrl(src);

  if (!resolved || failed) {
    const style = { '--media-hue': hashHue(name) } as CSSProperties;
    const note = failed ? 'No se pudo cargar la imagen' : 'Imagen no disponible';

    return (
      <div
        className={`entity-image entity-image--placeholder entity-image--${kind} ${className}`}
        style={style}
        role="img"
        aria-label={`${note} para el ${KIND_NOUN[kind]} ${name}`}
        title={`${note}. No hay una imagen verificada para este registro.`}
      >
        <span className="entity-image__pattern" aria-hidden="true" />
        <span className="entity-image__initials" aria-hidden="true">
          {initials(name)}
        </span>
        <span className="entity-image__note">{note}</span>
      </div>
    );
  }

  return (
    <img
      className={`entity-image ${className}`}
      src={resolved}
      alt={`Imagen de ${name}`}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}
