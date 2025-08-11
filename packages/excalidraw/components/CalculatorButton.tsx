import { ToolButton } from "./ToolButton";
import { calculatorIcon } from "./icons";
import { t } from "../i18n";
import { useExcalidrawSetAppState } from "./App";

type CalculatorButtonProps = {
  title?: string;
  name?: string;
  id?: string;
  size?: "small" | "medium";
};

export const CalculatorButton = ({
  title,
  name,
  id,
  size,
}: CalculatorButtonProps) => {
  const setAppState = useExcalidrawSetAppState();
  return (
    <ToolButton
      type="button"
      icon={calculatorIcon}
      title={title ?? t("buttons.calculator")}
      aria-label={title ?? t("buttons.calculator")}
      name={name ?? "calculator"}
      id={id}
      size={size}
      onClick={() => {
        setAppState({ openDialog: { name: "calculator" } });
      }}
      data-testid="calculator-button"
    />
  );
};