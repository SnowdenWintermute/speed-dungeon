import {
  ActionEntity,
  ActionEntityActionOriginData,
  AdventuringParty,
  throwIfError,
} from "@speed-dungeon/common";

export function handleActionEntityChanges(
  actionEntityChanges: Record<string, Partial<ActionEntityActionOriginData>>,
  party: AdventuringParty
) {
  for (const [id, changes] of Object.entries(actionEntityChanges)) {
    const {
      actionLevel,
      stacks,
      userElementalAffinities,
      userKineticAffinities,
      userCombatantAttributes,
    } = changes;

    const { actionEntityManager } = party;

    const actionEntity = actionEntityManager.getExpectedActionEntity(id);
    let { actionOriginData } = actionEntity.actionEntityProperties;
    if (!actionOriginData)
      actionOriginData = actionEntity.actionEntityProperties.actionOriginData = {
        spawnedBy: { id: "", name: "not found" },
      };

    // @PERF - probably don't need to send the whole MaxAndCurrent for level and stacks unless
    // we one day want to change the max, but it is simpler this way since we get to use a Partial of
    // the action entity's action origin properties
    // @REFACTOR create a merging factory to combine the changes with existing

    if (actionLevel !== undefined) ActionEntity.setLevel(actionEntity, actionLevel.current);
    if (stacks !== undefined) ActionEntity.setStacks(actionEntity, stacks.current);
    if (userCombatantAttributes) actionOriginData.userCombatantAttributes = userCombatantAttributes;
  }
}
