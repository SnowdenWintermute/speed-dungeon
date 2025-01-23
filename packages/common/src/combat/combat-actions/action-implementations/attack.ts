import {
  CombatActionComponent,
  CombatActionComponentConfig,
  CombatActionComposite,
  CombatActionName,
  CombatActionUsabilityContext,
  TargetCategories,
  TargetingScheme,
} from "..";
import { CombatantProperties, Combatant } from "../../../combatants/index.js";
import { CombatantCondition } from "../../../combatants/combatant-conditions/index.js";
import { ProhibitedTargetCombatantStates } from "../prohibited-target-combatant-states.js";
import { TargetingCalculator } from "../../targeting/targeting-calculator";

const config: CombatActionComponentConfig = {
  description: "Attack with equipped weapons or fists",
  targetingSchemes: [TargetingScheme.Single],
  validTargetCategories: TargetCategories.Opponent,
  autoTargetSelectionMethod: null,
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
  getExecutionTime: () => 0,
  isMelee: function (user: CombatantProperties): boolean {
    // @TODO - determine based on equipment
    throw new Error("Function not implemented.");
  },
  requiresCombatTurn: () => true,
  shouldExecute: () => true,
  getAnimationsAndEffects: function (): void {
    // rely on children for this
    throw new Error("Function not implemented.");
  },
  getHpChangeProperties: () => null, // client should display child hp change properties
  getAppliedConditions: function (): CombatantCondition[] | null {
    // @TODO - determine based on equipment
    throw new Error("Function not implemented.");
  },
  getAutoTarget: (characterData, combatAction) => {
    const { game, party, character, player } = characterData;
    const targetingCalculator = new TargetingCalculator(game, party, character, player);
    return targetingCalculator.getPreferredOrDefaultActionTargets(combatAction);
  },
  getChildren: function (combatant: Combatant): CombatActionComponent[] | null {
    // @TODO - determine based on equipment
    throw new Error("Function not implemented.");
  },
  getParent: () => null,
};

export const ATTACK = new CombatActionComposite(CombatActionName.Attack, config);
