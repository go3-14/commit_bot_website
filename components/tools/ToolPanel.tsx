'use client';

import React from 'react';
import { 
  Paintbrush, 
  Eraser, 
  Type, 
  Image as ImageIcon, 
  Sparkles, 
  Shuffle, 
  Layers 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useGraphStore } from '@/store/graph-store';
import { ToolType } from '@/types';
import PatternTool from './PatternTool';
import ImageTool from './ImageTool';

interface ToolPanelProps {
  children?: React.ReactNode;
}

export default function ToolPanel({ children }: ToolPanelProps) {
  const { activeTool, setActiveTool, intensity, setIntensity } = useGraphStore();

  const tools: { id: ToolType; label: string; icon: React.ReactNode; desc: string }[] = [
    { id: 'paint', label: 'Paint', icon: <Paintbrush className="w-4 h-4" />, desc: 'Click & drag cells' },
    { id: 'erase', label: 'Erase', icon: <Eraser className="w-4 h-4" />, desc: 'Remove queued cells' },
    { id: 'pattern', label: 'Pattern', icon: <Type className="w-4 h-4" />, desc: 'Text & shapes' },
    { id: 'image', label: 'Image', icon: <ImageIcon className="w-4 h-4" />, desc: 'Convert image to pixels' },
    { id: 'fill', label: 'Fill Year', icon: <Sparkles className="w-4 h-4" />, desc: 'Fill entire year' },
    { id: 'random', label: 'Random', icon: <Shuffle className="w-4 h-4" />, desc: 'Scatter random commits' },
  ];

  return (
    <div className="w-full flex flex-col gap-4 p-4 rounded-xl border border-[#30363d] bg-[#161b22] shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#30363d] pb-3">
        {/* Tool selector buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          {tools.map((t) => {
            const isActive = activeTool === t.id;
            return (
              <Button
                key={t.id}
                type="button"
                variant={isActive ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTool(t.id)}
                className={`text-xs h-8 gap-1.5 transition-all ${
                  isActive
                    ? 'bg-[#238636] hover:bg-[#2ea043] text-white font-semibold shadow-sm shadow-[#238636]/30'
                    : 'border-[#30363d] bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9]'
                }`}
              >
                {t.icon}
                <span>{t.label}</span>
              </Button>
            );
          })}
        </div>

        {/* Intensity Selector */}
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#8b949e]" />
          <span className="text-xs font-medium text-[#8b949e]">Intensity:</span>
          <Select
            value={intensity.toString()}
            onValueChange={(val) => val && setIntensity(parseInt(val, 10))}
          >
            <SelectTrigger className="w-[140px] h-8 text-xs bg-[#0d1117] border-[#30363d] text-white">
              <SelectValue placeholder="Intensity" />
            </SelectTrigger>
            <SelectContent className="bg-[#161b22] border-[#30363d] text-white text-xs">
              <SelectItem value="1">Low (1 commit)</SelectItem>
              <SelectItem value="3">Medium (3 commits)</SelectItem>
              <SelectItem value="5">High (5 commits)</SelectItem>
              <SelectItem value="10">Max (10 commits)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Active tool specific configuration */}
      {activeTool === 'pattern' && <PatternTool />}
      {activeTool === 'image' && <ImageTool />}

      {children && (
        <div className="pt-1">
          {children}
        </div>
      )}
    </div>
  );
}
