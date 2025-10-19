import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ExcalidrawImperativeAPI, AppState } from "@excalidraw/excalidraw/types";

type Props = {
  excalidrawAPI: ExcalidrawImperativeAPI | null;
  /** minor grid spacing in CSS pixels (screen-space) */
  stepPx?: number;
  /** draw a major line every N minor steps */
  majorEvery?: number;
};

const mod = (a: number, m: number) => ((a % m) + m) % m;

export const ScreenGridCanvas: React.FC<Props> = ({ excalidrawAPI, stepPx = 32, majorEvery = 5 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });

  // observe container size
  useLayoutEffect(() => {
    if (!containerRef.current) return;
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
    if (!canvasRef.current || !excalidrawAPI) return;
    const appState = excalidrawAPI.getAppState() as AppState;
    const gridEnabled = appState.gridModeEnabled;

    const dpr = window.devicePixelRatio || 1;
    const canvas = canvasRef.current;
    const { w, h } = size;
    if (w <= 0 || h <= 0) return;
    if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!gridEnabled) return;

    // compute dynamic world grid size so snapping (invis grid) matches visible
    const zoom = appState.zoom.value || 1;
    const worldStep = Math.max(1, stepPx / zoom);

    // if app state's gridSize differs, update it (to align snapping)
    const E = 0.001;
    if (!appState.isLoading && typeof appState.gridSize === "number") {
      if (Math.abs((appState.gridSize || 0) - worldStep) > E) {
        // keep grid mode enabled and grid step as-is
        excalidrawAPI.updateScene({
          appState: {
            gridSize: worldStep,
          },
        });
      }
    }

    // screen-space grid drawing
    ctx.scale(dpr, dpr);
    const minorColor = appState.theme === "dark" ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)";
    const majorColor = appState.theme === "dark" ? "rgba(255,255,255,0.32)" : "rgba(0,0,0,0.32)";
    const majorEveryEff = Math.max(1, (appState.gridStep || majorEvery) as number);

    // screen-space offset from scroll & zoom: screen = zoom * world + t; t = (scrollX, scrollY)
    const offX = mod((-appState.scrollX) * zoom, stepPx);
    const offY = mod((-appState.scrollY) * zoom, stepPx);

    // Minor lines
    ctx.beginPath();
    for (let x = offX; x <= w; x += stepPx) {
      const xx = Math.floor(x) + 0.5; // half-pixel alignment for 1px lines
      ctx.moveTo(xx, 0);
      ctx.lineTo(xx, h);
    }
    for (let y = offY; y <= h; y += stepPx) {
      const yy = Math.floor(y) + 0.5;
      ctx.moveTo(0, yy);
      ctx.lineTo(w, yy);
    }
    ctx.strokeStyle = minorColor;
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    ctx.stroke();

    // Major lines (every N minors)
    if (majorEveryEff > 1) {
      ctx.beginPath();
      const majorStep = stepPx * majorEveryEff;
      const offXM = mod((-appState.scrollX) * zoom, majorStep);
      const offYM = mod((-appState.scrollY) * zoom, majorStep);
      for (let x = offXM; x <= w; x += majorStep) {
        const xx = Math.floor(x) + 0.5;
        ctx.moveTo(xx, 0);
        ctx.lineTo(xx, h);
      }
      for (let y = offYM; y <= h; y += majorStep) {
        const yy = Math.floor(y) + 0.5;
        ctx.moveTo(0, yy);
        ctx.lineTo(w, yy);
      }
      ctx.strokeStyle = majorColor;
      ctx.lineWidth = 1;
      ctx.setLineDash([]);
      ctx.stroke();
    }
  }, [excalidrawAPI, size, stepPx, majorEvery]);

  // subscribe to Excalidraw events to redraw on pan/zoom/resize
  useEffect(() => {
    if (!excalidrawAPI) return;
    let unsubScroll: (() => void) | null = null;
    let raf = 0;
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(() => { raf = 0; draw(); });
    };
    unsubScroll = excalidrawAPI.onScrollChange(() => schedule());
    const interval = window.setInterval(schedule, 150); // catch zoom/appState changes
    const onResize = () => schedule();
    window.addEventListener("resize", onResize);
    schedule();
    return () => {
      unsubScroll?.();
      window.clearInterval(interval);
      window.removeEventListener("resize", onResize);
    };
  }, [excalidrawAPI, draw]);

  // redraw when size changes
  useEffect(() => { draw(); }, [draw]);

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
