import cloneDeep from "lodash.clonedeep";
import { iterateNumericEnumKeyedRecord, randBetween, throwIfError } from "../../../utils/index.js";
import { ResourceChange } from "../../hp-change-source-types.js";
import { EntityId } from "../../../primatives/index.js";
import { TargetingCalculator } from "../../targeting/targeting-calculator.js";
import { ActionResolutionStepContext } from "../../../action-processing/index.js";
export * from "./hit-outcome-mitigation-calculator.js";
export * from "./incoming-resource-change-calculator.js";
export * from "./hp-change-calculation-strategies/index.js";
export * from "./resource-change-modifier.js";
export * from "./resource-changes.js";

import { DurabilityChangesByEntityId } from "../../../durability/index.js";
import { HitOutcome } from "../../../hit-outcome.js";
import { HitPointChanges, ManaChanges, ResourceChanges } from "./resource-changes.js";
import { COMBAT_ACTIONS } from "../../combat-actions/action-implementations/index.js";
import { RandomNumberGenerator } from "../../../utility-classes/randomizers.js";
import { IncomingResourceChangesCalculator } from "./incoming-resource-change-calculator.js";
import { TargetFilterer } from "../../targeting/filtering.js";
import { CombatActionComponent, CombatActionExecutionIntent } from "../../combat-actions/index.js";
import { AdventuringParty } from "../../../adventuring-party/index.js";
import { CombatActionResource } from "../../combat-actions/combat-action-hit-outcome-properties.js";
import { HitOutcomeMitigationCalculator } from "./hit-outcome-mitigation-calculator.js";
import { ResourceChangeModifier } from "./resource-change-modifier.js";
import { CombatantContext } from "../../../combatant-context/index.js";

export class CombatActionHitOutcomes {
  resourceChanges?: Partial<Record<CombatActionResource, ResourceChanges<ResourceChange>>>;
  durabilityChanges?: DurabilityChangesByEntityId;
  // distinct from hitPointChanges, "hits" is used to determine triggers for abilities that don't cause
  // hit point changes, but may apply a condition to their target or otherwise change something
  outcomeFlags: Partial<Record<HitOutcome, EntityId[]>> = {};

  constructor() {}
  insertOutcomeFlag(flag: HitOutcome, entityId: EntityId) {
    const idsFlagged = this.outcomeFlags[flag];
    if (!idsFlagged) this.outcomeFlags[flag] = [entityId];
    else idsFlagged.push(entityId);
  }

  insertResourceChange(
    resourceType: CombatActionResource,
    targetId: EntityId,
    resourceChange: ResourceChange
  ) {
    if (this.resourceChanges === undefined) this.resourceChanges = {};
    if (this.resourceChanges[resourceType] === undefined)
      this.resourceChanges[resourceType] = (() => {
        switch (resourceType) {
          case CombatActionResource.HitPoints:
            return new HitPointChanges();
          case CombatActionResource.Mana:
            return new ManaChanges();
        }
      })();

    this.resourceChanges[resourceType].addRecord(targetId, resourceChange);
  }
}

export class HitOutcomeCalculator {
  targetingCalculator: TargetingCalculator;
  incomingResourceChangesCalculator: IncomingResourceChangesCalculator;
  targetIds: EntityId[];
  action: CombatActionComponent;
  constructor(
    private combatantContext: CombatantContext,
    private actionExecutionIntent: CombatActionExecutionIntent,
    private rng: RandomNumberGenerator
  ) {
    this.targetingCalculator = new TargetingCalculator(this.combatantContext, null);

    this.action = COMBAT_ACTIONS[actionExecutionIntent.actionName];

    this.targetIds = throwIfError(
      this.targetingCalculator.getCombatActionTargetIds(this.action, actionExecutionIntent.targets)
    );

    this.incomingResourceChangesCalculator = new IncomingResourceChangesCalculator(
      combatantContext,
      actionExecutionIntent,
      this.targetingCalculator,
      this.targetIds,
      rng
    );
  }

  calculateHitOutcomes() {
    const { party, combatant } = this.combatantContext;

    // while we may have already filtered targets for user selected action while they are targeting,
    // when doing ice burst we still want to target the side combatants, but actually not damage them
    const filteredTargetIds = throwIfError(
      TargetFilterer.filterTargetIdGroupByProhibitedCombatantStates(
        party,
        this.targetIds,
        this.action.targetingProperties.prohibitedHitCombatantStates
      )
    );

    const hitOutcomes = new CombatActionHitOutcomes();

    const incomingResourceChangesPerTarget =
      this.incomingResourceChangesCalculator.getBaseIncomingResourceChangesPerTarget();

    let mitigationCalculator: null | HitOutcomeMitigationCalculator = null;

    for (const targetId of filteredTargetIds) {
      const targetCombatant = AdventuringParty.getExpectedCombatant(party, targetId);
      if (mitigationCalculator === null)
        mitigationCalculator = new HitOutcomeMitigationCalculator(
          this.action,
          combatant,
          targetCombatant,
          incomingResourceChangesPerTarget,
          this.rng
        );
      else mitigationCalculator.setTargetCombatant(targetCombatant);

      const hitOutcomeFlags = mitigationCalculator.rollHitMitigationEvents();
      let wasHit = false;
      let wasBlocked = false;
      for (const flag of hitOutcomeFlags) {
        hitOutcomes.insertOutcomeFlag(flag, targetId);
        if (flag === HitOutcome.Hit) wasHit = true;
        if (flag === HitOutcome.ShieldBlock) wasBlocked = true;
      }

      if (!wasHit || incomingResourceChangesPerTarget === null) continue;

      for (const [resourceType, incomingResourceChangeOption] of iterateNumericEnumKeyedRecord(
        incomingResourceChangesPerTarget
      )) {
        const { valuePerTarget: value } = incomingResourceChangeOption;

        const resourceChange = new ResourceChange(
          value,
          cloneDeep(incomingResourceChangeOption.source)
        );

        const user = combatant.combatantProperties;
        const target = targetCombatant.combatantProperties;

        const targetWillAttemptMitigation = mitigationCalculator.targetWillAttemptMitigation();

        const percentChanceToCrit = HitOutcomeMitigationCalculator.getActionCritChance(
          this.action,
          user,
          target,
          targetWillAttemptMitigation
        );

        resourceChange.isCrit = randBetween(0, 100, this.rng) < percentChanceToCrit;

        const resourceChangeModifier = new ResourceChangeModifier(
          this.action.hitOutcomeProperties,
          combatant.combatantProperties,
          targetCombatant.combatantProperties,
          targetWillAttemptMitigation,
          resourceChange
        );
        resourceChangeModifier.applyPostHitModifiers(wasBlocked);

        hitOutcomes.insertResourceChange(resourceType, targetId, resourceChange);
      }
    }

    return hitOutcomes;
  }
}
