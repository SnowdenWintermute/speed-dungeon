import React, { useId, useState } from "react";
import { HotkeyButton } from "@speed-dungeon/ui/atoms/HotkeyButton";
import { Checkbox } from "@speed-dungeon/ui/atoms/Checkbox";
import { ClientIntentType, Combatant } from "@speed-dungeon/common";
import { useClientApplication } from "@/hooks/create-client-application-context";
import { HotkeyButtonTypes } from "@/client-application/ui/keybind-config";

const CONFIRM_DELETION_LABEL = "Check the box to enable deletion";

export default function DeleteCharacterForm({ character }: { character: Combatant }) {
  const [confirmDeletion, setConfirmDeletion] = useState(false);
  const { lobbyClientRef, uiStore } = useClientApplication();
  const { keybinds } = uiStore;
  const confirmDeletionId = useId();

  function deleteCharacter() {
    lobbyClientRef.get().dispatchIntent({
      type: ClientIntentType.DeleteSavedCharacter,
      data: {
        entityId: character.getEntityId(),
      },
    });
  }

  return (
    <form className="bg-slate-700 border border-slate-400 p-2 flex flex-col pointer-events-auto">
      <div className="flex justify-between align-middle text-slate-400 mb-2">
        <label htmlFor={confirmDeletionId} className="cursor-pointer">
          {CONFIRM_DELETION_LABEL}
        </label>
        <Checkbox
          id={confirmDeletionId}
          ariaLabel={CONFIRM_DELETION_LABEL}
          checked={confirmDeletion}
          setChecked={setConfirmDeletion}
          hotkeys={keybinds.getKeybind(HotkeyButtonTypes.ToggleDeletionConfirmation)}
        />
      </div>
      <HotkeyButton
        className={`${confirmDeletion && "bg-red-800"} h-10 w-full p-2 border border-slate-400 disabled:opacity-50`}
        onClick={deleteCharacter}
        disabled={!confirmDeletion}
        hotkeys={keybinds.getKeybind(HotkeyButtonTypes.Confirm)}
      >
        {confirmDeletion && "!!! "}DELETE CHARACTER{confirmDeletion && " !!!"}
      </HotkeyButton>
    </form>
  );
}
