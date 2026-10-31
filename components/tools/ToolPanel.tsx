'use client';

import React, { useState } from 'react';
import { 
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { useGraphStore } from '@/store/graph-store';
import PatternTool from './PatternTool';
import ImageTool from './ImageTool';
import FillTool from './FillTool';
import RandomTool from './RandomTool';

export default function ToolPanel() {
  const { activeTool, setActiveTool, intensity, setIntensity, paintByDrag, setPaintByDrag } = useGraphStore();
  const [activeSheet, setActiveSheet] = useState<'pattern' | 'image' | 'fill' | 'random' | null>(null);

  const selectPaint = (n: number) => {
    setActiveTool('paint');
    setIntensity(n);
    setActiveSheet(null);
  };

  const generators: Array<{ id: 'pattern' | 'image' | 'fill' | 'random'; label: string }> = [
    { id: 'pattern', label: 'text & shapes' },
    { id: 'image', label: 'image' },
    { id: 'fill', label: 'fill year' },
    { id: 'random', label: 'random' },
  ];

  const base = 'px-3 py-1.5 pointer-coarse:py-2.5 rounded-md text-xs transition-colors';
  const idle = 'text-dim hover:text-fg';
  const on = 'bg-mint-strong text-canvas font-bold';

  return (
    <div className="w-full flex flex-wrap items-center gap-3 bg-panel border border-line p-2 rounded-xl select-none">
      <div className="flex w-full sm:w-auto items-center gap-1 rounded-lg bg-canvas p-1" role="group" aria-label="paint intensity">
        {[1, 3, 5, 10].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => selectPaint(n)}
            aria-pressed={activeTool === 'paint' && intensity === n}
            className={`${base} max-sm:flex-1 ${activeTool === 'paint' && intensity === n ? on : idle}`}
          >
            {n}
          </button>
        ))}
        <button
          type="button"
          onClick={() => {
            setActiveTool('erase');
            setActiveSheet(null);
          }}
          aria-pressed={activeTool === 'erase'}
          className={`${base} max-sm:flex-1 ${activeTool === 'erase' ? 'bg-danger text-white font-bold' : idle}`}
        >
          erase
        </button>
      </div>

      {/* Touch screens only: choose whether a finger drag paints or scrolls the graph */}
      <button
        type="button"
        onClick={() => setPaintByDrag(!paintByDrag)}
        aria-pressed={paintByDrag}
        className={`hidden pointer-coarse:block ${base} border ${
          paintByDrag ? 'border-mint-strong text-mint' : 'border-line text-dim'
        }`}
      >
        {paintByDrag ? 'drag paints' : 'drag scrolls'}
      </button>

      <div className="grid grid-cols-2 gap-1 w-full sm:flex sm:w-auto sm:flex-wrap sm:items-center">
        {generators.map((g) => (
          <button
            key={g.id}
            type="button"
            onClick={() => setActiveSheet(g.id)}
            className={`${base} max-sm:border max-sm:border-line ${activeSheet === g.id ? on : idle}`}
          >
            {g.label}
          </button>
        ))}
      </div>

      {/* Generators open in a side sheet */}
      <Sheet open={activeSheet !== null} onOpenChange={(open) => !open && setActiveSheet(null)}>
        <SheetContent
          side="right"
          className="max-sm:w-full! sm:max-w-md bg-panel border-l border-line text-fg p-4 sm:p-6 shadow-2xl overflow-y-auto font-mono"
        >
          {activeSheet === 'pattern' && (
            <>
              <SheetHeader className="mb-4">
                <SheetTitle className="text-mint text-sm font-mono">
                  text & shapes
                </SheetTitle>
                <SheetDescription className="text-xs text-dim font-mono">
                  Turn text or a shape into painted days.
                </SheetDescription>
              </SheetHeader>
              <PatternTool />
            </>
          )}

          {activeSheet === 'image' && (
            <>
              <SheetHeader className="mb-4">
                <SheetTitle className="text-mint text-sm font-mono">
                  image
                </SheetTitle>
                <SheetDescription className="text-xs text-dim font-mono">
                  Turn an image into painted days.
                </SheetDescription>
              </SheetHeader>
              <ImageTool />
            </>
          )}

          {activeSheet === 'fill' && (
            <>
              <SheetHeader className="mb-4">
                <SheetTitle className="text-mint text-sm font-mono">
                  fill year
                </SheetTitle>
                <SheetDescription className="text-xs text-dim font-mono">
                  Fill the year with random daily commits.
                </SheetDescription>
              </SheetHeader>
              <FillTool />
            </>
          )}

          {activeSheet === 'random' && (
            <>
              <SheetHeader className="mb-4">
                <SheetTitle className="text-mint text-sm font-mono">
                  random
                </SheetTitle>
                <SheetDescription className="text-xs text-dim font-mono">
                  Spread a number of commits over random days.
                </SheetDescription>
              </SheetHeader>
              <RandomTool />
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
