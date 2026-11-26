using CheatMenu.Core;
using Xunit;

namespace CheatMenu.Tests;

public class PeacefulLockTests
{
    [Fact]
    public void Ending_Peaceful_puts_the_lock_back_off_when_it_was_off()
    {
        Assert.False(PeacefulLock.After(wasBefore: false, isOnNow: true));
    }

    [Fact]
    public void Ending_Peaceful_keeps_the_lock_on_when_it_was_on()
    {
        Assert.True(PeacefulLock.After(wasBefore: true, isOnNow: true));
    }

    [Fact]
    public void A_lock_the_player_turned_off_during_Peaceful_stays_off()
    {
        Assert.False(PeacefulLock.After(wasBefore: true, isOnNow: false));
    }
}
