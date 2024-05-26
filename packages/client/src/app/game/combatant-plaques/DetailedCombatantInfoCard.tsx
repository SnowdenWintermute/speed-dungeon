import { useGameStore } from "@/stores/game-store";
import { useShallow } from "zustand/react/shallow";
import React, { useEffect, useRef, useState } from "react";
import { DetailableEntityType } from "@/stores/game-store/detailable-entities";
import CombatantDetailsDisplay from "../detailables/CombatantDetailsDisplay";
import { SPACING_REM_SMALL } from "@/client_consts";

interface Props {
  combatantId: string;
  combatantPlaqueRef: React.RefObject<HTMLDivElement>;
}

export default function DetailedCombatantInfoCard(props: Props) {
  const { detailedEntity, hoveredEntity } = useGameStore(
    useShallow((state) => ({
      detailedEntity: state.detailedEntity,
      hoveredEntity: state.hoveredEntity,
    }))
  );
  const combatantDetailedInfoRef = useRef<HTMLDivElement>(null);
  const [cardPositionStyle, setCardPositionStyle] = useState({});
  let infoButtonHoveredStyles = "";

  let detailedInfoCard;
  if (hoveredEntity && hoveredEntity.type === DetailableEntityType.Combatant) {
    detailedInfoCard = (
      <div className="border border-slate-400 bg-slate-700 p-2.5">
        <CombatantDetailsDisplay combatantDetails={hoveredEntity.combatant} />
      </div>
    );
    infoButtonHoveredStyles = "z-50";
  } else if (detailedEntity && detailedEntity.type === DetailableEntityType.Combatant) {
    detailedInfoCard = (
      <div className="border border-slate-400 bg-slate-700 p-2.5">
        <CombatantDetailsDisplay combatantDetails={detailedEntity.combatant} />
      </div>
    );
  }

  const detailedInfoCardExists = detailedInfoCard !== undefined;

  useEffect(() => {
    let plaqueOption = props.combatantPlaqueRef.current;
    let detailedInfoOption = combatantDetailedInfoRef.current;
    if (plaqueOption && detailedInfoOption) {
      let windowWidth = window.innerWidth;
      let detailedInfoWidth = detailedInfoOption.clientWidth;
      let detailedInfoHeight = detailedInfoOption.clientHeight;
      let plaqueX = plaqueOption.getBoundingClientRect().x;
      let plaqueY = plaqueOption.getBoundingClientRect().y;
      let style: { [key: string]: string } = {};
      if (plaqueY - detailedInfoHeight < 0) {
        // put below
        style = {
          bottom: "0px;",
          transform: "translateY(100%);",
          paddingTop: `${SPACING_REM_SMALL}rem;`,
        };
      } else {
        // put above
        style = {
          bottom: "0px;",
          transform: `translateY(-${detailedInfoHeight}%);`,
          paddingBottom: `${SPACING_REM_SMALL}rem;`,
        };
      }

      if (plaqueX + detailedInfoWidth > windowWidth) {
        style["right"] = "-1px;";
        style["transform"] = "translateX(-100%);";
      } else {
        style["left"] = "-1px;";
      }

      setCardPositionStyle(style);
    }
  }, [detailedInfoCardExists]);

  return (
    <div
      className={`absolute box-border ${infoButtonHoveredStyles}`}
      style={cardPositionStyle}
      ref={combatantDetailedInfoRef}
    >
      {detailedInfoCard || <></>}
    </div>
  );
}
