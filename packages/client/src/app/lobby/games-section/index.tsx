// @refresh reset
"use client";
import XShape from "../../../../public/img/basic-shapes/x-shape.svg";
import { useEffect, useRef, useState } from "react";
import {
  ClientToServerEvent,
  GameListEntry,
  GameMode,
  MAX_PARTY_SIZE,
  formatGameMode,
} from "@speed-dungeon/common";
import ButtonBasic from "../../components/atoms/ButtonBasic";
import { SPACING_REM_LARGE, SPACING_REM_SMALL } from "@/client_consts";
import Divider from "@/app/components/atoms/Divider";
import { useLobbyStore } from "@/stores/lobby-store";
import useElementIsOverflowing from "@/hooks/use-element-is-overflowing";
import HoverableTooltipWrapper from "@/app/components/atoms/HoverableTooltipWrapper";
import { websocketConnection } from "@/singletons/websocket-connection";
import HostGameForm from "./HostGameForm";
import HotkeyButton from "@/app/components/atoms/HotkeyButton";
import RefreshIcon from "../../../../public/img/menu-icons/refresh.svg";
import { observer } from "mobx-react-lite";
import { AppStore } from "@/mobx-stores/app-store";
import { DialogElementName } from "@/mobx-stores/dialogs";

export const GamesSection = observer(() => {
  const [gameListRefreshedAt, setGameListRefreshedAt] = useState("...");
  const gameList = useLobbyStore().gameList;
  const gameListRef = useRef(null);
  const gameListIsOverflowing = useElementIsOverflowing(gameListRef.current);
  const { dialogStore } = AppStore.get();
  const showGameCreationForm = dialogStore.isOpen(DialogElementName.GameCreation);
  const gameFormHolderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setGameListRefreshedAt(new Date(Date.now()).toLocaleTimeString());
  }, []);

  function refreshGameList() {
    websocketConnection.emit(ClientToServerEvent.RequestsGameList);
    setGameListRefreshedAt(new Date(Date.now()).toLocaleTimeString());
  }

  const handleClickOutside = (e: MouseEvent) => {
    if (gameFormHolderRef.current) {
      const menuRect = gameFormHolderRef.current.getBoundingClientRect();
      const { x, y, width, height } = menuRect;
      const maxX = x + width;
      const maxY = y + height;
      if (e.x < x || e.x > maxX || e.y > maxY || e.y < y) {
        dialogStore.close(DialogElementName.GameCreation);
      }
    }
  };

  useEffect(() => {
    window.addEventListener("click", handleClickOutside);
    return () => {
      window.removeEventListener("click", handleClickOutside);
    };
  }, []);

  return (
    <div
      id="games-section"
      className="w-full h-full flex flex-wrap flex-col-reverse justify-end laptop:flex-row"
      style={{
        padding: `${SPACING_REM_LARGE}rem`,
        // width: `calc(${BASE_SCREEN_SIZE}px * ${Math.pow(GOLDEN_RATIO, 2)})`,
        width: "900px",
        maxWidth: "100%",
        zIndex: 100,
      }}
    >
      <div
        id="current-games-container"
        className="pointer-events-auto h-fit w-full laptop:w-6/12 laptop:pr-2"
      >
        <div className="mb-2">Last refreshed at {gameListRefreshedAt}</div>
        <div
          className="text-lg h-10 flex items-center justify-between border border-slate-400 bg-slate-700 mb-2"
          style={{
            paddingLeft: `${SPACING_REM_SMALL}rem`,
          }}
        >
          <div>{gameList.length ? "Current games" : "No current games..."}</div>
          <HotkeyButton
            hotkeys={["KeyR"]}
            className="border-l border-slate-400 p-2 h-full"
            onClick={refreshGameList}
          >
            <RefreshIcon className="h-full w-10 fill-zinc-300" />
          </HotkeyButton>
        </div>
        {<Divider />}
        <ul
          className="mb-1 max-h-72 overflow-y-auto"
          ref={gameListRef}
          style={{
            paddingRight: gameListIsOverflowing ? `${SPACING_REM_SMALL}rem` : "",
          }}
        >
          {
            // testGames
          }
          {gameList.map((game) => (
            <GameListItem game={game} key={game.gameName} />
          ))}
        </ul>
      </div>
      <div
        className="pointer-events-auto h-fit w-full laptop:w-6/12 laptop:pl-2 relative"
        id="game-form-holder"
        ref={gameFormHolderRef}
      >
        <div className="mb-2">
          Host a custom game{" "}
          <HoverableTooltipWrapper
            extraStyles="inline"
            tooltipText="Choose from Race or Progression mode and enter the dungeon in a single or multiplayer game (A)"
          >
            ⓘ{" "}
          </HoverableTooltipWrapper>
        </div>
        <div
          className={`bg-slate-700 w-full h-10 border border-slate-400 flex justify-between items-center pointer-events-auto`}
        >
          <HotkeyButton
            hotkeys={["KeyA"]}
            className="w-full h-full"
            onClick={() => {
              dialogStore.toggle(DialogElementName.GameCreation);
              dialogStore.close(DialogElementName.Credentials);
            }}
          >
            HOST GAME {showGameCreationForm}
          </HotkeyButton>
          {showGameCreationForm && (
            <HotkeyButton
              className="p-2 h-10 w-10 border-l border-slate-400 cursor-pointer pointer-events-none absolute right-0"
              hotkeys={["Escape"]}
              onClick={() => {
                dialogStore.close(DialogElementName.GameCreation);
              }}
              ariaLabel="close game form"
            >
              <XShape className="h-full w-full fill-zinc-300" />
            </HotkeyButton>
          )}
        </div>
        {showGameCreationForm && <HostGameForm />}
      </div>
    </div>
  );
});

interface GameListItemProps {
  game: GameListEntry;
}

function GameListItem({ game }: GameListItemProps) {
  function joinGame() {
    websocketConnection.emit(ClientToServerEvent.JoinGame, game.gameName);
  }

  return (
    <li className="w-full flex items-center border border-slate-400 mb-2 pointer-events-auto bg-slate-700">
      <div
        className={`flex-1 overflow-hidden whitespace-nowrap overflow-ellipsis`}
        style={{
          paddingLeft: `${SPACING_REM_SMALL}rem`,
        }}
      >
        {game.gameName} - [{game.isRanked && "Ranked "}
        {formatGameMode(game.gameMode)}]
      </div>
      <div className="h-10 w-32 flex items-center border-r border-l border-slate-400 pl-4 pr-4">
        <div className="overflow-hidden whitespace-nowrap overflow-ellipsis">
          {game.numberOfUsers}
          {game.gameMode === GameMode.Progression && `/${MAX_PARTY_SIZE}`}
          {" player"}
          {game.numberOfUsers > 1 ||
          game.numberOfUsers === 0 ||
          game.gameMode === GameMode.Progression
            ? "s"
            : ""}
        </div>
      </div>
      <ButtonBasic
        onClick={joinGame}
        disabled={typeof game.timeStarted === "number"}
        extraStyles="border-0"
      >
        {"Join"}
      </ButtonBasic>
    </li>
  );
}
