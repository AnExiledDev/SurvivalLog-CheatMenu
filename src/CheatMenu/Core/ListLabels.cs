using System;

namespace CheatMenu.Core;

/// <summary>
/// The words in the menu's live lists (the survivor's buffs, the pots, furniture, events, robots and people, and the
/// game's item, event, text and condition set tables), in the game's language, as the names they carry are. The page
/// puts each entry's id in brackets after its label.
/// </summary>
public static class ListLabels
{
    /// <summary>The game's plant states (PlantState), by value.</summary>
    public enum Plant
    {
        Idle = 0,
        Growing = 1,
        Mature = 2,
        Withered = 3,
        Poor = 4,
    }

    /// <param name="name">The buff's name in the game's language, or null when its table row has none.</param>
    /// <param name="isHidden">The game keeps the buff off the survivor's buff list.</param>
    public static string Buff(string? name, bool isGood, bool isHidden, bool isChinese)
    {
        var label = (name ?? Say(isChinese, "Unnamed buff", "未命名状态")) + " - " + (isGood ? Say(isChinese, "good", "增益") : Say(isChinese, "bad", "减益"));

        return isHidden ? label + Say(isChinese, ", hidden", "，隐藏") : label;
    }

    /// <param name="plant">The plant's name, or null when the pot has none planted or its table row has no name.</param>
    /// <param name="plantId">The pot's plant config id; 0 is an empty pot.</param>
    public static string Pot(string? plant, int plantId, Plant state, bool isChinese)
    {
        if (plantId == 0) return Say(isChinese, "Empty pot", "空种植盆");

        return (plant ?? Say(isChinese, "Plant ", "植物 ") + plantId) + " - " + State(state, isChinese);
    }

    /// <param name="configId">The furniture's kind, shown when its table row has no name.</param>
    public static string Furniture(string? name, int configId, bool isChinese) => name ?? Say(isChinese, "Furniture kind ", "家具种类 ") + configId;

    /// <param name="isWaiting">The event is waiting for the player to choose an answer.</param>
    public static string Event(string? name, int eventId, bool isWaiting, bool isChinese)
    {
        var label = name ?? Say(isChinese, "Event ", "事件 ") + eventId;

        return isWaiting ? label + Say(isChinese, " - waiting on a choice", " - 等待选择") : label;
    }

    /// <summary>A table row's name, or what it is and its id when the row has no name.</summary>
    public static string Named(string? name, string what, string whatChinese, long id, bool isChinese) => name ?? Say(isChinese, what, whatChinese) + " " + id;

    /// <summary>A game text on one line: its markup and line breaks gone, cut to at most <paramref name="max"/> characters.</summary>
    public static string Snippet(string? text, int max)
    {
        if (string.IsNullOrWhiteSpace(text)) return "";

        var plain = Markup.Replace(text, "").Replace("\\n", " ");

        plain = string.Join(" ", plain.Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries));

        return plain.Length <= max ? plain : plain.Substring(0, max - 3).TrimEnd(' ', ',', '.', ';', ':') + "...";
    }

    /// <param name="sender">Who sends the text, or null when its contact has no name.</param>
    public static string Text(string? sender, string? content, int smsId, bool isChinese)
    {
        var body = Snippet(content, 64);

        if (body.Length == 0) body = Say(isChinese, "Text", "短信") + " " + smsId;

        return sender == null ? body : sender + ": " + body;
    }

    /// <param name="kind">The game's RobotKind: 1 tidying, 2 planting, 3 repair.</param>
    public static string Robot(string? name, int kind, bool isChinese)
    {
        var job = kind switch
        {
            1 => Say(isChinese, "tidying", "整理"),
            2 => Say(isChinese, "planting", "种植"),
            3 => Say(isChinese, "repair", "维修"),
            _ => null,
        };
        var label = name ?? Say(isChinese, "Robot", "机器人");

        return job == null ? label : label + " - " + job;
    }

    private static readonly System.Text.RegularExpressions.Regex Markup = new(@"<[^>]*>|\{[^}]*\}");

    private static string State(Plant state, bool isChinese) => state switch
    {
        Plant.Growing => Say(isChinese, "growing", "生长中"),
        Plant.Mature => Say(isChinese, "ripe", "成熟"),
        Plant.Withered => Say(isChinese, "withered", "枯萎"),
        Plant.Poor => Say(isChinese, "poor", "劣质"),
        _ => Say(isChinese, "not growing", "未生长"),
    };

    private static string Say(bool isChinese, string english, string chinese) => isChinese ? chinese : english;
}
