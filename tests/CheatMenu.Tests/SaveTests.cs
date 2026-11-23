using CheatMenu.Core;
using Xunit;

namespace CheatMenu.Tests;

public class SaveWatchTests
{
    /// <summary>
    /// Going from one save to another through the main menu must give the panel a new id, or it would offer the old
    /// save's backup in the new one, and loading it would put the player back in the old save.
    /// </summary>
    [Fact]
    public void Loading_another_save_through_the_main_menu_gives_a_new_id()
    {
        var saves = new SaveWatch();

        saves.Seen(true);
        var first = saves.Id;
        saves.Seen(false);
        saves.Seen(true);

        Assert.NotEqual(first, saves.Id);
    }

    [Fact]
    public void Staying_in_the_same_save_keeps_the_id()
    {
        var saves = new SaveWatch();

        saves.Seen(true);
        var first = saves.Id;
        saves.Seen(true);
        saves.Seen(true);

        Assert.Equal(first, saves.Id);
    }
}

public class PresetJsonTests
{
    /// <summary>The file goes into the panel's script as it is, so broken JSON would stop the panel from opening.</summary>
    [Theory]
    [InlineData("[{")]
    [InlineData("{\"name\":\"a\"}")]
    [InlineData("alert(1)")]
    [InlineData("")]
    [InlineData(null)]
    public void A_presets_file_that_is_not_a_json_list_opens_the_panel_with_no_presets(string? text)
    {
        Assert.Equal("null", PresetJson.OrNull(text));
    }

    [Fact]
    public void A_good_presets_file_goes_in_unchanged()
    {
        const string text = "[{\"name\":\"Testing\",\"values\":{\"flag:LockCharacterAttr\":true}}]";

        Assert.Equal(text, PresetJson.OrNull(text));
    }
}
