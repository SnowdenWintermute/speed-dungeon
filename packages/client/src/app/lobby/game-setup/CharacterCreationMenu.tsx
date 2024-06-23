import CombatantClassIcon from "@/app/components/atoms/CombatantClassIcon";
import TextSubmit from "@/app/components/molocules/TextSubmit";
import { useWebsocketStore } from "@/stores/websocket-store";
import { ClientToServerEvent } from "@speed-dungeon/common";
import {
  COMBATANT_CLASS_DESCRIPTIONS,
  CombatantClass,
  formatCombatantClassName,
} from "@speed-dungeon/common/src/combatants";
import React, { useState } from "react";

export default function CharacterCreationMenu() {
  const socketOption = useWebsocketStore().socketOption;
  const [combatantClassSelection, setCombatantClassSelection] = useState(CombatantClass.Warrior);

  function createCharacter(characterName: string) {
    socketOption?.emit(
      ClientToServerEvent.CreateCharacter,
      characterName,
      combatantClassSelection
    );
  }

  const combatantClasses = Object.values(CombatantClass);
  const classSelectionButtons: React.ReactNode[] = [];
  combatantClasses.forEach((combatantClass) => {
    if (typeof combatantClass === "string") {
    } else
      classSelectionButtons.push(
        <CombatantClassSelectionButton
          key={combatantClass}
          combatantClass={combatantClass as CombatantClass}
          combatantClassSelection={combatantClassSelection}
          setCombatantClassSelection={setCombatantClassSelection}
        />
      );
  });

  return (
    <div className="mb-2">
      <ul className="flex mb-2">{classSelectionButtons}</ul>
      <div className="mb-2 flex ">
        <span className="h-20 w-20 p-1 flex justify-center rotate-45 mr-4">
          <CombatantClassIcon combatantClass={combatantClassSelection} />
        </span>
        <div>
          <h5 className="font-bold mb-1">{formatCombatantClassName(combatantClassSelection)}</h5>
          <p>{COMBATANT_CLASS_DESCRIPTIONS[combatantClassSelection]}</p>
        </div>
      </div>
      <TextSubmit
        inputName={"character name"}
        inputPlaceholder={"Character name..."}
        buttonTitle={"Create Character"}
        submitDisabled={false}
        submitHandlerCallback={createCharacter}
      />
    </div>
  );
}

interface Props {
  combatantClass: CombatantClass;
  combatantClassSelection: CombatantClass;
  setCombatantClassSelection: React.Dispatch<React.SetStateAction<CombatantClass>>;
}

function CombatantClassSelectionButton(props: Props) {
  let selectedStyle =
    props.combatantClassSelection === props.combatantClass
      ? "border-yellow-400"
      : "border-slate-400";
  function handleClick() {
    props.setCombatantClassSelection(props.combatantClass);
  }

  return (
    <li className="mr-2 last:mr-0 ">
      <button className={`border h-10 p-2 ${selectedStyle}`} onClick={handleClick}>
        {formatCombatantClassName(props.combatantClass)}
      </button>
    </li>
  );
}
