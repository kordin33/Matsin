import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { evaluate, format } from "mathjs";

import "./CasioCalculator.scss";

type CalculatorButton =
  | { label: string; value: string; variant?: "operator"; span?: number }
  | { label: string; action: "clear" | "backspace" | "equals"; span?: number };

const BUTTONS: CalculatorButton[] = [
  { label: "(", value: "(", variant: "operator" },
  { label: ")", value: ")", variant: "operator" },
  { label: "π", value: "pi", variant: "operator" },
  { label: "√", value: "sqrt(", variant: "operator" },
  { label: "7", value: "7" },
  { label: "8", value: "8" },
  { label: "9", value: "9" },
  { label: "÷", value: "÷", variant: "operator" },
  { label: "4", value: "4" },
  { label: "5", value: "5" },
  { label: "6", value: "6" },
  { label: "×", value: "×", variant: "operator" },
  { label: "1", value: "1" },
  { label: "2", value: "2" },
  { label: "3", value: "3" },
  { label: "−", value: "-", variant: "operator" },
  { label: "0", value: "0", span: 2 },
  { label: ",", value: ".", variant: "operator" },
  { label: "+", value: "+", variant: "operator" },
  { label: "=", action: "equals", span: 2 },
  { label: "AC", action: "clear", span: 2 },
  { label: "⌫", action: "backspace", span: 2 },
];

const NORMALISE_EXPRESSION = (expression: string) =>
  expression
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/−/g, "-")
    .replace(/,/g, ".")
    .replace(/\s+/g, " ");

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

export interface CasioCalculatorProps {
  onClose: () => void;
}

const CasioCalculator: React.FC<CasioCalculatorProps> = ({ onClose }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  const [isReady, setIsReady] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [expression, setExpression] = useState("");
  const [result, setResult] = useState("0");
  const [error, setError] = useState<string | null>(null);

  const centerCalculator = () => {
    const element = containerRef.current;
    if (!element) {
      return;
    }
    const rect = element.getBoundingClientRect();
    const x = clamp(
      (window.innerWidth - rect.width) / 2,
      16,
      Math.max(16, window.innerWidth - rect.width - 16),
    );
    const y = clamp(
      (window.innerHeight - rect.height) / 2,
      24,
      Math.max(24, window.innerHeight - rect.height - 24),
    );
    setPosition({ x, y });
    setIsReady(true);
  };

  useLayoutEffect(() => {
    centerCalculator();
  }, []);

  useEffect(() => {
    if (!isDragging) {
      return;
    }

    const handleMove = (event: MouseEvent | TouchEvent) => {
      const point =
        event instanceof TouchEvent ? event.touches[0] : (event as MouseEvent);
      if (!point) {
        return;
      }

      const element = containerRef.current;
      if (!element) {
        return;
      }
      const rect = element.getBoundingClientRect();
      const maxX = Math.max(0, window.innerWidth - rect.width);
      const maxY = Math.max(0, window.innerHeight - rect.height);

      const x = clamp(
        point.clientX - dragOffsetRef.current.x,
        0,
        maxX,
      );
      const y = clamp(
        point.clientY - dragOffsetRef.current.y,
        0,
        maxY,
      );

      setPosition({ x, y });
      event.preventDefault();
    };

    const stopDragging = () => setIsDragging(false);

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", stopDragging);
    window.addEventListener("touchmove", handleMove, { passive: false });
    window.addEventListener("touchend", stopDragging);
    window.addEventListener("touchcancel", stopDragging);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", stopDragging);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", stopDragging);
      window.removeEventListener("touchcancel", stopDragging);
    };
  }, [isDragging]);

  useEffect(() => {
    const handleResize = () => centerCalculator();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      } else if (event.key === "Enter" || event.key === "=") {
        event.preventDefault();
        evaluateExpression();
      } else if (event.key === "Backspace") {
        event.preventDefault();
        setExpression((prev) => prev.slice(0, -1));
        setError(null);
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  });

  const appendValue = (value: string) => {
    setExpression((prev) => `${prev}${value}`);
    setError(null);
  };

  const clearExpression = () => {
    setExpression("");
    setResult("0");
    setError(null);
  };

  const evaluateExpression = () => {
    if (!expression.trim()) {
      setResult("0");
      setError(null);
      return;
    }

    try {
      const evaluated = evaluate(NORMALISE_EXPRESSION(expression));
      const formatted =
        typeof evaluated === "number"
          ? format(evaluated, { precision: 12 })
          : String(evaluated);
      setResult(formatted);
      setError(null);
    } catch (evaluationError) {
      console.error("Calculator evaluation error:", evaluationError);
      setError("Błąd we wzorze");
    }
  };

  const preview = useMemo(() => {
    if (!expression.trim()) {
      return "0";
    }

    try {
      const value = evaluate(NORMALISE_EXPRESSION(expression));
      if (typeof value === "number" && Number.isFinite(value)) {
        return format(value, { precision: 10 });
      }
      return String(value);
    } catch {
      return null;
    }
  }, [expression]);

  const startDragging = (event: React.MouseEvent | React.TouchEvent) => {
    const point =
      "touches" in event ? event.touches[0] : (event as React.MouseEvent);
    if (!point) {
      return;
    }
    dragOffsetRef.current = {
      x: point.clientX - position.x,
      y: point.clientY - position.y,
    };
    setIsDragging(true);
  };

  return (
    <div className="calculator-overlay" role="presentation">
      <div
        ref={containerRef}
        className={`calculator-container${isDragging ? " calculator-container--dragging" : ""}`}
        style={{
          transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
          opacity: isReady ? 1 : 0,
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Kalkulator"
      >
        <header
          className="calculator-header"
          onMouseDown={startDragging}
          onTouchStart={startDragging}
        >
          <h2>Kalkulator</h2>
          <button
            type="button"
            className="calculator-close"
            onClick={onClose}
            aria-label="Zamknij kalkulator"
          >
            ×
          </button>
        </header>

        <div className="calculator-display">
          <input
            className="calculator-input"
            value={expression}
            onChange={(event) => {
              setExpression(event.target.value);
              setError(null);
            }}
            placeholder="0"
            autoFocus
          />
          <div
            className={`calculator-preview${
              error ? " calculator-preview--error" : ""
            }`}
          >
            {error ?? preview ?? result}
          </div>
        </div>

        <div className="calculator-grid">
          {BUTTONS.map((button, index) => {
            const key = `${button.label}-${index}`;

            if ("action" in button) {
              const className =
                button.action === "equals"
                  ? "calculator-button calculator-button--equals"
                  : "calculator-button calculator-button--action";

              const onClick =
                button.action === "equals"
                  ? evaluateExpression
                  : button.action === "clear"
                    ? clearExpression
                    : () => {
                        setExpression((prev) => prev.slice(0, -1));
                        setError(null);
                      };

              return (
                <button
                  key={key}
                  type="button"
                  className={className}
                  style={
                    button.span ? { gridColumn: `span ${button.span}` } : undefined
                  }
                  onClick={onClick}
                >
                  {button.label}
                </button>
              );
            }

            return (
              <button
                key={key}
                type="button"
                className={`calculator-button${
                  button.variant === "operator"
                    ? " calculator-button--operator"
                    : ""
                }`}
                style={
                  button.span ? { gridColumn: `span ${button.span}` } : undefined
                }
                onClick={() => appendValue(button.value)}
              >
                {button.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CasioCalculator;

