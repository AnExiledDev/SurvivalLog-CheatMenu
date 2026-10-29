Name: Cheat Menu
Summary: Every cheat and developer tool built into Survival Log, in one menu on F3: set stats, spawn any item, change weather and game speed, jump to any map, skip days and cutscenes, lock durability and more. Every change is listed with undo, presets save test setups, and your save is backed up before the first cheat. Note: the game reports cheat use.

Description (BBCode):
Survival Log ships with a GM panel its developer uses for testing, but players can't reach it. Cheat Menu opens all of those tools in one menu, for cheating or for testing your own mods and saves.

[size=5]The game reports cheat use[/size]
[b]Survival Log reports cheating to its developer.[/b] The game has its own cheat detection, which sends a "cheat evidence" event to the game's analytics and tags its crash reports. GM messages sent to the game's GM handler, which is how this menu works, count as cheat evidence. Cheat Menu does not block, hide or change that reporting. If you don't want your sessions reported as cheated, don't use this mod. Nothing found so far blocks saves or achievements because of it.

[size=5]Main features[/size]
[list]
[*][b]17 tabs[/b]: Quick, Survivor, Items, Money & Trade, Time & Weather, Home & Build, Farm & Robots, Danger, Explore, People, Story & Events, Unlocks, Saves and Debug, plus Changes, Mod tests and Game index.[/*]
[*][b]Search[/b]: find any tool on any tab by English or Chinese words.[/*]
[*][b]Stats[/b]: drag a bar to set Satiety, Morale, Stamina, Health or Vitality, and lock them with the game's own stat lock.[/*]
[*][b]Item spawner[/b]: pick an item by picture, search by name or id, or type any item id.[/*]
[*][b]Weather and maps[/b]: set any weather or go back to the forecast; enter any explore map at once.[/*]
[*][b]Cheats the mod adds[/b]: God mode, Infinite power, Peaceful mode, Freeze the clock, No fuel use, Instant crafting, Free build, mature or tend plants, force a pot anomaly, ally with anyone, add exposure, step or end the current event, clear loan shark debt, clear debuffs, set any loop reward's level or buy loop rewards mid-run, never spoil, fresh food, unlock every recipe and blueprint, skip to morning or night, repair all furniture, preview container contents. They use the game's own code and are marked ADDED BY MOD.[/*]
[*][b]Survivor values[/b]: max stats, how fast each stat drains, move and interact speed, shop discount, loan cap and instant travel.[/*]
[*][b]The game's own switches[/b]: skip cutscenes and the daily summary, lock door and window durability, lock explore exposure, debug overlays and more.[/*]
[*][b]Every row works[/b]: lists and number boxes for every command. Anything the game knows by id is a searchable list of names: your pots, furniture, events, buffs, robots and people, this map's shops and what they sell, containers, trade points, home slots, saves and backups. Picking a buff, talent or daily plan shows the game's own description of it.[/*]
[*][b]Every game command[/b]: the Game index tab runs any of the game's 167 GM commands with its fields, and a console takes typed commands and remembers them.[/*]
[*][b]Testing mods[/b]: show the id of whatever the cursor is on, a mod health page with every plugin's version and errors, fill every trap, bring the basket back, and a test toast.[/*]
[*][b]Mod tests[/b]: test buttons other mods add, grouped by mod. Loot Restock, for one, adds a button that restocks the location you are in right away.[/*]
[*][b]Changes and undo[/b]: every change is listed with what it was before. Switches and the weather can be undone, and Restore settings puts them all back.[/*]
[*][b]Presets[/b]: save a set of switches for a test, apply it again later, and go back to Default.[/*]
[*][b]Backup before cheating[/b]: your first cheat in a session waits while the menu backs up your save with the game's own backup. Load backup undoes everything since. Red rows back up the save again first (a switch on the Saves tab turns that off).[/*]
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

Works in English and Chinese. The menu starts in the game's language; the EN / 中文 button at the top right switches it.

[size=5]Known issues[/size]
[list]
[*]Rows marked EDITOR or NOT WIRED are greyed and can't be pressed: the release game ignores them.[/*]
[*]The mod's cheats that stay on (God mode, Freeze the clock and the rest) start off every time the game starts.[/*]
[*]Instant crafting does not cover workbench crafting.[/*]
[*]Mark containers unsearched only brings back the marker; it does not refill them.[/*]
[*]Undo covers switches, the mod's cheats that stay on, survivor values and the weather. One-time actions (items, stats, skipped days) can only be undone by loading the backup, which loses everything since your first cheat.[/*]
[*]Some tools only work at home, on an expedition, or at a certain story step; the game refuses them otherwise and the menu's log says so.[/*]
[/list]

[center][img]https://sldb.core-directive.com/img/mods-banner.jpg[/img]
[size=4][url=https://www.nexusmods.com/survivallog/mods/73]Get Mod Manager[/url] to set up all your mods in game  |  [url=https://sldb.core-directive.com/en/]Open the Survival Log wiki[/url] for items, recipes and maps[/size][/center]

[size=5]Requirements[/size]
[list]
[*]Survival Log 1.1.20151. A game update can break it until the mod is updated.[/*]
[*][url=https://www.nexusmods.com/survivallog/mods/12]BepInEx for Survival Log[/url]. Install it first.[/*]
[*][url=https://www.nexusmods.com/survivallog/mods/61]Exiled's Toolkit[/url] 0.11.0 or newer. Cheat Menu does not load without it. With it, a new menu key set on the Mod Manager's Mods screen works without restarting the game, and its UI size setting draws the menu bigger or smaller. Cheat Menu's own UiScale setting can set a size for this mod alone.[/*]
[/list]

[size=5]Installation[/size]
[list=1]
[*]Install [url=https://www.nexusmods.com/survivallog/mods/12]BepInEx[/url] [i](if no other mods were installed before, start the game once so BepInEx finishes setup, then quit)[/i].[/*]
[*]Install Exiled's Toolkit the same way.[/*]
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

[size=5]Source and license[/size]
Open source under MIT: [url=https://github.com/AnExiledDev/SurvivalLog-CheatMenu]github.com/AnExiledDev/SurvivalLog-CheatMenu[/url]

[line]
[size=5]简体中文[/size]

《Survival Log》自带一个开发者用来测试的 GM 面板，但玩家无法打开。Cheat Menu 把这些工具全部放进一个菜单里，可以用来作弊，也可以用来测试你自己的模组和存档。

[size=5]游戏会上报作弊行为[/size]
[b]《Survival Log》会向开发者上报作弊行为。[/b]游戏自带作弊检测，会向游戏的数据统计发送「作弊证据」事件，并在崩溃报告中做标记。发给游戏 GM 处理器的 GM 消息（本菜单正是这样工作的）会被算作作弊证据。Cheat Menu 不会阻止、隐藏或修改这种上报。如果你不希望自己的游戏被标记为作弊，请不要使用本模组。目前没有发现它会因此阻止存档或成就。

[size=5]主要功能[/size]
[list]
[*][b]17 个标签页[/b]：快捷、幸存者、物品、金钱与交易、时间与天气、家园与建造、农场与机器人、危险、探索、人物、剧情与事件、解锁、存档、调试，另有「变更」、「模组测试」和「游戏目录」。[/*]
[*][b]搜索[/b]：用中文或英文在所有标签页中查找任何工具。[/*]
[*][b]属性[/b]：拖动条来设置饱食、心情、体力、生命或活力，并用游戏自带的属性锁定把它们锁住。[/*]
[*][b]物品生成[/b]：按图片选物品，按名称或 id 搜索，或直接输入任意物品 id。[/*]
[*][b]天气与地图[/b]：设置任意天气或恢复天气预报；直接进入任意探索地图。[/*]
[*][b]本模组添加的作弊[/b]：无敌、无限电力、和平模式、冻结时钟、不耗燃料、瞬间制作、自由建造、催熟或照料作物、强制花盆异常、与任何人结盟、增加暴露度、推进或结束当前事件、清除高利贷、清除负面状态、设置任意轮回奖励的等级或在一局中途购买轮回奖励、永不腐坏、食物恢复新鲜、解锁全部烹饪和制作配方、跳到早上或晚上、修好全部家具、预览容器内容。它们使用游戏自己的代码，并标为「ADDED BY MOD」。[/*]
[*][b]幸存者数值[/b]：属性上限、各项属性的消耗速度、移动和交互速度、商店折扣、贷款上限和瞬间旅行。[/*]
[*][b]游戏自带的开关[/b]：跳过过场和每日结算、锁定门窗耐久、锁定探索暴露度、调试显示等等。[/*]
[*][b]每一行都能用[/b]：每条命令都有列表和数字框。游戏用 id 识别的东西都能按名称从可搜索的列表中选择：你的花盆、家具、事件、状态、机器人和人物，本地图的商店及其商品、容器、交易点、家中槽位、存档和备份。选中状态、天赋或每日计划时，会显示游戏里对它的说明。[/*]
[*][b]所有游戏命令[/b]：「游戏目录」标签页可以填写字段运行游戏全部 167 条 GM 命令，控制台也可以输入命令，并会记住输入过的命令。[/*]
[*][b]测试模组[/b]：显示鼠标所指物体的 id，模组状态页列出每个插件的版本和错误，填满所有陷阱，让篮子马上回来，以及测试提示。[/*]
[*][b]模组测试[/b]：其他模组添加的测试按钮，按模组分组。比如 Loot Restock 添加了一个按钮，可以让你所在的地点立即补货。[/*]
[*][b]变更与撤销[/b]：每次改动都会列出改动前的值。开关和天气可以撤销，「恢复设置」会把它们全部恢复。[/*]
[*][b]预设[/b]：把一组开关保存下来用于测试，之后再次应用，也可以回到「默认」。[/*]
[*][b]作弊前备份[/b]：每次游戏中的第一次作弊会先等菜单用游戏自带的备份功能备份你的存档。「载入备份」会撤销此后的一切。红色的行会先再备份一次存档（可在「存档」标签页的开关中关闭）。[/*]
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

支持英文和中文。菜单默认使用游戏的语言；右上角的 EN / 中文 按钮可以切换。

[size=5]已知问题[/size]
[list]
[*]标为「EDITOR」或「NOT WIRED」的行是灰色的，无法点击：正式版游戏会忽略它们。[/*]
[*]本模组持续生效的作弊（无敌、冻结时钟等）每次启动游戏时都是关闭的。[/*]
[*]瞬间制作不包括工作台制作。[/*]
[*]「标为未搜索」只恢复标记，不会重新填充容器。[/*]
[*]撤销针对开关、本模组持续生效的作弊、幸存者数值和天气。一次性的操作（物品、属性、跳过的天数）只能通过载入备份来撤销，而载入备份会丢失第一次作弊之后的所有进度。[/*]
[*]有些工具只能在家中、探索中或特定剧情阶段使用；其他时候游戏会拒绝，菜单的日志会说明原因。[/*]
[/list]

[url=https://www.nexusmods.com/survivallog/mods/73]获取 Mod Manager[/url]，在游戏里设置所有模组。[url=https://sldb.core-directive.com/zh/]打开 Survival Log 维基[/url]，物品、配方、地图一查就有。

[size=5]前置要求[/size]
[list]
[*]《Survival Log》1.1.20151。游戏更新后，在模组更新前可能无法使用。[/*]
[*][url=https://www.nexusmods.com/survivallog/mods/12]BepInEx for Survival Log[/url]。请先安装它。[/*]
[*][url=https://www.nexusmods.com/survivallog/mods/61]Exiled's Toolkit[/url] 0.11.0 或更新版本。没有它本模组不会加载。装了它，在 Mod Manager 的「模组」界面设置的新按键不用重启游戏就能生效，还能用它的界面大小设置调整菜单的大小。还可以用 Cheat Menu 自己的 UiScale 设置单独调整本模组的大小。[/*]
[/list]

[size=5]安装[/size]
[list=1]
[*]安装 [url=https://www.nexusmods.com/survivallog/mods/12]BepInEx[/url]（如果之前没装过其他模组，先启动一次游戏让 BepInEx 完成初始化，然后退出）。[/*]
[*]用同样的方式安装 Exiled's Toolkit。[/*]
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

[size=5]源代码与许可[/size]
MIT 开源：[url=https://github.com/AnExiledDev/SurvivalLog-CheatMenu]github.com/AnExiledDev/SurvivalLog-CheatMenu[/url]
