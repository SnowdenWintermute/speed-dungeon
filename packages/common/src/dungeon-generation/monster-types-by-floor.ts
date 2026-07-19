import { MonsterType } from "../monsters/monster-types.js";

export interface MonsterSpawnEntry {
  monster: MonsterType;
  paletteWeight: number;
  roomWeight: number;
}

export interface BossSpawnEntry {
  monster: MonsterType;
  weight: number;
}

export const FALLBACK_MONSTER_SPAWN_TABLE: MonsterSpawnEntry[] = [
  { monster: MonsterType.Zombie, paletteWeight: 35, roomWeight: 33 },
  { monster: MonsterType.Wolf, paletteWeight: 35, roomWeight: 33 },
  { monster: MonsterType.VampireBat, paletteWeight: 30, roomWeight: 33 },
];

export const MONSTER_SPAWN_TABLES: Record<number, MonsterSpawnEntry[]> = {
  1: FALLBACK_MONSTER_SPAWN_TABLE,
  2: [
    { monster: MonsterType.Zombie, paletteWeight: 40, roomWeight: 35 },
    { monster: MonsterType.Wolf, paletteWeight: 40, roomWeight: 40 },
    { monster: MonsterType.VampireBat, paletteWeight: 40, roomWeight: 40 },
    { monster: MonsterType.SkeletonWarrior, paletteWeight: 25, roomWeight: 20 },
    { monster: MonsterType.SkeletonCaptain, paletteWeight: 25, roomWeight: 20 },
    { monster: MonsterType.Slime, paletteWeight: 10, roomWeight: 15 },
  ],
  3: [
    { monster: MonsterType.Zombie, paletteWeight: 40, roomWeight: 35 },
    { monster: MonsterType.Wolf, paletteWeight: 40, roomWeight: 40 },
    { monster: MonsterType.VampireBat, paletteWeight: 40, roomWeight: 40 },

    { monster: MonsterType.Spider, paletteWeight: 25, roomWeight: 20 },
    { monster: MonsterType.SkeletonWarrior, paletteWeight: 25, roomWeight: 20 },
    { monster: MonsterType.SkeletonCaptain, paletteWeight: 25, roomWeight: 10 },
    { monster: MonsterType.MantaRay, paletteWeight: 15, roomWeight: 10 },
    { monster: MonsterType.Slime, paletteWeight: 15, roomWeight: 20 },
  ],
  4: [
    { monster: MonsterType.Spider, paletteWeight: 25, roomWeight: 20 },
    { monster: MonsterType.SkeletonWarrior, paletteWeight: 25, roomWeight: 20 },
    { monster: MonsterType.SkeletonCaptain, paletteWeight: 25, roomWeight: 10 },
    { monster: MonsterType.MantaRay, paletteWeight: 25, roomWeight: 10 },
    { monster: MonsterType.Slime, paletteWeight: 25, roomWeight: 20 },
  ],
};

export const BOSS_SPAWN_TABLES: Record<number, BossSpawnEntry[] | null> = {
  1: [{ monster: MonsterType.TyrantRex, weight: 100 }],
  2: null,
  3: null,
};
