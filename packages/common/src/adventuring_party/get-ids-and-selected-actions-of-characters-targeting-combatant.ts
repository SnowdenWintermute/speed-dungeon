import { AdventuringParty } from ".";
import { CombatAction, CombatActionTargetType, FriendOrFoe } from "../combat";
import { filterPossibleTargetIdsByProhibitedCombatantStates } from "../combat/targeting/filtering";
import { CombatantProperties } from "../combatants";
import getMonsterIdsInParty from "./get-monster-ids-in-party";

export default function getIdsAndSelectedActionsOfCharactersTargetingCombatant(
  party: AdventuringParty,
  combatantId: string
) {
  let error;
  const idsAndActionsOfCharactersTargetingThisCombatant: [string, CombatAction][] = [];
  const characterPositions = party.characterPositions;
  const monsterPositions = getMonsterIdsInParty(party);

  for (const [characterId, character] of Object.entries(party.characters)) {
    const currentTarget = character.combatantProperties.combatActionTarget;
    if (currentTarget === null) continue;
    console.log("target not null for ", characterId)
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
