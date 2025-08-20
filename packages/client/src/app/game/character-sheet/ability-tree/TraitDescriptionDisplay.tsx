import {
  AbilityType,
  Combatant,
  CombatantAbilityProperties,
  CombatantTraitDescription,
  CombatantTraitType,
} from "@speed-dungeon/common";

export default function TraitDescriptionDisplay({
  traitType,
  description,
  user,
}: {
  traitType: CombatantTraitType;
  description: CombatantTraitDescription;
  user: Combatant;
}) {
  const ownedAbilityLevel = CombatantAbilityProperties.getAbilityLevel(user.combatantProperties, {
    type: AbilityType.Trait,
    traitType,
  });

  return (
    <div>
      <div>{description.summary}</div>
      <div>
        {description.descriptionsByLevel.map((description, index) => {
          const thisRankOwned = ownedAbilityLevel >= index + 1;

          return (
            <div
              key={"description-" + index}
              className={`mb-2 ${thisRankOwned ? "" : "text-gray-400"}`}
            >
              <div className={`flex justify-between text-lg `}>
                <div className=" underline-offset-4 underline">Rank {index + 1}</div>
                {
                  // classAndLevelRequirements && (
                  // <div
                  //   className={
                  //     CombatantProperties.meetsCombatantClassAndLevelRequirements(
                  //       user.combatantProperties,
                  //       classAndLevelRequirements.combatantClass,
                  //       classAndLevelRequirements.level
                  //     )
                  //       ? ""
                  //       : UNMET_REQUIREMENT_TEXT_COLOR
                  //   }
                  // >
                  //   ({COMBATANT_CLASS_NAME_STRINGS[classAndLevelRequirements.combatantClass]}
                  //   {" level "}
                  //   {classAndLevelRequirements?.level})
                  // </div>
                  // )
                }
              </div>
              <div>{description}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
