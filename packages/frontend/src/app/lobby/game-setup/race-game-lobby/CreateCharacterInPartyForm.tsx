import { HotkeyButton } from "@/app/components/atoms/HotkeyButton";
import { SelectDropdown } from "@/app/components/atoms/SelectDropdown";
import TextInput from "@/app/components/atoms/TextInput";
import { useClientApplication } from "@/hooks/create-client-application-context";
import {
  ClientIntentType,
  iterateNumericEnum,
  COMBATANT_CLASS_NAME_STRINGS,
  CombatantClass,
  EntityName,
} from "@speed-dungeon/common";
import { observer } from "mobx-react-lite";
import { FormEvent, useState } from "react";

export const CreateCharacterForm = observer(() => {
  const [combatantClassSelection, setCombatantClassSelection] = useState(CombatantClass.Warrior);
  const [characterName, setCharacterName] = useState("");
  const { lobbyClientRef } = useClientApplication();

  function handleCreateCharacter(e: FormEvent<HTMLElement>) {
    e.preventDefault();

    lobbyClientRef.get().dispatchIntent({
      type: ClientIntentType.CreateCharacterInGame,
      data: {
        name: characterName as EntityName,
        combatantClass: combatantClassSelection,
      },
    });
  }

  return (
    <form
      onSubmit={handleCreateCharacter}
      className="h-20 mb-2 last:mb-0 flex items-center text-lg relative"
    >
      <div className="absolute top-0 text-sm">New Character:</div>
      <TextInput
        className="h-10 w-48 flex-grow border border-slate-400 bg-transparent pl-2 mr-2"
        value={characterName}
        placeholder={"Character name..."}
        name={"Character Name"}
        onChange={(e) => setCharacterName(e.target.value)}
      />
      <SelectDropdown
        extraStyles="flex-grow mr-2"
        title={"Select Combatant Class"}
        value={combatantClassSelection}
        setValue={setCombatantClassSelection}
        options={iterateNumericEnum(CombatantClass).map((combatantClass) => {
          return {
            title: COMBATANT_CLASS_NAME_STRINGS[combatantClass],
            value: combatantClass,
          };
        })}
        disabled={false}
      />
      <HotkeyButton
        hotkeys={[]}
        buttonType="button"
        onClick={handleCreateCharacter}
        className="h-10 pr-4 pl-4 border border-slate-400"
      >
        CREATE
      </HotkeyButton>
    </form>
  );
});
