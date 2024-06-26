import { GameState } from "@/stores/game-store";
import { MutateState } from "@/stores/mutate-state";
import { GameMessage, GameMessageType } from "@speed-dungeon/common";

export default function gameMessageHandler(
  mutateGameState: MutateState<GameState>,
  message: GameMessage
) {
  switch (message.type) {
    case GameMessageType.PartyDescent:
    case GameMessageType.PartyWipe:
    case GameMessageType.PartyEscape:
  }
}
