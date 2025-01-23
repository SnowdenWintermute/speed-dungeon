import {
  CombatActionComponent,
  CombatActionComponentConfig,
  CombatActionLeaf,
  CombatActionName,
  CombatActionUsabilityContext,
  TargetCategories,
  TargetingScheme,
} from "../index.js";
import { DEFAULT_COMBAT_ACTION_PERFORMANCE_TIME } from "../../../app-consts.js";
import { CombatantProperties, Combatant } from "../../../combatants/index.js";
import { CombatantCondition } from "../../../combatants/combatant-conditions/index.js";
import { ProhibitedTargetCombatantStates } from "../prohibited-target-combatant-states.js";
import { AutoTargetingScheme, copyTargetFromParent } from "../../targeting/index.js";
import { ATTACK } from "./attack";

const config: CombatActionComponentConfig = {
  description: "Attack with equipped weapons or fists",
  targetingSchemes: [TargetingScheme.Single],
  validTargetCategories: TargetCategories.Opponent,
  autoTargetSelectionMethod: { scheme: AutoTargetingScheme.CopyParent },
  usabilityContext: CombatActionUsabilityContext.InCombat,
  prohibitedTargetCombatantStates: [
    ProhibitedTargetCombatantStates.Dead,
    ProhibitedTargetCombatantStates.UntargetableByPhysical,
  ],
  baseHpChangeValuesLevelMultiplier: 1,
  accuracyPercentModifier: 100,
  appliesConditions: [],
  incursDurabilityLoss: {},
  costs: null,
  getExecutionTime: () => DEFAULT_COMBAT_ACTION_PERFORMANCE_TIME,
  isMelee: (_user: CombatantProperties) => true,
  requiresCombatTurn: () => true,
  shouldExecute: () => true,
  getAnimationsAndEffects: function (): void {
    // combatant move self into melee range
    // animate combatant (swing main hand) (later can animate specific swings based on equipped weapon)
    throw new Error("Function not implemented.");
  },
  getHpChangeProperties: (user) => {
    //
    //ret
  },
  getAppliedConditions: function (): CombatantCondition[] | null {
    // ex: could make a "poison blade" item
    return null;
  },
  getAutoTarget(characterAssociatedData, combatAction) {
    // @TODO - change it to auto lookup the function based on this actions auto-targeting method
    return copyTargetFromParent(characterAssociatedData, combatAction);
  },
  getChildren: () => null,
  getParent: () => ATTACK,
};

export const ATTACK_MELEE_MAIN_HAND = new CombatActionLeaf(CombatActionName.Attack, config);
