import { CombatLogMessage, CombatLogMessageStyle } from "@/app/game/combat-log/combat-log-message";
import { GameState } from "@/stores/game-store";
import { MutateState } from "@/stores/mutate-state";
import { GameMessage, GameMessageType } from "@speed-dungeon/common";

export default function gameMessageHandler(
  mutateGameState: MutateState<GameState>,
  message: GameMessage
) {
  mutateGameState((gameState) => {
    switch (message.type) {
      case GameMessageType.PartyDescent:
        gameState.combatLogMessages.push(
          new CombatLogMessage(
            `Party ${message.partyName} descended to floor ${message.newFloor}`,
            CombatLogMessageStyle.PartyProgress
          )
        );
        break;
      case GameMessageType.PartyWipe:
        gameState.combatLogMessages.push(
          new CombatLogMessage(
            `Party ${message.partyName} met their end on floor ${message.dlvl} at ${new Date(message.timeOfWipe).toLocaleTimeString()}`,
            CombatLogMessageStyle.PartyWipe
          )
        );
        break;
      case GameMessageType.PartyEscape:
        gameState.combatLogMessages.push(
          new CombatLogMessage(
            `Party ${message.partyName} escaped the dungeon at ${new Date(message.timeOfEscape).toLocaleTimeString()}`,
            CombatLogMessageStyle.PartyEscape
          )
        );
        break;
    }
  });
}
