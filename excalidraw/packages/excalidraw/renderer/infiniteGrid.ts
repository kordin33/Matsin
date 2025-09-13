// infiniteGrid.ts — API zgodne ze staticScene.ts
// Siatka zakotwiczona w world-space: screen = (world - scroll) * zoom
// Zapewnia stabilność pozycji przy pan/zoom (jak w Idroo).

export type Zoom = { value: number };

export enum GridStyle {
  LINES = "lines",
  DOTS = "dots",
  CROSS = "cross",
}

export interface InfiniteGridOptions {
  size: number;                     // rozmiar kratki w world units
  scrollX: number;                  // pan X (world)
  scrollY: number;                  // pan Y (world)
  zoom: Zoom;                       // zoom.value >= ~0.05
  style?: GridStyle;                // domyślnie lines
  color?: string;                   // kolor minor
  majorColor?: string;              // kolor major
  opacity?: number;                 // 0..1
  lineWidth?: number;               // px w screen-space
  majorGridMultiplier?: number;     // co ile kratek pogrubienie (>=1)
  majorLineWidth?: number;          // px w screen-space
  dotRadius?: number;               // px (dla DOTS)
  crossSize?: number;               // px (dla CROSS) – połowa ramienia
}

const align1px = (n: number) => Math.round(n) + 0.5;

// Dostosowanie rozmiaru siatki do zoomu tak, by odległość między liniami
// w screen-space nie była zbyt mała.
export const getAdaptiveGridSize = (baseSize: number, zoom: Zoom) => {
  const z = Math.max(zoom?.value ?? 1, 0.0001);
  let size = Math.max(baseSize, 1);
  // Target ~12–20 px między liniami
  let px = size * z;
  while (px < 12) {
    size *= 2;
    px = size * z;
  }
  while (px > 80 && size > 1) {
    size = Math.max(1, Math.floor(size / 2));
    px = size * z;
  }
  return size;
};

