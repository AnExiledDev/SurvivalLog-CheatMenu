using System;
using System.Collections.Generic;
using System.Text;
using CheatMenu.Core;
using ExiledToolkit.Game;
using GameCore.HotUpdate;
using GameCore.HotUpdate.Battle.Logic;
using GameCore.HotUpdate.Battle.Show;
using GameCore.HotUpdate.ReduxUI;

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

    // Auto-play moves an event on once its timer reaches 1.5 seconds; a held event's timer is set back every half
    // second, and if one were ever left behind it would only wait a minute.
    private const float HeldBack = -60f;

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
    private readonly PatchKit _hooks;
    private readonly Action<string> _log;
    private readonly EventFinish _finish = new();
    private readonly GameEvents _events = new();
    private float _nextAt;
    private float _stepEndsAt;
    private bool _isStepping;
    private bool _isAutoOwned;
    private bool _autoWas;
    private bool _durabilityWas;
    private int _spoilHour;
    private long _hovered;

    public Holds(GmBridge gm, GmFlags flags, PatchKit hooks, Action<string> log)
    {
        _gm = gm;
        _flags = flags;
        _hooks = hooks;
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
        if (_on.Count == 0 && !_finish.IsActive) return false;

        if (!GmBridge.IsInGame)
        {
            // A save unloaded under the holds: the game's state they changed went with it. No fuel use is the
            // mod's own switch, so it stays. Peaceful's durability lock is a game switch that outlives the save, so
            // it goes back to what it was before the next save loads.
            if (_on.Contains("peaceful")) _flags.Set(Durability, _durabilityWas);
            RotPatch.IsOn = false;
            _finish.Forget();
            _isStepping = false;
            _isAutoOwned = false;

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

        if (_finish.IsActive) KeepFinishing(world, now);

        return ended;
    }

    /// <summary>
    /// Starts playing the picked running event, or every running one, through to its end. Null when it started, or
    /// why it did not. How each one ends is told in a toast.
    /// </summary>
    public string? Finish(long? only, float now, out string text)
    {
        text = "";

        if (!GmBridge.IsInGame || GameSingleton.Existing<BattleLogicWorld>() is not { } world) return "load a save first";

        var manager = world._DynamicEventManager;
        var events = manager?.CurrentArgsDict;

        if (manager == null || events == null) return "no events are running";

        var config = GameSingleton.Existing<ConfigManager>();
        var isChinese = GameLanguage.IsChinese();
        var picked = new List<(long Id, string Name)>();

        foreach (var pair in events)
        {
            if (pair.Value == null) continue;
            if (only is { } id && pair.Key != id) continue;

            var eventId = pair.Value.EventId;
            var row = config?._Config_Event_Dict is { } table && table.TryGetValue(eventId, out var found) ? found : null;

            picked.Add((pair.Key, ListLabels.Named(ModActions.GameName(config, row?._Name_k__BackingField, row?._Name_Local_k__BackingField), "Event", "事件", eventId, isChinese)));
        }

        if (picked.Count == 0) return only == null ? "no events are running" : "that event is no longer running";

        _events.Manager = manager;
        foreach (var (id, name) in picked) _finish.Pick(_events, id, name, now);
        SyncAuto(manager);
        KeepFinishing(world, now);

        text = picked.Count == 1 ? "finishing " + picked[0].Name : $"finishing {picked.Count} events";

        return null;
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
                FuelPatch.Install(_hooks);
                if (!FuelPatch.IsHooked) throw new InvalidOperationException("the fuel hooks could not go in");
                FuelPatch.IsOn = true;
                break;
            case "nospoil":
                RotPatch.Install(_hooks);
                RotPatch.IsOn = true;
                _spoilHour = Hour(world!);
                break;
            case "hover":
                _hovered = 0;
                break;
            case "eventstep":
                var manager = world!._DynamicEventManager;
                _isStepping = true;
                SyncAuto(manager);
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
            case "nospoil":
                RotPatch.IsOn = false;
                break;
            case "eventstep":
                _isStepping = false;
                SyncAuto(world?._DynamicEventManager);
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
                case "nospoil":
                    KeepFresh(world);
                    break;
                case "hover":
                    ShowHovered(world);
                    break;
            }
        }
        catch (Exception ex)
        {
            Report(name, ex.GetType().Name + ": " + ex.Message);
        }
    }

    /// <summary>
    /// The game's auto-play switch is the mod's while the event step or a finish needs it, and goes back to what it
    /// was when neither does.
    /// </summary>
    private void SyncAuto(DynamicEventManager? manager)
    {
        var isWanted = _isStepping || _finish.IsBusy;

        if (isWanted == _isAutoOwned) return;

        if (isWanted)
        {
            _autoWas = manager!.IsGmAutoComplete;
            manager.IsGmAutoComplete = true;
        }
        else if (manager != null)
        {
            manager.IsGmAutoComplete = _autoWas;
        }

        _isAutoOwned = isWanted;
    }

    /// <summary>
    /// Tells how each picked event ended, holds the other events back while one is still going (unless the player had
    /// auto-play on for all of them, or the event step is running), and hands the switch back when all are done.
    /// </summary>
    private void KeepFinishing(BattleLogicWorld world, float now)
    {
        var manager = world._DynamicEventManager;

        _events.Manager = manager;

        try
        {
            foreach (var ended in _finish.Tick(_events, now, !_autoWas && !_isStepping))
            {
                var waitsOnDays = !ended.IsFinished && manager.GetEventByInstanceId(ended.Id) is { } args && manager.IsGmTimeBasedTask(args.EventId);

                _log("finish event: " + EventFinish.Say(ended, waitsOnDays, false));
                ModActions.ToolkitToast(EventFinish.Say(ended, waitsOnDays, GameLanguage.IsChinese()), ended.IsFinished ? "success" : "warning");
            }

            SyncAuto(manager);
        }
        catch (Exception ex)
        {
            // Something in the game changed under the finish: it stops rather than leave auto-play on for good.
            _log($"finish event stopped: {ex}");

            try
            {
                _finish.Drop(_events);
                SyncAuto(manager);
            }
            catch (Exception again)
            {
                _log($"finish event could not let the events go: {again.Message}");
            }
        }
    }

    private static int Hour(BattleLogicWorld world) => world._GameTimeManager.GetTotalSeconds() / SecondsPerHour;

    /// <summary>Each game hour that passed is given back to every food clock, so freshness stays where it was.</summary>
    private void KeepFresh(BattleLogicWorld world)
    {
        var hour = Hour(world);

        // A different save or a rollback put the clock back: start counting from there.
        if (hour < _spoilHour) _spoilHour = hour;
        if (hour == _spoilHour) return;

        RotPatch.Hold(world, hour - _spoilHour);
        _spoilHour = hour;
    }

    /// <summary>When the cursor moves onto something new, the game's short text names its instance and config id.</summary>
    private void ShowHovered(BattleLogicWorld world)
    {
        var id = GameSingleton.Existing<BattleShowWorld>()?._CameraManager?.HoveredInstanceId ?? 0;

        if (id == _hovered) return;

        _hovered = id;

        if (id <= 0) return;

        var config = world._AgentManager?.GetAgent(id)?.AgentConfigId;

        Ac_PopText_AddPopText.SendAction(config is { } c ? $"#{id}  config {c}" : $"#{id}");
    }

    /// <summary>Each of the five bars below its maximum is set to it with the game's GM attribute message.</summary>
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
    /// Every running timed machine has its start moved back so the game's update finishes the job the usual way.
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

    /// <summary>The game's running events, for <see cref="EventFinish"/>.</summary>
    private sealed class GameEvents : EventFinish.IEvents
    {
        public DynamicEventManager Manager { get; set; } = null!;

        public IEnumerable<long> Running()
        {
            var running = new List<long>();
            var events = Manager.CurrentArgsDict;

            if (events == null) return running;

            foreach (var pair in events)
                if (pair.Value != null) running.Add(pair.Key);

            return running;
        }

        public void HoldBack(long id) => Manager._gmAutoTimers[id] = HeldBack;

        public void LetGo(long id) => Manager.GmAutoReset(id);
    }

    /// <summary>Each distinct failure of a hold is logged once, so a hold that keeps failing does not flood the log.</summary>
    private void Report(string name, string? error)
    {
        if (error != null && _reported.Add(name + error)) _log($"hold {name}: {error} (reported once)");
    }
}
