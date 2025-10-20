import { makeAutoObservable } from "mobx";
import { plainToInstance } from "class-transformer";
import { CombatantClass } from "./combatant-class/index.js";
import { AbilityUtils } from "../abilities/ability-utils.js";
import { AbilityTreeAbility } from "../abilities/index.js";
import { ABILITY_TREES } from "./ability-tree/set-up-ability-trees.js";
import {
  COMBATANT_MAX_LEVEL,
  XP_REQUIRED_TO_LEVEL_INCREASE_INCREMENT,
  XP_REQUIRED_TO_REACH_LEVEL_2,
} from "../app-consts.js";

export class ExperiencePoints {
  private current: number = 0;
  private requiredForNextLevel: null | number = XP_REQUIRED_TO_REACH_LEVEL_2;
  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
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
  ) {}
}

export class ClassProgressionProperties {
  private supportClass: null | CombatantClassProperties = null;
  public experiencePoints = new ExperiencePoints();

  constructor(private mainClass: CombatantClassProperties) {
    makeAutoObservable(this, {}, { autoBind: true });
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

  convertExperienceToClassLevels() {
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

  changeSupportClassLevel(combatantClass: CombatantClass, value: number) {
    if (this.supportClass !== null) {
      this.supportClass.level += value;
    } else {
      this.supportClass = { combatantClass, level: value };
    }
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
