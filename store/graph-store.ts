import { create } from 'zustand';
import { ToolType, CommitPlanEntry } from '@/types';
import { yearGridToDate, toDateString } from '@/lib/core/grid-mapper';
import { isPaintableDate } from '@/lib/core/paintable';

interface GraphStore {
  // Current active tool
  activeTool: ToolType;
  setActiveTool: (tool: ToolType) => void;

  // Queued commits: key = UTC date "YYYY-MM-DD", value = commit count
  queue: Record<string, number>;
  setCell: (date: string, count: number) => void;
  clearCell: (date: string) => void;
  clearQueue: () => void;

  // Apply a bulk set of grid cells (from pattern, image, fill, random) for the selected year.
  // Cells outside the year or in the future are skipped.
  applyBulkCells: (entries: Array<{ week: number; day: number; count: number }>) => void;

  // Converts the queue to a date-sorted plan for API execution
  getCommitPlan: () => CommitPlanEntry[];

  // Settings
  intensity: number; // commits per painted cell (default 3)
  setIntensity: (n: number) => void;

  // Selected year
  year: number;
  setYear: (year: number) => void;

  // Selected repo for target execution
  selectedRepo: { owner: string; repo: string; branch: string } | null;
  setSelectedRepo: (repo: { owner: string; repo: string; branch: string } | null) => void;

  // Drag-to-paint state
  isDragging: boolean;
  dragAction: 'add' | 'remove' | null;
  startDrag: (action: 'add' | 'remove') => void;
  endDrag: () => void;
}

export const useGraphStore = create<GraphStore>((set, get) => ({
  activeTool: 'paint',
  setActiveTool: (tool) => set({ activeTool: tool }),

  queue: {},

  setCell: (date, count) => {
    set((state) => {
      const nextQueue = { ...state.queue };
      if (count <= 0) {
        delete nextQueue[date];
      } else {
        nextQueue[date] = count;
      }
      return { queue: nextQueue };
    });
  },

  clearCell: (date) => {
    set((state) => {
      const nextQueue = { ...state.queue };
      delete nextQueue[date];
      return { queue: nextQueue };
    });
  },

  clearQueue: () => set({ queue: {} }),

  applyBulkCells: (entries) => {
    set((state) => {
      const nextQueue = { ...state.queue };
      for (const entry of entries) {
        if (entry.week < 0 || entry.week > 53 || entry.day < 0 || entry.day > 6) continue;
        const date = yearGridToDate(entry.week, entry.day, state.year);
        if (!isPaintableDate(date, state.year)) continue;
        const key = toDateString(date);
        if (entry.count > 0) {
          nextQueue[key] = entry.count;
        } else {
          delete nextQueue[key];
        }
      }
      return { queue: nextQueue };
    });
  },

  getCommitPlan: () => {
    const { queue } = get();
    return Object.entries(queue)
      .filter(([, count]) => count > 0)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  },

  intensity: 3,
  setIntensity: (intensity) => set({ intensity }),

  year: new Date().getUTCFullYear(),
  setYear: (year) => set({ year }),

  selectedRepo: null,
  setSelectedRepo: (selectedRepo) => set({ selectedRepo }),

  isDragging: false,
  dragAction: null,
  startDrag: (action) => set({ isDragging: true, dragAction: action }),
  endDrag: () => set({ isDragging: false, dragAction: null }),
}));
