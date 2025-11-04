import {
  ActionAccuracyType,
  ActionPayableResource,
  ActionUserContext,
  ArrayUtils,
  COMBATANT_CONDITION_CONSTRUCTORS,
  COMBAT_ACTIONS,
  ClientToServerEvent,
  CombatActionExecutionIntent,
  CombatActionName,
  CombatAttribute,
  ERROR_MESSAGES,
  FriendOrFoe,
  HitOutcomeMitigationCalculator,
  MaxAndCurrent,
  TargetingCalculator,
  iterateNumericEnumKeyedRecord,
} from "@speed-dungeon/common";
import React from "react";
import { ActionDetailsTitleBar } from "./ActionDetailsTitleBar";
import { COMBAT_ACTION_DESCRIPTIONS } from "../../character-sheet/ability-tree/ability-descriptions";
import { ActionDescriptionComponent } from "../../character-sheet/ability-tree/action-description";
import { ResourceChangeDisplay } from "../../character-sheet/ability-tree/ActionDescriptionDisplay";
import { IconName, PAYABLE_RESOURCE_ICONS, SVG_ICONS } from "@/app/icons";
import { ConditionIndicator } from "../../combatant-plaques/condition-indicators";
import { websocketConnection } from "@/singletons/websocket-connection";
import { UNMET_REQUIREMENT_TEXT_COLOR } from "@/client_consts";
import HoverableTooltipWrapper from "@/app/components/atoms/HoverableTooltipWrapper";
import { CharacterSheetWeaponDamage } from "../../character-sheet/CharacterSheetWeaponDamage";
import { AppStore } from "@/mobx-stores/app-store";
import { observer } from "mobx-react-lite";

interface Props {
  actionName: CombatActionName;
  hideTitle?: boolean;
}

