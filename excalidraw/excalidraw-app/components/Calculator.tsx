import React, { useEffect, useRef, useState } from "react";
import { create, all } from "mathjs";
import copy from "copy-to-clipboard";

const math = create(all, {
  number: "Fraction",
  precision: 64,
});

const numberEngine = create(all, { number: "number" });

interface CalculatorProps {
  onClose: () => void;
}

const NORMALISE = (expression: string) =>
  expression
    .replace(/\u00d7/g, "*") // ×
    .replace(/\u00f7/g, "/") // ÷
    .replace(/\u2212/g, "-") // −
    .replace(/\u2013|\u2014/g, "-");

const Calculator: React.FC<CalculatorProps> = () => {
  const [currentExpression, setCurrentExpression] = useState("");
  const [result, setResult] = useState("");
  const [isScientificMode, setIsScientificMode] = useState(false);
  const calculatorRef = useRef<HTMLDivElement>(null);

  const toggleScientificMode = () => setIsScientificMode((prev) => !prev);

  const inputDigit = (digit: string) => {
    setCurrentExpression((prev) => prev + digit);
  };

  const inputOperator = (operator: string) => {
    setCurrentExpression((prev) => {
      if (!prev) {
        return operator === "-" || operator === "\u2212" ? operator : prev;
      }
      if (prev.endsWith(" ")) {
        return prev + operator + " ";
      }
      return `${prev} ${operator} `;
    });
  };

  const inputDecimal = () => {
    setCurrentExpression((prev) => {
      const segments = prev.split(/[\s()]+/);
      const lastSegment = segments[segments.length - 1];
      if (!lastSegment) {
        return prev ? `${prev}0.` : "0.";
      }
      if (!lastSegment.includes(".")) {
        return prev + ".";
      }
      return prev;
    });
  };

  const inputParenthesis = (paren: string) => {
    setCurrentExpression((prev) => prev + paren);
  };

  const inputFunction = (fn: string) => {
    setCurrentExpression((prev) => prev + fn);
  };

  const inputConstant = (constant: string) => {
    setCurrentExpression((prev) => {
      if (prev && !/[\s(]$/.test(prev)) {
        return `${prev} ${constant}`;
      }
      return prev + constant;
    });
  };

  const clearAll = () => {
    setCurrentExpression("");
    setResult("");
  };

  const backspace = () => {
    setCurrentExpression((prev) => {
      if (prev.endsWith(" ")) {
        return prev.slice(0, -3);
      }
      return prev.slice(0, -1);
    });
  };

  const calculate = () => {
    if (!currentExpression) {
      return;
    }
    try {
      let expressionToProcess = NORMALISE(currentExpression.trim());

      let openParen = (expressionToProcess.match(/\(/g) || []).length;
      let closeParen = (expressionToProcess.match(/\)/g) || []).length;
      while (openParen > closeParen) {
        expressionToProcess += ")";
        closeParen++;
      }

      try {
        const simplified = math.simplify(expressionToProcess);
        const simplifiedValue = numberEngine.evaluate(simplified.toString());
        const isFiniteNumber = typeof simplifiedValue === "number" && Number.isFinite(simplifiedValue);
        if (isFiniteNumber) {
          setResult(math.format(simplified, { fraction: "ratio" }));
          return;
        }
        setResult(simplified.toString());
        return;
      } catch (simplifyError) {
        console.warn("Simplification failed, falling back to evaluation:", simplifyError);
      }

      const evaluated = math.evaluate(expressionToProcess);
      setResult(math.format(evaluated, { fraction: "ratio" }));
    } catch (error) {
      console.error("Calculator error:", error);
      const message = error instanceof Error ? error.message : "Unknown error";
      setResult(`Error: ${message}`);
    }
  };

  const copyResult = () => {
    if (result && !result.startsWith("Error")) {
      const success = copy(result);
      if (!success) {
        console.error("Failed to copy result");
      }
    }
  };

  const handleKeydown = (event: KeyboardEvent) => {
    const key = event.key;
    if (/\d/.test(key)) {
      inputDigit(key);
      return;
    }
    if (key === ".") {
      inputDecimal();
      return;
    }
    if (["+", "-", "*", "/", "%", "^", "!"].includes(key)) {
      inputOperator(key);
      return;
    }
    if (key === "(" || key === ")") {
      inputParenthesis(key);
      return;
    }
    if (key === "Enter" || key === "=") {
      event.preventDefault();
      calculate();
      return;
    }
    if (key === "Backspace") {
      backspace();
      return;
    }
    if (key === "Escape") {
      clearAll();
    }
  };

  useEffect(() => {
    calculatorRef.current?.focus();
    document.addEventListener("keydown", handleKeydown);
    return () => {
      document.removeEventListener("keydown", handleKeydown);
    };
  }, [currentExpression]);

  return (
    <div
      className={`calculator${isScientificMode ? " scientific-mode-active" : ""}`}
      tabIndex={0}
      ref={calculatorRef}
    >
      <div className="display">
        <div className="expression">{currentExpression || "\u00a0"}</div>
        <div className="result">{result || "0"}</div>
      </div>

      <div className={`buttons${isScientificMode ? " scientific-mode" : ""}`}>
        <button onClick={() => inputFunction("sin(")} className="btn-sci sin">
          sin
        </button>
        <button onClick={() => inputFunction("cos(")} className="btn-sci cos">
          cos
        </button>
        <button onClick={() => inputFunction("tan(")} className="btn-sci tan">
          tan
        </button>
        <button onClick={() => inputFunction("log(")} className="btn-sci log">
          log
        </button>

        <button onClick={() => inputOperator("!")} className="btn-sci fact">
          n!
        </button>
        <button onClick={() => inputConstant("pi")} className="btn-sci pi">
          \u03c0
        </button>
        <button onClick={() => inputFunction("sqrt(")} className="btn-sci sqrt">
          \u221a
        </button>
        <button onClick={() => inputOperator("^")} className="btn-sci pow">
          ^
        </button>

        <button onClick={() => inputParenthesis("(")} className="btn-sci paren-l">
          (
        </button>
        <button onClick={() => inputParenthesis(")")} className="btn-sci paren-r">
          )
        </button>
        <button onClick={copyResult} title="Copy result" className="btn-sci copy">
          Copy
        </button>
        <button onClick={toggleScientificMode} className="btn-sci toggle-basic">
          Basic
        </button>

        <button onClick={clearAll} className="btn-op ac">
          AC
        </button>
        <button onClick={() => inputOperator("\u00f7")} className="btn-op divide">
          \u00f7
        </button>
        <button onClick={() => inputOperator("\u00d7")} className="btn-op multiply">
          \u00d7
        </button>
        <button onClick={backspace} className="btn-op backspace" title="Backspace">
          \u232b
        </button>

        <button onClick={() => inputDigit("7")} className="btn-digit seven">
          7
        </button>
        <button onClick={() => inputDigit("8")} className="btn-digit eight">
          8
        </button>
        <button onClick={() => inputDigit("9")} className="btn-digit nine">
          9
        </button>
        <button onClick={() => inputOperator("\u2212")} className="btn-op subtract">
          \u2212
        </button>

        <button onClick={() => inputDigit("4")} className="btn-digit four">
          4
        </button>
        <button onClick={() => inputDigit("5")} className="btn-digit five">
          5
        </button>
        <button onClick={() => inputDigit("6")} className="btn-digit six">
          6
        </button>
        <button onClick={() => inputOperator("+")} className="btn-op add">
          +
        </button>

        <button onClick={() => inputDigit("1")} className="btn-digit one">
          1
        </button>
        <button onClick={() => inputDigit("2")} className="btn-digit two">
          2
        </button>
        <button onClick={() => inputDigit("3")} className="btn-digit three">
          3
        </button>
        <button onClick={calculate} className="btn-equal">
          =
        </button>

        <button onClick={toggleScientificMode} className="btn-op sci-toggle">
          Sci
        </button>
        <button onClick={() => inputDigit("0")} className="btn-digit btn-zero">
          0
        </button>
        <button onClick={inputDecimal} className="btn-digit decimal">
          .
        </button>
      </div>
    </div>
  );
};

export default Calculator;
