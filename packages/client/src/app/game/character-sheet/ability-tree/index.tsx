import Divider from "@/app/components/atoms/Divider";
import { useGameStore } from "@/stores/game-store";
import {
  ABILITY_TREES,
  COMBATANT_CLASS_NAME_STRINGS,
  EMPTY_ABILITY_TREE,
  ERROR_MESSAGES,
} from "@speed-dungeon/common";
import cloneDeep from "lodash.clonedeep";
import React from "react";
import { AbilityTreeDetailedAbility } from "./AbilityTreeDetailedAbility";
import { IconName, SVG_ICONS } from "@/app/icons";
import HoverableTooltipWrapper from "@/app/components/atoms/HoverableTooltipWrapper";
import { CharacterClassAbilityTree } from "./CharacterClassAbilityTree";
import { getCombatantClassIcon } from "@/utils/get-combatant-class-icon";

export default function AbilitySelection() {
  const focusedCharacterResult = useGameStore().getFocusedCharacter();
  const focusedCharacterOption =
    focusedCharacterResult instanceof Error ? null : focusedCharacterResult;
  if (!focusedCharacterOption) return <div>{ERROR_MESSAGES.COMBATANT.NOT_FOUND}</div>;

  const { combatantProperties } = focusedCharacterOption;
  const { combatantClass } = combatantProperties;
  const abilityTree = ABILITY_TREES[combatantClass];

  const { supportClassProperties } = combatantProperties;
  const supportClassAbilityTree = supportClassProperties
    ? ABILITY_TREES[supportClassProperties.combatantClass]
    : EMPTY_ABILITY_TREE;
  const sliced = cloneDeep(supportClassAbilityTree);
  sliced.columns = sliced.columns.map((column) => column.slice(0, 2));

  const supportClassName = supportClassProperties
    ? COMBATANT_CLASS_NAME_STRINGS[supportClassProperties?.combatantClass]
    : "No support class";

  const { unspentAbilityPoints } = combatantProperties.abilityProperties;

  return (
    <div
      style={{ width: `calc(100% + 2px)` }}
      className="flex border border-slate-400 bg-slate-700 p-4 absolute top-[-1px] left-0 h-fit ml-[-1px] max-h-[700px]"
    >
      <HoverableTooltipWrapper tooltipText="Unspent ability points">
        <div className="h-5 fill-slate-400 absolute flex items-center">
          <div className="h-full mr-1">
            {SVG_ICONS[IconName.PlusSign](
              `h-full ${unspentAbilityPoints ? "fill-yellow-400" : "fill-slate-400"}`
            )}
          </div>
          <div>{combatantProperties.abilityProperties.unspentAbilityPoints}</div>
        </div>
      </HoverableTooltipWrapper>
      <div className="flex flex-col  mr-4">
        <div className="text-lg flex justify-center">
          <h3>
            <span>
              {COMBATANT_CLASS_NAME_STRINGS[combatantClass]} (level {combatantProperties.level})
            </span>
          </h3>
        </div>
        <Divider extraStyles="mb-4" />
        <div className="w-fit">
          <div className="relative">
            <CharacterClassAbilityTree abilityTree={abilityTree} isSupportClass={false} />
            <div className="h-72 absolute left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2 opacity-10">
              {getCombatantClassIcon(combatantClass, "fill-slate-400", "stroke-slate-400")}
            </div>
          </div>
          <div className="text-lg mt-4 flex justify-center relative">
            <h3>
              {supportClassName}
              {supportClassProperties && <span> (level {supportClassProperties.level})</span>}
            </h3>
          </div>
          <Divider extraStyles="mb-4" />
          <div className="relative">
            <CharacterClassAbilityTree abilityTree={sliced} isSupportClass={true} />
            {supportClassProperties && (
              <div className="h-32 absolute left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2 opacity-10">
                {getCombatantClassIcon(
                  supportClassProperties.combatantClass,
                  "fill-slate-400",
                  "stroke-slate-400"
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <AbilityTreeDetailedAbility user={focusedCharacterOption} />
    </div>
  );
}
