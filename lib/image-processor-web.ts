export interface ImageProcessorOptions {
  file: File;
  maxWidth?: number; // max columns (weeks), default 52
  mode: 'grayscale' | 'binary';
  invert: boolean;
  threshold: number; // for binary mode, 0-255 (default 128)
  offset?: number; // week offset from start
}

export interface ProcessedImage {
  commitGrid: number[][]; // [row (day 0-6)][col (week 0-52)] = commit count
  preview: string[]; // 7 strings of block characters
  width: number;
  height: number;
  totalCommits: number;
  activeCells: number;
}

// Grayscale brightness threshold mapping to commit counts
const GRAYSCALE_LEVELS = [
  { max: 51, commits: 10 },  // Darkest -> most commits
  { max: 102, commits: 5 },
  { max: 153, commits: 3 },
  { max: 204, commits: 1 },
  { max: 255, commits: 0 },  // Lightest -> 0 commits
];

export async function processImageInBrowser(
  options: ImageProcessorOptions
): Promise<ProcessedImage> {
  const {
    file,
    maxWidth = 52,
    mode,
    invert,
    threshold,
  } = options;

  // 1. Load image into bitmap
  const bitmap = await createImageBitmap(file);

  // Calculate target aspect ratio width capped at maxWidth
  const targetWidth = Math.min(
    maxWidth,
    Math.max(1, Math.round((bitmap.width / bitmap.height) * 7))
  );

  // 2. Render onto 7-row canvas (GitHub graph is 7 days tall)
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = 7;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  if (!ctx) {
    throw new Error('Failed to acquire 2D canvas rendering context');
  }

  // Fill canvas with white background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, targetWidth, 7);
  ctx.drawImage(bitmap, 0, 0, targetWidth, 7);

  // 3. Extract RGBA pixel data
  const imageData = ctx.getImageData(0, 0, targetWidth, 7);
  const { data } = imageData;

  // 4. Convert pixels to commit count grid
  const commitGrid: number[][] = [];

  for (let row = 0; row < 7; row++) {
    const rowData: number[] = [];
    for (let col = 0; col < targetWidth; col++) {
      const idx = (row * targetWidth + col) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const a = data[idx + 3];

      // If pixel is transparent, treat as white
      let brightness =
        a < 50
          ? 255
          : Math.round(0.299 * r + 0.587 * g + 0.114 * b);

      if (invert) {
        brightness = 255 - brightness;
      }

      let commits = 0;
      if (mode === 'binary') {
        commits = brightness < threshold ? 5 : 0;
      } else {
        for (const level of GRAYSCALE_LEVELS) {
          if (brightness <= level.max) {
            commits = level.commits;
            break;
          }
        }
      }

      rowData.push(commits);
    }
    commitGrid.push(rowData);
  }

  // 5. Build ASCII preview strings
  const preview = commitGrid.map((row) =>
    row
      .map((c) => (c === 0 ? '░' : c <= 2 ? '▒' : c <= 5 ? '▓' : '█'))
      .join('')
  );

  const totalCommits = commitGrid.flat().reduce((a, b) => a + b, 0);
  const activeCells = commitGrid.flat().filter((c) => c > 0).length;

  return {
    commitGrid,
    preview,
    width: targetWidth,
    height: 7,
    totalCommits,
    activeCells,
  };
}
