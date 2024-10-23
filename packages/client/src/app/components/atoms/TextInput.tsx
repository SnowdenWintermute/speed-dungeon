import { useUIStore } from "@/stores/ui-store";
import { ChangeEvent, useEffect, useRef } from "react";

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
    console.log("CODE: ", code);
    if (code === "Escape" || code === "Esc") {
      console.log(inputRef.current);
      inputRef.current?.blur();
    }
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
      name={props.name}
      onChange={props.changeHandler}
      value={props.value}
      autoComplete={props.autoComplete || ""}
    />
  );
}
