using System;
using System.Collections.Generic;
using GameCore.HotUpdate;
using GameCore.HotUpdate.Battle.Logic;
using HarmonyLib;

namespace CheatMenu.Adapters;

/// <summary>
/// The game's own GM handler. The game ships it whole but never makes one outside the developers' builds, where it
/// talks to a GM web page over a socket. The mod makes its own, hands it the same JSON messages that page sent, and
/// catches what it would send back (readouts and results) before it reaches the missing socket. The game's own
/// instance, if a build ever makes one, is left alone.
/// </summary>
internal sealed class GmBridge
{
    private static GmBridge? _active;
    private static Action<string> _log = _ => { };
    private static bool _hasReportedSendFailure;

    private readonly List<string> _sent = new();
    private WebGm? _gm;
    private bool _hasReportedTickFailure;

    public GmBridge(Action<string> log)
    {
        _log = log;
        _active = this;
    }

    public static bool IsInGame => BaseSingleton<BattleLogicWorld>.IsInstanceCreated;

    public static void Apply(Harmony harmony, Action<string> log)
    {
        Patch(harmony, "OnSend", nameof(CatchSend), log);
        Patch(harmony, "OnSendDedup", nameof(CatchSendDedup), log);
    }

    /// <summary>Runs one GM message now. Returns null when the game took it, or why it did not.</summary>
    public string? Run(string json)
    {
        if (!IsInGame) return "load a save first";

        try
        {
            Handler().ProcessMessage(json);

            return null;
        }
        catch (Exception ex)
        {
            _log("GM message failed: " + json + " -> " + ex);

            return ex.GetType().Name + ": " + ex.Message;
        }
    }

    /// <summary>
    /// While on, the handler sends its live readouts (characters, the selected agent's attributes, the UI stack) every
    /// couple of seconds, as it does for its own page.
    /// </summary>
    public void Live(bool isOn)
    {
        if (_gm == null && !isOn) return;
        if (!IsInGame) return;

        Handler().IsConnected = isOn;
    }

    /// <summary>The handler's own per-frame work: its queue, the debug overlays it draws, its chapter skip.</summary>
    public void Tick(float deltaTime, float unscaledDeltaTime)
    {
        if (_gm == null || !IsInGame) return;

        try
        {
            _gm.OnUpdateAction(deltaTime, unscaledDeltaTime);
        }
        catch (Exception ex)
        {
            if (!_hasReportedTickFailure) _log("GM handler update failed (reported once): " + ex);

            _hasReportedTickFailure = true;
        }
    }

    /// <summary>What the handler sent since the last call, each one JSON as its page would have read it.</summary>
    public List<string> TakeSent()
    {
        var sent = new List<string>(_sent);
        _sent.Clear();

        return sent;
    }

    private WebGm Handler()
    {
        if (_gm != null) return _gm;

        _gm = new WebGm();
        _log("made the game's GM handler");

        return _gm;
    }

    private static void Patch(Harmony harmony, string method, string prefix, Action<string> log)
    {
        try
        {
            harmony.Patch(AccessTools.Method(typeof(WebGm), method), prefix: new HarmonyMethod(typeof(GmBridge), prefix));
            log("catching GM " + method);
        }
        catch (Exception ex)
        {
            log($"could not hook WebGm.{method}, the panel will not see the game's GM readouts: {ex.Message}");
        }
    }

    private static bool CatchSend(WebGm __instance, BaseMsg msg) => !Take(__instance, msg);

    private static bool CatchSendDedup(WebGm __instance, BaseMsg msg) => !Take(__instance, msg);

    /// <summary>True when the message was ours and is kept; never throws into the game.</summary>
    private static bool Take(WebGm instance, BaseMsg msg)
    {
        try
        {
            var bridge = _active;

            if (bridge?._gm == null || instance.Pointer != bridge._gm.Pointer) return false;

            bridge._sent.Add(Newtonsoft.Json.JsonConvert.SerializeObject(msg));

            return true;
        }
        catch (Exception ex)
        {
            if (!_hasReportedSendFailure) _log("reading a GM readout failed (reported once): " + ex.Message);

            _hasReportedSendFailure = true;

            // Ours or not, the original would only fail on the missing socket.
            return _active?._gm != null && instance.Pointer == _active._gm.Pointer;
        }
    }
}
