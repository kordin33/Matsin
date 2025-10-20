// CalculatorModal.tsx
import React, { useState, useEffect, useRef } from 'react';
import Calculator from './Calculator';

interface CalculatorModalProps {
  visible: boolean;
  onUpdateVisible: (visible: boolean) => void;
}

const CalculatorModal: React.FC<CalculatorModalProps> = ({ visible, onUpdateVisible }) => {
  const [isVisible, setIsVisible] = useState(visible);
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartOffset, setDragStartOffset] = useState({ x: 0, y: 0 });
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsVisible(visible);
    if (visible) {
      // Reset position or load saved if needed
      setPosition({ x: 100, y: 100 });
    }
  }, [visible]);

  const closeModal = () => {
    setIsVisible(false);
    onUpdateVisible(false);
  };

  const startDrag = (event: React.MouseEvent) => {
    if (event.target instanceof HTMLElement && event.target.closest('button')) {
      return;
    }
    setIsDragging(true);
    setDragStartOffset({
      x: event.clientX - position.x,
      y: event.clientY - position.y,
    });
    document.addEventListener('mousemove', handleDrag as any);
    document.addEventListener('mouseup', stopDrag as any);
  };

  const handleDrag = (event: MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: event.clientX - dragStartOffset.x,
      y: event.clientY - dragStartOffset.y,
    });
  };

  const stopDrag = () => {
    if (isDragging) {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleDrag as any);
      document.removeEventListener('mouseup', stopDrag as any);
    }
  };

  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleDrag as any);
      document.removeEventListener('mouseup', stopDrag as any);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div
      className="calculator-modal-wrapper"
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
      }}
      ref={modalRef}
      onMouseDown={startDrag}
    >
      <div className="modal-content">
        <Calculator onClose={closeModal} />
      </div>
    </div>
  );
};

export default CalculatorModal;