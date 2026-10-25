import React from 'react';

export default function GraphDayLabels() {
  return (
    <div className="flex flex-col justify-between text-[10px] text-[#8b949e] font-mono select-none pr-2 h-[102px]">
      <span className="h-[12px] leading-[12px] opacity-0">Sun</span>
      <span className="h-[12px] leading-[12px]">Mon</span>
      <span className="h-[12px] leading-[12px] opacity-0">Tue</span>
      <span className="h-[12px] leading-[12px]">Wed</span>
      <span className="h-[12px] leading-[12px] opacity-0">Thu</span>
      <span className="h-[12px] leading-[12px]">Fri</span>
      <span className="h-[12px] leading-[12px] opacity-0">Sat</span>
    </div>
  );
}
