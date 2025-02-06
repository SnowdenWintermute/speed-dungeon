import { AdventuringParty } from "./index.js";
import { CombatActionName, CombatActionTargetType } from "../combat/index.js";
import { filterPossibleTargetIdsByProhibitedCombatantStates } from "../combat/targeting/filtering.js";
import { CombatantProperties } from "../combatants/index.js";
import { FriendOrFoe } from "../combat/combat-actions/targeting-schemes-and-categories.js";

export function getIdsAndSelectedActionsOfCharactersTargetingCombatant(
  party: AdventuringParty,
  combatantId: string
) {
  let error;
  const idsAndActionsOfCharactersTargetingThisCombatant: [string, CombatActionName][] = [];
  const characterPositions = party.characterPositions;
  const monsterPositions = party.currentRoom.monsterPositions;

  for (const [characterId, character] of Object.entries(party.characters)) {
    const currentTarget = character.combatantProperties.combatActionTarget;
    if (currentTarget === null) continue;
    const selectedAction = character.combatantProperties.selectedCombatAction;
    if (!selectedAction) continue;
    const actionPropertiesResult = CombatantProperties.getCombatActionPropertiesIfOwned(
      character.combatantProperties,
      selectedAction
    );
    if (actionPropertiesResult instanceof Error) {
      error = actionPropertiesResult;
      continue;
    }

    const filteredTargetsResult = filterPossibleTargetIdsByProhibitedCombatantStates(
      party,
      actionPropertiesResult.prohibitedTargetCombatantStates,
      characterPositions,
      monsterPositions
    );

    if (filteredTargetsResult instanceof Error) return filteredTargetsResult;
    const [filteredAllyIds, filteredOpponentIdsOption] = filteredTargetsResult;

    let combatantIsTargetedByThisCharacter = false;

    switch (currentTarget.type) {
      case CombatActionTargetType.SingleAndSides:
        throw new Error(
          "not implemented SingleAndSides targeting, get the implementatino from the other place it already exists"
        );
      case CombatActionTargetType.Single:
        combatantIsTargetedByThisCharacter = currentTarget.targetId === combatantId;
        break;
      case CombatActionTargetType.Group:
        switch (currentTarget.friendOrFoe) {
          case FriendOrFoe.Friendly:
            combatantIsTargetedByThisCharacter = filteredAllyIds.includes(combatantId);
            break;
          case FriendOrFoe.Hostile:
            if (!filteredOpponentIdsOption) continue;
            combatantIsTargetedByThisCharacter = filteredOpponentIdsOption.includes(combatantId);
            break;
        }
        break;
      case CombatActionTargetType.All:
        combatantIsTargetedByThisCharacter = true;
        break;
    }

    if (combatantIsTargetedByThisCharacter)
      idsAndActionsOfCharactersTargetingThisCombatant.push([characterId, selectedAction]);
  }

  if (error) return error;
  return idsAndActionsOfCharactersTargetingThisCombatant;
}
