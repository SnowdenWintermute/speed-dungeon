import { AdventuringParty, PlayerCharacter } from "../adventuring_party/index.js";
import { CombatActionProperties } from "../combat/index.js";
import { ERROR_MESSAGES } from "../errors/index.js";
import { SpeedDungeonPlayer } from "../game/index.js";
import { CombatActionTarget } from "../combat/targeting/combat-action-targets.js";
import { getCombatActionPropertiesIfOwned } from "../combatants/get-combat-action-properties.js";

interface CharacterAndSelectedActionData {
  character: PlayerCharacter;
  combatActionProperties: CombatActionProperties;
  currentTarget: CombatActionTarget;
}

export default function getOwnedCharacterAndSelectedCombatAction(
  party: AdventuringParty,
  player: SpeedDungeonPlayer,
  characterId: string
): Error | CharacterAndSelectedActionData {
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

  return {
    character,
    combatActionProperties,
    currentTarget,
  };
}
