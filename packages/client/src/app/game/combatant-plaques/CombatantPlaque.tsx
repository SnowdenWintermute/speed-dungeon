import { useGameStore } from "@/stores/game-store";
import getCurrentBattleOption from "@/utils/getCurrentBattleOption";
import getGameAndParty from "@/utils/getGameAndParty";
import React, { useEffect, useRef, useState } from "react";
import TargetingIndicators from "./TargetingIndicators";
import { entityIsDetailed } from "@/stores/game-store/detailable-entities";
import UnspentAttributesButton from "../UnspentAttributesButton";
import { useShallow } from "zustand/react/shallow";
import ValueBarsAndFocusButton from "./ValueBarsAndFocusButton";
import ActiveCombatantIcon from "./ActiveCombatantIcon";
import CombatantInfoButton from "./CombatantInfoButton";
import DetailedCombatantInfoCard from "./DetailedCombatantInfoCard";
import { Combatant, CombatantEquipment, InputLock, Inventory } from "@speed-dungeon/common";
import "./floating-text-animation.css";
import CombatantFloatingMessagesDisplay from "./combatant-floating-messages-display";
import InventoryIconButton from "./InventoryIconButton";
import HotswapSlotButtons from "./HotswapSlotButtons";
import CharacterModelDisplay from "@/app/character-model-display";
import { useUIStore } from "@/stores/ui-store";
import HoverableTooltipWrapper from "@/app/components/atoms/HoverableTooltipWrapper";

interface Props {
  combatant: Combatant;
  showExperience: boolean;
}

export default function CombatantPlaque({ combatant, showExperience }: Props) {
  const gameOption = useGameStore().game;
  const showDebug = useUIStore().showDebug;
  const portrait = useGameStore((state) => state.combatantPortraits[combatant.entityProperties.id]);
  const { detailedEntity, focusedCharacterId, hoveredEntity } = useGameStore(
    useShallow((state) => ({
      detailedEntity: state.detailedEntity,
      focusedCharacterId: state.focusedCharacterId,
      hoveredEntity: state.hoveredEntity,
    }))
  );
  const entityId = combatant.entityProperties.id;
  const babylonDebugMessages =
    useGameStore().babylonControlledCombatantDOMData[entityId]?.debugMessages;

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

  function isHovered() {
    if (!hoveredEntity) return false;
    if (!(hoveredEntity instanceof Combatant)) return false;
    if (hoveredEntity.entityProperties.id === entityId) return true;
    return false;
  }

  const combatantIsDetailed = entityIsDetailed(entityId, detailedEntity);
  const isFocused = focusedCharacterId === entityId;
  const isPartyMember = party.characterPositions.includes(entityId);

  const conditionalBorder = getConditionalBorder(isHovered(), isFocused, combatantIsDetailed);

  const lockedUiState = InputLock.isLocked(party.inputLock)
    ? "opacity-50 pointer-events-none "
    : "pointer-events-auto ";

  return (
    <div className="">
      <CharacterModelDisplay character={combatant}>
        <CombatantFloatingMessagesDisplay entityId={entityId} />
        <div className="absolute flex flex-col justify-center items-center text-center top-1/2 left-1/2 -translate-x-1/2 w-[400px]">
          {babylonDebugMessages?.map((message) => (
            <div className="text-xl relative w-[400px] text-center" key={message.id}>
              <div className="">{message.text}</div>
            </div>
          ))}
        </div>
      </CharacterModelDisplay>
      <div
        className={`w-[23rem] h-fit bg-slate-700 flex p-2.5 relative box-border outline ${conditionalBorder} ${lockedUiState}`}
        ref={combatantPlaqueRef}
      >
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
            numSlots={CombatantEquipment.getHoldableHotswapSlots(combatantProperties).length}
            vertical={true}
            registerKeyEvents={entityId === focusedCharacterId}
          />
        )}
        <TargetingIndicators party={party} entityId={entityId} />
        <DetailedCombatantInfoCard combatantId={entityId} combatantPlaqueRef={combatantPlaqueRef} />
        <div className="relative rounded-full">
          <div
            className="h-full aspect-square mr-2 border border-slate-400 bg-slate-600 rounded-full overflow-hidden"
            style={{ height: `${portraitHeight}px` }}
          >
            {portrait && <img className="h-full object-cover" src={portrait} alt="portrait" />}
          </div>
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-5 border border-slate-400 bg-slate-700 pr-2 pl-2 text-sm flex items-center justify-center">
            {combatantProperties.level}
          </div>
        </div>
        <div className="flex-grow" ref={nameAndBarsRef}>
          <div className="mb-1.5 flex justify-between items-center align-middle leading-5 text-lg ">
            <span className="flex">
              <span className="">{entityProperties.name}</span>
              <span>
                {showDebug ? (
                  <HoverableTooltipWrapper tooltipText={entityId}>
                    _[{entityId.slice(0, 5)}]
                  </HoverableTooltipWrapper>
                ) : (
                  ""
                )}
              </span>
              <UnspentAttributesButton
                combatantProperties={combatantProperties}
                entityId={entityId}
              />
            </span>
            <span className="flex items-center">
              <CombatantInfoButton combatant={combatant} />
            </span>
          </div>
          <ValueBarsAndFocusButton
            combatantId={entityId}
            combatantProperties={combatantProperties}
            isFocused={isFocused}
            showExperience={showExperience}
          />
        </div>
      </div>
      <ActiveCombatantIcon battleOption={battleOption} combatantId={entityId} />
    </div>
  );
}

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
