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
- **Cheats the mod adds**: God mode, Infinite power, Peaceful mode, Freeze the clock, No fuel use, Instant crafting, cooking and brewing, Free build, Mature one pot or every plant, Water and fertilize all, Force a pot anomaly, Ally with everyone or one contact, Add exposure, step, pick a choice, end or reset the current event, Clear loan shark debt, Clear every debuff, Remove one buff. They use the game's own code to do it, and are marked **ADDED BY MOD**.
- **Survivor values**: max stats, how fast each stat drains, move and interact speed, shop discount, loan cap and instant travel.
- **The game's own switches**: skip cutscenes and the daily summary, lock door and window durability, lock explore exposure, revive on door break, debug overlays and more.
- **Every game command**: every row has its own lists and number boxes, with pickers for your own pots, furniture, events, buffs, saves and backups (**Reload** reads them again, long lists have a filter). The rest of a command's fields are under **More fields**. The **Game index** tab runs any of the game's 167 GM commands with its fields.
- **Console**: type a command and its fields (`AddItem ItemConfigId=1203 Count=20`), a whole message (`{"msgHead":52,"Scale":4}`), `tab NAME`, or `help`.
- **Changes**: every change you make, newest first, with what it was before. Switches, the mod's cheats that stay on, survivor values and the weather can be undone. **Restore settings** puts every switch back the way it was when you first opened the menu.
- **Presets**: save the current switches as a named preset and apply it again later. **Default (no cheats)** goes back to the start.
- **Backup before cheating**: your first cheat in a session waits while the menu backs up your save with the game's own backup (named `BeforeCheating_<date>_<time>`). **Load backup** on the Changes tab loads it, undoing everything, items and skipped days too.
- **Back up before every risky cheat**: a switch on the Saves tab, on by default. Red rows (game over, deleting saves, zombie waves and the like) back up your save first, named `BeforeRisky_<date>_<time>`, and don't run if the backup fails. Turn it off to run them without a backup.
- **Game log**: the right column shows the game's own replies and each thing you did. Everything is also written to `BepInEx\cheat-menu.log`.

Each row is marked with where it comes from: **GAME** (the game's own tool), **ADDED BY MOD** (a tool this mod adds), **EDITOR** and **NOT WIRED** (built into the game but doing nothing in the release game, shown greyed). Each tab can be filtered to the game's own tools or the mod's.

## Known issues

- Rows marked **EDITOR** or **NOT WIRED** are greyed and can't be pressed: the release game ignores them.
- The mod's cheats that stay on (God mode, Freeze the clock and the rest) start off every time the game starts.
- Instant crafting finishes shredders, compressors, brewers, dye vats, stoves and drone trips, not workbench crafting.
- Undo covers switches, the mod's cheats that stay on, survivor values and the weather. One-time actions (items, stats, skipped days, kills) can only be undone by loading the backup.
- Loading the backup loses everything since your first cheat, not only the cheats.
- Some tools need to be at home, on an expedition, or in a certain story step; the game refuses them otherwise and the log says so.

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
