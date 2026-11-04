using System.Collections.Generic;
using System.Linq;

namespace CheatMenu.Core;

/// <summary>
/// Plays picked events through to their end with the game's own GM auto-play, and only those. The game's auto-play
/// switch covers every event at once, so while a picked event is still going every other running event has its
/// auto-play timer held back, and gets it back once nothing is left to finish. A picked event still running after
/// <see cref="GiveUpSeconds"/> is given up on: an event that waits for days to pass never ends by auto-play.
/// </summary>
public sealed class EventFinish
{
    /// <summary>The running events, as the game keeps them.</summary>
    public interface IEvents
    {
        /// <summary>The instance id of every running event.</summary>
        IEnumerable<long> Running();

        /// <summary>Keeps the event from moving on by auto-play.</summary>
        void HoldBack(long id);

        /// <summary>Starts the event's auto-play timer again from zero.</summary>
        void LetGo(long id);
    }

    /// <param name="IsFinished">False when it was still running at the give-up time.</param>
    public readonly record struct Ended(long Id, string Name, bool IsFinished);

    public const float GiveUpSeconds = 30f;

    private readonly Dictionary<long, (string Name, float GiveUpAt)> _picked = new();
    private readonly HashSet<long> _held = new();

    /// <summary>True while a picked event is still being played through, so the game's auto-play has to be on.</summary>
    public bool IsBusy => _picked.Count > 0;

    /// <summary>True while there is still something to do: an event to finish or a held one to let go.</summary>
    public bool IsActive => _picked.Count > 0 || _held.Count > 0;

    /// <summary>Starts playing a running event through. Its timer starts from zero, even if it was held back.</summary>
    public void Pick(IEvents events, long id, string name, float now)
    {
        _picked[id] = (name, now + GiveUpSeconds);
        _held.Remove(id);
        events.LetGo(id);
    }

    /// <summary>Reports the picked events that ended or were given up on, then holds back or lets go of the rest.</summary>
    /// <param name="holdOthers">False when every event is meant to play on by itself anyway, so none is held.</param>
    public List<Ended> Tick(IEvents events, float now, bool holdOthers)
    {
        var running = new HashSet<long>(events.Running());
        var ended = new List<Ended>();

        foreach (var (id, pick) in _picked.ToList())
        {
            var isFinished = !running.Contains(id);

            if (!isFinished && now < pick.GiveUpAt) continue;

            _picked.Remove(id);
            ended.Add(new Ended(id, pick.Name, isFinished));
        }

        _held.RemoveWhere(id => !running.Contains(id));

        if (_picked.Count > 0 && holdOthers)
        {
            foreach (var id in running)
            {
                if (_picked.ContainsKey(id)) continue;

                events.HoldBack(id);
                _held.Add(id);
            }
        }
        else
        {
            foreach (var id in _held) events.LetGo(id);

            _held.Clear();
        }

        return ended;
    }

    /// <summary>Stops everything at once and lets every held event go.</summary>
    public void Drop(IEvents events)
    {
        foreach (var id in _held) events.LetGo(id);

        Forget();
    }

    /// <summary>Stops everything without touching the game, for when the save it was working in is gone.</summary>
    public void Forget()
    {
        _picked.Clear();
        _held.Clear();
    }

    /// <summary>What the player is told when a picked event ends or is given up on.</summary>
    /// <param name="waitsOnDays">The event is waiting for days to pass, which auto-play cannot skip.</param>
    public static string Say(Ended ended, bool waitsOnDays, bool isChinese)
    {
        if (ended.IsFinished) return isChinese ? ended.Name + " 已完成。" : ended.Name + " finished.";

        var seconds = ((int)GiveUpSeconds).ToString();

        if (waitsOnDays)
            return isChinese
                ? $"{ended.Name} {seconds} 秒后仍在进行：它要等几天过去才会结束。"
                : $"{ended.Name} is still running after {seconds} seconds: it waits for days to pass.";

        return isChinese ? $"{ended.Name} {seconds} 秒后仍在进行。" : $"{ended.Name} is still running after {seconds} seconds.";
    }
}
