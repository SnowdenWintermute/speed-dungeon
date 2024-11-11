import { Vector3 } from "@babylonjs/core";
import { Combatant } from "@speed-dungeon/common";
import { ReactNode, useEffect } from "react";
import { CHARACTER_SLOT_SPACING } from ".";
import { gameWorld } from "@/app/3d-world/SceneManager";
import { ModelManagerMessageType } from "@/app/3d-world/game-world/model-manager";
import { useGameStore } from "@/stores/game-store";

export default function SavedCharacterDisplay({
  character,
  index,
  children,
}: {
  character: Combatant;
  index: number;
  children?: ReactNode;
}) {
  const mutateGameStore = useGameStore().mutateState;
  const { entityProperties, combatantProperties } = character;
  const entityId = entityProperties.id;
  const isLoading = useGameStore().combatantModelsAwaitingSpawn.includes(entityId);

  useEffect(() => {
    // modelDomPositionElement's position and dimensions are set by babylonjs each frame
    const modelDomPositionElement = document.getElementById(
      `${entityId}-position-div`
    ) as HTMLDivElement | null;
    if (modelDomPositionElement === null) return;

    mutateGameStore((state) => {
      state.combatantModelsAwaitingSpawn.push(entityId);
    });

    gameWorld.current?.modelManager.enqueueMessage(entityId, {
      type: ModelManagerMessageType.SpawnModel,
      blueprint: {
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
      gameWorld.current?.modelManager.enqueueMessage(entityId, {
        type: ModelManagerMessageType.DespawnModel,
      });
    };
  }, [index]);

  return (
    <div id={`${entityId}-position-div`} className={`absolute ${isLoading && "hidden"}`}>
      {children}
    </div>
  );
}
