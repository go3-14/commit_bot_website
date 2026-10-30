import React from 'react';

const LABELS = ['', 'mon', '', 'wed', '', 'fri', ''];

export default function GraphDayLabels() {
  return (
    <div className="flex flex-col gap-[3px] text-[11px] text-dim select-none w-9 shrink-0">
      {LABELS.map((label, i) => (
        <span key={i} className="h-[13px] leading-[13px]">
          {label}
        </span>
      ))}
    </div>
  );
}
