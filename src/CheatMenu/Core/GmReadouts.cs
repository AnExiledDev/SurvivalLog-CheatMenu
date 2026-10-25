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
        37, // ActionTypeList
        41, // UIStack
        43, // NearbyFurnitureList
        57, // EnvironmentSnapshot
    };

    public static bool IsUnused(int msgHead) => Unused.Contains(msgHead);
}
