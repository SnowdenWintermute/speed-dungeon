import { IdGenerator } from "../utility-classes/index.js";
import { CombatantConditionConfig, CombatantConditionInit } from "./condition-config.js";
import { CombatantConditionName } from "./condition-names.js";
import { BLINDED_CONFIG_CREATOR } from "./configs/blinded.js";
import { BURNING_CONFIG_CREATOR } from "./configs/burning.js";
import { FLYING_CONFIG_CREATOR } from "./configs/flying.js";
import { FOLLOWING_PET_COMMAND_CONFIG_CREATOR } from "./configs/following-pet-command.js";
import { PRIMED_FOR_EXPLOSION_CONFIG_CREATOR } from "./configs/primed-for-explosion.js";
import { PRIMED_FOR_ICE_BURST_CONFIG_CREATOR } from "./configs/primed-for-ice-burst.js";
import { CombatantCondition } from "./index.js";

export class CombatantConditionFactory {
  constructor(private idGenerator: IdGenerator) {}
  static create(init: CombatantConditionInit): CombatantCondition {
    throw new Error("not implemented");
  }
}

const CONDITION_CONFIGS: Record<
  CombatantConditionName,
  (properties: CombatantConditionInit) => CombatantConditionConfig
> = {
  [CombatantConditionName.PrimedForExplosion]: PRIMED_FOR_EXPLOSION_CONFIG_CREATOR,
  [CombatantConditionName.PrimedForIceBurst]: PRIMED_FOR_ICE_BURST_CONFIG_CREATOR,
  [CombatantConditionName.Burning]: BURNING_CONFIG_CREATOR,
  [CombatantConditionName.Blinded]: BLINDED_CONFIG_CREATOR,
  [CombatantConditionName.FollowingPetCommand]: FOLLOWING_PET_COMMAND_CONFIG_CREATOR,
  [CombatantConditionName.Flying]: FLYING_CONFIG_CREATOR,
};
