using System;
using System.Text;

namespace CheatMenu.Core;

/// <summary>
/// The panel's script as it is sent to the web UI: its style as a string, the tables the tabs are drawn from, then the
/// code. Joined from separate files so each stays readable.
/// </summary>
public static class PageBundle
{
    public static readonly string[] Scripts = { "data.js", "catalog.js", "schema.js", "gamedata.js", "pickers.js", "tabs.js", "refs.js", "rows.js", "zh.js", "logic.js", "page.js" };

    public const string Style = "menu.css";

    /// <param name="read">Returns one embedded file's text by name.</param>
    public static string Join(Func<string, string> read)
    {
        var script = new StringBuilder("window.__slcheatmenuCss=").Append(JsText.Literal(read(Style))).Append(";\n");

        foreach (var name in Scripts) script.Append(read(name)).Append('\n');

        return script.ToString();
    }
}
