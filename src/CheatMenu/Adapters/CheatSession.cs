using System;
using CheatMenu.Core;
using UnityEngine;

namespace CheatMenu.Adapters;

/// <summary>One frame of the mod: the key, the panel's messages, the GM handler's own work and what it sent back.</summary>
internal sealed class CheatSession
{
    private readonly GmBridge _gm;
    private readonly GmFlags _flags;
    private readonly ModActions _actions;
    private readonly Holds _holds;
    private readonly PresetStore _presets;
    private readonly WebPage _page;
    private readonly Action<string> _log;
    private readonly WebKeyboard _keyboard = new();
    private bool _isOpen;

    public CheatSession(GmBridge gm, GmFlags flags, ModActions actions, Holds holds, PresetStore presets, WebPage page, Action<string> log)
    {
        _gm = gm;
        _flags = flags;
        _actions = actions;
        _holds = holds;
        _presets = presets;
        _page = page;
        _log = log;
    }

    public KeyCode Key { get; set; } = KeyCode.F3;

    public void Update()
    {
        _page.KeepInstalled(Time.unscaledTime);

        // While a text box has the keyboard, the panel key is typing, not a toggle.
        if (!_keyboard.IsClaimed && Key != KeyCode.None && Input.GetKeyDown(Key)) Toggle();

        while (PageMessages.TryTake(out var command)) Handle(command);

        _gm.Tick(Time.deltaTime, Time.unscaledDeltaTime);

        if (_holds.Tick(Time.unscaledTime) && _isOpen) Switches();

        var sent = _gm.TakeSent();

        if (sent.Count > 0 && _isOpen) _page.Readouts(sent);
    }

    private void Toggle()
    {
        if (_isOpen)
        {
            Close();

            return;
        }

        var state = "{\"inGame\":" + (GmBridge.IsInGame ? "true" : "false") +
                    ",\"chinese\":" + (GameLanguage.IsChinese() ? "true" : "false") +
                    ",\"key\":" + JsText.Literal(Key == KeyCode.None ? "" : Key.ToString()) +
                    ",\"flags\":" + _flags.Json() +
                    ",\"holds\":" + _holds.Json() +
                    ",\"presets\":" + _presets.Load() + "}";

        if (!_page.Open(state)) return;

        _isOpen = true;
        InputGate.PanelOpened();
        _gm.Live(true);
    }

    private void Close()
    {
        _isOpen = false;
        _keyboard.Release();
        _page.Close();
        InputGate.PanelClosed();
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
                var isHeld = _holds.Set(hold.Name, hold.IsOn, Time.unscaledTime);
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

        var error = _actions.Run(act.Name, act.ArgsJson, out var text);

        if (error != null) _log($"cheat {act.Name}: {error}");

        _page.Result(act.RequestId, error, text);
        Switches();
    }

    private void Switches() => _page.Flags(_flags.Json(), _holds.Json());
}
