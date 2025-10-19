import React from "react";
import { Dialog } from "./Dialog";
import { t } from "../i18n";
import CasioCalculator from "./CasioCalculator";
import "./CalculatorModal.scss";

interface CalculatorModalProps {
  onClose: () => void;
}

export const CalculatorModal: React.FC<CalculatorModalProps> = ({ onClose }) => {
  return (
    <Dialog
      onCloseRequest={onClose}
      title={t("buttons.calculator")}
      size="small"
      className="calculator-modal"
    >
      <CasioCalculator onClose={onClose} />
    </Dialog>
  );
};
