using System;
using System.Collections.Generic;
using CheatMenu.Core;
using GameCore.HotUpdate;
using ExiledToolkit.Game;
using GameCore.HotUpdate.Battle.Logic;

namespace CheatMenu.Adapters;

/// <summary>
/// The game's GM handler. The game ships it whole but never makes one outside the developers' builds, where it
/// talks to a GM web page over a socket. The mod makes its own, hands it the same JSON messages that page sent, and
/// catches what it would send back (readouts and results) before it reaches the missing socket. The game's
/// instance, if a build ever makes one, is left alone.
/// </summary>
internal sealed class GmBridge
{
    private static GmBridge? _active;
    private static Action<string> _log = _ => { };
    private static PatchKit? _hooks;

    private static readonly List<string> NoneSent = new();

    private readonly List<string> _sent = new();
    private readonly RepeatedReadouts _repeats = new();
    private WebGm? _gm;
    private bool _hasReportedTickFailure;

    public GmBridge(Action<string> log)
    {
        _log = log;
        _active = this;
    }

    public static bool IsInGame => BaseSingleton<BattleLogicWorld>.IsInstanceCreated;

    public static void Apply(PatchKit hooks)
    {
        _hooks = hooks;
        Patch(hooks, "OnSend", nameof(CatchSend));
        Patch(hooks, "OnSendDedup", nameof(CatchSendDedup));
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
        if (isOn) _repeats.Clear();
        // Turning off never needs a save: a handler left connected keeps building readouts nobody reads.
        if (!isOn)
        {
            if (_gm != null) _gm.IsConnected = false;

            return;
        }

        if (!IsInGame) return;

        Handler().IsConnected = true;
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
    public IReadOnlyList<string> TakeSent()
    {
        // Most frames send nothing; those cost no list.
        if (_sent.Count == 0) return NoneSent;

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

    private static void Patch(PatchKit hooks, string method, string prefix) =>
        hooks.Patch(typeof(GmBridge), typeof(WebGm), method, prefix: prefix, done: "catching GM " + method, consequence: "the panel will not see the game's GM readouts");

    private static bool CatchSend(WebGm __instance, BaseMsg msg) => !Take(__instance, msg);

    private static bool CatchSendDedup(WebGm __instance, BaseMsg msg) => !Take(__instance, msg);

    /// <summary>True when the message was ours and is kept; never throws into the game.</summary>
    private static bool Take(WebGm instance, BaseMsg msg)
    {
        try
        {
            var bridge = _active;

            if (bridge?._gm == null || instance.Pointer != bridge._gm.Pointer) return false;

            if (GmReadouts.IsUnused(msg.msgHead)) return true;

            var json = Newtonsoft.Json.JsonConvert.SerializeObject(msg);

            if (bridge._repeats.IsNew(msg.msgHead, json)) bridge._sent.Add(json);

            return true;
        }
        catch (Exception ex)
        {
            _hooks?.Fail("reading a GM readout", ex);

            // Ours or not, the original would only fail on the missing socket.
            return _active?._gm != null && instance.Pointer == _active._gm.Pointer;
        }
    }
}
