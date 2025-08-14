import HoverableTooltipWrapper from "@/app/components/atoms/HoverableTooltipWrapper";
import { CombatantTraitProperties } from "@speed-dungeon/common";
import React from "react";

export default function CombatantTraitsDisplay({
  traitProperties,
}: {
  traitProperties: CombatantTraitProperties;
}) {
  return <div>{JSON.stringify(traitProperties)}</div>;
  // return traitProperties.inherentTraits.map((trait, i) => {
  //   return (
  //     <li key={i}>
  //       <span className="inline-block h-6 w-6">
  //         <HoverableTooltipWrapper tooltipText={TRAIT_DESCRIPTIONS[trait.type]}>
  //           <span className="cursor-help h-full w-full inline-block">{"ⓘ "}</span>
  //         </HoverableTooltipWrapper>
  //       </span>
  //       <span>{formatCombatantTrait(trait)}</span>
  //     </li>
  //   );
  // });
}

// export function formatCombatantTrait(trait: CombatantTrait) {
//   let affinityOrResistance, percentToShow;

//   let numberStyle = "";
//   switch (trait.type) {
//     case CombatantTraitType.HpBioavailability:
//     case CombatantTraitType.MpBioavailability:
//     case CombatantTraitType.ElementalAffinity:
//     case CombatantTraitType.KineticDamageTypeResistance:
//       if (trait.percent > 100) numberStyle = "text-green-600";
//       if (trait.percent < 0) numberStyle = "text-red-400";
//       break;
//     case CombatantTraitType.Undead:
//       break;
//   }

//   switch (trait.type) {
//     case CombatantTraitType.HpBioavailability:
//       return (
//         <span>
//           Hp Bioavailability <span className={numberStyle}>{trait.percent}%</span>
//         </span>
//       );
//     case CombatantTraitType.MpBioavailability:
//       return (
//         <span>
//           Mp Bioavailability <span className={numberStyle}>{trait.percent}%</span>
//         </span>
//       );
//     case CombatantTraitType.ElementalAffinity:
//       affinityOrResistance = trait.percent > 100 ? "affinity" : "resistance";
//       percentToShow = trait.percent > 100 ? trait.percent - 100 : trait.percent;
//       return (
//         <span>
//           {MAGICAL_ELEMENT_STRINGS[trait.element]} {affinityOrResistance}{" "}
//           <span className={numberStyle}>{percentToShow}%</span>
//         </span>
//       );
//     case CombatantTraitType.Undead:
//       return "Undead";
//     case CombatantTraitType.KineticDamageTypeResistance:
//       affinityOrResistance = trait.percent > 100 ? "affinity" : "resistance";
//       percentToShow = trait.percent > 100 ? trait.percent - 100 : trait.percent;
//       return (
//         <span>
//           {KINETIC_DAMAGE_TYPE_STRINGS[trait.damageType]} {affinityOrResistance}{" "}
//           <span className={numberStyle}>{percentToShow}%</span>
//         </span>
//       );
//     case CombatantTraitType.ExtraHotswapSlot:
//       return "Stay Strapped";
//     case CombatantTraitType.CanConvertToShardsManually:
//       return "Disassembler";
//     case CombatantTraitType.ExtraConsumablesStorage:
//       return "Magical Minibag";
//   }
// }
