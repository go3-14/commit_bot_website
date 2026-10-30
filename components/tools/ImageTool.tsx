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
    <div className="flex flex-col gap-4 p-4 rounded-xl bg-canvas border border-line font-mono">
      <div className="flex items-center justify-between border-b border-line pb-3">
        <span className="text-xs text-fg flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-mint" />
          <span>image converter</span>
        </span>

        {feedback && (
          <span className="text-xs text-mint flex items-center gap-1 animate-pulse">
            <Check className="w-3.5 h-3.5" />
            <span>{feedback}</span>
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Upload Drop Zone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-line hover:border-mint/50 rounded-xl p-6 flex flex-col items-center justify-center gap-3 cursor-pointer bg-panel transition-colors"
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
                className="max-h-24 max-w-[160px] object-contain rounded-md border border-line"
              />
              <span className="text-xs text-dim">click to replace</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="w-8 h-8 rounded-full bg-canvas border border-line flex items-center justify-center text-dim">
                <UploadCloud className="w-4 h-4" />
              </div>
              <span className="text-xs text-fg">
                drop image or click to browse
              </span>
              <span className="text-[11px] text-dim">
                scaled to 7-row canvas height
              </span>
            </div>
          )}
        </div>

        {/* Processing Controls & Pixel Preview */}
        <div className="flex flex-col gap-3 justify-between">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-dim flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5" />
                <span>mode:</span>
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setMode('grayscale')}
                  className={`text-xs px-2.5 py-1 rounded-md transition-all ${
                    mode === 'grayscale'
                      ? 'bg-mint-strong text-canvas font-bold'
                      : 'bg-panel border border-line text-dim hover:text-fg'
                  }`}
                >
                  grayscale
                </button>
                <button
                  type="button"
                  onClick={() => setMode('binary')}
                  className={`text-xs px-2.5 py-1 rounded-md transition-all ${
                    mode === 'binary'
                      ? 'bg-mint-strong text-canvas font-bold'
                      : 'bg-panel border border-line text-dim hover:text-fg'
                  }`}
                >
                  binary
                </button>
              </div>
            </div>

            {mode === 'binary' && (
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs text-dim">
                  <span>threshold</span>
                  <span className="text-mint">{threshold}</span>
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
              <label className="flex items-center gap-2 cursor-pointer text-xs text-dim">
                <Checkbox
                  checked={invert}
                  onCheckedChange={(checked) => setInvert(Boolean(checked))}
                />
                <span>invert</span>
              </label>

              <div className="flex items-center gap-2">
                <span className="text-xs text-dim">start week:</span>
                <Input
                  type="number"
                  min={0}
                  max={50}
                  value={offset}
                  onChange={(e) => setOffset(Math.max(0, parseInt(e.target.value || '0', 10)))}
                  className="w-14 h-7 text-xs bg-panel border-line text-fg font-mono focus:border-line-strong"
                />
              </div>
            </div>
          </div>

          {/* Processed Pixel Matrix Preview */}
          {processed && (
            <div className="p-2 rounded-lg bg-panel border border-line flex flex-col gap-1">
              <div className="flex items-center justify-between text-[10px] text-dim">
                <span>preview ({processed.width}w x 7h)</span>
                <span className="text-mint">{processed.totalCommits} commits</span>
              </div>
              <div className="font-mono text-[9px] leading-[9px] tracking-widest text-mint overflow-x-auto whitespace-pre bg-canvas p-1.5 rounded border border-line">
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
              className="bg-mint-strong hover:bg-mint text-canvas text-xs h-8 px-4 font-bold disabled:opacity-30 disabled:bg-line disabled:text-dim"
            >
              apply image
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
