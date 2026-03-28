import makeAutoObservable from "mobx-store-inheritance";
import { AbilityUtils } from "../abilities/ability-utils.js";
import { AbilityTreeAbility } from "../abilities/index.js";
import { ABILITY_TREES } from "./ability-tree/set-up-ability-trees.js";
import {
  ABILITY_POINTS_AWARDED_PER_LEVEL,
  ATTRIBUTE_POINTS_AWARDED_PER_LEVEL,
  COMBATANT_MAX_LEVEL,
} from "../app-consts.js";
import { CombatantSubsystem } from "./combatant-subsystem.js";
import { AdventuringParty } from "../adventuring-party/index.js";
import { CombatantClass } from "./combatant-class/classes.js";
import { calculateTotalExperience } from "./experience-points/calculate-total-experience.js";
import { ExperiencePoints } from "./experience-points/index.js";
import { ReactiveNode, Serializable, SerializedOf } from "../serialization/index.js";
import { CombatantClassProperties } from "./combatant-class-properties.js";

export class ClassProgressionProperties
  extends CombatantSubsystem
  implements ReactiveNode, Serializable
{
  private supportClass: null | CombatantClassProperties = null;
  public experiencePoints = new ExperiencePoints();

  constructor(private mainClass: CombatantClassProperties) {
    super();
  }

  makeObservable() {
    makeAutoObservable(this);
  }

  toSerialized() {
    return {
      mainClass: this.mainClass.toSerialized(),
      supportClass: this.supportClass ? this.supportClass.toSerialized() : null,
      experiencePoints: this.experiencePoints.toSerialized(),
    };
  }

  static fromSerialized(serialized: SerializedOf<ClassProgressionProperties>) {
    const { mainClass, supportClass, experiencePoints } = serialized;
    const result = new ClassProgressionProperties(
      CombatantClassProperties.fromSerialized(mainClass)
    );
    result.experiencePoints = ExperiencePoints.fromSerialized(experiencePoints);
    result.supportClass = supportClass
      ? CombatantClassProperties.fromSerialized(supportClass)
      : null;
    return result;
  }

  getSupportClassOption() {
    return this.supportClass;
  }

  getMainClass() {
    return this.mainClass;
  }

  setMainClass(combatantClass: CombatantClass) {
    this.mainClass.combatantClass = combatantClass;
  }

  private convertExperienceToClassLevels() {
    let levelupCount = 0;

    while (true) {
      const requiredForNextLevel = this.experiencePoints.getRequiredForNextLevel();
      const noNextLevelExists = requiredForNextLevel === null;
      if (noNextLevelExists) break;

      const current = this.experiencePoints.getCurrent();
      const notEnoughExperienceToLevel = current < requiredForNextLevel;
      if (notEnoughExperienceToLevel) break;

      const reachedMaxLevel = this.mainClass.level === COMBATANT_MAX_LEVEL;
      if (reachedMaxLevel) break;

      this.experiencePoints.changeExperience(-requiredForNextLevel);
      this.experiencePoints.incrementNextLevelRequirement();

      levelupCount += 1;
    }

    return levelupCount;
  }

  get totalExperiencePoints() {
    return calculateTotalExperience(this.mainClass.level) + this.experiencePoints.getCurrent();
  }

  isEligableToReceiveExperiencePoints(party: AdventuringParty) {
    const combatantProperties = this.getCombatantProperties();
    const isDead = combatantProperties.isDead();
    if (isDead) {
      return false;
    }

    // check if they are pet of combatant
    const { summonedBy } = combatantProperties.controlledBy;
    if (summonedBy === undefined) {
      return true;
    }

    const petOwner = party.combatantManager.getExpectedCombatant(summonedBy);
    const maxPetLevel = petOwner.combatantProperties.abilityProperties.getMaxPetLevel();
    const petLevel = combatantProperties.classProgressionProperties.getMainClass().level;
    return petLevel < maxPetLevel;
  }

  /** Returns the new level reached for this combatant if any */
  awardLevelups() {
    const levelupCount = this.convertExperienceToClassLevels();
    if (!levelupCount) return null;

    const combatantProperties = this.getCombatantProperties();
    const { abilityProperties, attributeProperties, resources } = combatantProperties;

    for (let levelup = 0; levelup < levelupCount; levelup += 1) {
      this.getMainClass().level += 1;
      abilityProperties.changeUnspentAbilityPoints(ABILITY_POINTS_AWARDED_PER_LEVEL);
      attributeProperties.changeUnspentPoints(ATTRIBUTE_POINTS_AWARDED_PER_LEVEL);

      resources.setToMax();
    }

    return this.getMainClass().level;
  }

  private changeSupportClassLevel(combatantClass: CombatantClass, value: number) {
    if (this.supportClass !== null) {
      this.supportClass.level += value;
    } else {
      this.supportClass = new CombatantClassProperties(combatantClass, value);
    }
  }

  incrementSupportClassLevel(supportClass: CombatantClass) {
    const combatantProperties = this.getCombatantProperties();
    combatantProperties.resources.maintainResourcePercentagesAfterEffect(() => {
      this.changeSupportClassLevel(supportClass, 1);
      combatantProperties.abilityProperties.changeUnspentAbilityPoints(1);
    });
  }

  meetsCombatantClassAndLevelRequirements(combatantClass: CombatantClass, level: number) {
    const { supportClass } = this;
    const supportClassMeetsRequirements =
      supportClass?.combatantClass === combatantClass && supportClass.level >= level;
    const mainClassMeetsRequirements =
      this.mainClass.combatantClass === combatantClass && this.mainClass.level >= level;
    return supportClassMeetsRequirements || mainClassMeetsRequirements;
  }

  isRequiredClassLevelToAllocateToAbility(
    ability: AbilityTreeAbility,
    abilityRank: number,
    isSupportClass: boolean
  ) {
    // const characterLevel = isSupportClass ? combatantProperties.supportClassProperties?.level || 0: combatantProperties.level;
    let characterLevel: number = 0;
    let combatantClass: CombatantClass;
    if (isSupportClass) {
      const supportClassOption = this.supportClass;
      if (supportClassOption === null) throw new Error("expected support class not found");
      characterLevel = supportClassOption.level;
      combatantClass = supportClassOption.combatantClass;
    } else {
      characterLevel = this.mainClass.level;
      combatantClass = this.mainClass.combatantClass;
    }

    const abilityTree = ABILITY_TREES[combatantClass];
    const levelRequiredForFirstRank = AbilityUtils.getCharacterLevelRequiredForFirstRank(
      abilityTree,
      ability
    );
    const characterLevelRequired = levelRequiredForFirstRank + abilityRank;
    return characterLevel >= characterLevelRequired;
  }
}
