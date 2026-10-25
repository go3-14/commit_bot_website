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
  const { activeTool, setActiveTool, intensity, setIntensity } = useGraphStore();
  const [activeSheet, setActiveSheet] = useState<'pattern' | 'image' | 'fill' | 'random' | null>(null);

  const isPaintActive = (n: number) => activeTool === 'paint' && intensity === n;
  const isEraseActive = activeTool === 'erase';

  const selectPaint = (n: number) => {
    setActiveTool('paint');
    setIntensity(n);
    setActiveSheet(null);
  };

  const selectErase = () => {
    setActiveTool('erase');
    setActiveSheet(null);
  };

  return (
    <div className="w-full flex flex-col gap-2 font-mono select-none">
      <div className="flex items-center gap-1.5 text-xs text-[#607b62] px-1">
        <span>▼ tools</span>
      </div>

      {/* Segmented Filter Pills matching Monkeytype */}
      <div className="w-full flex flex-wrap items-center gap-1.5 bg-[#182319] border border-[#263626] p-2 rounded-xl">
        <button
          type="button"
          onClick={() => selectPaint(1)}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
            isPaintActive(1)
              ? 'bg-[#99d19c] text-[#111810] font-bold shadow-sm'
              : 'bg-[#111810] text-[#607b62] border border-[#263626] hover:text-[#dbead9] hover:border-[#374d37]'
          }`}
        >
          paint (1)
        </button>

        <button
          type="button"
          onClick={() => selectPaint(3)}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
            isPaintActive(3)
              ? 'bg-[#99d19c] text-[#111810] font-bold shadow-sm'
              : 'bg-[#111810] text-[#607b62] border border-[#263626] hover:text-[#dbead9] hover:border-[#374d37]'
          }`}
        >
          paint (3)
        </button>

        <button
          type="button"
          onClick={() => selectPaint(5)}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
            isPaintActive(5)
              ? 'bg-[#99d19c] text-[#111810] font-bold shadow-sm'
              : 'bg-[#111810] text-[#607b62] border border-[#263626] hover:text-[#dbead9] hover:border-[#374d37]'
          }`}
        >
          paint (5)
        </button>

        <button
          type="button"
          onClick={() => selectPaint(10)}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
            isPaintActive(10)
              ? 'bg-[#99d19c] text-[#111810] font-bold shadow-sm'
              : 'bg-[#111810] text-[#607b62] border border-[#263626] hover:text-[#dbead9] hover:border-[#374d37]'
          }`}
        >
          paint (10)
        </button>

        <button
          type="button"
          onClick={selectErase}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
            isEraseActive
              ? 'bg-[#da3633] text-white font-bold shadow-sm'
              : 'bg-[#111810] text-[#607b62] border border-[#263626] hover:text-[#dbead9] hover:border-[#374d37]'
          }`}
        >
          erase
        </button>

        <div className="h-4 w-px bg-[#263626] mx-1 hidden sm:block" />

        <button
          type="button"
          onClick={() => setActiveSheet('pattern')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
            activeSheet === 'pattern'
              ? 'bg-[#99d19c] text-[#111810] font-bold'
              : 'bg-[#111810] text-[#607b62] border border-[#263626] hover:text-[#dbead9] hover:border-[#374d37]'
          }`}
        >
          text & shapes
        </button>

        <button
          type="button"
          onClick={() => setActiveSheet('image')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
            activeSheet === 'image'
              ? 'bg-[#99d19c] text-[#111810] font-bold'
              : 'bg-[#111810] text-[#607b62] border border-[#263626] hover:text-[#dbead9] hover:border-[#374d37]'
          }`}
        >
          image
        </button>

        <button
          type="button"
          onClick={() => setActiveSheet('fill')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
            activeSheet === 'fill'
              ? 'bg-[#99d19c] text-[#111810] font-bold'
              : 'bg-[#111810] text-[#607b62] border border-[#263626] hover:text-[#dbead9] hover:border-[#374d37]'
          }`}
        >
          fill year
        </button>

        <button
          type="button"
          onClick={() => setActiveSheet('random')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
            activeSheet === 'random'
              ? 'bg-[#99d19c] text-[#111810] font-bold'
              : 'bg-[#111810] text-[#607b62] border border-[#263626] hover:text-[#dbead9] hover:border-[#374d37]'
          }`}
        >
          random
        </button>
      </div>

      {/* Slide-In Side Sheets for Generators */}
      <Sheet open={activeSheet !== null} onOpenChange={(open) => !open && setActiveSheet(null)}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-md bg-[#182319] border-l border-[#263626] text-[#dbead9] p-6 shadow-2xl overflow-y-auto font-mono"
        >
          {activeSheet === 'pattern' && (
            <>
              <SheetHeader className="mb-4">
                <SheetTitle className="text-[#8cd48f] text-sm font-mono">
                  text & shapes
                </SheetTitle>
                <SheetDescription className="text-xs text-[#607b62] font-mono">
                  convert text with 5x7 font or stamps to commits
                </SheetDescription>
              </SheetHeader>
              <PatternTool />
            </>
          )}

          {activeSheet === 'image' && (
            <>
              <SheetHeader className="mb-4">
                <SheetTitle className="text-[#8cd48f] text-sm font-mono">
                  image converter
                </SheetTitle>
                <SheetDescription className="text-xs text-[#607b62] font-mono">
                  convert pixel data to 7 row commit grid
                </SheetDescription>
              </SheetHeader>
              <ImageTool />
            </>
          )}

          {activeSheet === 'fill' && (
            <>
              <SheetHeader className="mb-4">
                <SheetTitle className="text-[#8cd48f] text-sm font-mono">
                  fill year
                </SheetTitle>
                <SheetDescription className="text-xs text-[#607b62] font-mono">
                  fill full year with randomized daily activity
                </SheetDescription>
              </SheetHeader>
              <FillTool />
            </>
          )}

          {activeSheet === 'random' && (
            <>
              <SheetHeader className="mb-4">
                <SheetTitle className="text-[#8cd48f] text-sm font-mono">
                  random scatter
                </SheetTitle>
                <SheetDescription className="text-xs text-[#607b62] font-mono">
                  scatter commits randomly across dates
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
