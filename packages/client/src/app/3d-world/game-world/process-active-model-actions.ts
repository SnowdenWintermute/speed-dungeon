import { MutateState } from "@/stores/mutate-state";
import { GameWorld } from ".";
import { ModularCharacter } from "../combatant-models/modular-character";
import { GameState } from "@/stores/game-store";

export default function processActiveModelActions(
  this: ModularCharacter,
  gameWorld: GameWorld,
  mutateGameState: MutateState<GameState>
) {
  //
}
