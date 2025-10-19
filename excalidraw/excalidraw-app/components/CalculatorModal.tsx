import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { t } from "@excalidraw/excalidraw/i18n";

import Calculator from "./Calculator";

import "./CalculatorModal.scss";

interface CalculatorModalProps {
  visible: boolean;
  onUpdateVisible: (visible: boolean) => void;
}

const INITIAL_POSITION = { x: 24, y: 24 };
const BASE_WIDTH = 320;
const BASE_HEIGHT = 420;
const VIEWPORT_PADDING = 12;
const GRID_STEP = 16;

const CalculatorModal: React.FC<CalculatorModalProps> = ({ visible, onUpdateVisible }) => {
  const [position, setPosition] = useState(INITIAL_POSITION);
  const [dragging, setDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const winRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const measureAndScale = useCallback(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const rect = winRef.current?.getBoundingClientRect();
    const assumedHeight = rect?.height || BASE_HEIGHT;
    const nextScale = Math.min(
      1,
      (vw - VIEWPORT_PADDING * 2) / BASE_WIDTH,
      (vh - VIEWPORT_PADDING * 2) / assumedHeight,
    );
    setScale(Math.max(0.75, nextScale));
  }, []);

  const clampToViewport = useCallback(
    (rawX: number, rawY: number) => {
      const rect = winRef.current?.getBoundingClientRect();
      const width = rect?.width ?? BASE_WIDTH * scale;
      const height = rect?.height ?? BASE_HEIGHT * scale;
      const maxX = Math.max(VIEWPORT_PADDING, window.innerWidth - width - VIEWPORT_PADDING);
      const maxY = Math.max(VIEWPORT_PADDING, window.innerHeight - height - VIEWPORT_PADDING);
      const clamp = (value: number, maxValue: number) =>
        Math.min(maxValue, Math.max(VIEWPORT_PADDING, value));
      const snappedX = Math.round(clamp(rawX, maxX) / GRID_STEP) * GRID_STEP;
      const snappedY = Math.round(clamp(rawY, maxY) / GRID_STEP) * GRID_STEP;
      return {
        x: Math.min(maxX, Math.max(VIEWPORT_PADDING, snappedX)),
        y: Math.min(maxY, Math.max(VIEWPORT_PADDING, snappedY)),
      };
    },
    [scale],
  );

  useEffect(() => {
    if (visible) {
      measureAndScale();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const width = BASE_WIDTH * scale;
      const height = BASE_HEIGHT * scale;
      setPosition(clampToViewport((vw - width) / 2, (vh - height) / 3));
    }
  }, [visible, clampToViewport, measureAndScale, scale]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onUpdateVisible(false);
      }
    };

    if (visible) {
      document.addEventListener("keydown", onKey);
      window.addEventListener("resize", measureAndScale);
      return () => {
        document.removeEventListener("keydown", onKey);
        window.removeEventListener("resize", measureAndScale);
      };
    }
  }, [visible, onUpdateVisible, measureAndScale]);

  const beginDrag = (clientX: number, clientY: number) => {
    setDragging(true);
    const rect = winRef.current?.getBoundingClientRect();
    dragOffset.current = {
      x: clientX - (rect?.left ?? 0),
      y: clientY - (rect?.top ?? 0),
    };
  };

  const handlePointerMove = (clientX: number, clientY: number) => {
    if (!dragging) {
      return;
    }
    const x = clientX - dragOffset.current.x;
    const y = clientY - dragOffset.current.y;
    setPosition(clampToViewport(x, y));
  };

  const handleMouseDown = (event: React.MouseEvent) => {
    event.preventDefault();
    beginDrag(event.clientX, event.clientY);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const handleTouchStart = (event: React.TouchEvent) => {
    const touch = event.touches[0];
    beginDrag(touch.clientX, touch.clientY);
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd);
  };

  const onMouseMove = (event: MouseEvent) => {
    handlePointerMove(event.clientX, event.clientY);
  };

  const onTouchMove = (event: TouchEvent) => {
    const touch = event.touches[0];
    handlePointerMove(touch.clientX, touch.clientY);
    event.preventDefault();
  };

  const stopDragging = () => {
    setDragging(false);
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
    window.removeEventListener("touchmove", onTouchMove);
    window.removeEventListener("touchend", onTouchEnd);
  };

  const onMouseUp = () => {
    stopDragging();
  };

  const onTouchEnd = () => {
    stopDragging();
  };

  if (!visible) {
    return null;
  }

  return createPortal(
    <div
      className={`calc-window calculator-modal${dragging ? " is-dragging" : ""}`}
      ref={winRef}
      style={{
        transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
        transformOrigin: "top left",
      }}
      role="dialog"
      aria-label={t("buttons.calculator") || "Calculator"}
    >
      <div
        className="calc-header"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <div className="calc-title">{t("buttons.calculator") || "Calculator"}</div>
        <button
          className="calc-close"
          onClick={() => onUpdateVisible(false)}
          aria-label="Close calculator"
          type="button"
        >
          &times;
        </button>
      </div>
      <div className="calc-body">
        <Calculator onClose={() => onUpdateVisible(false)} />
      </div>
    </div>,
    document.body,
  );
};

export default CalculatorModal;
