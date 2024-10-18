import { useUIStore } from "@/stores/ui-store";
import Triangle from "../../../../public/img/basic-shapes/triangle.svg";
import React, { useEffect, useRef, useState } from "react";

interface Props {
  title: string;
  value: any;
  setValue: (value: any) => void;
  options: { title: string; value: any }[];
  disabled: boolean | undefined;
  extraStyles?: string;
}

export default function SelectDropdown(props: Props) {
  const { options, value } = props;
  const mutateUIState = useUIStore().mutateState;
  const selectInputRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [indexSelected, setIndexSelected] = useState<number>(
    options.reduce((accumulator, option, i) => (option.value === value ? i : accumulator), 0)
  );

  useEffect(() => {
    if (props.disabled) return;
    if (value === undefined) return;
    const option = options[indexSelected];
    if (!option) return;
    if (option.value === value) return;
    props.setValue(option.value);
  }, [indexSelected, value]);

  function handleBlur() {
    mutateUIState((state) => {
      state.hotkeysDisabled = false;
    });
    setIsFocused(false);
    setIsOpen(false);
    // const activeElement = document.activeElement as HTMLElement;
    // if (activeElement && activeElement !== document.body) {
    //   activeElement.blur();
    // }
  }

  function handleFocus() {
    if (!selectInputRef.current) return console.log("no input ref");
    setIsFocused(true);
    mutateUIState((state) => {
      state.hotkeysDisabled = true;
    });
  }

  function handleUserKeydown(e: KeyboardEvent) {
    const { code } = e;
    if (code === "Escape" || code === "Esc") handleBlur();
    if (!selectInputRef.current) return console.log("no input ref");
    if (!isFocused) return console.log("not focused");

    if (code === "Space") setIsOpen(!isOpen);
    if (code === "ArrowUp") {
      if (indexSelected === 0) {
        setIndexSelected(options.length - 1);
      } else setIndexSelected(indexSelected - 1);
    }
    if (code === "ArrowDown")
      if (indexSelected === options.length - 1) setIndexSelected(0);
      else setIndexSelected(indexSelected + 1);
  }

  const handleClickOutsideMenu = (e: MouseEvent) => {
    if (selectInputRef.current) {
      console.log("clicked outside menu ", props.title);
      const menuRect = selectInputRef.current.getBoundingClientRect();
      const { x, y, width, height } = menuRect;
      const maxX = x + width;
      const maxY = y + height;
      if (e.x < x || e.x > maxX || e.y > maxY || e.y < y) handleBlur();
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleUserKeydown);
    window.addEventListener("click", handleClickOutsideMenu);
    return () => {
      window.removeEventListener("keydown", handleUserKeydown);
      window.removeEventListener("click", handleClickOutsideMenu);
    };
  }, [isOpen, isFocused, value]);

  const selectedOptionAsOpenButton = options
    .filter((option) => option.value === value)
    .map((option) => {
      if (option.value !== value) return null;
      return (
        <button
          onFocus={handleFocus}
          onBlur={handleBlur}
          onClick={() => setIsOpen(!isOpen)}
          onKeyDown={(e) => {
            if (e.code === "Space") e.preventDefault(); // we don't want the default behavior because we're handling spacebar events ourselves
          }}
          disabled={props.disabled}
          type="button"
          key={option.value}
          id={`select-${props.title}-selected-option`}
          className={`h-10 w-full flex justify-between items-center pl-2 bg-slate-700 
          border border-b-0 border-slate-400 ${isFocused && "bg-slate-950"} ${props.disabled && "opacity-50"}`}
        >
          <span>{option.title}</span>
          <div className="h-full p-3 pointer-events-none">
            <Triangle
              className={`h-full w-10 fill-slate-400 transition-transform ${isOpen && "rotate-180"}`}
            />
          </div>
        </button>
      );
    });

  const optionButtons = options.map((option, i) => {
    return (
      <li className="w-full" key={option.value}>
        <button
          disabled={props.disabled}
          type="button"
          onMouseDown={() => {
            console.log("clicked");
            setIsOpen(false);
            setIndexSelected(i);
          }}
          className={`pointer-events-auto h-10 text-left pl-2 w-full bg-slate-700 
          border-slate-400 border-b ${value === option.value && "bg-slate-950"}
          `}
        >
          {option.title}
        </button>
      </li>
    );
  });

  return (
    <div
      ref={selectInputRef}
      aria-label={`select ${props.title}`}
      className={`w-full pointer-events-auto relative ${props.extraStyles}`}
    >
      {selectedOptionAsOpenButton}
      <ul
        className={`absolute z-10 w-full border border-b-0 border-slate-400 
          ${props.disabled && "opacity-50"}
          `}
      >
        {isOpen && optionButtons}
      </ul>
    </div>
  );
}
