import { GameState } from "@/stores/game-store";
import { MutateState } from "@/stores/mutate-state";
import { NextBabylonMessagingState } from "@/stores/next-babylon-messaging-store";
import { NextToBabylonMessageTypes } from "@/stores/next-babylon-messaging-store/next-to-babylon-messages";
import getParty from "@/utils/getParty";
import {
  COMBATANT_POSITION_SPACING_BETWEEN_ROWS,
  COMBATANT_POSITION_SPACING_SIDE,
  CombatantSpecies,
} from "@speed-dungeon/common";
import { Vector3 } from "babylonjs";

export default function gameStartedHandler(
  mutateGameStore: MutateState<GameState>,
  mutateNextBabylonMessagingStore: MutateState<NextBabylonMessagingState>,
  timeStarted: number
) {
  mutateGameStore((gameState) => {
    if (gameState.game) gameState.game.timeStarted = timeStarted;

    // spawn character models
    const partyResult = getParty(gameState.game, gameState.username);
    if (partyResult instanceof Error) return console.log("ERROR: ", partyResult);
    const party = partyResult;

    let rowPositionOffset = COMBATANT_POSITION_SPACING_SIDE;

    mutateNextBabylonMessagingStore((state) => {
      for (const characterId of party.characterPositions) {
        const character = party.characters[characterId];

        state.nextToBabylonMessages.push({
          type: NextToBabylonMessageTypes.SpawnCombatantModel,
          combatantModelBlueprint: {
            entityId: character.entityProperties.id,
            species: CombatantSpecies.Humanoid,
            monsterType: null,
            class: character.combatantProperties.combatantClass,
            startPosition: new Vector3(
              -COMBATANT_POSITION_SPACING_BETWEEN_ROWS / 2,
              0,
              rowPositionOffset
            ),
            startRotation: 0,
          },
        });

        rowPositionOffset -= COMBATANT_POSITION_SPACING_SIDE;
      }
    });
  });
}
