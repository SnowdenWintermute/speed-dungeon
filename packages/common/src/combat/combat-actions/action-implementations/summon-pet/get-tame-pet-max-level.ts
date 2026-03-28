export function getTamePetMaxPetLevel(actionRank: number) {
  const BASE_SUMMONED_PET_LEVEL = 4;
  const PET_LEVEL_PER_SUMMON_PET_RANK = 2;
  const levelBonus = PET_LEVEL_PER_SUMMON_PET_RANK * actionRank;
  return BASE_SUMMONED_PET_LEVEL + levelBonus;
}

