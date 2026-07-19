import { BASE_XP_PER_MONSTER } from "../app-consts.js";
import { AffixCategory } from "../items/equipment/affixes.js";
import {
  LootItemLevelType,
  LootItemSelectorType,
  MonsterRewardProfile,
} from "../items/loot-generation/reward-profile.js";
import { MonsterType } from "./monster-types.js";

export const FALLBACK_MONSTER_REWARD_PROFILE: MonsterRewardProfile = {
  experience: BASE_XP_PER_MONSTER,
  drops: [
    {
      chance: 1,
      quantity: { min: 1, max: 1 },
      itemLevel: { type: LootItemLevelType.CenteredOnFloor, spread: 1 },
      selector: {
        type: LootItemSelectorType.Any,
        categoryWeights: { equipment: 3, consumable: 1 },
      },
    },
  ],
};

export const MONSTER_REWARD_PROFILES: Partial<Record<MonsterType, MonsterRewardProfile>> = {
  [MonsterType.TyrantRex]: {
    experience: 200,
    drops: [
      {
        chance: 1,
        quantity: { min: 2, max: 3 },
        itemLevel: { type: LootItemLevelType.CenteredOnFloor, spread: 1 },
        selector: { type: LootItemSelectorType.Equipment },
      },
      {
        chance: 1,
        quantity: { min: 1, max: 1 },
        itemLevel: { type: LootItemLevelType.FloorPlusOffset, offset: 2 },
        selector: {
          type: LootItemSelectorType.Equipment,
          guaranteedAffixes: {
            slots: 2,
            weightedCategories: [
              { affixCategory: AffixCategory.Prefix, weight: 1 },
              { affixCategory: AffixCategory.Suffix, weight: 1 },
            ],
          },
        },
      },
      {
        chance: 1,
        quantity: { min: 1, max: 2 },
        itemLevel: { type: LootItemLevelType.FloorBase },
        selector: { type: LootItemSelectorType.Consumable },
      },
    ],
  },
};

export function getMonsterRewardProfile(monsterType: MonsterType): MonsterRewardProfile {
  return MONSTER_REWARD_PROFILES[monsterType] ?? FALLBACK_MONSTER_REWARD_PROFILE;
}
