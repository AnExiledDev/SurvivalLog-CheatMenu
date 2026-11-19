# Cheat Menu

Every cheat and developer tool built into Survival Log, in one tabbed menu.

Survival Log ships with a GM panel its developer uses for testing, but players can't reach it. Cheat Menu opens those tools on `F3`: set your stats, spawn items, change the weather and game speed, go straight to any map, skip days and cutscenes, lock durability, and a lot more. Everything you change is listed, and most of it can be undone. Presets save a test setup to apply again later, and before your first cheat the menu backs up your save so you can go back.

## The game reports cheat use

**Survival Log reports cheating to its developer.** The game has cheat detection built in, which sends a "cheat evidence" event to the game's analytics and tags its crash reports. This menu works by sending the game's GM commands, and the game counts those as cheat evidence. Cheat Menu does not block, hide or change that reporting. If you don't want your sessions reported as cheated, don't use this mod. I haven't found anything that blocks saves or achievements because of it.

## Features

- **Menu key**: `F3` opens and closes the menu. `Esc` or the close button also closes it. The game's hotkeys are off while it is open.
- **Language**: the menu starts in the game's language. The `EN` / `中文` button at the top right switches between English and Chinese, and the menu remembers your choice until the game's language changes.
- **17 tabs**: Quick, Survivor, Items, Money & Trade, Time & Weather, Home & Build, Farm & Robots, Danger, Explore, People, Story & Events, Unlocks, Saves and Debug, plus **Changes**, **Mod tests** and **Game index**. Number keys `1`-`0` jump to the first ten tabs.
- **Search**: `Ctrl+K` or the search box finds any tool on any tab, by English or Chinese words or by the game's command name.
- **Stats**: drag a bar to set Satiety, Morale, Stamina, Health or Vitality, and lock them where they are with the game's stat lock.
- **Item spawner**: pick an item by picture, search by name, Chinese name or id, or type any item id. Items go to your bag.
- **Weather and maps**: set any weather or go back to the forecast, and enter any explore map at once.
- **Cheats the mod adds**: God mode, Infinite power, Peaceful mode, Freeze the clock, No fuel use, Instant crafting, cooking and brewing, Free build, Mature one pot or every plant, Water and fertilize all, Force a pot anomaly, Ally with everyone or one contact, Add exposure, finish any running event, step, pick a choice, end or reset the current event, Clear loan shark debt, Clear every debuff, Remove one buff, Set a loop reward level, Open the loop reward screen mid-run, Never spoil, Make all food fresh, Unlock every recipe and blueprint, Skip to a time of day, Repair all furniture, Container contents preview, Mark containers unsearched. They use the game's code to do it, and are marked **ADDED BY MOD**.
- **Survivor values**: max stats, how fast each stat drains, move and interact speed, shop discount, loan cap and instant travel.
- **The game's switches**: skip cutscenes and the daily summary, lock door and window durability, lock explore exposure, revive on door break, debug overlays and more.
- **Lists instead of ids**: every row has its own lists and number boxes. Anything the game knows by id is a list of names: your pots, furniture, events, buffs, robots and people, this map's shops and what they sell, containers, trade points, home slots, saves and backups. Long lists are searchable as you type, and the reload button reads a list from your game again. Picking a buff, talent or daily plan shows the game's description of it. The rest of a command's fields are under **More fields**. The **Game index** tab runs any of the game's 167 GM commands with its fields.
- **Console**: type a command and its fields (`AddItem ItemConfigId=1203 Count=20`), a whole message (`{"msgHead":52,"Scale":4}`), `tab NAME`, `history` or `help`. The up and down arrows bring back what you typed before.
- **Testing mods**: the Debug tab's Mod testing group shows the id of whatever the cursor is on, a Mod health page (every plugin with its version and the errors it logged this session), Fill every trap, Bring the basket back, and a Test toast (the game's short text, or a toast through Exiled's Toolkit).
- **Mod tests**: test buttons other mods add, grouped by mod, to check their features quickly. Loot Restock, for one, adds a button that restocks the location you are in right away. A mod adds them with a static class named `DevCheats`: each public static method that takes nothing and returns a string is one button, labeled by its `DisplayName` and explained by its `Description` (each written as English, a line break, then Chinese). What the method returns goes to the game log.
- **Changes**: every change you make, newest first, with what it was before. Switches, the mod's cheats that stay on, survivor values and the weather can be undone. **Restore settings** puts every switch back the way it was when you first opened the menu.
- **Presets**: save the current switches as a named preset and apply it again later. **Default (no cheats)** goes back to the start.
- **Backup before cheating**: your first cheat in a session waits while the menu backs up your save with the game's backup (named `BeforeCheating_<date>_<time>`). **Load backup** on the Changes tab loads it, undoing everything, items and skipped days too.
- **Back up before every risky cheat**: a switch on the Saves tab, on by default. Red rows (game over, deleting saves, zombie waves and the like) back up your save first, named `BeforeRisky_<date>_<time>`, and don't run if the backup fails. Turn it off to run them without a backup.
- **Game log**: the right column shows the game's replies and each thing you did. Everything is also written to `BepInEx\cheat-menu.log`.

