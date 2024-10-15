import { useUIStore } from "@/stores/ui-store";
import { ChangeEvent } from "react";

interface Props {
  placeholder: string;
  name: string;
  changeHandler: (e: ChangeEvent<HTMLInputElement>) => void;
  value: string;
  className?: string;
  type?: string;
  autoComplete?: string;
}

export default function TextInput(props: Props) {
  const mutateUIState = useUIStore().mutateState;

  return (
    <input
      onFocus={() => {
        mutateUIState((state) => {
          state.hotkeysDisabled = true;
        });
      }}
      onBlur={() => {
        mutateUIState((state) => {
          state.hotkeysDisabled = false;
        });
      }}
      className={`pointer-events-auto ${props.className}`}
      type={props.type || "text"}
      placeholder={props.placeholder}
      name={props.name}
      onChange={props.changeHandler}
      value={props.value}
      autoComplete={props.autoComplete || ""}
    />
  );
}
