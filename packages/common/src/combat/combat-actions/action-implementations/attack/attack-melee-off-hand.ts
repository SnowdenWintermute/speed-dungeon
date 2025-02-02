import {
  CombatActionComponent,
  CombatActionComponentConfig,
  CombatActionLeaf,
  CombatActionName,
  CombatActionUsabilityContext,
  TargetCategories,
  TargetingScheme,
} from "../../index.js";
import {
  DEFAULT_COMBAT_ACTION_PERFORMANCE_TIME,
  OFF_HAND_ACCURACY_MODIFIER,
  OFF_HAND_CRIT_CHANCE_MODIFIER,
  OFF_HAND_DAMAGE_MODIFIER,
} from "../../../../app-consts.js";
import { CombatantCondition } from "../../../../combatants/combatant-conditions/index.js";
import { ProhibitedTargetCombatantStates } from "../../prohibited-target-combatant-states.js";
import { ATTACK } from "./index.js";
import { CombatantEquipment, CombatantProperties } from "../../../../combatants/index.js";
import { CombatAttribute } from "../../../../combatants/attributes/index.js";
import { iterateNumericEnum } from "../../../../utils/index.js";
import { EquipmentSlotType, HoldableSlotType } from "../../../../items/equipment/slots.js";
import { Equipment, EquipmentType } from "../../../../items/equipment/index.js";
import { getAttackHpChangeProperties } from "./get-attack-hp-change-properties.js";
import { getCombatActionTargetIds } from "../../../action-results/get-action-target-ids.js";
import { SpeedDungeonGame } from "../../../../game/index.js";
import { CombatActionIntent } from "../../combat-action-intent.js";
import { AutoTargetingScheme } from "../../../targeting/auto-targeting/index.js";
import { CombatantContext } from "../../../../combatant-context/index.js";
import { ActionExecutionTracker } from "../../../../action-processing/action-execution-tracker.js";
import { ActionResolutionStep } from "../../../../action-processing/index.js";
import { MELEE_ATTACK_COMMON_CONFIG } from "./melee-attack-common-config.js";
import { getStandardActionCritChance } from "../../action-calculation-utils/standard-action-calculations.js";

const config: CombatActionComponentConfig = {
  ...MELEE_ATTACK_COMMON_CONFIG,
  description: "Attack target using equipment in off hand",
  targetingSchemes: [TargetingScheme.Single],
  validTargetCategories: TargetCategories.Opponent,
  autoTargetSelectionMethod: { scheme: AutoTargetingScheme.CopyParent },
  intent: CombatActionIntent.Malicious,
  usabilityContext: CombatActionUsabilityContext.InCombat,
  prohibitedTargetCombatantStates: [
    ProhibitedTargetCombatantStates.Dead,
    ProhibitedTargetCombatantStates.UntargetableByPhysical,
  ],
  baseHpChangeValuesLevelMultiplier: 1,
  accuracyModifier: OFF_HAND_ACCURACY_MODIFIER,
  appliesConditions: [],
  incursDurabilityLoss: { [EquipmentSlotType.Holdable]: { [HoldableSlotType.OffHand]: 1 } },
  costBases: {},
  getResourceCosts: () => null,
  getExecutionTime: () => DEFAULT_COMBAT_ACTION_PERFORMANCE_TIME,
  requiresCombatTurn: (user) => {
    for (const holdableSlotType of iterateNumericEnum(HoldableSlotType)) {
      const equipmentOption = CombatantEquipment.getEquippedHoldable(user, holdableSlotType);
      if (!equipmentOption) continue;
      const { equipmentType } = equipmentOption.equipmentBaseItemProperties.taggedBaseEquipment;
      if (Equipment.isBroken(equipmentOption)) continue;
      if (Equipment.isTwoHanded(equipmentType)) return true;
      if (equipmentType === EquipmentType.Shield) return true;
    }
    return false;
  },
  shouldExecute: (combatantContext, self: CombatActionComponent) => {
    const { game, party, combatant } = combatantContext;

    const battleOption = (party.battleId ? game.battles[party.battleId] : null)!!;
    const targetsOption = combatant.combatantProperties.combatActionTarget;
    if (!targetsOption) return false;
    const idsOfFriendAndFoeResult = SpeedDungeonGame.getAllyIdsAndOpponentIdsOption(
      game,
      party,
      combatant.entityProperties.id
    );

    if (idsOfFriendAndFoeResult instanceof Error) {
      console.trace(idsOfFriendAndFoeResult);
      return false;
    }

    const targetIdsResult = getCombatActionTargetIds(
      party,
      self,
      combatant.entityProperties.id,
      idsOfFriendAndFoeResult.allyIds,
      battleOption,
      targetsOption
    );
    if (targetIdsResult instanceof Error) {
      console.trace(targetIdsResult);
      return false;
    }

    return !SpeedDungeonGame.allCombatantsInGroupAreDead(game, targetIdsResult);
  },
  getAnimationsAndEffects: function (): void {
    // @TODO
    throw new Error("Function not implemented.");
  },
  getCritChance: function (user: CombatantProperties): number {
    return (
      getStandardActionCritChance(user, CombatAttribute.Dexterity) * OFF_HAND_CRIT_CHANCE_MODIFIER
    );
  },
  getHpChangeProperties: (user, primaryTarget, self) => {
    const hpChangeProperties = getAttackHpChangeProperties(
      self,
      user,
      primaryTarget,
      CombatAttribute.Strength,
      HoldableSlotType.MainHand
    );
    if (hpChangeProperties instanceof Error) return hpChangeProperties;

    hpChangeProperties.baseValues.mult(OFF_HAND_DAMAGE_MODIFIER);
    return hpChangeProperties;
  },
  getAppliedConditions: function (): CombatantCondition[] | null {
    return null; // ex: could make a "poison blade" item
  },
  getChildren: () => [],
  getParent: () => ATTACK,
  getFirstResolutionStep: function (
    combatantContext: CombatantContext,
    actionExecutionTracker: ActionExecutionTracker,
    self: CombatActionComponent
  ): ActionResolutionStep {
    throw new Error("Function not implemented.");
  },
};

export const ATTACK_MELEE_OFF_HAND = new CombatActionLeaf(
  CombatActionName.AttackMeleeOffhand,
  config
);
