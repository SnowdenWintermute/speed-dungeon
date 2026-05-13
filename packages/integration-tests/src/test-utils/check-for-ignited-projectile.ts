import { GameClient } from "@/client-application/clients/game";
import { ClientTestHarness } from "./client-test-harness";
import {
  ActionEntityName,
  ActionResolutionStepType,
  AdventuringParty,
  BeforeOrAfter,
  CombatActionName,
  CombatActionResource,
  invariant,
  MagicalElement,
} from "@speed-dungeon/common";

export async function checkForIgnitedProjectile(
  gameClientHarness: ClientTestHarness<GameClient>,
  party: AdventuringParty
) {
  await gameClientHarness.flushReplayTree({
    stoppingPoint: BeforeOrAfter.After,
    actionName: CombatActionName.IgniteProjectile,
    step: ActionResolutionStepType.EvalOnHitOutcomeTriggers,
  });
  const arrow = party.actionEntityManager.getExistingActionEntityOfType(ActionEntityName.Arrow);
  invariant(arrow !== null);
  const { actionOriginData } = arrow.getActionEntityProperties();
  invariant(actionOriginData !== undefined);
  const { resourceChangeProperties } = actionOriginData;
  invariant(resourceChangeProperties !== undefined);
  const hpChangeProperties = resourceChangeProperties[CombatActionResource.HitPoints];
  invariant(hpChangeProperties !== undefined);
  expect(hpChangeProperties.resourceChangeSource.elementOption).toBe(MagicalElement.Fire);
}
