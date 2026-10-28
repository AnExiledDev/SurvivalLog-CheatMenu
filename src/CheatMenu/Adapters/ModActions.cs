using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Runtime.CompilerServices;
using System.Text;
using BepInEx;
using BepInEx.Unity.IL2CPP;
using CheatMenu.Core;
using GameCore.HotUpdate;
using GameCore.HotUpdate.Battle.Logic;
using GameCore.HotUpdate.ReduxUI;
using HarmonyLib;

namespace CheatMenu.Adapters;

/// <summary>
/// The mod's one-shot cheats. Each calls the game's own methods (most of them the developers' own GM helpers that
/// no GM message reaches), so the game does its usual follow-up work. Each returns null when it ran, or why it did
/// not, and may hand back a line of text for the panel to show.
/// </summary>
internal sealed class ModActions
{
    private const PlantAnomaly CareAnomalies = PlantAnomaly.Pest | PlantAnomaly.Weed | PlantAnomaly.Drought;
    private const int BestFertilizer = 15503;

    private const int MaxRolls = 50;
    private const int MaxContainers = 60;

    private readonly GmBridge _gm;
    private readonly Harmony _harmony;
    private readonly Action<string> _log;
    private Dictionary<int, LoopRewards.Owned>? _rewardsAtOpen;

    public ModActions(GmBridge gm, Harmony harmony, Action<string> log)
    {
        _gm = gm;
        _harmony = harmony;
        _log = log;
    }

    public string? Run(string name, string argsJson, out string text)
    {
        text = "";

        // The health page reads BepInEx, not the save, so it works from the title screen too.
        if (name == "health") return Health(out text);

        if (!GmBridge.IsInGame || GameSingleton.Existing<BattleLogicWorld>() is not { } world) return "load a save first";

        var args = ActArgs.Parse(argsJson);

        try
        {
            return name switch
            {
                "mature" => Mature(world, args.Long("pot"), out text),
                "tend" => Tend(world, out text),
                "anomaly" => Anomaly(world, args.Long("pot"), args.Int("kind"), out text),
                "freebuild" => FreeBuild(args.Bool("on") ?? !GmFreeBuild.Enabled, out text),
                "ally" => Said(out text, $"{world._StrangerSupportManager.GmAutoAlly()} contacts allied"),
                "allyone" => args.Int("contact") is { } contact ? Said(out text, world._StrangerSupportManager.GmAllyContact(contact) ?? "done") : "pick a contact",
                "exposure" => Exposure(world, args.Number("value"), out text),
                "event-choice" => Events(world, args.Long("event"), (e, _) => world._DynamicEventManager.GmAutoSelectChoice(e.EventId), "had a choice picked", true, out text),
                "event-end" => Events(world, args.Long("event"), (e, _) => world._DynamicEventManager.GmAutoEndResult(e.EventId), "ended with their result", false, out text),
                "event-reset" => Events(world, args.Long("event"), (_, id) => world._DynamicEventManager.GmAutoReset(id), "had their auto-play timer reset", false, out text),
                "loan-clear" => LoanClear(world, out text),
                "debuffs" => Debuffs(world, out text),
                "buff-remove" => args.Int("buff") is { } buff ? BuffRemove(world, buff, out text) : "pick a buff",
                "snapshot" => Snapshot(world, out text),
                "list" => List(world, args.Text("of"), out text),
                "fresh" => Fresh(world, out text),
                "recipes" => Recipes(world, out text),
                "skipto" => args.Int("hour") is { } hour ? SkipTo(world, hour, out text) : "pick a time",
                "repairall" => RepairAll(world, out text),
                "containers" => Containers(world, out text),
                "unsearch" => Unsearch(world, out text),
                "traps" => Traps(world, out text),
                "basket" => Basket(world, out text),
                "toast" => Toast(args.Text("kind"), args.Text("text"), out text),
                "loopreward" => args.Int("talent") is { } talent && args.Int("level") is { } level ? LoopReward(world, talent, level, args.Bool("pay") == true, out text) : "pick a loop reward and a level",
                "rewardscreen" => RewardScreen(world, out text),
                _ => "not one of this mod's cheats",
            };
        }
        catch (Exception ex)
        {
            _log($"cheat {name} failed: {ex}");

            return ex.GetType().Name + ": " + ex.Message;
        }
    }

