using System.Collections.Generic;
using CheatMenu.Core;
using Xunit;

namespace CheatMenu.Tests;

public class FreshnessTests
{
    [Fact]
    public void Fresh_as_new_gives_the_full_life_counted_from_now()
    {
        // Orig 48 at scale 2 is 24 real hours of life. At 100.25 the clock starts at 100 with 24.25 left, so 24 hours
        // from now it is exactly used up.
        var clock = Freshness.AsNew(48, 2f, 100.25)!.Value;

        Assert.Equal(100, clock.Start);
        Assert.Equal(24, clock.TimeLeft);
        Assert.Equal(0.25f, clock.Frac, 3);
        Assert.Equal(24.0, Freshness.HoursLeft(clock.Start, clock.TimeLeft, clock.Frac, 100.25), 3);
        Assert.Equal(0.0, Freshness.HoursLeft(clock.Start, clock.TimeLeft, clock.Frac, 124.25), 3);
    }

    [Fact]
    public void An_item_with_no_food_clock_is_left_alone()
    {
        Assert.Null(Freshness.AsNew(0, 1f, 10));
        Assert.Null(Freshness.AsNew(24, 0f, 10));
        Assert.Null(Freshness.AsNew(24, 1f, -1));
    }

    [Theory]
    [InlineData(5, 7, 2)]
    [InlineData(23, 7, 8)]
    [InlineData(12, 7, 19)]
    [InlineData(7, 7, 24)]
    [InlineData(21, 22, 1)]
    public void Skip_to_a_time_always_moves_forward_to_the_next_one(int now, int target, int hours)
    {
        Assert.Equal(hours, Freshness.HoursUntil(now, target));
    }

    [Fact]
    public void Skip_to_a_time_out_of_range_does_not_move_the_clock()
    {
        Assert.Equal(0, Freshness.HoursUntil(24, 7));
        Assert.Equal(0, Freshness.HoursUntil(5, -1));
    }
}

public class ModHealthTests
{
    private const string Ours = ModHealth.OurPrefix;

    [Fact]
    public void Only_error_and_fatal_lines_count_and_the_last_one_is_kept()
    {
        var errors = ModHealth.ReadErrors(new[]
        {
            "[Info   :Farm Hub] loaded",
            "[Error  :Farm Hub] first problem",
            "[Warning:Farm Hub] just a warning",
            "[Error  :Farm Hub] second problem",
            "[Fatal  :Trap Hub] it broke",
            "not a log line",
            "[Message:   BepInEx] Chainloader ready",
        });

        Assert.Equal(2, errors.Count);
        Assert.Equal(new ModHealth.Errors(2, "second problem"), errors["Farm Hub"]);
        Assert.Equal(new ModHealth.Errors(1, "it broke"), errors["Trap Hub"]);
    }

    [Fact]
    public void A_clean_session_says_so_and_lists_our_mods_before_the_rest()
    {
        var text = ModHealth.Report(new[]
        {
            new ModHealth.Plugin("other.unity.explorer", "Unity Explorer", "4.12.0", true),
            new ModHealth.Plugin(Ours + "trapHub", "Trap Hub", "0.3.0", true),
            new ModHealth.Plugin(Ours + "farmHub", "Farm Hub", "0.5.1", true),
        }, new Dictionary<string, ModHealth.Errors>());

        Assert.Equal("All plugins loaded with no errors logged.\nOur mods (2)\nFarm Hub 0.5.1: ok\nTrap Hub 0.3.0: ok\nOther plugins (1)\nUnity Explorer 4.12.0: ok", text);
    }

    [Fact]
    public void A_mod_that_did_not_load_or_logged_errors_is_counted_once_each()
    {
        var text = ModHealth.Report(new[]
        {
            new ModHealth.Plugin(Ours + "a", "Alpha", "1.0", false),
            new ModHealth.Plugin(Ours + "b", "Beta", "1.0", true),
            new ModHealth.Plugin(Ours + "c", "Gamma", "1.0", true),
        }, new Dictionary<string, ModHealth.Errors>
        {
            ["Alpha"] = new(1, "missing dependency"),
            ["Beta"] = new(3, "null reference"),
        });

        Assert.Equal("2 plugins need a look.\nOur mods (3)\nAlpha 1.0: did not load: 1 error: missing dependency\nBeta 1.0: 3 errors, last: null reference\nGamma 1.0: ok", text);
    }

    [Fact]
    public void A_long_error_is_cut_so_the_page_stays_readable()
    {
        var text = ModHealth.Report(new[] { new ModHealth.Plugin(Ours + "a", "Alpha", "1.0", true) },
            new Dictionary<string, ModHealth.Errors> { ["Alpha"] = new(1, new string('x', 400)) });

        Assert.Contains(new string('x', 160) + "...", text);
        Assert.DoesNotContain(new string('x', 161), text);
    }
}

public class GmReadoutsTests
{
    [Theory]
    [InlineData(41)] // UIStack
    [InlineData(43)] // NearbyFurnitureList
    [InlineData(57)] // EnvironmentSnapshot
    public void Readouts_nothing_reads_are_dropped(int msgHead) => Assert.True(GmReadouts.IsUnused(msgHead));

    [Theory]
    [InlineData(5)] // ReportAttrInfo: the stat bars
    [InlineData(37)] // ActionTypeList: the UI action picker
    [InlineData(48)] // GameSavesList: saves and the backup before cheating
    [InlineData(50)] // BackupResult
    [InlineData(78)] // TestSense: the Sense test row
    [InlineData(80)] // ReportAIStatus: the Character behaviour row
    public void Readouts_the_panel_reads_are_kept(int msgHead) => Assert.False(GmReadouts.IsUnused(msgHead));

    [Fact]
    public void A_repeated_readout_the_same_as_the_last_one_is_not_handed_over_again()
    {
        var repeats = new RepeatedReadouts();

        Assert.True(repeats.IsNew(5, "{\"msgHead\":5,\"hp\":10}"));
        Assert.False(repeats.IsNew(5, "{\"msgHead\":5,\"hp\":10}"));
        Assert.True(repeats.IsNew(5, "{\"msgHead\":5,\"hp\":9}"));
        Assert.True(repeats.IsNew(80, "{\"msgHead\":80}"));
        Assert.False(repeats.IsNew(80, "{\"msgHead\":80}"));
    }

    [Fact]
    public void A_reply_the_panel_asked_for_always_goes_through_even_when_the_same()
    {
        var repeats = new RepeatedReadouts();

        Assert.True(repeats.IsNew(48, "{\"msgHead\":48}"));
        Assert.True(repeats.IsNew(48, "{\"msgHead\":48}"));
    }

    [Fact]
    public void After_the_panel_opens_the_first_of_each_readout_goes_through()
    {
        var repeats = new RepeatedReadouts();

        repeats.IsNew(5, "{\"msgHead\":5}");
        repeats.Clear();

        Assert.True(repeats.IsNew(5, "{\"msgHead\":5}"));
    }
}

public class NewCheatNameTests
{
    [Theory]
    [InlineData("fresh")]
    [InlineData("recipes")]
    [InlineData("skipto")]
    [InlineData("repairall")]
    [InlineData("containers")]
    [InlineData("unsearch")]
    [InlineData("traps")]
    [InlineData("basket")]
    [InlineData("toast")]
    [InlineData("health")]
    public void Each_new_cheat_is_one_the_plugin_runs(string name) => Assert.True(ModCheats.IsAction(name));

    [Fact]
    public void Never_spoil_and_hovered_id_are_holds() => Assert.True(ModCheats.IsHold("nospoil") && ModCheats.IsHold("hover"));
}
