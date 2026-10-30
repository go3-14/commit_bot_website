import React from 'react';

export default function GraphDayLabels() {
  return (
    <div className="flex flex-col justify-between text-[11px] text-dim font-mono select-none pr-3 h-[109px]">
      <span className="h-[13px] leading-[13px] opacity-0">sunday</span>
      <span className="h-[13px] leading-[13px]">monday</span>
      <span className="h-[13px] leading-[13px] opacity-0">tuesday</span>
      <span className="h-[13px] leading-[13px]">wednesday</span>
      <span className="h-[13px] leading-[13px] opacity-0">thursday</span>
      <span className="h-[13px] leading-[13px]">friday</span>
      <span className="h-[13px] leading-[13px] opacity-0">saturday</span>
    </div>
  );
}
