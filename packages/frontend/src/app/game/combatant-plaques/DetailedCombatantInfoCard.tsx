import React, { useRef } from "react";
import { Combatant } from "@speed-dungeon/common";
import { ZIndexLayers } from "@/app/z-index-layers";
import { observer } from "mobx-react-lite";
import { useClientApplication } from "@/hooks/create-client-application-context";
import { CombatantDisplay } from "../detailables/CombatantDisplay";

export const DetailedCombatantInfoCard = observer(() => {
  const clientApplication = useClientApplication();
  const { detailableEntityFocus, actionMenu } = clientApplication;
  const { detailed: detailedEntity, hovered: hoveredEntity } =
    detailableEntityFocus.detailables.getIfInstanceOf(Combatant);

  const detailedInfoContainerRef = useRef<HTMLDivElement>(null);
  let infoButtonHoveredStyles: { [key: string]: string | number } = {};

  let combatantOption: Combatant | undefined;
  infoButtonHoveredStyles = { zIndex: ZIndexLayers.CombatantInfoCard };
  if (hoveredEntity instanceof Combatant) {
    combatantOption = hoveredEntity;
  } else if (detailedEntity instanceof Combatant) {
    combatantOption = detailedEntity;
  }

  if (actionMenu.shouldShowCharacterSheet()) {
    infoButtonHoveredStyles = { zIndex: "" };
  }

  const detailedInfoCard = combatantOption ? (
    <div className="border border-slate-400 bg-slate-700 p-2.5 w-[650px]">
      <CombatantDisplay combatant={combatantOption} />
    </div>
  ) : (
    <div />
  );

  return (
    <div
      className={`absolute box-border ${infoButtonHoveredStyles} right-0 mr-14 top-1/2 -translate-y-1/2`}
      style={{ ...infoButtonHoveredStyles }}
      ref={detailedInfoContainerRef}
    >
      {detailedInfoCard}
    </div>
  );
});