    private static string? Said(out string text, string said)
    {
        text = said;

        return null;
    }

    private static IEnumerable<(Furniture Furniture, PlantComponent Plant)> Pots(BattleLogicWorld world)
    {
        var furnitures = world._AgentManager?.GetAllFurnitures();

        for (var i = 0; furnitures != null && i < furnitures.Count; i++)
        {
            var furniture = furnitures[i];

            if (furniture == null || furniture.IsDead) continue;

            if (AgentTools.GetAgentComponent<PlantComponent>(furniture) is { } plant) yield return (furniture, plant);
        }
    }

    private static string? Mature(BattleLogicWorld world, long? pot, out string text)
    {
        int done = 0, pots = 0;

        foreach (var (furniture, plant) in Pots(world))
        {
            if (pot is { } only && furniture.InstanceId != only) continue;

            pots++;

            if (plant.GmForceMature()) done++;
        }

        text = $"{done} of {pots} pots now ripe";

        return pot != null && pots == 0 ? "that pot is gone" : null;
    }

    private static string? Tend(BattleLogicWorld world, out string text)
    {
        var pots = 0;

        foreach (var (_, plant) in Pots(world))
        {
            pots++;
            plant.ClearAnomaly(CareAnomalies);
            plant.AddFertilizer(BestFertilizer);
        }

        text = $"{pots} pots weeded, cleared of pests, watered and fed";

        return null;
    }

    private static string? Anomaly(BattleLogicWorld world, long? pot, int? kind, out string text)
    {
        text = "";

        if (kind is not (1 or 2 or 4)) return "pick pests, weeds or drought";

        var hit = 0;

        foreach (var (furniture, plant) in Pots(world))
        {
            if (pot is { } only && furniture.InstanceId != only) continue;

            plant.GmForceAnomaly((PlantAnomaly)kind.Value);
            hit++;
        }

        text = $"{(PlantAnomaly)kind.Value} on {hit} pots";

        return hit == 0 ? "no pot to hit" : null;
    }

    private static string? FreeBuild(bool on, out string text)
    {
        // The game's own toggle flips the switch and shows its popup; it only runs when the switch is not already there.
        if (GmFreeBuild.Enabled != on) Ac_FreeBuildMenu_GmToggle.SendAction();

        text = on ? "free build on" : "free build off";

        return null;
    }

    private static string? Exposure(BattleLogicWorld world, double? value, out string text)
    {
        text = "";

        if (value is not { } amount) return "enter an amount";

        var explore = world._ExploreManager;

        if (!explore.GmAddExposure((float)amount)) return "the game refused: no run under way, or exposure is locked";

        text = $"exposure {explore.CurExposure:0.#} of {explore.MaxExposure:0.#}";

        return null;
    }

    private static string? Events(BattleLogicWorld world, long? only, Action<DynamicEventArgs, long> act, string what, bool openOnly, out string text)
    {
        text = "";

        var events = world._DynamicEventManager?.CurrentArgsDict;

        if (events == null) return "no events are running";

        var picked = new List<(long Id, DynamicEventArgs Args)>();

        foreach (var pair in events)
        {
            if (pair.Value == null) continue;
            if (only is { } id && pair.Key != id) continue;
            if (openOnly && pair.Value.IsChose) continue;

            picked.Add((pair.Key, pair.Value));
        }

        // Each call can end its event and change the dictionary, so they run after the walk.
        foreach (var (id, args) in picked) act(args, id);

        text = $"{picked.Count} events {what}";

        return picked.Count == 0 ? (openOnly ? "no event is waiting on a choice" : "no events are running") : null;
    }

    private static string? LoanClear(BattleLogicWorld world, out string text)
    {
        var shark = world._LoanSharkManager;

        shark.Settle(true);
        shark.ClearRevenge();
        shark.ClearStalk();
        shark.ClearGnaw();
        text = "loan shark settled; revenge, stalking and gnawing cleared";

        return null;
    }

