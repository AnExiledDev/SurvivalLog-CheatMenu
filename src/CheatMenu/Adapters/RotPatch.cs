using System;
using ExiledToolkit.Game;
using GameCore.HotUpdate;
using GameCore.HotUpdate.Battle.Logic;

namespace CheatMenu.Adapters;

/// <summary>
/// Never spoil: while it is on, the game's hourly rot check (ItemManager.CheckAndProcessRot, called only from its
/// SettleRotAll) turns nothing rotten, and each new game hour moves every food clock on by that hour so freshness
/// stays where it was. Hooked the first time it is turned on; the hook fails soft and lets the game rot as usual.
/// </summary>
internal static class RotPatch
{
    private static bool _hasTried;
    private static PatchKit? _hooks;

    public static bool IsOn { get; set; }

    public static bool IsHooked { get; private set; }

    public static void Install(PatchKit hooks)
    {
        if (_hasTried) return;

        _hasTried = true;
        _hooks = hooks;
        IsHooked = hooks.Patch(typeof(RotPatch), typeof(ItemManager), nameof(ItemManager.CheckAndProcessRot), prefix: nameof(NoRot), consequence: "Never spoil only holds freshness");
    }

    /// <summary>Moves every food clock on by <paramref name="hours"/>, so the hours that passed are not counted. Returns how many moved.</summary>
    public static int Hold(BattleLogicWorld world, int hours)
    {
        var cache = world._ItemManager?.OwnerCache;
        var config = GameSingleton.Existing<ConfigManager>();
        var moved = 0;

        if (cache == null || config == null || hours <= 0) return 0;

        foreach (var owner in cache.Values)
        {
            if (owner == null) continue;

            foreach (var item in owner.Values)
            {
                if (!Spoils(config, item)) continue;

                item.StartTime += hours;
                moved++;
            }
        }

        return moved;
    }

    /// <summary>Whether an item has a food clock at all: a life in its table row and time left on it.</summary>
    public static bool Spoils(ConfigManager config, ItemData? item) =>
        item != null && item.TimeLeft != 0 && item.OriginalTimeLeft > 0 && config.Get_Config_Item(item.ItemConfigId) is { Life: > 0 };

    private static bool NoRot(ref bool __result)
    {
        try
        {
            if (!IsOn) return true;

            __result = false;

            return false;
        }
        catch (Exception ex)
        {
            _hooks?.Fail("in the Never spoil hook, food rots as usual", ex);

            return true;
        }
    }
}
