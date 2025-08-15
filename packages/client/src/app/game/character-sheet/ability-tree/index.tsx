import Divider from "@/app/components/atoms/Divider";
import { useGameStore } from "@/stores/game-store";
import { ABILITY_TREES, ERROR_MESSAGES } from "@speed-dungeon/common";
import cloneDeep from "lodash.clonedeep";
import React from "react";
import AbilityTreeDetailedAbility from "./AbilityTreeDetailedAbility";
import { IconName, SVG_ICONS } from "@/app/icons";
import HoverableTooltipWrapper from "@/app/components/atoms/HoverableTooltipWrapper";
import CharacterClassAbilityTree from "./CharacterClassAbilityTree";

export default function AbilitySelection() {
  const focusedCharacterResult = useGameStore().getFocusedCharacter();
  const focusedCharacterOption =
    focusedCharacterResult instanceof Error ? null : focusedCharacterResult;
  if (!focusedCharacterOption) return <div>{ERROR_MESSAGES.COMBATANT.NOT_FOUND}</div>;

  const { combatantClass } = focusedCharacterOption.combatantProperties;

  const abilityTree = ABILITY_TREES[combatantClass];

  const sliced = cloneDeep(abilityTree);
  sliced.columns = sliced.columns.map((column) => column.slice(0, 2));

  const { unspentAbilityPoints } = focusedCharacterOption.combatantProperties.abilityProperties;

  return (
    <div
      style={{ width: `calc(100% + 2px)` }}
      className="flex border border-slate-400 bg-slate-700 p-4 absolute top-[-1px] left-0 h-fit ml-[-1px]"
    >
      <HoverableTooltipWrapper tooltipText="Unspent ability points">
        <div className="h-5 fill-slate-400 absolute flex items-center">
          <div className="h-full mr-1">
            {SVG_ICONS[IconName.PlusSign](
              `h-full ${unspentAbilityPoints ? "fill-yellow-400" : "fill-slate-400"}`
            )}
          </div>
          <div>
            {focusedCharacterOption.combatantProperties.abilityProperties.unspentAbilityPoints}
          </div>
        </div>
      </HoverableTooltipWrapper>
      <div className="flex flex-col  mr-4">
        <div className="text-lg flex justify-center">
          <h3>Warrior (level 6)</h3>
        </div>
        <Divider extraStyles="mb-4" />
        <div className="w-fit">
          <CharacterClassAbilityTree abilityTree={abilityTree} />
          <div className="text-lg mt-4 flex justify-center">
            <h3>Rogue (level 3)</h3>
          </div>
          <Divider extraStyles="mb-4" />
          <CharacterClassAbilityTree abilityTree={sliced} />
        </div>
      </div>
      <AbilityTreeDetailedAbility />
    </div>
  );
}
