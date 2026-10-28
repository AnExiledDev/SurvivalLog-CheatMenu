using System.Text.Json;
using CheatMenu.Core;
using Xunit;

namespace CheatMenu.Tests;

/// <summary>The Mod tests tab: how another mod's DevCheats methods become buttons.</summary>
public class ModTestsTests
{
    [Fact]
    public void A_label_carries_its_english_and_chinese()
    {
        Assert.Equal(("Restock here now", "立即补货"), ModTests.Split("Restock here now\n立即补货", "fallback"));
    }

    [Fact]
    public void A_label_with_no_chinese_uses_the_english_for_both()
    {
        Assert.Equal(("Restock", "Restock"), ModTests.Split("Restock", "fallback"));
    }

    [Fact]
    public void A_missing_label_falls_back_to_the_method_name_as_words()
    {
        Assert.Equal(("Restock here now", "Restock here now"), ModTests.Split(null, ModTests.Words("RestockHereNow")));
    }

    [Fact]
    public void The_page_gets_every_mod_with_cheats_by_name_and_skips_mods_with_none()
    {
        var mods = new[]
        {
            new ModTests.Mod("com.dev.survivallog.trap", "Trap Hub", new[] { new ModTests.Cheat("FillTraps", "Fill traps", "装满", "", "") }),
            new ModTests.Mod("com.dev.survivallog.empty", "Empty", Array.Empty<ModTests.Cheat>()),
            new ModTests.Mod("com.dev.survivallog.lootrestock", "Loot Restock", new[] { new ModTests.Cheat("RestockHere", "Say \"hi\"\\", "立即补货", "Line one\nline two", "") }),
        };

        using var json = JsonDocument.Parse(ModTests.Json(mods));
        var list = json.RootElement.EnumerateArray().ToList();

        Assert.Equal(new[] { "Loot Restock", "Trap Hub" }, list.Select(m => m.GetProperty("name").GetString()));

        var cheat = list[0].GetProperty("cheats")[0];

        Assert.Equal("com.dev.survivallog.lootrestock", list[0].GetProperty("mod").GetString());
        Assert.Equal("RestockHere", cheat.GetProperty("id").GetString());
        Assert.Equal("Say \"hi\"\\", cheat.GetProperty("l").GetString());
        Assert.Equal("立即补货", cheat.GetProperty("zh").GetString());
        Assert.Equal("Line one\nline two", cheat.GetProperty("d").GetString());
    }

    [Fact]
    public void No_mods_with_cheats_is_an_empty_list()
    {
        Assert.Equal("[]", ModTests.Json(Array.Empty<ModTests.Mod>()));
    }

    [Theory]
    [InlineData("modtests")]
    [InlineData("modtest")]
    public void The_page_may_list_and_run_test_cheats(string name)
    {
        var command = PageCommand.Parse(PageCommand.Prefix + "act|7|" + name + "|{\"mod\":\"m\",\"cheat\":\"c\"}");

        Assert.Equal(new PageCommand.Act("7", name, "{\"mod\":\"m\",\"cheat\":\"c\"}"), command);
    }
}
