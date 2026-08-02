export enum BodyArmor {
  Rags,
  Cloak,
  Robe,
  OfficersRobe,
  MageRobe,
  //
  LeatherVest,
  HardLeather,
  StuddedLeather,
  DemonsaurLeather,
  //
  RingMail,
  ChainMail,
  SplintMail,
  FeatherMail,
  OhmushellMail,
  //
  BreastPlate,
  FieldPlate,
  GothicPlate,
  FullPlate,
}

export function formatBodyArmor(bodyArmor: BodyArmor): string {
  switch (bodyArmor) {
    case BodyArmor.Rags:
      return "Rags";
    case BodyArmor.Cloak:
      return "Cloak";
    case BodyArmor.Robe:
      return "Robe";
    case BodyArmor.OfficersRobe:
      return "Officer's Robe";
    case BodyArmor.MageRobe:
      return "Mage Robe";
    case BodyArmor.LeatherVest:
      return "Leather Vest";
    case BodyArmor.HardLeather:
      return "Hard Leather";
    case BodyArmor.StuddedLeather:
      return "Studded Leather";
    case BodyArmor.DemonsaurLeather:
      return "Demonsaur Leather";
    case BodyArmor.RingMail:
      return "Ring Mail";
    case BodyArmor.ChainMail:
      return "Chain Mail";
    case BodyArmor.SplintMail:
      return "Splint Mail";
    case BodyArmor.FeatherMail:
      return "Feather Mail";
    case BodyArmor.OhmushellMail:
      return "Ohmushell Mail";
    case BodyArmor.BreastPlate:
      return "Breastplate";
    case BodyArmor.FieldPlate:
      return "Field Plate";
    case BodyArmor.GothicPlate:
      return "Gothic Plate";
    case BodyArmor.FullPlate:
      return "Full Plate";
  }
}
