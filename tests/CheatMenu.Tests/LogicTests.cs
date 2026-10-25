using System.Reflection;
using System.Text.Json;
using CheatMenu.Core;
using Jint;
using Xunit;

namespace CheatMenu.Tests;

/// <summary>The panel's row logic, run in Jint over the shipped tables: how each row reaches the game.</summary>
public class LogicTests
{
    private readonly Engine js = new();

    public LogicTests()
    {
        js.Execute("var window = this;");
        foreach (var name in new[] { "schema.js", "catalog.js", "tabs.js", "refs.js", "logic.js" }) js.Execute(Web(name));

        // Each row with its game tools, as the panel merges them.
        js.Execute(@"var L = window.__slcheatmenuLogic;
var ROWS = [];
TABS.forEach(function (t) { t.groups.forEach(function (g) { g.rows.forEach(function (r) {
  var key = t.id + '|' + r.l;
  var row = Object.assign({}, r, RETAG[key] || {}, { key: key, ref: REFS[key] || [] });
  ROWS.push(row);
}); }); });
ADD.forEach(function (a) { var key = a.tab + '|' + a.row.l; ROWS.push(Object.assign({}, a.row, RETAG[key] || {}, { key: key, ref: REFS[key] || [] })); });
function row(key) { var r = ROWS.find(function (x) { return x.key === key; }); if (!r) throw new Error('no row ' + key); return r; }");
    }

    internal static string Web(string name)
    {
        using var stream = Assembly.GetExecutingAssembly().GetManifestResourceStream("CheatMenu.web." + name) ?? throw new InvalidOperationException(name);
        using var reader = new StreamReader(stream);

        return reader.ReadToEnd();
    }

    private string Json(string expression) => js.Evaluate("JSON.stringify(" + expression + ")").AsString();

    [Fact]
    public void Game_speed_choices_send_the_speed_as_a_number()
    {
        Assert.Equal("{\"kind\":\"cmd\",\"name\":\"SetGameSpeed\",\"field\":\"Scale\"}", Json("L.bind(row('quick|Game speed'))"));
        Assert.Equal("{\"msg\":{\"msgHead\":52,\"Scale\":4}}", Json("L.rowMessage(L.bind(row('quick|Game speed')), 'x4')"));
        Assert.Equal("{\"msg\":{\"msgHead\":52,\"Scale\":0.25}}", Json("L.rowMessage(L.bind(row('time|Game speed')), 'x0.25')"));
    }

    [Fact]
    public void A_toggle_over_one_of_the_games_switches_sets_that_switch()
    {
        Assert.Equal("{\"kind\":\"flag\",\"flag\":\"LockFurnitureDurability\"}", Json("L.bind(row('quick|Doors and windows never wear'))"));
    }

    [Fact]
    public void The_switches_the_panel_sets_are_exactly_the_ones_the_plugin_accepts()
    {
        var page = JsonSerializer.Deserialize<string[]>(Json("L.FLAGS"))!;

        Assert.Equal(GmFlagNames.All, page);
    }

    [Fact]
    public void Rows_the_mod_adds_are_never_sent_to_the_game_yet()
    {
        var sent = js.Evaluate("ROWS.filter(function (r) { return r.s === 'M' && L.bind(r).kind !== 'none'; }).length").AsNumber();
        var added = js.Evaluate("ROWS.filter(function (r) { return r.s === 'M'; }).length").AsNumber();

        Assert.True(added > 0);
        Assert.Equal(0, sent);
    }

    [Fact]
    public void Every_game_row_that_names_a_game_command_can_send_it()
    {
        var stranded = Json("ROWS.filter(function (r) { return r.s === 'G' && r.ref.some(function (k) { return SCHEMA[k]; }) && L.bind(r).kind === 'none'; }).map(function (r) { return r.key; })");

        Assert.Equal("[]", stranded);
    }

    [Fact]
    public void Every_row_bound_to_one_command_builds_a_message_for_its_starting_value()
    {
        var broken = Json(@"ROWS.filter(function (r) {
  var b = L.bind(r);
  if (b.kind !== 'cmd') return false;
  var value = r.k === 'sel' ? r.o[0] : r.k === 'num' ? r.v : r.k === 'tog' ? true : null;
  var m = L.rowMessage(b, value);
  return !m.msg || m.msg.msgHead !== SCHEMA[b.name].id || (b.field && m.msg[b.field] === undefined);
}).map(function (r) { return r.key; })");

        Assert.Equal("[]", broken);
    }

