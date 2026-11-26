using System;
using System.Diagnostics;
using CheatMenu.Core;
using ExiledToolkit;
using ExiledToolkit.Game;
using ExiledToolkit.Web;
using UnityEngine;

namespace CheatMenu.Adapters;

/// <summary>One frame of the mod: the key, the panel's messages, the GM handler's own work and what it sent back.</summary>
internal sealed class CheatSession
{
    /// <summary>The name the panel holds the game's keys and clicks under.</summary>
    private const string WindowName = "CheatMenu.panel";

    private readonly GmBridge _gm;
    private readonly GmFlags _flags;
    private readonly ModActions _actions;
    private readonly Holds _holds;
    private readonly PresetStore _presets;
    private readonly WebPage _page;
    private readonly PageMailbox _inbox;
    private readonly Action<string> _log;
    private const double SlowPartMs = 20;

    private readonly WebKeyboard _keyboard = new();
    private readonly Stopwatch _part = new();
    private readonly SaveWatch _saves = new();
    private bool _isOpen;
    private double _slowPartMs;

    public CheatSession(GmBridge gm, GmFlags flags, ModActions actions, Holds holds, PresetStore presets, WebPage page, PageMailbox inbox, Action<string> log)
    {
        _gm = gm;
        _flags = flags;
        _actions = actions;
        _holds = holds;
        _presets = presets;
        _page = page;
        _inbox = inbox;
        _log = log;
    }

    public KeyCode Key { get; set; } = KeyCode.F3;

    /// <summary>The slowest part of the last frame when one took a while, so a slow frame in the log says what it was.</summary>
    public string? SlowPart { get; private set; }

    private static readonly double StartedAt = ExiledToolkit.Kit.Clock.Now;

    /// <summary>Seconds since the mod started, from the Toolkit's clock. Counted from the start so a float keeps its precision.</summary>
    private static float Now() => (float)(ExiledToolkit.Kit.Clock.Now - StartedAt);

    public void Update()
    {
        SlowPart = null;
        _slowPartMs = 0;
        _page.KeepInstalled(Now());
        _saves.Seen(GmBridge.IsInGame);

        // While a text box has the keyboard, here or in another mod's window, the panel key is typing, not a toggle.
        if (!_keyboard.IsClaimed && Key != KeyCode.None && Input.GetKeyDown(Key) && !Typing.IsActive) Toggle();

        while (_inbox.TryTake(out var message))
        {
            var command = PageCommand.Parse(message);

            _part.Restart();
            Handle(command);
            if (IsSlowest(out var ms)) SlowPart = $"{command.Describe()} took {ms:0} ms";
        }

        _part.Restart();
        _gm.Tick(Time.deltaTime, Time.unscaledDeltaTime);
        if (IsSlowest(out var tickMs)) SlowPart = $"the game's GM handler and its readouts took {tickMs:0} ms";

        if (_holds.Tick(Now()) && _isOpen) Switches();

        if (RewardScreenPatch.TakeClosed()) _actions.RewardScreenClosed();

        var sent = _gm.TakeSent();

        if (sent.Count == 0 || !_isOpen) return;

        _part.Restart();
        _page.Readouts(sent);
        if (IsSlowest(out var readMs)) SlowPart = $"handing {sent.Count} readouts to the panel took {readMs:0} ms";
    }

    private bool IsSlowest(out double ms)
    {
        ms = _part.Elapsed.TotalMilliseconds;

        if (ms < SlowPartMs || ms <= _slowPartMs) return false;

        _slowPartMs = ms;

        return true;
    }

    private void Toggle()
    {
        if (_isOpen)
        {
            Close();

            return;
        }

        var state = "{\"inGame\":" + (GmBridge.IsInGame ? "true" : "false") +
                    ",\"save\":" + _saves.Id +
                    ",\"chinese\":" + (GameLanguage.IsChinese() ? "true" : "false") +
                    ",\"key\":" + JsText.Literal(Key == KeyCode.None ? "" : Key.ToString()) +
                    ",\"flags\":" + _flags.Json() +
                    ",\"holds\":" + _holds.Json() +
                    ",\"presets\":" + PresetJson.OrNull(_presets.Load()) + "}";

        if (!_page.Open(state)) return;

        _isOpen = true;
        InputGate.Opened(WindowName);
        _gm.Live(true);
    }

    private void Close()
    {
        _isOpen = false;
        _keyboard.Release();
        _page.Close();
        InputGate.Closed(WindowName);
        _gm.Live(false);
    }

    private void Handle(PageCommand command)
    {
        switch (command)
        {
            case PageCommand.Close:
                if (_isOpen) Close();
                break;
            case PageCommand.Gm gm:
                RunGm(gm);
                break;
            case PageCommand.Flag flag:
                var isSet = _flags.Set(flag.Name, flag.IsOn);
                _log($"cheat: {flag.Name} {(flag.IsOn ? "on" : "off")}{(isSet ? "" : " (not set)")}");
                Switches();
                break;
            case PageCommand.Act act:
                RunAct(act);
                break;
            case PageCommand.Hold hold:
                var isHeld = _holds.Set(hold.Name, hold.IsOn, Now());
                _log($"cheat: hold {hold.Name} {(hold.IsOn ? "on" : "off")}{(isHeld ? "" : " (not set)")}");
                Switches();
                break;
            case PageCommand.Focus focus:
                if (focus.IsTyping && _isOpen) _keyboard.Claim();
                else _keyboard.Release();
                break;
            case PageCommand.SavePresets presets:
                _presets.Save(presets.Json);
                break;
            case PageCommand.Ready:
                _log("panel script ready");
                // A reload while open loses the panel, so the game must stop waiting on it too.
                if (_isOpen) Close();
                break;
            case PageCommand.NoScript:
                _page.Install();
                // Done here, while the game loads, rather than on the first visit to the Mod tests tab.
                ModTestCheats.Warm(_log);
                break;
            case PageCommand.Unknown unknown:
                _log("panel: " + unknown.Text);
                break;
        }
    }

    private void RunGm(PageCommand.Gm gm)
    {
        var head = GmRequest.Head(gm.Json, out var why);
        string? error;

        if (head == null)
        {
            error = why;
        }
        else
        {
            _log("cheat: " + gm.Json);
            error = _gm.Run(gm.Json);
        }

        _page.Result(gm.RequestId, error);
        Switches();
    }

    private void RunAct(PageCommand.Act act)
    {
        // Lists only read the game, so they stay out of the cheat log.
        if (act.Name != "list") _log($"cheat: {act.Name} {act.ArgsJson}".TrimEnd());

        string text;

        // Finishing an event keeps working after this frame, alongside the holds that share the game's auto-play.
        var error = act.Name == "event-finish"
            ? _holds.Finish(ActArgs.Parse(act.ArgsJson).Long("event"), Now(), out text)
            : _actions.Run(act.Name, act.ArgsJson, out text);

        if (error != null) _log($"cheat {act.Name}: {error}");

        _page.Result(act.RequestId, error, text);
        Switches();

        // The game's screen opens under the panel, so the panel gets out of the way.
        if (error == null && ModCheats.OpensScreen(act.Name) && _isOpen) Close();
    }

    private void Switches() => _page.Flags(_flags.Json(), _holds.Json());
}
