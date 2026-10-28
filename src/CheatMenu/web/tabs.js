// The tabs: every row, its source tag and its words.
// Source tags: G = the game's own GM tool, M = added by the mod, E = editor or dev build only, S = writes Steam achievements.
(function () {
  const tog = (l, s, d, on) => ({ k: 'tog', l, s, d, on: !!on });
  const btn = (l, s, d, b, red) => ({ k: 'btn', l, s, d, b: b || 'Run', red });
  const num = (l, s, d, v, u, b) => ({ k: 'num', l, s, d, v, u: u || '', b: b || 'Apply' });
  const sel = (l, s, d, o, b) => ({ k: 'sel', l, s, d, o, b: b || 'Apply' });
  const grp = (t, zh, rows, x) => Object.assign({ t, zh, rows }, x || {});

  const icons = {
    quick: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
    survivor: '<circle cx="12" cy="7" r="4"/><path d="M4 21c1-5 4-7 8-7s7 2 8 7"/>',
    items: '<path d="M4 8h16v12H4z"/><path d="M8 8V5h8v3M4 13h16"/>',
    money: '<circle cx="12" cy="12" r="9"/><path d="M15 9c-1-1.5-5-1.5-5 .8 0 2.7 5 1.4 5 4.2 0 2.2-4 2.2-5 .5M12 6v12"/>',
    time: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    home: '<path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10M10 20v-6h4v6"/>',
    farm: '<path d="M12 21V10"/><path d="M12 13c-4 0-6-2-6-6 4 0 6 2 6 6zM12 10c0-4 2-6 6-6 0 4-2 6-6 6z"/>',
    danger: '<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17v.5"/>',
    explore: '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>',
    people: '<circle cx="9" cy="8" r="3.5"/><path d="M2 20c.7-4 3.2-6 7-6s6.3 2 7 6"/><circle cx="17" cy="9" r="2.5"/><path d="M17 14c2.5 0 4.3 1.6 5 4.5"/>',
    story: '<path d="M5 4h11l3 3v13H5z"/><path d="M8 10h8M8 14h8M8 18h5"/>',
    progress: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4c0 3 1.5 4.5 3 5M17 6h3c0 3-1.5 4.5-3 5"/>',
    saves: '<path d="M5 3h11l3 3v15H5z"/><path d="M8 3v5h7V3M8 21v-7h8v7"/>',
    debug: '<path d="M9 9h6v8a3 3 0 0 1-6 0z"/><path d="M10 6a2 2 0 0 1 4 0v3h-4zM4 12h5M15 12h5M5 17l4-1M19 17l-4-1M6 7l3 2M18 7l-3 2"/>'
  };

  const T = [];

  T.push({ id: 'quick', name: 'Quick', zh: '常用', blurb: 'The cheats most people want, in one place. Pin any row from another tab to add it here.', groups: [
    grp('Survival', '生存', [
      tog('God mode', 'M', 'All five stats held at max; you cannot die.'),
      tog('Lock stats where they are', 'G', 'The game\'s own attribute lock (角色属性锁定).'),
      tog('Doors and windows never wear', 'G', 'Durability lock (门窗耐久锁定).'),
      tog('Revive when a door breaks', 'G', 'A broken door no longer ends the run; all doors refill next frame.'),
      tog('No exposure gain', 'G', 'Exposure lock while exploring (探索暴露值锁定).')
    ]),
    grp('Stuff', '物资', [
      num('Add money', 'G', 'Pre-disaster only: the game hides money after the outbreak.', 5000, 'gold', 'Add'),
      num('Add carry weight', 'G', 'Raise the bag weight limit.', 20, 'kg', 'Add'),
      btn('Clear every daily cooldown', 'G', 'Furniture, item daily uses, research, rescue, trade limits.', 'Clear'),
      btn('Repair all doors and windows', 'G', 'Fills durability on every door and window.', 'Repair')
    ]),
    grp('Time', '时间', [
      sel('Game speed', 'G', 'Any speed, past the game\'s own buttons.', ['x0.5', 'x1', 'x2', 'x4', 'x8', 'x16'], 'Set'),
      btn('Skip to 23:00', 'G', 'Jump to tonight\'s end of day.', 'Skip'),
      num('Skip days', 'G', 'Forward only; daily ticks run for each day.', 1, 'days', 'Skip')
    ]),
    grp('Test kit', '跑测套装', [
      btn('Apply the developers\' test kit', 'G', 'Their one-click set: character thinking off, skip settlement, stat lock, door lock, event oracle, auto-confirm, buff 999 and every stat at 100.', 'Apply'),
      btn('Skip prologue and pre-disaster', 'G', 'Ends the prologue, skips the opening, lands you after the disaster.', 'Skip')
    ])
  ]});

  T.push({ id: 'survivor', name: 'Survivor', zh: '角色', blurb: 'Stats, buffs, talents, skills and what the survivor does next. Drag a bar to set a stat; the lock holds it.', custom: 'stats', groups: [
    grp('Max values and rates', '上限与倍率', [
      num('Max satiety', 'M', 'The most satiety the survivor can have.', 166, ''), num('Max morale', 'M', 'The most morale the survivor can have.', 500, ''), num('Max stamina', 'M', 'The most stamina the survivor can have.', 197, ''), num('Max life', 'M', 'The most life the survivor can have.', 201, ''),
      sel('Stat drain', 'M', 'How fast satiety, morale, stamina, life and vitality drop, over time and from what you do.', ['Normal', 'Half', 'None'], 'Set'),
      sel('Stat gain from food and rest', 'M', 'How much satiety, morale, stamina, life and vitality go up, from food, rest and over time.', ['Normal', 'x1.5', 'x2', 'x3'], 'Set'),
      num('Move speed', 'M', 'Walking speed, as a percent of normal.', 100, '%'), num('Interact speed', 'M', 'How fast the survivor uses furniture, as a percent of normal.', 100, '%')
    ]),
    grp('Buffs and symptoms', 'Buff 与症状', [
      sel('Add buff', 'G', 'Gives the survivor any buff in the game, good or bad.', ['Well-Fed', 'Wish Fulfilled', 'Steady Focus', 'High Alert', 'Enjoy the Process'], 'Add'),
      sel('Remove buff', 'G', 'Removes a buff the survivor has now.', ['Well-Fed', 'Wish Fulfilled', 'Steady Focus', 'High Alert'], 'Remove'),
      btn('Clear every debuff', 'M', 'Cures illness, injuries and bad moods at once.', 'Clear'),
      sel('Trigger a symptom action', 'G', 'Runs a buff\'s forced action now, skipping its timer and odds.', ['Cough', 'Vomit', 'Tremble', 'Faint'], 'Trigger'),
      num('Fill reinforce layers', 'G', 'Sets a stacking buff to its max layer count.', 999, 'buff id', 'Fill')
    ]),
    grp('Talents and skills', '天赋与熟练度', [
      sel('Add talent', 'G', 'Adds any talent at any level, even one the game would not offer yet.', ['Night Owl Lv1', 'Iron Stomach Lv2', 'Handyman Lv3', 'Green Thumb Lv1'], 'Add'),
      sel('Activate daily plan', 'G', 'Turns on a daily planning talent now.', ['Early Riser', 'Focused Work', 'Rest Day'], 'Activate'),
      sel('Proficiency', 'G', 'Adds levels to the skill you pick.', ['Crafting', 'Planting', 'Cooking', 'Traps', 'Exploration', 'Defense'], 'Add'),
      num('Add proficiency exp', 'G', 'Adds experience to one skill.', 500, 'exp', 'Add'),
      num('Add proficiency levels', 'G', 'Adds levels to one skill.', 1, 'lv', 'Add'),
      num('Add Planning Points', 'G', 'The points loop rewards cost between runs.', 10, 'pts', 'Add'),
      sel('Set a loop reward level', 'M', 'Gives you any loop reward at any level now, as buying it between runs would. Level 0 removes it. Turn on paying to spend or get back Planning Points.', ['Early Riser - Lv 0/5', 'Savings Account - Lv 2/5'], 'Set'),
      btn('Open the loop reward screen', 'M', 'Opens the screen you buy loop rewards on, in the middle of a run. Buy and use Reset Changes as usual. Its Start New Loop or Ready button only closes it: the run goes on, and what you bought works at once.', 'Open')
    ]),
    grp('Make them do it', '自动行为', [
      sel('Auto behaviour', 'G', 'Starts one of the survivor\'s own idle behaviours.', ['Eat', 'Sleep', 'Nap', 'Play games', 'Leisure (random)', 'Wellness (random)', 'Use the toilet'], 'Start'),
      num('Run an action by id', 'G', 'Queues any of the game\'s player actions on the survivor, by its id.', 2167, 'action', 'Queue'),
      btn('Break the current action', 'G', 'Stops what the survivor is doing.', 'Break'),
      btn('Clear the action queue', 'G', 'Drops every action the survivor has queued.', 'Clear'),
      tog('Always offer dancing', 'G', 'The dance suggestion shows every time, with no stat gate, cooldown or daily cap.')
    ]),
    grp('Death', '死亡', [
      btn('Real death', 'G', 'Drains life to 0 and lets the game\'s death chain play out.', 'Die', true),
      sel('Force game over', 'G', 'Ends the run now with the result you pick, a loss or one of the endings.', ['0 Exhausted', '1 Door broken', '2 Event complete', '3 Days reached', '4 No rebirths left', '5-13 Endings'], 'End run')
    ], { warn: true })
  ]});

  T.push({ id: 'items', name: 'Items', zh: '物品', blurb: 'Every item in the game, searchable. Spawn into the bag, home storage or the car trunk.', custom: 'items', groups: [
    grp('Food', '食物', [
      tog('Never spoil', 'M', 'Nothing rots, and food stays as fresh as it is now while this is on.'),
      btn('Make all food fresh', 'M', 'Every food item everywhere goes back to as fresh as new.', 'Freshen')
    ])
  ] });

  T.push({ id: 'money', name: 'Money & Trade', zh: '金钱与交易', blurb: 'Gold, shops, the pawn shop, strangers and trade points.', groups: [
    grp('Money', '金钱', [
      num('Add money', 'G', 'Pre-disaster only.', 5000, 'gold', 'Add'),
      num('Set money', 'G', '', 99999, 'gold', 'Set'),
      btn('Clear loan shark debt', 'M', '', 'Clear'),
      num('Loan cap bonus', 'M', 'Raises how much you can borrow.', 10000, 'gold')
    ]),
    grp('Pre-disaster shopping', '灾前物资', [
      btn('Buy everything in this shop', 'G', 'Free; the ledger records it.', 'Buy all'),
      btn('Search every container here', 'G', 'With the game\'s own search rolls.', 'Search'),
      btn('Grab the ground loot', 'G', 'PsOpGroundLoot', 'Grab'),
      btn('Run the rush sale', 'G', 'The first shelf of the rush shop.', 'Rush'),
      btn('Buy a vehicle', 'G', 'PsOpBuyVehicle', 'Buy'), btn('Sell the vehicle', 'G', 'PsOpSellVehicle', 'Sell'),
      btn('Pawn furniture', 'G', 'PsOpPawn / GmPawnFurniture', 'Pawn'),
      btn('Return every package', 'G', 'Sends every home package back for a refund.', 'Return all'),
      num('Add to the countdown', 'G', 'More time before the outbreak.', 3600, 'sec', 'Add'),
      btn('Reset the GM ledger', 'G', 'PsOpResetLedger', 'Reset')
    ]),
    grp('Strangers and trade points', '陌生人与交易点', [
      btn('Clear daily deal limits', 'G', '', 'Clear'),
      btn('Every trader comes back now', 'G', 'GmForceReturnAll', 'Recall'),
      btn('Unlock active trade points', 'G', 'Tags every trade point entrance.', 'Unlock'),
      num('Trade point relation (Casual)', 'G', '', 100, '', 'Set'),
      num('Shop discount', 'M', 'Takes this percent off what you buy.', 0, '%')
    ])
  ]});

  T.push({ id: 'time', name: 'Time & Weather', zh: '时间与天气', blurb: 'The clock, the day, the speed, the weather and the light.', custom: 'weather', groups: [
    grp('Clock', '时钟', [
      sel('Game speed', 'G', 'Any speed, past the game\'s own buttons.', ['x0.25', 'x0.5', 'x1', 'x2', 'x4', 'x8', 'x16', 'x32'], 'Set'),
      tog('Speed hotkeys', 'G', 'The developers\' speed keys (快捷键倍速).'),
      tog('Pause means pause', 'G', 'Turns off the paused-frame freeze (暂停冻帧禁用).'),
      num('Advance hours', 'G', 'Hourly events still fire.', 6, 'h', 'Advance'),
      btn('Skip to 23:00', 'G', '', 'Skip'),
      num('Skip days', 'G', 'Daily and endless ticks run for each day.', 1, 'days', 'Skip'),
      num('Set the day counter', 'G', 'Changes only the number on the HUD; supplies and cooldowns stay.', 50, 'day', 'Set'),
      tog('Freeze the clock', 'M', ''),
      sel('Skip to a time of day', 'M', 'Moves the clock on to the next one; hourly events still fire.', ['Morning 07:00', 'Noon 12:00', 'Evening 18:00', 'Night 22:00'], 'Skip')
    ]),
    grp('Before the outbreak', '灾前', [
      btn('Jump to the outbreak', 'G', 'Fast-forwards the countdown; the disaster starts next frame.', 'Jump'),
      num('Add to the countdown', 'G', '', 3600, 'sec', 'Add'),
      btn('Skip the disaster cutscene', 'G', 'Goes straight to after the disaster.', 'Skip')
    ]),
    grp('Light', '光照', [
      sel('Time-of-day light', 'G', 'Light types 1-4, instant or with a transition.', ['1 Dawn', '2 Day', '3 Dusk', '4 Night'], 'Set'),
      tog('Instant light change', 'G', 'Off plays the transition.')
    ])
  ]});

  T.push({ id: 'home', name: 'Home & Build', zh: '家园与建造', blurb: 'Free build, furniture, power, doors and windows.', groups: [
    grp('Building', '建造', [
      tog('Free build', 'G', 'The game\'s own GM free-build mode (GM 自由建造).'),
      num('Install furniture in a slot', 'G', 'QuickInstall: config id, then pick the slot.', 66201, 'id', 'Install'),
      btn('Install a preset layout', 'G', 'QuickInstallPreset: a whole list at once.', 'Install'),
      num('Clear a slot', 'G', 'Removes whatever furniture is in that slot.', 31, 'slot', 'Clear'),
      btn('Show every slot', 'G', 'Lists slots and the furniture the shop can sell for each.', 'Query'),
      num('Add furniture to the bag', 'G', 'As a package, ready to place.', 66201, 'id', 'Add'),
      tog('Right-click copies furniture id', 'G', '')
    ]),
    grp('Doors, windows, defences', '门窗', [
      btn('Repair all doors and windows', 'G', '', 'Repair'),
      tog('Durability lock', 'G', 'Doors and windows never lose durability.'),
      btn('Fill every reinforce layer', 'G', '', 'Fill'),
      btn('Force-break shields', 'G', 'Test what happens when a shield goes.', 'Break', true)
    ]),
    grp('Power and furniture', '电力与家具', [
      btn('Fill stored power', 'G', '', 'Fill'), btn('Empty stored power', 'G', '', 'Empty'),
      btn('Clear every furniture cooldown', 'G', 'GmClearAllCd', 'Clear'),
      tog('Infinite power', 'M', ''), tog('Instant crafting, cooking, brewing', 'M', 'Machine Speed does this too; the menu calls it when it is loaded.'),
      btn('Repair all furniture', 'M', 'Every piece of furniture at home goes back to full durability.', 'Repair')
    ]),
    grp('Rats and storage', '储物老鼠', [
      btn('Put a rat in every storage', 'G', 'One rat per storage bag (not fridges, doors, lockers, rat cages, the basket).', 'Mark'),
      btn('Clear rat marks', 'G', '', 'Clear'),
      btn('Force a rat visit', 'G', 'GmForceMarkRatVisit', 'Visit')
    ]),
    grp('Timelapses', '延时', [
      btn('Play the home build timelapse', 'G', '', 'Play'),
      btn('Play the room timelapse', 'G', '', 'Play'),
      btn('Play the storage fill timelapse', 'G', '', 'Play')
    ])
  ]});

  T.push({ id: 'farm', name: 'Farm & Robots', zh: '种植与机器人', blurb: 'Plants, the planting robot, and every robot tool the developers built.', groups: [
    grp('Plants', '植物', [
      btn('Mature every plant', 'M', 'Calls the game\'s force-mature on each pot.', 'Mature'),
      num('Mature one pot', 'G', 'Ripe next frame.', 1, 'pot', 'Mature'),
      sel('Force an anomaly', 'G', 'On the chosen pot.', ['Giant', 'Glowing', 'Twin', 'Withered'], 'Force'),
      btn('Water and fertilize all', 'M', '', 'Tend')
    ]),
    grp('Planting robot', '种植机器人', [
      btn('Scan', 'G', 'Ranks every pot the robot could claim and why the rest are out.', 'Scan'),
      btn('Show claims', 'G', '', 'Show'),
      sel('Do an action', 'G', 'Robot, action, pot.', ['Plant', 'Water', 'Fertilize', 'Harvest'], 'Do'),
      sel('Preset', 'G', 'Robot tier and seed.', ['Tier 1', 'Tier 2', 'Tier 3'], 'Set'),
      btn('Release claims', 'G', '', 'Release')
    ]),
    grp('Robots', '机器人', [
      sel('Spawn a robot', 'G', 'At a charging dock.', ['HK Tidying Robot', 'GR Planting Robot'], 'Spawn'),
      num('Set battery', 'G', '', 100, '%', 'Set'),
      num('Fill its bag', 'G', 'With an item id.', 1, 'item', 'Fill'),
      sel('Master switch', 'G', '', ['On', 'Off'], 'Set'),
      btn('Dock info', 'G', 'Every dock, its robot, and orphaned robots.', 'Show'),
      sel('Fake a state', 'G', 'For testing robot UI.', ['Idle', 'Working', 'Charging', 'Stuck'], 'Fake'),
      tog('Trip stub', 'G', 'Replaces the trip provider so injected trips run.'),
      btn('Queue a trip', 'G', 'From a container to a container.', 'Queue')
    ]),
    grp('Robot modules', '机器人模块', [
      sel('Give a module', 'G', '', ['Battery Lv1', 'Battery Lv2', 'Battery Lv3', 'Fast Charge'], 'Give'),
      btn('Install', 'G', '', 'Install'), btn('Uninstall', 'G', '', 'Uninstall'),
      btn('Dump modules', 'G', '', 'Dump'), btn('Clear all slots', 'G', 'Modules are discarded.', 'Clear', true)
    ]),
    grp('Robot talk and containers', '机器人对话与容器', [
      btn('List robots and talk state', 'G', '', 'List'),
      sel('Say a line', 'G', '', ['Greeting', 'Low battery', 'Bag full', 'Idle chatter'], 'Say'),
      btn('Reset talk cooldowns', 'G', '', 'Reset'),
      btn('Force a robot meeting', 'G', 'GmForceMeet', 'Meet'),
      btn('Scan robot containers', 'G', 'Tag cabinets and material racks with a robot switch.', 'Scan'),
      tog('Watch container changes', 'G', '')
    ])
  ]});

  T.push({ id: 'danger', name: 'Danger', zh: '危险', danger: true, blurb: 'Zombies, sieges, the endless crisis and the group anger meter.', groups: [
    grp('Siege (tower defence)', '塔防', [
      btn('Start a wave', 'G', 'Event, budget, pace, charge threshold, soft cap.', 'Start'),
      sel('Force the wave state', 'G', '', ['0 Idle', '1 Spawning', '2 Final charge', '3 Retreat'], 'Force'),
      num('Spawn zombies', 'G', '', 5, 'zombies', 'Spawn'),
      btn('Kill every zombie', 'G', '', 'Kill all', true),
      btn('Kill the front attacker', 'G', '', 'Kill one'),
      num('Remove a defence device', 'G', 'By config id and slot.', 0, 'id', 'Remove'),
      btn('Wave status', 'G', 'Event, on field, budget left, targets.', 'Query')
    ], { warn: true }),
    grp('Endless', '无尽', [
      sel('Start a horde wave', 'G', 'By tier and day slot.', ['Tier 1', 'Tier 2', 'Tier 3', 'Tier 4', 'Tier 5'], 'Start'),
      num('Start a crisis', 'G', 'Starts one of endless mode\'s crises now.', 1, 'row', 'Start'),
      btn('End every crisis', 'G', '', 'End'),
      sel('Show an endless banner', 'G', '', ['Wave', 'Crisis', 'Season'], 'Show')
    ]),
    grp('Strays and rats', '零星丧尸与老鼠', [
      btn('Spawn a stray zombie', 'G', '', 'Spawn'),
      num('Spawn a scene rat', 'G', '0 picks a weighted random one.', 0, 'id', 'Spawn'),
      tog('Peaceful mode', 'M', 'No attacks, no strays, doors never break.')
    ]),
    grp('Mood of the block', '群愤怒值', [
      num('Set group anger', 'G', 'Post-disaster only.', 0, '', 'Set'),
      btn('Close every zombie timeline', 'G', '', 'Close all')
    ]),
    grp('Overlays', '调试显示', [
      tog('Zombie behaviour labels', 'G', 'Each zombie shows what it is doing and its target.')
    ])
  ]});

  T.push({ id: 'explore', name: 'Explore', zh: '探索', blurb: 'Go anywhere, see everything, take everything.', custom: 'maps', groups: [
    grp('Access', '进入', [
      btn('Unlock every location', 'G', 'Tags every point. Day and time rules can still block some.', 'Unlock'),
      btn('Reset warehouse rescue for today', 'G', '', 'Reset')
    ]),
    grp('While exploring', '探索中', [
      num('Add exposure', 'G', '', 10, '%', 'Add'),
      tog('Exposure lock', 'G', ''),
      tog('Free camera', 'G', 'A free camera while exploring.'),
      tog('Raise the camera', 'G', ''),
      sel('Minimap mode', 'G', 'Applies next time you explore.', ['Normal', 'Full', 'Off'], 'Set'),
      sel('Flashlight zoom', 'G', '', ['Narrow', 'Default', 'Wide', 'Reset'], 'Set')
    ]),
    grp('Auto search', '模拟搜刮', [
      btn('Simulate a search run', 'G', 'Plans the best route by budget and shows what you would get.', 'Simulate'),
      btn('Run it', 'G', 'Walks the plan for you.', 'Run'),
      tog('Instant travel', 'M', ''), tog('No fuel use', 'M', '')
    ]),
    grp('Containers', '容器', [
      btn('Container contents preview', 'M', 'Lists what every container here holds, unsearched first, without opening them.', 'Show'),
      btn('Mark containers unsearched', 'M', 'Brings back the unsearched marker. What is inside stays the same; it does not refill.', 'Mark')
    ])
  ]});

  T.push({ id: 'people', name: 'People', zh: '人物', blurb: 'Neighbours, the companion, strangers, texts and the group chat.', custom: 'people', groups: [
    grp('Rescue clocks', '救助计时', [
      num('Shift the neglect clock', 'G', 'Hours forward, for both lines.', 24, 'h', 'Shift'),
      num('Shift the tier clock', 'G', '', 24, 'h', 'Shift'),
      sel('Set survival tier', 'G', '', ['0', '1', '2', '3', '4'], 'Set'),
      btn('Force a wish', 'G', 'Generates the next wish now.', 'Wish'),
      num('Force a pool wish', 'G', 'By wish id.', 1, 'wish', 'Wish')
    ]),
    grp('NPCs', 'NPC', [
      num('Meet an NPC', 'G', '0 meets the whole roster.', 0, 'npc', 'Meet'),
      sel('Send an NPC somewhere', 'G', 'Floor or furniture; routes across floors.', ['Home 1F', 'Home 2F', 'Roof', 'Neighbour door'], 'Go'),
      btn('Old-class smash test', 'G', 'Visitor event 20230: choice, result, feeding, the watch.', 'Test')
    ]),
    grp('Strangers', '陌生人', [
      btn('Ally with everyone', 'G', 'Makes every contact an ally.', 'Ally'),
      num('Ally with a contact', 'G', '', 1, 'id', 'Ally'),
      btn('Send a commission', 'G', '', 'Send'),
      btn('Commission snapshot', 'G', '', 'Show')
    ]),
    grp('Aid platform', '互助平台', [
      btn('Open the platform', 'G', '', 'Open'), btn('Create a request', 'G', '', 'Create'),
      btn('Accept', 'G', '', 'Accept'), btn('Complete', 'G', '', 'Complete'),
      num('Set done count', 'G', '', 5, '', 'Set'), btn('Settle', 'G', '', 'Settle')
    ]),
    grp('Phone', '手机', [
      num('Deliver a text', 'G', 'By SMS id.', 1, 'sms', 'Send'),
      sel('Reply to a text', 'G', 'Contact and option.', ['Option 1', 'Option 2', 'Option 3'], 'Reply'),
      num('Push a group chat post', 'G', 'Main posts only (mood or task).', 1, 'sms', 'Push')
    ])
  ]});

  T.push({ id: 'story', name: 'Story & Events', zh: '剧情与事件', blurb: 'Events, cutscenes, the prologue, endings and rebirth.', groups: [
    grp('Events', '事件', [
      btn('Step the current event', 'G', '', 'Step'),
      btn('Pick a choice for me', 'G', '', 'Pick'),
      btn('End it with a result', 'G', '', 'End'),
      btn('Reset the event', 'G', '', 'Reset'),
      tog('Auto-confirm events', 'G', ''),
      num('Force an event', 'G', 'Any event id, even another survivor\'s.', 20230, 'event', 'Trigger'),
      tog('Skip daily settlement', 'G', '')
    ]),
    grp('Cutscenes', '过场', [
      tog('Skip cutscenes', 'G', ''),
      btn('Skip the opening', 'G', '', 'Skip'),
      btn('Skip prologue and pre-disaster', 'G', '', 'Skip'),
      sel('Play a timeline', 'G', '', ['Opening', 'Disaster (zaibian)', 'Scene', 'Wake-up: dream', 'Wake-up: camera', 'Stop wake-up'], 'Play'),
      num('Toggle a date timeline', 'G', 'By config id.', 1, 'id', 'Toggle'),
      btn('Story prompts unread again', 'G', 'Moves finished story prompts back to unread.', 'Restore')
    ]),
    grp('Endings', '结局', [
      sel('Force game over', 'G', 'Ends the run now with the result you pick, a loss or one of the endings.', ['0 Exhausted', '1 Door broken', '2 Event complete', '3 Days reached', '4 No rebirths left', '5-13 Endings'], 'End run'),
      btn('Play the DemoTwo ending', 'G', 'Big Zombie timeline, then day-end settlement.', 'Play')
    ], { warn: true }),
    grp('Rebirth', '重生', [
      btn('Write a day snapshot now', 'G', '', 'Write'),
      sel('Set rebirth state', 'G', 'Chances used.', ['0 used', '1 used', '2 used', 'All used'], 'Set'),
      num('Minor rebirth', 'G', 'Go back N days and re-enter.', 1, 'days', 'Rebirth'),
      btn('Open the rebirth choice', 'G', '', 'Open'),
      btn('Restart this loop', 'G', 'Back to the pre-disaster start; re-pick talent points.', 'Restart', true)
    ])
  ]});

  T.push({ id: 'progress', name: 'Unlocks', zh: '解锁与进度', blurb: 'Codex, survivors, Casual Mode and achievements.', groups: [
    grp('Codex', '图鉴', [
      btn('Unlock the whole codex', 'G', 'Milestone rewards are given too.', 'Unlock'),
      num('Unlock a random share', 'G', '', 50, '%', 'Unlock'),
      btn('Clear the codex', 'G', 'Rewards already given stay.', 'Clear', true)
    ]),
    grp('Survivors', '角色', [
      sel('Unlock a survivor', 'G', 'Takes effect when the select screen reopens.', ['The Veteran (4)', 'Survivor 1', 'Survivor 2', 'Survivor 3'], 'Unlock'),
      sel('Revoke a survivor', 'G', '', ['The Veteran (4)'], 'Revoke'),
      sel('Unlock for endless', 'G', '', ['The Veteran (4)', 'All'], 'Unlock')
    ]),
    grp('Recipes and blueprints', '配方与图纸', [
      btn('Unlock every recipe and blueprint', 'M', 'Every cooking recipe and every workbench blueprint.', 'Unlock')
    ]),
    grp('Casual Mode', '休闲模式', [
      btn('Enter Casual Mode', 'G', '', 'Enter'),
      tog('Developer override', 'G', ''),
      num('Set alert level', 'G', 'Applies now.', 1, '', 'Set'),
      btn('Reroll camp orders', 'G', '', 'Reroll'),
      btn('Check home milestones now', 'G', '', 'Check')
    ]),
    grp('Achievements', '成就', [
      btn('Unlock every achievement', 'S', 'Writes to your Steam account. Cannot be undone in game.', 'Unlock', true),
      sel('Unlock one', 'S', '', ['Survivor', 'Hoarder', 'Green Thumb'], 'Unlock'),
      btn('Clear unlocked list', 'G', 'Local list only.', 'Clear'),
      btn('Record an ending', 'S', '', 'Record'),
      btn('Taboo list', 'G', 'List, set, clear taboos.', 'Open'),
      btn('Recheck counters', 'G', '', 'Recheck'),
      btn('Achievement stats', 'G', '', 'Show')
    ], { warn: true, note: 'Steam achievements are permanent on your account.' }),
    grp('Game state', '状态', [
      num('Set a symbol', 'G', 'Story flags by name.', 1, 'value', 'Set'),
      num('Set a game counter', 'G', '', 0, '', 'Set')
    ])
  ]});

  T.push({ id: 'saves', name: 'Saves', zh: '存档', blurb: 'The developers\' save tools: back up before a risky test, roll back after.', groups: [
    grp('Saves', '存档', [
      btn('List saves', 'G', '', 'List'),
      btn('Back up the current save', 'G', '', 'Back up'),
      btn('Delete a save', 'G', '', 'Delete', true),
      btn('Convert a save to bytes', 'G', '', 'Convert')
    ]),
    grp('Backups', '备份', [
      btn('List backups', 'G', '', 'List'),
      btn('Load a backup', 'G', 'Injects it and reloads.', 'Load'),
      btn('Delete a backup', 'G', '', 'Delete', true),
      btn('Open the backups folder', 'G', '', 'Open')
    ]),
    grp('Snapshots', '快照', [
      tog('Back up before every risky cheat', 'M', 'Kill all, game over, rebirth, delete.', true),
      btn('Write a day snapshot', 'G', '', 'Write')
    ])
  ]});

  T.push({ id: 'debug', name: 'Debug', zh: '调试', blurb: 'Inspectors, probes and overlays from the developers\' own panel.', groups: [
    grp('Inspectors', '查看', [
      btn('Survivor attributes', 'G', 'Every attr with its value and source.', 'Show'),
      btn('NPC attributes', 'G', '', 'Show'),
      btn('Buff list', 'G', '', 'Show'),
      btn('Furniture attributes', 'G', '', 'Show'),
      btn('Nearby furniture', 'G', '', 'Show'),
      btn('Neighbour line probe', 'G', '', 'Probe'),
      btn('Companion and rescue snapshot', 'G', '', 'Show'),
      btn('Furniture tag probe', 'G', 'Which tag rule takes an item.', 'Probe')
    ]),
    grp('Overlays', '叠加显示', [
      tog('Temperature and light labels', 'G', 'Over furniture, drops and people; bag food shows its spoil rate.'),
      tog('Click ray hits', 'G', ''),
      tog('Zombie behaviour labels', 'G', ''),
      tog('Photo mode', 'G', 'The game\'s sightseeing screenshot mode.'),
      tog('Model shadow stats', 'E', 'Editor only.'),
      tog('3D sound ranges', 'E', 'Editor only.')
    ]),
    grp('Probes', '探针', [
      btn('What UI is under the cursor', 'G', '', 'Probe'),
      btn('WebUI page rectangles', 'G', '', 'Dump'),
      btn('Click pipeline state', 'G', '', 'Dump'),
      btn('Environment probe', 'E', 'Dev build only.', 'Probe'),
      btn('Simulate a key', 'E', 'Dev build only.', 'Send')
    ]),
    grp('Logs', '日志', [
      tog('Forward Debug.Log here', 'G', 'Shows the game\'s Unity log in this panel.', true),
      tog('Loading profiler', 'G', ''),
      btn('Stop the music', 'G', 'Comes back on the next scene change.', 'Stop'),
      btn('Scene: reload the 3D menu', 'G', '', 'Reload')
    ]),
    grp('Mod testing', '模组测试', [
      tog('Show hovered id', 'M', 'Names the instance and config id of whatever the cursor is on, in the game\'s short text.'),
      btn('Mod health', 'M', 'Every loaded plugin with its version and the errors it logged this session. Works from the title screen.', 'Show'),
      btn('Fill every trap', 'M', 'Every set trap with no catch rolls one now, the game\'s own way.', 'Fill'),
      btn('Bring the basket back', 'M', 'The neighbour basket out on a trip comes back now.', 'Return'),
      sel('Test toast', 'M', 'Shows a test message in the style you pick.', ['Game short text', 'Info', 'Success', 'Warning', 'Error'], 'Show')
    ]),
    grp('Telemetry tests', '遥测', [
      btn('Simulate a cheat detection', 'G', 'Sets the game\'s cheat flag and reports it. For testing only.', 'Report', true),
      btn('Trainer crash test', 'E', 'Dev build only.', 'Crash')
    ], { warn: true, note: 'These report to the game\'s developer.' })
  ]});

  window.TABS = T;
  window.TAB_ICONS = icons;
})();
