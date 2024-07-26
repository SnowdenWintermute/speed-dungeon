export enum BodyArmor {
  Rags,
  Cape,
  Cloak,
  Robe,
  Kevlar,
  LeatherArmor,
  HardLeatherArmor,
  StuddedLeatherArmor,
  DemonsaurArmor,
  RingMail,
  ChainMail,
  ScaleMail,
  SplintMail,
  OhmushellMail,
  BreastPlate,
  FieldPlate,
  GothicPlate,
  FullPlate,
  ShardPlate,
}

export function formatBodyArmor(bodyArmor: BodyArmor): string {
  switch (bodyArmor) {
    case BodyArmor.Rags:
      return "Rags";
    case BodyArmor.Cape:
      return "Cape";
    case BodyArmor.Cloak:
      return "Cloak";
    case BodyArmor.Robe:
      return "Robe";
    case BodyArmor.Kevlar:
      return "Kevlar";
    case BodyArmor.LeatherArmor:
      return "Leather Armor";
    case BodyArmor.HardLeatherArmor:
      return "Hard Leather Armor";
    case BodyArmor.StuddedLeatherArmor:
      return "Studded Leather Armor";
    case BodyArmor.DemonsaurArmor:
      return "Demonsaur Armor";
    case BodyArmor.RingMail:
      return "Ringmail";
    case BodyArmor.ChainMail:
      return "Chainmail";
    case BodyArmor.ScaleMail:
      return "Scalemail";
    case BodyArmor.SplintMail:
      return "Splintmail";
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
    case BodyArmor.ShardPlate:
      return "Shard Plate";
  }
}
