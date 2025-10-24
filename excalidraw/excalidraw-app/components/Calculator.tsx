import React, { useEffect, useMemo, useRef, useState } from "react";
import { evaluate, format } from "mathjs";

import "./Calculator.css";

interface CalculatorProps {
  onClose: () => void;
}

type ButtonToken =
  | { label: string; value: string; variant?: "operator" | "action"; span?: number }
  | { label: string; action: "clear" | "backspace" | "equals"; span?: number };

const BUTTON_LAYOUT: ButtonToken[][] = [
  [
    { label: "(", value: "(", variant: "operator" },
    { label: ")", value: ")", variant: "operator" },
    { label: "π", value: "pi", variant: "operator" },
    { label: "√", value: "sqrt(", variant: "operator" },
  ],
  [
    { label: "7", value: "7" },
    { label: "8", value: "8" },
    { label: "9", value: "9" },
    { label: "÷", value: "÷", variant: "operator" },
  ],
  [
    { label: "4", value: "4" },
    { label: "5", value: "5" },
    { label: "6", value: "6" },
    { label: "×", value: "×", variant: "operator" },
  ],
  [
    { label: "1", value: "1" },
    { label: "2", value: "2" },
    { label: "3", value: "3" },
    { label: "−", value: "-", variant: "operator" },
  ],
  [
    { label: "0", value: "0" },
    { label: ",", value: ".", variant: "operator" },
    { label: "+", value: "+", variant: "operator" },
    { label: "=", action: "equals" },
  ],
  [
    { label: "AC", action: "clear", span: 2 },
    { label: "⌫", action: "backspace", span: 2 },
  ],
];

const NORMALISE = (rawExpression: string) =>
  rawExpression
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/−/g, "-")
    .replace(/,/g, ".")
    .replace(/\s+/g, " ");

const Calculator: React.FC<CalculatorProps> = ({ onClose }) => {
  const [expression, setExpression] = useState("");
  const [result, setResult] = useState<string>("0");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const keyHandler = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key === "Enter" || event.key === "=") {
        event.preventDefault();
        evaluateExpression();
        return;
      }
      if (event.key === "Backspace") {
        event.preventDefault();
        setExpression((prev) => prev.slice(0, -1));
        setError(null);
        return;
      }
      if (event.key === "Delete") {
        event.preventDefault();
        clearExpression();
        return;
      }
    };

    window.addEventListener("keydown", keyHandler);
    return () => {
      window.removeEventListener("keydown", keyHandler);
    };
  });

  const clearExpression = () => {
    setExpression("");
    setResult("0");
    setError(null);
  };

  const appendToken = (token: string) => {
    setExpression((prev) => `${prev}${token}`);
    setError(null);
  };

  const handleInputChange = (value: string) => {
    setExpression(value);
    setError(null);
  };

  const evaluateExpression = () => {
    if (!expression.trim()) {
      setResult("0");
      setError(null);
      return;
    }

    try {
      const normalised = NORMALISE(expression);
      const value = evaluate(normalised);
      const formatted = typeof value === "number" ? format(value, { precision: 14 }) : String(value);
      setResult(formatted);
      setError(null);
    } catch (evaluationError) {
      console.error("Calculator evaluation error", evaluationError);
      setError("Błąd we wzorze");
    }
  };

  const previewValue = useMemo(() => {
    if (!expression.trim()) {
      return "0";
    }
    try {
      const normalised = NORMALISE(expression);
      const value = evaluate(normalised);
      if (typeof value === "number" && Number.isFinite(value)) {
        return format(value, { precision: 10 });
      }
      return String(value);
    } catch {
      return null;
    }
  }, [expression]);

  return (
    <div className="calculator-overlay" role="dialog" aria-modal="true" aria-label="Kalkulator">
      <div className="calculator-panel">
        <header className="calculator-header">
          <h2>Kalkulator</h2>
          <button className="calculator-close" onClick={onClose} aria-label="Zamknij kalkulator">
            ×
          </button>
        </header>

        <div className="calculator-display">
          <input
            ref={inputRef}
            className="calculator-expression"
            value={expression}
            onChange={(event) => handleInputChange(event.target.value)}
            placeholder="0"
            autoFocus
          />
          <div className={`calculator-result${error ? " calculator-result-error" : ""}`}>
            {error ?? previewValue ?? result}
          </div>
        </div>

        <div className="calculator-grid">
          {BUTTON_LAYOUT.flat().map((button, index) => {
            const key = `${button.label}-${index}`;
            if ("action" in button) {
              if (button.action === "clear") {
                return (
                  <button
                    key={key}
                    className="calculator-button calculator-button-action"
                    style={button.span ? { gridColumn: `span ${button.span}` } : undefined}
                    onClick={clearExpression}
                  >
                    {button.label}
                  </button>
                );
              }
              if (button.action === "backspace") {
                return (
                  <button
                    key={key}
                    className="calculator-button calculator-button-action"
                    style={button.span ? { gridColumn: `span ${button.span}` } : undefined}
                    onClick={() => {
                      setExpression((prev) => prev.slice(0, -1));
                      setError(null);
                    }}
                  >
                    {button.label}
                  </button>
                );
              }
              return (
                <button
                  key={key}
                  className="calculator-button calculator-button-equals"
                  style={button.span ? { gridColumn: `span ${button.span}` } : undefined}
                  onClick={evaluateExpression}
                >
                  {button.label}
                </button>
              );
            }

            return (
              <button
                key={key}
                className={`calculator-button${
                  button.variant === "operator" ? " calculator-button-operator" : ""
                }`}
                style={button.span ? { gridColumn: `span ${button.span}` } : undefined}
                onClick={() => appendToken(button.value)}
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

export default Calculator;
