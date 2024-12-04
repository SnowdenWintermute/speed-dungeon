import ButtonBasic from "@/app/components/atoms/ButtonBasic";
import Divider from "@/app/components/atoms/Divider";
import HoverableTooltipWrapper from "@/app/components/atoms/HoverableTooltipWrapper";
import { useGameStore } from "@/stores/game-store";
import {
  Combatant,
  CombatantTrait,
  CombatantTraitType,
  TRAIT_DESCRIPTIONS,
  formatMagicalElement,
  formatPhysicalDamageType,
} from "@speed-dungeon/common";
import React from "react";
import CharacterAttributes from "../character-sheet/CharacterAttributes";

interface Props {
  combatantDetails: Combatant;
}

export default function CombatantDisplay({ combatantDetails }: Props) {
  const mutateGameState = useGameStore().mutateState;
  const { entityProperties, combatantProperties } = combatantDetails;

  function closeDisplay() {
    mutateGameState((store) => {
      store.detailedEntity = null;
      store.hoveredEntity = null;
    });
  }

  return (
    <div className="flex justify-between ">
      <CharacterAttributes
        combatantProperties={combatantProperties}
        entityProperties={entityProperties}
        showAttributeAssignmentButtons={false}
      />
      <div className="h-full pl-4 w-1/2">
        <div className="w-full flex justify-end">
          <ButtonBasic onClick={closeDisplay}>{"Close"}</ButtonBasic>
        </div>
        <div className="flex justify-between">
          <span>{"Traits "}</span>
          <span> </span>
        </div>
        <Divider />
        <ul>
          <CombatantTraitsDisplay traits={combatantProperties.traits} />
        </ul>
      </div>
    </div>
  );
}

function CombatantTraitsDisplay({ traits }: { traits: CombatantTrait[] }) {
  return traits.map((trait, i) => {
    return (
      <li key={i}>
        <span className="inline-block h-6 w-6">
          <HoverableTooltipWrapper tooltipText={TRAIT_DESCRIPTIONS[trait.type]}>
            <span className="cursor-help h-full w-full inline-block">{"ⓘ "}</span>
          </HoverableTooltipWrapper>
        </span>
        <span>{formatCombatantTrait(trait)}</span>
      </li>
    );
  });
}

export function formatCombatantTrait(trait: CombatantTrait) {
  let affinityOrResistance, percentToShow;

  let numberStyle = "";
  switch (trait.type) {
    case CombatantTraitType.HpBioavailability:
    case CombatantTraitType.MpBioavailability:
    case CombatantTraitType.ElementalAffinity:
    case CombatantTraitType.PhysicalDamageTypeResistance:
      if (trait.percent > 100) numberStyle = "text-green-600";
      if (trait.percent < 0) numberStyle = "text-red-400";
      break;
    case CombatantTraitType.Undead:
      break;
  }

  switch (trait.type) {
    case CombatantTraitType.HpBioavailability:
      return (
        <span>
          Hp Bioavailability <span className={numberStyle}>{trait.percent}%</span>
        </span>
      );
    case CombatantTraitType.MpBioavailability:
      return (
        <span>
          Mp Bioavailability <span className={numberStyle}>{trait.percent}%</span>
        </span>
      );
    case CombatantTraitType.ElementalAffinity:
      affinityOrResistance = trait.percent > 100 ? "affinity" : "resistance";
      percentToShow = trait.percent > 100 ? trait.percent - 100 : trait.percent;
      return (
        <span>
          {formatMagicalElement(trait.element)} {affinityOrResistance}{" "}
          <span className={numberStyle}>{percentToShow}%</span>
        </span>
      );
    case CombatantTraitType.Undead:
      return "Undead";
    case CombatantTraitType.PhysicalDamageTypeResistance:
      affinityOrResistance = trait.percent > 100 ? "affinity" : "resistance";
      percentToShow = trait.percent > 100 ? trait.percent - 100 : trait.percent;
      return (
        <span>
          {formatPhysicalDamageType(trait.damageType)} {affinityOrResistance}{" "}
          <span className={numberStyle}>{percentToShow}%</span>
        </span>
      );
  }
}
