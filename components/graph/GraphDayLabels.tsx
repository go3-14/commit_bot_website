import React from 'react';

export default function GraphDayLabels() {
  return (
    <div className="flex flex-col justify-between text-[10px] text-[#8b949e] font-mono select-none pr-2.5 h-[109px]">
      <span className="h-[13px] leading-[13px] opacity-0">Sun</span>
      <span className="h-[13px] leading-[13px]">Mon</span>
      <span className="h-[13px] leading-[13px] opacity-0">Tue</span>
      <span className="h-[13px] leading-[13px]">Wed</span>
      <span className="h-[13px] leading-[13px] opacity-0">Thu</span>
      <span className="h-[13px] leading-[13px]">Fri</span>
      <span className="h-[13px] leading-[13px] opacity-0">Sat</span>
    </div>
  );
}
