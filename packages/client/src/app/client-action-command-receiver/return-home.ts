import { ReturnHomeActionCommandPayload, SpeedDungeonGame } from "@speed-dungeon/common";
import { ClientActionCommandReceiver } from ".";
import { NextToBabylonMessageTypes } from "@/stores/next-babylon-messaging-store/next-to-babylon-messages";

export default function returnHomeActionCommandHandler(
  this: ClientActionCommandReceiver,
  _gameName: string,
  combatantId: string,
  payload: ReturnHomeActionCommandPayload
) {
  this.mutateNextBabylonMessagingState((state) => {
    state.nextToBabylonMessages.push({
      type: NextToBabylonMessageTypes.StartReturningHome,
      actionCommandPayload: payload,
      actionUserId: combatantId,
      onComplete: () => {
        this.mutateGameState((gameState) => {
          const partyResult = gameState.getParty();
          if (partyResult instanceof Error) return console.error(partyResult);
          const party = partyResult;

          // CLIENT
          // - end the combatant's turn if in combat and action required turn
          // - set the combatant model's animation manager to translate it back to home position
          // - process next action command if any (ai actions in queue, party wipes, party defeats, equipment swaps initiated during last action)

          if (payload.shouldEndTurn && party.battleId !== null) {
            const gameOption = gameState.game;
            // if(gameOption===undefined)
            // SpeedDungeonGame.endActiveCombatantTurn()
          }

          party.actionCommandManager.processNextCommand();
        });
      },
    });
  });
}
