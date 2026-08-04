import { UiProvider } from "@speed-dungeon/ui/ui-context";
import ButtonBasic from "@speed-dungeon/ui/atoms/ButtonBasic";
import Divider from "@speed-dungeon/ui/atoms/Divider";
import HoverableTooltipWrapper from "@speed-dungeon/ui/atoms/HoverableTooltipWrapper";
import { ZIndexLayers } from "./z-index-layers";

const UI_LAYERS = { dropdown: ZIndexLayers.Dropdown, tooltip: ZIndexLayers.Tooltip };

export function App() {
  return (
    <UiProvider layers={UI_LAYERS}>
      <main className="min-h-screen bg-theme-recessed text-theme-emphasis p-8">
        <h1 className="text-2xl mb-2">Speed Dungeon Balance</h1>
        <Divider />
        <div className="bg-theme-base border border-theme-muted p-4 w-fit">
          <HoverableTooltipWrapper tooltipText="the shared ui package is wired up">
            <ButtonBasic>Hover me</ButtonBasic>
          </HoverableTooltipWrapper>
        </div>
      </main>
    </UiProvider>
  );
}
