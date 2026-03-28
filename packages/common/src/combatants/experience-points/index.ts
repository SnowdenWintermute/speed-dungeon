import { makeAutoObservable } from "mobx";
import {
  XP_REQUIRED_TO_LEVEL_INCREASE_INCREMENT,
  XP_REQUIRED_TO_REACH_LEVEL_2,
} from "../../app-consts.js";
import { ReactiveNode, Serializable, SerializedOf } from "../../serialization/index.js";
import { instanceToPlain, plainToInstance } from "class-transformer";

export class ExperiencePoints implements ReactiveNode, Serializable {
  private current: number = 0;
  private requiredForNextLevel: null | number = XP_REQUIRED_TO_REACH_LEVEL_2;

  makeObservable() {
    makeAutoObservable(this);
  }

  toSerialized() {
    return instanceToPlain(this);
  }

  static fromSerialized(serialized: SerializedOf<ExperiencePoints>) {
    return plainToInstance(ExperiencePoints, serialized);
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
