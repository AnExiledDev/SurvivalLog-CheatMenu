using System;
using System.Collections.Generic;
using System.Text;

namespace CheatMenu.Core;

/// <summary>
/// The mod health page: each loaded plugin with its version, and the errors BepInEx logged for it this session.
/// BepInEx writes a line as "[Error  :Source Name] text", where the source is the plugin's name.
/// </summary>
public static class ModHealth
{
    /// <summary>Our own mods' plugin ids all start with this.</summary>
    public const string OurPrefix = "com.dev.survivallog.";

    public sealed record Plugin(string Guid, string Name, string Version, bool IsLoaded);

    public sealed record Errors(int Count, string Last);

    /// <summary>Error and fatal lines by source name, with the last one seen. Other lines are skipped.</summary>
    public static Dictionary<string, Errors> ReadErrors(IEnumerable<string> lines)
    {
        var found = new Dictionary<string, Errors>(StringComparer.Ordinal);

        foreach (var line in lines)
        {
            if (line == null || line.Length < 3 || line[0] != '[') continue;

            var colon = line.IndexOf(':');
            var close = line.IndexOf(']');

            if (colon < 0 || close < colon) continue;

            var level = line.Substring(1, colon - 1).Trim();

            if (level != "Error" && level != "Fatal") continue;

            var source = line.Substring(colon + 1, close - colon - 1).Trim();
            var text = line.Substring(close + 1).Trim();

            found[source] = new Errors(found.TryGetValue(source, out var had) ? had.Count + 1 : 1, text);
        }

        return found;
    }

    /// <summary>The page text: our mods first, then the rest, each with its version and its error count.</summary>
    public static string Report(IEnumerable<Plugin> plugins, IReadOnlyDictionary<string, Errors> errors)
    {
        var ours = new List<Plugin>();
        var others = new List<Plugin>();

        foreach (var plugin in plugins) (plugin.Guid.StartsWith(OurPrefix, StringComparison.Ordinal) ? ours : others).Add(plugin);

        ours.Sort((a, b) => string.CompareOrdinal(a.Name, b.Name));
        others.Sort((a, b) => string.CompareOrdinal(a.Name, b.Name));

        var text = new StringBuilder();
        var bad = 0;

        void Line(Plugin plugin)
        {
            text.Append(plugin.Name).Append(' ').Append(plugin.Version);

            if (!plugin.IsLoaded)
            {
                text.Append(": did not load");
                bad++;
            }

            if (errors.TryGetValue(plugin.Name, out var e))
            {
                text.Append(": ").Append(e.Count).Append(e.Count == 1 ? " error: " : " errors, last: ").Append(e.Last.Length > 160 ? e.Last.Substring(0, 160) + "..." : e.Last);
                if (plugin.IsLoaded) bad++;
            }
            else if (plugin.IsLoaded)
            {
                text.Append(": ok");
            }

            text.Append('\n');
        }

        text.Append("Our mods (").Append(ours.Count).Append(")\n");
        foreach (var plugin in ours) Line(plugin);

        if (others.Count > 0)
        {
            text.Append("Other plugins (").Append(others.Count).Append(")\n");
            foreach (var plugin in others) Line(plugin);
        }

        text.Insert(0, bad == 0 ? "All plugins loaded with no errors logged.\n" : $"{bad} plugins need a look.\n");

        return text.ToString().TrimEnd();
    }
}