    private static BuffComponent? Buffs(BattleLogicWorld world)
    {
        var role = world._AgentManager?.GetLeadingRole();

        return role == null ? null : AgentTools.GetAgentComponent<BuffComponent>(role);
    }

    private static string? Debuffs(BattleLogicWorld world, out string text)
    {
        text = "";

        if (Buffs(world) is not { } buffs || GameSingleton.Existing<ConfigManager>() is not { } config) return "no survivor";

        var ids = buffs.GetBuffConfigIds();
        var bad = new List<int>();

        for (var i = 0; ids != null && i < ids.Count; i++)
        {
            var buff = config.Get_Config_Buff(ids[i]);

            if (buff != null && !buff.IsGood) bad.Add(ids[i]);
        }

        foreach (var id in bad) buffs.RemoveBuff(id);

        text = $"{bad.Count} debuffs removed";

        return null;
    }

    private static string? BuffRemove(BattleLogicWorld world, int buff, out string text)
    {
        text = "";

        if (Buffs(world) is not { } buffs) return "no survivor";

        buffs.RemoveBuff(buff);
        text = $"buff {buff} removed";

        return null;
    }

    /// <summary>The companion and rescue lines' own state, read through their GM getters.</summary>
    private static string? Snapshot(BattleLogicWorld world, out string text)
    {
        var rescue = world._NeighborRescueManager;
        var girl = world._GirlCompanionManager;
        var lines = new StringBuilder();

        void Line(string label, Func<object?> read)
        {
            string shown;

            try
            {
                shown = Convert.ToString(read(), System.Globalization.CultureInfo.InvariantCulture) ?? "";
            }
            catch (Exception ex)
            {
                shown = "(" + ex.GetType().Name + ")";
            }

            lines.Append(label).Append(": ").Append(shown).Append('\n');
        }

        if (rescue != null)
        {
            Line("Neighbor unlocked", () => rescue.GmIsUnlocked());
            Line("Neighbor progress", () => $"{rescue.GmGetProgress()} / {rescue.GmGetProgressMax()}");
            Line("Neighbor rescued", () => rescue.GmIsRescueCompleted());
            Line("Neighbor crisis", () => rescue.GmGetActiveCrisisIndex());
            Line("Neighbor crisis needs", () => rescue.GmGetCrisisRequiredCategory());
            Line("Neighbor active rescue", () => rescue.GmGetActiveRescueId());
        }

        if (girl != null)
        {
            Line("Companion unlocked", () => girl.GmIsUnlocked());
            Line("Companion affinity", () => girl.GmGetAffinity());
            Line("Companion survival tier", () => girl.GmGetSurvivalTier());
            Line("Companion tier clock (s)", () => girl.GmGetTierAnchorSeconds());
            Line("Companion wish", () => $"{girl.GmGetWishIndex()} (reveal pending: {girl.GmGetWishPendingReveal()})");
            Line("Companion struggle", () => $"{girl.GmGetStruggleState()} x{girl.GmGetStruggleCount()}, deadline {girl.GmGetStruggleDeadlineSeconds()}s");
            Line("Companion sends", () => $"{girl.GmGetConsecutiveSendDays()} days in a row, last day {girl.GmGetLastSendDay()}");
            Line("Companion neglect clock (s)", () => girl.GmGetNeglectAnchorSeconds());
        }

        text = lines.Length == 0 ? "no companion or rescue line in this save" : lines.ToString().TrimEnd();

        return null;
    }

    private static IEnumerable<Furniture> Furnitures(BattleLogicWorld world)
    {
        var furnitures = world._AgentManager?.GetAllFurnitures();

        for (var i = 0; furnitures != null && i < furnitures.Count; i++)
            if (furnitures[i] is { IsDead: false } furniture) yield return furniture;
    }

