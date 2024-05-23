import React, { Ref, useRef, useState } from "react";

interface Props {
  combatantId: string;
  combatantPlaqueRef: Ref<HTMLDivElement>;
  infoButtonIsHovered: boolean;
}

export default function DetailedCombatantInfoCard(props: Props) {
  const combatantDetailedInfoRef = useRef<HTMLDivElement>(null);
  const [cardPositionStyle, setCardPositionStyle] = useState({});
  const infoButtonHoveredStyles = props.infoButtonIsHovered ? "z-50" : "";

  return (
    <div
      className={`absolute box-border ${infoButtonHoveredStyles}`}
      style={cardPositionStyle}
      ref={combatantDetailedInfoRef}
    >
      {
        // detailed_info_card.unwrap_or_else(|| html!())
      }
    </div>
  );
}
