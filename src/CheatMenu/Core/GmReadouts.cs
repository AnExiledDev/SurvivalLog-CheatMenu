using System.Collections.Generic;

namespace CheatMenu.Core;

/// <summary>
/// The readouts the game's GM handler repeats every second while the menu is open that nothing in the panel reads.
/// Each one would be turned into JSON and handed to the web view on the game's main thread, so they are dropped
/// before that.
/// </summary>
public static class GmReadouts
{
    private static readonly HashSet<int> Unused = new()
    {
        1, // AllCharactersKeyArray
        3, // CharacterBaseConfig
        4, // SkillListInfo
        7, // ReportBuffInfo
        10, // ReportAuraInfo
        13, // ReportPassiveSkillInfo
        16, // Permissions
        41, // UIStack
        43, // NearbyFurnitureList
        57, // EnvironmentSnapshot
    };

    public static bool IsUnused(int msgHead) => Unused.Contains(msgHead);
}

/// <summary>
/// The readouts the handler repeats every second that the panel does read: the stat bars, the Sense test and the
/// Character behaviour row. One the same as the last of its kind changes nothing on the page, so only a changed one is
/// handed over.
/// </summary>
public sealed class RepeatedReadouts
{
    private static readonly HashSet<int> Repeating = new()
    {
        5, // ReportAttrInfo
        78, // TestSense
        80, // ReportAIStatus
    };

    private readonly Dictionary<int, string> _last = new();

    /// <summary>False for a repeating readout the same as the last one of its kind; anything else is new.</summary>
    public bool IsNew(int msgHead, string json)
    {
        if (!Repeating.Contains(msgHead)) return true;
        if (_last.TryGetValue(msgHead, out var was) && was == json) return false;

        _last[msgHead] = json;

        return true;
    }

    /// <summary>Forgets what was handed over, so the next one of each kind goes through (the panel has just opened).</summary>
    public void Clear() => _last.Clear();
}