    /// <summary>Every food item anywhere (bags, storage, the floor) made as fresh as new.</summary>
    private static string? Fresh(BattleLogicWorld world, out string text)
    {
        text = "";

        var cache = world._ItemManager?.OwnerCache;

        if (cache == null || GameSingleton.Existing<ConfigManager>() is not { } config) return "no items loaded";

        var now = world._GameTimeManager.GetTotalSeconds() / 3600.0;
        var done = 0;

        foreach (var owner in cache.Values)
        {
            if (owner == null) continue;

            foreach (var item in owner.Values)
            {
                if (!RotPatch.Spoils(config, item) || Freshness.AsNew(item.OriginalTimeLeft, item.TimeScale, now) is not { } clock) continue;

                item.StartTime = clock.Start;
                item.TimeLeft = clock.TimeLeft;
                item.TimeLeftFrac = clock.Frac;
                done++;
            }
        }

        text = $"{done} food stacks as fresh as new (an open bag may show the old freshness until it is reopened)";

        return null;
    }

    /// <summary>
    /// Every cooking recipe and every workbench, robot and machine blueprint, the way the game's own unlock rewards do
    /// it: the survivor's cooking record (then its unlock notice), and the tool table's craft unlocks (which skip
    /// recipes the game marks unusable and show the game's own unlock tip).
    /// </summary>
    private static string? Recipes(BattleLogicWorld world, out string text)
    {
        text = "";

        if (GameSingleton.Existing<ConfigManager>() is not { } config) return "the game tables are not loaded";

        var role = world._AgentManager?.GetLeadingRole();
        var record = role == null ? null : AgentTools.GetAgentComponent<CookingRecordComponent>(role);
        var cooking = 0;

        if (record != null && config._Config_CookingRecipe_Dict is { } recipes)
        {
            foreach (var id in recipes.Keys)
            {
                if (!record.IsRecipeUnlocked(id) || !record.IsCraftRecipeUnlocked(id)) cooking++;

                record.UnlockRecipe(id);
                record.UnlockCraftRecipe(id);
            }

            RewardSetManager.NotifyCookingRecipeUnlockChanged(record);
        }

        var blueprints = new Il2CppSystem.Collections.Generic.List<int>();

        if (config._Config_ProductionList_Dict is { } productions)
            foreach (var id in productions.Keys) blueprints.Add(id);

        if (blueprints.Count > 0) world._ToolTableManager.AddProductionCraftUnlocks(blueprints);

        text = record == null
            ? $"no survivor, so no cooking recipes; {blueprints.Count} blueprints unlocked at the workbench"
            : $"{cooking} cooking recipes newly unlocked; {blueprints.Count} blueprints unlocked at the workbench";

        return null;
    }

    /// <summary>The game's own Advance hours, by as many hours as it takes to reach that hour of the day.</summary>
    private string? SkipTo(BattleLogicWorld world, int hour, out string text)
    {
        text = "";

        var hours = Freshness.HoursUntil(world._GameTimeManager.GetHour24(), hour);

        if (hours == 0) return "pick an hour from 0 to 23";

        if (_gm.Run("{\"msgHead\":132,\"Hours\":" + hours + "}") is { } error) return error;

        text = $"{hours} hours on, to {hour:00}:00";

        return null;
    }

    /// <summary>Every piece of furniture with durability set to its maximum, the way the game's own door and window repair does it.</summary>
    private static string? RepairAll(BattleLogicWorld world, out string text)
    {
        int repaired = 0, all = 0;

        foreach (var furniture in Furnitures(world))
        {
            if (AgentTools.GetAgentComponent<FurnitureDurabilityComponent>(furniture) is not { } durability) continue;

            all++;

            var max = durability.GetMaxDurability();

            if (max <= 0 || durability.GetCurrentDurability() >= max) continue;

            durability.SetCurrentDurability(max);
            repaired++;
        }

        text = $"{repaired} of {all} pieces with durability repaired to full";

        return null;
    }