export const renderInfiniteGrid = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  opts: InfiniteGridOptions,
) => {
  const {
    size,
    scrollX,
    scrollY,
    zoom,
    style = GridStyle.LINES,
    color = "#808080",
    majorColor,
    opacity = 0.25,
    lineWidth = 1,
    majorGridMultiplier = 5,
    majorLineWidth = 1.5,
    dotRadius = 1,
    crossSize = 3,
  } = opts;

  const z = zoom?.value ?? 1;
  if (!isFinite(z) || z <= 0) return;
  if (!isFinite(size) || size <= 0) return;

  // Widoczny obszar w world-space
  const worldLeft   = -scrollX;
  const worldTop    = -scrollY;
  const worldRight  = -scrollX + width / z;
  const worldBottom = -scrollY + height / z;

  const firstX = Math.floor(worldLeft / size) * size;
  const lastX  = Math.ceil(worldRight / size) * size;
  const firstY = Math.floor(worldTop / size) * size;
  const lastY  = Math.ceil(worldBottom / size) * size;

  ctx.save();
  ctx.globalAlpha = opacity;

  if (style === GridStyle.LINES) {
    // Minor
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;

    for (let wx = firstX; wx <= lastX; wx += size) {
      const sx = (wx + scrollX) * z;
      ctx.beginPath();
      ctx.moveTo(align1px(sx), 0);
      ctx.lineTo(align1px(sx), height);
      ctx.stroke();
    }
    for (let wy = firstY; wy <= lastY; wy += size) {
      const sy = (wy + scrollY) * z;
      ctx.beginPath();
      ctx.moveTo(0, align1px(sy));
      ctx.lineTo(width, align1px(sy));
      ctx.stroke();
    }

    // Major
    if (majorGridMultiplier > 1) {
      const major = size * majorGridMultiplier;
      const firstMajorX = Math.floor(firstX / major) * major;
      const firstMajorY = Math.floor(firstY / major) * major;
      ctx.strokeStyle = majorColor || color;
      ctx.lineWidth = majorLineWidth;

      for (let wx = firstMajorX; wx <= lastX; wx += major) {
        const sx = (wx + scrollX) * z;
        ctx.beginPath();
        ctx.moveTo(align1px(sx), 0);
        ctx.lineTo(align1px(sx), height);
        ctx.stroke();
      }
      for (let wy = firstMajorY; wy <= lastY; wy += major) {
        const sy = (wy + scrollY) * z;
        ctx.beginPath();
        ctx.moveTo(0, align1px(sy));
        ctx.lineTo(width, align1px(sy));
        ctx.stroke();
      }
    }
  } else if (style === GridStyle.DOTS) {
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let wy = firstY; wy <= lastY; wy += size) {
      const sy = (wy + scrollY) * z;
      if (sy < -2 * dotRadius || sy > height + 2 * dotRadius) continue;
      for (let wx = firstX; wx <= lastX; wx += size) {
        const sx = (wx + scrollX) * z;
        if (sx < -2 * dotRadius || sx > width + 2 * dotRadius) continue;
        ctx.moveTo(sx + dotRadius, sy);
        ctx.arc(sx, sy, dotRadius, 0, Math.PI * 2);
      }
    }
    ctx.fill();

    if (majorGridMultiplier > 1) {
      const major = size * majorGridMultiplier;
      const startY = Math.floor(firstY / major) * major;
      const startX = Math.floor(firstX / major) * major;
      ctx.fillStyle = majorColor || color;
      ctx.beginPath();
      const bigR = Math.max(dotRadius * 1.6, dotRadius + 0.5);
      for (let wy = startY; wy <= lastY; wy += major) {
        const sy = (wy + scrollY) * z;
        if (sy < -2 * bigR || sy > height + 2 * bigR) continue;
        for (let wx = startX; wx <= lastX; wx += major) {
          const sx = (wx + scrollX) * z;
          if (sx < -2 * bigR || sx > width + 2 * bigR) continue;
          ctx.moveTo(sx + bigR, sy);
          ctx.arc(sx, sy, bigR, 0, Math.PI * 2);
        }
      }
      ctx.fill();
    }
  } else if (style === GridStyle.CROSS) {
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    const half = crossSize;
    for (let wy = firstY; wy <= lastY; wy += size) {
      const sy = (wy + scrollY) * z;
      if (sy < -half - 1 || sy > height + half + 1) continue;
      for (let wx = firstX; wx <= lastX; wx += size) {
        const sx = (wx + scrollX) * z;
        if (sx < -half - 1 || sx > width + half + 1) continue;
        ctx.beginPath();
        ctx.moveTo(align1px(sx - half), align1px(sy));
        ctx.lineTo(align1px(sx + half), align1px(sy));
        ctx.moveTo(align1px(sx), align1px(sy - half));
        ctx.lineTo(align1px(sx), align1px(sy + half));
        ctx.stroke();
      }
    }
    if (majorGridMultiplier > 1) {
      const major = size * majorGridMultiplier;
      const startY = Math.floor(firstY / major) * major;
      const startX = Math.floor(firstX / major) * major;
      ctx.strokeStyle = majorColor || color;
      ctx.lineWidth = Math.max(majorLineWidth, lineWidth + 0.5);
      const halfMajor = Math.max(crossSize * 1.4, crossSize + 1);
      for (let wy = startY; wy <= lastY; wy += major) {
        const sy = (wy + scrollY) * z;
        if (sy < -halfMajor - 1 || sy > height + halfMajor + 1) continue;
        for (let wx = startX; wx <= lastX; wx += major) {
          const sx = (wx + scrollX) * z;
          if (sx < -halfMajor - 1 || sx > width + halfMajor + 1) continue;
          ctx.beginPath();
          ctx.moveTo(align1px(sx - halfMajor), align1px(sy));
          ctx.lineTo(align1px(sx + halfMajor), align1px(sy));
          ctx.moveTo(align1px(sx), align1px(sy - halfMajor));
          ctx.lineTo(align1px(sx), align1px(sy + halfMajor));
          ctx.stroke();
        }
      }
    }
  }

  ctx.restore();
};

