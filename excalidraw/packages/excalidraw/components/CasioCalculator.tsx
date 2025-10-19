import React, { useMemo, useState } from "react";
import { evaluate, format } from "mathjs";
import {
  Calculator as CalculatorIcon,
  Binary,
  FileSpreadsheet,
  Grid3x3,
  Sigma,
  Table2,
  TrendingUp,
} from "lucide-react";

import "./CasioCalculator.scss";

type AngleMode = "DEG" | "RAD" | "GRAD";
type DisplayFormat = "NORM" | "SCI" | "FIX" | "ENG";
type ModeId =
  | "CALC"
  | "CMPLX"
  | "BASE-N"
  | "STAT"
  | "EQN"
  | "MATRIX"
  | "TABLE"
  | "SHEET";

type VariableKey = "A" | "B" | "C" | "D" | "E" | "F" | "X" | "Y" | "Z" | "M" | "Ans";

interface HistoryEntry {
  expr: string;
  result: string;
  mode: ModeId;
  timestamp: string;
}

type Variables = Record<VariableKey, number>;

type LucideIcon = React.ComponentType<{ size?: number; className?: string }>;

interface Mode {
  id: ModeId;
  name: string;
  description: string;
  Icon?: LucideIcon;
  badge?: string;
}

type CalcFunction =
  | "sin"
  | "cos"
  | "tan"
  | "asin"
  | "acos"
  | "atan"
  | "sinh"
  | "cosh"
  | "tanh"
  | "ln"
  | "log"
  | "exp"
  | "sqrt"
  | "cbrt"
  | "square"
  | "cube"
  | "inv"
  | "abs"
  | "fact";

export interface CasioCalculatorProps {
  onClose?: () => void;
}

const DISPLAY_FORMAT_SEQUENCE: DisplayFormat[] = ["NORM", "SCI", "FIX", "ENG"];
const ANGLE_MODE_SEQUENCE: AngleMode[] = ["DEG", "RAD", "GRAD"];

const DEFAULT_VARIABLES: Variables = {
  A: 0,
  B: 0,
  C: 0,
  D: 0,
  E: 0,
  F: 0,
  X: 0,
  Y: 0,
  Z: 0,
  M: 0,
  Ans: 0,
};

const MAX_HISTORY_ITEMS = 50;

const rotate = <T,>(items: T[], current: T) => {
  const index = items.indexOf(current);
  if (index === -1) {
    return items[0];
  }
  return items[(index + 1) % items.length];
};

const factorial = (value: number): number => {
  if (value < 0 || !Number.isInteger(value)) {
    return Number.NaN;
  }
  if (value <= 1) {
    return 1;
  }
  return value * factorial(value - 1);
};

const formatNumber = (value: number, mode: DisplayFormat): string => {
  if (!Number.isFinite(value)) {
    return value.toString();
  }

  if (mode === "SCI") {
    return value.toExponential(8);
  }

  if (mode === "ENG") {
    if (value === 0) {
      return "0";
    }
    const exponent = Math.floor(Math.log10(Math.abs(value)) / 3) * 3;
    const mantissa = value / Math.pow(10, exponent);
    return `${mantissa.toFixed(6)}E${exponent}`;
  }

  if (mode === "FIX") {
    return value.toFixed(4);
  }

  if (Math.abs(value) < 0.00001 || Math.abs(value) > 1e10) {
    return value.toExponential(8);
  }

  return value.toString();
};

const sanitizeExpression = (expression: string, variables: Variables) => {
  return expression
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/π/g, "pi")
    .replace(/√/g, "sqrt")
    .replace(/Ans/g, variables.Ans.toString());
};

