import { BASE_EXPLOSION_RADIUS } from "../../../../../app-consts.js";
import { AutoTargetingScheme } from "../../../../targeting/index.js";
import { CombatActionTargetingPropertiesConfig } from "../../../combat-action-targeting-properties.js";
import { ProhibitedTargetCombatantStates } from "../../../prohibited-target-combatant-states.js";
import { TargetCategories } from "../../../targeting-schemes-and-categories.js";
import { SINGLE_HOSTILE_TARGETING_PROPERTIES } from "./single.js";

export const EXPLOSION_TARGETING_PROPERTIES_CONFIG: CombatActionTargetingPropertiesConfig = {
  ...SINGLE_HOSTILE_TARGETING_PROPERTIES,
  prohibitedTargetCombatantStates: [],
  prohibitedHitCombatantStates: [
    ProhibitedTargetCombatantStates.UntargetableByPhysical,
    ProhibitedTargetCombatantStates.UntargetableBySpells,
    ProhibitedTargetCombatantStates.Dead,
  ],
  autoTargetSelectionMethod: {
    scheme: AutoTargetingScheme.WithinRadiusOfEntity,
    radius: BASE_EXPLOSION_RADIUS,
    validTargetCategories: TargetCategories.Any,
    excludePrimaryTarget: true,
  },
};