    [Fact]
    public void Every_game_command_builds_a_typed_message_from_text_fields()
    {
        var wrong = Json(@"Object.keys(SCHEMA).filter(function (name) {
  var sc = SCHEMA[name], values = {};
  var sample = { bool: 'true', string: 'abc', float: '1.5', double: '1.5', int: '3', long: '3', 'List<int>': '1, 2', 'List<string>': 'a,b' };
  sc.f.forEach(function (f) { values[f[1]] = sample[f[0]] !== undefined ? sample[f[0]] : '[]'; });
  var m = L.message(name, values);
  if (!m.msg || m.msg.msgHead !== sc.id) return true;
  return sc.f.some(function (f) {
    var v = m.msg[f[1]];
    if (f[0] === 'bool') return v !== true;
    if (f[0] === 'string') return v !== 'abc';
    if (f[0] === 'int' || f[0] === 'long') return v !== 3;
    if (f[0] === 'float' || f[0] === 'double') return v !== 1.5;
    return !Array.isArray(v);
  });
})");

        Assert.Equal("[]", wrong);
        Assert.Equal(167, js.Evaluate("Object.keys(SCHEMA).length").AsNumber());
    }

    [Fact]
    public void Fields_left_empty_are_left_out_and_bad_numbers_are_refused()
    {
        Assert.Equal("{\"msg\":{\"msgHead\":20,\"ItemConfigId\":1203}}", Json("L.message('AddItem', { ItemConfigId: '1203' })"));
        Assert.Equal("{\"error\":\"Check Count\"}", Json("L.message('AddItem', { ItemConfigId: '1203', Count: '2.5' })"));
        Assert.Equal("{\"error\":\"Check attrValue\"}", Json("L.message('ChangeAttr', { attrKey: 'Health', attrValue: 'lots' })"));
        Assert.Equal("[1,2,3]", Json("L.coerce('List<int>', '1, 2 3')"));
        Assert.Equal("undefined", js.Evaluate("String(L.coerce('List<int>', '1, x'))").AsString());
    }

    [Fact]
    public void The_stat_bars_read_the_games_attribute_readout()
    {
        var bars = Json(@"L.vitals({ msgHead: 5, attrs: [
  { key: 'Health', baseValue: 40, baseTotal: 42 }, { key: 'MaxHealth', baseValue: 100 },
  { key: 'Satiety', baseValue: 7 }, { key: 'MoveSpeed_Ratio', baseValue: 1 } ] })");

        Assert.Equal("[{\"k\":\"Satiety\",\"v\":7,\"max\":null},{\"k\":\"Health\",\"v\":42,\"max\":100}]", bars);
        Assert.Equal("null", Json("L.vitals({ msgHead: 14, msgs: [] })"));
    }

    [Fact]
    public void The_backup_is_made_of_the_save_being_played()
    {
        var file = Json("L.currentSave({ Items: [{ FileName: 'a.sav', IsCurrent: false }, { FileName: 'b.sav', IsCurrent: true }] })");

        Assert.Equal("\"b.sav\"", file);
        Assert.Equal("null", Json("L.currentSave({ Items: [{ FileName: 'a.sav', IsCurrent: false }] })"));
    }
}

public class PageBundleTests
{
    [Fact]
    public void The_shipped_bundle_is_one_script_that_parses_with_every_file_in_order()
    {
        var bundle = PageBundle.Join(LogicTests.Web);

        Engine.PrepareScript(bundle);
        Assert.StartsWith("window.__slcheatmenuCss=\"", bundle);

        var at = PageBundle.Scripts.Select(name => bundle.IndexOf(LogicTests.Web(name).Substring(0, 60), StringComparison.Ordinal)).ToArray();

        Assert.DoesNotContain(-1, at);
        Assert.Equal(at.OrderBy(x => x), at);
    }
}
