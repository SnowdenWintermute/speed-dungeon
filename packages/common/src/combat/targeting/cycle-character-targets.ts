import { AdventuringParty } from "../../adventuring_party";
import { getCombatActionPropertiesIfOwned } from "../../combatants/get-combat-action-properties";
import { ERROR_MESSAGES } from "../../errors";
import { SpeedDungeonGame, SpeedDungeonPlayer } from "../../game";
import { NextOrPrevious } from "../../primatives";
import getFilteredPotentialTargetIds from "./get-filtered-potential-target-ids";

export default function cycleCharacterTargets(
  game: SpeedDungeonGame,
  party: AdventuringParty,
  player: SpeedDungeonPlayer,
  characterId: string,
  direction: NextOrPrevious
) {
  const battleIdOption = party.battleId;
  const battleOption = battleIdOption ? game.battles[battleIdOption] ?? null : null;
  const characterResult = AdventuringParty.getCharacterIfOwned(
    party,
    player.characterIds,
    characterId
  );
  if (characterResult instanceof Error) return characterResult;
  const character = characterResult;

  if (!character.combatantProperties.selectedCombatAction)
    return new Error(ERROR_MESSAGES.COMBATANT.NO_ACTION_SELECTED);
  const selectedAction = character.combatantProperties.selectedCombatAction;

  if (!character.combatantProperties.combatActionTarget)
    return new Error(ERROR_MESSAGES.COMBATANT.NO_TARGET_SELECTED);
  const currentTarget = character.combatantProperties.combatActionTarget;

  const combatActionPropertiesResult = getCombatActionPropertiesIfOwned(
    character.combatantProperties,
    selectedAction
  );
  if (combatActionPropertiesResult instanceof Error) return combatActionPropertiesResult;
  const combatActionProperties = combatActionPropertiesResult;

  const { prohibitedTargetCombatantStates } = combatActionProperties;
  const filteredTargetIdsResult = getFilteredPotentialTargetIds(
    game,
    party,
    characterId,
    combatActionProperties
  );
  if (filteredTargetIdsResult instanceof Error) return filteredTargetIdsResult;
  const [allyIdsOption, opponentIdsOption] = filteredTargetIdsResult;

  // const newTargets =
}
