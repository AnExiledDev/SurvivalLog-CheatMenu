using System;
using System.Collections.Generic;
using System.Text;
using CheatMenu.Core;
using GameCore.HotUpdate;
using GameCore.HotUpdate.Battle.Logic;
using GameCore.HotUpdate.ReduxUI;

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

    private readonly Action<string> _log;

    public ModActions(Action<string> log)
    {
        _log = log;
    }

    public string? Run(string name, string argsJson, out string text)
    {
        text = "";

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

    /// <summary>A live picker's choices as a JSON array of [id, label].</summary>
    private static string? List(BattleLogicWorld world, string? of, out string text)
    {
        var json = new StringBuilder("[");

        void Add(long id, string label)
        {
            if (json.Length > 1) json.Append(',');

            json.Append('[').Append(id).Append(',').Append(JsText.Literal(label)).Append(']');
        }

        switch (of)
        {
            case "pots":
                foreach (var (furniture, plant) in Pots(world)) Add(furniture.InstanceId, $"Pot {furniture.InstanceId} (plant {plant.PlantConfigId}, state {plant.State})");
                break;
            case "furniture":
            {
                var furnitures = world._AgentManager?.GetAllFurnitures();

                for (var i = 0; furnitures != null && i < furnitures.Count; i++)
                {
                    var furniture = furnitures[i];

                    if (furniture != null && !furniture.IsDead) Add(furniture.InstanceId, $"#{furniture.InstanceId} (config {furniture.AgentConfigId})");
                }

                break;
            }
            case "events":
            {
                var events = world._DynamicEventManager?.CurrentArgsDict;

                if (events != null)
                    foreach (var pair in events)
                        if (pair.Value != null) Add(pair.Key, $"Event {pair.Value.EventId}{(pair.Value.IsChose ? "" : ", waiting on a choice")}");

                break;
            }
            case "buffs":
            {
                var ids = Buffs(world)?.GetBuffConfigIds();

                for (var i = 0; ids != null && i < ids.Count; i++) Add(ids[i], "");

                break;
            }
            default:
                text = "";

                return "nothing to list";
        }

        text = json.Append(']').ToString();

        return null;
    }
}
