import {
  Battle,
  CharacterAssociatedData,
  ERROR_MESSAGES,
  getCombatActionPropertiesIfOwned,
  CombatActionTarget,
  CombatActionComponent,
} from "@speed-dungeon/common";

export default function validateCombatActionUse(
  characterAssociatedData: CharacterAssociatedData,
  combatAction: CombatActionComponent
): { targets: CombatActionTarget; battleOption: null | Battle } | Error {
  const { game, party, character } = characterAssociatedData;

  // ENSURE OWNERSHIP OF CONSUMABLE OR ABILITY
  const combatActionPropertiesResult = getCombatActionPropertiesIfOwned(
    character.combatantProperties,
    combatAction
  );
  if (combatActionPropertiesResult instanceof Error) return combatActionPropertiesResult;

  // ENSURE TARGETING
  const targets = character.combatantProperties.combatActionTarget;
  if (targets === null) return new Error(ERROR_MESSAGES.COMBATANT.NO_TARGET_SELECTED);

  // IF IN BATTLE, ONLY USE IF FIRST IN TURN ORDER
  let battleOption: null | Battle = null;
  if (party.battleId !== null) {
    const battle = game.battles[party.battleId];
    if (battle !== undefined) battleOption = battle;
    else return new Error(ERROR_MESSAGES.GAME.BATTLE_DOES_NOT_EXIST);
  }

  if (
    battleOption !== null &&
    !Battle.combatantIsFirstInTurnOrder(battleOption, character.entityProperties.id)
  ) {
    return new Error(
      ERROR_MESSAGES.COMBATANT.NOT_ACTIVE +
        " first turn tracker " +
        JSON.stringify(battleOption.turnTrackers[0])
    );
  }

  const isInUsableContext = combatAction.isUsableInThisContext(battleOption);
  if (!isInUsableContext) return new Error(ERROR_MESSAGES.COMBAT_ACTIONS.INVALID_USABILITY_CONTEXT);
  return { targets, battleOption };
}
