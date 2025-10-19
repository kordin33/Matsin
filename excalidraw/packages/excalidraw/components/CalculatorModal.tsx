import React from "react";

import CasioCalculator from "./CasioCalculator";

interface CalculatorModalProps {
  onClose: () => void;
}

export const CalculatorModal: React.FC<CalculatorModalProps> = ({ onClose }) => {
  return <CasioCalculator onClose={onClose} />;
};

