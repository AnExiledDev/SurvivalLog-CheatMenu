using System;
using CheatMenu.Core;
using GameCore.HotUpdate;
using GameCore.HotUpdate.ReduxUI;
using HarmonyLib;
using Il2CppInterop.Runtime;

namespace CheatMenu.Adapters;

/// <summary>
/// The game's loop reward screen, opened mid-run. The game opens it once a run is over, and closing it starts the next
/// loop (RA_Close saves the run as over). The menu opens it with an open mode the game never uses, and for that mode the
/// close only puts the screen away, so the run goes on, and the screen's "start the next loop" button says Close. Hooked
/// the first time the menu opens the screen; without the close hook the menu does not open it, since closing it would end
/// the run. These run inside the game's reducers, so they only record the close; the session does the follow-up work on
/// its next frame.
/// </summary>
internal static class RewardScreenPatch
{
    public const int MidRun = RewardScreenModes.MidRun;

    private static bool _hasTried;
    private static bool _hasReported;
    private static bool _hasClosed;
    private static int _openMode;
    private static bool _isRelabeled;
    private static Action<string> _log = _ => { };

    public static bool IsHooked { get; private set; }

    public static void Install(Harmony harmony, Action<string> log)
    {
        if (_hasTried) return;

        _hasTried = true;
        _log = log;

        try
        {
            harmony.Patch(AccessTools.Method(typeof(Reducer_Web_RebirthUpgrade), "RA_Close"), prefix: new HarmonyMethod(typeof(RewardScreenPatch), nameof(KeepRun)));
            IsHooked = true;
        }
        catch (Exception ex)
        {
            log("could not hook the loop reward screen's close, so the menu will not open that screen: " + ex.Message);

            return;
        }

        try
        {
            harmony.Patch(AccessTools.Method(typeof(Reducer_Web_RebirthUpgrade), "RA_TryClose"), prefix: new HarmonyMethod(typeof(RewardScreenPatch), nameof(SkipConfirm)));
        }
        catch (Exception ex)
        {
            log("could not hook the loop reward screen's close button, so it asks before closing: " + ex.Message);
        }

        try
        {
            harmony.Patch(AccessTools.Method(typeof(Reducer_Web_RebirthUpgrade), "RA_Open"), prefix: new HarmonyMethod(typeof(RewardScreenPatch), nameof(NoteOpenMode)), postfix: new HarmonyMethod(typeof(RewardScreenPatch), nameof(RelabelOpenScreen)));
            harmony.Patch(AccessTools.Method(typeof(WebUI_RebirthUpgrade), nameof(WebUI_RebirthUpgrade.InitLocalText)), postfix: new HarmonyMethod(typeof(RewardScreenPatch), nameof(RelabelAfterGameText)));
        }
        catch (Exception ex)
        {
            log("could not hook the loop reward screen's text, so its close button still says it starts the next loop: " + ex.Message);
        }
    }

    /// <summary>True once after the screen the menu opened has closed.</summary>
    public static bool TakeClosed()
    {
        if (!_hasClosed) return false;

        _hasClosed = false;

        return true;
    }

    /// <summary>
    /// Skips the game's close for the menu's screen: the game's own would save the run as over. Its one other job, lifting
    /// the hold on skill level-up popups that opening the screen put on, is done here.
    /// </summary>
    private static bool KeepRun(State_Web_RebirthUpgrade state, ref State_Web_RebirthUpgrade __result)
    {
        if (!IsMidRun(state)) return true;

        _hasClosed = true;
        __result = state;

        try
        {
            EventDispatcherTools.NotifyGlobal(EnumNotify_Lifecycle.ResumeBattleLogic);
            EventDispatcherTools.NotifyGlobal<int>(EnumNotify_Proficiency.ProficiencyPopupBlock, 0);
        }
        catch (Exception ex)
        {
            Report(ex);
        }

        // Even when the game could not be resumed, the game's close must not run: it would end the run.
        return false;
    }

    /// <summary>Notes how the screen is being opened, for its text. Every open goes through here once the hooks are in.</summary>
    private static void NoteOpenMode(Ac_RebirthUpgrade_Open ac)
    {
        try
        {
            _openMode = ac?.OpenMode ?? 0;
        }
        catch (Exception ex)
        {
            _openMode = 0;
            Report(ex);
        }
    }

    /// <summary>
    /// Sets the button's text for this open on a screen the game already has. A screen the menu relabeled and the game
    /// then opens for real gets its own text back, since there the button does start the next loop.
    /// </summary>
    private static void RelabelOpenScreen()
    {
        try
        {
            if (OpenScreen() is not { } screen) return;

            if (RewardScreenModes.CloseLabel(_openMode, GameLanguage.IsChinese()) is not null) Relabel(screen);
            else if (_isRelabeled) screen.InitLocalText();
        }
        catch (Exception ex)
        {
            Report(ex);
        }
    }

    /// <summary>The game fills in the screen's text when its page loads; mid-run, the button's text goes back to Close.</summary>
    private static void RelabelAfterGameText(WebUI_RebirthUpgrade __instance)
    {
        try
        {
            _isRelabeled = false;

            if (__instance != null) Relabel(__instance);
        }
        catch (Exception ex)
        {
            Report(ex);
        }
    }

    private static void Relabel(WebUI_RebirthUpgrade screen)
    {
        var text = RewardScreenModes.CloseLabel(_openMode, GameLanguage.IsChinese());
        var msg = screen._LocalizationMsg;

        if (text == null || msg == null) return;

        msg.cycleBtn = text;
        msg.WaitForSend = true;
        screen.OnMsgChange();
        _isRelabeled = true;
    }

    private static WebUI_RebirthUpgrade? OpenScreen()
    {
        var layer = GameSingleton.Existing<ReduxUISystem>()?.GetWebUILayer();

        if (layer == null || !layer.GetWebUI(Il2CppType.Of<WebUI_RebirthUpgrade>(), out var vm) || vm == null) return null;

        return vm.TryCast<WebUI_RebirthUpgrade>();
    }

    /// <summary>
    /// With Planning Points left, the game's close button asks first: "you won't be able to allocate them after starting
    /// this loop". Mid-run that is not true, so the menu's screen closes straight away, as the game's does with none left.
    /// </summary>
    private static bool SkipConfirm(State_Web_RebirthUpgrade state, ref State_Web_RebirthUpgrade __result)
    {
        if (!IsMidRun(state)) return true;

        try
        {
            Ac_RebirthUpgrade_Close.SendAction();
            __result = state;

            return false;
        }
        catch (Exception ex)
        {
            Report(ex);

            return true;
        }
    }

    private static bool IsMidRun(State_Web_RebirthUpgrade state)
    {
        try
        {
            return state != null && state.CachedOpenMode == MidRun;
        }
        catch (Exception ex)
        {
            Report(ex);

            return false;
        }
    }

    private static void Report(Exception ex)
    {
        if (_hasReported) return;

        _hasReported = true;
        _log("loop reward screen hook failed (reported once): " + ex);
    }
}
