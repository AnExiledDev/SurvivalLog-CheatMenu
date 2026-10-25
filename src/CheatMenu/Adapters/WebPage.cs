using System;
using System.Collections.Generic;
using System.IO;
using CheatMenu.Core;
using GameCore.HotUpdate.ReduxUI;

namespace CheatMenu.Adapters;

/// <summary>
/// The mod's half that lives in the game's web UI: the panel's script, run in the root document the game's own pages
/// sit in. The web view can reload at any time and lose the script, so it is checked for every couple of seconds and
/// put back when the page says it is missing.
/// </summary>
internal sealed class WebPage
{
    private const float CheckSeconds = 2f;
    private const string NoScriptReply = "window.vuplex&&window.vuplex.postMessage('" + PageCommand.Prefix + "noscript')";

    private readonly Action<string> _log;
    private string? _script;
    private float _nextCheckAt;
    private bool _hasReportedRunFailure;

    public WebPage(Action<string> log)
    {
        _log = log;
    }

    public void KeepInstalled(float now)
    {
        if (now < _nextCheckAt) return;

        _nextCheckAt = now + CheckSeconds;
        Run("window.__slcheatmenu||" + NoScriptReply);
    }

    public void Install()
    {
        if (Run(Script())) _log("panel script sent to the web UI");
    }

    /// <param name="stateJson">{ inGame, chinese, key, flags, presets }</param>
    public bool Open(string stateJson) => Call($"open({stateJson})");

    public void Close() => Call("close()");

    public void Result(string requestId, string? error) => Call($"result({JsText.Literal(requestId)},{(error == null ? "null" : JsText.Literal(error))})");

    public void Flags(string flagsJson) => Call($"flags({flagsJson})");

    public void Readouts(List<string> jsonMessages) => Call($"readouts([{string.Join(",", jsonMessages)}])");

    private bool Call(string expression) => Run($"window.__slcheatmenu?window.__slcheatmenu.{expression}:{NoScriptReply}");

    private bool Run(string javaScript)
    {
        var webView = GameSingleton.Existing<ReduxUISystem>()?.GetWebUILayer()?.canvasWebViewPrefab?.WebView;

        if (webView == null) return false;

        try
        {
            webView.ExecuteJavaScript(javaScript, null);

            return true;
        }
        catch (Exception ex)
        {
            if (!_hasReportedRunFailure) _log("could not run script in the web UI (reported once): " + ex.Message);

            _hasReportedRunFailure = true;

            return false;
        }
    }

    private string Script() => _script ??= PageBundle.Join(Resource);

    private static string Resource(string name)
    {
        var resource = "CheatMenu.web." + name;

        using var stream = typeof(WebPage).Assembly.GetManifestResourceStream(resource) ?? throw new InvalidOperationException(resource + " is not embedded");
        using var reader = new StreamReader(stream);

        return reader.ReadToEnd();
    }
}
