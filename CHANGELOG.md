# Changelog

## 0.4.6

- Fixed: turning No fuel use off in the middle of a cook burned, in one go, all the fuel the cook would have used while it was on. The stove now just carries on from there.
- Made for Survival Log 1.1.21671.

## 0.4.5

- The message the menu's log shows when it starts is in Chinese too.
- The Game index tab names the right game version, 1.1.21671.
- Fixed: after loading a different save, the menu kept the first save's backup. It now makes a new backup for each save at its first cheat, and Load backup only loads the backup of the save you are in.
- Fixed: Peaceful stopped furniture wearing out in the next save you loaded, even though it showed as off.
- Fixed: a presets file with a typo in it could stop the menu from opening. The menu now opens with no presets instead.

## 0.4.4

- The item spawner has the five new items from Survival Log 1.1.21671, like Two Boat Tickets and the Dock Queue Tag.
- Fixed: wallpaper and flooring showed no picture in the item spawner, because the game changed those picture files.
- The pickers use the game's new names, like Back-Alley Hideout, and list the Trash Can.
- Made for Survival Log 1.1.21671.

## 0.4.3

- Clearer wording in the menu and its messages.
- The top of the menu no longer shows an old version number.
- Made for Survival Log 1.1.20719.

## 0.4.2

- Fixed: the item spawner's search found only about one item in nine. The menu had a short list of items. It now has all 3,894 in the game. Search words can come in any order, in English or Chinese, and an exact name or id comes first.
- Long lists in the spawner fill in as you scroll, so the Food tab and big searches open quickly.
- The spawner has two more tabs, Electronics and Boxes, and Packages is now called Furniture.
- Enter in the spawner's search box picks the best match, and Enter in its count box spawns. Enter in any other number box does what the button next to it does.
- Fixed: the spawner said a full bag drops the rest on the floor. The game stops adding when the bag is full.
- Made for Survival Log 1.1.20719.

## 0.4.1

- Now uses Exiled's Toolkit for its shared parts, so it needs Exiled's Toolkit 0.19.0 or newer.
- Made for Survival Log 1.1.20719.

## 0.4.0

- New: "Finish an event" on the Story & Events tab plays a running event to its end with the game's auto-play, its choice and result included. Leave the event empty to finish every running event. Other events wait until it is done, and a message says when it has finished. An event that waits for days to pass cannot finish this way, and after 30 seconds the message says so.
- "Force an event" is now called "Start an event".
- Made for Survival Log 1.1.20151.

## 0.3.3

- Fixed: keys typed in the menu's search and number boxes also reached the game, so WASD moved the camera and P took a photo. While a box has the keyboard, the game's keys and the camera keys now stay off. Click the world to leave the box.
- The menu key does nothing while you type in another mod's text box.
- Exiled's Toolkit 0.12.0 or newer is now required.
- Made for Survival Log 1.1.20151.

## 0.3.2

- Fixed: after closing the loop reward screen opened mid-run, the game stayed paused.
- On the loop reward screen opened mid-run, the button that starts the next loop is now called Close, since all it does there is close the screen.
- Made for Survival Log 1.1.20151.

## 0.3.1

- Exiled's Toolkit 0.11.0 or newer is now required.
- Made for Survival Log 1.1.19611.

## 0.3.0

- New: `UiScale` under Interface sets the size of Cheat Menu's windows, from 75% to 200%, no matter what Exiled's Toolkit's UI size is. At 0, the default, they use the Toolkit's size. Needs Exiled's Toolkit 0.11.0 or newer.
- Made for Survival Log 1.1.19611.

## 0.2.11

- The menu is much faster. A tab you have opened before shows at once, the All, Game's and Added by mod buttons no longer redraw the tab, and long tabs only draw the part you can see.
- Fixed: on rows with several fields, the button showed as an empty amber bar across the row.
- Fixed: a dropdown showed its old choice for a moment before it changed. Dropdowns open and change at once now, and work with the arrow keys and Enter.
- Opening a tab no longer reads lists from your game. A list is read the first time you open its box, so tabs open without a pause.
- The Mod tests tab opens without a pause. The menu reads which mods add test cheats while the game loads.
- Fixed: the action list in "Dispatch a UI action" stayed empty.

## 0.2.10

