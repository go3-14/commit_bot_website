'use client';

import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, Image as ImageIcon, Sliders, RefreshCw, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { useGraphStore } from '@/store/graph-store';
import { processImageInBrowser, ProcessedImage } from '@/lib/image-processor-web';

export default function ImageTool() {
  const { applyBulkCells } = useGraphStore();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [processed, setProcessed] = useState<ProcessedImage | null>(null);
  const [mode, setMode] = useState<'grayscale' | 'binary'>('grayscale');
  const [threshold, setThreshold] = useState<number>(128);
  const [invert, setInvert] = useState<boolean>(false);
  const [offset, setOffset] = useState<number>(2);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Process image whenever settings or file change
  useEffect(() => {
    if (!selectedFile) return;

    let isMounted = true;
    processImageInBrowser({
      file: selectedFile,
      maxWidth: 50,
      mode,
      invert,
      threshold,
      offset,
    })
      .then((res) => {
        if (isMounted) setProcessed(res);
      })
      .catch((err) => {
        console.error('Image processing error:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedFile, mode, threshold, invert, offset]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setImagePreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setImagePreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleApply = () => {
    if (!processed) return;

    const bulkEntries: { week: number; day: number; count: number }[] = [];

    // processed.commitGrid is [row (day 0-6)][col (week 0-width)]
    for (let day = 0; day < 7; day++) {
      for (let col = 0; col < processed.width; col++) {
        const count = processed.commitGrid[day][col];
        const targetWeek = offset + col;
        if (targetWeek >= 0 && targetWeek < 53) {
          bulkEntries.push({
            week: targetWeek,
            day,
            count,
          });
        }
      }
    }

    applyBulkCells(bulkEntries);
    setFeedback(`Applied ${processed.activeCells} active cells to graph!`);
    setTimeout(() => setFeedback(null), 3000);
  };

  return (
    <div className="flex flex-col gap-4 p-4 rounded-lg bg-[#0d1117] border border-[#30363d]/80">
      <div className="flex items-center justify-between border-b border-[#30363d]/60 pb-2">
        <span className="text-xs font-semibold text-white flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-[#39d353]" />
          <span>Image-to-Graph Canvas Converter</span>
        </span>

        {feedback && (
          <span className="text-xs text-[#39d353] font-medium flex items-center gap-1 animate-pulse">
            <Check className="w-3.5 h-3.5" />
            <span>{feedback}</span>
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Upload Drop Zone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-[#30363d] hover:border-[#388bfd] rounded-xl p-6 flex flex-col items-center justify-center gap-3 cursor-pointer bg-[#161b22]/50 transition-colors"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            className="hidden"
          />

          {imagePreviewUrl ? (
            <div className="flex flex-col items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imagePreviewUrl}
                alt="Uploaded preview"
                className="max-h-24 max-w-[160px] object-contain rounded-md border border-[#30363d]"
              />
              <span className="text-xs text-[#8b949e]">Click or drag to replace image</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="w-10 h-10 rounded-full bg-[#21262d] flex items-center justify-center text-[#8b949e]">
                <UploadCloud className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium text-white">
                Drag & drop any image here, or click to browse
              </span>
              <span className="text-[11px] text-[#8b949e]">
                PNG, JPG, or SVG (automatically scaled to 7 rows)
              </span>
            </div>
          )}
        </div>

        {/* Processing Controls & Pixel Preview */}
        <div className="flex flex-col gap-3 justify-between">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#8b949e] font-medium flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5" />
                <span>Conversion Mode:</span>
              </span>
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  size="sm"
                  variant={mode === 'grayscale' ? 'default' : 'outline'}
                  onClick={() => setMode('grayscale')}
                  className={`text-xs h-7 px-2.5 ${
                    mode === 'grayscale' ? 'bg-[#238636] text-white' : 'border-[#30363d] bg-[#161b22] text-[#c9d1d9]'
                  }`}
                >
                  Grayscale (4 levels)
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={mode === 'binary' ? 'default' : 'outline'}
                  onClick={() => setMode('binary')}
                  className={`text-xs h-7 px-2.5 ${
                    mode === 'binary' ? 'bg-[#238636] text-white' : 'border-[#30363d] bg-[#161b22] text-[#c9d1d9]'
                  }`}
                >
                  Binary (B&W)
                </Button>
              </div>
            </div>

            {mode === 'binary' && (
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs text-[#8b949e]">
                  <span>Threshold</span>
                  <span className="font-mono text-white">{threshold}</span>
                </div>
                <Slider
                  min={0}
                  max={255}
                  step={1}
                  value={[threshold]}
                  onValueChange={(val) =>
                    setThreshold(Array.isArray(val) ? val[0] : typeof val === 'number' ? val : 128)
                  }
                  className="py-1"
                />
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-[#c9d1d9]">
                <Checkbox
                  checked={invert}
                  onCheckedChange={(checked) => setInvert(Boolean(checked))}
                />
                <span>Invert colors (negative)</span>
              </label>

              <div className="flex items-center gap-2">
                <span className="text-xs text-[#8b949e]">Start Week:</span>
                <Input
                  type="number"
                  min={0}
                  max={50}
                  value={offset}
                  onChange={(e) => setOffset(Math.max(0, parseInt(e.target.value || '0', 10)))}
                  className="w-16 h-7 text-xs bg-[#161b22] border-[#30363d] text-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* Processed Pixel Matrix Preview */}
          {processed && (
            <div className="mt-2 p-2 rounded-md bg-[#161b22] border border-[#30363d] flex flex-col gap-1">
              <div className="flex items-center justify-between text-[10px] text-[#8b949e] font-mono">
                <span>Canvas preview ({processed.width} cols × 7 rows)</span>
                <span>{processed.totalCommits} commits queued</span>
              </div>
              <div className="font-mono text-[9px] leading-[9px] tracking-widest text-[#39d353] overflow-x-auto whitespace-pre bg-[#0d1117] p-1.5 rounded">
                {processed.preview.join('\n')}
              </div>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button
              type="button"
              size="sm"
              disabled={!processed}
              onClick={handleApply}
              className="bg-[#238636] hover:bg-[#2ea043] text-white text-xs h-8 px-4 font-semibold shadow-md shadow-[#238636]/20 disabled:opacity-50"
            >
              Apply Image to Graph
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
