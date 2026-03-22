import React from "react";
import EyeIcon from "../../../../public/img/game-ui-icons/eye-open.svg";
import ClosedEyeIcon from "../../../../public/img/game-ui-icons/eye-closed.svg";
import { useClientApplication } from "@/hooks/create-client-application-context";
import { CombatantId } from "@speed-dungeon/common";
import { observer } from "mobx-react-lite";

interface Props {
  combatantId: CombatantId;
  isFocused: boolean;
}

export const FocusCharacterButton = observer(({ combatantId, isFocused }: Props) => {
  const conditionalStyles = isFocused ? "bg-slate-400 text-slate-700" : "";
  const clientApplication = useClientApplication();
  const { combatantFocus } = clientApplication;

  function handleClick() {
    combatantFocus.setFocusedCharacter(combatantId);
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
});