export const ActionSelectedDetails = observer(({ actionName, hideTitle }: Props) => {
  const { game, party, combatant } = AppStore.get().gameStore.getFocusedCharacterContext();
  const { combatantProperties, entityProperties } = combatant;
  const { abilityProperties } = combatantProperties;
  const actionStateOption = abilityProperties.getOwnedActions()[actionName];
  if (actionStateOption === undefined) return <div>Somehow detailing an unowned action</div>;

  const { targetingProperties } = combatant.combatantProperties;
  const selectedActionAndRankOption = targetingProperties.getSelectedActionAndRank();

  const inCombat = party.combatantManager.monstersArePresent();

  const disableOh = inCombat && combatantProperties.resources.getActionPoints() < 2;
  if (actionName === CombatActionName.Attack)
    return (
      <div className="w-full flex flex-col">
        <div className="mb-2">
          Attack with equipped weapons. Accuracy and crit chance are updated below based on your
          target's defenses.
        </div>
        <CharacterSheetWeaponDamage combatant={combatant} disableOh={disableOh} />
      </div>
    );

  const action = COMBAT_ACTIONS[actionName];
  const actionDescription = COMBAT_ACTION_DESCRIPTIONS[actionName];

  const targetingCalculator = new TargetingCalculator(
    new ActionUserContext(game, party, combatant),
    null
  );

  const currentTargetsOption = targetingProperties.getSelectedTarget();
  if (!currentTargetsOption) return <div>{ERROR_MESSAGES.COMBAT_ACTIONS.NO_TARGET_PROVIDED}</div>;

  const primaryTargetResult = targetingCalculator.getPrimaryTargetCombatant(
    party,
    new CombatActionExecutionIntent(
      actionStateOption.actionName,
      selectedActionAndRankOption?.rank || 1,
      currentTargetsOption
    )
  );
  if (primaryTargetResult instanceof Error) return <div>{primaryTargetResult.message}</div>;

  return (
    <div className="flex flex-col pointer-events-auto" style={{ flex: `1 1 1px` }}>
      {!hideTitle && (
        <ActionDetailsTitleBar
          actionName={actionName}
          actionStateAndSelectedLevel={{
            actionStateOption,
            selectedLevelOption: selectedActionAndRankOption?.rank || null,
          }}
        />
      )}
      <ul className="list-none">
        {ArrayUtils.createFilledWithSequentialNumbers(actionStateOption.level, 1).map((rank) => {
          const percentChanceToHit = HitOutcomeMitigationCalculator.getActionHitChance(
            action,
            combatant,
            rank,
            true,
            primaryTargetResult.combatantProperties
          );

          const rankDescription = actionDescription.getDescriptionByLevel(combatant, rank);

          const resourceChangePropertiesOption =
            rankDescription[ActionDescriptionComponent.ResourceChanges];

          const rankCosts = action.costProperties.getResourceCosts(combatant, inCombat, rank) || {};
          const unmetCosts = rankCosts
            ? combatantProperties.resources.getUnmetCostResourceTypes(rankCosts)
            : [];

          const accuracy = rankDescription[ActionDescriptionComponent.Accuracy];
          const percentAccuracyOption =
            accuracy.type === ActionAccuracyType.Percentage ? Math.floor(accuracy.value) : null;

          const conditionsAppliedOption =
            rankDescription[ActionDescriptionComponent.AppliesConditions];

          const endsTurnOption = rankDescription[ActionDescriptionComponent.RequiresTurn];

          function handleSelectActionLevel(level: number) {
            websocketConnection.emit(ClientToServerEvent.SelectCombatActionLevel, {
              characterId: entityProperties.id,
              actionLevel: level,
            });
          }

          return (
            <button
              key={`${action.name}${rank}`}
              className={`h-10 w-full flex items-center px-2 ${!!(unmetCosts.length > 0) && " pointer-events-none"} ${!!(selectedActionAndRankOption?.rank === rank) && "bg-slate-800"} `}
              onClick={() => handleSelectActionLevel(rank)}
            >
              <div className="flex items-center h-full">
                {iterateNumericEnumKeyedRecord(rankCosts).map(([resourceType, cost]) => (
                  <div className="ml-2 first:ml-0" key={resourceType + cost}>
                    <PayableResourceCostDisplay
                      resourceType={resourceType}
                      cost={cost}
                      unmetCosts={unmetCosts}
                    />
                  </div>
                ))}
              </div>
              <div
                className={`flex items-center w-full ${!!(unmetCosts.length > 0) && " opacity-50"}`}
              >
                {resourceChangePropertiesOption && (
                  <ul className="ml-2">
                    {resourceChangePropertiesOption
                      .filter((item) => item.changeProperties !== null)
                      .map((item, i) => (
                        <ResourceChangeDisplay
                          key={i}
                          resourceChangeProperties={item.changeProperties!}
                          useIcon
                          hideHpChangeType
                        />
                      ))}
                  </ul>
                )}
                {percentAccuracyOption && (
                  <div className="h-full flex items-center ml-2">
                    {
                      <div className="h-6 mr-1">
                        {SVG_ICONS[IconName.Target]("h-full fill-slate-400 stroke-slate-400 ")}
                      </div>
                    }{" "}
                    <div className="">{Math.floor(percentChanceToHit.afterEvasion)}%</div>
                  </div>
                )}
                {conditionsAppliedOption && (
                  <ul className="flex items-center list-none ml-2">
                    {conditionsAppliedOption.map((conditionBlueprint) => {
                      const condition = new COMBATANT_CONDITION_CONSTRUCTORS[
                        conditionBlueprint.conditionName
                      ](
                        "condition name",
                        {
                          entityProperties: { id: "", name: "" },
                          friendOrFoe: FriendOrFoe.Hostile,
                        },
                        "applied to dummy id",
                        conditionBlueprint.level,
                        new MaxAndCurrent(conditionBlueprint.stacks, conditionBlueprint.stacks)
                      );

                      return (
                        <li className="flex items-center" key={conditionBlueprint.conditionName}>
                          <ConditionIndicator key={condition.name} condition={condition} />
                          <div>R{conditionBlueprint.level}</div>
                        </li>
                      );
                    })}
                  </ul>
                )}
                {endsTurnOption && (
                  <HoverableTooltipWrapper extraStyles="ml-auto " tooltipText="Ends turn on use">
                    <div className="h-6">
                      {SVG_ICONS[IconName.Hourglass]("h-full fill-slate-400")}
                    </div>
                  </HoverableTooltipWrapper>
                )}
              </div>
            </button>
          );
        })}
      </ul>
    </div>
  );
});

function PayableResourceCostDisplay({
  resourceType,
  cost,
  unmetCosts,
}: {
  resourceType: ActionPayableResource;
  cost: number;
  unmetCosts: ActionPayableResource[];
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
  const costUnmet = unmetCosts.includes(resourceType);

  return (
    <div className="relative ">
      <div className="h-6 flex items-center justify-center">
        {iconGetter("h-full " + extraStyles)}
      </div>
      <div
        className={`absolute ${costUnmet ? UNMET_REQUIREMENT_TEXT_COLOR : "text-zinc-300"} font-bold h-5 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 `}
        style={{ textShadow: "2px 2px 0px #000000" }}
      >
        {!!(costValue > 1) && Math.abs(cost)}
      </div>
    </div>
  );
}
