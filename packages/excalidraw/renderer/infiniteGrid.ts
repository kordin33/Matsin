// infiniteGrid.ts — kompletny, produkcyjny rysownik „nieskończonej” siatki
// Działa jak w Idroo: siatka jest w world-space i porusza się/skaluję razem ze sceną.
// Załóż: CANVAS ma już ustawioną skalę devicePixelRatio (ctx.scale(dpr, dpr)),
// a wymiary width/height przekazujesz w CSS px (logical pixels).
//
// Użycie (React/Canvas):
// const dpr = window.devicePixelRatio || 1;
// canvas.width = Math.floor(canvas.clientWidth * dpr);
// canvas.height = Math.floor(canvas.clientHeight * dpr);
// const ctx = canvas.getContext("2d")!;
// ctx.setTransform(1, 0, 0, 1, 0, 0);
// ctx.scale(dpr, dpr);
// drawInfiniteGrid(ctx, canvas.clientWidth, canvas.clientHeight, {
//   scrollX, scrollY, zoom: { value: zoomValue },
//   size: 20, style: "lines", majorGridMultiplier: 5,
//   color: "#808080", majorColor: "#606060", opacity: 0.25,
// });
//
// Klucz: zawsze używamy screen = (world - scroll) * zoom.
// Dzięki temu „D5” zostaje „D5” po pan/zoom.

export type Zoom = { value: number };

export const GridStyle = {
  DOTS: "dots",
  LINES: "lines",
  CROSS: "cross",
} as const;

export type GridStyleType = typeof GridStyle[keyof typeof GridStyle];

export interface InfiniteGridOptions {
  // Rozmiar kratki w jednostkach świata (world units)
  size: number;
  // Styl siatki
  style?: GridStyleType;
  // Ile kratek między grubszymi liniami (np. 5 => co 5 kratek)
  majorGridMultiplier?: number;
  // Kolor linii/dotów (minor)
  color?: string;
  // Kolor linii głównych (major). Domyślnie = color
  majorColor?: string;
  // Globalna przezroczystość (0..1)
  opacity?: number;
  // Szerokość linii (px na ekranie — stała w screen space)
  lineWidth?: number;
  // Szerokość linii głównych
  majorLineWidth?: number;
  // Promień kropki w stylu „dots” (px w screen space)
  dotRadius?: number;
  // Długość ramion krzyżyka (px w screen space)
  crossSize?: number;
  // Pozycja kamery (pan/scroll) w world-space
  scrollX: number;
  scrollY: number;
  // Zoom (>= 0.05 np.)
  zoom: Zoom;
}

function align1px(n: number) {
  // Dla ostrych 1px linii na canvasie przeskakujemy na pół piksela
  // W screen space (po ctx.scale(dpr, dpr)) wystarczy 0.5
  return Math.round(n) + 0.5;
}