// Ekranowa wersja siatki o sta�ej odleg�o�ci px mi�dzy liniami
// (scrollX/scrollY w px, bez skalowania kontekstu):
export const renderScreenGrid = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  opts: {
    sizePx: number;            // docelowa odleg�o�� mi�dzy liniami w px
    scrollX: number;           // w px
    scrollY: number;           // w px
    zoom: Zoom;                // do doboru grubo�ci linii i fade
    gridStep?: number;         // co ile kratek linia grubsza
    color?: string;
    majorColor?: string;
  },
) => {
  const { sizePx, scrollX, scrollY, zoom, gridStep = 5 } = opts;
  const color = opts.color || "#4a4a4a";
  const majorColor = opts.majorColor || color;
  const z = Math.max(zoom?.value ?? 1, 0.0001);

  if (!isFinite(sizePx) || sizePx <= 0) return;

  // Premium wygl�d: ostre linie + wysokie quality
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  // @ts-ignore
  ctx.imageSmoothingQuality = "high";

  // Mi�kka progresja widoczno�ci drobnych linii przy oddalaniu
  // Przyk�adowo: < 14px fade, < 8px ukryj drobne
  const minorAlpha = sizePx < 8 ? 0 : sizePx < 14 ? (sizePx - 8) / 6 : 1;
  const majorWidth = Math.max(1.2 / z, 0.7);
  const minorWidth = Math.max(1 / z, 0.5);

  const offX = (scrollX % sizePx) - sizePx;
  const offY = (scrollY % sizePx) - sizePx;

  // Minor - pionowe
  if (minorAlpha > 0.01) {
    ctx.strokeStyle = color;
    ctx.globalAlpha = Math.min(0.55, 0.35 + 0.2 * minorAlpha);
    ctx.lineWidth = minorWidth;
    // 0.5 px dla ostro�ci
    const align = (n: number) => Math.round(n) + 0.5;
    for (let x = offX; x < offX + width + sizePx * 2; x += sizePx) {
      ctx.beginPath();
      ctx.moveTo(align(x), 0);
      ctx.lineTo(align(x), height);
      ctx.stroke();
    }
    for (let y = offY; y < offY + height + sizePx * 2; y += sizePx) {
      ctx.beginPath();
      ctx.moveTo(0, align(y));
      ctx.lineTo(width, align(y));
      ctx.stroke();
    }
  }

  // Major
  const majorEvery = Math.max(1, Math.round(gridStep));
  const majorSpacing = sizePx * majorEvery;
  const mOffX = (scrollX % majorSpacing) - majorSpacing;
  const mOffY = (scrollY % majorSpacing) - majorSpacing;

  ctx.strokeStyle = majorColor;
  ctx.globalAlpha = 0.75;
  ctx.lineWidth = majorWidth;
  const align = (n: number) => Math.round(n) + 0.5;
  for (let x = mOffX; x < mOffX + width + majorSpacing * 2; x += majorSpacing) {
    ctx.beginPath();
    ctx.moveTo(align(x), 0);
    ctx.lineTo(align(x), height);
    ctx.stroke();
  }
  for (let y = mOffY; y < mOffY + height + majorSpacing * 2; y += majorSpacing) {
    ctx.beginPath();
    ctx.moveTo(0, align(y));
    ctx.lineTo(width, align(y));
    ctx.stroke();
  }

  ctx.restore();
};

// Opcjonalnie: helper do CSS-owej siatki (jeśli zamiast canvas chcesz background)
export const computeCSSGridBackground = (opts: {
  size: number;
  scrollX: number;
  scrollY: number;
  zoom: Zoom;
}) => {
  const z = opts.zoom?.value ?? 1;
  const sizePx = opts.size * z;
  const offX = ((-opts.scrollX * z) % sizePx + sizePx) % sizePx;
  const offY = ((-opts.scrollY * z) % sizePx + sizePx) % sizePx;
  return {
    backgroundSize: `${sizePx}px ${sizePx}px`,
    backgroundPosition: `${offX}px ${offY}px`,
  };
};
