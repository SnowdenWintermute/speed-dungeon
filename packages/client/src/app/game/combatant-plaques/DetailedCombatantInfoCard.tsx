import { useGameStore } from "@/stores/game-store";
import React, { useEffect, useRef, useState } from "react";
import CombatantDisplay from "../detailables/CombatantDisplay";
import { SPACING_REM_SMALL } from "@/client_consts";
import { Combatant } from "@speed-dungeon/common";
import { ZIndexLayers } from "@/app/z-index-layers";

interface Props {
  combatantId: string;
  combatantPlaqueRef: React.RefObject<HTMLDivElement>;
}

export default function DetailedCombatantInfoCard(props: Props) {
  const detailedEntity = useGameStore((state) => state.detailedEntity);
  const hoveredEntity = useGameStore((state) => state.hoveredEntity);

  const detailedInfoContainerRef = useRef<HTMLDivElement>(null);
  const [cardPositionStyle, setCardPositionStyle] = useState<{ [key: string]: string }>({
    opacity: "0",
    left: "-1000px",
  });
  // const [cardPositionStyle, setCardPositionStyle] = useState<{ [key: string]: string }>({});
  let infoButtonHoveredStyles: { [key: string]: string | number } = {};

  let combatantOption: Combatant | undefined;
  if (
    hoveredEntity instanceof Combatant &&
    hoveredEntity.entityProperties.id === props.combatantId
  ) {
    combatantOption = hoveredEntity;
    infoButtonHoveredStyles = { zIndex: ZIndexLayers.CombatantInfoCard };
  } else if (
    detailedEntity instanceof Combatant &&
    detailedEntity.entityProperties.id === props.combatantId
  )
    combatantOption = detailedEntity;

  const detailedInfoCard = combatantOption ? (
    <div className="border border-slate-400 bg-slate-700 p-2.5 w-[650px]">
      <CombatantDisplay combatant={combatantOption} />
    </div>
  ) : (
    <div />
  );

  const showingCard = combatantOption !== undefined;

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
      style={{ ...cardPositionStyle, ...infoButtonHoveredStyles }}
      ref={detailedInfoContainerRef}
    >
      {detailedInfoCard}
    </div>
  );
}