export function renderInfiniteGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  opts: InfiniteGridOptions,
) {
  const {
    size,
    style = "lines",
    majorGridMultiplier = 5,
    color = "#808080",
    majorColor,
    opacity = 0.2,
    lineWidth = 1,
    majorLineWidth = 1.5,
    dotRadius = 1,
    crossSize = 3,
    scrollX,
    scrollY,
    zoom,
  } = opts;

  const z = zoom?.value ?? 1;
  if (!size || size <= 0 || !isFinite(size)) return;
  if (!z || z <= 0 || !isFinite(z)) return;

  // Widoczny prostokąt w world-space
  const worldLeft   = scrollX;
  const worldTop    = scrollY;
  const worldRight  = scrollX + width / z;
  const worldBottom = scrollY + height / z;

  const firstX = Math.floor(worldLeft / size) * size;
  const lastX  = Math.ceil(worldRight / size) * size;
  const firstY = Math.floor(worldTop / size) * size;
  const lastY  = Math.ceil(worldBottom / size) * size;

  ctx.save();
  ctx.globalAlpha = opacity;

  if (style === "lines") {
    // Minor lines
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;

    // Pionowe
    for (let wx = firstX; wx <= lastX; wx += size) {
      const sx = (wx - scrollX) * z;
      ctx.beginPath();
      ctx.moveTo(align1px(sx), 0);
      ctx.lineTo(align1px(sx), height);
      ctx.stroke();
    }
    // Poziome
    for (let wy = firstY; wy <= lastY; wy += size) {
      const sy = (wy - scrollY) * z;
      ctx.beginPath();
      ctx.moveTo(0, align1px(sy));
      ctx.lineTo(width, align1px(sy));
      ctx.stroke();
    }

    // Major lines
    if (majorGridMultiplier > 1) {
      const major = size * majorGridMultiplier;
      const firstMajorX = Math.floor(firstX / major) * major;
      const firstMajorY = Math.floor(firstY / major) * major;

      ctx.strokeStyle = majorColor || color;
      ctx.lineWidth = majorLineWidth;

      for (let wx = firstMajorX; wx <= lastX; wx += major) {
        const sx = (wx - scrollX) * z;
        ctx.beginPath();
        ctx.moveTo(align1px(sx), 0);
        ctx.lineTo(align1px(sx), height);
        ctx.stroke();
      }
      for (let wy = firstMajorY; wy <= lastY; wy += major) {
        const sy = (wy - scrollY) * z;
        ctx.beginPath();
        ctx.moveTo(0, align1px(sy));
        ctx.lineTo(width, align1px(sy));
        ctx.stroke();
      }
    }
  } else if (style === "dots") {
    // Kropki rysujemy w screen-space o stałym promieniu (nie skalujemy z zoom)
    ctx.fillStyle = color;
    // batchowanie ścieżki dla wydajności
    ctx.beginPath();
    for (let wy = firstY; wy <= lastY; wy += size) {
      const sy = (wy - scrollY) * z;
      if (sy < -2 * dotRadius || sy > height + 2 * dotRadius) continue;
      for (let wx = firstX; wx <= lastX; wx += size) {
        const sx = (wx - scrollX) * z;
        if (sx < -2 * dotRadius || sx > width + 2 * dotRadius) continue;
        ctx.moveTo(sx + dotRadius, sy);
        ctx.arc(sx, sy, dotRadius, 0, Math.PI * 2);
      }
    }
    ctx.fill();

    // Co N kratek można dodać „większą” kropkę jako major (opcjonalnie)
    if (majorGridMultiplier > 1) {
      const major = size * majorGridMultiplier;
      ctx.fillStyle = majorColor || color;
      ctx.beginPath();
      const bigR = Math.max(dotRadius * 1.6, dotRadius + 0.5);
      // Startujemy od pierwszego wiersza/kolumny będących wielokrotnością major
      const startY = Math.floor(firstY / major) * major;
      const startX = Math.floor(firstX / major) * major;
      for (let wy = startY; wy <= lastY; wy += major) {
        const sy = (wy - scrollY) * z;
        if (sy < -2 * bigR || sy > height + 2 * bigR) continue;
        for (let wx = startX; wx <= lastX; wx += major) {
          const sx = (wx - scrollX) * z;
          if (sx < -2 * bigR || sx > width + 2 * bigR) continue;
          ctx.moveTo(sx + bigR, sy);
          ctx.arc(sx, sy, bigR, 0, Math.PI * 2);
        }
      }
      ctx.fill();
    }
  } else if (style === "cross") {
    // Krzyżyki o stałej długości ramion w screen-space
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    const half = crossSize;

    for (let wy = firstY; wy <= lastY; wy += size) {
      const sy = (wy - scrollY) * z;
      if (sy < -half - 1 || sy > height + half + 1) continue;
      for (let wx = firstX; wx <= lastX; wx += size) {
        const sx = (wx - scrollX) * z;
        if (sx < -half - 1 || sx > width + half + 1) continue;

        ctx.beginPath();
        ctx.moveTo(align1px(sx - half), align1px(sy));
        ctx.lineTo(align1px(sx + half), align1px(sy));
        ctx.moveTo(align1px(sx), align1px(sy - half));
        ctx.lineTo(align1px(sx), align1px(sy + half));
        ctx.stroke();
      }
    }

    // Major: grubszy krzyż co N kratek
    if (majorGridMultiplier > 1) {
      const major = size * majorGridMultiplier;
      const startY = Math.floor(firstY / major) * major;
      const startX = Math.floor(firstX / major) * major;
      ctx.strokeStyle = majorColor || color;
      ctx.lineWidth = Math.max(majorLineWidth, lineWidth + 0.5);
      const halfMajor = Math.max(crossSize * 1.4, crossSize + 1);

      for (let wy = startY; wy <= lastY; wy += major) {
        const sy = (wy - scrollY) * z;
        if (sy < -halfMajor - 1 || sy > height + halfMajor + 1) continue;
        for (let wx = startX; wx <= lastX; wx += major) {
          const sx = (wx - scrollX) * z;
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
}

// Pomocnicza funkcja do obliczenia background-position/size, jeśli chcesz CSS-ową siatkę.
// Zwraca { backgroundSize, backgroundPosition } w px, zsynchronizowane z pan/zoom w world-space.
export function computeCSSGridBackground(
  width: number,
  height: number,
  opts: Pick<InfiniteGridOptions, "size" | "scrollX" | "scrollY" | "zoom">,
) {
  const z = opts.zoom?.value ?? 1;
  const sizePx = opts.size * z;

  // Offset w screen-space tak, aby linie „przechodziły” przez pozycje world = k*size
  const offX = ((-opts.scrollX * z) % sizePx + sizePx) % sizePx;
  const offY = ((-opts.scrollY * z) % sizePx + sizePx) % sizePx;

  return {
    backgroundSize: `${sizePx}px ${sizePx}px`,
    backgroundPosition: `${offX}px ${offY}px`,
  };
}

// Alias eksportu dla kompatybilności
export { renderInfiniteGrid as drawInfiniteGrid };