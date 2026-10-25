# Cheat Menu

Every cheat and developer tool built into Survival Log, in one tabbed menu.

Survival Log ships with a GM panel its developer uses for testing, but players can't reach it. Cheat Menu opens those tools on `F3`: set your stats, spawn items, change the weather and game speed, go straight to any map, skip days and cutscenes, lock durability, and a lot more. Everything you change is listed so you can undo it, presets save a test setup to apply again later, and before your first cheat the menu backs up your save so you can go back.

## The game reports cheat use

**Survival Log reports cheating to its developer.** The game has its own cheat detection, which sends a "cheat evidence" event to the game's analytics and tags its crash reports. GM messages sent to the game's GM handler, which is how this menu works, count as cheat evidence. Cheat Menu does not block, hide or change that reporting. If you don't want your sessions reported as cheated, don't use this mod. Nothing found so far blocks saves or achievements because of it.

## Features

- **Menu key**: `F3` opens and closes the menu. `Esc` or the close button also closes it. The game's own hotkeys are off while it is open.
- **16 tabs**: Quick, Survivor, Items, Money & Trade, Time & Weather, Home & Build, Farm & Robots, Danger, Explore, People, Story & Events, Unlocks, Saves and Debug, plus **Changes** and **Game index**. Number keys `1`-`0` jump to the first ten tabs.
- **Search**: `Ctrl+K` or the search box finds any tool on any tab, by English or Chinese words or by the game's command name.
- **Stats**: drag a bar to set Satiety, Morale, Stamina, Health or Vitality, and lock them where they are with the game's own stat lock.
- **Item spawner**: pick an item by picture, search by name, Chinese name or id, or type any item id. Items go to your bag.
- **Weather and maps**: set any weather or go back to the forecast; enter any explore map at once.
- **The game's own switches**: skip cutscenes and the daily summary, lock door and window durability, lock explore exposure, revive on door break, debug overlays and more.
- **Every game command**: rows that need more than one value show the command's fields to fill in, and the **Game index** tab runs any of the game's 167 GM commands with its fields.
- **Console**: type a command and its fields (`AddItem ItemConfigId=1203 Count=20`), a whole message (`{"msgHead":52,"Scale":4}`), `tab NAME`, or `help`.
- **Changes**: every change you make, newest first, with what it was before. Switches and the weather can be undone. **Restore settings** puts every switch back the way it was when you first opened the menu.
- **Presets**: save the current switches as a named preset and apply it again later. **Default (no cheats)** goes back to the start.
- **Backup before cheating**: your first cheat in a session waits while the menu backs up your save with the game's own backup (named `BeforeCheating_<date>_<time>`). **Load backup** on the Changes tab loads it, undoing everything, items and skipped days too.
- **Game log**: the right column shows the game's own replies and each thing you did. Everything is also written to `BepInEx\cheat-menu.log`.

Each row is marked with where it comes from: **GAME** (the game's own tool), **ADDED BY MOD** (a tool this mod adds), **EDITOR** and **NOT WIRED** (built into the game but doing nothing in the release game, shown greyed). Each tab can be filtered to the game's own tools or the mod's.

## Known issues

- Rows marked **NOT BUILT YET** are tools this mod will add later; they do nothing yet.
- Rows marked **NOT REACHABLE YET** use game code the GM handler doesn't call, so the menu can't run them yet.
- Many rows show the game command's fields instead of a single slider or list, for now.
- Undo covers the switches and the weather. One-time actions (items, stats, skipped days, kills) can only be undone by loading the backup.
- Loading the backup loses everything since your first cheat, not only the cheats.
- Some tools need to be at home, on an expedition, or in a certain story step; the game refuses them otherwise and the log says so.
- The menu's own fonts aren't bundled, so it uses the game's fallback fonts.

## Requirements

- Survival Log 1.1.19611. A game update can break it until the mod is updated.
- [BepInEx for Survival Log](https://www.nexusmods.com/survivallog/mods/12).
- Optional: [Exiled's Toolkit](https://www.nexusmods.com/survivallog/mods/61) 0.4.0 or newer, so a new `PanelKey` set on the Mod Manager's Mods screen works without restarting.

## Install

Extract the zip into the game folder (the one with `SurvivalLog.exe`) and merge the folders, so the DLL ends up at `BepInEx\plugins\CheatMenu.dll`.

## Uninstall

Delete `BepInEx\plugins\CheatMenu.dll`. Anything you changed with the menu stays changed in your save; the game's switches go back to off the next time the game starts.

## Configuration

See [CONFIG.md](CONFIG.md). Presets are kept in `BepInEx\config\CheatMenu\presets.json`.

## License

MIT
