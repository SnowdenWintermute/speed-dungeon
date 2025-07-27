import {
  ActionCompletionUpdateCommand,
  CombatantContext,
  HitOutcomesGameUpdateCommand,
  ThreatChanges,
} from "@speed-dungeon/common";
import { useGameStore } from "@/stores/game-store";
import getGameAndParty from "@/utils/getGameAndParty";
import { plainToInstance } from "class-transformer";

export function handleThreatChangesUpdate(
  command: HitOutcomesGameUpdateCommand | ActionCompletionUpdateCommand
) {
  if (command.threatChanges) {
    useGameStore.getState().mutateState((gameState) => {
      const actionUserResult = gameState.getCombatant(command.actionUserId);
      if (actionUserResult instanceof Error) throw actionUserResult;
      const gameAndPartyResult = getGameAndParty(gameState.game, gameState.username);
      if (gameAndPartyResult instanceof Error) throw gameAndPartyResult;
      const [game, party] = gameAndPartyResult;

      const combatantContext = new CombatantContext(game, party, actionUserResult);
      const threatChangesRehydrated = plainToInstance(ThreatChanges, command.threatChanges);
      threatChangesRehydrated.applyToGame(combatantContext);
    });
  }
}
