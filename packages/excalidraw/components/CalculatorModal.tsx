import React, { useState } from "react";
import { Dialog } from "./Dialog";
import { t } from "../i18n";
import "./CalculatorModal.scss";

interface CalculatorModalProps {
  onClose: () => void;
}

export const CalculatorModal: React.FC<CalculatorModalProps> = ({ onClose }) => {
  const [display, setDisplay] = useState("0");
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  const inputNumber = (num: string) => {
    if (waitingForOperand) {
      setDisplay(num);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === "0" ? num : display + num);
    }
  };

  const inputOperation = (nextOperation: string) => {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operation) {
      const currentValue = previousValue || 0;
      const newValue = calculate(currentValue, inputValue, operation);

      setDisplay(String(newValue));
      setPreviousValue(newValue);
    }

    setWaitingForOperand(true);
    setOperation(nextOperation);
  };

  const calculate = (firstValue: number, secondValue: number, operation: string): number => {
    switch (operation) {
      case "+":
        return firstValue + secondValue;
      case "-":
        return firstValue - secondValue;
      case "×":
        return firstValue * secondValue;
      case "÷":
        return firstValue / secondValue;
      case "=":
        return secondValue;
      default:
        return secondValue;
    }
  };

  const performCalculation = () => {
    const inputValue = parseFloat(display);

    if (previousValue !== null && operation) {
      const newValue = calculate(previousValue, inputValue, operation);
      setDisplay(String(newValue));
      setPreviousValue(null);
      setOperation(null);
      setWaitingForOperand(true);
    }
  };

  const clearAll = () => {
    setDisplay("0");
    setPreviousValue(null);
    setOperation(null);
    setWaitingForOperand(false);
  };

  const clearEntry = () => {
    setDisplay("0");
  };

  const inputDecimal = () => {
    if (waitingForOperand) {
      setDisplay("0.");
      setWaitingForOperand(false);
    } else if (display.indexOf(".") === -1) {
      setDisplay(display + ".");
    }
  };

  const toggleSign = () => {
    if (display !== "0") {
      setDisplay(display.charAt(0) === "-" ? display.slice(1) : "-" + display);
    }
  };

  const inputPercent = () => {
    const value = parseFloat(display);
    setDisplay(String(value / 100));
  };

  return (
    <Dialog
      onCloseRequest={onClose}
      title={t("buttons.calculator")}
      size="small"
      className="calculator-modal"
    >
      <div className="calculator">
        <div className="calculator-display">
          <div className="calculator-display-value">{display}</div>
        </div>
        <div className="calculator-keypad">
          <div className="calculator-row">
            <button className="calculator-key calculator-key-function" onClick={clearAll}>
              AC
            </button>
            <button className="calculator-key calculator-key-function" onClick={clearEntry}>
              CE
            </button>
            <button className="calculator-key calculator-key-function" onClick={inputPercent}>
              %
            </button>
            <button className="calculator-key calculator-key-operator" onClick={() => inputOperation("÷")}>
              ÷
            </button>
          </div>
          <div className="calculator-row">
            <button className="calculator-key" onClick={() => inputNumber("7")}>
              7
            </button>
            <button className="calculator-key" onClick={() => inputNumber("8")}>
              8
            </button>
            <button className="calculator-key" onClick={() => inputNumber("9")}>
              9
            </button>
            <button className="calculator-key calculator-key-operator" onClick={() => inputOperation("×")}>
              ×
            </button>
          </div>
          <div className="calculator-row">
            <button className="calculator-key" onClick={() => inputNumber("4")}>
              4
            </button>
            <button className="calculator-key" onClick={() => inputNumber("5")}>
              5
            </button>
            <button className="calculator-key" onClick={() => inputNumber("6")}>
              6
            </button>
            <button className="calculator-key calculator-key-operator" onClick={() => inputOperation("-")}>
              -
            </button>
          </div>
          <div className="calculator-row">
            <button className="calculator-key" onClick={() => inputNumber("1")}>
              1
            </button>
            <button className="calculator-key" onClick={() => inputNumber("2")}>
              2
            </button>
            <button className="calculator-key" onClick={() => inputNumber("3")}>
              3
            </button>
            <button className="calculator-key calculator-key-operator" onClick={() => inputOperation("+")}>
              +
            </button>
          </div>
          <div className="calculator-row">
            <button className="calculator-key calculator-key-zero" onClick={() => inputNumber("0")}>
              0
            </button>
            <button className="calculator-key" onClick={inputDecimal}>
              .
            </button>
            <button className="calculator-key" onClick={toggleSign}>
              ±
            </button>
            <button className="calculator-key calculator-key-operator calculator-key-equals" onClick={performCalculation}>
              =
            </button>
          </div>
        </div>
      </div>
    </Dialog>
  );
};