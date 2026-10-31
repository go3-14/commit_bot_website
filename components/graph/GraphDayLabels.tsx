import React from 'react';

const LABELS = ['', 'mon', '', 'wed', '', 'fri', ''];

export default function GraphDayLabels() {
  return (
    <div className="flex flex-col text-[11px] text-dim select-none w-9 shrink-0 sticky left-0 z-10 bg-panel">
      {LABELS.map((label, i) => (
        <span key={i} style={{ height: 'var(--cell)', lineHeight: 'var(--cell)', marginTop: i === 0 ? 0 : 'var(--gap)' }}>
          {label}
        </span>
      ))}
    </div>
  );
}
