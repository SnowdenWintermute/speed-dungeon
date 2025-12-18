export type Attribution = { name: string; link: string };

export enum Artist {
  Quaternius,
  RyanHetchler,
  SystemG6,
  OveractionGS,
  ProxyGames,
  Drummyfish,
  WeaponGuy,
  ClintBellanger,
  Snowden,
  JoneyLol,
  Mehrasaur,
  Zsky,
  Mastahcez,
  Djonvincent,
  P0ss,
  PublicDomain,
}

export const ARTISTS: Record<Artist, Attribution> = {
  [Artist.Quaternius]: {
    name: "Quaternius",
    link: "https://quaternius.com",
  },
  [Artist.RyanHetchler]: {
    name: "Ryan Hetchler",
    link: "https://opengameart.org/users/ralchire",
  },
  [Artist.SystemG6]: {
    name: "System G6",
    link: "https://opengameart.org/users/system-g6",
  },
  [Artist.OveractionGS]: {
    name: "Overaction Game Studio",
    link: "https://opengameart.org/users/overactiongs",
  },
  [Artist.ProxyGames]: {
    name: "Proxy Games",
    link: "https://opengameart.org/users/proxy-games",
  },
  [Artist.Drummyfish]: {
    name: "Drummyfish",
    link: "https://opengameart.org/users/drummyfish",
  },
  [Artist.WeaponGuy]: {
    name: "WeaponGuy",
    link: "https://opengameart.org/users/weaponguy",
  },
  [Artist.ClintBellanger]: {
    name: "Clint Bellanger",
    link: "https://clintbellanger.net",
  },
  [Artist.Snowden]: {
    name: "Snowden",
    link: "https://mikesilverman.net",
  },
  [Artist.JoneyLol]: {
    name: "joney_lol",
    link: "https://poly.pizza/u/joney_lol",
  },
  [Artist.Mehrasaur]: {
    name: "mehrasaur",
    link: "https://opengameart.org/users/mehrasaur",
  },
  [Artist.Zsky]: {
    name: "Zsky",
    link: "https://www.patreon.com/Zsky",
  },
  [Artist.Mastahcez]: {
    name: "mastahcez",
    link: "https://opengameart.org/users/mastahcez",
  },
  [Artist.Djonvincent]: {
    name: "djonvincent",
    link: "https://opengameart.org/users/djonvincent",
  },
  [Artist.P0ss]: {
    name: "p0ss",
    link: "https://opengameart.org/users/p0ss",
  },
  [Artist.PublicDomain]: {
    name: "Public Domain",
    link: "https://en.wikipedia.org/wiki/Public_domain",
  },
};
