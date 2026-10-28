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

        if (target == 0 && current == 0) return new Change(0, "not owned");

        if (target == current) return new Change(0, null);

        if (!pay) return new Change(0, null);

        var low = System.Math.Min(current, target);
        var high = System.Math.Max(current, target);
        var sum = costs.Where(c => c.Key > low && c.Key <= high).Sum(c => c.Value);
        var change = target > current ? -sum : sum;

        if (points + change < 0) return new Change(0, $"needs {sum} Planning Points, you have {points}");

        return new Change(change, null);
    }

    /// <summary>The survivor's loop rewards, as the game keeps them: a level per reward and the buff each level gives.</summary>
    public interface ISurvivor
    {
        /// <summary>The game's move between levels: takes off the old level's buff and sets the new level. Mid-run it adds no buff.</summary>
        void RevertToLevel(int talent, int level);

        /// <summary>Puts the level's buff on the survivor if it is not there, and marks it given so the next run start does not add it again.</summary>
        void AddLevelBuff(int talent, int level);

        /// <summary>Forgets that the reward's buff was given, so it is not brought back on load.</summary>
        void ForgetGiven(int talent);
    }

    /// <summary>
    /// Sets a reward's level and its buff. Most loop rewards only get their buff at the start of a run, so the game's
    /// level change alone leaves a reward bought mid-run with no buff, and it does nothing until the next run. Setting
    /// the level a reward already has leaves the level alone and only puts on its buff if it is missing, which mends a
    /// reward whose level was set without its buff.
    /// </summary>
    public static void SetLevel(ISurvivor survivor, int talent, int current, int level)
    {
        if (level == current)
        {
            if (level > 0) survivor.AddLevelBuff(talent, level);

            return;
        }

        survivor.RevertToLevel(talent, level);

        if (level > 0) survivor.AddLevelBuff(talent, level);
        else survivor.ForgetGiven(talent);
    }

    /// <summary>A reward as it stood when the reward screen opened: the level owned and whether that level's buff was on the survivor.</summary>
    public readonly record struct Owned(int Level, bool HadBuff);

    /// <summary>
    /// The rewards to give their level's buff once the game's reward screen closes mid-run, with the level, by talent id.
    /// Buying or resetting there takes the old level's buff off and, mid-run, adds no new one. A reward owned now gets
    /// its buff when its level changed or it had its buff when the screen opened. One left alone whose buff was not on
    /// yet (a reward that starts later in the run) stays as it was. A reward missing from atOpen was not owned then.
    /// </summary>
    public static IReadOnlyList<(int Talent, int Level)> Rebuff(IReadOnlyDictionary<int, Owned> atOpen, IReadOnlyDictionary<int, int> now)
    {
        var give = new List<(int Talent, int Level)>();

        foreach (var pair in now.OrderBy(p => p.Key))
        {
            if (pair.Value <= 0) continue;

            var before = atOpen.TryGetValue(pair.Key, out var owned) ? owned : default;

            if (pair.Value != before.Level || before.HadBuff) give.Add((pair.Key, pair.Value));
        }

        return give;
    }

    /// <summary>A reward's line in the picker: its name, then the level owned out of the most there is (Lv, as the game writes it in both languages).</summary>
    public static string Label(string name, int current, int max) => $"{name} - Lv {current}/{max}";

    /// <summary>What the panel says once a level is set.</summary>
    public static string Done(string name, int current, int target, int points) =>
        target == current ? $"{name} stays level {target}, its effect is on now"
        : (target == 0 ? $"{name} removed" : $"{name} now level {target}")
        + (points < 0 ? $", {-points} Planning Points spent" : points > 0 ? $", {points} Planning Points given back" : "");
}
