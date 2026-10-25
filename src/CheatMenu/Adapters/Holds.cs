using System;
using System.Collections.Generic;
using System.Text;
using CheatMenu.Core;
using GameCore.HotUpdate;
using GameCore.HotUpdate.Battle.Logic;
using HarmonyLib;

namespace CheatMenu.Adapters;

/// <summary>
/// The mod's holds: cheats kept true by putting them back every half second while they are on. Each uses the game's
/// own calls (its GM attribute message, its GM power fill, its zombie retreat, its own clock freeze), so turning a
/// hold off leaves the game running exactly as it does by itself. Holds are not saved: every hold starts off.
/// </summary>
internal sealed class Holds
{
    private const float EverySeconds = 0.5f;
    private const float StepSeconds = 2f;
    private const int SecondsPerHour = 3600;
    private const int ShredderRunning = 1;
    private const int PressRunning = 1;
    private const string Durability = "LockFurnitureDurability";

    private static readonly (string Stat, AttrName Value, AttrName Max)[] Bars =
    {
        ("Satiety", AttrName.Satiety, AttrName.MaxSatiety),
        ("Morale", AttrName.Morale, AttrName.MaxMorale),
        ("Stamina", AttrName.Stamina, AttrName.MaxStamina),
        ("Health", AttrName.Health, AttrName.MaxHealth),
        ("Vitality", AttrName.Vitality, AttrName.MaxVitality),
    };

    private readonly HashSet<string> _on = new(StringComparer.Ordinal);
    private readonly HashSet<string> _reported = new(StringComparer.Ordinal);
    private readonly GmBridge _gm;
    private readonly GmFlags _flags;
    private readonly Harmony _harmony;
    private readonly Action<string> _log;
    private float _nextAt;
    private float _stepEndsAt;
    private bool _stepWas;
    private bool _durabilityWas;

    public Holds(GmBridge gm, GmFlags flags, Harmony harmony, Action<string> log)
    {
        _gm = gm;
        _flags = flags;
        _harmony = harmony;
        _log = log;
    }

    /// <summary>True when the hold could be set; the reason is in the log when it could not.</summary>
    public bool Set(string name, bool isOn, float now)
    {
        if (_on.Contains(name) == isOn) return true;
        if (isOn && !GmBridge.IsInGame && name != "nofuel") return false;

        try
        {
            if (isOn) Start(name, now);
            else Stop(name);
        }
        catch (Exception ex)
        {
            _log($"hold {name} could not be turned {(isOn ? "on" : "off")}: {ex}");

            return false;
        }

        if (isOn) _on.Add(name);
        else _on.Remove(name);

        _nextAt = 0;

        return true;
    }

    /// <summary>Called every frame. Returns true when a hold ended by itself, so the panel's switches need a refresh.</summary>
    public bool Tick(float now)
    {
        if (_on.Count == 0) return false;

        if (!GmBridge.IsInGame)
        {
            // A save unloaded under the holds: the game's own state they changed went with it. No fuel use is the
            // mod's own switch, so it stays.
            return _on.RemoveWhere(name => name != "nofuel") > 0;
        }

        var ended = false;

        if (_on.Contains("eventstep") && now >= _stepEndsAt)
        {
            Set("eventstep", false, now);
            ended = true;
        }

        if (now < _nextAt) return ended;

        _nextAt = now + EverySeconds;

        if (GameSingleton.Existing<BattleLogicWorld>() is not { } world) return ended;

        foreach (var name in _on) Keep(name, world);

        return ended;
    }

    /// <summary>Every hold as a JSON object of name to on or off.</summary>
    public string Json()
    {
        var json = new StringBuilder("{");

        foreach (var name in ModCheats.Holds)
        {
            if (json.Length > 1) json.Append(',');

            json.Append('"').Append(name).Append("\":").Append(_on.Contains(name) ? "true" : "false");
        }

        return json.Append('}').ToString();
    }

    private void Start(string name, float now)
    {
        var world = GameSingleton.Existing<BattleLogicWorld>();

        switch (name)
        {
            case "clock":
                world!._GameTimeManager.IsClockFrozen = true;
                break;
            case "peaceful":
                _durabilityWas = _flags.IsOn(Durability);
                _flags.Set(Durability, true);
                // Closes every zombie-wave timeline already playing (ConfigId 0 is the game's close-all).
                Report("peaceful", _gm.Run("{\"msgHead\":103,\"ConfigId\":0,\"Active\":false}"));
                break;
            case "nofuel":
                FuelPatch.Install(_harmony, _log);
                if (!FuelPatch.IsHooked) throw new InvalidOperationException("the fuel hooks could not go in");
                FuelPatch.IsOn = true;
                break;
            case "eventstep":
                _stepWas = world!._DynamicEventManager.IsGmAutoComplete;
                world._DynamicEventManager.IsGmAutoComplete = true;
                _stepEndsAt = now + StepSeconds;
                break;
        }
    }

