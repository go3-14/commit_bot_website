'use client';

import React, { useState } from 'react';
import { 
  Paintbrush, 
  Eraser, 
  Type, 
  Image as ImageIcon, 
  Sparkles, 
  Shuffle, 
  SlidersHorizontal 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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

  const handleToolClick = (toolId: 'paint' | 'erase' | 'pattern' | 'image' | 'fill' | 'random') => {
    if (toolId === 'paint' || toolId === 'erase') {
      setActiveTool(toolId);
      setActiveSheet(null);
    } else {
      setActiveSheet(toolId);
    }
  };

  return (
    <>
      <div className="w-full flex flex-wrap items-center justify-between gap-3 p-2.5 rounded-xl border border-[#30363d] bg-[#161b22] shadow-md">
        {/* Left: Mode Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Paint Button */}
          <Button
            type="button"
            size="sm"
            variant={activeTool === 'paint' ? 'default' : 'outline'}
            onClick={() => handleToolClick('paint')}
            className={`text-xs h-8 px-3 gap-1.5 transition-all ${
              activeTool === 'paint'
                ? 'bg-[#238636] hover:bg-[#2ea043] text-white font-semibold shadow-sm'
                : 'border-[#30363d] bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9]'
            }`}
          >
            <Paintbrush className="w-3.5 h-3.5" />
            <span>Paint</span>
          </Button>

          {/* Inline Intensity Pills (when paint is active) */}
          {activeTool === 'paint' && (
            <div className="flex items-center gap-1 bg-[#0d1117] border border-[#30363d] rounded-lg px-2 py-0.5 animate-in fade-in">
              <span className="text-[10px] text-[#8b949e] font-mono mr-1">Intensity:</span>
              {[1, 3, 5, 10].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setIntensity(n)}
                  className={`w-6 h-5 rounded text-[11px] font-mono font-medium transition-all ${
                    intensity === n
                      ? 'bg-[#238636] text-white font-bold shadow-xs'
                      : 'text-[#8b949e] hover:text-white hover:bg-[#21262d]'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          )}

          {/* Erase Button */}
          <Button
            type="button"
            size="sm"
            variant={activeTool === 'erase' ? 'default' : 'outline'}
            onClick={() => handleToolClick('erase')}
            className={`text-xs h-8 px-3 gap-1.5 transition-all ${
              activeTool === 'erase'
                ? 'bg-[#da3633] hover:bg-[#b62324] text-white font-semibold shadow-sm'
                : 'border-[#30363d] bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9]'
            }`}
          >
            <Eraser className="w-3.5 h-3.5" />
            <span>Erase</span>
          </Button>

          <div className="h-4 w-px bg-[#30363d] mx-1 hidden sm:block" />

          {/* Generators */}
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => handleToolClick('pattern')}
            className="border-[#30363d] bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] text-xs h-8 px-3 gap-1.5"
          >
            <Type className="w-3.5 h-3.5 text-blue-400" />
            <span>Text & Shapes</span>
          </Button>

          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => handleToolClick('image')}
            className="border-[#30363d] bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] text-xs h-8 px-3 gap-1.5"
          >
            <ImageIcon className="w-3.5 h-3.5 text-purple-400" />
            <span>Image Converter</span>
          </Button>

          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => handleToolClick('fill')}
            className="border-[#30363d] bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] text-xs h-8 px-3 gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Fill Year</span>
          </Button>

          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => handleToolClick('random')}
            className="border-[#30363d] bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] text-xs h-8 px-3 gap-1.5"
          >
            <Shuffle className="w-3.5 h-3.5 text-amber-400" />
            <span>Random Scatter</span>
          </Button>
        </div>

        {/* Right Note */}
        <div className="text-[11px] text-[#8b949e] flex items-center gap-1.5 hidden md:flex">
          <SlidersHorizontal className="w-3 h-3 text-[#388bfd]" />
          <span>Active mode: <strong className="text-white capitalize">{activeTool}</strong></span>
        </div>
      </div>

      {/* Slide-In Side Sheets for Generators */}
      <Sheet open={activeSheet !== null} onOpenChange={(open) => !open && setActiveSheet(null)}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-lg bg-[#161b22] border-l border-[#30363d] text-[#c9d1d9] p-6 shadow-2xl overflow-y-auto"
        >
          {activeSheet === 'pattern' && (
            <>
              <SheetHeader className="mb-4">
                <SheetTitle className="text-white text-base flex items-center gap-2">
                  <Type className="w-4 h-4 text-blue-400" />
                  <span>Text Typography & Shape Presets</span>
                </SheetTitle>
                <SheetDescription className="text-xs text-[#8b949e]">
                  Generate pixel-perfect letters with 5×7 font or stamp classic shapes onto your calendar.
                </SheetDescription>
              </SheetHeader>
              <PatternTool />
            </>
          )}

          {activeSheet === 'image' && (
            <>
              <SheetHeader className="mb-4">
                <SheetTitle className="text-white text-base flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-purple-400" />
                  <span>Image-to-Graph Converter</span>
                </SheetTitle>
                <SheetDescription className="text-xs text-[#8b949e]">
                  Upload any image. Client-side canvas will scale it to 7 rows and map pixel dark levels to commit counts.
                </SheetDescription>
              </SheetHeader>
              <ImageTool />
            </>
          )}

          {activeSheet === 'fill' && (
            <>
              <SheetHeader className="mb-4">
                <SheetTitle className="text-white text-base flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>Full Year Fill Generator</span>
                </SheetTitle>
                <SheetDescription className="text-xs text-[#8b949e]">
                  Quickly populate an entire calendar year with randomized organic commit activity.
                </SheetDescription>
              </SheetHeader>
              <FillTool />
            </>
          )}

          {activeSheet === 'random' && (
            <>
              <SheetHeader className="mb-4">
                <SheetTitle className="text-white text-base flex items-center gap-2">
                  <Shuffle className="w-4 h-4 text-amber-400" />
                  <span>Random Commit Scatter</span>
                </SheetTitle>
                <SheetDescription className="text-xs text-[#8b949e]">
                  Scatter N commits organically across random dates within the year.
                </SheetDescription>
              </SheetHeader>
              <RandomTool />
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