- Fixed: rows with long names, like "Activate daily plan", were squeezed to one word per line, and some buttons were cut off. A row with several fields now puts them on their own line under the row's name.
- Every field that asked for an id is now a list of names. Long lists are searchable: type part of a name, in English or Chinese, or an id.
- The shop rows in Money & Trade list the shops on this map by name, then what the shop you picked sells. "Buy one item" lists only item shops and "Buy one piece of furniture" lists only furniture shops.
- "Install furniture in a slot" lists furniture by name, then only the home slots that piece fits. "Clear a slot" lists only slots that have something in them.
- Robots, people, trade points, containers, scenes, rooms, seeds, charging docks, vehicles, tower slots, endings, texts, group chat posts, events and attributes are picked by name now.
- "Add furniture to the bag", "Spawn a scene rat", "Force a pool wish", "Meet an NPC", "Deliver a text" and "Force an event" now have a list to pick from.
- "Send an NPC somewhere" can send them to a floor of the home or the Tech Company.
- Lists read from your game have a reload button that reads the list again.
- The menu responds faster: turning a switch on or off updates only that row, and long lists draw their first 60 entries and the rest as you scroll.

## 0.2.9

- Fixed: setting "Set a loop reward level" to the level a reward already had said "already level" and did nothing, so a reward set with 0.2.5 still had no effect. Now it adds the missing effect, for free.

## 0.2.8

- New Mod tests tab: test buttons that other mods add, grouped by mod, to check their features quickly. Loot Restock, for one, adds buttons to restock the location you are in right away or make its restock due today.

## 0.2.7

- New in the Survivor tab: "Open the loop reward screen" opens the screen where you buy loop rewards, in the middle of a run. What you buy works right away, and the run goes on when you close the screen.
- Picking a buff, talent or daily plan now shows the game's description of it under the row, with what each talent level gives.
- The buff lists say whether each buff is good or bad, the talent list shows each talent's top level, and the crisis list shows each crisis by name with how many days it lasts.
- Force game over lists the endings by name instead of "Ending line 1" to "Ending line 9".
- The lists of your own pots, furniture, events and buffs show names instead of numbers. Pots also show whether the plant is growing, ripe or withered.
- The proficiency list uses the game's names: Crafting, Planting, Cooking, Traps, Exploration and Defense.
- More rows say what they do, such as the max stats, stat drain, move speed, shop discount and Start a crisis.

## 0.2.6

- Fixed: "Set a loop reward level" now gives the reward's effect right away. Before, it set the level but the reward did nothing until the next run. If you set one with 0.2.5, set it again to make it work.

## 0.2.5

- New in the Survivor tab: "Set a loop reward level" gives you any loop reward at any level mid-run, New Loop Plus rewards included. Level 0 removes it, and it can charge or refund the Planning Points.

## 0.2.4

- "Faith points" are now called Planning Points, as the game calls them.

## 0.2.3

- You can type in the search boxes, filters and command line, Chinese input included.

## 0.2.2

- The menu follows the UI size setting of Exiled's Toolkit 0.10.0 or newer. A change shows at once, and a bigger menu still fits the game's window.

## 0.2.1

- The menu is much faster: buttons and lists respond right away.
- One language at a time: the menu starts in the game's language, and the EN / 中文 button at the top right switches between English and Chinese.
- Zombie and wave pickers show names instead of numbers.
- Never spoil: nothing rots and food stays as fresh as it is while it is on. Make all food fresh puts every food item back to new.
- Unlock every recipe and blueprint, on the Unlocks tab.
- Skip to a time of day: morning, noon, evening or night.
- Repair all furniture at home.
- Container contents preview lists what every container holds without opening it. Mark containers unsearched brings back the unsearched marker (it does not refill them).
- Debug tab: Show hovered id, Mod health (every plugin with its version and the errors it logged), Fill every trap, Bring the basket back, and Test toast.
- The console remembers what you typed: the up and down arrows go through it, and `history` lists it.
- Long replies in the log keep their line breaks.

## 0.2.0

- Every row now works: commands that needed fields to be typed have their own lists, number boxes and pickers, and the rest of a command's fields are under "More fields".
- New cheats added by the mod: God mode, Infinite power, Peaceful mode, Freeze the clock, No fuel use, Instant crafting, cooking and brewing, Free build, Mature one pot or every plant, Water and fertilize all, Force a pot anomaly, Ally with everyone or one contact, Add exposure, Step, pick a choice, end or reset the current event, Clear loan shark debt, Clear every debuff, Remove one buff, and a companion and rescue snapshot.
- Survivor rows set max stats, drain rates, move and interact speed, shop discount, loan cap and instant travel, and can be undone.
- Lists of your own pots, furniture, events, buffs, saves and backups, read from the game, with Reload and a filter for long lists.
- New "Back up before every risky cheat" switch on the Saves tab, on by default: red rows back up the save first and don't run if the backup fails.
- The menu uses the game's Chinese font.

## 0.1.0

- First release.
- Every cheat and developer tool built into the game, in a menu with tabs that opens with F3.
- Stats, item spawner, weather, maps, the game's switches, and every GM command with its fields.
- Changes tab with undo, presets, and a backup of your save made before your first cheat.
- Made for Survival Log 1.1.19611.
