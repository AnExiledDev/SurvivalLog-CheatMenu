// Every GM command the game's handler reads: its msgHead and the fields of its message, in game build 1.1.19611.
window.SCHEMA = {
"SelectCharacter": {
"id": 2,
"f": [
[
"long",
"id"
]
],
"cls": true
},
"ChangeAttr": {
"id": 6,
"f": [
[
"string",
"attrKey"
],
[
"float",
"attrValue"
],
[
"int",
"type"
]
],
"cls": true
},
"RemoveBuff": {
"id": 8,
"f": [
[
"long",
"buffId"
]
],
"cls": true
},
"AddBuff": {
"id": 9,
"f": [
[
"int",
"buffConfigId"
]
],
"cls": true
},
"AddAura": {
"id": 11,
"f": [],
"cls": false
},
"RemoveAura": {
"id": 12,
"f": [],
"cls": false
},
"AddDj": {
"id": 15,
"f": [],
"cls": false
},
"Permissions": {
"id": 17,
"f": [
[
"bool",
"IsDynamicEventOpen"
],
[
"bool",
"IsThinkingOpen"
],
[
"bool",
"IsNoPower"
]
],
"cls": true
},
"AddItem": {
"id": 20,
"f": [
[
"int",
"ItemConfigId"
],
[
"int",
"Count"
],
[
"string",
"RequestId"
]
],
"cls": true
},
"TriggerEvent": {
"id": 21,
"f": [
[
"int",
"EventConfigId"
]
],
"cls": true
},
"AddTalent": {
"id": 22,
"f": [
[
"int",
"TalentConfigId"
],
[
"int",
"TalentCount"
]
],
"cls": true
},
"AddTag": {
"id": 23,
"f": [
[
"string",
"Tag"
]
],
"cls": true
},
"RemoveTag": {
"id": 24,
"f": [
[
"string",
"Tag"
]
],
"cls": true
},
"ClearStoredPower": {
"id": 25,
"f": [],
"cls": true
},
"AddBagFurniture": {
"id": 26,
"f": [
[
"int",
"FurnitureConfigId"
]
],
"cls": true
},
"SkipTimeline": {
"id": 27,
"f": [],
"cls": true
},
"SkipToPostDisaster": {
"id": 28,
"f": [],
"cls": true
},
"SetSurvivalPlan": {
"id": 29,
"f": [
[
"int",
"TalentId"
]
],
"cls": true
},
"SkipToPreDailyPlanning": {
"id": 30,
"f": [],
"cls": true
},
"SkipDays": {
"id": 31,
"f": [
[
"int",
"Days"
]
],
"cls": true
},
"SetWeather": {
"id": 32,
"f": [
[
"int",
"WeatherConfigId"
]
],
"cls": true
},
"ResetWeather": {
"id": 33,
"f": [],
"cls": false
},
"DispatchAction": {
"id": 34,
"f": [
[
"string",
"ActionTypeName"
],
[
"string",
"Payload"
],
[
"string",
"RequestId"
]
],
"cls": true
},
"ListActionTypes": {
"id": 35,
"f": [
[
"string",
"RequestId"
],
[
"string",
"Filter"
]
],
"cls": true
},
"PlayerAction": {
"id": 38,
"f": [
[
"long",
"AgentId"
],
[
"int",
"ActionId"
],
[
"long",
"TargetId"
],
[
"float",
"TargetPosX"
],
[
"float",
"TargetPosY"
],
[
"float",
"TargetPosZ"
],
[
"float",
"RotationY"
],
[
"long",
"OpenSelectShowId"
],
[
"bool",
"SkipMoving"
],
[
"string",
"RequestId"
]
],
"cls": true
},
"BreakAgentAction": {
"id": 39,
"f": [
[
"long",
"AgentId"
],
[
"string",
"RequestId"
]
],
"cls": true
},
"ClearAgentAction": {
"id": 40,
"f": [
[
"long",
"AgentId"
],
[
"string",
"RequestId"
]
],
"cls": true
},
"NearbyFurniture": {
"id": 42,
"f": [
[
"string",
"RequestId"
],
[
"float",
"Radius"
],
[
"string",
"FilterButton"
]
],
"cls": true
},
"ListGameSaves": {
"id": 44,
"f": [],
"cls": true
},
"ListBackups": {
"id": 45,
"f": [],
"cls": true
},
"BackupSave": {
"id": 46,
"f": [
[
"string",
"FileName"
],
[
"string",
"BackupName"
]
],
"cls": true
},
"InjectSave": {
"id": 47,
"f": [
[
"string",
"BackupName"
],
[
"bool",
"LoadAfterInject"
]
],
"cls": true
},
"SetGameSpeed": {
"id": 52,
"f": [
[
"float",
"Scale"
]
],
"cls": true
},
"AddProficiencyExp": {
"id": 53,
"f": [
[
"int",
"ProficiencyTypeId"
],
[
"int",
"Amount"
]
],
"cls": true
},
"FillFurnitureDurability": {
"id": 54,
"f": [
[
"int",
"SlotTypeId"
]
],
"cls": true
},
"BypassEnterExplore": {
"id": 55,
"f": [
[
"int",
"MapPointId"
]
],
"cls": true
},
"GenerateWish": {
"id": 56,
"f": [
[
"int",
"WishId"
]
],
"cls": true
},
"DiagnoseConditionSet": {
"id": 59,
"f": [
[
"string",
"RequestId"
],
[
"int",
"ConditionSetId"
],
[
"long",
"ContextFurnitureId"
]
],
"cls": true
},
"AddProficiencyLevel": {
"id": 61,
"f": [
[
"int",
"ProficiencyTypeId"
],
[
"int",
"Delta"
]
],
"cls": true
},
"SkipToDisasterImminent": {
"id": 62,
"f": [],
"cls": true
},
"DeliverSMS": {
"id": 63,
"f": [
[
"int",
"SMSId"
]
],
"cls": true
},
"AutoConfirmEvents": {
"id": 64,
"f": [],
"cls": true
},
"SkipDailySettlement": {
"id": 65,
"f": [],
"cls": false
},
"LockCharacterAttr": {
"id": 66,
"f": [],
"cls": false
},
"LockFurnitureDurability": {
"id": 67,
"f": [],
"cls": false
},
"MarkMetNpc": {
"id": 68,
"f": [
[
"int",
"NpcConfigId"
]
],
"cls": true
},
"CodexUnlockAll": {
"id": 69,
"f": [],
"cls": true
},
"CodexClearAll": {
"id": 70,
"f": [],
"cls": true
},
"CodexRandomUnlock": {
"id": 71,
"f": [
[
"int",
"Percent"
]
],
"cls": true
},
"TriggerNeighborMonologue": {
"id": 72,
"f": [
[
"int",
"MoodType"
],
[
"string",
"Text"
]
],
"cls": true
},
"AddNeighborRescueProgress": {
"id": 73,
"f": [
[
"int",
"Delta"
]
],
"cls": true
},
"TestOldClassTrade": {
"id": 74,
"f": [],
"cls": true
},
"TestPhoneReply": {
"id": 75,
"f": [
[
"int",
"ContactId"
],
[
"int",
"OptionId"
]
],
"cls": true
},
"AddNeighborAffinity": {
"id": 76,
"f": [
[
"int",
"Delta"
]
],
"cls": true
},
"ApplyTestSuite": {
"id": 77,
"f": [
[
"bool",
"autoConfirmEvents"
]
],
"cls": true
},
"TriggerAutoBehavior": {
"id": 79,
"f": [
[
"int",
"BehaviorType"
],
[
"int",
"Variant"
]
],
"cls": true
},
"AutoCompleteEvents": {
"id": 81,
"f": [],
"cls": true
},
"SkipOpeningTimeline": {
"id": 82,
"f": [],
"cls": true
},
"PlayTimeline": {
"id": 83,
"f": [
[
"string",
"Kind"
],
[
"string",
"Name"
]
],
"cls": true
},
"QuickInstallFurniture": {
"id": 84,
"f": [
[
"int",
"FurnitureConfigId"
],
[
"string",
"SlotName"
],
[
"bool",
"Overwrite"
],
[
"int",
"DyeSlot"
]
],
"cls": true
},
"QuickInstallPreset": {
"id": 85,
"f": [
[
"List<S2C_QuickInstallFurniture>",
"Items"
]
],
"cls": true
},
"GmAddGold": {
"id": 86,
"f": [
[
"int",
"Amount"
]
],
"cls": true
},
"GmAddCountDownTime": {
"id": 87,
"f": [
[
"int",
"Seconds"
]
],
"cls": true
},
"GmReturnAllHomePackages": {
"id": 88,
"f": [],
"cls": true
},
"GmClearMainBag": {
"id": 89,
"f": [],
"cls": true
},
"GmRestoreStoryUnread": {
"id": 90,
"f": [],
"cls": true
},
"GmAddBurden": {
"id": 91,
"f": [
[
"int",
"Amount"
]
],
"cls": true
},
"GmSetLightType": {
"id": 92,
"f": [
[
"int",
"Type"
],
[
"bool",
"Snap"
]
],
"cls": true
},
"GmQueryHomeSlots": {
"id": 93,
"f": [],
"cls": true
},
"GmClearSlotFurniture": {
"id": 95,
"f": [
[
"string",
"SlotName"
]
],
"cls": true
},
"AddFaithPoint": {
"id": 96,
"f": [],
"cls": false
},
"UnlockPlayerSelect": {
"id": 97,
"f": [],
"cls": false
},
"SkipOpeningBlackScreen": {
"id": 98,
"f": [],
"cls": true
},
"TriggerDemoTwoEnding": {
"id": 99,
"f": [],
"cls": true
},
"PlayHomeBuildTimelapse": {
"id": 100,
"f": [
[
"float",
"IntervalSeconds"
],
[
"float",
"ScaleDurationSeconds"
]
],
"cls": true
},
"PlayRoomTimelapse": {
"id": 101,
"f": [
[
"int",
"RoomId"
],
[
"float",
"IntervalSeconds"
],
[
"float",
"ScaleDurationSeconds"
],
[
"float",
"HoldSeconds"
]
],
"cls": true
},
"PlayRoomStorageFillTimelapse": {
"id": 102,
"f": [
[
"int",
"RoomId"
],
[
"float",
"HoldSeconds"
],
[
"float",
"StepSeconds"
],
[
"float",
"BetweenFurnitureSeconds"
]
],
"cls": true
},
"GmToggleDateTimeline": {
"id": 103,
"f": [
[
"int",
"ConfigId"
],
[
"bool",
"Active"
]
],
"cls": true
},
"GmClearDailyCd": {
"id": 104,
"f": [],
"cls": false
},
"GmTowerWaveStart": {
"id": 105,
"f": [
[
"int",
"WaveEventId"
],
[
"int",
"TotalBudget"
],
[
"float",
"SpawnIntervalSeconds"
],
[
"float",
"FinalChargeBudgetRatio"
],
[
"int",
"PeakFieldCap"
],
[
"List<int>",
"MutedSlotTypes"
]
],
"cls": true
},
"GmTowerWaveSetState": {
"id": 106,
"f": [
[
"int",
"State"
]
],
"cls": true
},
"GmTowerWaveQuery": {
"id": 107,
"f": [],
"cls": true
},
"GmTowerZombieSpawn": {
"id": 109,
"f": [
[
"int",
"ZombieTypeId"
],
[
"int",
"Count"
]
],
"cls": true
},
"GmTowerZombieKillAll": {
"id": 110,
"f": [],
"cls": true
},
"GmTowerZombieKillOne": {
"id": 111,
"f": [],
"cls": true
},
"GmTowerDeviceRemove": {
"id": 112,
"f": [
[
"string",
"SlotName"
]
],
"cls": true
},
"RightClickCopyFurnitureId": {
"id": 113,
"f": [],
"cls": false
},
"GmRaiseExploreCamera": {
"id": 114,
"f": [],
"cls": true
},
"LockExploreExposure": {
"id": 115,
"f": [],
"cls": false
},
"GmSetDebugLogForward": {
"id": 116,
"f": [
[
"string",
"Prefixes"
]
],
"cls": true
},
"GmFlushPlayModeLog": {
"id": 117,
"f": [],
"cls": true
},
"GmShowZombieDebugText": {
"id": 118,
"f": [],
"cls": false
},
"GmRatVisitMark": {
"id": 119,
"f": [],
"cls": false
},
"GmShowEnvDebug": {
"id": 120,
"f": [],
"cls": false
},
"DeleteGameSave": {
"id": 121,
"f": [
[
"string",
"FileName"
]
],
"cls": true
},
"DeleteBackup": {
"id": 122,
"f": [
[
"string",
"FileNameOnDisk"
]
],
"cls": true
},
"GmPlayEndlessBanner": {
"id": 124,
"f": [
[
"int",
"BannerType"
],
[
"int",
"P1"
],
[
"int",
"P2"
]
],
"cls": true
},
"GmSpawnSceneRat": {
"id": 125,
"f": [
[
"int",
"SceneRatConfigId"
]
],
"cls": true
},
"SetMinimapMode": {
"id": 126,
"f": [
[
"string",
"Mode"
]
],
"cls": true
},
"GmShowAudioSourceViz": {
"id": 127,
"f": [],
"cls": false
},
"OpenBackupsFolder": {
"id": 128,
"f": [],
"cls": false
},
"GossipForcePush": {
"id": 129,
"f": [
[
"int",
"SmsId"
],
[
"bool",
"ResetSpoke"
]
],
"cls": true
},
"SetSymbol": {
"id": 130,
"f": [
[
"string",
"Name"
],
[
"bool",
"Value"
]
],
"cls": true
},
"SetGroupAnger": {
"id": 131,
"f": [
[
"int",
"Value"
]
],
"cls": true
},
"AdvanceHours": {
"id": 132,
"f": [
[
"int",
"Hours"
]
],
"cls": true
},
"RebirthSnap": {
"id": 133,
"f": [
[
"int",
"Day"
]
],
"cls": true
},
"RebirthSetState": {
"id": 134,
"f": [
[
"int",
"ChancesUsed"
],
[
"int",
"FaithPoint"
],
[
"int",
"HpPenaltyStacks"
]
],
"cls": true
},
"RebirthMinor": {
"id": 135,
"f": [
[
"int",
"DaysBack"
],
[
"bool",
"Force"
]
],
"cls": true
},
"RebirthOpenChoice": {
"id": 136,
"f": [],
"cls": true
},
"GmShowShadowDebug": {
"id": 137,
"f": [],
"cls": false
},
"GmUnlockAllExploreScenes": {
"id": 138,
"f": [],
"cls": false
},
"GmEndlessWaveStart": {
"id": 139,
"f": [
[
"int",
"Tier"
],
[
"int",
"DaySlot"
]
],
"cls": true
},
"GmReviveOnDoorBreak": {
"id": 140,
"f": [],
"cls": false
},
"GmFlashlightTune": {
"id": 141,
"f": [
[
"float",
"Focus"
],
[
"float",
"AngleMin"
],
[
"float",
"AngleMax"
],
[
"float",
"IntensityAtWide"
],
[
"float",
"IntensityAtNarrow"
],
[
"float",
"RangeAtWide"
],
[
"float",
"RangeAtNarrow"
],
[
"float",
"DensityAtWide"
],
[
"float",
"DensityAtNarrow"
],
[
"float",
"BeamAngleRatio"
],
[
"float",
"BaseIntensityMul"
],
[
"float",
"BaseRangeMul"
],
[
"float",
"BeamDensityMul"
],
[
"float",
"PitchAtWide"
],
[
"float",
"PitchAtNarrow"
],
[
"bool",
"Reset"
],
[
"bool",
"Query"
]
],
"cls": true
},
"GmProbeUiBlock": {
"id": 142,
"f": [
[
"float",
"X"
],
[
"float",
"Y"
]
],
"cls": true
},
"GmForceDanceRecommend": {
"id": 143,
"f": [
[
"bool",
"Enable"
]
],
"cls": true
},
"GmForceGameOver": {
"id": 144,
"f": [
[
"int",
"Result"
],
[
"int",
"ConfigId"
],
[
"bool",
"UseRealDeathChain"
],
[
"int",
"DeathSourceType"
],
[
"int",
"DeathSourceId"
]
],
"cls": true
},
"GmSetGameDay": {
"id": 145,
"f": [
[
"int",
"Day"
],
[
"int",
"Delta"
]
],
"cls": true
},
"GmTriggerSymptomAction": {
"id": 146,
"f": [
[
"int",
"BuffConfigId"
],
[
"bool",
"AutoAddBuff"
]
],
"cls": true
},
"GmNeighborLineProbe": {
"id": 150,
"f": [
[
"string",
"Op"
],
[
"string",
"Line"
],
[
"int",
"Value"
]
],
"cls": true
},
"GmEndlessCrisis": {
"id": 151,
"f": [
[
"int",
"PoolRowId"
],
[
"bool",
"Close"
]
],
"cls": true
},
"GmSetGameCounter": {
"id": 155,
"f": [
[
"string",
"Name"
],
[
"int",
"Value"
],
[
"bool",
"IsDelta"
]
],
"cls": true
},
"GmAchievementOps": {
"id": 156,
"f": [
[
"string",
"Op"
],
[
"int",
"Id"
],
[
"int",
"PlayerSelectId"
]
],
"cls": true
},
"GmAchievementTaboo": {
"id": 157,
"f": [
[
"string",
"Op"
],
[
"string",
"Key"
],
[
"bool",
"Value"
]
],
"cls": true
},
"GmPauseRenderFreezeOff": {
"id": 158,
"f": [],
"cls": true
},
"GmFillReinforceLayer": {
"id": 159,
"f": [
[
"int",
"SlotTypeId"
],
[
"int",
"BuffId"
],
[
"int",
"Layers"
]
],
"cls": true
},
"RebirthRestart": {
"id": 160,
"f": [
[
"bool",
"Force"
]
],
"cls": true
},
"GmSimulateKey": {
"id": 161,
"f": [
[
"int",
"KeyCode"
]
],
"cls": true
},
"GmSimulateCheatEvidence": {
"id": 162,
"f": [
[
"int",
"Type"
]
],
"cls": true
},
"GmLoadingProfiler": {
"id": 163,
"f": [
[
"bool",
"Enabled"
],
[
"bool",
"Serial"
]
],
"cls": true
},
"ConvertSaveToBytes": {
"id": 164,
"f": [
[
"string",
"FileName"
]
],
"cls": true
},
"GmStrayZombieSpawn": {
"id": 166,
"f": [],
"cls": false
},
"GmPhotoMode": {
"id": 167,
"f": [],
"cls": true
},
"GmStopBg": {
"id": 168,
"f": [],
"cls": false
},
"GmBreakFurnitureShield": {
"id": 169,
"f": [
[
"int",
"SlotTypeId"
]
],
"cls": true
},
"GmEnvProbe": {
"id": 170,
"f": [
[
"bool",
"ForceHit"
],
[
"int",
"Mode"
],
[
"int",
"Value"
]
],
"cls": true
},
"GmRobotPlan": {
"id": 171,
"f": [
[
"string",
"Op"
],
[
"int",
"MapId"
],
[
"float",
"X"
],
[
"float",
"Y"
],
[
"float",
"Z"
],
[
"int",
"GroundOn"
],
[
"long",
"RobotId"
],
[
"int",
"BagFreeSlots"
],
[
"long",
"FurnitureId"
],
[
"int",
"Put"
],
[
"int",
"Take"
]
],
"cls": true
},
"GmRobotSpawn": {
"id": 172,
"f": [
[
"float",
"X"
],
[
"float",
"Y"
],
[
"float",
"Z"
],
[
"int",
"MapId"
],
[
"long",
"DockId"
],
[
"int",
"ConfigId"
]
],
"cls": true
},
"GmRobotTrip": {
"id": 173,
"f": [
[
"long",
"SrcId"
],
[
"long",
"DstId"
],
[
"string",
"Items"
]
],
"cls": true
},
"GmRobotBattery": {
"id": 174,
"f": [
[
"int",
"Value"
]
],
"cls": true
},
"GmRobotMaster": {
"id": 175,
"f": [
[
"int",
"Value"
]
],
"cls": true
},
"GmRobotStub": {
"id": 176,
"f": [
[
"bool",
"On"
]
],
"cls": true
},
"GmRobotFakeState": {
"id": 177,
"f": [
[
"long",
"RobotId"
],
[
"int",
"Battery"
],
[
"int",
"BatteryMax"
],
[
"int",
"MasterOn"
],
[
"int",
"GroundOn"
],
[
"int",
"IsCharging"
],
[
"string",
"HistoryJson"
]
],
"cls": true
},
"GmNpcGoto": {
"id": 178,
"f": [
[
"long",
"NpcId"
],
[
"long",
"TargetId"
],
[
"int",
"TargetMapId"
],
[
"string",
"RequestId"
]
],
"cls": true
},
"GmRobotBagFill": {
"id": 179,
"f": [
[
"long",
"RobotId"
],
[
"int",
"ItemConfigId"
],
[
"int",
"Count"
]
],
"cls": true
},
"GmRobotDockInfo": {
"id": 180,
"f": [],
"cls": true
},
"GmRobotContainerSwitch": {
"id": 181,
"f": [
[
"string",
"Op"
],
[
"long",
"FurnitureId"
],
[
"int",
"Kind"
],
[
"bool",
"On"
],
[
"string",
"Rule"
],
[
"int",
"ItemConfigId"
]
],
"cls": true
},
"GmUnlockActiveTradePoints": {
"id": 182,
"f": [],
"cls": false
},
"GmFillStoredPower": {
"id": 183,
"f": [],
"cls": true
},
"GmSwitchMainMenuScene": {
"id": 184,
"f": [
[
"int",
"PlayerSelectId"
]
],
"cls": true
},
"GmPlantRobot": {
"id": 185,
"f": [
[
"string",
"Op"
],
[
"long",
"PotId"
],
[
"string",
"Kind"
],
[
"long",
"RobotId"
],
[
"int",
"MapId"
],
[
"float",
"X"
],
[
"float",
"Z"
],
[
"int",
"Tier"
],
[
"int",
"SeedId"
],
[
"int",
"Modules"
]
],
"cls": true
},
"GmAidPlatform": {
"id": 190,
"f": [
[
"string",
"Op"
],
[
"int",
"Value"
]
],
"cls": true
},
"GmRobotTalk": {
"id": 191,
"f": [
[
"string",
"Op"
],
[
"long",
"RobotId"
],
[
"string",
"Kind"
],
[
"string",
"Text"
],
[
"float",
"Duration"
],
[
"int",
"Scene"
]
],
"cls": true
},
"GmSpeedHotkey": {
"id": 195,
"f": [],
"cls": false
},
"GmRobotModule": {
"id": 196,
"f": [
[
"string",
"Op"
],
[
"long",
"RobotId"
],
[
"int",
"Slot"
],
[
"int",
"ItemId"
],
[
"long",
"ItemInstanceId"
]
],
"cls": true
},
"GmExploreFreeCamera": {
"id": 197,
"f": [],
"cls": true
},
"GmPreSupplyQuery": {
"id": 198,
"f": [],
"cls": true
},
"GmPreSupplyOp": {
"id": 200,
"f": [
[
"string",
"Op"
],
[
"string",
"GroupKind"
],
[
"int",
"GroupId"
],
[
"int",
"ShopId"
],
[
"int",
"MapPointId"
],
[
"int",
"Id"
],
[
"int",
"Count"
],
[
"int",
"Value"
],
[
"List<string>",
"InstanceIds"
],
[
"bool",
"Force"
],
[
"string",
"RequestId"
]
],
"cls": true
},
"GmShowClickRayProbe": {
"id": 202,
"f": [],
"cls": false
},
"GmCasualDevOverride": {
"id": 203,
"f": [
[
"int",
"Enable"
]
],
"cls": true
},
"GmEnterCasual": {
"id": 204,
"f": [
[
"int",
"Ending"
],
[
"bool",
"SealOrigin"
]
],
"cls": true
},
"GmCasualHome": {
"id": 205,
"f": [
[
"string",
"Op"
]
],
"cls": true
},
"GmCasualDebug": {
"id": 206,
"f": [
[
"string",
"Op"
],
[
"int",
"A"
],
[
"int",
"B"
]
],
"cls": true
},
"GmTrainerCrash": {
"id": 207,
"f": [
[
"int",
"Mode"
]
],
"cls": true
},
"GmCommission": {
"id": 208,
"f": [
[
"string",
"Op"
],
[
"int",
"Value"
],
[
"int",
"Contact"
]
],
"cls": true
},
"GmExploreAutoSearch": {
"id": 209,
"f": [
[
"float",
"BudgetPercent"
]
],
"cls": true
},
"GmSkipPrologueAndPreDisaster": {
"id": 211,
"f": [],
"cls": false
}
};
