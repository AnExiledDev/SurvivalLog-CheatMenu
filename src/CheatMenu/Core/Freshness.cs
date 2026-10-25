using System;

namespace CheatMenu.Core;

/// <summary>
/// The game's food clock in plain numbers. An item's spoil clock is StartTime and TimeLeft in whole game hours plus
/// TimeLeftFrac, and its freshness is how much of OriginalTimeLeft is left once the hours since StartTime are taken
/// off at TimeScale. These are the sums the cheats need, kept here so they can be tested without the game.
/// </summary>
public static class Freshness
{
    /// <summary>The clock that makes an item as fresh as new at <paramref name="nowHours"/> (game hours, with a fraction).</summary>
    public static (int Start, int TimeLeft, float Frac)? AsNew(int originalTimeLeft, float timeScale, double nowHours)
    {
        if (originalTimeLeft <= 0 || timeScale <= 0 || nowHours < 0) return null;

        var start = (int)Math.Floor(nowHours);
        var total = originalTimeLeft / (double)timeScale + (nowHours - start);
        var whole = (int)Math.Floor(total);

        return (start, whole, (float)(total - whole));
    }

    /// <summary>Hours left before an item with this clock is fully used up, at <paramref name="nowHours"/>.</summary>
    public static double HoursLeft(int start, int timeLeft, float frac, double nowHours) => timeLeft + frac - (nowHours - start);

    /// <summary>
    /// Hours to move the clock on to reach <paramref name="targetHour"/> o'clock from <paramref name="hour24"/>. Already
    /// at that hour means the same hour tomorrow, so a press always moves time.
    /// </summary>
    public static int HoursUntil(int hour24, int targetHour)
    {
        if (hour24 is < 0 or > 23 || targetHour is < 0 or > 23) return 0;

        var hours = (targetHour - hour24 + 24) % 24;

        return hours == 0 ? 24 : hours;
    }
}
