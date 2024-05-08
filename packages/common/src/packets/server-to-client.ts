export type GameListEntry = {
  gameName: string;
  numberOfUsers: number;
  timeStarted: undefined | number;
};

export interface ServerToClientEventTypes {
  ["gameFullUpdate"]: (data: string) => void;
}
