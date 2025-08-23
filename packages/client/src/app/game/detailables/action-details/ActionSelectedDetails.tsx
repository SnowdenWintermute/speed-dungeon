import {
  ACTION_PAYABLE_RESOURCE_STRINGS,
  ActionPayableResource,
  COMBAT_ACTIONS,
  COMBAT_ACTION_USABLITY_CONTEXT_STRINGS,
  CombatActionName,
  CombatActionUsabilityContext,
  createArrayFilledWithSequentialNumbers,
  getUnmetCostResourceTypes,
  iterateNumericEnumKeyedRecord,
} from "@speed-dungeon/common";
import React, { ReactNode } from "react";
import { useGameStore } from "@/stores/game-store";
import { UNMET_REQUIREMENT_TEXT_COLOR } from "@/client_consts";
import ActionDetailsTitleBar from "./ActionDetailsTitleBar";
import { COMBAT_ACTION_DESCRIPTIONS } from "../../character-sheet/ability-tree/ability-descriptions";
import { ActionDescriptionComponent } from "../../character-sheet/ability-tree/action-description";
import { ResourceChangeDisplay } from "../../character-sheet/ability-tree/ActionDescriptionDisplay";
import { PAYABLE_RESOURCE_ICONS } from "@/app/icons";

interface Props {
  actionName: CombatActionName;
  hideTitle?: boolean;
}

export default function ActionSelectedDetails({ actionName, hideTitle }: Props) {
  const partyResult = useGameStore().getParty();
  if (partyResult instanceof Error) return <div>{partyResult.message}</div>;
  const party = partyResult;
  const focusedCharacterResult = useGameStore().getFocusedCharacter();
  if (focusedCharacterResult instanceof Error) return <div>{focusedCharacterResult.message}</div>;
  const { combatantProperties } = focusedCharacterResult;
  const { abilityProperties } = combatantProperties;
  const actionStateOption = abilityProperties.ownedActions[actionName];
  const actionState = abilityProperties.ownedActions[actionName];
  if (actionState === undefined) return <div>Somehow detailing an unowned action</div>;
  const selectedLevelOption = combatantProperties.selectedActionLevel;

  const inCombat = !!Object.values(party.currentRoom.monsters).length;

  const action = COMBAT_ACTIONS[actionName];
  const costs =
    action.costProperties.getResourceCosts(
      combatantProperties,
      inCombat,
      selectedLevelOption || 1
    ) || {};
  const unmetCosts = costs ? getUnmetCostResourceTypes(combatantProperties, costs) : [];

  const actionDescription = COMBAT_ACTION_DESCRIPTIONS[actionName];

  return (
    <div className="flex flex-col pointer-events-auto" style={{ flex: `1 1 1px` }}>
      {!hideTitle && (
        <ActionDetailsTitleBar
          actionName={actionName}
          actionStateAndSelectedLevel={{ actionStateOption, selectedLevelOption }}
        />
      )}
      <ul className="list-none">
        {createArrayFilledWithSequentialNumbers(actionState.level, 1).map((rank) => {
          const rankDescription = actionDescription.getDescriptionByLevel(
            focusedCharacterResult,
            rank
          );

          const resourceChangePropertiesOption =
            rankDescription[ActionDescriptionComponent.ResourceChanges];
          const actionPointCostOption = rankDescription[ActionDescriptionComponent.ActionPointCost];

          const rankCosts =
            action.costProperties.getResourceCosts(combatantProperties, inCombat, rank) || {};

          return (
            <li
              key={`${action.name}${rank}`}
              className={`h-10 w-full flex items-center px-2 ${!!(selectedLevelOption === rank) && "bg-slate-800"}`}
            >
              <div className="flex items-center h-full">
                {iterateNumericEnumKeyedRecord(rankCosts).map(([resourceType, cost]) => (
                  <div className="mr-3" key={resourceType + cost}>
                    <PayableResourceCostDisplay resourceType={resourceType} cost={cost} />
                  </div>
                ))}
              </div>
              {resourceChangePropertiesOption && (
                <ul className="mt-1">
                  {resourceChangePropertiesOption
                    .filter((item) => item.changeProperties !== null)
                    .map((item, i) => (
                      <ResourceChangeDisplay
                        key={i}
                        resourceChangeProperties={item.changeProperties!}
                      />
                    ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function PayableResourceCostDisplay({
  resourceType,
  cost,
}: {
  resourceType: ActionPayableResource;
  cost: number;
}) {
  const iconGetter = PAYABLE_RESOURCE_ICONS[resourceType];
  let extraStyles = "";
  switch (resourceType) {
    case ActionPayableResource.HitPoints:
      extraStyles = "fill-green-600";
      break;
    case ActionPayableResource.Mana:
      extraStyles = "fill-blue-600";
      break;
    case ActionPayableResource.Shards:
      extraStyles = "fill-slate-600";
      break;
    case ActionPayableResource.ActionPoints:
      extraStyles = "fill-slate-400 stroke-slate-400 rounded-full";
      break;
  }

  const costValue = Math.abs(cost);

  return (
    <div className="relative ">
      <div className="h-6 flex items-center justify-center">
        {iconGetter("h-full " + extraStyles)}
      </div>
      <div
        className="absolute text-white h-5 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 "
        style={{ textShadow: "2px 2px 0px #000000" }}
      >
        {!!(costValue > 1) && Math.abs(cost)}
      </div>
    </div>
  );
}

// {typeof actionPointCostOption === "number" && (
//   <div>AP: {Math.abs(actionPointCostOption)}</div>
// )}

// {typeof rankDescription[ActionDescriptionComponent.ManaCost] === "number" && (
//   <div>MP: {Math.abs(rankDescription[ActionDescriptionComponent.ManaCost])}</div>
// )}
// {typeof rankDescription[ActionDescriptionComponent.HitPointCost] === "number" && (
//   <div>
//     HP: {Math.abs(rankDescription[ActionDescriptionComponent.HitPointCost])}{" "}
//   </div>
// )}
// {typeof rankDescription[ActionDescriptionComponent.ShardCost] === "number" && (
//   <div>
//     Shards: {Math.abs(rankDescription[ActionDescriptionComponent.ShardCost])}{" "}
//   </div>
// )}