    /// <summary>What every container here holds, unsearched ones first, one per line as "id|config|searched|itemxcount,...".</summary>
    private static string? Containers(BattleLogicWorld world, out string text)
    {
        var items = world._ItemManager;
        var found = new List<(bool Searched, string Line)>();

        foreach (var furniture in Furnitures(world))
        {
            var list = items?.GetItemDataList(furniture.InstanceId);

            if (list == null || list.Count == 0) continue;

            var line = new StringBuilder();
            var first = true;

            line.Append(furniture.InstanceId).Append('|').Append(furniture.AgentConfigId).Append('|').Append(furniture.HasSearched ? 1 : 0).Append('|');

            for (var i = 0; i < list.Count; i++)
            {
                if (list[i] == null) continue;
                if (!first) line.Append(',');

                first = false;
                line.Append(list[i].ItemConfigId).Append('x').Append(list[i].ItemCount);
            }

            found.Add((furniture.HasSearched, line.ToString()));
        }

        text = string.Join("\n", found.OrderBy(f => f.Searched).Take(MaxContainers).Select(f => f.Line));

        return found.Count == 0 ? "no container here holds anything" : null;
    }

    /// <summary>
    /// The searched mark taken off every container that has it. The loot was rolled when the container was first
    /// opened and stays what it is now, so this brings back the unsearched marker, not new loot.
    /// </summary>
    private static string? Unsearch(BattleLogicWorld world, out string text)
    {
        var done = 0;

        foreach (var furniture in Furnitures(world))
        {
            if (!furniture.HasSearched) continue;

            furniture.HasSearched = false;
            done++;
        }

        text = $"{done} containers marked unsearched again (what is inside stays the same)";

        return null;
    }

    /// <summary>
    /// Every armed trap with no catch gets one, through the game's own catch roll and catch handling, so bait, the
    /// prey store and the HUD follow as if the hour had come. A trap whose room and bait give nothing keeps rolling nothing.
    /// </summary>
    private static string? Traps(BattleLogicWorld world, out string text)
    {
        text = "";

        var traps = world._TrapManager;

        if (traps?._placedTraps == null) return "no traps in this save";

        var hour = world._GameTimeManager.GetHour24();
        var waiting = new List<PlacedTrap>();
        var caught = 0;

        foreach (var trap in traps._placedTraps.Values)
            if (trap is { HasPrey: false, CaptureStartTotalSeconds: > 0 }) waiting.Add(trap);

        foreach (var trap in waiting)
        {
            for (var roll = 0; roll < MaxRolls; roll++)
            {
                var prey = traps.PerformCaptureRoll(trap, hour);

                if (prey <= 0) continue;

                traps.OnCaptureSuccess(trap, prey);
                caught++;
                break;
            }
        }

        text = waiting.Count == 0 ? "no armed trap is waiting for a catch (a trap needs bait to be armed)" : $"{caught} of {waiting.Count} armed traps caught something";

        return null;
    }

    /// <summary>The neighbour's basket comes home now with what she sends, through the game's own early return.</summary>
    private static string? Basket(BattleLogicWorld world, out string text)
    {
        text = "";

        var returns = world._NeighborBasketReturnManager;

        if (returns == null || !returns.IsBasketBusy()) return "the basket is not away";

        returns.ForceReturnNow();
        text = "the basket is on its way back";

        return null;
    }

    /// <summary>A test toast: the game's own short text (which Notifications turns into a toast), or one through Exiled's Toolkit.</summary>
    private static string? Toast(string? kind, string? said, out string text)
    {
        text = "";

        var words = string.IsNullOrWhiteSpace(said) ? "Cheat Menu test toast" : said!.Trim();

        if (kind == "game")
        {
            Ac_PopText_AddPopText.SendAction(words);
            text = "sent as the game's short text";

            return null;
        }

        if (!OptionalLive.IsToolkitInstalled) return "Exiled's Toolkit is not installed";

        try
        {
            ToolkitToast(words, kind);
        }
        catch (Exception ex) when (ex is TypeLoadException or MissingMethodException or FileNotFoundException or FileLoadException)
        {
            return "this Toolkit has no toasts: " + ex.Message;
        }

        text = "sent through Exiled's Toolkit";

        return null;
    }

