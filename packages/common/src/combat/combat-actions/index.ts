export * from "./combat-action-properties.js";
export * from "./get-ability-mana-cost.js";
export * from "./combat-action-requires-melee-range.js";
export * from "./get-combat-action-execution-time.js";
export * from "./targeting-schemes-and-categories.js";

import { ActionCommandPayload } from "../../action-processing/index.js";
import { AdventuringParty } from "../../adventuring-party/index.js";
import { DEFAULT_COMBAT_ACTION_PERFORMANCE_TIME } from "../../app-consts.js";
import { AbilityName, Combatant, CombatantProperties } from "../../combatants/index.js";
import { ConsumableType } from "../../items/consumables/index.js";
import {
  EquipmentSlotType,
  HoldableSlotType,
  WearableSlotType,
} from "../../items/equipment/slots.js";
import {
  ActionUsableContext,
  CombatActionHpChangeProperties,
  DurabilityLossCondition,
} from "../index.js";
import {
  ProhibitedTargetCombatantStates,
  TargetCategories,
  TargetingScheme,
} from "./targeting-schemes-and-categories.js";

export enum CombatActionType {
  AbilityUsed,
  ConsumableUsed,
}

export interface AbilityUsed {
  type: CombatActionType.AbilityUsed;
  abilityName: AbilityName;
}

export interface ConsumableUsed {
  type: CombatActionType.ConsumableUsed;
  itemId: string;
  // used on client for displaying dummy conusmables in the shop menu
  // otherwise we would just determine the consumable type by the itemId found in the inventory of the combatant
  consumableType?: ConsumableType;
}

export type CombatAction = ConsumableUsed | AbilityUsed;

// client or AI selects a CombatAction
// server get

// when calculating composite action results
// traverse depth first and get child action results
// compose action commands
// apply action commands to game
// check if should continue
// once done
// - evaluate the outcome
// - unapply all results
//
// CHAIN LIGHTNING THOUGHT EXPERIMENT
// - user selects chain lightning and targets
// - server calls execute on chain lightning CombatActionComposite
// - execute takes in the game, user, and targets
//   .forms an ActionResult based on the parent CombatActionComposite's properties
//   .creates ActionCommands from the result and stores them in an ActionCommandGroup for the client
//   .executes the ActionCommands, updating the gameState
//   .checks if shouldProcessNextChild for chain lightning (if any enemy targets remain and numArcsRemaining > 0)
//   .forms an ActionResult based on the next child's CombatActionComposite or CombatActionLeaf's properties
//   .creates ActionCommands from the result and stores them in an ActionCommandGroup for the client
// - client gets the ActionCommandGroup with results of the chain lightning CombatActionComposite
//   .checks what action it was
//   .since it was chain lightning
//      - animate a lightning bolt to the first target
//      - apply the action command changes to game state in the frame event
//      - check for next command
//      - draw an arc from first target to next command's target
//      - apply the action command changes
//   .if it was split corpse
//     - animate combatant into melee range
//     - animate weapon swing
//     - apply action command changes to game state
//     - check for next action command
//     - it should include the targets for the combatants on the side and hp changes
//     - animate spears shooting out from original target toward those targets
//     - apply the hp changes
//  .if it was attack
//    - attack itself has no hp change properties
//    - shouldExecuteNextChild() returns true
//    - getChildren() returns some sequence of attackMeleeMh, attackMeleeOh, etc
//    - executes children in sequence as normal until done
//    - last child will dynamically report requiresCombatTurn() to be true
//    - client can get properties of children and display them
//     - animate combatant into melee range if needed
//     - animate weapon attack for each child
//
//
// COMPLEX CASE
// - action has a child which has multiple children such as conductive spear:
// attack with spear, then activate a chain lightning strike on the attacked target
// which in turn causes successive chain lightning arcs that bounce and hit a target with
// a lightning activated debuff (explosive) which deals fire damage to all targets in the area
// and puts a burning debuff on them
//
// - conductive spear hits, adds damage to action command payloads
// - payloads are converted to ActionCommands, stored to be sent to client, and applied to game state
// - if running this scenario as an evaluation of potential combat action result, save the action commands to be unapplied
// - checks if should execute next child, if target is still alive, it does
// - child is chain lightning action, it strikes the target
// - chain lightning checks if should execute next child, if there is another living enemy besides the target, it does
// - chainLightningArc strikes it's target, as hpChangeProperties are calculated it checks for triggers
// - explosive debuff is found on the target, triggering explosion to be processed after chainLightningArc resolves
// can start animating the explosion while it continues animating the rest of the chainLightningArc
// - chainLightningArc strikes a third target, which also has healingExplosion buff, triggering it to be processed after explosion
// - chainLightningArc runs out of arcs, now we process the explosion
// - explosion damages it's targets, among them is a combatant with a chainReactionExplosion debuff, it gets shifted behind the healingExplosion
// - some combatants have died from the chainLightningArc and the explosion, the remaining ones are healed by the healing explosion
// - finally, the chainReactionExplosion is processed
// - the batch of actionCommands are sent to the client
// - client animates the user striking the target with spear
// - client animates the lightning strike
// - client animates the first arc
// - client animates the 2nd arc
// - client animates the explosion debuff triggered by 1st arc
// - client animates the healing explosion debuff triggered by 2nd arc
// - client animates the chainExplosion triggered by the first explosion debuff
//
//
//
// CombatActionProperties
// CombatActionPropertiesComposite
// CombatActionPropertiesLeaf

