import { useGameStore } from "@/stores/game-store";
import getCurrentBattleOption from "@/utils/getCurrentBattleOption";
import getGameAndParty from "@/utils/getGameAndParty";
import React, { useEffect, useRef, useState } from "react";
import { TargetingIndicators } from "./TargetingIndicators";
import UnspentAttributesButton from "../UnspentAttributesButton";
import ValueBarsAndFocusButton from "./ValueBarsAndFocusButton";
import CombatantInfoButton from "./CombatantInfoButton";
import { DetailedCombatantInfoCard } from "./DetailedCombatantInfoCard";
import {
  Combatant,
  CombatantEquipment,
  CombatantProperties,
  InputLock,
  Inventory,
} from "@speed-dungeon/common";
import "./floating-text-animation.css";
import { CombatantFloatingMessagesDisplay } from "./combatant-floating-messages-display";
import { InventoryIconButton } from "./InventoryIconButton";
import HotswapSlotButtons from "./HotswapSlotButtons";
import { CharacterModelDisplay } from "@/app/character-model-display";
import HoverableTooltipWrapper from "@/app/components/atoms/HoverableTooltipWrapper";
import LowDurabilityIndicators from "./LowDurabilityIndicators";
import ConditionIndicators from "./condition-indicators/";
import ThreatPriorityList from "./ThreatPriorityList";
import Portrait from "./Portrait";
import { getCombatantUiIdentifierIcon } from "@/utils/get-combatant-class-icon";
import ClockIcon from "../../../../public/img/game-ui-icons/clock-icon.svg";
import { observer } from "mobx-react-lite";
import { AppStore } from "@/mobx-stores/app-store";
import { DialogElementName } from "@/mobx-stores/dialogs";

interface Props {
  combatant: Combatant;
  showExperience: boolean;
}

