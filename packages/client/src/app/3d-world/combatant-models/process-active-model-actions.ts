import { MutateState } from "@/stores/mutate-state";
import { GameWorld } from "../game-world";
import { ModularCharacter } from "./modular-character";
import { GameState } from "@/stores/game-store";

export default function processActiveModelActions(
  this: ModularCharacter,
  gameWorld: GameWorld,
  mutateGameState: MutateState<GameState>
) {
  //
}
