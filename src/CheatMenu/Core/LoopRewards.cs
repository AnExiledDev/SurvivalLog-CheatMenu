using System.Collections.Generic;
using System.Linq;

namespace CheatMenu.Core;

/// <summary>
/// Setting a loop reward to a level, as buying it between runs would. Buying level L costs that level's LvUpCost (the
/// game's upgrade screen reads the row of the level being bought), so a jump costs every level on the way and going
/// down gives those levels' points back.
/// </summary>
public static class LoopRewards
{
    /// <summary>What a change of level does: the Planning Points it adds (negative when it costs), or why it cannot run.</summary>
    public sealed record Change(int Points, string? Error);

    /// <param name="current">The level owned now; 0 is not owned.</param>
    /// <param name="target">The level wanted; 0 removes the reward.</param>
    /// <param name="costs">Each level the game's table has for this reward, with its LvUpCost.</param>
    /// <param name="pay">Whether the change costs or refunds Planning Points; when false it is free.</param>
    /// <param name="points">The Planning Points the survivor has.</param>
    public static Change Plan(int current, int target, IReadOnlyDictionary<int, int> costs, bool pay, int points)
    {
        if (target < 0 || (target > 0 && !costs.ContainsKey(target)))
            return new Change(0, $"no level {target}; this reward has levels {string.Join(", ", costs.Keys.OrderBy(k => k))}");

        if (target == current) return new Change(0, $"already level {current}");

        if (!pay) return new Change(0, null);

        var low = System.Math.Min(current, target);
        var high = System.Math.Max(current, target);
        var sum = costs.Where(c => c.Key > low && c.Key <= high).Sum(c => c.Value);
        var change = target > current ? -sum : sum;

        if (points + change < 0) return new Change(0, $"needs {sum} Planning Points, you have {points}");

        return new Change(change, null);
    }

    /// <summary>A reward's line in the picker: its name, then the level owned out of the most there is (Lv, as the game writes it in both languages).</summary>
    public static string Label(string name, int current, int max) => $"{name} - Lv {current}/{max}";

    /// <summary>What the panel says once a level is set.</summary>
    public static string Done(string name, int target, int points) =>
        (target == 0 ? $"{name} removed" : $"{name} now level {target}")
        + (points < 0 ? $", {-points} Planning Points spent" : points > 0 ? $", {points} Planning Points given back" : "");
}