const CasioCalculator: React.FC<CasioCalculatorProps> = () => {
  const [display, setDisplay] = useState<string>("0");
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [mode, setMode] = useState<ModeId>("CALC");
  const [angleMode, setAngleMode] = useState<AngleMode>("DEG");
  const [displayFormat, setDisplayFormat] = useState<DisplayFormat>("NORM");
  const [showMenu, setShowMenu] = useState(false);
  const [showCatalog, setShowCatalog] = useState(false);
  const [variables, setVariables] = useState<Variables>(DEFAULT_VARIABLES);

  const modes = useMemo<Mode[]>(
    () => [
      { id: "CALC", name: "Calculate", description: "Podstawowe", Icon: CalculatorIcon },
      { id: "CMPLX", name: "Complex", description: "Zespolone", badge: "ℂ" },
      { id: "BASE-N", name: "Base-N", description: "Systemy", Icon: Binary },
      { id: "STAT", name: "Statistics", description: "Statystyka", Icon: TrendingUp },
      { id: "EQN", name: "Equation", description: "Równania", Icon: Sigma },
      { id: "MATRIX", name: "Matrix", description: "Macierze", Icon: Grid3x3 },
      { id: "TABLE", name: "Table", description: "Tabele", Icon: Table2 },
      { id: "SHEET", name: "Sheet", description: "Arkusz", Icon: FileSpreadsheet },
    ],
    [],
  );

  const constants = useMemo(
    () => ({
      π: Math.PI,
      e: Math.E,
      φ: (1 + Math.sqrt(5)) / 2,
      c: 299_792_458,
      h: 6.626_070_15e-34,
      G: 6.6743e-11,
      NA: 6.022_140_76e23,
      R: 8.314_462_618,
      k: 1.380_649e-23,
    }),
    [],
  );

  const appendToDisplay = (value: string) => {
    setDisplay((prev) => {
      if (prev === "0" || prev === "Math ERROR") {
        return value;
      }
      return `${prev}${value}`;
    });
  };

  const addToHistory = (expr: string, resultValue: string) => {
    setHistory((prev) => {
      const next: HistoryEntry[] = [
        {
          expr,
          result: resultValue,
          mode,
          timestamp: new Date().toLocaleTimeString(),
        },
        ...prev,
      ];
      return next.slice(0, MAX_HISTORY_ITEMS);
    });
  };

  const calculate = () => {
    const expr = display;
    try {
      const processed = sanitizeExpression(expr, variables);
      const scope = { ...variables };
      const result = evaluate(processed, scope);

      let numericResult: number | null = null;

      if (typeof result === "number") {
        numericResult = result;
      } else if (typeof result === "string") {
        const parsed = Number(result);
        numericResult = Number.isNaN(parsed) ? null : parsed;
      }

      const formatted =
        numericResult !== null
          ? formatNumber(numericResult, displayFormat)
          : format(result, { precision: 10 });

      if (numericResult !== null) {
        setVariables((prev) => ({ ...prev, Ans: numericResult! }));
      }

      addToHistory(expr, formatted);
      setDisplay(formatted);
    } catch (error) {
      setDisplay("Math ERROR");
      window.setTimeout(() => setDisplay("0"), 1500);
    }
  };

  const handleFunction = (fn: CalcFunction) => {
    const parsed = Number.parseFloat(display);
    if (!Number.isFinite(parsed)) {
      setDisplay("Math ERROR");
      return;
    }

    const toRadians = (value: number) => {
      if (angleMode === "DEG") {
        return (value * Math.PI) / 180;
      }
      if (angleMode === "GRAD") {
        return (value * Math.PI) / 200;
      }
      return value;
    };

    const fromRadians = (value: number) => {
      if (angleMode === "DEG") {
        return (value * 180) / Math.PI;
      }
      if (angleMode === "GRAD") {
        return (value * 200) / Math.PI;
      }
      return value;
    };

    let result: number;

    switch (fn) {
      case "sin":
        result = Math.sin(toRadians(parsed));
        break;
      case "cos":
        result = Math.cos(toRadians(parsed));
        break;
      case "tan":
        result = Math.tan(toRadians(parsed));
        break;
      case "asin":
        result = fromRadians(Math.asin(parsed));
        break;
      case "acos":
        result = fromRadians(Math.acos(parsed));
        break;
      case "atan":
        result = fromRadians(Math.atan(parsed));
        break;
      case "sinh":
        result = Math.sinh(parsed);
        break;
      case "cosh":
        result = Math.cosh(parsed);
        break;
      case "tanh":
        result = Math.tanh(parsed);
        break;
      case "ln":
        result = Math.log(parsed);
        break;
      case "log":
        result = Math.log10(parsed);
        break;
      case "exp":
        result = Math.exp(parsed);
        break;
      case "sqrt":
        result = Math.sqrt(parsed);
        break;
      case "cbrt":
        result = Math.cbrt(parsed);
        break;
      case "square":
        result = parsed * parsed;
        break;
      case "cube":
        result = parsed * parsed * parsed;
        break;
      case "inv":
        result = 1 / parsed;
        break;
      case "abs":
        result = Math.abs(parsed);
        break;
      case "fact":
        result = factorial(Math.floor(parsed));
        break;
      default:
        return;
    }

    if (!Number.isFinite(result)) {
      setDisplay("Math ERROR");
      return;
    }

    const formatted = formatNumber(result, displayFormat);
    addToHistory(`${fn}(${parsed})`, formatted);
    setDisplay(formatted);
    setVariables((prev) => ({ ...prev, Ans: result }));
  };

  const clearAll = () => {
    setDisplay("0");
    setShowCatalog(false);
    setShowMenu(false);
  };

  const backspace = () => {
    setDisplay((prev) => {
      if (prev === "Math ERROR") {
        return "0";
      }
      if (prev.length <= 1) {
        return "0";
      }
      return prev.slice(0, -1);
    });
  };

  const selectConstant = (value: number) => {
    appendToDisplay(formatNumber(value, displayFormat));
    setShowCatalog(false);
  };

  return (
    <div className="casio-calculator" role="application" aria-label="Casio fx-991CW inspired calculator">
      <header className="casio-header">
        <div className="casio-brand">
          <span className="casio-brand__name">CASIO</span>
          <span className="casio-brand__model">fx-991CW ClassWiz</span>
        </div>
        <div className="casio-header__actions">
          <button
            type="button"
            className="casio-header__button"
            onClick={() => setShowCatalog((value) => !value)}
            aria-label="Stałe"
          >
            Σ
          </button>
          <button
            type="button"
            className="casio-header__button"
            onClick={() => setShowMenu((value) => !value)}
            aria-label="Tryby"
          >
            MENU
          </button>
        </div>
      </header>

      {showMenu && (
        <div className="casio-mode-selector">
          <div className="casio-mode-grid">
            {modes.map(({ id, name, description, Icon, badge }) => (
              <button
                key={id}
                type="button"
                className={`casio-mode-card${id === mode ? " casio-mode-card--active" : ""}`}
                onClick={() => {
                  setMode(id);
                  setShowMenu(false);
                }}
              >
                <div className="casio-mode-card__icon">
                  {Icon ? <Icon size={24} /> : <span>{badge}</span>}
                </div>
                <div className="casio-mode-card__name">{name}</div>
                <div className="casio-mode-card__desc">{description}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {showCatalog && (
        <div className="casio-catalog">
          <div className="casio-catalog__header">
            <span>Stałe</span>
            <button
              type="button"
              onClick={() => setShowCatalog(false)}
              className="casio-catalog__close"
              aria-label="Zamknij katalog stałych"
            >
              ×
            </button>
          </div>
          <div className="casio-catalog__grid">
            {Object.entries(constants).map(([symbol, value]) => (
              <button
                key={symbol}
                type="button"
                className="casio-catalog__item"
                onClick={() => selectConstant(value)}
              >
                <span className="casio-catalog__symbol">{symbol}</span>
                <span className="casio-catalog__value">{formatNumber(value, displayFormat)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="casio-status-bar">
        <span className="casio-status-pill casio-status-pill--mode">{mode}</span>
        <span className="casio-status-pill">{angleMode}</span>
        <span className="casio-status-pill">{displayFormat}</span>
      </div>

      <div className="casio-display">
        <div className="casio-display__value">{display}</div>
        <div className="casio-display__footer">
          Ans = {formatNumber(variables.Ans, displayFormat)}
        </div>
      </div>

      <div className="casio-history">
        {history.slice(0, 3).map((item) => (
          <button
            key={`${item.timestamp}-${item.expr}`}
            type="button"
            className="casio-history__item"
            onClick={() => setDisplay(item.result)}
          >
            {item.result}
          </button>
        ))}
      </div>

      <div className="casio-control-grid">
        <button
          type="button"
          className="casio-control-button"
          onClick={() => setAngleMode((prev) => rotate(ANGLE_MODE_SEQUENCE, prev))}
        >
          {angleMode}
        </button>
        <button
          type="button"
          className="casio-control-button"
          onClick={() => setDisplayFormat((prev) => rotate(DISPLAY_FORMAT_SEQUENCE, prev))}
        >
          {displayFormat}
        </button>
      </div>

      <div className="casio-science">
        <div className="casio-science__row">
          <CalculatorButton label="sin" onClick={() => handleFunction("sin")} variant="function" />
          <CalculatorButton label="cos" onClick={() => handleFunction("cos")} variant="function" />
          <CalculatorButton label="tan" onClick={() => handleFunction("tan")} variant="function" />
          <CalculatorButton label="ln" onClick={() => handleFunction("ln")} variant="function" />
          <CalculatorButton label="log" onClick={() => handleFunction("log")} variant="function" />
        </div>
        <div className="casio-science__row">
          <CalculatorButton label="sin-1" onClick={() => handleFunction("asin")} variant="function" />
          <CalculatorButton label="cos-1" onClick={() => handleFunction("acos")} variant="function" />
          <CalculatorButton label="tan-1" onClick={() => handleFunction("atan")} variant="function" />
          <CalculatorButton label="exp" onClick={() => handleFunction("exp")} variant="function" />
          <CalculatorButton label="10^" onClick={() => appendToDisplay("10^")} variant="function" />
        </div>
        <div className="casio-science__row">
          <CalculatorButton label="x^2" onClick={() => handleFunction("square")} variant="function" />
          <CalculatorButton label="x^3" onClick={() => handleFunction("cube")} variant="function" />
          <CalculatorButton label="sqrt" onClick={() => handleFunction("sqrt")} variant="function" />
          <CalculatorButton label="cbrt" onClick={() => handleFunction("cbrt")} variant="function" />
          <CalculatorButton label="n!" onClick={() => handleFunction("fact")} variant="function" />
        </div>
        <div className="casio-science__row">
          <CalculatorButton label="(" onClick={() => appendToDisplay("(")} variant="bracket" />
          <CalculatorButton label=")" onClick={() => appendToDisplay(")")} variant="bracket" />
          <CalculatorButton label="|x|" onClick={() => handleFunction("abs")} variant="function" />
          <CalculatorButton label="1/x" onClick={() => handleFunction("inv")} variant="function" />
          <CalculatorButton label="Ans" onClick={() => appendToDisplay("Ans")} variant="function" />
        </div>
      </div>

      <div className="casio-keypad">
        <div className="casio-keypad__row">
          <CalculatorButton label="AC" onClick={clearAll} variant="clear" />
          <CalculatorButton label="DEL" onClick={backspace} variant="delete" />
          <CalculatorButton label="(" onClick={() => appendToDisplay("(")} variant="bracket" />
          <CalculatorButton label=")" onClick={() => appendToDisplay(")")} variant="bracket" />
        </div>
        <div className="casio-keypad__row">
          <CalculatorButton label="7" onClick={() => appendToDisplay("7")} variant="number" />
          <CalculatorButton label="8" onClick={() => appendToDisplay("8")} variant="number" />
          <CalculatorButton label="9" onClick={() => appendToDisplay("9")} variant="number" />
          <CalculatorButton label="÷" onClick={() => appendToDisplay("÷")} variant="operator" />
        </div>
        <div className="casio-keypad__row">
          <CalculatorButton label="4" onClick={() => appendToDisplay("4")} variant="number" />
          <CalculatorButton label="5" onClick={() => appendToDisplay("5")} variant="number" />
          <CalculatorButton label="6" onClick={() => appendToDisplay("6")} variant="number" />
          <CalculatorButton label="×" onClick={() => appendToDisplay("×")} variant="operator" />
        </div>
        <div className="casio-keypad__row">
          <CalculatorButton label="1" onClick={() => appendToDisplay("1")} variant="number" />
          <CalculatorButton label="2" onClick={() => appendToDisplay("2")} variant="number" />
          <CalculatorButton label="3" onClick={() => appendToDisplay("3")} variant="number" />
          <CalculatorButton label="-" onClick={() => appendToDisplay("-")} variant="operator" />
        </div>
        <div className="casio-keypad__row">
          <CalculatorButton label="0" onClick={() => appendToDisplay("0")} variant="number" />
          <CalculatorButton label="." onClick={() => appendToDisplay(".")} variant="number" />
          <CalculatorButton label="π" onClick={() => appendToDisplay("π")} variant="constant" />
          <CalculatorButton label="+" onClick={() => appendToDisplay("+")} variant="operator" />
        </div>
        <div className="casio-keypad__row casio-keypad__row--full">
          <CalculatorButton label="=" onClick={calculate} variant="execute" />
        </div>
      </div>
    </div>
  );
};

interface CalculatorButtonProps {
  label: React.ReactNode;
  onClick: () => void;
  variant?:
    | "number"
    | "operator"
    | "function"
    | "constant"
    | "clear"
    | "delete"
    | "execute"
    | "bracket";
}

const CalculatorButton: React.FC<CalculatorButtonProps> = ({ label, onClick, variant }) => {
  const classNames = ["casio-btn"];
  if (variant) {
    classNames.push(`casio-btn--${variant}`);
  }
  return (
    <button type="button" className={classNames.join(" ")} onClick={onClick}>
      {label}
    </button>
  );
};

export default CasioCalculator;

