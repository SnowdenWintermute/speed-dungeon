import { useClientApplication } from "@/hooks/create-client-application-context";
import { observer } from "mobx-react-lite";
import React from "react";
import { Game } from "./game";
import { GameSetup } from "./lobby/game-setup";
import { Lobby } from "./lobby";

export const MainAppWindow = observer(() => {
  const clientApplication = useClientApplication();

  const { gameOption } = clientApplication.gameContext;
  const { focusedCharacterOption } = clientApplication.combatantFocus;

  const shouldShowGame = focusedCharacterOption !== undefined && gameOption?.getTimeStarted();
  console.log("should show game:", shouldShowGame);

  return shouldShowGame ? (
    <Game />
  ) : gameOption ? (
    <GameSetup gameMode={gameOption.mode} />
  ) : (
    <Lobby />
  );
});
