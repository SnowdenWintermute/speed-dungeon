import { AdventuringParty } from "../adventuring-party/index.js";
import { CombatActionComponent } from "../combat/index.js";
import { ERROR_MESSAGES } from "../errors/index.js";
import { CombatActionTarget } from "../combat/targeting/combat-action-targets.js";
import { getCombatActionPropertiesIfOwned } from "../combatants/get-combat-action-properties.js";
import { Combatant } from "../combatants/index.js";

interface CharacterAndSelectedActionData {
  character: Combatant;
  combatAction: CombatActionComponent;
  currentTarget: CombatActionTarget;
}

export function getCombatantAndSelectedCombatAction(
  party: AdventuringParty,
  characterId: string
): Error | CharacterAndSelectedActionData {
  const combatantResult = AdventuringParty.getCombatant(party, characterId);
  if (combatantResult instanceof Error) return combatantResult;
  const character = combatantResult;

  const targetingProperties = character.getTargetingProperties();

  const selectedActionAndRank = targetingProperties.getSelectedActionAndRank();
  if (selectedActionAndRank === null) return new Error(ERROR_MESSAGES.COMBATANT.NO_ACTION_SELECTED);

  const currentTarget = targetingProperties.getSelectedTarget();
  if (!currentTarget) return new Error(ERROR_MESSAGES.COMBATANT.NO_TARGET_SELECTED);

  const combatActionResult = getCombatActionPropertiesIfOwned(
    character.combatantProperties,
    selectedActionAndRank
  );
  if (combatActionResult instanceof Error) return combatActionResult;
  const combatAction = combatActionResult;

  return {
    character,
    combatAction,
    currentTarget,
  };
}
