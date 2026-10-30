import React from 'react';

export const LEVEL_COLORS = ['#131a13', '#1e3d22', '#2e6334', '#4a9a52', '#8cd48f'] as const;

export function levelFor(count: number): number {
  if (count <= 0) return 0;
  if (count <= 3) return 1;
  if (count <= 6) return 2;
  if (count <= 9) return 3;
  return 4;
}

interface GraphCellProps {
  date: string;
  label: string;
  realCount: number;
  queuedCount: number;
  disabled: boolean;
}

/** One day in the grid. Pointer behaviour is handled by the parent through event delegation. */
function GraphCell({ date, label, realCount, queuedCount, disabled }: GraphCellProps) {
  const queued = queuedCount > 0;
  const level = levelFor(realCount + queuedCount);

  return (
    <button
      type="button"
      data-date={disabled ? undefined : date}
      aria-label={label}
      aria-pressed={queued}
      disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      className={`heat-cell ${queued ? 'heat-cell-queued' : ''}`}
      style={{ backgroundColor: LEVEL_COLORS[level] }}
    />
  );
}

export default React.memo(GraphCell);
