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
    public void A_slow_command_is_named_in_the_log_by_what_it_ran()
    {
        Assert.Equal("GM message 198", PageCommand.Parse(P + "gm|4|{\"msgHead\":198}").Describe());
        Assert.Equal("action modtests", PageCommand.Parse(P + "act|5|modtests|{}").Describe());
        Assert.Equal("noscript", PageCommand.Parse(P + "noscript").Describe());
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

        LoopRewards.SetLevel(survivor, 5124, 0, 5);

        Assert.Equal(5, survivor.Levels[5124]);
        Assert.Equal(new[] { 512450 }, survivor.Buffs);
        Assert.Contains(5124, survivor.Given);
    }

    [Fact]
    public void Moving_a_reward_up_or_down_swaps_its_buff_for_the_new_levels()
    {
        var survivor = new MidRunSurvivor();

        LoopRewards.SetLevel(survivor, 5124, 0, 2);
        LoopRewards.SetLevel(survivor, 5124, 2, 5);
        Assert.Equal(new[] { 512450 }, survivor.Buffs);

        LoopRewards.SetLevel(survivor, 5124, 5, 1);
        Assert.Equal(new[] { 512410 }, survivor.Buffs);
    }

    [Fact]
    public void Level_0_takes_the_reward_and_its_buff_away()
    {
        var survivor = new MidRunSurvivor();

        LoopRewards.SetLevel(survivor, 5124, 0, 3);
        LoopRewards.SetLevel(survivor, 5124, 3, 0);

        Assert.Empty(survivor.Levels);
        Assert.Empty(survivor.Buffs);
        Assert.Empty(survivor.Given);
    }

    [Fact]
    public void Setting_the_level_a_reward_already_has_puts_on_its_missing_buff_and_keeps_the_level()
    {
        var survivor = new MidRunSurvivor();

        survivor.RevertToLevel(5124, 5);
        LoopRewards.SetLevel(survivor, 5124, 5, 5);

        Assert.Equal(5, survivor.Levels[5124]);
        Assert.Equal(new[] { 512450 }, survivor.Buffs);
        Assert.Contains(5124, survivor.Given);
    }

    [Fact]
    public void The_level_a_reward_already_has_is_free_and_says_its_effect_is_on()
    {
        Assert.Equal(new LoopRewards.Change(0, null), LoopRewards.Plan(2, 2, new System.Collections.Generic.Dictionary<int, int> { [1] = 5, [2] = 10 }, true, 0));
        Assert.Equal("Early Riser stays level 2, its effect is on now", LoopRewards.Done("Early Riser", 2, 2, 0));
    }
}

public class RewardScreenTests
{
    private static System.Collections.Generic.Dictionary<int, LoopRewards.Owned> AtOpen(params (int Talent, int Level, bool HadBuff)[] owned) =>
        owned.ToDictionary(o => o.Talent, o => new LoopRewards.Owned(o.Level, o.HadBuff));

    private static System.Collections.Generic.Dictionary<int, int> Now(params (int Talent, int Level)[] levels) => levels.ToDictionary(l => l.Talent, l => l.Level);

    [Fact]
    public void A_reward_bought_on_the_screen_gets_its_new_levels_buff()
    {
        var give = LoopRewards.Rebuff(AtOpen((1001, 2, true)), Now((1001, 2), (5124, 3)));

        Assert.Equal(new[] { (1001, 2), (5124, 3) }, give);
    }

    [Fact]
    public void A_reward_bought_up_gets_the_buff_of_the_level_it_reached()
    {
        Assert.Equal(new[] { (1001, 4) }, LoopRewards.Rebuff(AtOpen((1001, 2, true)), Now((1001, 4))));
    }

    [Fact]
    public void A_reward_bought_then_reset_gets_back_the_buff_the_screen_took_off()
    {
        // Buying took the level 2 buff off and resetting back to level 2 added none, so the level matches but the buff is gone.
        Assert.Equal(new[] { (1001, 2) }, LoopRewards.Rebuff(AtOpen((1001, 2, true)), Now((1001, 2))));
    }

    [Fact]
    public void A_reward_left_alone_whose_buff_was_not_on_yet_stays_that_way()
    {
        // Rewards that start at the disaster have no buff before it; the screen must not hand it out early.
        Assert.Empty(LoopRewards.Rebuff(AtOpen((4010, 3, false)), Now((4010, 3))));
    }

    [Fact]
    public void A_reward_not_owned_gets_nothing()
    {
        Assert.Empty(LoopRewards.Rebuff(AtOpen((1001, 0, false)), Now((1001, 0), (1002, 0))));
    }

    [Fact]
    public void Opening_the_screen_is_a_cheat_the_plugin_runs_and_closes_the_panel_for()
    {
        Assert.True(ModCheats.IsAction("rewardscreen"));
        Assert.True(ModCheats.OpensScreen("rewardscreen"));
        Assert.False(ModCheats.OpensScreen("loopreward"));
    }
}

public class ListLabelsTests
{
    [Fact]
    public void A_planted_pot_names_its_plant_and_how_it_is_doing()
    {
        Assert.Equal("Tomato - ripe", ListLabels.Pot("Tomato", 12, ListLabels.Plant.Mature, false));
        Assert.Equal("番茄 - 枯萎", ListLabels.Pot("番茄", 12, ListLabels.Plant.Withered, true));
    }

