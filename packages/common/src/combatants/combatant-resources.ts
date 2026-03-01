import makeAutoObservable from "mobx-store-inheritance";
import { iterateNumericEnumKeyedRecord, runIfInBrowser } from "../utils/index.js";
import { CombatantSubsystem } from "./combatant-subsystem.js";
import { plainToInstance } from "class-transformer";
import { COMBATANT_MAX_ACTION_POINTS } from "../app-consts.js";
import { ActionPayableResource } from "../combat/combat-actions/action-calculation-utils/action-costs.js";
import { CombatAttribute } from "./attributes/index.js";
import { ERROR_MESSAGES } from "../errors/index.js";

export class CombatantResources extends CombatantSubsystem {
  private hitPoints: number = 1;
  private mana: number = 0;
  private actionPoints: number = 0;

  constructor() {
    super();
    runIfInBrowser(() => makeAutoObservable(this, {}, {}));
  }

  static getDeserialized(self: CombatantResources) {
    const deserialized = plainToInstance(CombatantResources, self);
    return deserialized;
  }

  getHitPoints = () => this.hitPoints;
  getMana = () => this.mana;
  getActionPoints = () => this.actionPoints;
  requireActionPointCount(count: number) {
    console.log("require action point count:", count, "current:", this.actionPoints);
    if (this.actionPoints < count) {
      new Error(ERROR_MESSAGES.COMBAT_ACTIONS.INSUFFICIENT_RESOURCES);
    }
  }

  refillActionPoints() {
    this.actionPoints = COMBATANT_MAX_ACTION_POINTS;
  }

  setToMax() {
    const { attributeProperties } = this.getCombatantProperties();
    const totalAttributes = attributeProperties.getTotalAttributes();
    const maxHpOption = totalAttributes[CombatAttribute.Hp];
    if (isNaN(maxHpOption)) throw new Error("unexpected NaN");
    this.hitPoints = maxHpOption;
    const maxMpOption = totalAttributes[CombatAttribute.Mp];
    if (isNaN(maxMpOption)) throw new Error("unexpected NaN");
    this.mana = maxMpOption;
  }

  clampResourcesToMax() {
    const { attributeProperties } = this.getCombatantProperties();
    const totalAttributes = attributeProperties.getTotalAttributes();
    const maxHp = totalAttributes[CombatAttribute.Hp];
    const maxMp = totalAttributes[CombatAttribute.Mp];

    if (this.hitPoints > maxHp) this.hitPoints = maxHp;
    if (this.mana > maxMp) this.mana = maxMp;
  }

  changeActionPoints(value: number) {
    const newCandidateValue = Math.max(0, this.actionPoints + value);
    this.actionPoints = Math.min(COMBATANT_MAX_ACTION_POINTS, newCandidateValue);
  }

  changeMana(value: number) {
    if (isNaN(value)) throw new Error("change was NaN");
    const { attributeProperties } = this.getCombatantProperties();
    const maxMana = attributeProperties.getAttributeValue(CombatAttribute.Mp);
    this.mana = Math.max(0, Math.min(maxMana, this.mana + value));
  }

  changeHitPoints(value: number) {
    if (isNaN(value)) throw new Error("change was NaN");
    const { attributeProperties } = this.getCombatantProperties();
    const max = attributeProperties.getAttributeValue(CombatAttribute.Hp);
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
    if (costs === null) return [];

    const combatantProperties = this.getCombatantProperties();

    const unmet: ActionPayableResource[] = [];

    for (const [resourceType, cost] of iterateNumericEnumKeyedRecord(costs)) {
      const absoluteCost = Math.abs(cost); // costs are in negative values

      switch (resourceType) {
        case ActionPayableResource.HitPoints:
          if (absoluteCost > this.getHitPoints()) unmet.push(resourceType);
          break;
        case ActionPayableResource.Mana:
          if (absoluteCost > this.getMana()) unmet.push(resourceType);
          break;
        case ActionPayableResource.Shards:
          if (absoluteCost > combatantProperties.inventory.shards) unmet.push(resourceType);
          break;
        case ActionPayableResource.ActionPoints:
          if (absoluteCost > this.getActionPoints()) unmet.push(resourceType);
          break;
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
