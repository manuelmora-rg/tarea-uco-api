import type { ReactNode } from 'react';

export function FactList({
  items,
  title,
}: {
  items: Array<{ label: string; value: ReactNode }>;
  title?: string;
}) {
  return (
    <div className="fact-list">
      {title && <h2 className="fact-list__title">{title}</h2>}
      <dl>
        {items.map((item) => (
          <div className="fact-list__row" key={item.label}>
            <dt>{item.label}</dt>
            <dd>{item.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
