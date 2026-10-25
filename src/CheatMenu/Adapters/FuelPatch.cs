using System;
using GameCore.HotUpdate.Battle.Logic;
using HarmonyLib;
using Il2CppSystem.Collections.Generic;

namespace CheatMenu.Adapters;

/// <summary>
/// No fuel use: generators and stoves burn nothing while it is on. Hooked the first time it is turned on, so a game
/// where it is never used is never hooked. Both hooks fail soft and hand the game its own burn when off.
/// </summary>
internal static class FuelPatch
{
    private static bool _hasTried;
    private static bool _hasReported;
    private static Action<string> _log = _ => { };

    public static bool IsOn { get; set; }

    public static bool IsHooked { get; private set; }

    public static void Install(Harmony harmony, Action<string> log)
    {
        if (_hasTried) return;

        _hasTried = true;
        _log = log;

        try
        {
            harmony.Patch(AccessTools.Method(typeof(GeneratorFuelComponent), nameof(GeneratorFuelComponent.ConsumeFuel)), prefix: new HarmonyMethod(typeof(FuelPatch), nameof(NoBurn)));
            harmony.Patch(AccessTools.Method(typeof(CookingComponent), nameof(CookingComponent.UpdateFuelFromProgress)), prefix: new HarmonyMethod(typeof(FuelPatch), nameof(NoCookBurn)));
            IsHooked = true;
        }
        catch (Exception ex)
        {
            log("could not hook fuel use, No fuel use does nothing: " + ex.Message);
        }
    }

    private static void NoBurn(ref float burnValueToConsume)
    {
        try
        {
            if (IsOn) burnValueToConsume = 0f;
        }
        catch (Exception ex)
        {
            Report(ex);
        }
    }

    /// <summary>
    /// The stove burns fuel by how far the cook has got, so the burn is skipped whole rather than scaled: the game
    /// then reads its fuel as still there and the cook goes on.
    /// </summary>
    private static bool NoCookBurn(CookingComponent __instance, ref List<CookingFuelSlot> burnedOut, ref bool __result)
    {
        try
        {
            if (!IsOn) return true;

            var slots = __instance.GetFuelSlots();

            if (slots == null || slots.Count == 0) return true;

            burnedOut = null!;
            __result = true;

            return false;
        }
        catch (Exception ex)
        {
            Report(ex);

            return true;
        }
    }

    private static void Report(Exception ex)
    {
        if (_hasReported) return;

        _hasReported = true;
        _log("No fuel use hook failed, the game burns fuel as usual (reported once): " + ex);
    }
}
