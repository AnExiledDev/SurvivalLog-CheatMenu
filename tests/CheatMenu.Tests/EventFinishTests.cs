using System.Collections.Generic;
using System.Linq;
using CheatMenu.Core;
using Xunit;

namespace CheatMenu.Tests;

public class EventFinishTests
{
    /// <summary>
    /// The game's running events. A held event cannot move on by auto-play; letting it go starts its timer from zero.
    /// </summary>
    private sealed class Events : EventFinish.IEvents
    {
        public HashSet<long> Live { get; } = new();
        public HashSet<long> Held { get; } = new();

        public Events(params long[] live) => Live.UnionWith(live);

        public IEnumerable<long> Running() => Live;

        public void HoldBack(long id)
        {
            Assert.Contains(id, Live);
            Held.Add(id);
        }

        public void LetGo(long id) => Held.Remove(id);
    }

    private const long Quest = 11, Visitor = 22, Raid = 33;

    [Fact]
    public void Only_the_picked_event_plays_on_while_every_other_running_event_waits()
    {
        var events = new Events(Quest, Visitor, Raid);
        var finish = new EventFinish();

        finish.Pick(events, Quest, "Assemble Solar Panels", 0);
        var ended = finish.Tick(events, 0, holdOthers: true);

        Assert.Empty(ended);
        Assert.True(finish.IsBusy);
        Assert.Equal(new[] { Visitor, Raid }, events.Held.OrderBy(id => id));
    }

    [Fact]
    public void When_the_picked_event_ends_it_is_reported_finished_and_the_others_move_again()
    {
        var events = new Events(Quest, Visitor);
        var finish = new EventFinish();

        finish.Pick(events, Quest, "Assemble Solar Panels", 0);
        finish.Tick(events, 0, holdOthers: true);
        events.Live.Remove(Quest);
        var ended = finish.Tick(events, 3, holdOthers: true);

        Assert.Equal(new[] { new EventFinish.Ended(Quest, "Assemble Solar Panels", true) }, ended);
        Assert.False(finish.IsBusy);
        Assert.False(finish.IsActive);
        Assert.Empty(events.Held);
    }

    [Fact]
    public void An_event_still_running_at_the_give_up_time_is_reported_unfinished_and_nothing_stays_held()
    {
        var events = new Events(Quest, Visitor);
        var finish = new EventFinish();

        finish.Pick(events, Quest, "Store the Electricity", 10);
        Assert.Empty(finish.Tick(events, 10 + EventFinish.GiveUpSeconds - 0.5f, holdOthers: true));
        Assert.Contains(Visitor, events.Held);

        var ended = finish.Tick(events, 10 + EventFinish.GiveUpSeconds, holdOthers: true);

        Assert.Equal(new[] { new EventFinish.Ended(Quest, "Store the Electricity", false) }, ended);
        Assert.False(finish.IsActive);
        Assert.Empty(events.Held);
    }

    [Fact]
    public void An_event_that_starts_while_another_is_being_finished_waits_too()
    {
        var events = new Events(Quest);
        var finish = new EventFinish();

        finish.Pick(events, Quest, "Assemble Solar Panels", 0);
        finish.Tick(events, 0, holdOthers: true);
        events.Live.Add(Raid);
        finish.Tick(events, 0.5f, holdOthers: true);

        Assert.Equal(new[] { Raid }, events.Held);
    }

    [Fact]
    public void When_every_event_is_meant_to_play_on_by_itself_none_is_held_and_held_ones_are_let_go()
    {
        var events = new Events(Quest, Visitor);
        var finish = new EventFinish();

        finish.Pick(events, Quest, "Assemble Solar Panels", 0);
        finish.Tick(events, 0, holdOthers: true);
        Assert.Contains(Visitor, events.Held);

        finish.Tick(events, 0.5f, holdOthers: false);

        Assert.Empty(events.Held);
        Assert.True(finish.IsBusy);
    }

    [Fact]
    public void Picking_an_event_that_was_being_held_lets_it_play_on_with_the_first_one()
    {
        var events = new Events(Quest, Visitor, Raid);
        var finish = new EventFinish();

        finish.Pick(events, Quest, "Assemble Solar Panels", 0);
        finish.Tick(events, 0, holdOthers: true);
        finish.Pick(events, Visitor, "A visitor", 1);
        finish.Tick(events, 1, holdOthers: true);

        Assert.Equal(new[] { Raid }, events.Held);

        events.Live.Remove(Quest);
        var ended = finish.Tick(events, 2, holdOthers: true);

        Assert.Equal(new[] { new EventFinish.Ended(Quest, "Assemble Solar Panels", true) }, ended);
        Assert.True(finish.IsBusy);
        Assert.Equal(new[] { Raid }, events.Held);
    }

    [Fact]
    public void Dropping_the_finish_lets_every_held_event_go()
    {
        var events = new Events(Quest, Visitor, Raid);
        var finish = new EventFinish();

        finish.Pick(events, Quest, "Assemble Solar Panels", 0);
        finish.Tick(events, 0, holdOthers: true);
        finish.Drop(events);

        Assert.Empty(events.Held);
        Assert.False(finish.IsActive);
    }

    [Fact]
    public void The_player_is_told_why_an_event_did_not_finish_in_their_language()
    {
        var done = new EventFinish.Ended(Quest, "Assemble Solar Panels", true);
        var stuck = new EventFinish.Ended(Quest, "Assemble Solar Panels", false);

        Assert.Equal("Assemble Solar Panels finished.", EventFinish.Say(done, false, false));
        Assert.Equal("Assemble Solar Panels is still running after 30 seconds: it waits for days to pass.", EventFinish.Say(stuck, true, false));
        Assert.Equal("Assemble Solar Panels is still running after 30 seconds.", EventFinish.Say(stuck, false, false));
        Assert.Equal("Assemble Solar Panels 已完成。", EventFinish.Say(done, false, true));
        Assert.Equal("Assemble Solar Panels 30 秒后仍在进行：它要等几天过去才会结束。", EventFinish.Say(stuck, true, true));
    }
}
