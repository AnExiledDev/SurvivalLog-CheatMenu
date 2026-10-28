using CheatMenu.Core;
using Xunit;

namespace CheatMenu.Tests;

public class PageCommandTests
{
    private const string P = PageCommand.Prefix;

    [Fact]
    public void A_gm_message_keeps_its_json_whole_even_when_the_json_holds_the_separator()
    {
        var command = PageCommand.Parse(P + "gm|7|{\"msgHead\":32,\"Text\":\"a|b\"}");

        Assert.Equal(new PageCommand.Gm("7", "{\"msgHead\":32,\"Text\":\"a|b\"}"), command);
    }

    [Fact]
    public void A_gm_message_without_an_id_or_json_is_not_sent()
    {
        Assert.IsType<PageCommand.Unknown>(PageCommand.Parse(P + "gm||{}"));
        Assert.IsType<PageCommand.Unknown>(PageCommand.Parse(P + "gm|3|"));
    }

    [Fact]
    public void Only_the_games_own_switches_can_be_set()
    {
        Assert.Equal(new PageCommand.Flag("LockCharacterAttr", true), PageCommand.Parse(P + "flag|LockCharacterAttr|1"));
        Assert.Equal(new PageCommand.Flag("SkipTimeline", false), PageCommand.Parse(P + "flag|SkipTimeline|0"));
        Assert.IsType<PageCommand.Unknown>(PageCommand.Parse(P + "flag|_Instance|1"));
        Assert.IsType<PageCommand.Unknown>(PageCommand.Parse(P + "flag|SkipTimeline|yes"));
    }

    [Fact]
    public void Plain_verbs_and_presets_parse_and_other_mods_messages_are_not_ours()
    {
        Assert.IsType<PageCommand.Close>(PageCommand.Parse(P + "close"));
        Assert.Equal(new PageCommand.Focus(true), PageCommand.Parse(P + "focus|1"));
        Assert.Equal(new PageCommand.Focus(false), PageCommand.Parse(P + "focus|0"));
        Assert.IsType<PageCommand.Unknown>(PageCommand.Parse(P + "focus|yes"));
        Assert.IsType<PageCommand.Unknown>(PageCommand.Parse(P + "focus"));
        Assert.IsType<PageCommand.Ready>(PageCommand.Parse(P + "ready"));
        Assert.Equal(new PageCommand.SavePresets("[]"), PageCommand.Parse(P + "presets|[]"));
        Assert.False(PageCommand.IsOurs("slmod|defensemanager|close"));
        Assert.IsType<PageCommand.Unknown>(PageCommand.Parse(P + "close|now"));
    }

    [Fact]
    public void Only_the_mods_own_cheats_and_holds_run_and_their_arguments_stay_whole()
    {
        Assert.Equal(new PageCommand.Act("4", "mature", "{\"pot\":\"a|b\"}"), PageCommand.Parse(P + "act|4|mature|{\"pot\":\"a|b\"}"));
        Assert.Equal(new PageCommand.Act("5", "tend", ""), PageCommand.Parse(P + "act|5|tend"));
        Assert.IsType<PageCommand.Unknown>(PageCommand.Parse(P + "act|5|format-disk|{}"));
        Assert.IsType<PageCommand.Unknown>(PageCommand.Parse(P + "act||tend|{}"));
        Assert.Equal(new PageCommand.Hold("god", true), PageCommand.Parse(P + "hold|god|1"));
        Assert.Equal(new PageCommand.Hold("clock", false), PageCommand.Parse(P + "hold|clock|0"));
        Assert.IsType<PageCommand.Unknown>(PageCommand.Parse(P + "hold|god|on"));
        Assert.IsType<PageCommand.Unknown>(PageCommand.Parse(P + "hold|fly|1"));
    }
}

public class ActArgsTests
{
    [Fact]
    public void Numbers_typed_as_text_still_count_and_bad_values_are_null()
    {
        var a = ActArgs.Parse("{\"pot\":\"12\",\"kind\":4,\"value\":2.5,\"on\":false,\"name\":\"x\",\"bad\":\"lots\"}");

        Assert.Equal(12, a.Int("pot"));
        Assert.Equal(4, a.Int("kind"));
        Assert.Null(a.Int("value"));
        Assert.Equal(2.5, a.Number("value"));
        Assert.False(a.Bool("on"));
        Assert.Equal("x", a.Text("name"));
        Assert.Null(a.Number("bad"));
        Assert.Null(a.Int("missing"));
    }

    [Fact]
    public void Anything_but_an_object_reads_as_no_arguments()
    {
        Assert.Null(ActArgs.Parse("").Int("pot"));
        Assert.Null(ActArgs.Parse("[1]").Int("pot"));
        Assert.Null(ActArgs.Parse("{nope").Int("pot"));
    }
}

public class GmRequestTests
{
    [Fact]
    public void The_message_head_is_read_from_a_json_object()
    {
        Assert.Equal(52, GmRequest.Head("{\"msgHead\":52,\"Scale\":4}", out _));
    }

    [Theory]
    [InlineData("[1]")]
    [InlineData("{\"Scale\":4}")]
    [InlineData("{\"msgHead\":0}")]
    [InlineData("{\"msgHead\":\"52\"}")]
    [InlineData("{msgHead:52")]
    public void Anything_the_game_could_not_read_is_refused_with_a_reason(string json)
    {
        Assert.Null(GmRequest.Head(json, out var why));
        Assert.NotEqual("", why);
    }
}