    [Fact]
    public void A_pot_with_nothing_planted_reads_as_empty_whatever_state_the_game_left_on_it()
    {
        Assert.Equal("Empty pot", ListLabels.Pot(null, 0, ListLabels.Plant.Withered, false));
        Assert.Equal("空种植盆", ListLabels.Pot(null, 0, ListLabels.Plant.Idle, true));
    }

    [Fact]
    public void A_plant_with_no_name_in_the_table_still_shows_which_plant_it_is()
    {
        Assert.Equal("Plant 41 - growing", ListLabels.Pot(null, 41, ListLabels.Plant.Growing, false));
    }

    [Fact]
    public void A_buff_says_whether_it_helps_and_whether_the_game_hides_it()
    {
        Assert.Equal("Refreshed - good", ListLabels.Buff("Refreshed", true, false, false));
        Assert.Equal("Hungry - bad, hidden", ListLabels.Buff("Hungry", false, true, false));
        Assert.Equal("饥饿 - 减益，隐藏", ListLabels.Buff("饥饿", false, true, true));
        Assert.Equal("Unnamed buff - bad", ListLabels.Buff(null, false, false, false));
    }

    [Fact]
    public void An_event_waiting_on_an_answer_says_so_and_an_answered_one_does_not()
    {
        Assert.Equal("Rats - waiting on a choice", ListLabels.Event("Rats", 2001, true, false));
        Assert.Equal("Rats", ListLabels.Event("Rats", 2001, false, false));
        Assert.Equal("事件 2001 - 等待选择", ListLabels.Event(null, 2001, true, true));
    }

    [Fact]
    public void Furniture_with_no_name_in_the_table_shows_its_kind()
    {
        Assert.Equal("Wooden Door", ListLabels.Furniture("Wooden Door", 7, false));
        Assert.Equal("Furniture kind 7", ListLabels.Furniture(null, 7, false));
    }

    [Fact]
    public void A_table_row_with_no_name_shows_what_it_is_and_its_id()
    {
        Assert.Equal("Bunk Bed", ListLabels.Named("Bunk Bed", "Item", "物品", 5001, false));
        Assert.Equal("物品 5001", ListLabels.Named(null, "Item", "物品", 5001, true));
    }

    [Fact]
    public void A_text_shows_its_sender_and_one_short_line_without_the_games_markup()
    {
        Assert.Equal("Mom: Are you safe? Call me", ListLabels.Text("Mom", "<color=red>Are you safe?</color>\nCall   me", 3, false));
        Assert.Equal("Line one Line two", ListLabels.Text(null, "Line one\\nLine two {0}", 3, false));
        Assert.Equal("Come to the roof...", ListLabels.Snippet("Come to the roof, now please", 20));
        Assert.Equal("Text 12", ListLabels.Text(null, "  ", 12, false));
        Assert.Equal("短信 12", ListLabels.Text(null, null, 12, true));
    }

    [Fact]
    public void A_robot_says_which_job_it_does()
    {
        Assert.Equal("Robo - planting", ListLabels.Robot("Robo", 2, false));
        Assert.Equal("机器人 - 整理", ListLabels.Robot(null, 1, true));
        Assert.Equal("Robot", ListLabels.Robot(null, 9, false));
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
        Assert.Equal("not owned", LoopRewards.Plan(0, 0, Costs, true, 100).Error);
        Assert.Equal("needs 15 Planning Points, you have 14", LoopRewards.Plan(0, 2, Costs, true, 14).Error);
        Assert.Equal(new LoopRewards.Change(-15, null), LoopRewards.Plan(0, 2, Costs, true, 15));
    }

    [Fact]
    public void The_panel_shows_the_owned_level_and_what_the_change_cost()
    {
        Assert.Equal("Early Riser - Lv 2/5", LoopRewards.Label("Early Riser", 2, 5));
        Assert.Equal("Early Riser now level 3, 35 Planning Points spent", LoopRewards.Done("Early Riser", 0, 3, -35));
        Assert.Equal("Early Riser removed, 35 Planning Points given back", LoopRewards.Done("Early Riser", 3, 0, 35));
        Assert.Equal("Early Riser now level 1", LoopRewards.Done("Early Riser", 0, 1, 0));
        Assert.True(ModCheats.IsAction("loopreward"));
        Assert.True(ModCheats.IsList("talents"));
    }
}

public class RewardScreenModeTests
{
    [Fact]
    public void Opened_mid_run_by_the_menu_the_next_loop_button_says_close_in_the_games_language()
    {
        Assert.Equal("Close", RewardScreenModes.CloseLabel(RewardScreenModes.MidRun, isChinese: false));
        Assert.Equal("关闭", RewardScreenModes.CloseLabel(RewardScreenModes.MidRun, isChinese: true));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(1)]
    [InlineData(2)]
    public void Opened_by_the_game_the_button_keeps_its_own_text_since_it_really_starts_the_next_loop(int gameOpenMode)
    {
        Assert.Null(RewardScreenModes.CloseLabel(gameOpenMode, isChinese: false));
        Assert.Null(RewardScreenModes.CloseLabel(gameOpenMode, isChinese: true));
    }
}
