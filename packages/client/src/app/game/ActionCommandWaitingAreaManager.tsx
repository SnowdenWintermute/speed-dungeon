import { useGameStore } from "@/stores/game-store";
import getCurrentParty from "@/utils/getCurrentParty";
import { ERROR_MESSAGES } from "@speed-dungeon/common";
import React, { useEffect } from "react";

// the point of this is if we get action commands before combatant models spawn
// such as when monsters are faster than players at the start of a battle
// it would otherwise be possible that the client tries to process action commands when
// the user or target of those commands has no combatant model

export default function ActionCommandWaitingAreaManager() {
  const mutateGameStore = useGameStore().mutateState;
  const combatantModelsAwaitingSpawn = useGameStore().combatantModelsAwaitingSpawn;

  useEffect(() => {
    if (combatantModelsAwaitingSpawn.length) return;

    mutateGameStore((gameState) => {
      if (!gameState.username) return console.error(ERROR_MESSAGES.CLIENT.NO_USERNAME);
      const partyResult = getCurrentParty(gameState, gameState.username);
      if (partyResult instanceof Error) return partyResult;
      partyResult?.actionCommandManager.enqueueNewCommands(gameState.actionCommandWaitingArea);
      gameState.actionCommandWaitingArea = [];
    });
  }, [combatantModelsAwaitingSpawn]);

  return <div />;
}
