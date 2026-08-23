import cloneDeep from "lodash.clonedeep";
import { iterateNumericEnumKeyedRecord, throwIfError } from "../../../utils/index.js";
import { ResourceChange, ResourceChangeSource } from "../../hp-change-source-types.js";
import { ActionRank, EntityId } from "../../../aliases.js";
import { TargetingCalculator } from "../../targeting/targeting-calculator.js";
import { DurabilityChangesByEntityId } from "../../../durability/index.js";
import { HitOutcome } from "../../../hit-outcome.js";
import { HitPointChanges, ManaChanges, ResourceChanges } from "./resource-changes.js";
import { COMBAT_ACTIONS } from "../../combat-actions/action-implementations/index.js";
import { RandomNumberGenerationPolicy } from "../../../utility-classes/random-number-generation-policy.js";
import { IncomingResourceChangesCalculator } from "./incoming-resource-change-calculator.js";
import { TargetFilterer } from "../../targeting/filtering.js";
import { CombatActionComponent } from "../../combat-actions/index.js";
import { CombatActionResource } from "../../combat-actions/combat-action-hit-outcome-properties.js";
import { HitOutcomeMitigationCalculator } from "./hit-outcome-mitigation-calculator.js";
import { ActionUserContext } from "../../../action-user-context/index.js";
import { CombatActionExecutionIntent } from "../../combat-actions/combat-action-execution-intent.js";
import { ResourceChangePropertiesStrategy } from "../../combat-actions/action-implementations/resource-change-properties-strategy.js";
import { Combatant } from "../../../combatants/index.js";

export class CombatActionHitOutcomes {
  resourceChanges?: Partial<Record<CombatActionResource, ResourceChanges<ResourceChange>>>;
  durabilityChanges?: DurabilityChangesByEntityId;
  // distinct from hitPointChanges, "hits" is used to determine triggers for abilities that don't cause
  // hit point changes, but may apply a condition to their target or otherwise change something
  outcomeFlags: Partial<Record<HitOutcome, EntityId[]>> = {};

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

    const resourceTypeChange = this.resourceChanges[resourceType];
    if (resourceTypeChange === undefined) throw new Error("expected to have set this record");
    resourceTypeChange.addRecord(targetId, resourceChange);
  }
}

export class HitOutcomeCalculator {
  targetingCalculator: TargetingCalculator;
  incomingResourceChangesCalculator: IncomingResourceChangesCalculator;
  targetIds: EntityId[];
  action: CombatActionComponent;
  constructor(
    private actionUserContext: ActionUserContext,
    private actionExecutionIntent: CombatActionExecutionIntent,
    private rngPolicy: RandomNumberGenerationPolicy,
    private resourceChangePropertiesStrategy: ResourceChangePropertiesStrategy
  ) {
    this.targetingCalculator = new TargetingCalculator(this.actionUserContext, null);

    this.action = COMBAT_ACTIONS[actionExecutionIntent.actionName];

    this.targetIds = throwIfError(
      this.targetingCalculator.getCombatActionTargetIds(this.action, actionExecutionIntent.targets)
    );

    this.incomingResourceChangesCalculator = new IncomingResourceChangesCalculator(
      actionUserContext,
      actionExecutionIntent,
      this.targetingCalculator,
      this.targetIds,
      rngPolicy.combatResourceChange,
      resourceChangePropertiesStrategy
    );
  }

  static calculateHitOutcomesOnTarget(
    targetCombatant: Combatant,
    mitigationCalculator: HitOutcomeMitigationCalculator,
    incomingResourceChanges: Partial<
      Record<
        CombatActionResource,
        {
          valuePerTarget: number;
          source: ResourceChangeSource;
        }
      >
    > | null,
    actionRank: ActionRank,
    hitOutcomes: CombatActionHitOutcomes
  ) {
    mitigationCalculator.setTargetCombatant(targetCombatant);

    const hitOutcomeFlags = mitigationCalculator.rollHitMitigationEvents();
    const wasHit = hitOutcomeFlags.includes(HitOutcome.Hit);
    const wasBlocked = hitOutcomeFlags.includes(HitOutcome.ShieldBlock);
    const targetId = targetCombatant.getEntityId();

    for (const flag of hitOutcomeFlags) {
      hitOutcomes.insertOutcomeFlag(flag, targetId);
    }

    if (!wasHit || incomingResourceChanges === null) {
      return;
    }

    for (const [resourceType, incomingResourceChangeOption] of iterateNumericEnumKeyedRecord(
      incomingResourceChanges
    )) {
      const { valuePerTarget: value } = incomingResourceChangeOption;
      const resourceChange = new ResourceChange(
        value,
        cloneDeep(incomingResourceChangeOption.source)
      );
      mitigationCalculator.modifyIncomingResourceChange(
        resourceType,
        resourceChange,
        wasBlocked,
        actionRank
      );

      hitOutcomes.insertResourceChange(resourceType, targetId, resourceChange);
    }
  }

  calculateHitOutcomes() {
    const { party, actionUser } = this.actionUserContext;

    // while we may have already filtered targets for user selected action while they are targeting,
    // when doing ice burst we still want to target the side combatants, but actually not damage them
    // this may be vestigial from before explosion targets were chosen by distance
    let filteredTargetIds = throwIfError(
      TargetFilterer.filterTargetIdGroupByProhibitedCombatantStates(
        party,
        this.targetIds,
        this.action.targetingProperties.prohibitedHitCombatantStates,
        actionUser
      )
    );

    if (actionUser.wasRemovedBeforeHitOutcomes()) {
      filteredTargetIds = [];
    }

    const hitOutcomes = new CombatActionHitOutcomes();

    const incomingResourceChanges =
      this.incomingResourceChangesCalculator.getBaseIncomingResourceChangesPerTarget();

    // let mitigationCalculator: null | HitOutcomeMitigationCalculator = null;
    let mitigationCalculator: HitOutcomeMitigationCalculator | null = null;
    const actionRank = this.actionExecutionIntent.rank;

    for (const targetId of filteredTargetIds) {
      const targetCombatant = party.combatantManager.getExpectedCombatant(targetId);
      if (!mitigationCalculator) {
        mitigationCalculator = new HitOutcomeMitigationCalculator(
          this.action,
          actionRank,
          actionUser,
          targetCombatant,
          incomingResourceChanges,
          this.rngPolicy,
          this.resourceChangePropertiesStrategy
        );
      }

      HitOutcomeCalculator.calculateHitOutcomesOnTarget(
        targetCombatant,
        mitigationCalculator,
        incomingResourceChanges,
        actionRank,
        hitOutcomes
      );
    }

    return hitOutcomes;
  }
}
