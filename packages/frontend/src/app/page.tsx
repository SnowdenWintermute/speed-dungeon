// @refresh reset
"use client";
import { AlertManager } from "./components/alerts/AlertManager";
import TailwindClassLoader from "./TailwindClassLoader";
import GlobalKeyboardEventManager from "./GlobalKeyboardEventManager";
import { TooltipManager } from "./TooltipManager";
import { SkyColorProvider } from "./SkyColorProvider";
import { observer } from "mobx-react-lite";
import { SceneManager } from "./game-world-view-canvas/SceneManager";
import { AssetManager } from "./asset-manager";
import { MainAppWindow } from "./MainAppWindow";

export default observer(() => {
  return (
    <>
      <AssetManager />
      <TailwindClassLoader />
      <AlertManager />
      <GlobalKeyboardEventManager />
      <TooltipManager />
      <SceneManager />
      <SkyColorProvider>
        <MainAppWindow />
      </SkyColorProvider>
    </>
  );
});
