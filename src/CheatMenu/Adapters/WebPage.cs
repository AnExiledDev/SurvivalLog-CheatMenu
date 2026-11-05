using System;
using System.Collections.Generic;
using System.IO;
using System.Reflection;
using CheatMenu.Core;
using ExiledToolkit.Web;

namespace CheatMenu.Adapters;

/// <summary>
/// The mod's half that lives in the game's web UI: the panel's script, run in the root document the game's own pages
/// sit in. The web view can reload at any time and lose the script, so the Toolkit's page probe checks for it every
/// couple of seconds and the page says when it is missing.
/// </summary>
internal sealed class WebPage
{
    private const string Global = "window.__slcheatmenu";
    private const string Entry = "page.js";

    private readonly Assembly _assembly;
    private readonly Action<string> _log;
    private readonly ExiledToolkit.Web.WebPage _page;
    private string? _script;

    public WebPage(Assembly assembly, Action<string> log)
    {
        _assembly = assembly;
        _log = log;
        _page = new ExiledToolkit.Web.WebPage(assembly, ResourceName(Entry), Global, PageCommand.Prefix + "noscript", log) { Name = "panel" };
    }

    public void KeepInstalled(float now) => _page.KeepInstalled(now);

    /// <summary>
    /// The panel is its style and eleven files joined (<see cref="PageBundle"/>), so it is sent as one script here
    /// rather than by the Toolkit's install, which only joins files as they are.
    /// </summary>
    public void Install()
    {
        if (_page.Run(Script())) _log("panel script sent to the web UI");
    }

    /// <param name="stateJson">{ inGame, chinese, key, flags, holds, presets }</param>
    public bool Open(string stateJson) => _page.Call($"open({stateJson})");

    public void Close() => _page.Call("close()");

    public void Result(string requestId, string? error, string text = "") =>
        _page.Call($"result({JsText.Literal(requestId)},{(error == null ? "null" : JsText.Literal(error))},{JsText.Literal(text)})");

    public void Flags(string flagsJson, string holdsJson) => _page.Call($"flags({flagsJson},{holdsJson})");

    public void Readouts(IReadOnlyList<string> jsonMessages) => _page.Call($"readouts([{string.Join(",", jsonMessages)}])");

    private string Script() => _script ??= PageBundle.Join(Resource);

    private string Resource(string name)
    {
        var resource = ResourceName(name);

        using var stream = _assembly.GetManifestResourceStream(resource) ?? throw new InvalidOperationException(resource + " is not embedded");
        using var reader = new StreamReader(stream);

        return reader.ReadToEnd();
    }

    private static string ResourceName(string name) => "CheatMenu.web." + name;
}