Each row is marked with where it comes from: **GAME** (the game's tool), **ADDED BY MOD** (a tool this mod adds), **EDITOR** and **NOT WIRED** (built into the game but doing nothing in the release game, shown greyed). Each tab can be filtered to the game's tools or the mod's.

## Known issues

- Rows marked **EDITOR** or **NOT WIRED** are greyed and can't be pressed: the release game ignores them.
- The mod's cheats that stay on (God mode, Freeze the clock and the rest) start off every time the game starts.
- Instant crafting finishes shredders, compressors, brewers, dye vats, stoves and drone trips. It doesn't speed up workbench crafting.
- Mark containers unsearched only brings back the marker. What is inside was decided the first time the container was opened and stays the same.
- Undo covers switches, the mod's cheats that stay on, survivor values and the weather. One-time actions (items, stats, skipped days, kills) can only be undone by loading the backup.
- Loading the backup loses everything you did since your first cheat, including normal play.
- Some tools only work at home, on an expedition, or at a certain point in the story. Anywhere else the game refuses them, and the log says so.

## Requirements

- Survival Log 1.1.21671. A game update can break it until the mod is updated.
- [BepInEx for Survival Log](https://www.nexusmods.com/survivallog/mods/12).
- [Exiled's Toolkit](https://www.nexusmods.com/survivallog/mods/61) 0.19.0 or newer. Cheat Menu does not load without it. It keeps the game's keys off while you type in the menu's boxes, applies a new `PanelKey` set on the Mod Manager's Mods screen without a restart, and its UI size setting draws the menu bigger or smaller. Cheat Menu's `UiScale` under Interface sets a size for this mod alone. At 0, the default, it uses the Toolkit's size.
- Optional: [Mod Manager](https://www.nexusmods.com/survivallog/mods/73). With it, you can change every setting in game on its Mods screen and see what each one does, without opening the config file.

## Install

Install [Exiled's Toolkit](https://www.nexusmods.com/survivallog/mods/61) first. Then extract the zip into the game folder (the one with `SurvivalLog.exe`) and merge the folders, so the DLL ends up at `BepInEx\plugins\CheatMenu.dll`.

## Uninstall

Delete `BepInEx\plugins\CheatMenu.dll`. Anything you changed with the menu stays changed in your save. The game's switches go back to off the next time the game starts.

## Configuration

See [CONFIG.md](CONFIG.md). Presets are kept in `BepInEx\config\CheatMenu\presets.json`.

## Feedback and bug reports

Found a bug, have an idea, or something feels off? Come say hi in the [unofficial modding Discord for Survival Log](https://discord.gg/pDrQtqbZgb). When reporting a bug, attach `BepInEx\LogOutput.log`.

To reach me directly, message `exiled.dev` on Discord. You can find me in the [unofficial modding Discord](https://discord.gg/pDrQtqbZgb) and the [official Survival Log Discord](https://discord.gg/MZGg4gQAUe). I'm also on X as [@AnExiledDev](https://x.com/AnExiledDev).

## License

MIT
