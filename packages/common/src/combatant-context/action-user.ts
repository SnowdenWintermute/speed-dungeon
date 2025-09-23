import { AdventuringParty } from "../adventuring-party/index.js";
import { Combatant, CombatantProperties, ConditionAppliedBy } from "../combatants/index.js";
import { ERROR_MESSAGES } from "../errors/index.js";
import { SpeedDungeonGame } from "../game/index.js";
import {
  CombatantActionState,
  CombatantAttributeRecord,
  CombatantEquipment,
  Inventory,
} from "../combatants/index.js";
import { CombatActionName } from "../combat/combat-actions/combat-action-names.js";
import { EntityId, EntityProperties, MaxAndCurrent } from "../primatives/index.js";
import { ActionUserTargetingProperties } from "./action-user-targeting-properties.js";
import { FriendOrFoe } from "../combat/combat-actions/targeting-schemes-and-categories.js";
import { Quaternion, Vector3 } from "@babylonjs/core";

export interface IActionUser {
  payResourceCosts(): void;
  handleTurnEnded(): void;

  // GETTERS
  getEntityId(): EntityId;
  getName(): string;
  getEntityProperties(): EntityProperties;
  getLevel(): number;
  getTotalAttributes(): CombatantAttributeRecord;
  getOwnedAbilities(): Partial<Record<CombatActionName, CombatantActionState>>;
  getEquipmentOption: () => null | CombatantEquipment;
  getInventoryOption(): null | Inventory;
  getTargetingProperties(): ActionUserTargetingProperties;
  getAllyAndOpponentIds(): Record<FriendOrFoe, EntityId[]>;

  // COMBATANTS
  getCombatantProperties(): CombatantProperties;

  // CONDITIONS
  getConditionAppliedBy(): ConditionAppliedBy;
  getConditionStacks(): MaxAndCurrent;

  // POSITION HAVERS
  getPosition(): Vector3;
  getHomePosition(): Vector3;
  getHomeRotation(): Quaternion;

  // ex: a condition should give threat caused by it's burning ticks to the caster of the spell that caused the condition
  getIdOfEntityToCreditWithThreat(): EntityId;
}

export class ActionUserContext {
  constructor(
    public game: SpeedDungeonGame,
    public party: AdventuringParty,
    public actionUser: IActionUser
  ) {}

  getBattleOption() {
    if (this.party.battleId === null) return null;
    const expectedBattle = this.game.battles[this.party.battleId];
    if (!expectedBattle) throw new Error(ERROR_MESSAGES.GAME.BATTLE_DOES_NOT_EXIST);
    return expectedBattle;
  }

  getAllyAndOpponentIds(): Record<FriendOrFoe, EntityId[]> {
    throw new Error("not implemented");
    const battleOption = this.getBattleOption();
    return { [FriendOrFoe.Friendly]: this.party.characterPositions, [FriendOrFoe.Hostile]: [] };
  }

  getOpponents(): Combatant[] {
    const toReturn: Combatant[] = [];
    return toReturn;
  }
}
