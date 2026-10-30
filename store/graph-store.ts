import { create } from 'zustand';
import { ToolType, CommitPlanEntry } from '@/types';
import { yearGridToDate, toDateString } from '@/lib/core/grid-mapper';

interface GraphStore {
  // Current active tool
  activeTool: ToolType;
  setActiveTool: (tool: ToolType) => void;

  // Queued commits: key = "week-day", value = commit count
  queue: Record<string, number>;
  setCell: (week: number, day: number, count: number) => void;
  toggleCell: (week: number, day: number) => void;
  clearCell: (week: number, day: number) => void;
  clearQueue: () => void;

  // Apply a bulk set of cells (from pattern, image, fill, random)
  applyBulkCells: (entries: Array<{ week: number; day: number; count: number }>) => void;

  // Converts the queue to sorted CommitPlanEntry[] for API execution
  getCommitPlan: (year: number) => CommitPlanEntry[];

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

  setCell: (week, day, count) => {
    const key = `${week}-${day}`;
    set((state) => {
      const nextQueue = { ...state.queue };
      if (count <= 0) {
        delete nextQueue[key];
      } else {
        nextQueue[key] = count;
      }
      return { queue: nextQueue };
    });
  },

  toggleCell: (week, day) => {
    const key = `${week}-${day}`;
    const { queue, intensity } = get();
    if (queue[key]) {
      get().clearCell(week, day);
    } else {
      get().setCell(week, day, intensity);
    }
  },

  clearCell: (week, day) => {
    const key = `${week}-${day}`;
    set((state) => {
      const nextQueue = { ...state.queue };
      delete nextQueue[key];
      return { queue: nextQueue };
    });
  },

  clearQueue: () => set({ queue: {} }),

  applyBulkCells: (entries) => {
    set((state) => {
      const nextQueue = { ...state.queue };
      for (const entry of entries) {
        if (entry.week >= 0 && entry.week < 53 && entry.day >= 0 && entry.day < 7) {
          const key = `${entry.week}-${entry.day}`;
          if (entry.count > 0) {
            nextQueue[key] = entry.count;
          } else {
            delete nextQueue[key];
          }
        }
      }
      return { queue: nextQueue };
    });
  },

  getCommitPlan: (year) => {
    const { queue } = get();
    const plan: CommitPlanEntry[] = [];

    for (const [key, count] of Object.entries(queue)) {
      if (count > 0) {
        const [wStr, dStr] = key.split('-');
        const week = parseInt(wStr, 10);
        const day = parseInt(dStr, 10);
        const date = yearGridToDate(week, day, year);
        plan.push({ date: toDateString(date), count });
      }
    }

    // Sort by date ascending
    return plan.sort((a, b) => a.date.localeCompare(b.date));
  },

  intensity: 3,
  setIntensity: (intensity) => set({ intensity }),

  year: new Date().getFullYear(),
  setYear: (year) => set({ year }),

  selectedRepo: null,
  setSelectedRepo: (selectedRepo) => set({ selectedRepo }),

  isDragging: false,
  dragAction: null,
  startDrag: (action) => set({ isDragging: true, dragAction: action }),
  endDrag: () => set({ isDragging: false, dragAction: null }),
}));
