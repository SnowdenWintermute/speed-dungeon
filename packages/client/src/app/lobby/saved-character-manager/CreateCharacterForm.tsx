import HotkeyButton from "@/app/components/atoms/HotkeyButton";
import TextInput from "@/app/components/atoms/TextInput";
import { websocketConnection } from "@/singletons/websocket-connection";
import {
  COMBATANT_CLASS_NAME_STRINGS,
  ClientToServerEvent,
  CombatantClass,
  iterateNumericEnum,
} from "@speed-dungeon/common";
import React, { useState } from "react";

export default function CreateCharacterForm({ currentSlot }: { currentSlot: number }) {
  const [selectedNewCharacterClass, setSelectedNewCharacterClass] = useState(CombatantClass.Mage);
  const [newCharacterName, setNewCharacterName] = useState("");

  function createCharacter() {
    websocketConnection.emit(ClientToServerEvent.CreateSavedCharacter, {
      name: newCharacterName,
      combatantClass: selectedNewCharacterClass,
      slotNumber: currentSlot,
    });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        createCharacter();
      }}
    >
      <div className="pointer-events-auto flex justify-between mb-2">
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
        buttonType="submit"
        className="bg-slate-700 h-10 w-full p-2 border border-slate-400 pointer-events-auto"
      >
        CREATE CHARACTER
      </HotkeyButton>
    </form>
  );
}
