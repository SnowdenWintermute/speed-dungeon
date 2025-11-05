import React from "react";
import EyeIcon from "../../../../public/img/game-ui-icons/eye-open.svg";
import ClosedEyeIcon from "../../../../public/img/game-ui-icons/eye-closed.svg";
import { AppStore } from "@/mobx-stores/app-store";

interface Props {
  combatantId: string;
  isFocused: boolean;
}

export default function FocusCharacterButton({ combatantId, isFocused }: Props) {
  const conditionalStyles = isFocused ? "bg-slate-400 text-slate-700" : "";

  function handleClick() {
    AppStore.get().gameStore.setFocusedCharacter(combatantId);
  }

  const conditionalIconClassname = isFocused ? "stroke-slate-700" : "stroke-slate-400";

  return (
    <button
      className={`flex items-center justify-center h-full mr-2 w-12
                   text-sm border border-slate-400 ${conditionalStyles}`}
      onClick={handleClick}
    >
      {isFocused ? (
        <EyeIcon className={"max-h-full " + conditionalIconClassname} />
      ) : (
        <ClosedEyeIcon className={"max-h-full -translate-y-[2px] " + conditionalIconClassname} />
      )}
    </button>
  );
}
