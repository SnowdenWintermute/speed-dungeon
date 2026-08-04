import React, { useEffect, useRef, useState } from "react";
import { useSuspendHotkeys, useUiLayers } from "./ui-context";

function Triangle({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 20 13" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M9.99991 0L19.5262 12.75H0.473633L9.99991 0Z" fill="current" />
    </svg>
  );
}

interface Props {
  title: string;
  value: any;
  setValue: (value: any) => void;
  options: { title: string; value: any; disabled?: boolean }[];
  disabled: boolean | undefined;
  extraStyles?: string;
}

export function SelectDropdown(props: Props) {
  const { options, value } = props;
  const selectInputRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const indexSelected = options.findIndex((option) => option.value === value);

  const { dropdown: dropdownLayer } = useUiLayers();
  const suspendHotkeys = useSuspendHotkeys();
  const releaseHotkeysRef = useRef<null | (() => void)>(null);

  function selectOptionAtIndex(index: number) {
    const option = options[index];
    if (!option) return;
    props.setValue(option.value);
  }

  function wrapOptionIndex(index: number) {
    const { length } = options;
    return ((index % length) + length) % length;
  }

  function selectNextEnabledOption(step: 1 | -1) {
    if (options.length === 0) return;
    // with nothing selected, -1 already steps forward onto the first option, but stepping
    // backward should reach the last
    const nothingSelected = indexSelected === -1;
    const startIndex = nothingSelected && step === -1 ? options.length : indexSelected;

    for (let offset = 1; offset <= options.length; offset += 1) {
      const option = options[wrapOptionIndex(startIndex + step * offset)];
      if (option === undefined || option.disabled) continue;
      props.setValue(option.value);
      return;
    }
  }

  // a value with no matching option would leave nothing to display, so fall back to the first
  // selectable one
  useEffect(() => {
    if (props.disabled) return;
    if (value === undefined) return;
    if (indexSelected !== -1) return;
    selectNextEnabledOption(1);
  }, [value]);

  function handleBlur() {
    releaseHotkeysRef.current?.();
    releaseHotkeysRef.current = null;
    setIsFocused(false);
    setIsOpen(false);
    // const activeElement = document.activeElement as HTMLElement;
    // if (activeElement && activeElement !== document.body) {
    //   activeElement.blur();
    // }
  }

  function handleFocus() {
    if (!selectInputRef.current) return;
    setIsFocused(true);
    if (releaseHotkeysRef.current) return;
    releaseHotkeysRef.current = suspendHotkeys();
  }

  function handleUserKeydown(e: KeyboardEvent) {
    const { code } = e;
    if (code === "Escape" || code === "Esc") handleBlur();
    if (!selectInputRef.current) return;
    if (!isFocused) return;

    if (code === "Space") {
      setIsOpen(!isOpen);
    }
    if (code === "ArrowUp") {
      selectNextEnabledOption(-1);
    }
    if (code === "ArrowDown") {
      selectNextEnabledOption(1);
    }
  }

  function handleClickOutsideMenu(e: MouseEvent) {
    if (selectInputRef.current) {
      const menuRect = selectInputRef.current.getBoundingClientRect();
      const { x, y, width, height } = menuRect;
      const maxX = x + width;
      const maxY = y + height;
      if (e.x < x || e.x > maxX || e.y > maxY || e.y < y) handleBlur();
    }
  }

  useEffect(() => {
    window.addEventListener("keydown", handleUserKeydown);
    window.addEventListener("mousedown", handleClickOutsideMenu);
    return () => {
      window.removeEventListener("keydown", handleUserKeydown);
      window.removeEventListener("mousedown", handleClickOutsideMenu);
    };
  }, [isOpen, isFocused, value]);

  const selectedOptionAsOpenButton = options
    .filter((option) => option.value === value)
    .map((option) => {
      if (option.value !== value) return <div>No selectable options</div>;
      return (
        <button
          onFocus={handleFocus}
          onBlur={handleBlur}
          onMouseDown={() => setIsOpen(!isOpen)}
          onKeyDown={(e) => {
            if (e.code === "Space") e.preventDefault(); // we don't want the default behavior because we're handling spacebar events ourselves
          }}
          disabled={props.disabled}
          type="button"
          key={option.value}
          id={`select-${props.title}-selected-option`}
          className={`h-full w-full flex justify-between items-center pl-2 bg-theme-base
          border ${isOpen && "border-b-transparent"} border-theme-muted ${isFocused && "bg-theme-recessed"} ${props.disabled && "opacity-50"}`}
        >
          <span>{option.title}</span>
          <div className="h-full pt-3 pb-3 pointer-events-none">
            <Triangle
              className={`h-full w-10 fill-theme-muted transition-transform ${isOpen && "rotate-180"}`}
            />
          </div>
        </button>
      );
    });

  const optionButtons = options.map((option, i) => {
    return (
      <li className="w-full" key={option.value}>
        <button
          disabled={option.disabled}
          type="button"
          onMouseDown={() => {
            setIsOpen(false);
            selectOptionAtIndex(i);
          }}
          className={`pointer-events-auto h-10 text-left pl-2 w-full bg-theme-base
          border-theme-muted border-b ${value === option.value && "bg-theme-recessed"}
          `}
        >
          <span className={`${option.disabled && "opacity-50"}`}>{option.title}</span>
        </button>
      </li>
    );
  });

  return (
    <div
      ref={selectInputRef}
      aria-label={`select ${props.title}`}
      className={`h-10 w-full pointer-events-auto relative ${props.extraStyles}`}
    >
      {selectedOptionAsOpenButton}
      {isOpen && (
        <ul
          style={{ zIndex: dropdownLayer }}
          className={`absolute w-full border border-b-0 border-theme-muted
       ${props.disabled && "opacity-50"}
       `}
        >
          {optionButtons}
        </ul>
      )}
    </div>
  );
}
