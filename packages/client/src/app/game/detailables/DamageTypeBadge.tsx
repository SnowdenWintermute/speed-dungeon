import getMagicalElementTailwindColor, {
  MAGICAL_ELEMENT_ICON_TAILWIND_STYLES,
} from "@/utils/getMagicalElementTailwindColor";
import {
  HP_CHANGE_SOURCE_CATEGORY_STRINGS,
  ResourceChangeSource,
  ResourceChangeSourceCategory,
  KINETIC_DAMAGE_TYPE_STRINGS,
  MAGICAL_ELEMENT_STRINGS,
} from "@speed-dungeon/common";
import React, { ReactNode } from "react";
import { KINETIC_TYPE_ICONS, MAGICAL_ELEMENT_ICONS } from "@/app/icons";

interface Props {
  hpChangeSource: ResourceChangeSource;
  useIcon?: boolean;
}

export default function DamageTypeBadge({ hpChangeSource, useIcon }: Props) {
  const { elementOption, kineticDamageTypeOption } = hpChangeSource;

  let physicalDamageTypeTextOption: null | string = null;
  if (kineticDamageTypeOption !== undefined) {
    physicalDamageTypeTextOption = KINETIC_DAMAGE_TYPE_STRINGS[kineticDamageTypeOption];
  }

  let elementTextOption: null | string = null;
  let elementIconOption: null | ReactNode = null;
  if (elementOption !== undefined) {
    elementTextOption = MAGICAL_ELEMENT_STRINGS[elementOption];
    elementIconOption = MAGICAL_ELEMENT_ICONS[elementOption](
      "h-full p-0.5  " + MAGICAL_ELEMENT_ICON_TAILWIND_STYLES[elementOption]
    );
  }
  const elementStyle =
    elementOption !== undefined ? getMagicalElementTailwindColor(elementOption) : "";

  const damageCategoryBorderColor = getDamageCategoryBorderColor(hpChangeSource.category);

  return (
    <div
      className={`border-2 w-fit min-w-fit max-w-fit mb-1 flex items-center ${damageCategoryBorderColor}`}
    >
      <span className={`inline-block pl-1 pr-1 h-full`}>
        {HP_CHANGE_SOURCE_CATEGORY_STRINGS[hpChangeSource.category]}
      </span>
      {physicalDamageTypeTextOption && (
        <span
          className={`border-l-2 inline-block max-w-fit w-fit h-full pr-1 pl-1 bg-zinc-300 text-slate-700`}
        >
          {physicalDamageTypeTextOption}
        </span>
      )}

      {!useIcon && elementTextOption && (
        <span
          className={`border-l-2 inline-block h-full pr-1 pl-1 ${elementStyle} ${damageCategoryBorderColor}`}
        >
          {elementTextOption}
        </span>
      )}
      {useIcon && elementIconOption && (
        <div className={"h-6 border-l-2" + elementStyle}>{elementIconOption}</div>
      )}
    </div>
  );
}

function getDamageCategoryBorderColor(hpChangeSourceCategoryType: ResourceChangeSourceCategory) {
  switch (hpChangeSourceCategoryType) {
    case ResourceChangeSourceCategory.Physical:
      return "border-zinc-300";
    case ResourceChangeSourceCategory.Magical:
      return "border-sky-300";
    case ResourceChangeSourceCategory.Medical:
      return "border-green-600";
    case ResourceChangeSourceCategory.Direct:
      return "border-black-300";
  }
}

export function DamageTypeBadgeWithIcon({ hpChangeSource }: Props) {
  const { elementOption, kineticDamageTypeOption, isHealing } = hpChangeSource;

  let physicalDamageTypeTextOption: null | string = null;
  let physicalDamageTypeIconOption: null | ReactNode = null;
  if (kineticDamageTypeOption !== undefined) {
    physicalDamageTypeTextOption = KINETIC_DAMAGE_TYPE_STRINGS[kineticDamageTypeOption];
    physicalDamageTypeIconOption = KINETIC_TYPE_ICONS[kineticDamageTypeOption](
      "h-full bg-slate-800 fill-slate-400 stroke-slate-400 "
    );
  }

  let elementTextOption: null | string = null;
  let elementIconOption: null | ReactNode = null;
  if (elementOption !== undefined) {
    elementTextOption = MAGICAL_ELEMENT_STRINGS[elementOption];
    elementIconOption = MAGICAL_ELEMENT_ICONS[elementOption](
      "h-full py-0.5 w-7 px-1 " + MAGICAL_ELEMENT_ICON_TAILWIND_STYLES[elementOption]
    );
  }
  const elementStyle = elementOption !== undefined ? "" : "";

  const damageCategoryBorderColor = getDamageCategoryBorderColor(hpChangeSource.category);

  return (
    <div
      className={`border w-fit min-w-fit max-w-fit flex items-center ${damageCategoryBorderColor}`}
    >
      <span className={`inline-block pl-1 pr-1 h-full`}>
        {HP_CHANGE_SOURCE_CATEGORY_STRINGS[hpChangeSource.category]}
      </span>
      {physicalDamageTypeIconOption && (
        <div className={`h-6 border-l bg-slate-800 ${damageCategoryBorderColor}`}>
          {physicalDamageTypeIconOption}
        </div>
      )}

      {elementIconOption && (
        <div className={`h-6 border-l ${damageCategoryBorderColor} ${elementStyle}`}>
          {elementIconOption}
        </div>
      )}
    </div>
  );
}
