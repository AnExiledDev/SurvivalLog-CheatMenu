namespace CheatMenu.Core;

/// <summary>How the game's loop reward screen is opened, and what its main button says for each way.</summary>
public static class RewardScreenModes
{
    /// <summary>The open mode the menu uses mid-run. The game's own are 0 to 2, and each has its own branches; 3 matches none.</summary>
    public const int MidRun = 3;

    /// <summary>
    /// The text for the screen's "start the next loop" button, or null to keep the game's own. Opened by the menu
    /// mid-run, that button only closes the screen, so it says so. Opened by the game, it really starts the next loop.
    /// </summary>
    public static string? CloseLabel(int openMode, bool isChinese) => openMode == MidRun ? (isChinese ? "关闭" : "Close") : null;
}
