import type { CharacterStatus, CrewStatus } from '../types/api';

const NUMBER_FORMAT = new Intl.NumberFormat('es-ES');

export function formatNumber(value: number): string {
  return NUMBER_FORMAT.format(value);
}

export function formatBounty(formatted: string | null | undefined): string {
  return formatted ?? 'Sin recompensa';
}

export function formatCount(value: number): string {
  return NUMBER_FORMAT.format(value);
}

export function characterStatusLabel(status: CharacterStatus): string {
  switch (status) {
    case 'alive':
      return 'Vivo';
    case 'deceased':
      return 'Finado';
    case 'unknown':
      return 'Desconocido';
    default:
      return 'Sin datos';
  }
}

export function crewStatusLabel(status: CrewStatus): string {
  switch (status) {
    case 'active':
      return 'Activa';
    case 'inactive':
      return 'Inactiva';
    case 'dissolved':
      return 'Disuelta';
    default:
      return 'Sin datos';
  }
}

export function fruitTypeLabel(type: string | null): string {
  if (!type) return 'Tipo no disponible';
  const labels: Record<string, string> = {
    Paramecia: 'Paramecia',
    Logia: 'Logia',
    Zoan: 'Zoan',
    'Zoan Antique': 'Zoan ancestral',
    'Zoan Mythique': 'Zoan mítica',
    Smile: 'SMILE',
    Clone: 'Clon',
  };
  return labels[type] ?? type;
}

/** Traducción de nombres de frutas del diablo al español */
export function translateFruitName(name: string | null): string {
  if (!name) return 'Sin nombre';
  const translations: Record<string, string> = {
    // Frutas del arco de East Blue / Alabasta
    'Gomu Gomu no Mi': 'Fruta Gomu Gomu',
    'Mero Mero no Mi': 'Fruta Mero Mero',
    'Munchu Munchu no Mi': 'Fruta Munchu Munchu',
    'Sube Sube no Mi': 'Fruta Sube Sube',
    'Hito Hito no Mi': 'Fruta Hito Hito',
    'Bara Bara no Mi': 'Fruta Bara Bara',
    'Ope Ope no Mi': 'Fruta Ope Ope',
    // Frutas conocidas
    'Gum-Gum Fruit': 'Fruta Gomu Gomu',
    'Human-Human Fruit': 'Fruta Hito Hito',
    'Cure-Cure no Mi': 'Fruta Cure Cure',
    'Swap-Swap Fruit': 'Fruta Swap Swap',
    // Añadir más según sea necesario
  };
  return translations[name] ?? name;
}

export function fruitTypeClass(type: string | null): string {
  if (!type) return 'fruit-paramecia';
  if (type === 'Logia') return 'fruit-logia';
  if (type.startsWith('Zoan')) return 'fruit-zoan';
  if (type === 'Smile') return 'fruit-smile';
  return 'fruit-paramecia';
}

export function plural(count: number, singular: string, pluralForm: string): string {
  return count === 1 ? singular : pluralForm;
}

export function truncate(text: string | null, length: number): string {
  if (!text) return '';
  if (text.length <= length) return text;
  return `${text.slice(0, length).trimEnd()}…`;
}

export function initials(name: string): string {
  return name
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('');
}

/** Tono estable a partir del nombre, para los placeholders ilustrados. */
export function hashHue(name: string): number {
  let hash = 0;
  for (let index = 0; index < name.length; index += 1) {
    hash = (hash * 31 + name.charCodeAt(index)) % 360;
  }
  return hash;
}
