import type { Zoom } from "../types";

export const GridStyle = {
  DOTS: "dots",
  LINES: "lines",
  CROSS: "cross",
} as const;

export type GridStyleType = typeof GridStyle[keyof typeof GridStyle];

interface GridConfig {
  style: GridStyleType;
  size: number;
  color: string;
  opacity: number;
  majorGridMultiplier: number;
  majorGridColor: string;
  majorGridOpacity: number;
}

const DEFAULT_GRID_CONFIG: GridConfig = {
  style: GridStyle.DOTS,
  size: 20,
  color: "#e0e0e0",
  opacity: 0.6,
  majorGridMultiplier: 5,
  majorGridColor: "#c0c0c0",
  majorGridOpacity: 0.8,
};

/**
 * Renders an infinite grid similar to Miro's grid system
 */
export const renderInfiniteGrid = (
  context: CanvasRenderingContext2D,
  scrollX: number,
  scrollY: number,
  zoom: Zoom,
  canvasWidth: number,
  canvasHeight: number,
  config: Partial<GridConfig> = {},
) => {
  const gridConfig = { ...DEFAULT_GRID_CONFIG, ...config };
  const { style, size, color, opacity, majorGridMultiplier, majorGridColor, majorGridOpacity } = gridConfig;

  // Calculate effective grid size based on zoom
  const effectiveGridSize = size * zoom.value;
  
  // Don't render grid if it's too small to see
  if (effectiveGridSize < 2) {
    return;
  }

  // Calculate grid bounds with some padding
  const padding = size * 2;
  const startX = Math.floor((scrollX - padding) / size) * size;
  const endX = Math.ceil((scrollX + canvasWidth / zoom.value + padding) / size) * size;
  const startY = Math.floor((scrollY - padding) / size) * size;
  const endY = Math.ceil((scrollY + canvasHeight / zoom.value + padding) / size) * size;

  context.save();

  switch (style) {
    case GridStyle.DOTS:
      renderDotGrid(context, startX, startY, endX, endY, size, scrollX, scrollY, zoom, gridConfig);
      break;
    case GridStyle.LINES:
      renderLineGrid(context, startX, startY, endX, endY, size, scrollX, scrollY, zoom, gridConfig);
      break;
    case GridStyle.CROSS:
      renderCrossGrid(context, startX, startY, endX, endY, size, scrollX, scrollY, zoom, gridConfig);
      break;
  }

  context.restore();
};

const renderDotGrid = (
  context: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  gridSize: number,
  scrollX: number,
  scrollY: number,
  zoom: Zoom,
  config: GridConfig,
) => {
  const dotSize = Math.max(1, Math.min(3, gridSize * zoom.value * 0.05));
  
  for (let x = startX; x <= endX; x += gridSize) {
    for (let y = startY; y <= endY; y += gridSize) {
      const screenX = (x + scrollX) * zoom.value;
      const screenY = (y + scrollY) * zoom.value;
      
      // Major grid disabled when multiplier <= 1
      const hasMajor = config.majorGridMultiplier > 1;
      const isMajor =
        hasMajor &&
        Math.abs(x) % (gridSize * config.majorGridMultiplier) === 0 &&
        Math.abs(y) % (gridSize * config.majorGridMultiplier) === 0;
      
      context.fillStyle = isMajor ? config.majorGridColor : config.color;
      context.globalAlpha = isMajor ? config.majorGridOpacity : config.opacity;
      
      context.beginPath();
      context.arc(screenX, screenY, isMajor ? dotSize * 1.5 : dotSize, 0, Math.PI * 2);
      context.fill();
    }
  }
};

const renderLineGrid = (
  context: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  gridSize: number,
  scrollX: number,
  scrollY: number,
  zoom: Zoom,
  config: GridConfig,
) => {
  const lineWidth = Math.max(0.5, Math.min(2, zoom.value * 0.5));
  
  // Vertical lines
  for (let x = startX; x <= endX; x += gridSize) {
    const screenX = (x + scrollX) * zoom.value;
    const isMajor =
      config.majorGridMultiplier > 1 &&
      Math.abs(x) % (gridSize * config.majorGridMultiplier) === 0;
    
    context.strokeStyle = isMajor ? config.majorGridColor : config.color;
    context.globalAlpha = isMajor ? config.majorGridOpacity : config.opacity;
    context.lineWidth = isMajor ? lineWidth * 2 : lineWidth;
    
    context.beginPath();
    context.moveTo(screenX, (startY + scrollY) * zoom.value);
    context.lineTo(screenX, (endY + scrollY) * zoom.value);
    context.stroke();
  }
  
  // Horizontal lines
  for (let y = startY; y <= endY; y += gridSize) {
    const screenY = (y + scrollY) * zoom.value;
    const isMajor =
      config.majorGridMultiplier > 1 &&
      Math.abs(y) % (gridSize * config.majorGridMultiplier) === 0;
    
    context.strokeStyle = isMajor ? config.majorGridColor : config.color;
    context.globalAlpha = isMajor ? config.majorGridOpacity : config.opacity;
    context.lineWidth = isMajor ? lineWidth * 2 : lineWidth;
    
    context.beginPath();
    context.moveTo((startX + scrollX) * zoom.value, screenY);
    context.lineTo((endX + scrollX) * zoom.value, screenY);
    context.stroke();
  }
};

const renderCrossGrid = (
  context: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  gridSize: number,
  scrollX: number,
  scrollY: number,
  zoom: Zoom,
  config: GridConfig,
) => {
  const crossSize = Math.max(2, Math.min(8, gridSize * zoom.value * 0.1));
  const lineWidth = Math.max(0.5, Math.min(1.5, zoom.value * 0.3));
  
  for (let x = startX; x <= endX; x += gridSize) {
    for (let y = startY; y <= endY; y += gridSize) {
      const screenX = (x + scrollX) * zoom.value;
      const screenY = (y + scrollY) * zoom.value;
      
      const hasMajor = config.majorGridMultiplier > 1;
      const isMajor =
        hasMajor &&
        Math.abs(x) % (gridSize * config.majorGridMultiplier) === 0 &&
        Math.abs(y) % (gridSize * config.majorGridMultiplier) === 0;
      
      context.strokeStyle = isMajor ? config.majorGridColor : config.color;
      context.globalAlpha = isMajor ? config.majorGridOpacity : config.opacity;
      context.lineWidth = isMajor ? lineWidth * 2 : lineWidth;
      
      const size = isMajor ? crossSize * 1.5 : crossSize;
      
      // Horizontal line
      context.beginPath();
      context.moveTo(screenX - size / 2, screenY);
      context.lineTo(screenX + size / 2, screenY);
      context.stroke();
      
      // Vertical line
      context.beginPath();
      context.moveTo(screenX, screenY - size / 2);
      context.lineTo(screenX, screenY + size / 2);
      context.stroke();
    }
  }
};

/**
 * Get adaptive grid size based on zoom level
 */
export const getAdaptiveGridSize = (baseSize: number, zoom: Zoom): number => {
  const zoomValue = zoom.value;
  
  if (zoomValue < 0.25) {
    return baseSize * 8;
  } else if (zoomValue < 0.5) {
    return baseSize * 4;
  } else if (zoomValue < 1) {
    return baseSize * 2;
  } else if (zoomValue > 4) {
    return baseSize / 2;
  } else if (zoomValue > 8) {
    return baseSize / 4;
  }
  
  return baseSize;
};