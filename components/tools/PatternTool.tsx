'use client';

import React, { useState } from 'react';
import { Type, Heart, Smile, Check, Star, Skull, Waves, Gem, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useGraphStore } from '@/store/graph-store';
import { textToPattern, shapeToPattern, getTextWidth, patternFits } from '@/lib/core/pattern-engine';
import { SHAPES } from '@/lib/core/constants';

export default function PatternTool() {
  const { year, intensity, applyBulkCells } = useGraphStore();

  const [mode, setMode] = useState<'text' | 'shape'>('text');
  const [text, setText] = useState<string>('HI');
  const [selectedShape, setSelectedShape] = useState<string>('heart');
  const [startWeek, setStartWeek] = useState<number>(2);
  const [patternIntensity, setPatternIntensity] = useState<number>(intensity);
  const [feedback, setFeedback] = useState<string | null>(null);

  const shapeList = [
    { id: 'heart', label: 'Heart', icon: <Heart className="w-4 h-4 text-rose-500 fill-rose-500/20" /> },
    { id: 'smiley', label: 'Smiley', icon: <Smile className="w-4 h-4 text-amber-400" /> },
    { id: 'star', label: 'Star', icon: <Star className="w-4 h-4 text-yellow-400 fill-yellow-400/20" /> },
    { id: 'check', label: 'Check', icon: <Check className="w-4 h-4 text-emerald-400" /> },
    { id: 'skull', label: 'Skull', icon: <Skull className="w-4 h-4 text-slate-300" /> },
    { id: 'wave', label: 'Wave', icon: <Waves className="w-4 h-4 text-cyan-400" /> },
    { id: 'diamond', label: 'Diamond', icon: <Gem className="w-4 h-4 text-indigo-400" /> },
  ];

  // Calculate width and validation for text
  const textWidth = mode === 'text' ? getTextWidth(text) : (SHAPES[selectedShape]?.[0]?.length || 5);
  const fits = patternFits(textWidth + startWeek, 53);

  const handleApply = () => {
    try {
      let cells;
      if (mode === 'text') {
        if (!text.trim()) return;
        cells = textToPattern(text, year, startWeek);
      } else {
        cells = shapeToPattern(selectedShape, year, startWeek);
      }

      applyBulkCells(
        cells.map((c) => ({
          week: c.week,
          day: c.day,
          count: patternIntensity,
        }))
      );

      setFeedback(`Applied ${cells.length} cells to the queue!`);
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: unknown) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-3 rounded-lg bg-[#0d1117] border border-[#30363d]/80">
      <div className="flex items-center justify-between border-b border-[#30363d]/60 pb-2">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant={mode === 'text' ? 'default' : 'outline'}
            onClick={() => setMode('text')}
            className={`text-xs h-7 px-3 gap-1.5 ${
              mode === 'text' ? 'bg-[#238636] text-white' : 'border-[#30363d] bg-[#161b22] text-[#c9d1d9]'
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            <span>Text Typography</span>
          </Button>

          <Button
            type="button"
            size="sm"
            variant={mode === 'shape' ? 'default' : 'outline'}
            onClick={() => setMode('shape')}
            className={`text-xs h-7 px-3 gap-1.5 ${
              mode === 'shape' ? 'bg-[#238636] text-white' : 'border-[#30363d] bg-[#161b22] text-[#c9d1d9]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Preset Shapes</span>
          </Button>
        </div>

        {feedback && (
          <span className="text-xs text-[#39d353] font-medium animate-pulse">
            ✓ {feedback}
          </span>
        )}
      </div>

      {mode === 'text' ? (
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[180px]">
            <label className="text-[11px] text-[#8b949e] font-medium block mb-1">
              Text to Draw (A-Z, 0-9, ! ? - . +)
            </label>
            <Input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value.toUpperCase())}
              placeholder="e.g. HELLO"
              className="h-8 text-xs bg-[#161b22] border-[#30363d] text-white font-mono tracking-wider"
              maxLength={15}
            />
          </div>

          <div className="w-[100px]">
            <label className="text-[11px] text-[#8b949e] font-medium block mb-1">
              Start Week (0–52)
            </label>
            <Input
              type="number"
              min={0}
              max={50}
              value={startWeek}
              onChange={(e) => setStartWeek(Math.max(0, parseInt(e.target.value || '0', 10)))}
              className="h-8 text-xs bg-[#161b22] border-[#30363d] text-white font-mono"
            />
          </div>

          <div className="w-[130px]">
            <label className="text-[11px] text-[#8b949e] font-medium block mb-1">
              Commits / Cell
            </label>
            <Select
              value={patternIntensity.toString()}
              onValueChange={(val) => val && setPatternIntensity(parseInt(val, 10))}
            >
              <SelectTrigger className="h-8 text-xs bg-[#161b22] border-[#30363d] text-white">
                <SelectValue placeholder="Intensity" />
              </SelectTrigger>
              <SelectContent className="bg-[#161b22] border-[#30363d] text-white text-xs">
                <SelectItem value="1">1 (Low)</SelectItem>
                <SelectItem value="3">3 (Medium)</SelectItem>
                <SelectItem value="5">5 (High)</SelectItem>
                <SelectItem value="10">10 (Max)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button
              type="button"
              size="sm"
              onClick={handleApply}
              disabled={!text.trim() || !fits}
              className="bg-[#238636] hover:bg-[#2ea043] text-white text-xs h-8 px-4 font-semibold shadow-md shadow-[#238636]/20 disabled:opacity-50"
            >
              Apply Text to Graph
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <label className="text-[11px] text-[#8b949e] font-medium">
            Choose a Shape
          </label>
          <div className="flex flex-wrap items-center gap-2">
            {shapeList.map((shape) => {
              const isSelected = selectedShape === shape.id;
              return (
                <button
                  key={shape.id}
                  type="button"
                  onClick={() => setSelectedShape(shape.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                    isSelected
                      ? 'border-[#238636] bg-[#0e4429]/60 text-white ring-1 ring-[#39d353]'
                      : 'border-[#30363d] bg-[#161b22] text-[#c9d1d9] hover:bg-[#21262d]'
                  }`}
                >
                  {shape.icon}
                  <span>{shape.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-4 mt-2">
            <div className="w-[100px]">
              <label className="text-[11px] text-[#8b949e] font-medium block mb-1">
                Start Week
              </label>
              <Input
                type="number"
                min={0}
                max={50}
                value={startWeek}
                onChange={(e) => setStartWeek(Math.max(0, parseInt(e.target.value || '0', 10)))}
                className="h-8 text-xs bg-[#161b22] border-[#30363d] text-white font-mono"
              />
            </div>

            <div className="w-[130px]">
              <label className="text-[11px] text-[#8b949e] font-medium block mb-1">
                Commits / Cell
              </label>
              <Select
                value={patternIntensity.toString()}
                onValueChange={(val) => val && setPatternIntensity(parseInt(val, 10))}
              >
                <SelectTrigger className="h-8 text-xs bg-[#161b22] border-[#30363d] text-white">
                  <SelectValue placeholder="Intensity" />
                </SelectTrigger>
                <SelectContent className="bg-[#161b22] border-[#30363d] text-white text-xs">
                  <SelectItem value="1">1 (Low)</SelectItem>
                  <SelectItem value="3">3 (Medium)</SelectItem>
                  <SelectItem value="5">5 (High)</SelectItem>
                  <SelectItem value="10">10 (Max)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                type="button"
                size="sm"
                onClick={handleApply}
                className="bg-[#238636] hover:bg-[#2ea043] text-white text-xs h-8 px-4 font-semibold shadow-md shadow-[#238636]/20"
              >
                Apply Shape to Graph
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Width warning if text exceeds graph columns */}
      {!fits && (
        <span className="text-[11px] text-[#f85149] font-medium">
          ⚠️ Pattern width ({textWidth} weeks) from week {startWeek} exceeds the 53-week graph width. Please shorten text or reduce start week.
        </span>
      )}
    </div>
  );
}
