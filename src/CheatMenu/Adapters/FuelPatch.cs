using System;
using ExiledToolkit.Game;
using GameCore.HotUpdate.Battle.Logic;
using Il2CppSystem.Collections.Generic;

namespace CheatMenu.Adapters;

/// <summary>
/// No fuel use: generators and stoves burn nothing while it is on. Hooked the first time it is turned on, so a game
/// where it is never used is never hooked. Both hooks fail soft and hand the game its own burn when off.
/// </summary>
internal static class FuelPatch
{
    private const string Consequence = "No fuel use does nothing";
    private const string Doing = "in the No fuel use hook, the game burns fuel as usual";

    private static bool _hasTried;
    private static PatchKit? _hooks;

    public static bool IsOn { get; set; }

    public static bool IsHooked { get; private set; }

    public static void Install(PatchKit hooks)
    {
        if (_hasTried) return;

        _hasTried = true;
        _hooks = hooks;
        IsHooked = hooks.Patch(typeof(FuelPatch), typeof(GeneratorFuelComponent), nameof(GeneratorFuelComponent.ConsumeFuel), prefix: nameof(NoBurn), consequence: Consequence)
                   && hooks.Patch(typeof(FuelPatch), typeof(CookingComponent), nameof(CookingComponent.UpdateFuelFromProgress), prefix: nameof(NoCookBurn), consequence: Consequence);
    }

    private static void NoBurn(ref float burnValueToConsume)
    {
        try
        {
            if (IsOn) burnValueToConsume = 0f;
        }
        catch (Exception ex)
        {
            _hooks?.Fail(Doing, ex);
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
            _hooks?.Fail(Doing, ex);

            return true;
        }
    }
}
