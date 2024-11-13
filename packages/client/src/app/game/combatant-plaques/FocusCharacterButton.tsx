import setFocusedCharacter from "@/utils/set-focused-character";
import React from "react";

interface Props {
  combatantId: string;
  isFocused: boolean;
}

export default function FocusCharacterButton({ combatantId, isFocused }: Props) {
  const conditionalStyles = isFocused ? "bg-slate-400 text-slate-700" : "";

  function handleClick() {
    setFocusedCharacter(combatantId);
  }

  return (
    <button
      className={`flex items-center justify-center h-full mr-2 w-20
                   text-sm border border-slate-400 ${conditionalStyles}`}
      onClick={handleClick}
    >
      {isFocused ? "Focused" : "Focus"}
    </button>
  );
}