    // Kept in its own method so the Toolkit's types are only looked up when it is installed.
    [MethodImpl(MethodImplOptions.NoInlining)]
    private static void ToolkitToast(string words, string? kind) =>
        ExiledToolkit.Toasts.Show(new ExiledToolkit.ToastRequest("Cheat Menu", words)
        {
            Kind = kind switch
            {
                "success" => ExiledToolkit.ToastKind.Success,
                "warning" => ExiledToolkit.ToastKind.Warning,
                "error" => ExiledToolkit.ToastKind.Error,
                _ => ExiledToolkit.ToastKind.Info,
            },
        });

    /// <summary>Every plugin BepInEx found, with its version and the errors it logged this session.</summary>
    private string? Health(out string text)
    {
        var plugins = IL2CPPChainloader.Instance.Plugins.Values.Select(p => new ModHealth.Plugin(
            p.Metadata.GUID, p.Metadata.Name, p.Metadata.Version?.ToString() ?? "", p.Instance != null)).ToList();
        var errors = new Dictionary<string, ModHealth.Errors>();

        try
        {
            using var stream = new FileStream(Path.Combine(Paths.BepInExRootPath, "LogOutput.log"), FileMode.Open, FileAccess.Read, FileShare.ReadWrite | FileShare.Delete);
            using var reader = new StreamReader(stream);
            var lines = new List<string>();

            while (reader.ReadLine() is { } line) lines.Add(line);

            errors = ModHealth.ReadErrors(lines);
        }
        catch (Exception ex)
        {
            _log("could not read the BepInEx log for the health page: " + ex.Message);
        }

        text = ModHealth.Report(plugins, errors);

        return null;
    }

    /// <summary>Config_Talent rows of this type are loop rewards; type 2 rows are survival plans.</summary>
    private const int LoopRewardType = 1;

    private sealed record RewardRow(string Name, int Current, Dictionary<int, int> Costs);

    /// <summary>
    /// Every loop reward in the game's talent table (New Loop Plus's own included, as it writes them there), by talent
    /// id, with its name in the game's language, the level the survivor owns and each level's cost.
    /// </summary>
    private static SortedDictionary<int, RewardRow> RewardRows(BattleLogicWorld world)
    {
        var rewards = new SortedDictionary<int, RewardRow>();
        var config = GameSingleton.Existing<ConfigManager>();
        var rows = config?._Config_Talent_Dict;

        if (config == null || rows == null) return rewards;

        var talents = TalentsOf(world);
        var language = GameLanguage.IsChinese() ? config.customCache?.ChineseLanguageMap : config.customCache?.EnglishLanguageMap;

        foreach (var row in rows.Values)
        {
            if (row == null || row._Type_k__BackingField != LoopRewardType) continue;

            var id = row._TalentID_k__BackingField;

            if (!rewards.TryGetValue(id, out var reward))
            {
                var key = row._Name_k__BackingField;
                var name = !string.IsNullOrEmpty(key) && language != null && language.ContainsKey(key) && !string.IsNullOrEmpty(language[key]) ? language[key]
                    : !string.IsNullOrEmpty(row._Name_Local_k__BackingField) ? row._Name_Local_k__BackingField
                    : !string.IsNullOrEmpty(key) ? key : "#" + id;

                reward = rewards[id] = new RewardRow(name, talents?.GetCurrentLv(id) ?? 0, new Dictionary<int, int>());
            }

            reward.Costs[row._Lv_k__BackingField] = row._LvUpCost_k__BackingField;
        }

        return rewards;
    }

    private static TalentComponent? TalentsOf(BattleLogicWorld world)
    {
        var role = world._AgentManager?.GetLeadingRole();

        return role == null ? null : AgentTools.GetAgentComponent<TalentComponent>(role);
    }

