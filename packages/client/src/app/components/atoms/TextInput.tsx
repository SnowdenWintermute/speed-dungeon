import { useUIStore } from "@/stores/ui-store";
import { ChangeEvent, useEffect, useRef } from "react";

interface Props {
  placeholder: string;
  name: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  value: string;
  className?: string;
  type?: string;
  autoComplete?: string;
  disabled?: boolean;
  autofocus?: boolean;
  ariaInvalid?: boolean;
  dataCy?: string;
  id?: string;
}

export default function TextInput(props: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const mutateUIState = useUIStore().mutateState;

  useEffect(() => {
    return handleBlur;
  }, []);

  function handleBlur() {
    mutateUIState((state) => {
      state.hotkeysDisabled = false;
    });
  }

  function handleKeydown(e: KeyboardEvent) {
    const { code } = e;
    if (code === "Escape" || code === "Esc") inputRef.current?.blur();
  }

  useEffect(() => {
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, []);

  return (
    <input
      ref={inputRef}
      onFocus={() => {
        mutateUIState((state) => {
          state.hotkeysDisabled = true;
        });
      }}
      onBlur={handleBlur}
      className={`pointer-events-auto ${props.className}`}
      type={props.type || "text"}
      placeholder={props.placeholder}
      value={props.value}
      aria-label={props.name}
      id={props.name}
      name={props.name}
      onChange={(e) => props.onChange(e)}
      disabled={props.disabled}
      autoFocus={props.autofocus}
      autoComplete={props.autoComplete}
      aria-invalid={props.ariaInvalid}
      data-cy={props.dataCy}
    />
  );
}
