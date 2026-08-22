import { UiProvider } from "@speed-dungeon/ui/ui-context";
import { HotkeyButton } from "@speed-dungeon/ui/atoms/HotkeyButton";
import { ZIndexLayers } from "./z-index-layers";
import { testAnalysisRun } from "./tests/test-analysis-run";

const UI_LAYERS = { dropdown: ZIndexLayers.Dropdown, tooltip: ZIndexLayers.Tooltip };

export function App() {
  return (
    <UiProvider layers={UI_LAYERS}>
      <main className="min-h-screen bg-theme-recessed text-theme-emphasis p-8">
        <h1 className="text-2xl mb-2">Speed Dungeon Balance</h1>
        <HotkeyButton
          onClick={() => {
            testAnalysisRun();
          }}
        >
          test
        </HotkeyButton>
      </main>
    </UiProvider>
  );
}
