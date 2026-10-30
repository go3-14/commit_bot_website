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

      setFeedback(`${cells.length} days queued.`);
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: unknown) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 rounded-xl bg-canvas border border-line font-mono">
      <div className="flex items-center justify-between border-b border-line pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMode('text')}
            className={`text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              mode === 'text'
                ? 'bg-mint-strong text-canvas font-bold'
                : 'bg-panel border border-line text-dim hover:text-fg'
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            <span>text</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('shape')}
            className={`text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              mode === 'shape'
                ? 'bg-mint-strong text-canvas font-bold'
                : 'bg-panel border border-line text-dim hover:text-fg'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>shapes</span>
          </button>
        </div>

        {feedback && (
          <span className="text-xs text-mint font-mono">
            ✓ {feedback}
          </span>
        )}
      </div>

      {mode === 'text' ? (
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[180px]">
            <label className="text-[11px] text-dim block mb-1">
              text to draw (a-z, 0-9, ! ? - . +)
            </label>
            <Input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value.toUpperCase())}
              placeholder="e.g. HELLO"
              className="h-8 text-xs bg-panel border-line text-fg font-mono tracking-wider focus:border-line-strong"
              maxLength={15}
            />
          </div>

          <div className="w-[100px]">
            <label className="text-[11px] text-dim block mb-1">
              start week (0-52)
            </label>
            <Input
              type="number"
              min={0}
              max={50}
              value={startWeek}
              onChange={(e) => setStartWeek(Math.max(0, parseInt(e.target.value || '0', 10)))}
              className="h-8 text-xs bg-panel border-line text-fg font-mono focus:border-line-strong"
            />
          </div>

          <div className="w-[130px]">
            <label className="text-[11px] text-dim block mb-1">
              commits / cell
            </label>
            <Select
              value={patternIntensity.toString()}
              onValueChange={(val) => val && setPatternIntensity(parseInt(val, 10))}
            >
              <SelectTrigger className="h-8 text-xs bg-panel border-line text-fg font-mono">
                <SelectValue placeholder="intensity" />
              </SelectTrigger>
              <SelectContent className="bg-panel border-line text-fg text-xs font-mono">
                <SelectItem value="1">1 (low)</SelectItem>
                <SelectItem value="3">3 (medium)</SelectItem>
                <SelectItem value="5">5 (high)</SelectItem>
                <SelectItem value="10">10 (max)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button
              type="button"
              size="sm"
              onClick={handleApply}
              disabled={!text.trim() || !fits}
              className="bg-mint-strong hover:bg-mint text-canvas text-xs h-8 px-4 font-bold disabled:opacity-30 disabled:bg-line disabled:text-dim"
            >
              apply text
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <label className="text-[11px] text-dim">
            choose a shape
          </label>
          <div className="flex flex-wrap items-center gap-2">
            {shapeList.map((shape) => {
              const isSelected = selectedShape === shape.id;
              return (
                <button
                  key={shape.id}
                  type="button"
                  onClick={() => setSelectedShape(shape.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono transition-all ${
                    isSelected
                      ? 'border-mint bg-panel text-mint ring-1 ring-mint'
                      : 'border-line bg-panel text-dim hover:text-fg'
                  }`}
                >
                  {shape.icon}
                  <span>{shape.label.toLowerCase()}</span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-4 mt-2">
            <div className="w-[100px]">
              <label className="text-[11px] text-dim block mb-1">
                start week
              </label>
              <Input
                type="number"
                min={0}
                max={50}
                value={startWeek}
                onChange={(e) => setStartWeek(Math.max(0, parseInt(e.target.value || '0', 10)))}
                className="h-8 text-xs bg-panel border-line text-fg font-mono focus:border-line-strong"
              />
            </div>

            <div className="w-[130px]">
              <label className="text-[11px] text-dim block mb-1">
                commits / cell
              </label>
              <Select
                value={patternIntensity.toString()}
                onValueChange={(val) => val && setPatternIntensity(parseInt(val, 10))}
              >
                <SelectTrigger className="h-8 text-xs bg-panel border-line text-fg font-mono">
                  <SelectValue placeholder="intensity" />
                </SelectTrigger>
                <SelectContent className="bg-panel border-line text-fg text-xs font-mono">
                  <SelectItem value="1">1 (low)</SelectItem>
                  <SelectItem value="3">3 (medium)</SelectItem>
                  <SelectItem value="5">5 (high)</SelectItem>
                  <SelectItem value="10">10 (max)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                type="button"
                size="sm"
                onClick={handleApply}
                className="bg-mint-strong hover:bg-mint text-canvas text-xs h-8 px-4 font-bold"
              >
                apply shape
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Width warning if text exceeds graph columns */}
      {!fits && (
        <span className="text-[11px] text-red-400">
          pattern width ({textWidth} weeks) from week {startWeek} exceeds 53 weeks. shorten text or lower start week.
        </span>
      )}
    </div>
  );
}