public class JsTextTests
{
    [Fact]
    public void A_literal_cannot_close_a_script_tag_or_break_a_line()
    {
        var literal = JsText.Literal("a\"b\\c</script>\n" + (char)0x2028);

        Assert.Equal("\"a\\\"b\\\\c\\u003c/script>\\u000a\\u2028\"", literal);
    }
}

public class LoopRewardBuffTests
{
    /// <summary>
    /// A survivor mid-run, as the game treats one: RevertToLevel takes off the old level's buff and sets the level but
    /// adds nothing (a loop reward's buff comes at the start of a run). A level's buff is talent * 100 + level * 10.
    /// </summary>
    private sealed class MidRunSurvivor : LoopRewards.ISurvivor
    {
        public System.Collections.Generic.Dictionary<int, int> Levels { get; } = new();
        public System.Collections.Generic.HashSet<int> Buffs { get; } = new();
        public System.Collections.Generic.HashSet<int> Given { get; } = new();

        public static int Buff(int talent, int level) => talent * 100 + level * 10;

        public void RevertToLevel(int talent, int level)
        {
            if (Levels.TryGetValue(talent, out var old)) Buffs.Remove(Buff(talent, old));

            if (level > 0) Levels[talent] = level;
            else Levels.Remove(talent);
        }

        public void AddLevelBuff(int talent, int level)
        {
            Levels[talent] = level;
            Buffs.Add(Buff(talent, level));
            Given.Add(talent);
        }

        public void ForgetGiven(int talent) => Given.Remove(talent);
    }

    [Fact]
    public void A_reward_set_mid_run_puts_its_buff_on_the_survivor_now()
    {
        var survivor = new MidRunSurvivor();

        LoopRewards.SetLevel(survivor, 5124, 5);

        Assert.Equal(5, survivor.Levels[5124]);
        Assert.Equal(new[] { 512450 }, survivor.Buffs);
        Assert.Contains(5124, survivor.Given);
    }

    [Fact]
    public void Moving_a_reward_up_or_down_swaps_its_buff_for_the_new_levels()
    {
        var survivor = new MidRunSurvivor();

        LoopRewards.SetLevel(survivor, 5124, 2);
        LoopRewards.SetLevel(survivor, 5124, 5);
        Assert.Equal(new[] { 512450 }, survivor.Buffs);

        LoopRewards.SetLevel(survivor, 5124, 1);
        Assert.Equal(new[] { 512410 }, survivor.Buffs);
    }

    [Fact]
    public void Level_0_takes_the_reward_and_its_buff_away()
    {
        var survivor = new MidRunSurvivor();

        LoopRewards.SetLevel(survivor, 5124, 3);
        LoopRewards.SetLevel(survivor, 5124, 0);

        Assert.Empty(survivor.Levels);
        Assert.Empty(survivor.Buffs);
        Assert.Empty(survivor.Given);
    }
}

public class LoopRewardTests
{
    // A reward with three levels; buying level L costs that level's LvUpCost.
    private static readonly System.Collections.Generic.Dictionary<int, int> Costs = new() { [1] = 5, [2] = 10, [3] = 20 };

    [Fact]
    public void Paying_for_a_jump_costs_every_level_on_the_way_and_going_down_gives_them_back()
    {
        Assert.Equal(new LoopRewards.Change(-35, null), LoopRewards.Plan(0, 3, Costs, true, 100));
        Assert.Equal(new LoopRewards.Change(-30, null), LoopRewards.Plan(1, 3, Costs, true, 100));
        Assert.Equal(new LoopRewards.Change(30, null), LoopRewards.Plan(3, 1, Costs, true, 0));
        Assert.Equal(new LoopRewards.Change(35, null), LoopRewards.Plan(3, 0, Costs, true, 0));
    }

    [Fact]
    public void Without_paying_any_level_is_free()
    {
        Assert.Equal(new LoopRewards.Change(0, null), LoopRewards.Plan(0, 3, Costs, false, 0));
        Assert.Equal(new LoopRewards.Change(0, null), LoopRewards.Plan(3, 0, Costs, false, 0));
    }

    [Fact]
    public void A_level_the_reward_lacks_the_level_it_has_or_too_few_points_is_refused()
    {
        Assert.Equal("no level 4; this reward has levels 1, 2, 3", LoopRewards.Plan(0, 4, Costs, false, 0).Error);
        Assert.NotNull(LoopRewards.Plan(0, -1, Costs, false, 0).Error);
        Assert.Equal("already level 2", LoopRewards.Plan(2, 2, Costs, true, 100).Error);
        Assert.Equal("needs 15 Planning Points, you have 14", LoopRewards.Plan(0, 2, Costs, true, 14).Error);
        Assert.Equal(new LoopRewards.Change(-15, null), LoopRewards.Plan(0, 2, Costs, true, 15));
    }

    [Fact]
    public void The_panel_shows_the_owned_level_and_what_the_change_cost()
    {
        Assert.Equal("Early Riser - Lv 2/5", LoopRewards.Label("Early Riser", 2, 5));
        Assert.Equal("Early Riser now level 3, 35 Planning Points spent", LoopRewards.Done("Early Riser", 3, -35));
        Assert.Equal("Early Riser removed, 35 Planning Points given back", LoopRewards.Done("Early Riser", 0, 35));
        Assert.Equal("Early Riser now level 1", LoopRewards.Done("Early Riser", 1, 0));
        Assert.True(ModCheats.IsAction("loopreward"));
        Assert.True(ModCheats.IsList("talents"));
    }
}
