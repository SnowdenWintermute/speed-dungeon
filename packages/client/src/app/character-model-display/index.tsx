import { Vector3 } from "@babylonjs/core";
import { Combatant } from "@speed-dungeon/common";
import { ReactNode, useEffect } from "react";
import { gameWorld } from "@/app/3d-world/SceneManager";
import { ModelManagerMessageType } from "@/app/3d-world/game-world/model-manager";
import { useGameStore } from "@/stores/game-store";

export default function CharacterModelDisplay({
  character,
  startPosition,
  children,
}: {
  character: Combatant;
  startPosition: { startRotation: number; modelCorrectionRotation: number; startPosition: Vector3 };
  children?: ReactNode;
}) {
  const mutateGameStore = useGameStore().mutateState;
  const { entityProperties } = character;
  const entityId = entityProperties.id;
  const isLoading = useGameStore().combatantModelsAwaitingSpawn;

  useEffect(() => {
    // modelDomPositionElement's position and dimensions are set by babylonjs each frame
    const modelDomPositionElement = document.getElementById(
      `${entityId}-position-div`
    ) as HTMLDivElement | null;
    if (modelDomPositionElement === null) return;

    mutateGameStore((state) => {
      state.combatantModelsAwaitingSpawn = true;
    });

    gameWorld.current?.modelManager.enqueueMessage(entityId, {
      type: ModelManagerMessageType.SpawnModel,
      blueprint: {
        combatant: character,
        startPosition: startPosition.startPosition,
        startRotation: startPosition.startRotation,
        modelCorrectionRotation: startPosition.modelCorrectionRotation,
        modelDomPositionElement,
      },
    });

    return () => {
      gameWorld.current?.modelManager.enqueueMessage(entityId, {
        type: ModelManagerMessageType.DespawnModel,
      });
    };
  }, []);

  return (
    <div id={`${entityId}-position-div`} className={`absolute ${isLoading && "hidden"}`}>
      {children}
    </div>
  );
}
