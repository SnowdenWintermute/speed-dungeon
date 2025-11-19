import React from "react";

interface Props {
  hotkeyLabel: string;
  isDisabled: boolean;
}

export default function NumberedButtonHotkeyLabel(props: Props) {
  const disabledStyles = props.isDisabled ? "opacity-50" : "";
  return (
    <div
      className={`h-full w-10 !min-w-[2.5rem] border-r border-slate-400
            flex items-center justify-center animate-slide-appear-from-left-fast 
            `}
    >
      <span className={disabledStyles}>{props.hotkeyLabel}</span>
    </div>
  );
}
