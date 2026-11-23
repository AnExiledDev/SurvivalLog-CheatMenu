namespace CheatMenu.Core;

/// <summary>
/// Counts save loads and unloads, so the panel can tell it is in a different save than the last time it opened. The
/// panel's page lives across saves, and what it keeps for one save (its backup, its journal) must not carry over.
/// </summary>
public sealed class SaveWatch
{
    private bool _isInGame;

    /// <summary>Goes up each time a save loads or unloads.</summary>
    public int Id { get; private set; }

    /// <summary>Call every frame with whether a save is loaded.</summary>
    public void Seen(bool isInGame)
    {
        if (isInGame == _isInGame) return;

        _isInGame = isInGame;
        Id++;
    }
}
