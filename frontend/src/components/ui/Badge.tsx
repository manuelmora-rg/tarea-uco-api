import type { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  tone?: 'default' | 'gold' | 'red' | 'green' | 'purple' | 'blue';
  className?: string;
}

export function Badge({ children, tone = 'default', className = '' }: BadgeProps) {
  return <span className={`badge badge--${tone} ${className}`}>{children}</span>;
}

export function StatusBadge({ status }: { status: string | null }) {
  if (status === 'Vivo' || status === 'Activa') {
    return <Badge tone="green">{status}</Badge>;
  }
  if (status === 'Finado' || status === 'Disuelta') {
    return <Badge tone="red">{status}</Badge>;
  }
  if (status === 'Inactiva') {
    return <Badge tone="purple">{status}</Badge>;
  }
  return <Badge>{status ?? 'Sin datos'}</Badge>;
}
