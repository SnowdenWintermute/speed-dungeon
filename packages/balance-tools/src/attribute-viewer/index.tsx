import ButtonBasic from "@speed-dungeon/ui/atoms/ButtonBasic";

export function AttributeViewer() {
  function handleClick() {
    // const attainableAttributeCalculator = new AttainableAttributeCalculator().getMaxAttainable(
    //   CombatantClass.Warrior,
    //   CombatantClass.Rogue,
    //   CharacterWeaponSpecialty.Shields,
    //   CombatAttribute.Strength
    // );
  }

  return (
    <div>
      AttributeViewer
      <div>
        <ButtonBasic onClick={handleClick}>click me</ButtonBasic>
      </div>
    </div>
  );
}
