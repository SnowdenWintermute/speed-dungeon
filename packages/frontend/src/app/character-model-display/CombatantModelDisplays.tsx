import React from "react";
import { CharacterModelDisplay } from ".";
import { CombatantFloatingMessagesDisplay } from "../game/combatant-plaques/combatant-floating-messages-display";
import { useClientApplication } from "@/hooks/create-client-application-context";

export default function CombatantModelPositionedUi() {
  const { gameWorldView } = useClientApplication();
  if (!gameWorldView) {
    return <div />;
  }

  return (
    <div className="absolute">
      {gameWorldView.sceneEntityService.combatantSceneEntityManager.getAll().map((sceneEntity) => (
        <CharacterModelDisplay
          combatantId={sceneEntity.combatant.getEntityId()}
          key={sceneEntity.combatant.getEntityId()}
        >
          <CombatantFloatingMessagesDisplay entityId={sceneEntity.combatant.getEntityId()} />
        </CharacterModelDisplay>
      ))}
    </div>
  );
}
