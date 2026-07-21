#!/bin/bash

alacritty -e bash -c "cd ~/projects/speed-dungeon/packages/server && docker compose up; exec bash" & 
alacritty -e bash -c "cd ~/projects/snowauth && docker compose up; exec bash"  &

alacritty -e bash -c "cd ~/projects/speed-dungeon/packages/server && yarn build:watch; exec bash"  &
alacritty -e bash -c "cd ~/projects/speed-dungeon/packages/server && yarn serve:lobby; exec bash"  &
alacritty -e bash -c "cd ~/projects/speed-dungeon/packages/server && yarn serve:game-server; exec bash"  &
alacritty -e bash -c "cd ~/projects/speed-dungeon/packages/server && yarn serve:asset-server; exec bash"  &
alacritty -e bash -c "cd ~/projects/speed-dungeon/packages/frontend && yarn dev; exec bash"  &
alacritty -e bash -c "cd ~/projects/speed-dungeon/packages/frontend && npx tsc --noEmit --watch; exec bash"  &
alacritty -e bash -c "cd ~/projects/snowauth && yarn serve; exec bash"  &

