# Cheat Menu settings

Settings live in `BepInEx\config\com.dev.survivallog.cheatmenu.cfg`, created the first time the game starts with the mod. Change them in game on the Mod Manager's Mods screen, or edit the file while the game is closed. Without Exiled's Toolkit installed, changes made on the Mods screen take effect at the next game start. Delete the file to get the defaults back.

## Controls

| Setting | Default | What it does |
| --- | --- | --- |
| `PanelKey` | `F3` | Key that opens and closes the Cheat Menu. `None` turns the key off. |

The value is a Unity key name, for example `F3`, `F11`, `Insert` or `Keypad5`. `Esc` always closes the open menu and cannot be changed.

## Presets

Presets saved on the menu's Changes tab are kept in `BepInEx\config\CheatMenu\presets.json`, which the mod writes itself. Edit it only while the game is closed, or delete it to remove every preset.
