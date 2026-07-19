import cloneDeep from "lodash.clonedeep";
import { CombatActionCostPropertiesConfig } from "../../../combat-action-cost-properties.js";
import { FAST_ACTION_COST_PROPERTIES_CONFIG } from "./fast-action.js";
import { BASIC_ACTION_COST_PROPERTIES_CONFIG } from "./basic-action.js";
import { BASIC_SPELL_COST_PROPERTIES_CONFIG } from "./basic-spell.js";
import { FAST_SPELL_COST_PROPERTIES_CONFIG } from "./fast-spell.js";
import {
  BASIC_MELEE_MAIN_HAND_ATTACK_COST_PROPERTIES_CONFIG,
  BASIC_MELEE_OFFHAND_ATTACK_COST_PROPERTIES_CONFIG,
  BASIC_RANGED_MAIN_HAND_ATTACK_COST_PROPERTIES_CONFIG,
} from "./basic-attacks.js";
import { FREE_ACTION_COST_PROPERTIES_CONFIG } from "./free-action.js";
import { EquipmentSlotType } from "../../../../../items/equipment/slots.js";
import { CombatActionName } from "../../../combat-action-names.js";
import { AbilityType } from "../../../../../abilities/ability-types.js";
import { IActionUser } from "../../../../../action-user-context/action-user.js";
import { CombatActionComponent } from "../../../index.js";
import { invariant } from "../../../../../utils/index.js";
import { ActionPayableResource } from "../../../action-calculation-utils/action-costs.js";

export const COST_PROPERTIES_TEMPLATE_GETTERS = {
  BASIC_ACTION: () => cloneDeep(BASIC_ACTION_COST_PROPERTIES_CONFIG),
  FAST_ACTION: () => cloneDeep(FAST_ACTION_COST_PROPERTIES_CONFIG),
  BASIC_SPELL: () => cloneDeep(BASIC_SPELL_COST_PROPERTIES_CONFIG),
  FAST_SPELL: () => cloneDeep(FAST_SPELL_COST_PROPERTIES_CONFIG),
  BASIC_MELEE_MAIN_HAND_ATTACK: () =>
    cloneDeep(BASIC_MELEE_MAIN_HAND_ATTACK_COST_PROPERTIES_CONFIG),
  BASIC_MELEE_OFF_HAND_ATTACK: () => cloneDeep(BASIC_MELEE_OFFHAND_ATTACK_COST_PROPERTIES_CONFIG),
  BASIC_RANGED_MAIN_HAND_ATTACK: () =>
    cloneDeep(BASIC_RANGED_MAIN_HAND_ATTACK_COST_PROPERTIES_CONFIG),
  FREE_ACTION: () => cloneDeep(FREE_ACTION_COST_PROPERTIES_CONFIG),
};

export function createCostPropertiesConfig(
  templateGetter: () => CombatActionCostPropertiesConfig,
  overrides: Partial<CombatActionCostPropertiesConfig>
): CombatActionCostPropertiesConfig {
  const base = templateGetter();

  return {
    ...base,
    ...overrides,
    incursDurabilityLoss: {
      [EquipmentSlotType.Wearable]: {
        ...base.incursDurabilityLoss[EquipmentSlotType.Wearable],
        ...overrides.incursDurabilityLoss?.[EquipmentSlotType.Wearable],
      },
      [EquipmentSlotType.Holdable]: {
        ...base.incursDurabilityLoss[EquipmentSlotType.Holdable],
        ...overrides.incursDurabilityLoss?.[EquipmentSlotType.Holdable],
      },
    },
    costsByRank: {
      ...base.costsByRank,
      ...overrides.costsByRank,
    },
  };
}

export function getResourceCostsBasedOnOwnedRank(
  user: IActionUser,
  actionName: CombatActionName,
  actionComponent: CombatActionComponent,
  inCombat: boolean
) {
  const userOwnedRank = user.getCombatantProperties().abilityProperties.getAbilityRank({
    type: AbilityType.Action,
    actionName,
  });
  let value = cloneDeep(actionComponent.costProperties.costsByRank[userOwnedRank]);
  if (value === undefined) {
    value = {};
  }

  if (!inCombat) {
    delete value[ActionPayableResource.ActionPoints];
  }
  return value;
}
