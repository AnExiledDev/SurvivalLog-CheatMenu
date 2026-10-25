// What each row sends, for rows one bare control cannot fill. Keys are 'tab|label'.
//   cmd   a game message; fix is always in it, main is the field the row's own control fills
//   act   a menu action the plugin runs (ModCheats.cs); hold a menu switch the plugin keeps true each tick
//   pulse a hold that ends by itself; attr/attrs a ChangeAttr on the survivor; readout shows the game's last one
//   opts  [label, value] for the row's list; an object value is merged into the message, '*' sends every option
//   live  a list read from the game: pots, furniture, events, buffs (from the plugin) or saves, backups (readouts)
//   in    more inputs on the row: {f, l, v, t: 'bool'|'text'|'num', opts, live}; a blank one is left out
//   each  one message per entry, each merged over the rest; more: false hides "More fields"
//   k     the control, when it differs from the row's (num, sel, text)
(function () {
  const X = window.GAMEX || {};
  const named = (list, n) => (list || []).map((r) => [`${r[n || 1] || '#' + r[0]} (${r[0]})`, r[0]]);
  const BUFFS = named((X.buffs || []).filter((b) => !b[3]));
  const PROF = [['Production', 1], ['Planting', 2], ['Cooking', 3], ['Trapping', 4], ['Exploring', 5], ['Defence', 6]];
  const SLOT = [['Doors and windows', 0], ['Doors only', 8], ['Windows only', 9]];
  const PS = named(X.ps);
  const RESULT = ['Exhausted', 'Door broken', 'Event complete', 'Days reached', 'No rebirths left'].map((l, i) => [i + ' ' + l, i])
    .concat([5, 6, 7, 8, 9, 10, 11, 12, 13].map((i) => [i + ' Ending line ' + (i - 4), i]));
  const LINES = [{ Line: 'companion' }, { Line: 'rescue' }];
  const robot = { f: 'RobotId', l: 'robot id', v: '' };
  const pot = { f: 'PotId', l: 'pot', live: 'pots' };
  const ps = (op) => ({ cmd: 'GmPreSupplyOp', fix: { Op: op } });
  const plant = (op, x) => Object.assign({ cmd: 'GmPlantRobot', fix: { Op: op }, in: [robot] }, x || {});
  const module = (op) => ({ cmd: 'GmRobotModule', fix: { Op: op }, in: [robot, { f: 'Slot', l: 'slot', v: '' }] });
  const talk = (op, x) => Object.assign({ cmd: 'GmRobotTalk', fix: { Op: op }, in: [robot] }, x || {});
  const plan = (op, x) => Object.assign({ cmd: 'GmRobotPlan', fix: { Op: op }, in: [robot] }, x || {});
  const aid = (op, x) => Object.assign({ cmd: 'GmAidPlatform', fix: { Op: op } }, x || {});
  const ach = (op, x) => Object.assign({ cmd: 'GmAchievementOps', fix: { Op: op } }, x || {});
  const probe = (op, x) => Object.assign({ cmd: 'GmNeighborLineProbe', fix: { Op: op }, each: LINES }, x || {});
  const DRAIN = ['Satiety', 'Morale', 'Stamina', 'Health', 'Vitality'].flatMap((s) => [s + 'Del_Ratio', s + 'AutoDel_Ratio']);
  const GAIN = ['Satiety', 'Morale', 'Stamina', 'Health', 'Vitality'].flatMap((s) => [s + 'Add_Ratio', s + 'AutoAdd_Ratio']);

  window.ROWSPEC = {
    // ---------- quick ----------
    'quick|God mode': { hold: 'god' },
    'quick|Repair all doors and windows': { cmd: 'FillFurnitureDurability', in: [{ f: 'SlotTypeId', l: 'which', opts: SLOT }] },
    'quick|Apply the developers\' test kit': { cmd: 'ApplyTestSuite', in: [{ f: 'autoConfirmEvents', l: 'auto-confirm events', t: 'bool', v: false }] },

    // ---------- survivor ----------
    'survivor|Add buff': { cmd: 'AddBuff', main: 'buffConfigId', opts: BUFFS },
    'survivor|Remove buff': { act: 'buff-remove', main: 'buff', live: 'buffs' },
    'survivor|Trigger a symptom action': { cmd: 'GmTriggerSymptomAction', main: 'BuffConfigId', opts: BUFFS, in: [{ f: 'AutoAddBuff', l: 'add the buff if missing', t: 'bool', v: true }] },
    'survivor|Fill reinforce layers': { cmd: 'GmFillReinforceLayer', main: 'BuffId', in: [{ f: 'SlotTypeId', l: 'which', opts: SLOT }, { f: 'Layers', l: 'layers (blank = max)', v: '' }] },
    'survivor|Add talent': { cmd: 'AddTalent', main: 'TalentConfigId', opts: named(X.talents), in: [{ f: 'TalentCount', l: 'level', v: 1 }] },
    'survivor|Activate daily plan': { cmd: 'SetSurvivalPlan', main: 'TalentId', opts: named(X.plans) },
    'survivor|Proficiency': { cmd: 'AddProficiencyLevel', main: 'ProficiencyTypeId', opts: PROF, in: [{ f: 'Delta', l: 'levels', v: 10 }] },
    'survivor|Add proficiency exp': { cmd: 'AddProficiencyExp', main: 'Amount', in: [{ f: 'ProficiencyTypeId', l: 'skill', opts: PROF }] },
    'survivor|Add proficiency levels': { cmd: 'AddProficiencyLevel', main: 'Delta', in: [{ f: 'ProficiencyTypeId', l: 'skill', opts: PROF }] },
    'survivor|Add faith points': { cmd: 'AddFaithPoint', main: 'Amount', raw: { Amount: 'int' } },
    'survivor|Auto behaviour': { cmd: 'TriggerAutoBehavior', opts: [['Eat', { BehaviorType: 1 }], ['Sleep', { BehaviorType: 2 }], ['Nap', { BehaviorType: 2, Variant: 1 }], ['Play games', { BehaviorType: 3 }], ['Leisure (random)', { BehaviorType: 4 }], ['Wellness (random)', { BehaviorType: 5 }], ['Use the toilet', { BehaviorType: 6 }]] },
    'survivor|Run an action by id': { cmd: 'PlayerAction', main: 'ActionId', in: [{ f: 'TargetId', l: 'target id', v: '' }, { f: 'SkipMoving', l: 'skip walking', t: 'bool', v: false }] },
    'survivor|Break the current action': { cmd: 'BreakAgentAction' },
    'survivor|Clear the action queue': { cmd: 'ClearAgentAction' },
    'survivor|Real death': { cmd: 'GmForceGameOver', fix: { Result: 0, UseRealDeathChain: true }, risky: true },
    'survivor|Force game over': { cmd: 'GmForceGameOver', main: 'Result', opts: RESULT, in: [{ f: 'ConfigId', l: 'ending event id', v: '' }], risky: true },
    'survivor|Set any attribute': { cmd: 'ChangeAttr', fix: { type: 0 }, main: 'attrKey', k: 'text', v: 'MoveSpeed_Ratio', in: [{ f: 'attrValue', l: 'value', v: 0.5 }] },
    'survivor|Max satiety': { attr: 'MaxSatiety' },
    'survivor|Max morale': { attr: 'MaxMorale' },
    'survivor|Max stamina': { attr: 'MaxStamina' },
    'survivor|Max life': { attr: 'MaxHealth' },
    'survivor|Stat drain': { attrs: DRAIN, opts: [['Normal', 0], ['Half', -0.5], ['None', -1]] },
    'survivor|Stat gain from food and rest': { attrs: GAIN, opts: [['Normal', 0], ['x1.5', 0.5], ['x2', 1], ['x3', 2]] },
    'survivor|Move speed': { attr: 'MoveSpeed_Ratio', pct: 100 },
    'survivor|Interact speed': { attr: 'FurnitureInteractSpeed_Ratio', pct: 100 },
    'survivor|Clear every debuff': { act: 'debuffs' },

    // ---------- money ----------
    'money|Set money': Object.assign(ps('setmoney'), { main: 'Value' }),
    'money|Buy everything in this shop': Object.assign(ps('buyshopall'), { in: [{ f: 'ShopId', l: 'shop id', v: '' }] }),
    'money|Search every container here': ps('searchall'),
    'money|Grab the ground loot': Object.assign(ps('groundloot'), { in: [{ f: 'Force', l: 'again', t: 'bool', v: false }] }),
    'money|Run the rush sale': Object.assign(ps('rush'), { in: [{ f: 'Force', l: 'again', t: 'bool', v: false }] }),
    'money|Buy a vehicle': Object.assign(ps('buyvehicle'), { in: [{ f: 'Id', l: 'grade', v: 1 }] }),
    'money|Sell the vehicle': ps('sellvehicle'),
    'money|Pawn furniture': Object.assign(ps('pawn'), { in: [{ f: 'InstanceIds', l: 'furniture', live: 'furniture' }] }),
    'money|Reset the GM ledger': ps('resetledger'),
    'money|Buy one item': Object.assign(ps('buyitem'), { main: 'Id', in: [{ f: 'ShopId', l: 'shop id', v: '' }, { f: 'Count', l: 'count', v: 1 }] }),
    'money|Buy one piece of furniture': Object.assign(ps('buyfurniture'), { main: 'Id', in: [{ f: 'ShopId', l: 'shop id', v: '' }, { f: 'Count', l: 'count', v: 1 }] }),
    'money|Grant an item': Object.assign(ps('grantitem'), { main: 'Id', in: [{ f: 'Count', l: 'count', v: 1 }] }),
    'money|Search one container': Object.assign(ps('searchcontainer'), { in: [{ f: 'Id', l: 'container', live: 'furniture' }, { f: 'Force', l: 'again', t: 'bool', v: false }] }),
    'money|Search this whole scene': Object.assign(ps('searchscene'), { in: [{ f: 'MapPointId', l: 'map point (blank = here)', v: '' }] }),
    'money|Trade point relation (Casual)': { cmd: 'GmCasualDebug', fix: { Op: 'relation' }, main: 'B', in: [{ f: 'A', l: 'trade point id', v: 1 }] },
    'money|Clear daily deal limits': { cmd: 'GmClearDailyCd', d: 'The game clears deal limits together with every other daily limit; it has no deal-only clear.' },
    'money|Every trader comes back now': aid('returnnow'),
    'money|Clear loan shark debt': { act: 'loan-clear' },
    'money|Loan cap bonus': { attr: 'LoanMaxBonus' },
    'money|Shop discount': { attr: 'SettlementBuyDiscount_Ratio', pct: 0 },

    // ---------- time ----------
    'time|Set the day counter': { cmd: 'GmSetGameDay', main: 'Day' },
    'time|Time-of-day light': { cmd: 'GmSetLightType', main: 'Type', opts: [['Dawn', 1], ['Day', 2], ['Dusk', 3], ['Night', 4]], in: [{ f: 'Snap', l: 'instant', t: 'bool', v: true }] },
    'time|Instant light change': { cmd: 'GmSetLightType', main: 'Snap', in: [{ f: 'Type', l: 'light', opts: [['Dawn', 1], ['Day', 2], ['Dusk', 3], ['Night', 4]] }] },
    'time|Freeze the clock': { hold: 'clock' },
    'time|Skip to a time of day': { act: 'skipto', main: 'hour', opts: [['Morning 07:00', 7], ['Noon 12:00', 12], ['Evening 18:00', 18], ['Night 22:00', 22]] },
    'items|Never spoil': { hold: 'nospoil' },
    'items|Make all food fresh': { act: 'fresh' },

    // ---------- home ----------
    'home|Install furniture in a slot': { cmd: 'QuickInstallFurniture', main: 'FurnitureConfigId', in: [{ f: 'SlotName', l: 'slot name', t: 'text', v: '' }, { f: 'Overwrite', l: 'replace what is there', t: 'bool', v: true }] },
    'home|Install a preset layout': { cmd: 'QuickInstallPreset', in: [{ f: 'Items', l: 'items (JSON list of {FurnitureConfigId, SlotName})', t: 'text', v: '' }] },
    'home|Clear a slot': { cmd: 'GmClearSlotFurniture', main: 'SlotName', k: 'text', v: '' },
    'home|Repair all doors and windows': { cmd: 'FillFurnitureDurability', in: [{ f: 'SlotTypeId', l: 'which', opts: SLOT }] },
    'home|Fill every reinforce layer': { cmd: 'GmFillReinforceLayer', in: [{ f: 'SlotTypeId', l: 'which', opts: SLOT }] },
    'home|Force-break shields': { cmd: 'GmBreakFurnitureShield', in: [{ f: 'SlotTypeId', l: 'which', opts: SLOT }] },
    'home|Play the home build timelapse': { cmd: 'PlayHomeBuildTimelapse' },
    'home|Play the room timelapse': { cmd: 'PlayRoomTimelapse', in: [{ f: 'RoomId', l: 'room id', v: '' }] },
    'home|Play the storage fill timelapse': { cmd: 'PlayRoomStorageFillTimelapse', in: [{ f: 'RoomId', l: 'room id', v: '' }] },
    'home|Free build': { act: 'freebuild', main: 'on' },
    'home|Clear every furniture cooldown': { cmd: 'GmClearDailyCd', d: 'The game clears furniture cooldowns together with every other daily limit.' },
    'home|Force a rat visit': { cmd: 'GmRatVisitMark', d: 'Puts one rat in every storage bag the survivor\'s home has.' },
    'home|Infinite power': { hold: 'power' },
    'home|Repair all furniture': { act: 'repairall' },
    'home|Instant crafting, cooking, brewing': { hold: 'instant', d: 'Finishes running shredders, compressors, brewers, dye vats, stoves and drone trips. Workbench crafting is not covered.' },

    // ---------- farm ----------
    'farm|Scan': plant('scan'),
    'farm|Show claims': plant('claims'),
    'farm|Do an action': plant('do', { k: 'btn', in: [robot, pot], d: 'The robot does the job the pot needs now: plant, water, weed, fertilize or harvest.' }),
    'farm|Preset': plant('preset', { main: 'Tier', opts: [['Small pot', 0], ['Medium pot', 1], ['Large pot', 2]], in: [robot, { f: 'SeedId', l: 'seed item id', v: '' }] }),
    'farm|Release claims': plant('release'),
    'farm|Mature one pot': { act: 'mature', main: 'pot', live: 'pots' },
    'farm|Force an anomaly': { act: 'anomaly', main: 'kind', opts: [['Pests', 1], ['Weeds', 2], ['Drought', 4]], in: [{ f: 'pot', l: 'pot', live: 'pots' }] },
    'farm|Mature every plant': { act: 'mature' },
    'farm|Water and fertilize all': { act: 'tend' },
    'farm|Spawn a robot': { cmd: 'GmRobotSpawn', main: 'ConfigId', opts: [['Tidying robot', 2003], ['Planting robot', 2004], ['Planting robot (large)', 2005]], in: [{ f: 'DockId', l: 'dock id (blank = any)', v: '' }] },
    'farm|Fill its bag': { cmd: 'GmRobotBagFill', main: 'ItemConfigId', in: [robot, { f: 'Count', l: 'count', v: 10 }] },
    'farm|Master switch': { cmd: 'GmRobotMaster', main: 'Value', opts: [['On', 1], ['Off', 0]] },
    'farm|Fake a state': { cmd: 'GmRobotFakeState', opts: [['Idle, full battery', { Battery: 100, BatteryMax: 100, MasterOn: 1, GroundOn: 1, IsCharging: 0 }], ['Low battery', { Battery: 5, BatteryMax: 100, MasterOn: 1, GroundOn: 1, IsCharging: 0 }], ['Charging', { Battery: 40, BatteryMax: 100, MasterOn: 1, GroundOn: 1, IsCharging: 1 }], ['Switched off', { Battery: 100, BatteryMax: 100, MasterOn: 0, GroundOn: 0, IsCharging: 0 }]], in: [robot] },
    'farm|Queue a trip': { cmd: 'GmRobotTrip', in: [{ f: 'SrcId', l: 'from', live: 'furniture' }, { f: 'DstId', l: 'to', live: 'furniture' }, { f: 'Items', l: 'items (blank = all)', t: 'text', v: '' }], d: 'From a container to a container. Turn on Trip stub first, or nothing reads the trip.' },
    'farm|Give a module': { cmd: 'GmRobotModule', fix: { Op: 'give' }, main: 'ItemId', opts: named(X.modules) },
    'farm|Install': { cmd: 'GmRobotModule', fix: { Op: 'install' }, main: 'ItemId', opts: named(X.modules), in: [robot, { f: 'Slot', l: 'slot', v: '' }] },
    'farm|Uninstall': module('uninstall'),
    'farm|Dump modules': module('dump'),
    'farm|Clear all slots': module('clear'),
    'farm|List robots and talk state': talk('list'),
    'farm|Say a line': talk('say', { main: 'Text', k: 'text', v: 'Hello', in: [robot, { f: 'Duration', l: 'seconds', v: 4 }] }),
    'farm|Reset talk cooldowns': talk('reset'),
    'farm|Force a robot meeting': talk('scene'),
    'farm|Scan robot containers': { cmd: 'GmRobotContainerSwitch', fix: { Op: 'scan' } },
    'farm|Watch container changes': { cmd: 'GmRobotContainerSwitch', fix: { Op: 'watch' }, flip: true },
    'farm|Plan the robots\' jobs': plan('plan'),
    'farm|Show job claims': plan('claims'),
    'farm|Mark work as dirty': plan('dirty'),
    'farm|Release job claims': plan('release'),
    'farm|Switch a robot\'s job': plan('switch', { k: 'btn', in: [{ f: 'FurnitureId', l: 'container', live: 'furniture' }, { f: 'Put', l: 'robots store here', opts: [['Yes', 1], ['No', 0]] }, { f: 'Take', l: 'robots take from here', opts: [['Yes', 1], ['No', 0]] }], d: 'Sets whether robots store into and take from one container.' }),

    // ---------- danger ----------
    'danger|Start a wave': { cmd: 'GmTowerWaveStart', in: [{ f: 'WaveEventId', l: 'wave event', opts: (X.waves || []).filter((w) => w[0] > 0).map((w) => [`${w[1]} (${w[0]})`, w[0]]) }, { f: 'TotalBudget', l: 'budget', v: '' }, { f: 'SpawnIntervalSeconds', l: 'seconds per zombie', v: '' }], risky: true },
    'danger|Force the wave state': { cmd: 'GmTowerWaveSetState', main: 'State', opts: [['Idle', 0], ['Spawning', 1], ['Final charge', 2], ['Retreat', 3]] },
    'danger|Spawn zombies': { cmd: 'GmTowerZombieSpawn', main: 'Count', in: [{ f: 'ZombieTypeId', l: 'type', opts: (X.ztype || []).map((z) => [`${z[3]} (${z[0]}, hp ${z[1]}, attack ${z[2]})`, z[0]]) }], risky: true },
    'danger|Remove a defence device': { cmd: 'GmTowerDeviceRemove', main: 'SlotName', k: 'text', v: '', d: 'By slot name; blank removes any one.' },
    'danger|Start a horde wave': { cmd: 'GmEndlessWaveStart', main: 'Tier', opts: [1, 2, 3, 4, 5].map((t) => ['Tier ' + t, t]), in: [{ f: 'DaySlot', l: 'day slot (0 = mid wave)', v: 0 }], risky: true },
    'danger|Start a crisis': { cmd: 'GmEndlessCrisis', main: 'PoolRowId', k: 'sel', opts: (X.crisis || []).map((c) => [`Row ${c[0]}: event ${c[1]}, ${c[2]} days`, c[0]]), fix: { Close: false } },
    'danger|End every crisis': { cmd: 'GmEndlessCrisis', fix: { Close: true } },
    'danger|Show an endless banner': { cmd: 'GmPlayEndlessBanner', main: 'BannerType', k: 'num', v: 1, in: [{ f: 'P1', l: 'p1', v: '' }, { f: 'P2', l: 'p2', v: '' }] },
    'danger|Close every zombie timeline': { cmd: 'GmToggleDateTimeline', fix: { ConfigId: 0, Active: false } },
    'danger|Peaceful mode': { hold: 'peaceful' },

    // ---------- explore ----------
    'explore|Flashlight zoom': { cmd: 'GmFlashlightTune', opts: [['Narrow beam', { Focus: 1 }], ['Middle', { Focus: 0.5 }], ['Wide beam', { Focus: 0 }], ['Show the settings', { Query: true }], ['Back to the game\'s', { Reset: true }]] },
    'explore|Simulate a search run': { cmd: 'GmExploreAutoSearch', in: [{ f: 'BudgetPercent', l: 'budget %', v: 100 }] },
    'explore|Run it': { cmd: 'GmExploreAutoSearch', in: [{ f: 'BudgetPercent', l: 'budget %', v: 100 }] },
    'explore|Reset warehouse rescue for today': { cmd: 'GmClearDailyCd', d: 'The game resets it together with every other daily limit.' },
    'explore|Add exposure': { act: 'exposure', main: 'value', u: 'points', d: 'Raw exposure points while exploring. Reaching the maximum ends the run.' },
    'explore|Instant travel': { attr: 'VehicleTravelTimeReduce_Ratio', on: 1, off: 0 },
    'explore|No fuel use': { hold: 'nofuel' },
    'explore|Container contents preview': { act: 'containers' },
    'explore|Mark containers unsearched': { act: 'unsearch' },
    'progress|Unlock every recipe and blueprint': { act: 'recipes' },
    'debug|Show hovered id': { hold: 'hover' },
    'debug|Mod health': { act: 'health' },
    'debug|Fill every trap': { act: 'traps' },
    'debug|Bring the basket back': { act: 'basket' },
    'debug|Test toast': { act: 'toast', main: 'kind', opts: [['Game short text', 'game'], ['Info', 'info'], ['Success', 'success'], ['Warning', 'warning'], ['Error', 'error']], in: [{ f: 'text', l: 'text', t: 'text', v: 'Test toast from Cheat Menu' }] },

    // ---------- people ----------
    'people|Force a wish': { cmd: 'GenerateWish', main: 'WishId', k: 'sel', opts: [['Next wish', 0]].concat(named(X.wishes)) },
    'people|Send an NPC somewhere': { cmd: 'GmNpcGoto', k: 'btn', in: [{ f: 'NpcId', l: 'npc instance id', v: '' }, { f: 'TargetId', l: 'to furniture', live: 'furniture' }, { f: 'TargetMapId', l: 'or floor map id', v: '' }] },
    'people|Send a commission': { cmd: 'GmCommission', fix: { Op: 'send' }, in: [{ f: 'Contact', l: 'contact', opts: [['Least recent ally', 0]].concat(named(X.contacts)) }] },
    'people|Commission snapshot': { cmd: 'GmCommission', fix: { Op: 'query' } },
    'people|Open the platform': aid('open'),
    'people|Create a request': aid('create'),
    'people|Accept': aid('accept', { in: [{ f: 'Value', l: 'request id', v: '' }] }),
    'people|Complete': aid('complete', { in: [{ f: 'Value', l: 'request id', v: '' }] }),
    'people|Set done count': aid('setdone', { main: 'Value' }),
    'people|Settle': aid('settle'),
    'people|Platform snapshot': aid('query'),
    'people|Reply to a text': { cmd: 'TestPhoneReply', main: 'OptionId', opts: [['Option 1', 1], ['Option 2', 2], ['Option 3', 3]], in: [{ f: 'ContactId', l: 'contact', opts: named(X.contacts) }] },
    'people|Push a group chat post': { cmd: 'GossipForcePush', main: 'SmsId', in: [{ f: 'ResetSpoke', l: 'forget replies', t: 'bool', v: false }] },
    'people|Shift the neglect clock': probe('shiftneglectanchor', { main: 'Value' }),
    'people|Shift the tier clock': probe('shifttieranchor', { main: 'Value' }),
    'people|Set survival tier': probe('settier', { main: 'Value', opts: [0, 1, 2, 3, 4].map((t) => [String(t), t]) }),
    'people|Ally with everyone': { act: 'ally' },
    'people|Ally with a contact': { act: 'allyone', main: 'contact', k: 'sel', opts: named(X.contacts) },

    // ---------- story ----------
    'story|Skip the opening': { cmd: 'SkipOpeningTimeline', also: ['SkipOpeningBlackScreen'] },
    'story|Play a timeline': { cmd: 'PlayTimeline', opts: [['Opening', { Kind: 'opening' }], ['Disaster', { Kind: 'zaibian' }], ['Scene', { Kind: 'scene' }], ['Wake-up', { Kind: 'awaken' }], ['Wake-up: dream layer', { Kind: 'awaken', Name: 'dream' }], ['Wake-up: camera layer', { Kind: 'awaken', Name: 'camera' }], ['Stop wake-up', { Kind: 'stop', Name: 'stop' }]], in: [{ f: 'Name', l: 'timeline name', t: 'text', v: '' }] },
    'story|Toggle a date timeline': { cmd: 'GmToggleDateTimeline', main: 'ConfigId', k: 'sel', opts: (X.dtl || []).map((d) => [`${d[1]} (${d[0]}, day ${d[2]})`, d[0]]), in: [{ f: 'Active', l: 'on', t: 'bool', v: true }] },
    'story|Force game over': { cmd: 'GmForceGameOver', main: 'Result', opts: RESULT, in: [{ f: 'ConfigId', l: 'ending event id', v: '' }, { f: 'UseRealDeathChain', l: 'real death', t: 'bool', v: false }], risky: true },
    'story|Write a day snapshot now': { cmd: 'RebirthSnap', in: [{ f: 'Day', l: 'day (blank = today)', v: '' }] },
    'story|Set rebirth state': { cmd: 'RebirthSetState', main: 'ChancesUsed', opts: [['0 used', 0], ['1 used', 1], ['2 used', 2], ['3 used', 3]], in: [{ f: 'FaithPoint', l: 'faith points', v: '' }, { f: 'HpPenaltyStacks', l: 'life penalty stacks', v: '' }], risky: true },
    'story|Minor rebirth': { cmd: 'RebirthMinor', main: 'DaysBack', in: [{ f: 'Force', l: 'skip the checks', t: 'bool', v: false }], risky: true },
    'story|Restart this loop': { cmd: 'RebirthRestart', in: [{ f: 'Force', l: 'skip the checks', t: 'bool', v: false }], risky: true },
    'story|Step the current event': { pulse: 'eventstep', d: 'Lets the game step the open event once.' },
    'story|Pick a choice for me': { act: 'event-choice', in: [{ f: 'event', l: 'event', live: 'events' }] },
    'story|End it with a result': { act: 'event-end', in: [{ f: 'event', l: 'event', live: 'events' }] },
    'story|Reset the event': { act: 'event-reset', in: [{ f: 'event', l: 'event', live: 'events' }] },

    // ---------- progress ----------
    'progress|Unlock a survivor': { cmd: 'UnlockPlayerSelect', main: 'PlayerSelectId', raw: { PlayerSelectId: 'int', Revoke: 'bool' }, opts: PS.concat([['All', '*']]), fix: { Revoke: false } },
    'progress|Revoke a survivor': { cmd: 'UnlockPlayerSelect', main: 'PlayerSelectId', raw: { PlayerSelectId: 'int', Revoke: 'bool' }, opts: PS, fix: { Revoke: true } },
    'progress|Unlock for endless': { cmd: 'UnlockPlayerSelect', main: 'PlayerSelectId', raw: { PlayerSelectId: 'int', Revoke: 'bool' }, opts: PS.concat([['All', '*']]), fix: { Revoke: false }, d: 'The game unlocks a survivor for endless when it unlocks them; takes effect back on the main menu.' },
    'progress|Set alert level': { cmd: 'GmCasualDebug', fix: { Op: 'alert' }, main: 'A', k: 'sel', opts: [0, 1, 2, 3].map((t) => [String(t), t]) },
    'progress|Reroll camp orders': { cmd: 'GmCasualDebug', fix: { Op: 'repost' } },
    'progress|Check home milestones now': { cmd: 'GmCasualHome', fix: { Op: 'check' } },
    'progress|Unlock every achievement': ach('unlockall', { risky: true }),
    'progress|Unlock one': ach('unlock', { main: 'Id', opts: named(X.ach) }),
    'progress|Clear unlocked list': ach('clear'),
    'progress|Record an ending': ach('ending', { in: [{ f: 'Id', l: 'ending id', v: '' }, { f: 'PlayerSelectId', l: 'survivor', opts: PS }] }),
    'progress|Taboo list': { cmd: 'GmAchievementTaboo', opts: [['List', { Op: 'list' }], ['Set one on', { Op: 'set', Value: true }], ['Set one off', { Op: 'set', Value: false }], ['Clear all', { Op: 'clearall' }]], k: 'sel', in: [{ f: 'Key', l: 'taboo key', t: 'text', v: '' }] },
    'progress|Achievement stats': ach('list'),
    'progress|Recheck counters': { cmd: 'GmSetGameCounter', fix: { Value: 0, IsDelta: true }, main: 'Name', k: 'text', v: '', d: 'Adds 0 to a counter by name, which makes the game recheck the achievements on it.' },
    'progress|Set a symbol': { cmd: 'SetSymbol', main: 'Name', k: 'text', v: '', in: [{ f: 'Value', l: 'on', t: 'bool', v: true }] },
    'progress|Set a game counter': { cmd: 'GmSetGameCounter', main: 'Value', in: [{ f: 'Name', l: 'counter name', t: 'text', v: '' }, { f: 'IsDelta', l: 'add instead of set', t: 'bool', v: false }] },
    'progress|Add a tag': { cmd: 'AddTag', main: 'Tag', k: 'text', v: '' },
    'progress|Remove a tag': { cmd: 'RemoveTag', main: 'Tag', k: 'text', v: '' },

    // ---------- saves ----------
    'saves|Back up the current save': { cmd: 'BackupSave', in: [{ f: 'FileName', l: 'save', live: 'saves' }, { f: 'BackupName', l: 'backup name', t: 'text', v: '' }] },
    'saves|Delete a save': { cmd: 'DeleteGameSave', in: [{ f: 'FileName', l: 'save', live: 'saves' }], risky: true },
    'saves|Convert a save to bytes': { cmd: 'ConvertSaveToBytes', in: [{ f: 'FileName', l: 'save', live: 'saves' }] },
    'saves|Load a backup': { cmd: 'InjectSave', fix: { LoadAfterInject: true }, in: [{ f: 'BackupName', l: 'backup', live: 'backups' }], risky: true },
    'saves|Delete a backup': { cmd: 'DeleteBackup', in: [{ f: 'FileNameOnDisk', l: 'backup', live: 'backups', pickFile: true }] },
    'saves|Write a day snapshot': { cmd: 'RebirthSnap', in: [{ f: 'Day', l: 'day (blank = today)', v: '' }] },
    'saves|Back up before every risky cheat': { page: 'riskybackup' },

    // ---------- debug ----------
    'debug|Survivor attributes': { cmd: 'SelectCharacter', fix: { id: -1 }, d: 'Every attribute with its value and source, for the survivor.' },
    'debug|NPC attributes': { cmd: 'SelectCharacter', main: 'id', k: 'num', v: '', d: 'By character instance id.' },
    'debug|Furniture attributes': { cmd: 'SelectCharacter', main: 'id', live: 'furniture', k: 'sel' },
    'debug|Nearby furniture': { cmd: 'NearbyFurniture', in: [{ f: 'Radius', l: 'radius', v: 5 }] },
    'debug|Neighbour line probe': { cmd: 'GmNeighborLineProbe', fix: { Op: 'query' }, each: LINES },
    'debug|What UI is under the cursor': { cmd: 'GmProbeUiBlock', in: [{ f: 'X', l: 'x', v: '' }, { f: 'Y', l: 'y', v: '' }] },
    'debug|WebUI page rectangles': { cmd: 'GmProbeUiBlock', fix: { X: -1, Y: -1 } },
    'debug|Click pipeline state': { cmd: 'GmProbeUiBlock', fix: { X: -2, Y: -2 } },
    'debug|Forward Debug.Log here': { cmd: 'GmSetDebugLogForward', main: 'Prefixes', k: 'text', v: '[', d: 'Copies Unity log lines that start with one of these comma-separated prefixes into the game log. Send it empty to stop.' },
    'debug|Loading profiler': { cmd: 'GmLoadingProfiler', main: 'Enabled' },
    'debug|Simulate a cheat detection': { cmd: 'GmSimulateCheatEvidence', in: [{ f: 'Type', l: 'type', v: 1 }] },
    'debug|Diagnose a condition set': { cmd: 'DiagnoseConditionSet', in: [{ f: 'ConditionSetId', l: 'condition set id', v: '' }, { f: 'ContextFurnitureId', l: 'furniture', live: 'furniture' }] },
    'debug|List UI action types': { cmd: 'ListActionTypes', in: [{ f: 'Filter', l: 'filter', t: 'text', v: '' }] },
    'debug|Dispatch a UI action': { cmd: 'DispatchAction', main: 'ActionTypeName', k: 'text', v: '', in: [{ f: 'Payload', l: 'payload JSON', t: 'text', v: '' }] },
    'debug|UI permissions': { cmd: 'Permissions', in: [{ f: 'IsDynamicEventOpen', l: 'events', t: 'bool', v: true }, { f: 'IsThinkingOpen', l: 'thinking', t: 'bool', v: true }, { f: 'IsNoPower', l: 'no power', t: 'bool', v: false }] },
    'debug|Scene: switch the main menu scene': { cmd: 'GmSwitchMainMenuScene', main: 'PlayerSelectId', opts: PS },
    'debug|Scene: reload the 3D menu': { cmd: 'GmSwitchMainMenuScene', main: 'PlayerSelectId', k: 'sel', opts: PS, d: 'Loads the 3D menu again with one survivor\'s scene. Main menu only.' },
    'debug|Buff list': { act: 'list', fix: { of: 'buffs' } },
    'debug|Companion and rescue snapshot': { act: 'snapshot' },
    'debug|Furniture tag probe': { cmd: 'GmRobotContainerSwitch', fix: { Op: 'probe' }, main: 'FurnitureId', k: 'sel', live: 'furniture', in: [{ f: 'ItemConfigId', l: 'item id', v: '' }] },
    'debug|Character behaviour': { readout: 'ReportAIStatus' },
    'debug|Sense test': { readout: 'TestSense' }
  };

  // Rows whose words were wrong for what the game does.
  Object.assign(window.RETAG, {
    'home|Clear rat marks': { s: 'X', d: 'The game has no clear on its own: Put a rat in every storage clears the old marks first.' }
  });
})();
