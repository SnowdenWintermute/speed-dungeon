import { useGameStore } from "@/stores/game-store";
import { useLobbyStore } from "@/stores/lobby-store";
import getCurrentBattleOption from "@/utils/getCurrentBattleOption";
import getGameAndParty from "@/utils/getGameAndParty";
import React, { useRef, useState } from "react";
import TargetingIndicators from "./TargetingIndicators";
import { entityIsDetailed } from "@/stores/game-store/detailable-entities";
import UnspentAttributesButton from "../UnspentAttributesButton";
import { BUTTON_HEIGHT_SMALL } from "@/client_consts";
import { useShallow } from "zustand/react/shallow";

interface Props {
  entityId: string;
  showExperience: boolean;
}

export default function CombatantPlaque({ entityId, showExperience }: Props) {
  const gameOption = useGameStore().game;
  const { detailedEntity, focusedCharacterId } = useGameStore(
    useShallow((state) => ({
      detailedEntity: state.detailedEntity,
      focusedCharacterId: state.focusedCharacterId,
    }))
  );
  const usernameOption = useLobbyStore().username;
  const result = getGameAndParty(gameOption, usernameOption);
  if (result instanceof Error) return <div>{result.message}</div>;
  const [game, party] = result;
  const combatantDetailsResult = party.getCombatant(entityId);
  if (combatantDetailsResult instanceof Error) return <div>{combatantDetailsResult.message}</div>;
  const { entityProperties, combatantProperties } = combatantDetailsResult;

  const battleOption = getCurrentBattleOption(game, party.name);

  // for measuring the element so we can get the correct portrait height
  // and getting the position so we can position the details window without going off the screen
  const combatantPlaqueRef = useRef<HTMLDivElement>(null);
  const nameAndBarsRef = useRef<HTMLDivElement>(null);
  const [portraitHeight, setPortraitHeight] = useState(0);
  const [infoButtonIsHovered, setInfoButtonIsHovered] = useState(false);

  const combatantIsDetailed = entityIsDetailed(entityId, detailedEntity);
  const isFocused = focusedCharacterId === entityId;

  const conditionalBorder = getConditionalBorder(
    infoButtonIsHovered,
    isFocused,
    combatantIsDetailed
  );

  function handleUnspentAttributesButtonClick() {
    //
  }

  return (
    <div>
      <div
        className={`w-96 h-fit border bg-slate-700 pointer-events-auto flex p-2.5 relative box-border ${conditionalBorder} `}
        ref={combatantPlaqueRef}
      >
        <TargetingIndicators party={party} entityId={entityId} />
        {
          // <DetailedCombatantInfoCard
          // combatant_id={combatant_id}
          // combatant_plaque_ref={combatant_plaque_ref.clone()}
          // info_button_is_hovered={info_button_is_hovered.clone()}
          // />
        }
        <div
          className="h-full aspect-square mr-2 border border-slate-400 bg-slate-600 rounded-full relative"
          style={{ height: `${portraitHeight}px;` }}
        >
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-5 border border-slate-400 bg-slate-700 pr-2 pl-2 text-sm flex items-center justify-center">
            {combatantProperties.level}
          </div>
        </div>
        <div className="flex-grow" ref={nameAndBarsRef}>
          <div className="mb-1.5 flex justify-between text-lg">
            <span>
              {entityProperties.name}
              <UnspentAttributesButton
                combatantProperties={combatantProperties}
                handleClick={handleUnspentAttributesButtonClick}
              />
            </span>
            <span>
              {
                // <CombatantInfoButton combatant_id={combatant_id} info_button_is_hovered={info_button_is_hovered.clone()} />
              }
            </span>
          </div>
          <ValueBarsAndFocusButton />
        </div>
      </div>
      <div className="pt-2" style={{ height: `${BUTTON_HEIGHT_SMALL}rem` }}>
        {is_active_combatant_icon}
      </div>
    </div>
  );
}

function getConditionalBorder(
  infoButtonIsHovered: boolean,
  isFocused: boolean,
  combatantIsDetailed: boolean
) {
  return infoButtonIsHovered
    ? "border-white"
    : isFocused
      ? "border-lime-500"
      : combatantIsDetailed
        ? "border-yellow-400"
        : "border-slate-400";
}
