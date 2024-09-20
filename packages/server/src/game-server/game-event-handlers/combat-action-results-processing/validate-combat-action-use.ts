import {
  ActionUsableContext,
  Battle,
  CharacterAssociatedData,
  CombatAction,
  ERROR_MESSAGES,
  getCombatActionPropertiesIfOwned,
  CombatActionTarget,
} from "@speed-dungeon/common";

export default function validateCombatActionUse(
  characterAssociatedData: CharacterAssociatedData,
  combatAction: CombatAction
): { targets: CombatActionTarget; battleOption: null | Battle } | Error {
  const { game, party, character } = characterAssociatedData;

  // ENSURE OWNERSHIP OF CONSUMABLE OR ABILITY
  const combatActionPropertiesResult = getCombatActionPropertiesIfOwned(
    character.combatantProperties,
    combatAction
  );
  if (combatActionPropertiesResult instanceof Error) return combatActionPropertiesResult;
  const combatActionProperties = combatActionPropertiesResult;

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
  // VALIDATE USABILITY CONTEXT
  const { usabilityContext } = combatActionProperties;
  const invalidUsabilityContext = (() => {
    switch (usabilityContext) {
      case ActionUsableContext.All:
        return false;
      case ActionUsableContext.InCombat:
        return battleOption === null;
      case ActionUsableContext.OutOfCombat:
        return battleOption !== null;
    }
  })();

  if (invalidUsabilityContext)
    return new Error(ERROR_MESSAGES.COMBAT_ACTIONS.INVALID_USABILITY_CONTEXT);
  return { targets, battleOption };
}
