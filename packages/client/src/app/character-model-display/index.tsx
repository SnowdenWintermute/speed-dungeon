import { Vector3 } from "@babylonjs/core";
import { Combatant } from "@speed-dungeon/common";
import { ReactNode, useEffect } from "react";
import { gameWorld } from "@/app/3d-world/SceneManager";
import { ModelActionType } from "../3d-world/game-world/model-manager/model-actions";

export default function CharacterModelDisplay({
  character,
  startPosition,
  children,
}: {
  character: Combatant;
  startPosition: { startRotation: number; modelCorrectionRotation: number; startPosition: Vector3 };
  children?: ReactNode;
}) {
  const { entityProperties } = character;
  const entityId = entityProperties.id;

  useEffect(() => {
    // modelDomPositionElement's position and dimensions are set by babylonjs each frame
    const modelDomPositionElement = document.getElementById(
      `${entityId}-position-div`
    ) as HTMLDivElement | null;
    if (modelDomPositionElement === null) return;

    gameWorld.current?.modelManager.modelActionQueue.enqueueMessage({
      type: ModelActionType.SpawnCombatantModel,
      blueprint: {
        combatant: character,
        startPosition: startPosition.startPosition,
        startRotation: startPosition.startRotation,
        modelCorrectionRotation: startPosition.modelCorrectionRotation,
        modelDomPositionElement,
      },
    });

    return () => {
      gameWorld.current?.modelManager.modelActionQueue.enqueueMessage({
        type: ModelActionType.DespawnCombatantModel,
        entityId,
      });
    };
  }, []);

  return (
    <div id={`${entityId}-position-div`} className={`absolute`}>
      {children}
    </div>
  );
}
