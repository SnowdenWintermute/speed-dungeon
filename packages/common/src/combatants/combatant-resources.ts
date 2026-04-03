import makeAutoObservable from "mobx-store-inheritance";
import { iterateNumericEnumKeyedRecord } from "../utils/index.js";
import { CombatantSubsystem } from "./combatant-subsystem.js";
import { instanceToPlain, plainToInstance } from "class-transformer";
import { COMBATANT_MAX_ACTION_POINTS } from "../app-consts.js";
import { ActionPayableResource } from "../combat/combat-actions/action-calculation-utils/action-costs.js";
import { CombatAttribute } from "./attributes/index.js";
import { ERROR_MESSAGES } from "../errors/index.js";
import { ReactiveNode, Serializable, SerializedOf } from "../serialization/index.js";
import { NormalizedPercentage } from "../aliases.js";

export class CombatantResources extends CombatantSubsystem implements ReactiveNode, Serializable {
  private hitPoints: number = 1;
  private mana: number = 0;
  private actionPoints: number = 0;

  makeObservable() {
    makeAutoObservable(this);
  }

  toSerialized() {
    return instanceToPlain(this);
  }

  static fromSerialized(serialized: SerializedOf<CombatantResources>) {
    const result = plainToInstance(CombatantResources, serialized);
    return result;
  }

  getHitPoints() {
    return this.hitPoints;
  }
  getMana() {
    return this.mana;
  }
  getActionPoints() {
    return this.actionPoints;
  }
  requireActionPointCount(count: number) {
    if (this.actionPoints < count) {
      new Error(ERROR_MESSAGES.COMBAT_ACTIONS.INSUFFICIENT_RESOURCES);
    }
  }

  refillActionPoints() {
    this.actionPoints = COMBATANT_MAX_ACTION_POINTS;
  }

  get maxResources() {
    const { attributeProperties } = this.getCombatantProperties();
    const totalAttributes = attributeProperties.getTotalAttributes();
    const maxHpOption = totalAttributes[CombatAttribute.Hp];
    if (isNaN(maxHpOption)) throw new Error("unexpected NaN");
    const maxMpOption = totalAttributes[CombatAttribute.Mp];
    if (isNaN(maxMpOption)) throw new Error("unexpected NaN");
    return { mana: maxMpOption, hitPoints: maxHpOption };
  }

  setToMax() {
    const { mana, hitPoints } = this.maxResources;
    this.hitPoints = hitPoints;
    this.mana = mana;
  }

  clampResourcesToMax() {
    const { mana: maxMana, hitPoints: maxHitPoints } = this.maxResources;
    if (this.hitPoints > maxHitPoints) this.hitPoints = maxHitPoints;
    if (this.mana > maxMana) this.mana = maxMana;
  }

  changeActionPoints(value: number) {
    const newCandidateValue = Math.max(0, this.actionPoints + value);
    this.actionPoints = Math.min(COMBATANT_MAX_ACTION_POINTS, newCandidateValue);
  }

  changeMana(value: number) {
    if (isNaN(value)) throw new Error("change was NaN");
    const { mana: maxMana } = this.maxResources;
    this.mana = Math.max(0, Math.min(maxMana, this.mana + value));
  }

  changeHitPoints(value: number) {
    if (isNaN(value)) throw new Error("change was NaN");
    const { hitPoints: max } = this.maxResources;
    const newHitPoints = Math.max(0, Math.min(max, this.hitPoints + value));
    this.hitPoints = newHitPoints;
  }

  payResourceCosts(costs: Partial<Record<ActionPayableResource, number>>) {
    for (const [resource, cost] of iterateNumericEnumKeyedRecord(costs)) {
      switch (resource) {
        case ActionPayableResource.HitPoints:
          this.changeHitPoints(cost);
          break;
        case ActionPayableResource.Mana:
          this.changeMana(cost);
          break;
        case ActionPayableResource.Shards:
          break;
        case ActionPayableResource.ActionPoints:
          this.changeActionPoints(cost);
          break;
      }
    }
  }

  /** Returns a normalized percentage (0-1)
   *
   *  Returns 1 if resource is currently zero because when allocating points to mana when
   *  combatant previously had zero mana, we want to fill their new mana pool*/
  getResourcePercentagesOfMax() {
    const combatantProperties = this.getCombatantProperties();
    const totalAttributes = combatantProperties.attributeProperties.getTotalAttributes();
    const maxHitPoints = totalAttributes[CombatAttribute.Hp] ?? 0;
    const maxMana = totalAttributes[CombatAttribute.Mp] ?? 0;
    const percentOfMaxHitPoints = maxHitPoints > 0 ? this.hitPoints / maxHitPoints : 1;
    const percentOfMaxMana = maxMana > 0 ? this.mana / maxMana : 1;

    return { percentOfMaxHitPoints, percentOfMaxMana };
  }

  getUnmetCostResourceTypes(costs: Partial<Record<ActionPayableResource, number>> | null) {
    if (costs === null) {
      return [];
    }

    const unmet: ActionPayableResource[] = [];

    for (const [resourceType, cost] of iterateNumericEnumKeyedRecord(costs)) {
      const absoluteCost = Math.abs(cost); // costs are in negative values

      const resourceGetters: Record<ActionPayableResource, () => number> = {
        [ActionPayableResource.HitPoints]: () => this.getHitPoints(),
        [ActionPayableResource.Mana]: () => this.getMana(),
        [ActionPayableResource.Shards]: () => this.getCombatantProperties().inventory.shards,
        [ActionPayableResource.ActionPoints]: () => this.getActionPoints(),
      };

      const resourceGetter = resourceGetters[resourceType];
      const resourceValue = resourceGetter();
      if (absoluteCost > resourceValue) {
        unmet.push(resourceType);
      }
    }

    return unmet;
  }

  maintainResourcePercentagesAfterEffect(effect: () => void) {
    const { percentOfMaxHitPoints, percentOfMaxMana } = this.getResourcePercentagesOfMax();

    effect();

    const combatantProperties = this.getCombatantProperties();

    const attributesAfter = combatantProperties.attributeProperties.getTotalAttributes();
    const maxHitPointsAfter = attributesAfter[CombatAttribute.Hp];
    const maxManaAfter = attributesAfter[CombatAttribute.Mp];

    this.hitPoints = Math.round(maxHitPointsAfter * percentOfMaxHitPoints);
    this.mana = Math.round(maxManaAfter * percentOfMaxMana);
  }
}