    private void Stop(string name)
    {
        var world = GameSingleton.Existing<BattleLogicWorld>();

        switch (name)
        {
            case "clock":
                if (world != null) world._GameTimeManager.IsClockFrozen = false;
                break;
            case "peaceful":
                _flags.Set(Durability, _durabilityWas);
                break;
            case "nofuel":
                FuelPatch.IsOn = false;
                break;
            case "eventstep":
                if (world != null) world._DynamicEventManager.IsGmAutoComplete = _stepWas;
                break;
        }
    }

    private void Keep(string name, BattleLogicWorld world)
    {
        try
        {
            switch (name)
            {
                case "god":
                    FillBars(world);
                    break;
                case "power":
                    world._PowerManager.GmFillStoredPower();
                    break;
                case "peaceful":
                    if (world._StrayZombieManager.GetAliveStrayCount() > 0) world._StrayZombieManager.RetreatAll();
                    break;
                case "clock":
                    if (!world._GameTimeManager.IsClockFrozen) world._GameTimeManager.IsClockFrozen = true;
                    break;
                case "instant":
                    FinishMachines(world);
                    break;
            }
        }
        catch (Exception ex)
        {
            Report(name, ex.GetType().Name + ": " + ex.Message);
        }
    }

    /// <summary>Each of the five bars below its maximum is set to it with the game's own GM attribute message.</summary>
    private void FillBars(BattleLogicWorld world)
    {
        var role = world._AgentManager?.GetLeadingRole();

        if (role == null || AgentTools.GetAgentComponent<AttributeComponent>(role) is not { } attrs) return;

        foreach (var (stat, value, max) in Bars)
        {
            var top = attrs.GetTotalValue_Float(max);

            if (top <= 0 || attrs.GetTotalValue_Float(value) >= top) continue;

            Report("god", _gm.Run("{\"msgHead\":6,\"attrKey\":\"" + stat + "\",\"attrValue\":" + top.ToString(System.Globalization.CultureInfo.InvariantCulture) + ",\"type\":0}"));
        }
    }

    /// <summary>
    /// Every running timed machine has its start moved back so the game's own update finishes the job the usual way.
    /// Workbench crafting is the survivor's own action, not a machine, so it is not here.
    /// </summary>
    private static void FinishMachines(BattleLogicWorld world)
    {
        var furnitures = world._AgentManager?.GetAllFurnitures();
        var now = world._GameTimeManager.GetTotalSeconds();
        var nowHour = now / SecondsPerHour;
        var isTradeLocked = world._StrangerTradeActiveManager?._IsLocked_k__BackingField != false;

        for (var i = 0; furnitures != null && i < furnitures.Count; i++)
        {
            var furniture = furnitures[i];

            if (furniture == null || furniture.IsDead) continue;

            if (AgentTools.GetAgentComponent<ShredderComponent>(furniture) is { State: ShredderRunning } shredder)
                shredder.StartTotalSeconds = now - shredder.TotalSeconds;

            if (AgentTools.GetAgentComponent<CompressorComponent>(furniture) is { State: PressRunning } press)
                press.StartTotalSeconds = now - press.TotalSeconds;

            if (AgentTools.GetAgentComponent<BrewComponent>(furniture) is { } brew && brew.IsBrewing())
            {
                brew.StartHour = nowHour - brew.TotalHours;
                furniture.TryFinishBrew();
            }

            if (AgentTools.GetAgentComponent<DyeComponent>(furniture) is { } dye && dye.IsRunning())
            {
                dye.StartHour = nowHour - dye.ResultCount * dye.HoursPerBucket;
                furniture.TryFinishDye();
            }

            if (AgentTools.GetAgentComponent<CookingComponent>(furniture) is { State: CookingState.Running } cooking)
                cooking.CookStartTotalSeconds = now - cooking.CookDuration;

            if (!isTradeLocked && AgentTools.GetAgentComponent<DroneTripComponent>(furniture) is { } drone && drone.IsBusy() && drone.ReturnSec > now)
                drone.ReturnSec = now;
        }
    }

    /// <summary>Each distinct failure of a hold is logged once, so a hold that keeps failing does not flood the log.</summary>
    private void Report(string name, string? error)
    {
        if (error != null && _reported.Add(name + error)) _log($"hold {name}: {error} (reported once)");
    }
}
