import makeAutoObservable from "mobx-store-inheritance";
import { iterateNumericEnumKeyedRecord, runIfInBrowser } from "../utils/index.js";
import { CombatantSubsystem } from "./combatant-subsystem.js";
import { plainToInstance } from "class-transformer";
import { COMBATANT_MAX_ACTION_POINTS } from "../app-consts.js";
import { CombatAttribute } from "./index.js";
import { ActionPayableResource } from "../combat/combat-actions/index.js";

export class CombatantResources extends CombatantSubsystem {
  private hitPoints: number = 0;
  private mana: number = 0;
  private actionPoints: number = 0;

  constructor() {
    super();
    runIfInBrowser(() => makeAutoObservable(this, {}, { autoBind: true }));
  }

  static getDeserialized(self: CombatantResources) {
    const deserialized = plainToInstance(CombatantResources, self);
    return deserialized;
  }

  getHitPoints = () => this.hitPoints;
  getMana = () => this.mana;
  getActionPoints = () => this.actionPoints;

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

  private getResourcePercentagesOfMax() {
    const combatantProperties = this.getCombatantProperties();
    const totalAttributes = combatantProperties.attributeProperties.getTotalAttributes();
    const maxHitPoints = totalAttributes[CombatAttribute.Hp];
    const maxMana = totalAttributes[CombatAttribute.Mp];
    const percentOfMaxHitPoints = this.hitPoints / maxHitPoints;
    const percentOfMaxMana = this.mana / maxMana;

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
