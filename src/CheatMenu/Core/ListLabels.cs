namespace CheatMenu.Core;

/// <summary>
/// The words in the menu's live lists (the survivor's buffs, the pots, furniture and events), in the game's language, as
/// the names they carry are. The page puts each entry's id in brackets after its label.
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
