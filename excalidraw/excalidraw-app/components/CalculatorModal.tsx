// CalculatorModal.tsx
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { t } from '@excalidraw/excalidraw/i18n';
import Calculator from './Calculator';
import './CalculatorModal.scss';

interface CalculatorModalProps {
  visible: boolean;
  onUpdateVisible: (visible: boolean) => void;
}

const startPos = { x: 0, y: 0 };

const CalculatorModal: React.FC<CalculatorModalProps> = ({ visible, onUpdateVisible }) => {
  const [position, setPosition] = useState(startPos);
  const [dragging, setDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const winRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (visible) {
      // center roughly on open
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const width = 380;
      const height = 460;
      setPosition({ x: Math.max(16, (vw - width) / 2), y: Math.max(16, (vh - height) / 3) });
    }
  }, [visible]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onUpdateVisible(false);
    };
    if (visible) {
      document.addEventListener('keydown', onKey);
      return () => document.removeEventListener('keydown', onKey);
    }
  }, [visible, onUpdateVisible]);

  const onMouseDownHeader = (e: React.MouseEvent) => {
    setDragging(true);
    const rect = winRef.current?.getBoundingClientRect();
    const startX = e.clientX - (rect?.left ?? 0);
    const startY = e.clientY - (rect?.top ?? 0);
    dragOffset.current = { x: startX, y: startY };
    window.addEventListener('mousemove', onMouseMove as any);
    window.addEventListener('mouseup', onMouseUp as any);
  };

  const onTouchStartHeader = (e: React.TouchEvent) => {
    const t = e.touches[0];
    setDragging(true);
    const rect = winRef.current?.getBoundingClientRect();
    const startX = t.clientX - (rect?.left ?? 0);
    const startY = t.clientY - (rect?.top ?? 0);
    dragOffset.current = { x: startX, y: startY };
    window.addEventListener('touchmove', onTouchMove as any, { passive: false as any });
    window.addEventListener('touchend', onTouchEnd as any);
  };

  const onMouseMove = (e: MouseEvent) => {
    if (!dragging) return;
    const x = Math.max(8, e.clientX - dragOffset.current.x);
    const y = Math.max(8, e.clientY - dragOffset.current.y);
    setPosition({ x, y });
  };

  const onMouseUp = () => {
    setDragging(false);
    window.removeEventListener('mousemove', onMouseMove as any);
    window.removeEventListener('mouseup', onMouseUp as any);
  };

  const onTouchMove = (e: TouchEvent) => {
    if (!dragging) return;
    const t = e.touches[0];
    const x = Math.max(8, t.clientX - dragOffset.current.x);
    const y = Math.max(8, t.clientY - dragOffset.current.y);
    setPosition({ x, y });
    e.preventDefault();
  };

  const onTouchEnd = () => {
    setDragging(false);
    window.removeEventListener('touchmove', onTouchMove as any);
    window.removeEventListener('touchend', onTouchEnd as any);
  };

  if (!visible) return null;

  return createPortal(
    <div
      className={`calc-window calculator-modal`}
      ref={winRef}
      style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
      role="dialog"
      aria-label={t('buttons.calculator') || 'Calculator'}
    >
      <div className="calc-header" onMouseDown={onMouseDownHeader} onTouchStart={onTouchStartHeader}>
        <div className="calc-title">{t('buttons.calculator') || 'Calculator'}</div>
        <button className="calc-close" onClick={() => onUpdateVisible(false)} aria-label="Close">×</button>
      </div>
      <div className="calc-body">
        <Calculator onClose={() => onUpdateVisible(false)} />
      </div>
    </div>,
    document.body
  );
};

export default CalculatorModal;
