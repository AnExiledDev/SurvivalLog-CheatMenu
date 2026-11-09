using System;
using System.Linq;

namespace CheatMenu.Core;

/// <summary>The game's GM switches: static flags on its GM class that the rest of the game reads.</summary>
public static class GmFlagNames
{
    public static readonly string[] All =
    {
        "SkipTimeline", "SkipOpeningTimeline", "SkipDailySettlement", "LockCharacterAttr", "LockFurnitureDurability",
        "LockExploreExposure", "RightClickCopyFurnitureId", "RaiseExploreCamera", "PhotoModeUnlocked", "ExploreFreeCamera",
        "PauseRenderFreezeOff", "ShowZombieDebugText", "ShowEnvDebug", "ShowAudioSourceViz", "ShowShadowDebug",
        "ReviveOnDoorBreak", "SpeedHotkeyEnabled", "ForceDanceRecommend", "EventVerifyLog",
    };

    public static bool IsKnown(string name) => All.Contains(name, StringComparer.Ordinal);
}
