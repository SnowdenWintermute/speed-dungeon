import getMagicalElementTailwindColor from "@/utils/getMagicalElementTailwindColor";
import {
  HpChangeSource,
  HpChangeSourceCategoryType,
  formatHpChangeSourceCategory,
  formatPhysicalDamageType,
} from "@speed-dungeon/common";
import { formatMagicalElement } from "@speed-dungeon/common";
import React from "react";

interface Props {
  hpChangeSource: HpChangeSource;
}

export default function DamageTypeBadge({ hpChangeSource }: Props) {
  let physicalDamageTypeTextOption: null | string = null;
  if (hpChangeSource.physicalDamageTypeOption !== null) {
    physicalDamageTypeTextOption = formatPhysicalDamageType(
      hpChangeSource.physicalDamageTypeOption
    );
  }
  let elementTextOption: null | string = null;
  if (hpChangeSource.elementOption !== null) {
    elementTextOption = formatMagicalElement(hpChangeSource.elementOption);
  }
  const elementStyle = hpChangeSource.elementOption
    ? getMagicalElementTailwindColor(hpChangeSource.elementOption)
    : "";

  const damageCategoryBorderColor = getDamageCategoryBorderColor(hpChangeSource.category.type);

  return (
    <div className={`border-2 max-w-fit mb-1 ${damageCategoryBorderColor}`}>
      <span className={`inline-block pl-1 pr-1 h-full`}>
        {formatHpChangeSourceCategory(hpChangeSource.category)}
      </span>
      {physicalDamageTypeTextOption && (
        <span className={`border-l-2 inline-block h-full pr-1 pl-1 bg-zinc-300 text-slate-700`}>
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

function getDamageCategoryBorderColor(hpChangeSourceCategoryType: HpChangeSourceCategoryType) {
  switch (hpChangeSourceCategoryType) {
    case HpChangeSourceCategoryType.PhysicalDamage:
      return "border-zinc-300";
    case HpChangeSourceCategoryType.MagicalDamage:
      return "border-sky-300";
    case HpChangeSourceCategoryType.Healing:
      return "border-green-600";
    case HpChangeSourceCategoryType.Direct:
      return "border-black-300";
  }
}
