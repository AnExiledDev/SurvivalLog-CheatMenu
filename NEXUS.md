Name: Cheat Menu
Summary: Every cheat and developer tool built into Survival Log, in one tabbed menu on F3: set stats, spawn any item, change weather and game speed, jump to any map, skip days and cutscenes, lock durability and more. Every change is listed with undo, presets save test setups, and your save is backed up before the first cheat. Note: the game reports cheat use.

Description (BBCode):
Survival Log ships with a GM panel its developer uses for testing, but players can't reach it. Cheat Menu opens all of those tools in one menu, for cheating or for testing your own mods and saves.

[size=5]The game reports cheat use[/size]
[b]Survival Log reports cheating to its developer.[/b] The game has its own cheat detection, which sends a "cheat evidence" event to the game's analytics and tags its crash reports. GM messages sent to the game's GM handler, which is how this menu works, count as cheat evidence. Cheat Menu does not block, hide or change that reporting. If you don't want your sessions reported as cheated, don't use this mod. Nothing found so far blocks saves or achievements because of it.

[size=5]Main features[/size]
[list]
[*][b]16 tabs[/b]: Quick, Survivor, Items, Money & Trade, Time & Weather, Home & Build, Farm & Robots, Danger, Explore, People, Story & Events, Unlocks, Saves and Debug, plus Changes and Game index.[/*]
[*][b]Search[/b]: find any tool on any tab by English or Chinese words.[/*]
[*][b]Stats[/b]: drag a bar to set Satiety, Morale, Stamina, Health or Vitality, and lock them with the game's own stat lock.[/*]
[*][b]Item spawner[/b]: pick an item by picture, search by name or id, or type any item id.[/*]
[*][b]Weather and maps[/b]: set any weather or go back to the forecast; enter any explore map at once.[/*]
[*][b]The game's own switches[/b]: skip cutscenes and the daily summary, lock door and window durability, lock explore exposure, debug overlays and more.[/*]
[*][b]Every game command[/b]: the Game index tab runs any of the game's 167 GM commands with its fields, and a console takes typed commands.[/*]
[*][b]Changes and undo[/b]: every change is listed with what it was before. Switches and the weather can be undone, and Restore settings puts them all back.[/*]
[*][b]Presets[/b]: save a set of switches for a test, apply it again later, and go back to Default.[/*]
[*][b]Backup before cheating[/b]: your first cheat in a session waits while the menu backs up your save with the game's own backup. Load backup undoes everything since.[/*]
[*][b]Clearly marked[/b]: every row says whether it is the game's own tool, a tool this mod adds, or one that does nothing in the release game.[/*]
[/list]

[size=5]Hotkeys[/size]
[list]
[*][b]F3[/b]: open or close the menu.[/*]
[*][b]Esc[/b]: close the menu.[/*]
[*][b]Ctrl+K[/b]: search.[/*]
[*][b]1-0[/b]: jump to the first ten tabs.[/*]
[/list]
F3 can be changed or turned off in the config. The game's own hotkeys are off while the menu is open.

Works in English and Chinese.

[size=5]Known issues[/size]
[list]
[*]Rows marked NOT BUILT YET are tools this mod will add later; they do nothing yet.[/*]
[*]Rows marked NOT REACHABLE YET use game code the GM handler doesn't call, so the menu can't run them yet.[/*]
[*]Many rows show the game command's fields instead of a single slider or list, for now.[/*]
[*]Undo covers switches and the weather. One-time actions (items, stats, skipped days) can only be undone by loading the backup, which loses everything since your first cheat.[/*]
[*]Some tools only work at home, on an expedition, or at a certain story step; the game refuses them otherwise and the menu's log says so.[/*]
[/list]

[size=5]Requirements[/size]
[list]
[*]Survival Log 1.1.19611. A game update can break it until the mod is updated.[/*]
[*][url=https://www.nexusmods.com/survivallog/mods/12]BepInEx for Survival Log[/url]. Install it first.[/*]
[*]Optional: [url=https://www.nexusmods.com/survivallog/mods/61]Exiled's Toolkit[/url] 0.4.0 or newer. With it, a new menu key set on the Mod Manager's Mods screen works without restarting the game.[/*]
[/list]

[size=5]Installation[/size]
[list=1]
[*]Install [url=https://www.nexusmods.com/survivallog/mods/12]BepInEx[/url] [i](if no other mods were installed before, start the game once so BepInEx finishes setup, then quit)[/i].[/*]
[*]Download the zip from the Files tab.[/*]
[*]Extract it into the game folder (the folder with [font=Courier New]SurvivalLog.exe[/font]). When asked, merge the folders. The result should be:
[code]C:\Program Files (x86)\Steam\steamapps\common\Survival Log\BepInEx\plugins\CheatMenu.dll[/code][/*]
[/list]

[size=5]Uninstall[/size]
Delete [font=Courier New]CheatMenu.dll[/font] from the [font=Courier New]BepInEx\plugins[/font] folder. Anything you changed with the menu stays changed in your save.

[size=5]Configuration[/size]
To change the key, edit [font=Courier New]BepInEx\config\com.dev.survivallog.cheatmenu.cfg[/font] while the game is closed, or do it in game on the Mod Manager's Mods screen (see [url=https://github.com/AnExiledDev/SurvivalLog-CheatMenu/blob/main/CONFIG.md]CONFIG.md[/url]). Presets are kept in [font=Courier New]BepInEx\config\CheatMenu\presets.json[/font].

[size=5]Feedback[/size]
Found a bug or have an idea? Come say hi on the [url=https://discord.gg/trTsyxUFqg]Core Directive Discord[/url], or post in this page's Posts tab. For bugs, please include [font=Courier New]BepInEx\LogOutput.log[/font] and [font=Courier New]BepInEx\cheat-menu.log[/font].
To reach me directly, message [b]exiled.dev[/b] on Discord; you can find me in the [url=https://discord.gg/MZGg4gQAUe]official Survival Log Discord[/url]. I'm also on X as [url=https://x.com/AnExiledDev]@AnExiledDev[/url].
Check out my [url=https://sldb.core-directive.com/en/]Survival Log wiki[/url] for items, crafting, maps and more.

[size=5]Source and license[/size]
Open source under MIT: [url=https://github.com/AnExiledDev/SurvivalLog-CheatMenu]github.com/AnExiledDev/SurvivalLog-CheatMenu[/url]

[line]
[size=5]简体中文[/size]

《Survival Log》自带一个开发者用来测试的 GM 面板，但玩家无法打开。Cheat Menu 把这些工具全部放进一个菜单里，可以用来作弊，也可以用来测试你自己的模组和存档。

[size=5]游戏会上报作弊行为[/size]
[b]《Survival Log》会向开发者上报作弊行为。[/b]游戏自带作弊检测，会向游戏的数据统计发送「作弊证据」事件，并在崩溃报告中做标记。发给游戏 GM 处理器的 GM 消息（本菜单正是这样工作的）会被算作作弊证据。Cheat Menu 不会阻止、隐藏或修改这种上报。如果你不希望自己的游戏被标记为作弊，请不要使用本模组。目前没有发现它会因此阻止存档或成就。

[size=5]主要功能[/size]
[list]
[*][b]16 个标签页[/b]：快捷、幸存者、物品、金钱与交易、时间与天气、家园与建造、农场与机器人、危险、探索、人物、剧情与事件、解锁、存档、调试，另有「变更」和「游戏目录」。[/*]
[*][b]搜索[/b]：用中文或英文在所有标签页中查找任何工具。[/*]
[*][b]属性[/b]：拖动条来设置饱食、心情、体力、生命或活力，并用游戏自带的属性锁定把它们锁住。[/*]
[*][b]物品生成[/b]：按图片选物品，按名称或 id 搜索，或直接输入任意物品 id。[/*]
[*][b]天气与地图[/b]：设置任意天气或恢复天气预报；直接进入任意探索地图。[/*]
[*][b]游戏自带的开关[/b]：跳过过场和每日结算、锁定门窗耐久、锁定探索暴露度、调试显示等等。[/*]
[*][b]所有游戏命令[/b]：「游戏目录」标签页可以填写字段运行游戏全部 167 条 GM 命令，控制台也可以输入命令。[/*]
[*][b]变更与撤销[/b]：每次改动都会列出改动前的值。开关和天气可以撤销，「恢复设置」会把它们全部恢复。[/*]
[*][b]预设[/b]：把一组开关保存下来用于测试，之后再次应用，也可以回到「默认」。[/*]
[*][b]作弊前备份[/b]：每次游戏中的第一次作弊会先等菜单用游戏自带的备份功能备份你的存档。「载入备份」会撤销此后的一切。[/*]
[*][b]标注清楚[/b]：每一行都标明它是游戏自带的工具、本模组添加的工具，还是在正式版游戏中不起作用的工具。[/*]
[/list]

[size=5]快捷键[/size]
[list]
[*][b]F3[/b]：打开或关闭菜单。[/*]
[*][b]Esc[/b]：关闭菜单。[/*]
[*][b]Ctrl+K[/b]：搜索。[/*]
[*][b]1-0[/b]：跳到前十个标签页。[/*]
[/list]
F3 可以在配置中修改或停用。菜单打开时游戏自己的快捷键不起作用。

支持英文和中文。

[size=5]已知问题[/size]
[list]
[*]标为「NOT BUILT YET」的行是本模组以后会添加的工具，目前还不起作用。[/*]
[*]标为「NOT REACHABLE YET」的行用到的游戏代码 GM 处理器不会调用，所以菜单暂时无法运行它们。[/*]
[*]目前很多行显示的是游戏命令的字段，而不是单个滑块或列表。[/*]
[*]撤销只针对开关和天气。一次性的操作（物品、属性、跳过的天数）只能通过载入备份来撤销，而载入备份会丢失第一次作弊之后的所有进度。[/*]
[*]有些工具只能在家中、探索中或特定剧情阶段使用；其他时候游戏会拒绝，菜单的日志会说明原因。[/*]
[/list]

[size=5]前置要求[/size]
[list]
[*]《Survival Log》1.1.19611。游戏更新后，在模组更新前可能无法使用。[/*]
[*][url=https://www.nexusmods.com/survivallog/mods/12]BepInEx for Survival Log[/url]。请先安装它。[/*]
[*]可选：[url=https://www.nexusmods.com/survivallog/mods/61]Exiled's Toolkit[/url] 0.4.0 或更新版本。装了它，在 Mod Manager 的「模组」界面设置的新按键不用重启游戏就能生效。[/*]
[/list]

[size=5]安装[/size]
[list=1]
[*]安装 [url=https://www.nexusmods.com/survivallog/mods/12]BepInEx[/url]（如果之前没装过其他模组，先启动一次游戏让 BepInEx 完成初始化，然后退出）。[/*]
[*]在「Files」标签页下载压缩包。[/*]
[*]解压到游戏文件夹（有 [font=Courier New]SurvivalLog.exe[/font] 的文件夹）。提示时选择合并文件夹。结果应为：
[code]C:\Program Files (x86)\Steam\steamapps\common\Survival Log\BepInEx\plugins\CheatMenu.dll[/code][/*]
[/list]

[size=5]卸载[/size]
删除 [font=Courier New]BepInEx\plugins[/font] 文件夹中的 [font=Courier New]CheatMenu.dll[/font]。用菜单做过的改动会保留在你的存档中。

[size=5]配置[/size]
如需修改按键，可以在游戏关闭时编辑 [font=Courier New]BepInEx\config\com.dev.survivallog.cheatmenu.cfg[/font]，也可以在游戏内 Mod Manager 的「模组」界面修改（完整说明见 [url=https://github.com/AnExiledDev/SurvivalLog-CheatMenu/blob/main/CONFIG.md]CONFIG.md[/url]，英文）。预设保存在 [font=Courier New]BepInEx\config\CheatMenu\presets.json[/font]。

[size=5]反馈[/size]
发现问题或有想法？欢迎来 [url=https://discord.gg/trTsyxUFqg]Core Directive Discord[/url]，或在本页的「Posts」标签页留言。报告问题时请附上 [font=Courier New]BepInEx\LogOutput.log[/font] 和 [font=Courier New]BepInEx\cheat-menu.log[/font]。
想直接联系我，可以在 Discord 上私信 [b]exiled.dev[/b]；我在 [url=https://discord.gg/MZGg4gQAUe]Survival Log 官方 Discord[/url] 里。我在 X 上是 [url=https://x.com/AnExiledDev]@AnExiledDev[/url]。
欢迎看看我的 [url=https://sldb.core-directive.com/zh/]Survival Log 维基[/url]，里面有物品、制作、地图等资料。

[size=5]源代码与许可[/size]
MIT 开源：[url=https://github.com/AnExiledDev/SurvivalLog-CheatMenu]github.com/AnExiledDev/SurvivalLog-CheatMenu[/url]
