import { CombatantConditionName, IdGenerator } from "../../index.js";
import { CombatantConditionConfig, CombatantConditionInit } from "./combatant-condition-config.js";
import { FOLLOWING_PET_COMMAND_CONFIG_CREATOR } from "./following-pet-command-config.js";
import { CombatantCondition } from "./index.js";
import { FLYING_CONFIG_CREATOR } from "./flying-config.js";
import { PRIMED_FOR_EXPLOSION_CONFIG_CREATOR } from "./primed-for-explosion-config.js";
import { PRIMED_FOR_ICE_BURST_CONFIG_CREATOR } from "./primed-for-ice-burst-config.js";
import { BURNING_CONFIG_CREATOR } from "./burning-config.js";
import { BLINDED_CONFIG_CREATOR } from "./blinded-config.js";

export class CombatantConditionFactory {
  constructor(private idGenerator: IdGenerator) {}
  create(init: CombatantConditionInit): CombatantCondition {
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
