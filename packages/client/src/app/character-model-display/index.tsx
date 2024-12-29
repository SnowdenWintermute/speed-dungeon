import { Combatant } from "@speed-dungeon/common";
import { ReactNode, useEffect } from "react";
import { gameWorld } from "@/app/3d-world/SceneManager";
import { useGameStore } from "@/stores/game-store";

export default function CharacterModelDisplay({
  character,
  children,
}: {
  character: Combatant;
  children?: ReactNode;
}) {
  const { entityProperties } = character;
  const entityId = entityProperties.id;
  const modelLoadingState = useGameStore.getState().combatantModelLoadingStates[entityId];

  useEffect(() => {
    // modelDomPositionElement's position and dimensions are set by babylonjs each frame
    const modelDomPositionElement = document.getElementById(
      `${entityId}-position-div`
    ) as HTMLDivElement | null;
    if (modelDomPositionElement === null) return;
    const modelOption = gameWorld.current?.modelManager.combatantModels[entityId];
    if (!modelOption) return;
    modelOption.modelDomPositionElement = modelDomPositionElement;
  }, [modelLoadingState]);

  return (
    <div
      id={`${entityId}-position-div`}
      className={`absolute ${(modelLoadingState === undefined || modelLoadingState === true) && "opacity-0"}`}
    >
      {children}
    </div>
  );
}
