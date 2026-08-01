import {
  AffixCategory,
  AffixType,
  PREFIX_TYPES,
  SUFFIX_TYPES,
  invariant,
} from "@speed-dungeon/common";
import type { PrefixType, SuffixType } from "@speed-dungeon/common";
import { assembleEnumMemberLookup, readCsvTable } from "./csv-table-reader.js";

export interface PossibleAffixes {
  prefix: Partial<Record<PrefixType, number>>;
  suffix: Partial<Record<SuffixType, number>>;
}

/** a base item cannot roll this affix even though its profile grants one */
const CANNOT_ROLL = "x";

const PREFIX_TYPES_BY_NAME = assembleEnumMemberLookup(
  [...PREFIX_TYPES],
  (affixType) => AffixType[affixType]
);
const SUFFIX_TYPES_BY_NAME = assembleEnumMemberLookup(
  [...SUFFIX_TYPES],
  (affixType) => AffixType[affixType]
);

function getAffixColumn(affixCategory: AffixCategory, affixType: AffixType) {
  return `${AffixCategory[affixCategory]}:${AffixType[affixType]}`;
}

/** AffixType partitions exactly into prefixes and suffixes, so the category is a function of the
 * type rather than something the sheet has to state and keep consistent */
function assembleOverride(typeName: string, maxTier: null | number): AffixOverride {
  const prefixType = PREFIX_TYPES_BY_NAME.get(typeName);
  if (prefixType !== undefined) {
    return { affixCategory: AffixCategory.Prefix, affixType: prefixType, maxTier };
  }
  const suffixType = SUFFIX_TYPES_BY_NAME.get(typeName);
  invariant(suffixType !== undefined, `"${typeName}" is not an affix type`);
  return { affixCategory: AffixCategory.Suffix, affixType: suffixType, maxTier };
}

function applyOverride<T extends AffixType>(
  maxTiers: Partial<Record<T, number>>,
  affixType: T,
  maxTier: null | number
) {
  if (maxTier === null) {
    delete maxTiers[affixType];
  } else {
    maxTiers[affixType] = maxTier;
  }
}

const PROFILE_COLUMNS = [
  "affixProfile",
  ...PREFIX_TYPES.map((affixType) => getAffixColumn(AffixCategory.Prefix, affixType)),
  ...SUFFIX_TYPES.map((affixType) => getAffixColumn(AffixCategory.Suffix, affixType)),
];

const OVERRIDE_COLUMNS = ["baseItem", "affixType", "maxTier"];

/** the category has to travel with the type or the resolved record loses track of which half of
 * possibleAffixes the type belongs to */
type AffixOverride =
  | { affixCategory: AffixCategory.Prefix; affixType: PrefixType; maxTier: null | number }
  | { affixCategory: AffixCategory.Suffix; affixType: SuffixType; maxTier: null | number };

export class AffixProfileResolver {
  private profilesByName = new Map<string, PossibleAffixes>();
  private overridesByBaseItem = new Map<string, AffixOverride[]>();

  constructor() {
    for (const row of readCsvTable("equipment-affix-profiles", PROFILE_COLUMNS)) {
      const name = row.getText("affixProfile");
      invariant(!this.profilesByName.has(name), `duplicate affix profile "${name}"`);

      const possibleAffixes: PossibleAffixes = { prefix: {}, suffix: {} };
      for (const affixType of PREFIX_TYPES) {
        const maxTier = row.getNumberOption(getAffixColumn(AffixCategory.Prefix, affixType));
        if (maxTier !== null) {
          possibleAffixes.prefix[affixType] = maxTier;
        }
      }
      for (const affixType of SUFFIX_TYPES) {
        const maxTier = row.getNumberOption(getAffixColumn(AffixCategory.Suffix, affixType));
        if (maxTier !== null) {
          possibleAffixes.suffix[affixType] = maxTier;
        }
      }
      this.profilesByName.set(name, possibleAffixes);
    }

    for (const row of readCsvTable("equipment-affix-overrides", OVERRIDE_COLUMNS)) {
      const baseItem = row.getText("baseItem");
      const maxTierText = row.getText("maxTier");
      const maxTier = maxTierText === CANNOT_ROLL ? null : row.getNumber("maxTier");

      const overrides = this.overridesByBaseItem.get(baseItem) ?? [];
      overrides.push(assembleOverride(row.getText("affixType"), maxTier));
      this.overridesByBaseItem.set(baseItem, overrides);
    }
  }

  resolve(baseItem: string, profileName: string): PossibleAffixes {
    const profile = this.profilesByName.get(profileName);
    invariant(
      profile !== undefined,
      `${baseItem} names affix profile "${profileName}", which no row in ` +
        `equipment-affix-profiles.csv defines`
    );

    const resolved: PossibleAffixes = { prefix: { ...profile.prefix }, suffix: { ...profile.suffix } };

    for (const override of this.overridesByBaseItem.get(baseItem) ?? []) {
      if (override.affixCategory === AffixCategory.Prefix) {
        applyOverride(resolved.prefix, override.affixType, override.maxTier);
      } else {
        applyOverride(resolved.suffix, override.affixType, override.maxTier);
      }
    }

    return resolved;
  }

  getOverriddenBaseItemNames() {
    return [...this.overridesByBaseItem.keys()];
  }
}
