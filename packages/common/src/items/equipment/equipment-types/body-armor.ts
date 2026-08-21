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

export const BODY_ARMOR_TYPE_STRINGS: Record<BodyArmor, string> = {
  [BodyArmor.Rags]: "Rags",
  [BodyArmor.Cloak]: "Cloak",
  [BodyArmor.Robe]: "Robe",
  [BodyArmor.OfficersRobe]: "Officer's Robe",
  [BodyArmor.MageRobe]: "Mage Robe",
  [BodyArmor.LeatherVest]: "Leather Vest",
  [BodyArmor.HardLeather]: "Hard Leather",
  [BodyArmor.StuddedLeather]: "Studded Leather",
  [BodyArmor.DemonsaurLeather]: "Demonsaur Leather",
  [BodyArmor.RingMail]: "Ring Mail",
  [BodyArmor.ChainMail]: "Chain Mail",
  [BodyArmor.SplintMail]: "Splint Mail",
  [BodyArmor.FeatherMail]: "Feather Mail",
  [BodyArmor.OhmushellMail]: "Ohmushell Mail",
  [BodyArmor.BreastPlate]: "Breastplate",
  [BodyArmor.FieldPlate]: "Field Plate",
  [BodyArmor.GothicPlate]: "Gothic Plate",
  [BodyArmor.FullPlate]: "Full Plate",
};
