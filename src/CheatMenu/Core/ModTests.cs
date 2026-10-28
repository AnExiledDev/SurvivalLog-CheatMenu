using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace CheatMenu.Core;

/// <summary>
/// Test cheats other mods add to the Mod tests tab. A mod adds them with no reference to this one: a static class named
/// DevCheats, where each public static method that takes nothing and returns a string is one button. The button's name
/// is the method's DisplayName and its help the method's Description, each written as "English\nChinese". What the
/// method returns is shown in the menu's log; what it throws is shown as the error.
/// </summary>
public static class ModTests
{
    public const string TypeName = "DevCheats";

    public sealed record Cheat(string Id, string Label, string LabelZh, string Help, string HelpZh);

    public sealed record Mod(string Guid, string Name, IReadOnlyList<Cheat> Cheats);

    /// <summary>"English\nChinese" as its two halves; with no Chinese half, the English is used for both.</summary>
    public static (string En, string Zh) Split(string? text, string fallback)
    {
        var parts = (text ?? "").Split('\n', 2);
        var en = parts[0].Trim();

        if (en.Length == 0) en = fallback;

        var zh = parts.Length > 1 ? parts[1].Trim() : "";

        return (en, zh.Length > 0 ? zh : en);
    }

    /// <summary>A method name as words, for a cheat with no DisplayName: RestockHereNow becomes "Restock here now".</summary>
    public static string Words(string name)
    {
        var words = new StringBuilder();

        foreach (var character in name)
        {
            if (char.IsUpper(character) && words.Length > 0) words.Append(' ').Append(char.ToLowerInvariant(character));
            else words.Append(character);
        }

        return words.ToString();
    }

    /// <summary>The mods with test cheats, as the page reads them: [{mod, name, cheats: [{id, l, zh, d, dzh}]}], by name.</summary>
    public static string Json(IEnumerable<Mod> mods)
    {
        var json = new StringBuilder("[");
        var firstMod = true;

        foreach (var mod in mods.Where(m => m.Cheats.Count > 0).OrderBy(m => m.Name, StringComparer.OrdinalIgnoreCase))
        {
            if (!firstMod) json.Append(',');

            firstMod = false;
            json.Append("{\"mod\":").Append(JsText.Literal(mod.Guid)).Append(",\"name\":").Append(JsText.Literal(mod.Name)).Append(",\"cheats\":[");
            json.Append(string.Join(",", mod.Cheats.Select(c =>
                $"{{\"id\":{JsText.Literal(c.Id)},\"l\":{JsText.Literal(c.Label)},\"zh\":{JsText.Literal(c.LabelZh)},\"d\":{JsText.Literal(c.Help)},\"dzh\":{JsText.Literal(c.HelpZh)}}}")));
            json.Append("]}");
        }

        return json.Append(']').ToString();
    }
}
