import React from "react";

import Calculator from "./Calculator";

interface CalculatorModalProps {
  visible: boolean;
  onUpdateVisible: (visible: boolean) => void;
}

const CalculatorModal: React.FC<CalculatorModalProps> = ({ visible, onUpdateVisible }) => {
  if (!visible) {
    return null;
  }

  return <Calculator onClose={() => onUpdateVisible(false)} />;
};

export default CalculatorModal;

