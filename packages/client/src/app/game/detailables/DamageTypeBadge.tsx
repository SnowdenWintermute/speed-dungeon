import getMagicalElementTailwindColor from "@/utils/getMagicalElementTailwindColor";
import {
  HP_CHANGE_SOURCE_CATEGORY_STRINGS,
  HpChangeSource,
  HpChangeSourceCategory,
  KINETIC_DAMAGE_TYPE_STRINGS,
  KineticDamageType,
  MAGICAL_ELEMENT_STRINGS,
} from "@speed-dungeon/common";
import React, { ReactNode } from "react";
import BluntIcon from "../../../../public/img/hp-change-source-icons/blunt.svg";
import PiercingIcon from "../../../../public/img/hp-change-source-icons/piercing.svg";
import SlashingIcon from "../../../../public/img/hp-change-source-icons/slashing.svg";

const KINETIC_ICONS: Record<KineticDamageType, ReactNode> = {
  [KineticDamageType.Blunt]: <BluntIcon />,
  [KineticDamageType.Slashing]: <PiercingIcon />,
  [KineticDamageType.Piercing]: <SlashingIcon />,
};

interface Props {
  hpChangeSource: HpChangeSource;
}

export default function DamageTypeBadge({ hpChangeSource }: Props) {
  let physicalDamageTypeTextOption: null | string = null;
  if (hpChangeSource.kineticDamageTypeOption !== undefined) {
    physicalDamageTypeTextOption =
      KINETIC_DAMAGE_TYPE_STRINGS[hpChangeSource.kineticDamageTypeOption];
  }

  let elementTextOption: null | string = null;
  if (hpChangeSource.elementOption !== undefined) {
    elementTextOption = MAGICAL_ELEMENT_STRINGS[hpChangeSource.elementOption];
  }
  const elementStyle =
    hpChangeSource.elementOption !== undefined
      ? getMagicalElementTailwindColor(hpChangeSource.elementOption)
      : "";

  const damageCategoryBorderColor = getDamageCategoryBorderColor(hpChangeSource.category);

  return (
    <div
      className={`border-2 w-fit min-w-fit max-w-fit mb-1 last:mb-0 ${damageCategoryBorderColor}`}
    >
      <span className={`inline-block pl-1 pr-1 h-full`}>
        {HP_CHANGE_SOURCE_CATEGORY_STRINGS[hpChangeSource.category]}
      </span>
      {physicalDamageTypeTextOption && (
        <span
          className={`border-l-2 inline-block w-fit h-full pr-1 pl-1 bg-zinc-300 text-slate-700`}
        >
          {physicalDamageTypeTextOption}
        </span>
      )}

      {elementTextOption && (
        <span
          className={`border-l-2 inline-block h-full pr-1 pl-1 ${elementStyle} ${damageCategoryBorderColor}`}
        >
          {elementTextOption}
        </span>
      )}
    </div>
  );
}

function getDamageCategoryBorderColor(hpChangeSourceCategoryType: HpChangeSourceCategory) {
  switch (hpChangeSourceCategoryType) {
    case HpChangeSourceCategory.Physical:
      return "border-zinc-300";
    case HpChangeSourceCategory.Magical:
      return "border-sky-300";
    case HpChangeSourceCategory.Medical:
      return "border-green-600";
    case HpChangeSourceCategory.Direct:
      return "border-black-300";
  }
}
