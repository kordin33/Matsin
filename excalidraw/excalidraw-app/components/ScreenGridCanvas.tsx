import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ExcalidrawImperativeAPI, AppState } from "@excalidraw/excalidraw/types";
import { DEFAULT_GRID_SIZE } from "@excalidraw/common";
import {
  GridStyle,
  renderInfiniteGrid,
  getAdaptiveGridSize,
} from "@excalidraw/excalidraw/renderer/infiniteGrid";

type Props = {
  excalidrawAPI: ExcalidrawImperativeAPI | null;
  /** base minor grid spacing in CSS pixels */
  stepPx?: number;
  /** draw a major line every N minor steps */
  majorEvery?: number;
};

export const ScreenGridCanvas: React.FC<Props> = ({ excalidrawAPI, stepPx = 32, majorEvery = 5 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });

  useLayoutEffect(() => {
    if (!containerRef.current) {
      return;
    }
    const el = containerRef.current;
    const obs = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const cr = entry.contentRect;
        setSize({ w: Math.round(cr.width), h: Math.round(cr.height) });
      }
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const draw = useCallback(() => {
    if (!canvasRef.current || !excalidrawAPI) {
      return;
    }
    const appState = excalidrawAPI.getAppState() as AppState;
    if (!appState.gridModeEnabled) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
      return;
    }

    const { w, h } = size;
    if (w <= 0 || h <= 0) {
      return;
    }

    const dpr = window.devicePixelRatio || 1;
    const canvas = canvasRef.current;
    const targetWidth = Math.floor(w * dpr);
    const targetHeight = Math.floor(h * dpr);
    if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.scale(dpr, dpr);

    const minorColor =
      appState.theme === "dark" ? "rgba(255,255,255,0.16)" : "rgba(0,0,0,0.16)";
    const majorColor =
      appState.theme === "dark" ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)";

    const baseWorldSize =
      typeof appState.gridSize === "number" && appState.gridSize > 0
        ? appState.gridSize
        : DEFAULT_GRID_SIZE;

    const worldSize = getAdaptiveGridSize(baseWorldSize, appState.zoom);
    const EPS = 1e-6;
    if (!appState.isLoading && Math.abs(appState.gridSize - worldSize) > EPS) {
      excalidrawAPI.updateScene({
        appState: { gridSize: worldSize },
      });
    }
    const majorEveryEff = Math.max(1, (appState.gridStep || majorEvery) as number);

    renderInfiniteGrid(ctx, w, h, {
      size: worldSize,
      scrollX: appState.scrollX,
      scrollY: appState.scrollY,
      zoom: appState.zoom,
      style: GridStyle.LINES,
      color: minorColor,
      majorColor,
      lineWidth: 1,
      majorGridMultiplier: majorEveryEff,
      majorLineWidth: 1.5,
    });

    ctx.restore();
  }, [excalidrawAPI, size, stepPx, majorEvery]);

  useEffect(() => {
    if (!excalidrawAPI) {
      return;
    }
    let raf = 0;
    const schedule = () => {
      if (!raf) {
        raf = requestAnimationFrame(() => {
          raf = 0;
          draw();
        });
      }
    };

    const unsubscribe = excalidrawAPI.onScrollChange(() => schedule());
    const interval = window.setInterval(schedule, 150);
    const onResize = () => schedule();

    window.addEventListener("resize", onResize);
    schedule();

    return () => {
      unsubscribe?.();
      window.clearInterval(interval);
      window.removeEventListener("resize", onResize);
      if (raf) {
        cancelAnimationFrame(raf);
      }
    };
  }, [excalidrawAPI, draw]);

  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <div
      ref={containerRef}
      style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 1 }}
    >
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />
    </div>
  );
};

export default ScreenGridCanvas;
