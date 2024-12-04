#!/bin/bash

alacritty -e bash -c "cd ~/projects/speed-dungeon/packages/server && docker compose up; exec bash" & 
alacritty -e bash -c "cd ~/projects/snowauth && docker compose up; exec bash"  &

alacritty -e bash -c "cd ~/projects/speed-dungeon/packages/server && yarn serve; exec bash"  &
alacritty -e bash -c "cd ~/projects/speed-dungeon/packages/client && yarn dev; exec bash"  &
alacritty -e bash -c "cd ~/projects/snowauth && yarn serve; exec bash"  &
