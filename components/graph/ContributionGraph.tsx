'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import GraphMonthLabels from './GraphMonthLabels';
import GraphDayLabels from './GraphDayLabels';
import GraphCell, { LEVEL_COLORS } from './GraphCell';
import { ContributionDay } from '@/types';
import { yearGridToDate, toDateString } from '@/lib/core/grid-mapper';
import { isPaintableDate } from '@/lib/core/paintable';
import { useGraphStore } from '@/store/graph-store';

interface ContributionGraphProps {
  realData: ContributionDay[][] | null;
  year: number;
}

interface HoverState {
  date: string;
  left: number;
  top: number;
}

const DATE_FORMAT: Intl.DateTimeFormatOptions = {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
};

function formatDate(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', DATE_FORMAT).toLowerCase();
}

export default function ContributionGraph({ realData, year }: ContributionGraphProps) {
  const queue = useGraphStore((s) => s.queue);
  const activeTool = useGraphStore((s) => s.activeTool);
  const intensity = useGraphStore((s) => s.intensity);
  const setCell = useGraphStore((s) => s.setCell);
  const clearCell = useGraphStore((s) => s.clearCell);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<'add' | 'remove' | null>(null);
  const [hover, setHover] = useState<HoverState | null>(null);

  // The first and last weeks of a GitHub year are partial, so look contributions up by date, not by position
  const realByDate = useMemo(() => {
    const map = new Map<string, number>();
    for (const week of realData ?? []) {
      for (const day of week) {
        if (day.date) map.set(day.date, day.contributionCount);
      }
    }
    return map;
  }, [realData]);

  const cells = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 53 }, (_, week) =>
      Array.from({ length: 7 }, (_, day) => {
        const d = yearGridToDate(week, day, year);
        return { date: toDateString(d), disabled: !isPaintableDate(d, year, now) };
      })
    );
  }, [year]);

  const totalContributions = useMemo(() => {
    let sum = 0;
    for (const [date, count] of realByDate) {
      if (date.startsWith(`${year}-`)) sum += count;
    }
    return sum;
  }, [realByDate, year]);

  const totalQueued = useMemo(() => Object.values(queue).reduce((sum, c) => sum + c, 0), [queue]);

  const applyAt = useCallback(
    (date: string) => {
      if (dragRef.current === 'remove') clearCell(date);
      else if (dragRef.current === 'add') setCell(date, intensity);
    },
    [clearCell, setCell, intensity]
  );

  useEffect(() => {
    const stop = () => {
      dragRef.current = null;
    };
    window.addEventListener('pointerup', stop);
    window.addEventListener('pointercancel', stop);
    window.addEventListener('blur', stop);
    return () => {
      window.removeEventListener('pointerup', stop);
      window.removeEventListener('pointercancel', stop);
      window.removeEventListener('blur', stop);
    };
  }, []);

  const cellFromTarget = (target: EventTarget | null): HTMLElement | null =>
    target instanceof Element ? target.closest<HTMLElement>('[data-date]') : null;

  const showTooltip = (el: HTMLElement) => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const cell = el.getBoundingClientRect();
    const box = wrapper.getBoundingClientRect();
    setHover({
      date: el.dataset.date!,
      left: cell.left - box.left + cell.width / 2,
      top: cell.top - box.top,
    });
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    const el = cellFromTarget(e.target);
    if (!el) return;
    const date = el.dataset.date!;

    if (e.button === 2 || activeTool === 'erase') {
      dragRef.current = 'remove';
    } else if (e.button === 0) {
      // Painting over a cell that already holds this intensity removes it
      dragRef.current = queue[date] === intensity ? 'remove' : 'add';
    } else {
      return;
    }
    applyAt(date);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    // Touch pointers stay captured to the first cell, so resolve the cell under the finger
    const el = cellFromTarget(document.elementFromPoint(e.clientX, e.clientY));
    if (!el) {
      setHover(null);
      return;
    }
    if (el.dataset.date !== hover?.date) showTooltip(el);
    if (dragRef.current) applyAt(el.dataset.date!);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const el = cellFromTarget(e.target);
    if (!el) return;
    e.preventDefault();
    const date = el.dataset.date!;
    if (activeTool === 'erase' || queue[date] === intensity) clearCell(date);
    else setCell(date, intensity);
  };

  const hoverReal = hover ? realByDate.get(hover.date) ?? 0 : 0;
  const hoverQueued = hover ? queue[hover.date] ?? 0 : 0;

  return (
    <div className="w-full select-none">
      <div className="w-full bg-panel border border-line rounded-xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4 text-xs text-dim">
          <div className="flex items-center gap-3">
            <span>
              {totalContributions.toLocaleString()} contributions in {year}
            </span>
            {totalQueued > 0 && (
              <span className="px-2 py-0.5 rounded bg-panel-2 border border-line-strong text-fg">
                +{totalQueued.toLocaleString()} queued
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <span>less</span>
            {LEVEL_COLORS.map((color) => (
              <span key={color} className="w-[11px] h-[11px] rounded-[3px]" style={{ backgroundColor: color }} />
            ))}
            <span>more</span>
          </div>
        </div>

        <div className="overflow-x-auto pt-10 pb-2">
          <div ref={wrapperRef} className="relative w-max mx-auto">
            <div className="flex items-start">
              <GraphDayLabels />

              <div
                className="heat-grid flex gap-[3px]"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerLeave={() => setHover(null)}
                onContextMenu={(e) => {
                  if (cellFromTarget(e.target)) e.preventDefault();
                }}
                onKeyDown={handleKeyDown}
              >
                {cells.map((column, week) => (
                  <div key={week} className="flex flex-col gap-[3px]">
                    {column.map(({ date, disabled }) => {
                      const real = realByDate.get(date) ?? 0;
                      const queued = queue[date] ?? 0;
                      return (
                        <GraphCell
                          key={date}
                          date={date}
                          label={`${formatDate(date)}: ${real} existing, ${queued} queued`}
                          realCount={real}
                          queuedCount={queued}
                          disabled={disabled}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            <GraphMonthLabels year={year} />

            {hover && (
              <div
                role="tooltip"
                className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full -mt-2 whitespace-nowrap rounded-md border border-line-strong bg-canvas px-2.5 py-1 text-xs text-fg shadow-xl"
                style={{ left: hover.left, top: hover.top }}
              >
                <span className="text-mint">
                  {hoverQueued > 0 ? `${hoverQueued} queued` : `${hoverReal} contribution${hoverReal === 1 ? '' : 's'}`}
                </span>
                {hoverQueued > 0 && hoverReal > 0 && <span className="text-dim"> + {hoverReal} existing</span>}
                <span className="text-dim"> on {formatDate(hover.date)}</span>
              </div>
            )}
          </div>
        </div>

        <p className="mt-3 text-center text-[11px] text-dim">dates use UTC</p>
      </div>
    </div>
  );
}
