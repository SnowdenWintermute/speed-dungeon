import { AdventuringParty } from ".";
import { CombatAction, FriendOrFoe } from "../combat";
import { CombatActionTargetType } from "../combat/targeting/combat-action-targets";
import { filterPossibleTargetIdsByProhibitedCombatantStates } from "../combat/targeting/filtering";

export default function getIdsAndSelectedActionsOfCharactersTargetingCombatant(
  this: AdventuringParty,
  combatantId: string
) {
  let error;
  const idsAndActionsOfCharactersTargetingThisCombatant: [string, CombatAction][] = [];
  const characterPositions = this.characterPositions;
  const monsterPositions = this.getMonsterIds();

  for (const [characterId, character] of Object.entries(this.characters)) {
    const selectedAction = character.combatantProperties.selectedCombatAction;
    if (!selectedAction) continue;
    const actionPropertiesResult =
      character.combatantProperties.getPropertiesIfOwned(selectedAction);
    if (actionPropertiesResult instanceof Error) {
      error = actionPropertiesResult;
      continue;
    }

    const filteredTargetsResult = filterPossibleTargetIdsByProhibitedCombatantStates(
      this,
      actionPropertiesResult.prohibitedTargetCombatantStates,
      characterPositions,
      monsterPositions
    );

    if (filteredTargetsResult instanceof Error) return filteredTargetsResult;
    const [filteredAllyIds, filteredOpponentIdsOption] = filteredTargetsResult;

    const currentTarget = character.combatantProperties.combatActionTarget;
    if (!currentTarget) continue;

    let combatantIsTargetedByThisCharacter = false;
    switch (currentTarget.type) {
      case CombatActionTargetType.Single:
        combatantIsTargetedByThisCharacter = currentTarget.targetId === combatantId;
        break;
      case CombatActionTargetType.Group:
        switch (currentTarget.friendOrFoe) {
          case FriendOrFoe.Friendly:
            combatantIsTargetedByThisCharacter = filteredAllyIds.includes(combatantId);
          case FriendOrFoe.Hostile:
            if (!filteredOpponentIdsOption) continue;
            combatantIsTargetedByThisCharacter = filteredOpponentIdsOption.includes(combatantId);
        }
        break;
      case CombatActionTargetType.All:
        combatantIsTargetedByThisCharacter = true;
    }

    if (combatantIsTargetedByThisCharacter)
      idsAndActionsOfCharactersTargetingThisCombatant.push([characterId, selectedAction]);
  }

  if (error) return error;
  return idsAndActionsOfCharactersTargetingThisCombatant;
}
