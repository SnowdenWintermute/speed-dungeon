import { HotkeyButton } from "@/app/components/atoms/HotkeyButton";
import TextInput from "@/app/components/atoms/TextInput";
import { HotkeyButtonTypes } from "@/client-application/ui/keybind-config";
import { useClientApplication } from "@/hooks/create-client-application-context";
import {
  COMBATANT_CLASS_NAME_STRINGS,
  ClientIntentType,
  CombatantClass,
  EntityName,
  NextOrPrevious,
  getNextOrPreviousNumber,
  iterateNumericEnum,
  NumericEnumUtils,
  CharacterControlScheme,
} from "@speed-dungeon/common";
import React, { useState } from "react";

export default function CreateCharacterForm({
  controlScheme,
}: {
  controlScheme: CharacterControlScheme;
}) {
  const [selectedNewCharacterClass, setSelectedNewCharacterClass] = useState(CombatantClass.Mage);
  const [newCharacterName, setNewCharacterName] = useState("");
  const { lobbyClientRef, uiStore } = useClientApplication();
  const { keybinds } = uiStore;

  function createCharacter() {
    lobbyClientRef.get().dispatchIntent({
      type: ClientIntentType.CreateSavedCharacter,
      data: {
        name: newCharacterName as EntityName,
        combatantClass: selectedNewCharacterClass,
        controlScheme,
      },
    });
  }

  function setNextOrPreviousClass(nextOrPrevious: NextOrPrevious) {
    const nextClass = getNextOrPreviousNumber(
      selectedNewCharacterClass,
      NumericEnumUtils.length(CombatantClass) - 1,
      nextOrPrevious,
      { minNumber: 0 }
    );
    setSelectedNewCharacterClass(nextClass);
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        createCharacter();
      }}
    >
      <div className="pointer-events-auto flex justify-between mb-2">
        <HotkeyButton
          onClick={() => {
            setNextOrPreviousClass(NextOrPrevious.Next);
          }}
          children={""}
          className="hidden"
          hotkeys={keybinds.getKeybind(HotkeyButtonTypes.CycleForwardAlternate)}
        />
        <HotkeyButton
          onClick={() => {
            setNextOrPreviousClass(NextOrPrevious.Previous);
          }}
          children={""}
          className="hidden"
          hotkeys={keybinds.getKeybind(HotkeyButtonTypes.CycleBackAlternate)}
        />

        {iterateNumericEnum(CombatantClass).map((combatantClass) => (
          <button
            key={combatantClass}
            type="button"
            className={`${selectedNewCharacterClass === combatantClass ? "bg-slate-950" : "bg-slate-700"} h-10 border border-slate-400 flex items-center pl-2 pr-2`}
            onClick={() => setSelectedNewCharacterClass(combatantClass)}
          >
            <div>{COMBATANT_CLASS_NAME_STRINGS[combatantClass]}</div>
          </button>
        ))}
      </div>
      <TextInput
        placeholder="Character name..."
        name={"Character name"}
        className="border border-slate-400 bg-slate-700 p-2 pl-4 mb-2 w-full"
        onChange={(e) => setNewCharacterName(e.target.value)}
        value={newCharacterName}
      />
      <HotkeyButton
        hotkeys={keybinds.getKeybind(HotkeyButtonTypes.Confirm)}
        className="bg-slate-700 h-10 w-full p-2 border border-slate-400 pointer-events-auto"
        onClick={createCharacter}
      >
        CREATE CHARACTER
      </HotkeyButton>
    </form>
  );
}
