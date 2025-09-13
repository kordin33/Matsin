// Calculator.tsx
import React, { useState, useEffect, useRef } from 'react';
import { create, all } from 'mathjs';
import copy from 'copy-to-clipboard';

const math = create(all, {
  number: 'Fraction',
  precision: 64,
});

interface CalculatorProps {
  onClose: () => void;
}

const Calculator: React.FC<CalculatorProps> = ({ onClose }) => {
  const [currentExpression, setCurrentExpression] = useState('');
  const [result, setResult] = useState('');
  const [isScientificMode, setIsScientificMode] = useState(false);
  const calculatorRef = useRef<HTMLDivElement>(null);

  const toggleScientificMode = () => {
    setIsScientificMode(!isScientificMode);
  };

  const inputDigit = (digit: string) => {
    setCurrentExpression((prev) => prev + digit);
  };

  const inputOperator = (op: string) => {
    let newExpr = currentExpression;
    if (op === '!') {
      if (newExpr && !/[\s(]$/.test(newExpr)) {
        newExpr += ' ';
      }
      newExpr += op;
    } else if (newExpr && !newExpr.endsWith(' ')) {
      newExpr += ' ' + op + ' ';
    } else {
      if (newExpr) {
        newExpr += op + ' ';
      } else {
        if (op === '-') {
          newExpr += op;
        } else {
          newExpr += op + ' ';
        }
      }
    }
    setCurrentExpression(newExpr);
  };

  const inputDecimal = () => {
    const segments = currentExpression.split(/[\s()]+/);
    const lastSegment = segments[segments.length - 1];
    if (lastSegment && !lastSegment.includes('.')) {
      setCurrentExpression((prev) => prev + '.');
    } else if (!lastSegment && currentExpression.trim() === '') {
      setCurrentExpression('0.');
    } else if (currentExpression.endsWith(' ')) {
      setCurrentExpression((prev) => prev + '0.');
    }
  };

  const inputParenthesis = (paren: string) => {
    setCurrentExpression((prev) => prev + paren);
  };

  const inputFunction = (func: string) => {
    setCurrentExpression((prev) => prev + func);
  };

  const inputConstant = (constant: string) => {
    let newExpr = currentExpression;
    if (newExpr && !/[\s(]$/.test(newExpr)) {
      newExpr += ' ';
    }
    newExpr += constant;
    setCurrentExpression(newExpr);
  };

  const clearAll = () => {
    setCurrentExpression('');
    setResult('');
  };

  const backspace = () => {
    let expr = currentExpression;
    if (expr.endsWith(' ')) {
      expr = expr.slice(0, -3);
    } else if (expr.length > 0) {
      expr = expr.slice(0, -1);
    }
    setCurrentExpression(expr);
  };

  const calculate = () => {
    if (!currentExpression) return;
    try {
      let expressionToProcess = currentExpression
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/[−–]/g, '-')
        .trim();

      let openParen = (expressionToProcess.match(/\(/g) || []).length;
      let closeParen = (expressionToProcess.match(/\)/g) || []).length;
      while (openParen > closeParen) {
        expressionToProcess += ')';
        closeParen++;
      }

      let simplifiedResult = null as any;
      try {
        simplifiedResult = math.simplify(expressionToProcess);
        const tempMath = create(all, { number: 'number' });
        const evaluatedSimplifiedValue = tempMath.evaluate(simplifiedResult.toString());
        const isSimple = typeof evaluatedSimplifiedValue === 'number' && isFinite(evaluatedSimplifiedValue);
        let finalSimple = isSimple;
        if (!isSimple && simplifiedResult.toString().includes('/')) {
          try {
            math.fraction(simplifiedResult.toString());
            finalSimple = true;
          } catch {}
        }

        if (finalSimple) {
          setResult(math.format(simplifiedResult, { fraction: 'ratio' }));
          return;
        } else {
          setResult(simplifiedResult.toString());
          return;
        }
      } catch (simplifyError) {
        console.warn('Simplification failed, falling back to fraction evaluation:', simplifyError);
      }

      const evalResult = math.evaluate(expressionToProcess);
      setResult(math.format(evalResult, { fraction: 'ratio' }));
    } catch (error) {
      console.error('Calculator error:', error);
      setResult('Error: ' + (error as Error).message);
    }
  };

  const copyResult = () => {
    if (result && !result.startsWith('Error')) {
      const success = copy(result);
      if (success) {
        console.log('Result copied!');
      } else {
        console.error('Failed to copy result');
      }
    }
  };

  const handleKeydown = (event: KeyboardEvent) => {
    const key = event.key;
    if (/\d/.test(key)) {
      inputDigit(key);
    } else if (key === '.') {
      inputDecimal();
    } else if (['+', '-', '*', '/', '%', '^', '!'].includes(key)) {
      inputOperator(key);
    } else if (key === '(' || key === ')') {
      inputParenthesis(key);
    } else if (key === 'Enter' || key === '=') {
      event.preventDefault();
      calculate();
    } else if (key === 'Backspace') {
      let expr = currentExpression;
      if (expr.endsWith(' ')) {
        expr = expr.slice(0, -3);
      } else {
        expr = expr.slice(0, -1);
      }
      setCurrentExpression(expr);
    } else if (key === 'Escape') {
      clearAll();
    }
  };

  useEffect(() => {
    calculatorRef.current?.focus();
    document.addEventListener('keydown', handleKeydown);
    return () => {
      document.removeEventListener('keydown', handleKeydown);
    };
  }, [currentExpression]); // Re-add listener on expression change if needed

  return (
    <div
      className={`calculator ${isScientificMode ? 'scientific-mode-active' : ''}`}
      tabIndex={0}
      ref={calculatorRef}
    >
      <div className="display">
        <div className="expression">{currentExpression || '\u00A0'}</div>
        <div className="result">{result || '0'}</div>
      </div>

      <div className={`buttons ${isScientificMode ? 'scientific-mode' : ''}`}>
        {/* Scientific Buttons */}
        <button onClick={() => inputFunction('sin(')} className="btn-sci sin">sin</button>
        <button onClick={() => inputFunction('cos(')} className="btn-sci cos">cos</button>
        <button onClick={() => inputFunction('tan(')} className="btn-sci tan">tan</button>
        <button onClick={() => inputFunction('log(')} className="btn-sci log">log</button>

        <button onClick={() => inputOperator('!')} className="btn-sci fact">n!</button>
        <button onClick={() => inputConstant('pi')} className="btn-sci pi">π</button>
        <button onClick={() => inputFunction('sqrt(')} className="btn-sci sqrt">√</button>
        <button onClick={() => inputOperator('^')} className="btn-sci pow">^</button>

        <button onClick={() => inputParenthesis('(')} className="btn-sci paren-l">(</button>
        <button onClick={() => inputParenthesis(')')} className="btn-sci paren-r">)</button>
        <button onClick={copyResult} title="Copy Result" className="btn-sci copy">Copy</button>
        <button onClick={toggleScientificMode} className="btn-sci toggle-basic">Basic</button>

        {/* Basic Buttons */}
        <button onClick={clearAll} className="btn-op ac">AC</button>
        <button onClick={() => inputOperator('/')} className="btn-op divide">÷</button>
        <button onClick={() => inputOperator('*')} className="btn-op multiply">×</button>
        <button onClick={backspace} className="btn-op backspace">⌫</button>

        <button onClick={() => inputDigit('7')} className="btn-digit seven">7</button>
        <button onClick={() => inputDigit('8')} className="btn-digit eight">8</button>
        <button onClick={() => inputDigit('9')} className="btn-digit nine">9</button>
        <button onClick={() => inputOperator('-')} className="btn-op subtract">−</button>

        <button onClick={() => inputDigit('4')} className="btn-digit four">4</button>
        <button onClick={() => inputDigit('5')} className="btn-digit five">5</button>
        <button onClick={() => inputDigit('6')} className="btn-digit six">6</button>
        <button onClick={() => inputOperator('+')} className="btn-op add">+</button>

        <button onClick={() => inputDigit('1')} className="btn-digit one">1</button>
        <button onClick={() => inputDigit('2')} className="btn-digit two">2</button>
        <button onClick={() => inputDigit('3')} className="btn-digit three">3</button>
        <button onClick={calculate} className="btn-equal">=</button>

        <button onClick={toggleScientificMode} className="btn-op sci-toggle">Sci</button>
        <button onClick={() => inputDigit('0')} className="btn-digit btn-zero">0</button>
        <button onClick={inputDecimal} className="btn-digit decimal">.</button>
      </div>
    </div>
  );
};

export default Calculator;