export interface CombatActionCost {
  base: number;
  multipliers?: CombatActionCostMultipliers;
}
export interface CombatActionCostMultipliers {
  actionLevel?: number;
  userCombatantLevel?: number;
}

export abstract class CombatActionComponent {
  targetingSchemes: TargetingScheme[] = [TargetingScheme.Single];
  validTargetCategories: TargetCategories = TargetCategories.Opponent;
  usabilityContext: ActionUsableContext = ActionUsableContext.InCombat;
  prohibitedTargetCombatantStates?: ProhibitedTargetCombatantStates[] = [
    ProhibitedTargetCombatantStates.Dead,
  ];
  isMelee: boolean = true;
  // take the user so we can for example check during attackMeleeMh if they have a shield equipped, therefore it should end turn
  // also possible to check if they have a "tired" debuff which causes all actions to end turn
  requiresCombatTurn: (user: CombatantProperties) => boolean = () => true;
  // could use the combatant's ability to hold state which may help determine, such as if using chain lightning and an enemy
  // target exists that is not the last arced to target
  shouldExecuteNextChild: (party: AdventuringParty, user: CombatantProperties) => boolean = () =>
    false;
  getHpChangeProperties?: CombatActionHpChangeProperties;
  description: string = "";
  accuracyPercentModifier: number = 100;
  incursDurabilityLoss?: {
    [EquipmentSlotType.Wearable]?: Partial<Record<WearableSlotType, DurabilityLossCondition>>;
    [EquipmentSlotType.Holdable]?: Partial<Record<HoldableSlotType, DurabilityLossCondition>>;
  };
  // if we take in the combatant we can determine the children based on their equipped weapons (melee attack mh, melee attack oh etc)
  // spell levels (level 1 chain lightning only gets 1 ChainLightningArc child) or other status
  // (energetic swings could do multiple attacks based on user's current percent of max hp)
  // could also create random children such as a chaining random elemental damage
  getChildren: (combatant: Combatant) => null | CombatActionComponent[] = () => null;
  addChild: () => Error | void = () => new Error("Can't add a child to this component");
  execute: () => Error | ActionCommandPayload[] = () => {
    return new Error("Execute was not implemented on this combat action");
    // - if attack, call execute on children
    // - client can call getChildren to get combat action properties for meleeMh, meleeOh, rangedMh and display them
    // - if chain lightning, create action commands base on own properties,
    // then check shouldExecuteNextLeaf, then call execute on first child
    // child ChainLightningArc should select a target which was not the last targeted enemy
    // and create an action command payload from that
  };
  constructor(
    public type: CombatActionType,
    public costs: {
      hp?: CombatActionCost;
      mp?: CombatActionCost;
      shards?: CombatActionCost;
      quickActions?: CombatActionCost;
      consumableType?: ConsumableType;
    },
    public baseHpChangeValuesLevelMultiplier: number = 1.0,
    public executionTime: number = DEFAULT_COMBAT_ACTION_PERFORMANCE_TIME
  ) {}
}
