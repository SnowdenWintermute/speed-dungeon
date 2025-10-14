import { AppStore } from "@/mobx-stores/app-store";
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
  min?: number;
  max?: number;
}

export default function TextInput(props: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { inputStore } = AppStore.get();

  useEffect(() => {
    // trying to make it so we trigger the onfocus event, which didn't seem to be triggered
    // by just setting the autofocus property directly on the element. we need the onfocus to trigger
    // so we can disable hotkeys
    if (inputRef.current && props.autofocus) {
      inputRef.current.focus();
      inputRef.current.dispatchEvent(new Event("focus", { bubbles: true })); // Trigger the focus event manually
      inputStore.setHotkeysDisabled(true);
    }
    return () => {
      handleBlur();
    };
  }, []);

  function handleBlur() {
    inputStore.setHotkeysDisabled(false);
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
        inputStore.setHotkeysDisabled(true);
      }}
      onBlur={handleBlur}
      className={`pointer-events-auto ${props.className}`}
      type={props.type || "text"}
      min={props.min}
      max={props.max}
      placeholder={props.placeholder}
      value={props.value}
      aria-label={props.name}
      id={props.name}
      name={props.name}
      onChange={(e) => props.onChange(e)}
      disabled={props.disabled}
      autoComplete={props.autoComplete}
      aria-invalid={props.ariaInvalid}
      data-cy={props.dataCy}
    />
  );
}
