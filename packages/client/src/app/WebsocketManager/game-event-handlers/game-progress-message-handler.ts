import { CombatLogMessage, CombatLogMessageStyle } from "@/app/game/combat-log/combat-log-message";
import { GameState } from "@/stores/game-store";
import { MutateState } from "@/stores/mutate-state";
import { GameMessage, GameMessageType } from "@speed-dungeon/common";

export default function gameProgressMessageHandler(
  mutateGameStore: MutateState<GameState>,
  message: GameMessage
) {
  mutateGameStore((state) => {
    let combatLogMessage;
    switch (message.type) {
      case GameMessageType.PartyDescent:
        combatLogMessage = new CombatLogMessage(
          `Party "${message.partyName}" descended to floor ${message.newFloor}`,
          CombatLogMessageStyle.GameProgress
        );
        break;
      case GameMessageType.PartyEscape:
        combatLogMessage = new CombatLogMessage(
          `Party "${message.partyName}" escaped the dungeon at ${new Date(message.timeOfEscape).toLocaleString()}`,
          CombatLogMessageStyle.GameProgress
        );
        break;
      case GameMessageType.PartyWipe:
        combatLogMessage = new CombatLogMessage(
          `Party "${message.partyName}" was defeated at ${new Date(message.timeOfWipe).toLocaleTimeString()}`,
          CombatLogMessageStyle.GameProgress
        );
        break;
      case GameMessageType.LadderProgress:
        combatLogMessage = new CombatLogMessage(
          `${message.characterName} [${message.playerName}] gained level ${message.level} and rose to rank ${message.rank} in the ladder!`,
          CombatLogMessageStyle.PartyProgress
        );
        break;
      case GameMessageType.LadderDeath:
        combatLogMessage = new CombatLogMessage(
          `${message.characterName} [${message.playerName}] died at level ${message.level}, losing their position of ${message.rank} in the ladder`,
          CombatLogMessageStyle.PartyProgress
        );
        break;
    }

    state.combatLogMessages.push(combatLogMessage);
  });
}
