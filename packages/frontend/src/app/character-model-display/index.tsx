import { Combatant } from "@speed-dungeon/common";
import { ReactNode, useEffect } from "react";
import { useClientApplication } from "@/hooks/create-client-application-context";
import { observer } from "mobx-react-lite";
import { DialogElementName } from "@/client-application/ui/dialogs";

export const CharacterModelDisplay = observer(
  ({ character, children }: { character: Combatant; children?: ReactNode }) => {
    const { entityProperties } = character;
    const entityId = entityProperties.id;
    const clientApplication = useClientApplication();
    const { uiStore, gameWorldView } = clientApplication;
    const combatantSceneEntityManager =
      gameWorldView?.sceneEntityService.combatantSceneEntityManager;
    const modelIsLoading = combatantSceneEntityManager?.loadingStates.entityIsLoading(entityId);
    const showDebug = uiStore.dialogs.isOpen(DialogElementName.Debug);

    // @TODO - this is symantec coupling. instead of directly passing the modelDomPositionElement to babylon
    // we could make a singleton registry of dom elements by entity id and have babylon query for them
    useEffect(() => {
      // modelDomPositionElement's position and dimensions are set by babylonjs each frame
      const modelDomPositionElement = document.getElementById(
        `${entityId}-position-div`
      ) as HTMLDivElement | null;
      if (modelDomPositionElement === null) return;
      const modelOption = combatantSceneEntityManager?.getOptional(entityId);
      if (!modelOption) return;

      modelOption.modelDomPositionElement = modelDomPositionElement;

      const debugElement = document.getElementById(`${entityId}-debug-div`);
      modelOption.debugElement = debugElement as HTMLDivElement;
    }, [modelIsLoading]);

    return (
      <div id={`${entityId}-position-div`} className={`absolute ${modelIsLoading && "opacity-0"} `}>
        <div id={`${entityId}-debug-div`} className={showDebug ? "" : "hidden"}></div>
        {children}
      </div>
    );
  }
);