    /// <summary>
    /// Sets a loop reward to a level and puts that level's buff on the survivor now (<see cref="LoopRewards.SetLevel"/>), then
    /// writes the levels into the save, where the game and New Loop Plus read what is owned. When pay is on, the
    /// Planning Points change by what the levels cost. The game's own purchase is not called: it only goes up one
    /// level at a time and reports each purchase online.
    /// </summary>
    private static string? LoopReward(BattleLogicWorld world, int talent, int level, bool pay, out string text)
    {
        text = "";

        if (TalentsOf(world) is not { } talents || Buffs(world) is not { } buffs) return "no survivor";

        if (!RewardRows(world).TryGetValue(talent, out var reward)) return "not a loop reward";

        var faith = world._FaithManager;
        var plan = LoopRewards.Plan(reward.Current, level, reward.Costs, pay, faith?.GetFaithPoint() ?? 0);

        if (plan.Error != null) return plan.Error;

        if (plan.Points != 0 && (faith == null || !faith.AddFaithPoint(plan.Points, "Generic"))) return "the game would not change the Planning Points";

        LoopRewards.SetLevel(new Survivor(talents, buffs), talent, level);

        // The save keeps its own copy of the levels; SaveGame copies them over only while any are owned.
        talents.SaveGame(null);

        var saved = GameSingleton.Existing<GameSaveManager>()?.gameSave?.TalentData;

        if (level == 0 && saved?.TalentLevelMap != null && saved.TalentLevelMap.ContainsKey(talent)) saved.TalentLevelMap.Remove(talent);

        if (level == 0 && saved?.BuffRefreshApplied != null) saved.BuffRefreshApplied.Remove(talent);

        text = LoopRewards.Done(reward.Name, level, plan.Points);

        return null;
    }

    /// <summary>
    /// RevertToLevel adds a buff only when the reward's BuffRefresh stage matches, which for loop rewards is the start of a
    /// run. GmForceAddBuff adds the level's buff now (once) and marks it in buffRefreshApplied, as the run start would.
    /// New Loop Plus adds a reward's other buffs when its level buff is added, so they come with it.
    /// </summary>
    private sealed class Survivor(TalentComponent talents, BuffComponent buffs) : LoopRewards.ISurvivor
    {
        public void RevertToLevel(int talent, int level) => talents.RevertToLevel(buffs, talent, level, true);

        public void AddLevelBuff(int talent, int level) => talents.GmForceAddBuff(buffs, talent, level);

        public void ForgetGiven(int talent) => talents.buffRefreshApplied?.Remove(talent);
    }

    /// <summary>
    /// Opens the game's loop reward screen mid-run (<see cref="RewardScreenPatch"/>). The rewards owned now, and whether
    /// each one's buff is on, are kept so the buffs can be put right when it closes.
    /// </summary>
    private string? RewardScreen(BattleLogicWorld world, out string text)
    {
        text = "";

        RewardScreenPatch.Install(_harmony, _log);

        if (!RewardScreenPatch.IsHooked) return "the screen's close could not be hooked, and closing it would end the run";

        if (TalentsOf(world) is null || Buffs(world) is not { } buffs || GameSingleton.Existing<ConfigManager>() is not { } config) return "no survivor";

        _rewardsAtOpen = RewardRows(world).ToDictionary(r => r.Key, r => new LoopRewards.Owned(r.Value.Current, HasLevelBuff(config, buffs, r.Key, r.Value.Current)));
        Ac_RebirthUpgrade_Open.SendAction(BattleResult.GameDayEnd, "", RewardScreenPatch.MidRun);
        text = "loop reward screen open";

        return null;
    }

    private static bool HasLevelBuff(ConfigManager config, BuffComponent buffs, int talent, int level)
    {
        var buff = level > 0 ? config.GetTalentConfig(talent, level)?._BuffID_k__BackingField ?? 0 : 0;

        return buff > 0 && buffs.IsBuffConfigExist(buff);
    }

    /// <summary>
    /// Once the menu's reward screen has closed: gives the rewards bought or reset there their level's buff now
    /// (<see cref="LoopRewards.Rebuff"/>), then writes the levels into the save.
    /// </summary>
    public void RewardScreenClosed()
    {
        var atOpen = _rewardsAtOpen;

        _rewardsAtOpen = null;

        if (atOpen == null || GameSingleton.Existing<BattleLogicWorld>() is not { } world || TalentsOf(world) is not { } talents || Buffs(world) is not { } buffs) return;

        try
        {
            var now = RewardRows(world).ToDictionary(r => r.Key, r => r.Value.Current);
            var survivor = new Survivor(talents, buffs);
            var given = LoopRewards.Rebuff(atOpen, now);

            foreach (var (talent, level) in given) survivor.AddLevelBuff(talent, level);

            talents.SaveGame(null);
            _log($"loop reward screen closed, {given.Count} rewards given their effect");
        }
        catch (Exception ex)
        {
            _log("loop reward screen closed, but its rewards' effects could not be given: " + ex);
        }
    }

