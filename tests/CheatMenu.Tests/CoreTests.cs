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
        Assert.IsType<PageCommand.Ready>(PageCommand.Parse(P + "ready"));
        Assert.Equal(new PageCommand.SavePresets("[]"), PageCommand.Parse(P + "presets|[]"));
        Assert.False(PageCommand.IsOurs("slmod|defensemanager|close"));
        Assert.IsType<PageCommand.Unknown>(PageCommand.Parse(P + "close|now"));
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
