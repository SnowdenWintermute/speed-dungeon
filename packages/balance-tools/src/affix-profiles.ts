import { AffixCategory, PREFIX_TYPES, SUFFIX_TYPES } from "@speed-dungeon/common";
import type { AffixType } from "@speed-dungeon/common";
import type { EquipmentTemplateRow } from "./equipment-template-rows.ts";

export interface AffixProfile {
  name: string;
  maxTiers: Record<AffixCategory, Partial<Record<AffixType, number>>>;
}

export interface AffixOverride {
  baseItem: string;
  affixCategory: AffixCategory;
  affixType: AffixType;
  /** null where the base item cannot roll an affix its profile grants */
  maxTier: null | number;
}

const AFFIX_TYPES_BY_CATEGORY: [AffixCategory, readonly AffixType[]][] = [
  [AffixCategory.Prefix, PREFIX_TYPES],
  [AffixCategory.Suffix, SUFFIX_TYPES],
];

/** every base item resolves to its profile's tier for an affix unless an override says otherwise, so
 * the profile takes whichever tier the most members of the group agree on and the disagreements
 * become override rows */
export function deriveAffixProfiles(rows: EquipmentTemplateRow[]) {
  const profiles: AffixProfile[] = [];
  const overrides: AffixOverride[] = [];

  for (const [name, members] of groupByProfileName(rows)) {
    const maxTiers: Record<AffixCategory, Partial<Record<AffixType, number>>> = {
      [AffixCategory.Prefix]: {},
      [AffixCategory.Suffix]: {},
    };

    for (const [affixCategory, affixTypes] of AFFIX_TYPES_BY_CATEGORY) {
      for (const affixType of affixTypes) {
        const memberTiers = members.map((member) =>
          getMaxTier(member, affixCategory, affixType)
        );
        const profileTier = getMostCommonTier(memberTiers);

        if (profileTier !== undefined) {
          maxTiers[affixCategory][affixType] = profileTier;
        }

        members.forEach((member, index) => {
          const memberTier = memberTiers[index];
          if (memberTier === profileTier) {
            return;
          }
          overrides.push({
            baseItem: member.baseItem,
            affixCategory,
            affixType,
            maxTier: memberTier ?? null,
          });
        });
      }
    }

    profiles.push({ name, maxTiers });
  }

  return { profiles, overrides };
}

function groupByProfileName(rows: EquipmentTemplateRow[]) {
  const byName = new Map<string, EquipmentTemplateRow[]>();
  for (const row of rows) {
    const members = byName.get(row.affixProfile);
    if (members === undefined) {
      byName.set(row.affixProfile, [row]);
    } else {
      members.push(row);
    }
  }
  return byName;
}

function getMaxTier(row: EquipmentTemplateRow, affixCategory: AffixCategory, affixType: AffixType) {
  const maxTiers =
    affixCategory === AffixCategory.Prefix ? row.possibleAffixes.prefix : row.possibleAffixes.suffix;
  return maxTiers[affixType];
}

/** undefined — the affix not being rollable at all — competes as a value like any other. ties go to
 * whichever was seen first, which Map iteration order gives us for free */
function getMostCommonTier(tiers: (undefined | number)[]) {
  const countsByTier = new Map<undefined | number, number>();
  for (const tier of tiers) {
    countsByTier.set(tier, (countsByTier.get(tier) ?? 0) + 1);
  }

  let mostCommonTier: undefined | number = undefined;
  let highestCount = 0;
  for (const [tier, count] of countsByTier) {
    if (count > highestCount) {
      mostCommonTier = tier;
      highestCount = count;
    }
  }
  return mostCommonTier;
}