    /// <summary>A live picker's choices as a JSON array of [id, label].</summary>
    private static string? List(BattleLogicWorld world, string? of, out string text)
    {
        var json = new StringBuilder("[");

        void Add(long id, string label)
        {
            if (json.Length > 1) json.Append(',');

            json.Append('[').Append(id).Append(',').Append(JsText.Literal(label)).Append(']');
        }

        var config = GameSingleton.Existing<ConfigManager>();
        var isChinese = GameLanguage.IsChinese();

        switch (of)
        {
            case "pots":
                foreach (var (furniture, plant) in Pots(world))
                {
                    var plantId = plant.PlantConfigId;
                    var row = config?._Config_Plant_Dict is { } plants && plants.TryGetValue(plantId, out var found) ? found : null;

                    Add(furniture.InstanceId, ListLabels.Pot(GameName(config, row?._Name_k__BackingField, row?._Name_Local_k__BackingField), plantId, (ListLabels.Plant)(int)plant.State, isChinese));
                }

                break;
            case "furniture":
            {
                var furnitures = world._AgentManager?.GetAllFurnitures();

                for (var i = 0; furnitures != null && i < furnitures.Count; i++)
                {
                    var furniture = furnitures[i];

                    if (furniture == null || furniture.IsDead) continue;

                    var kind = furniture.AgentConfigId;
                    var row = config?._Config_Furniture_Dict is { } kinds && kinds.TryGetValue(kind, out var found) ? found : null;

                    Add(furniture.InstanceId, ListLabels.Furniture(GameName(config, row?._Name_k__BackingField, row?._Name_Local_k__BackingField), kind, isChinese));
                }

                break;
            }
            case "events":
            {
                var events = world._DynamicEventManager?.CurrentArgsDict;

                if (events != null)
                    foreach (var pair in events)
                    {
                        if (pair.Value == null) continue;

                        var eventId = pair.Value.EventId;
                        var row = config?._Config_Event_Dict is { } table && table.TryGetValue(eventId, out var found) ? found : null;

                        Add(pair.Key, ListLabels.Event(GameName(config, row?._Name_k__BackingField, row?._Name_Local_k__BackingField), eventId, !pair.Value.IsChose, isChinese));
                    }

                break;
            }
            case "talents":
                foreach (var reward in RewardRows(world)) Add(reward.Key, LoopRewards.Label(reward.Value.Name, reward.Value.Current, reward.Value.Costs.Keys.DefaultIfEmpty(0).Max()));
                break;
            case "buffs":
            {
                var ids = Buffs(world)?.GetBuffConfigIds();

                var table = config?._Config_Buff_Dict;

                // The ones the game shows first, then its hidden ones (markers the game keeps for its own use).
                foreach (var hidden in new[] { false, true })
                    for (var i = 0; ids != null && i < ids.Count; i++)
                    {
                        var row = table != null && table.TryGetValue(ids[i], out var found) ? found : null;
                        var isHidden = row?._IsHide_k__BackingField == true;

                        if (isHidden == hidden) Add(ids[i], ListLabels.Buff(GameName(config, row?._Name_k__BackingField, row?._Name_Local_k__BackingField), row?._IsGood_k__BackingField == true, isHidden, isChinese));
                    }

                break;
            }
            default:
                text = "";

                return "nothing to list";
        }

        text = json.Append(']').ToString();

        return null;
    }

    /// <summary>A table row's name in the game's language: its text key looked up, else the Chinese name the row carries.</summary>
    private static string? GameName(ConfigManager? config, string? key, string? local)
    {
        if (config != null && !string.IsNullOrEmpty(key))
        {
            var text = config.GetLocalTxt(key);

            if (!string.IsNullOrWhiteSpace(text) && text != key) return text;
        }

        return string.IsNullOrWhiteSpace(local) ? null : local;
    }
}
