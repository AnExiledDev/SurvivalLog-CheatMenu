namespace CheatMenu.Core;

/// <summary>Peaceful turns the game's furniture durability lock on, and puts it back when it ends.</summary>
public static class PeacefulLock
{
    /// <summary>
    /// The lock once Peaceful ends: what it was before, unless the player turned it off meanwhile. Off stays off, since
    /// that is the player's own change.
    /// </summary>
    public static bool After(bool wasBefore, bool isOnNow) => wasBefore && isOnNow;
}
