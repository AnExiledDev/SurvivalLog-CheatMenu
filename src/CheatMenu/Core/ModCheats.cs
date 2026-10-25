using System;
using System.Linq;

namespace CheatMenu.Core;

/// <summary>
/// The cheats this mod adds on top of the game's own GM tools. An action runs once; a hold is kept true by the mod
/// every half second while it is on. The panel may only name these, so a stray message cannot call anything else.
/// </summary>
public static class ModCheats
{
    /// <summary>One-shot actions. Each may take a small JSON object of arguments.</summary>
    public static readonly string[] Actions =
    {
        "mature", "tend", "anomaly", "freebuild", "ally", "allyone", "exposure", "event-choice", "event-end", "event-reset",
        "loan-clear", "debuffs", "buff-remove", "snapshot", "list", "fresh", "recipes", "skipto", "repairall", "containers",
        "unsearch", "traps", "basket", "toast", "health",
    };

    /// <summary>Things the mod keeps true while they are on.</summary>
    public static readonly string[] Holds = { "god", "power", "peaceful", "clock", "nofuel", "instant", "eventstep", "nospoil", "hover" };

    /// <summary>What a live picker can list.</summary>
    public static readonly string[] Lists = { "pots", "furniture", "events", "buffs" };

    public static bool IsAction(string name) => Actions.Contains(name, StringComparer.Ordinal);

    public static bool IsHold(string name) => Holds.Contains(name, StringComparer.Ordinal);

    public static bool IsList(string name) => Lists.Contains(name, StringComparer.Ordinal);
}
