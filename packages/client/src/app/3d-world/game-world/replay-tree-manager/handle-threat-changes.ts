import {
  ActionCompletionUpdateCommand,
  ActivatedTriggersGameUpdateCommand,
  HitOutcomesGameUpdateCommand,
  ThreatChanges,
} from "@speed-dungeon/common";
import { useGameStore } from "@/stores/game-store";
import getGameAndParty from "@/utils/getGameAndParty";
import { plainToInstance } from "class-transformer";

export function handleThreatChangesUpdate(
  command:
    | HitOutcomesGameUpdateCommand
    | ActionCompletionUpdateCommand
    | ActivatedTriggersGameUpdateCommand
) {
  if (command.threatChanges) {
    useGameStore.getState().mutateState((gameState) => {
      const gameAndPartyResult = getGameAndParty(gameState.game, gameState.username);
      if (gameAndPartyResult instanceof Error) throw gameAndPartyResult;
      const [game, party] = gameAndPartyResult;

      const threatChangesRehydrated = plainToInstance(ThreatChanges, command.threatChanges);
      threatChangesRehydrated.applyToGame(party);
    });
  }
}
