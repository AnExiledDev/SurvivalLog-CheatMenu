using System.Text.Json;
using Jint;
using Xunit;

namespace CheatMenu.Tests;

/// <summary>The item spawner's list and its search, run in Jint over the shipped items.js.</summary>
public class ItemSpawnerTests
{
    private readonly Engine js = new();

    public ItemSpawnerTests()
    {
        js.Execute("var window = this;");
        foreach (var name in new[] { "items.js", "schema.js", "catalog.js", "gamedata.js", "pickers.js", "tabs.js", "refs.js", "rows.js", "zh.js", "logic.js" }) js.Execute(LogicTests.Web(name));
        js.Execute("var L = window.__slcheatmenuLogic; var ITEMS = L.itemRows(window.GAMEITEMS);");
    }

    private string[] Found(string query) =>
        JsonSerializer.Deserialize<string[]>(js.Evaluate($"JSON.stringify(L.findItems(ITEMS, {JsonSerializer.Serialize(query)}).map(function (i) {{ return i.n; }}))").AsString())!;

    [Fact]
    public void The_spawner_lists_every_item_not_a_sample()
    {
        // It used to carry 442 of the game's 3,894 items, so searching for most items found nothing.
        Assert.True(js.Evaluate("ITEMS.length").AsNumber() > 3800);
        Assert.Contains("Hamburger", Found("hamburger"));
        Assert.Contains("Fuel Crate", Found("fuel crate"));
        Assert.Contains("Rescue Beacon", Found("rescue beacon"));
    }

    [Fact]
    public void Every_word_has_to_match_in_any_order_and_either_language()
    {
        Assert.Contains("Apple Juice (Perfect)", Found("juice apple"));
        Assert.Contains("Apple Juice (Perfect)", Found("APPLE perfect"));
        Assert.Contains("Apple Juice (Perfect)", Found("苹果汁"));
        Assert.DoesNotContain("Apple Juice (Perfect)", Found("apple failed"));
        Assert.Empty(Found("apple zzzz"));
        Assert.Empty(Found("   "));
    }

    [Fact]
    public void An_exact_name_or_id_comes_first_then_names_that_start_with_the_search()
    {
        // "5" is in over a thousand names and ids; the item whose id is 5 has to be the first one shown.
        Assert.Equal("Game Console", Found("5")[0]);

        var juice = Found("apple juice");

        Assert.Equal("Apple Juice (Perfect)", juice[0]);
        Assert.Equal("Apple Juice she made", juice[^1]);
        Assert.Equal("Hamburger", Found("汉堡")[0]);

        // In the game's tables its Chinese name starts with a zero-width space, which no one can type.
        Assert.Equal("Multivitamins", Found("复合维生素")[0]);
    }

    [Fact]
    public void A_typed_id_beats_a_name_that_starts_with_the_same_number()
    {
        // No name in the game's tables starts with another item's id yet, so this needs a made-up list.
        var names = js.Evaluate("JSON.stringify(L.findItems(L.itemRows([[3, '50 Nails', '', 0, 1, ''], [50, 'Rope', '', 0, 1, '']]), '50').map(function (i) { return i.n; }))").AsString();

        Assert.Equal("[\"Rope\",\"50 Nails\"]", names);
    }

    [Fact]
    public void An_item_without_a_picture_file_has_no_icon_to_load()
    {
        // The two items the game has no icon file for would draw as broken pictures.
        Assert.Equal("", js.Evaluate("ITEMS.find(function (i) { return i.n === 'Developer Certificate'; }).i").AsString());
        Assert.StartsWith("Res/", js.Evaluate("ITEMS.find(function (i) { return i.n === 'Hamburger'; }).i").AsString());
    }

    [Fact]
    [Trait("Category", "GameBuild")]
    public void The_spawners_items_are_the_ones_in_the_game_tables()
    {
        var shipped = JsonSerializer.Deserialize<int[]>(js.Evaluate("JSON.stringify(ITEMS.map(function (i) { return i.id; }))").AsString())!;
        var game = File.ReadLines(DumpFile("Config_Item.jsonl")).Where(line => line.Trim().Length > 0).Select(line => JsonDocument.Parse(line).RootElement.GetProperty("ID").GetInt32()).OrderBy(id => id).ToArray();

        // After a game update: rerun tools/cheatmenu-items.py (see its header) and build again.
        Assert.Equal(game, shipped);
    }

    private static string DumpFile(string name)
    {
        for (var dir = new DirectoryInfo(AppContext.BaseDirectory); dir != null; dir = dir.Parent)
        {
            var file = Path.Combine(dir.FullName, "game-ref", "BepInEx", "data-dump", name);

            if (File.Exists(file)) return file;
        }

        throw new FileNotFoundException("no game-ref/BepInEx/data-dump above the tests; run tools/refresh-game-ref.sh");
    }
}
