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
        .replace(/−/g, '-')
        .trim();

      let openParen = (expressionToProcess.match(/\(/g) || []).length;
      let closeParen = (expressionToProcess.match(/\)/g) || []).length;
      while (openParen > closeParen) {
        expressionToProcess += ')';
        closeParen++;
      }

      let simplifiedResult = null;
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
      className={`container container--inline`}
    >
      <div className="glass-container glass-container--rounded glass-container--large">
        <div className="glass-filter"></div>
        <div className="glass-overlay"></div>
        <div className="glass-specular"></div>
        <div className="glass-content glass-content--inline">
          <div
            className={`calculator ${isScientificMode ? 'scientific-mode-active' : ''}`}
            tabIndex={0}
            ref={calculatorRef}
          >
            <button className="internal-close-btn" onClick={onClose}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M6 6L18 18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

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
              <button onClick={copyResult} title="Copy Result" className="btn-sci copy">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 4H6C5.46957 4 4.96086 4.21071 4.58579 4.58579C4.21071 4.96086 4 5.46957 4 6V18C4 18.5304 4.21071 19.0391 4.58579 19.4142C4.96086 19.7893 5.46957 20 6 20H18C18.5304 20 19.0391 19.7893 19.4142 19.4142C19.7893 19.0391 20 18.5304 20 18V16" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M20 8V4C20 3.46957 19.7893 2.96086 19.4142 2.58579C19.0391 2.21071 18.5304 2 18 2H10C9.46957 2 8.96086 2.21071 8.58579 2.58579C8.21071 2.96086 8 3.46957 8 4V8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M20 2L4 18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <button onClick={toggleScientificMode} className="btn-sci toggle-basic">Basic</button>

              {/* Basic Buttons */}
              <button onClick={clearAll} className="btn-op ac">AC</button>
              <button onClick={() => inputOperator('/')} className="btn-op divide">÷</button>
              <button onClick={() => inputOperator('*')} className="btn-op multiply">×</button>
              <button onClick={backspace} className="btn-op backspace">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 6H21" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M19 6V20C19 21 18 22 17 22H7C6 22 5 21 5 20V6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8 6V4C8 3 9 2 10 2H14C15 2 16 3 16 4V6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M10 11V17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M14 11V17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

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
        </div>
      </div>
      <div className="container">
        <div className="glass-container">
          <div className="glass-filter"></div>
          <div className="glass-overlay"></div>
          <div className="glass-specular"></div>
          <svg style={{ display: 'none' }}>
            <filter id="lg-dist" x="0%" y="0%" width="100%" height="100%">
              <feTurbulence type="fractalNoise" baseFrequency="0.008 0.008" numOctaves="2" seed="92" result="noise" />
              <feGaussianBlur in="noise" stdDeviation="2" result="blurred" />
              <feDisplacementMap in="SourceGraphic" in2="blurred" scale="70" xChannelSelector="R" yChannelSelector="G" />
            </filter>
          </svg>
        </div>
      </div>
    </div>
  );
};

export default Calculator;