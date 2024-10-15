import {
  NextToBabylonMessageTypes,
  nextToBabylonMessageQueue,
} from "@/singletons/next-to-babylon-message-queue";
import { Vector3 } from "@babylonjs/core";
import { Combatant } from "@speed-dungeon/common";
import { useEffect } from "react";
import { CHARACTER_SLOT_SPACING } from ".";

export default function SavedCharacterDisplay({
  character,
  index,
}: {
  character: Combatant;
  index: number;
}) {
  const { entityProperties, combatantProperties } = character;
  const entityId = entityProperties.id;

  useEffect(() => {
    // display them in "slots" in the 3d world
    const modelDomPositionElement = document.getElementById(
      `${entityId}-position-div`
    ) as HTMLDivElement | null;
    if (modelDomPositionElement === null) return;

    nextToBabylonMessageQueue.messages.push({
      type: NextToBabylonMessageTypes.SpawnCombatantModel,
      combatantModelBlueprint: {
        entityId: entityProperties.id,
        species: combatantProperties.combatantSpecies,
        monsterType: null,
        class: combatantProperties.combatantClass,
        startPosition: new Vector3(-CHARACTER_SLOT_SPACING + index * CHARACTER_SLOT_SPACING, 0, 0),
        startRotation: 0,
        modelCorrectionRotation: 0,
        modelDomPositionElement,
      },
      checkIfRoomLoaded: false,
    });

    return () => {
      nextToBabylonMessageQueue.messages.push({
        type: NextToBabylonMessageTypes.RemoveCombatantModel,
        entityId,
      });
    };
  }, []);
  return (
    <div id={`${entityId}-position-div`} className="absolute flex flex-col items-center"></div>
  );
}
