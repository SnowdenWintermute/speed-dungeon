import { Combatant } from "@speed-dungeon/common";
import { ReactNode, useEffect } from "react";
import { getGameWorld } from "@/app/3d-world/SceneManager";
import { AppStore } from "@/mobx-stores/app-store";
import { DialogElementName } from "@/mobx-stores/dialogs";
import { observer } from "mobx-react-lite";

export const CharacterModelDisplay = observer(
  ({ character, children }: { character: Combatant; children?: ReactNode }) => {
    const { entityProperties } = character;
    const entityId = entityProperties.id;
    const modelIsLoading = AppStore.get().gameWorldStore.modelIsLoading(entityId);
    const showDebug = AppStore.get().dialogStore.isOpen(DialogElementName.Debug);

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
    }, [modelIsLoading]);

    return (
      <div id={`${entityId}-position-div`} className={`absolute ${modelIsLoading && "opacity-0"}`}>
        <div id={`${entityId}-debug-div`} className={showDebug ? "" : "hidden"}></div>
        {children}
      </div>
    );
  }
);
