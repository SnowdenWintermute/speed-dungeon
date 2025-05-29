import { Combatant } from "@speed-dungeon/common";
import { ReactNode, useEffect } from "react";
import { gameWorld, getGameWorld } from "@/app/3d-world/SceneManager";
import { useGameStore } from "@/stores/game-store";
import { useUIStore } from "@/stores/ui-store";

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
  const showDebug = useUIStore().showDebug;

  // @TODO - this is symantec coupling. instead of directly passing the modelDomPositionElement to babylon
  // we could make a singleton registry of dom elements by entity id and have babylon query for them
  useEffect(() => {
    // modelDomPositionElement's position and dimensions are set by babylonjs each frame
    const modelDomPositionElement = document.getElementById(
      `${entityId}-position-div`
    ) as HTMLDivElement | null;
    if (modelDomPositionElement === null) return;
    const modelOption = getGameWorld().modelManager.findOneOptional(entityId);
    if (!modelOption) return;

    modelOption.modelDomPositionElement = modelDomPositionElement;

    const debugElement = document.getElementById(`${entityId}-debug-div`);
    modelOption.debugElement = debugElement as HTMLDivElement;
  }, [modelLoadingState]);

  return (
    <div
      id={`${entityId}-position-div`}
      className={`absolute ${(modelLoadingState === undefined || modelLoadingState === true) && "opacity-0"}`}
    >
      <div id={`${entityId}-debug-div`} className={showDebug ? "" : "hidden"}></div>
      {children}
    </div>
  );
}