export const CombatantPlaque = observer(({ combatant, showExperience }: Props) => {
  const gameOption = useGameStore().game;

  const { focusStore, dialogStore, gameWorldStore, imageStore } = AppStore.get();
  const showDebug = dialogStore.isOpen(DialogElementName.Debug);

  const portraitOption = imageStore.getCombatantPortraitOption(combatant.getEntityId());
  const entityId = combatant.entityProperties.id;
  const babylonDebugInfo = gameWorldStore.getCombatantDebugDisplay(entityId);

  const usernameOption = useGameStore().username;
  const result = getGameAndParty(gameOption, usernameOption);
  if (result instanceof Error) return <div>{result.message}</div>;
  const [game, party] = result;

  const { entityProperties, combatantProperties } = combatant;
  const battleOptionResult = getCurrentBattleOption(game, party.name);
  if (battleOptionResult instanceof Error) return <div>{battleOptionResult.message}</div>;
  const battleOption = battleOptionResult;

  // for measuring the element so we can get the correct portrait height
  // and getting the position so we can position the details window without going off the screen
  const combatantPlaqueRef = useRef<HTMLDivElement>(null);
  const nameAndBarsRef = useRef<HTMLDivElement>(null);
  const [portraitHeight, setPortraitHeight] = useState(0);
  useEffect(() => {
    if (!nameAndBarsRef.current) return;
    const height = nameAndBarsRef.current.clientHeight;
    setPortraitHeight(height);
  }, []);

  const combatantIsDetailed = focusStore.entityIsDetailed(entityId);

  const isFocused = focusStore.characterIsFocused(entityId);

  const isPartyMember = combatant.combatantProperties.isPlayerControlled();

  const isHovered = focusStore.entityIsHovered(entityId);
  const conditionalBorder = getConditionalBorder(isHovered, isFocused, combatantIsDetailed);

  const lockedUiState = InputLock.isLocked(party.inputLock)
    ? "opacity-50 pointer-events-none "
    : "pointer-events-auto ";

  const equippedItems = CombatantEquipment.getAllEquippedItems(combatantProperties.equipment, {});

  const conditionIndicators = (styles: string) => (
    <div className={`w-full h-6 py-0.5 ${styles}`}>
      <ConditionIndicators conditions={combatant.combatantProperties.conditions} />
      <LowDurabilityIndicators isPlayerControlled={isPartyMember} equippedItems={equippedItems} />
    </div>
  );

  const plaqueWidth = isPartyMember ? "23rem" : "23rem";

  const combatantUiIdentifierIcon = getCombatantUiIdentifierIcon(party, combatant);

  const actionPointsDisplay = (
    <HoverableTooltipWrapper
      extraStyles="absolute top-0 left-2/3 -translate-x-1/2 -translate-y-1/2 flex items-center"
      tooltipText="Action Points"
    >
      <ul className=" flex">
        {[1, 2].map((item) => (
          <li
            key={item}
            className={`h-5 w-5 mr-1 last:mr-0 bg-slate-700 rounded-full ${item > combatantProperties.actionPoints ? "opacity-50" : ""}`}
          >
            <ClockIcon className="h-full w-full fill-slate-400" />
          </li>
        ))}
      </ul>
    </HoverableTooltipWrapper>
  );

  const shouldDisplayActionPoints =
    battleOption !== null &&
    battleOption.turnOrderManager.combatantIsFirstInTurnOrder(combatant.entityProperties.id);

  return (
    <div className="">
      <CharacterModelDisplay character={combatant}>
        <CombatantFloatingMessagesDisplay entityId={entityId} />
        <div className="absolute flex flex-col justify-center items-center text-center top-1/2 left-1/2 -translate-x-1/2 w-[400px]">
          <div>
            {
              // targetedBy.map((item) => {
              // const action = COMBAT_ACTIONS[item.actionName];
              // const intentStyling =
              //   action.targetingProperties.intent === CombatActionIntent.Malicious
              //     ? "fill-red-600"
              //     : "fill-green-600";
              // return (
              //   <div className="h-10 w-10 ">
              //     <TargetIcon className={`h-full w-full ${intentStyling}`} />
              //   </div>
              // );
              // })
            }
          </div>
          {babylonDebugInfo}
        </div>
      </CharacterModelDisplay>
      {isPartyMember && conditionIndicators("mb-1") /* otherwise put it below */}

      <div className="flex">
        {!CombatantProperties.isDead(combatantProperties) && (
          <ThreatPriorityList threatManager={combatantProperties.threatManager || null} />
        )}
        <div>
          <div
            className={`h-fit bg-slate-700 flex p-2.5 relative box-border outline ${conditionalBorder} ${lockedUiState}`}
            style={{
              width: plaqueWidth,
            }}
            ref={combatantPlaqueRef}
          >
            {shouldDisplayActionPoints && actionPointsDisplay}
            {isPartyMember && (
              <InventoryIconButton
                entityId={entityId}
                numItemsInInventory={Inventory.getTotalNumberOfItems(combatantProperties.inventory)}
              />
            )}
            {isPartyMember && (
              <HotswapSlotButtons
                className={"absolute -top-2 -left-2 z-10 flex flex-col border border-slate-400"}
                entityId={entityId}
                selectedSlotIndex={combatantProperties.equipment.equippedHoldableHotswapSlotIndex}
                numSlots={
                  CombatantEquipment.getHoldableHotswapSlots(combatantProperties.equipment).length
                }
                vertical={true}
                registerKeyEvents={isFocused}
              />
            )}
            <TargetingIndicators party={party} entityId={entityId} />
            <DetailedCombatantInfoCard
              combatantId={entityId}
              combatantPlaqueRef={combatantPlaqueRef}
            />
            <Portrait
              portrait={portraitOption}
              portraitHeight={portraitHeight}
              combatantLevel={combatantProperties.level}
            />
            <div className="flex-grow" ref={nameAndBarsRef}>
              <div className="mb-1.5 flex justify-between items-center align-middle leading-5 text-lg ">
                <span className="flex">
                  <span className="max-w-44 overflow-hidden text-ellipsis">
                    {entityProperties.name}
                  </span>
                  <span>
                    {showDebug ? (
                      <HoverableTooltipWrapper tooltipText={entityId}>
                        _[{entityId.slice(0, 5)}]
                      </HoverableTooltipWrapper>
                    ) : (
                      ""
                    )}
                  </span>
                </span>

                <div className="flex items-center h-full">
                  <HoverableTooltipWrapper tooltipText="This combatant's designation in UI elements such as the turn order bar and threat table displays">
                    <div className="h-5 bg-slate-950 mr-2">{combatantUiIdentifierIcon}</div>
                  </HoverableTooltipWrapper>
                  <div className="ml-1">
                    <UnspentAttributesButton
                      combatantProperties={combatantProperties}
                      entityId={entityId}
                    />
                  </div>
                  <div className="ml-1">
                    <CombatantInfoButton combatant={combatant} />
                  </div>
                </div>
              </div>
              <ValueBarsAndFocusButton
                combatantId={entityId}
                combatantProperties={combatantProperties}
                isFocused={isFocused}
                showExperience={showExperience}
              />
            </div>
          </div>

          <div className="flex">
            {!isPartyMember && conditionIndicators("mt-1") /* otherwise put it above */}
          </div>
        </div>
      </div>
    </div>
  );
});

function getConditionalBorder(
  infoButtonIsHovered: boolean,
  isFocused: boolean,
  combatantIsDetailed: boolean
) {
  return infoButtonIsHovered
    ? "outline-1 outline-white"
    : isFocused
      ? "outline-3 outline-slate-400"
      : combatantIsDetailed
        ? "outline-1 outline-yellow-400"
        : "outline-1 outline-slate-400";
}
