import { AdventuringParty } from "../adventuring-party/index.js";
import { CombatActionComponent } from "../combat/index.js";
import { ERROR_MESSAGES } from "../errors/index.js";
import { SpeedDungeonPlayer } from "../game/index.js";
import { CombatActionTarget } from "../combat/targeting/combat-action-targets.js";
import { getCombatActionPropertiesIfOwned } from "../combatants/get-combat-action-properties.js";
import { Combatant } from "../combatants/index.js";

interface CharacterAndSelectedActionData {
  character: Combatant;
  combatAction: CombatActionComponent;
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

  if (character.combatantProperties.selectedCombatAction === null)
    return new Error(ERROR_MESSAGES.COMBATANT.NO_ACTION_SELECTED);
  const selectedAction = character.combatantProperties.selectedCombatAction;

  if (!character.combatantProperties.combatActionTarget)
    return new Error(ERROR_MESSAGES.COMBATANT.NO_TARGET_SELECTED);
  const currentTarget = character.combatantProperties.combatActionTarget;

  const combatActionResult = getCombatActionPropertiesIfOwned(
    character.combatantProperties,
    selectedAction
  );
  if (combatActionResult instanceof Error) return combatActionResult;
  const combatAction = combatActionResult;

  return {
    character,
    combatAction,
    currentTarget,
  };
}
