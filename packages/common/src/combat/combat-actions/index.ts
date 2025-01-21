export * from "./combat-action-names.js";
export * from "./get-ability-mana-cost.js";
export * from "./combat-action-requires-melee-range.js";
export * from "./get-combat-action-execution-time.js";
export * from "./targeting-schemes-and-categories.js";
export * from "./combat-action-usable-cotexts.js";
import { ActionCommandPayload } from "../../action-processing/index.js";
import { AdventuringParty } from "../../adventuring-party/index.js";
import { DEFAULT_COMBAT_ACTION_PERFORMANCE_TIME } from "../../app-consts.js";
import { Combatant, CombatantProperties } from "../../combatants/index.js";
import { ConsumableType } from "../../items/consumables/index.js";
import {
  EquipmentSlotType,
  HoldableSlotType,
  WearableSlotType,
} from "../../items/equipment/slots.js";
import { ProhibitedTargetCombatantStates } from "./prohibited-target-combatant-states.js";
import { TargetCategories, TargetingScheme } from "./targeting-schemes-and-categories.js";
import { CombatantCondition } from "../../combatants/combatant-conditions/index.js";
import { CombatActionUsabilityContext } from "./combat-action-usable-cotexts.js";
import { DurabilityLossCondition } from "./combat-action-durability-loss-condition.js";
import { CombatActionName } from "./combat-action-names.js";
import { CombatActionHpChangeProperties } from "./combat-action-hp-change-properties.js";
import { Battle } from "../../battle/index.js";

export interface CombatActionCost {
  base: number;
  multipliers?: CombatActionCostMultipliers;
}
export interface CombatActionCostMultipliers {
  actionLevel?: number;
  userCombatantLevel?: number;
}

export abstract class CombatActionComponent {
  description: string = "";
  targetingSchemes: TargetingScheme[] = [TargetingScheme.Single];
  validTargetCategories: TargetCategories = TargetCategories.Opponent;
  usabilityContext: CombatActionUsabilityContext = CombatActionUsabilityContext.InCombat;
  prohibitedTargetCombatantStates?: ProhibitedTargetCombatantStates[] = [
    ProhibitedTargetCombatantStates.Dead,
  ];
  isMelee: boolean = true;
  isUsableInThisContext: (battleOption: Battle | null) => boolean = (battleOption) => {
    switch (this.usabilityContext) {
      case CombatActionUsabilityContext.All:
        return true;
      case CombatActionUsabilityContext.InCombat:
        return battleOption !== null;
      case CombatActionUsabilityContext.OutOfCombat:
        return battleOption === null;
    }
  };
  requiresCombatTurn: (user: CombatantProperties) => boolean = () => {
    // take the user so we can for example check during attackMeleeMh if they have a shield equipped, therefore it should end turn
    // also possible to check if they have a "tired" debuff which causes all actions to end turn
    return true;
  };
  shouldExecuteNextChild: (party: AdventuringParty, user: CombatantProperties) => boolean = () => {
    // could use the combatant's ability to hold state which may help determine, such as if using chain lightning and an enemy
    // target exists that is not the last arced to target
    return false;
  };
  getHpChangeProperties: (user: CombatantProperties) => null | CombatActionHpChangeProperties =
    () => {
      // take the user becasue the hp change properties may be affected by equipment
      return null;
    };
  baseHpChangeValuesLevelMultiplier: number = 1.0;
  accuracyPercentModifier: number = 100;
  appliesConditions: CombatantCondition[] = [];
  incursDurabilityLoss?: {
    [EquipmentSlotType.Wearable]?: Partial<Record<WearableSlotType, DurabilityLossCondition>>;
    [EquipmentSlotType.Holdable]?: Partial<Record<HoldableSlotType, DurabilityLossCondition>>;
  };
  protected children?: CombatActionComponent[];
  getChildren: (combatant: Combatant) => null | CombatActionComponent[] = () => {
    // if we take in the combatant we can determine the children based on their equipped weapons (melee attack mh, melee attack oh etc)
    // spell levels (level 1 chain lightning only gets 1 ChainLightningArc child) or other status
    // (energetic swings could do multiple attacks based on user's current percent of max hp)
    // could also create random children such as a chaining random elemental damage
    if (this.children) return this.children;
    else return null;
  };
  addChild: (childAction: CombatActionComponent) => Error | void = () =>
    new Error("Can't add a child to this component");
  costs?: {
    hp?: CombatActionCost;
    mp?: CombatActionCost;
    shards?: CombatActionCost;
    quickActions?: CombatActionCost;
    consumableType?: ConsumableType;
  };
  executionTime: number = DEFAULT_COMBAT_ACTION_PERFORMANCE_TIME;

  constructor(public name: CombatActionName) {}
}

export class CombatActionLeaf extends CombatActionComponent {}
export class CombatActionComposite extends CombatActionComponent {
  protected children: CombatActionComponent[] = [];
  addChild: (childAction: CombatActionComponent) => void | Error = (
    childAction: CombatActionComponent
  ) => {
    this.children.push(childAction);
  };
}
