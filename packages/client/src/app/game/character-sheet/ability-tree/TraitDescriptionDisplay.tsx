import { UNMET_REQUIREMENT_TEXT_COLOR } from "@/client_consts";
import {
  AbilityType,
  AbilityUtils,
  Combatant,
  COMBATANT_CLASS_NAME_STRINGS,
  CombatantAbilityProperties,
  CombatantProperties,
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
      <div className="mb-2">{description.summary}</div>
      {!description.isAllocatable && (
        <div className="mb-2">
          This trait is inherent to this class and ability points can not be allocated to it
        </div>
      )}
      <div>
        {description.descriptionsByLevel.map((description, index) => {
          const rank = index + 1;
          const thisRankOwned = ownedAbilityLevel >= rank;

          const classAndLevelRequirements = AbilityUtils.getClassAndLevelRequirements(
            { type: AbilityType.Trait, traitType },
            rank
          );

          return (
            <div
              key={"description-" + index}
              className={`mb-2 ${thisRankOwned ? "" : "text-gray-400"}`}
            >
              <div className={`flex justify-between text-lg `}>
                <div className=" underline-offset-4 underline">Rank {rank}</div>
                {classAndLevelRequirements && (
                  <div
                    className={
                      CombatantProperties.meetsCombatantClassAndLevelRequirements(
                        user.combatantProperties,
                        classAndLevelRequirements.combatantClass,
                        classAndLevelRequirements.level
                      )
                        ? ""
                        : UNMET_REQUIREMENT_TEXT_COLOR
                    }
                  >
                    ({COMBATANT_CLASS_NAME_STRINGS[classAndLevelRequirements.combatantClass]}
                    {" level "}
                    {classAndLevelRequirements?.level})
                  </div>
                )}
              </div>
              <div>{description}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
