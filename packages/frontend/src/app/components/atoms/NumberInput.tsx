import { stringIsValidNumber } from "@speed-dungeon/common";
import { ChangeEvent, KeyboardEvent, useEffect, useRef } from "react";

interface Props {
  value: string;
  onChange: (value: string) => void;
  name: string;
  min?: number;
  max?: number;
  onRangeError?: () => void;
  placeholder?: string;
  className?: string;
  autofocus?: boolean;
}

const ALLOWED_CONTROL_KEYS = [
  "Backspace",
  "Delete",
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "Home",
  "End",
  "Tab",
  "Enter",
];

export default function NumberInput(props: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // focus in an effect (rather than via the autoFocus attribute) so the keydown that
    // mounted this input finishes before it gains focus - otherwise that same keystroke
    // (e.g. the hotkey that opened a modal) gets typed into the input
    if (props.autofocus) {
      inputRef.current?.focus();
    }
  }, []);

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.ctrlKey || e.metaKey || e.altKey) {
      return;
    }
    if (ALLOWED_CONTROL_KEYS.includes(e.key)) {
      return;
    }
    if (!/^[0-9]$/.test(e.key)) {
      e.preventDefault();
    }
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const inputValue = e.target.value;
    if (inputValue === "") {
      props.onChange("");
      return;
    }
    if (!stringIsValidNumber(inputValue)) {
      return;
    }
    const parsed = parseInt(inputValue);
    if (
      (props.min !== undefined && parsed < props.min) ||
      (props.max !== undefined && parsed > props.max)
    ) {
      props.onRangeError?.();
      return;
    }
    props.onChange(parsed.toString());
  }

  return (
    <input
      ref={inputRef}
      className={props.className}
      type="number"
      inputMode="numeric"
      placeholder={props.placeholder}
      name={props.name}
      aria-label={props.name}
      min={props.min}
      max={props.max}
      value={props.value}
      onKeyDown={handleKeyDown}
      onChange={handleChange}
    />
  );
}
