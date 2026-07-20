import React from "react";
import { observer } from "mobx-react-lite";
import { CharacterModelDisplay } from ".";
import { CombatantFloatingMessagesDisplay } from "../game/combatant-plaques/combatant-floating-messages-display";
import { useClientApplication } from "@/hooks/create-client-application-context";

// driven off the observable combatant manager (not the non-reactive scene-entity list) so a
// display exists for each combatant as soon as it's in the party, rather than only after the
// parent re-renders on a room change
export default observer(function CombatantModelPositionedUi() {
  const { gameWorldView, gameContext } = useClientApplication();
  const combatantManager = gameContext.partyOption?.combatantManager;
  if (!gameWorldView || !combatantManager) {
    return <div />;
  }

  return (
    <div className="absolute">
      {[...combatantManager.getAllCombatants()].map(([entityId]) => (
        <CharacterModelDisplay combatantId={entityId} key={entityId}>
          <CombatantFloatingMessagesDisplay entityId={entityId} />
        </CharacterModelDisplay>
      ))}
    </div>
  );
});
