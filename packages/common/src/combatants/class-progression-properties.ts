import makeAutoObservable from "mobx-store-inheritance";
import { plainToInstance } from "class-transformer";
import { COMBATANT_CLASS_NAME_STRINGS, CombatantClass } from "./combatant-class/index.js";
import { AbilityUtils } from "../abilities/ability-utils.js";
import { AbilityTreeAbility } from "../abilities/index.js";
import { ABILITY_TREES } from "./ability-tree/set-up-ability-trees.js";
import {
  ABILITY_POINTS_AWARDED_PER_LEVEL,
  ATTRIBUTE_POINTS_AWARDED_PER_LEVEL,
  COMBATANT_MAX_LEVEL,
  XP_REQUIRED_TO_LEVEL_INCREASE_INCREMENT,
  XP_REQUIRED_TO_REACH_LEVEL_2,
} from "../app-consts.js";
import { runIfInBrowser } from "../utils/index.js";
import { CombatantSubsystem } from "./combatant-subsystem.js";

export class ExperiencePoints {
  private current: number = 0;
  private requiredForNextLevel: null | number = XP_REQUIRED_TO_REACH_LEVEL_2;
  constructor() {
    runIfInBrowser(() => makeAutoObservable(this));
  }

  static getDeserialized(experiencePoints: ExperiencePoints) {
    return plainToInstance(ExperiencePoints, experiencePoints);
  }

  changeExperience(value: number) {
    this.current += value;
  }

  getCurrent() {
    return this.current;
  }

  getRequiredForNextLevel() {
    return this.requiredForNextLevel;
  }

  incrementNextLevelRequirement() {
    if (this.requiredForNextLevel === null) return;
    this.requiredForNextLevel += XP_REQUIRED_TO_LEVEL_INCREASE_INCREMENT;
  }
}

export class CombatantClassProperties {
  constructor(
    public level: number,
    public combatantClass: CombatantClass
  ) {
    runIfInBrowser(() => makeAutoObservable(this));
  }

  getStringName() {
    return COMBATANT_CLASS_NAME_STRINGS[this.combatantClass];
  }
}

export class ClassProgressionProperties extends CombatantSubsystem {
  private supportClass: null | CombatantClassProperties = null;
  public experiencePoints = new ExperiencePoints();

  constructor(private mainClass: CombatantClassProperties) {
    super();
    runIfInBrowser(() => makeAutoObservable(this));
  }

  static getDeserialized(self: ClassProgressionProperties) {
    const deserialized = plainToInstance(ClassProgressionProperties, self);
    deserialized.experiencePoints = ExperiencePoints.getDeserialized(deserialized.experiencePoints);
    return deserialized;
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

  /** Returns the new level reached for this combatant if any */
  awardLevelups() {
    const levelupCount = this.convertExperienceToClassLevels();

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
