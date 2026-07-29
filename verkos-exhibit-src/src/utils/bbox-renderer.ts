import type { DetectionObject } from '@/api/forensic-search';

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
}

const DETECTION_COLORS: Record<string, string> = {
  person: '#FF4444',
  car: '#4488FF',
  vehicle: '#4488FF',
  truck: '#22AAFF',
  van: '#22AAFF',
  bus: '#2266FF',
  motorcycle: '#FF8800',
  fence: '#FF8800',
  damage: '#FF8800',
  default: '#FFCC00',
};

function getColorForClass(className: string): string {
  return DETECTION_COLORS[className.toLowerCase()] ?? DETECTION_COLORS.default;
}

export interface RenderedImage {
  rawDataUrl: string;
  annotatedDataUrl: string;
  width: number;
  height: number;
}

/**
 * Render bounding boxes on an image using canvas.
 *
 * Bounding boxes are in pixel coordinates at detection_resolution (e.g. 3840x2160).
 * We scale them to the actual image dimensions.
 */
export async function renderBoundingBoxes(
  imageUrl: string,
  bboxObjects: DetectionObject[],
  detectionResolution: [number, number]
): Promise<RenderedImage> {
  const img = await loadImage(imageUrl);
  const { width, height } = img;
  const [detW, detH] = detectionResolution;

  const scaleX = detW > 0 ? width / detW : 1;
  const scaleY = detH > 0 ? height / detH : 1;

  // Raw version
  const rawCanvas = document.createElement('canvas');
  rawCanvas.width = width;
  rawCanvas.height = height;
  const rawCtx = rawCanvas.getContext('2d');
  if (!rawCtx) throw new Error('Canvas 2D context unavailable');
  rawCtx.drawImage(img, 0, 0);
  const rawDataUrl = rawCanvas.toDataURL('image/jpeg', 0.85);

  // Annotated version
  const annCanvas = document.createElement('canvas');
  annCanvas.width = width;
  annCanvas.height = height;
  const ctx = annCanvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');
  ctx.drawImage(img, 0, 0);

  for (const det of bboxObjects) {
    if (!det.bbox || det.bbox.length < 4) continue;
    const [bx, by, bw, bh] = det.bbox;

    const px = bx * scaleX;
    const py = by * scaleY;
    const pw = bw * scaleX;
    const ph = bh * scaleY;

    const color = getColorForClass(det.class);
    const confPct = Math.round(det.conf * 100);
    const labelText = `${det.class} ${confPct}%`;

    const lineWidth = Math.max(3, Math.min(5, width / 400));
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.strokeRect(px, py, pw, ph);

    const fontSize = Math.max(14, Math.min(20, width / 45));
    ctx.font = `bold ${fontSize}px "DM Sans", "Inter", sans-serif`;
    const textWidth = ctx.measureText(labelText).width + 12;
    const labelHeight = fontSize + 12;

    const labelY = Math.max(0, py - labelHeight);

    ctx.fillStyle = color;
    ctx.globalAlpha = 0.85;
    ctx.fillRect(px, labelY, textWidth, labelHeight);
    ctx.globalAlpha = 1.0;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(labelText, px + 6, labelY + fontSize + 2);
  }

  const annotatedDataUrl = annCanvas.toDataURL('image/jpeg', 0.85);
  return { rawDataUrl, annotatedDataUrl, width, height };
}
