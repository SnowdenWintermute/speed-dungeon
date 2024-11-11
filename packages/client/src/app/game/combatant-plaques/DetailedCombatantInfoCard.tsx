import { useGameStore } from "@/stores/game-store";
import { useShallow } from "zustand/react/shallow";
import React, { useEffect, useRef, useState } from "react";
import { DetailableEntityType } from "@/stores/game-store/detailable-entities";
import CombatantDisplay from "../detailables/CombatantDisplay";
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
  const detailedInfoContainerRef = useRef<HTMLDivElement>(null);
  const [cardPositionStyle, setCardPositionStyle] = useState<{ [key: string]: string }>({
    opacity: "0",
    left: "-1000px",
  });
  // const [cardPositionStyle, setCardPositionStyle] = useState<{ [key: string]: string }>({});
  let infoButtonHoveredStyles = "";

  let combatantDetailsOption;
  if (
    hoveredEntity &&
    hoveredEntity.type === DetailableEntityType.Combatant &&
    hoveredEntity.combatant.entityProperties.id === props.combatantId
  ) {
    combatantDetailsOption = hoveredEntity.combatant;
    infoButtonHoveredStyles = "z-50";
  } else if (
    detailedEntity &&
    detailedEntity.type === DetailableEntityType.Combatant &&
    detailedEntity.combatant.entityProperties.id === props.combatantId
  )
    combatantDetailsOption = detailedEntity.combatant;

  const detailedInfoCard = combatantDetailsOption ? (
    <div className="border border-slate-400 bg-slate-700 p-2.5">
      <CombatantDisplay combatantDetails={combatantDetailsOption} />
    </div>
  ) : (
    <div />
  );

  const showingCard = combatantDetailsOption !== undefined;

  useEffect(() => {
    let plaqueOption = props.combatantPlaqueRef.current;
    let detailedInfoContainer = detailedInfoContainerRef.current;
    if (!(plaqueOption && detailedInfoContainer)) return;

    let windowWidth = window.innerWidth;
    let detailedInfoWidth = detailedInfoContainer.clientWidth;
    let detailedInfoHeight = detailedInfoContainer.clientHeight;
    let plaqueX = plaqueOption.getBoundingClientRect().x;
    let plaqueY = plaqueOption.getBoundingClientRect().y;

    if (!detailedInfoHeight || !detailedInfoWidth) return;
    const style: { [key: string]: string } = {};
    let transformStyle = "";

    if (plaqueY - detailedInfoHeight < 0)
      style["bottom"] = `calc(${-detailedInfoHeight}px - ${SPACING_REM_SMALL}rem)`;
    else style["top"] = `calc(${-detailedInfoHeight}px - ${SPACING_REM_SMALL}rem)`;

    if (plaqueX + detailedInfoWidth > windowWidth) {
      style["right"] = "-1px";
      transformStyle = transformStyle.concat(`translateX(-100%)`);
    } else style["left"] = "-1px";

    style["transform"] = `transformStyle`;

    setCardPositionStyle(style);
  }, [showingCard]);

  return (
    <div
      className={`absolute box-border ${infoButtonHoveredStyles}`}
      style={cardPositionStyle}
      ref={detailedInfoContainerRef}
    >
      {detailedInfoCard}
    </div>
  );
}
