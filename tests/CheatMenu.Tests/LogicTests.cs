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
        foreach (var name in new[] { "schema.js", "catalog.js", "gamedata.js", "pickers.js", "tabs.js", "refs.js", "rows.js", "zh.js", "logic.js" }) js.Execute(Web(name));

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
    public void Every_row_reaches_the_game_except_the_ones_the_game_itself_no_longer_runs()
    {
        var stranded = Json("ROWS.filter(function (r) { var b = L.bind(r); return b.kind === 'none' && b.why !== 'inactive'; }).map(function (r) { return r.key; })");

        Assert.Equal("[]", stranded);
        Assert.True(js.Evaluate("ROWS.filter(function (r) { return r.s === 'M' && L.bind(r).kind === 'spec'; }).length").AsNumber() > 20);
    }

    [Fact]
    public void The_mods_own_cheats_the_rows_name_are_exactly_ones_the_plugin_runs()
    {
        var acts = JsonSerializer.Deserialize<string[]>(Json("Object.keys(ROWSPEC).map(function (k) { return ROWSPEC[k].act; }).filter(Boolean)"))!;
        var holds = JsonSerializer.Deserialize<string[]>(Json("Object.keys(ROWSPEC).map(function (k) { return ROWSPEC[k].hold || ROWSPEC[k].pulse; }).filter(Boolean)"))!;
        // Saves, backups, the shop readout's lists and the UI's action names come from game messages, not the plugin.
        var lists = JsonSerializer.Deserialize<string[]>(Json("Object.keys(ROWSPEC).map(function (k) { var s = ROWSPEC[k]; return [s.live].concat((s.in || []).map(function (x) { return x.live; })).concat(s.act === 'list' ? [s.fix.of] : []); }).reduce(function (a, b) { return a.concat(b); }, []).filter(function (x) { return x && ['saves', 'backups', 'containers', 'scenes', 'uiactions'].indexOf(x) < 0; })"))!;

        Assert.All(acts, a => Assert.True(ModCheats.IsAction(a), a));
        Assert.All(holds, h => Assert.True(ModCheats.IsHold(h), h));
        Assert.All(lists, l => Assert.True(ModCheats.IsList(l), l));
        Assert.Equal(ModCheats.Holds.OrderBy(x => x), holds.Distinct().OrderBy(x => x));
    }

    [Fact]
    public void Every_spec_row_builds_its_messages_for_its_starting_values()
    {
        var broken = Json(@"Object.keys(ROWSPEC).filter(function (k) {
  var sp = ROWSPEC[k];
  if (!sp.cmd) return false;
  var main = Array.isArray(sp.opts) ? sp.opts[0][1] : sp.v !== undefined ? sp.v : sp.main ? '1' : undefined;
  var m = L.specMessages(sp, main, {});
  return !m.msgs || !m.msgs.length || m.msgs[0].msgHead !== SCHEMA[sp.cmd].id;
})");

        Assert.Equal("[]", broken);
    }

    private string Tr(string text, string lang) => js.Evaluate("L.tr(" + JsonSerializer.Serialize(text) + ", '" + lang + "')").AsString();

    [Fact]
    public void English_shows_no_chinese_and_chinese_shows_the_menus_own_words()
    {
        Assert.Equal("Durability lock.", Tr("Durability lock (门窗耐久锁定).", "en"));
        Assert.Equal("Add money", Tr("Add money", "en"));
        Assert.Equal("增加金钱", Tr("Add money", "zh"));
        Assert.Equal("门窗耐久锁定。", Tr("Durability lock (门窗耐久锁定).", "zh"));
        Assert.Equal("  关闭 ", Tr("  Close ", "zh"));
        Assert.Equal("Not in any table", Tr("Not in any table", "zh"));
    }

    [Fact]
    public void Chinese_translates_the_name_part_of_built_up_labels()
    {
        Assert.Equal("护士 (9106, 生命 100, 攻击 5)", Tr("Nurse (9106, hp 100, attack 5)", "zh"));
        Assert.Equal("物品 > 物品生成器", Tr("Item > Item spawner", "zh"));
        Assert.Equal("WebGm 面板命令 12", Tr("WebGm panel command 12", "zh"));
        Assert.Equal("5 结局线 1", Tr("5 Ending line 1", "zh"));
        Assert.Equal("更多字段 (3)", Tr("More fields (3)", "zh"));
    }

    private JsonElement[] Option(string key, int value) => JsonSerializer.Deserialize<JsonElement[]>(Json("ROWSPEC['" + key + "'].opts.find(function (o) { return o[1] === " + value + "; })"))!;

    [Fact]
    public void Pickers_say_what_each_choice_is_and_still_send_its_id()
    {
        Assert.Equal("Vim and Vigor - good (2)", Option("survivor|Add buff", 2)[0].GetString());
        Assert.Equal("Satiety - bad (1)", Option("survivor|Add buff", 1)[0].GetString());
        Assert.Equal("Early Riser - max Lv 5 (1001)", Option("survivor|Add talent", 1001)[0].GetString());
        Assert.Equal("Cold Wave Strikes - 2 days", Option("danger|Start a crisis", 1)[0].GetString());
        Assert.Equal("Ending: Supply Hub (13)", Option("survivor|Force game over", 13)[0].GetString());
        Assert.Equal("Door broken (1)", Option("survivor|Force game over", 1)[0].GetString());
        Assert.Equal("[[\"Crafting\",1],[\"Planting\",2],[\"Cooking\",3],[\"Traps\",4],[\"Exploration\",5],[\"Defense\",6]]", Json("ROWSPEC['survivor|Proficiency'].opts"));
    }

    [Fact]
    public void Force_game_over_offers_no_result_the_game_refuses()
    {
        // The game's handler turns down any Result above 13.
        Assert.Equal(13, js.Evaluate("Math.max.apply(null, ROWSPEC['story|Force game over'].opts.map(function (o) { return o[1]; }))").AsNumber());
    }

    [Theory]
    [InlineData("Vim and Vigor - good (2)", "神清气爽 - 增益 (2)")]
    [InlineData("Early Riser - max Lv 5 (1001)", "觉醒 - 最高等级 5 (1001)")]
    [InlineData("Cold Wave Strikes - 2 days", "寒潮来袭 - 2 天")]
    [InlineData("Energy Drink - Excited - good (20011)", "功能饮料-兴奋 - 增益 (20011)")]
    [InlineData("Creative Cook (Medium) (31351)", "创意托底·中档 (31351)")]
    [InlineData("Ending: Side By Side (girl) (6)", "结局：共同生活（女孩） (6)")]
    [InlineData("Home - 2nd floor (102)", "家 - 二楼 (102)")]
    [InlineData("Bicycle - price 150 (1)", "自行车 - 价格 150 (1)")]
    public void Chinese_translates_each_piece_of_a_picker_choice(string english, string chinese)
    {
        Assert.Equal(chinese, Tr(english, "zh"));
        Assert.Equal(english, Tr(english, "en"));
    }

    [Fact]
    public void Every_choice_in_the_game_data_pickers_reads_in_chinese()
    {
        var missing = Json("['survivor|Add buff', 'survivor|Add talent', 'survivor|Activate daily plan', 'survivor|Proficiency', 'survivor|Force game over', 'danger|Start a crisis'].map(function (k) { return ROWSPEC[k].opts.filter(function (o) { return L.tr(o[0], 'zh') === o[0]; }).map(function (o) { return o[0]; }); }).reduce(function (a, b) { return a.concat(b); }, [])");

        Assert.Equal("[]", missing);
    }

    private string Detail(string kind, string id, string lang) => js.Evaluate("L.detail('" + kind + "', " + id + ", '" + lang + "')").AsString();

    [Fact]
    public void The_line_under_a_picker_is_the_games_own_words_in_the_menus_language()
    {
        Assert.StartsWith("Gives you 1 hour of extra time before the disaster hits.\nBy level: +1 hour", Detail("talents", "1001", "en"));
        Assert.Contains("各等级：", Detail("talents", "1001", "zh"));
        Assert.Equal("Increases Max Satiety by 15.", Detail("plans", "30011", "en"));
        Assert.Equal("", Detail("buffs", "''", "en"));
        Assert.Equal("", Detail("buffs", "999999", "zh"));

        // Each row with the line names a kind the game data has text for.
        Assert.Equal("[]", Json("Object.keys(ROWSPEC).filter(function (k) { var i = ROWSPEC[k].info; return i && !Object.keys((GAMEX.des || {})[i] || {}).length; })"));
        Assert.Equal(7, js.Evaluate("Object.keys(ROWSPEC).filter(function (k) { return ROWSPEC[k].info; }).length").AsNumber());
    }

    [Fact]
    public void Every_row_has_its_name_and_description_in_chinese()
    {
        var missing = Json("ROWS.filter(function (r) { var d = L.shownDesc(r.d); return L.tr(r.l, 'zh') === r.l || (d && L.tr(d, 'zh') === d); }).map(function (r) { return r.key; })");

        Assert.Equal("[]", missing);
    }

    [Theory]
    [InlineData("MaxSatiety", "")]
    [InlineData("MoveSpeed_Ratio", "")]
    [InlineData("PsOpPawn / GmPawnFurniture", "")]
    [InlineData("探索自由视角", "")]
    [InlineData("Robot, action, pot.", "Robot, action, pot.")]
    [InlineData("Durability lock.", "Durability lock.")]
    [InlineData("Machine Speed does this too; the menu calls it when it is loaded.", "Machine Speed does this too; the menu calls it when it is loaded.")]
    public void Rows_hide_the_games_method_names_and_keep_plain_descriptions(string d, string expected)
    {
        Assert.Equal(expected, js.Evaluate("L.shownDesc(" + JsonSerializer.Serialize(d) + ")").AsString());
    }

    [Fact]
    public void No_row_shows_a_game_method_name()
    {
        var shown = Json("ROWS.map(function (r) { return L.shownDesc(r.d); }).filter(function (d) { return /\\b(Gm|PsOp)[A-Z]|[a-z][A-Z]\\w*_Ratio/.test(d); })");

        Assert.Equal("[]", shown);
    }

    [Theory]
    [InlineData(null, false, "en")]
    [InlineData(null, true, "zh")]
    [InlineData("{\"game\":\"en\",\"lang\":\"zh\"}", false, "zh")]
    [InlineData("{\"game\":\"en\",\"lang\":\"zh\"}", true, "zh")]
    [InlineData("{\"game\":\"zh\",\"lang\":\"en\"}", false, "en")]
    [InlineData("{\"game\":\"zh\",\"lang\":\"en\"}", true, "en")]
    [InlineData("{\"game\":\"en\",\"lang\":\"en\"}", true, "zh")]
    [InlineData("not json", true, "zh")]
    public void The_menu_starts_in_the_games_language_unless_switched_in_that_language(string? saved, bool chinese, string expected)
    {
        var got = js.Evaluate("L.startLang(" + (saved == null ? "null" : JsonSerializer.Serialize(saved)) + ", " + (chinese ? "true" : "false") + ")").AsString();

        Assert.Equal(expected, got);
    }

    [Fact]
    public void Zombie_and_wave_pickers_show_names_and_still_send_the_id()
    {
        var zombie = JsonSerializer.Deserialize<JsonElement[]>(Json("ROWSPEC['danger|Spawn zombies'].in[0].opts.find(function (o) { return o[1] === 9106; })"))!;
        var wave = JsonSerializer.Deserialize<JsonElement[]>(Json("ROWSPEC['danger|Start a wave'].in[0].opts.find(function (o) { return o[1] === 40631; })"))!;

        Assert.StartsWith("Nurse (9106", zombie[0].GetString());
        Assert.Equal("Zombie Siege (40631)", wave[0].GetString());
        Assert.Equal(40631, wave[1].GetInt32());
    }

    [Fact]
    public void All_in_a_list_sends_one_message_per_choice_and_fixed_fields_ride_along()
    {
        var sp = "ROWSPEC['progress|Unlock a survivor']";
        var count = js.Evaluate(sp + ".opts.filter(function (o) { return o[1] !== '*'; }).length").AsNumber();
        var msgs = Json("L.specMessages(" + sp + ", '*', {}).msgs");
        var all = JsonSerializer.Deserialize<JsonElement[]>(msgs)!;

        Assert.Equal(count, all.Length);
        Assert.All(all, m => Assert.False(m.GetProperty("Revoke").GetBoolean()));
        Assert.Equal(all.Length, all.Select(m => m.GetProperty("PlayerSelectId").GetInt32()).Distinct().Count());
    }

    [Fact]
    public void Each_sends_the_message_once_per_line()
    {
        var lines = js.Evaluate("ROWSPEC['debug|Neighbour line probe'].each.length").AsNumber();
        var msgs = JsonSerializer.Deserialize<JsonElement[]>(Json("L.specMessages(ROWSPEC['debug|Neighbour line probe'], undefined, {}).msgs"))!;

        Assert.True(lines > 1);
        Assert.Equal(lines, msgs.Length);
        Assert.All(msgs, m => Assert.Equal("query", m.GetProperty("Op").GetString()));
    }

    [Fact]
    public void Cheat_arguments_type_numbers_and_switches_and_leave_blanks_out()
    {
        Assert.Equal("{\"pot\":12,\"kind\":4}", Json("L.actArgs(ROWSPEC['farm|Force an anomaly'], 4, { pot: '12' })"));
        Assert.Equal("{\"kind\":1}", Json("L.actArgs(ROWSPEC['farm|Force an anomaly'], 1, { pot: '' })"));
        Assert.Equal("{\"on\":false}", Json("L.actArgs(ROWSPEC['home|Free build'], false, {})"));
        Assert.Equal("{\"hour\":22}", Json("L.actArgs(ROWSPEC['time|Skip to a time of day'], 22, {})"));
        Assert.Equal("{\"text\":\"hi\",\"kind\":\"warning\"}", Json("L.actArgs(ROWSPEC['debug|Test toast'], 'warning', { text: 'hi' })"));
        Assert.Equal("{\"of\":\"buffs\"}", Json("L.actArgs(ROWSPEC['debug|Buff list'], undefined, {})"));
    }

    [Fact]
    public void Percent_rows_send_the_ratio_the_game_adds_and_show_it_back()
    {
        Assert.Equal(0.5, js.Evaluate("L.attrValue(ROWSPEC['survivor|Move speed'], 150)").AsNumber());
        Assert.Equal(100, js.Evaluate("L.attrShown(ROWSPEC['survivor|Move speed'], 0)").AsNumber());
        Assert.Equal(1, js.Evaluate("L.attrValue(ROWSPEC['explore|Instant travel'], true)").AsNumber());
        Assert.Equal(0, js.Evaluate("L.attrValue(ROWSPEC['explore|Instant travel'], false)").AsNumber());
        Assert.Equal("{\"msg\":{\"msgHead\":" + js.Evaluate("SCHEMA.ChangeAttr.id").AsNumber() + ",\"attrKey\":\"MoveSpeed_Ratio\",\"attrValue\":0.5,\"type\":0}}", Json("L.attrMessage('MoveSpeed_Ratio', 0.5)"));
    }

    [Fact]
    public void Lists_from_the_plugin_and_the_game_become_picker_lines()
    {
        Assert.Equal("[[\"Tomato (7)\",7]]", Json("L.parseList('[[7,\"Tomato\"]]')"));
        Assert.Equal("null", Json("L.parseList('Done')"));
        Assert.Equal("{\"of\":\"saves\",\"list\":[[\"a.sav\",\"a.sav\"],[\"b.sav (playing)\",\"b.sav\"]]}", Json("L.saveList({ Items: [{ FileName: 'a.sav', IsCurrent: false }, { FileName: 'b.sav', IsCurrent: true }] })"));
        Assert.Equal("{\"of\":\"backups\",\"list\":[[\"Mine (day 3)\",\"Mine\",\"m.bak\"]]}", Json("L.saveList({ Items: [{ FileNameOnDisk: 'm.bak', BackupName: 'Mine', OriginDay: 3 }] })"));
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

    // The game's shop readout for one map with a grocery, a bed shop and a shelf, and the pawn shop.
    private const string Supply = @"{ Scenes: [{ MapPointId: 2, Name: 'Discount Mart',
  ItemShops: [{ Kind: 'Item', GroupId: 11, ShopId: 3, Name: 'Groceries', Entries: [{ Id: 1203, Name: 'Canned Beans', Price: 8 }] }],
  FurnitureShops: [{ Kind: 'Furniture', GroupId: 12, ShopId: 4, Name: 'Beds', Entries: [{ Id: 5001, Name: 'Bunk Bed', Price: 120 }] }],
  Containers: [{ GroupId: 31, Name: 'Shelf' }] }],
  Pawn: { NpcName: 'Pawnbroker', Groups: [{ Kind: 'Pawn', GroupId: 90, ShopId: 9, Name: 'Counter', Entries: [] }] } }";

    private string Labels(string list) => Json("(" + list + ").map(function (o) { return o[0]; })");

    [Fact]
    public void The_shop_readout_becomes_shop_container_and_scene_pickers()
    {
        js.Execute("var P = L.preSupply(" + Supply + ");");

        Assert.Equal("[\"Discount Mart - Groceries\",\"Discount Mart - Beds\",\"Pawnbroker - Counter\"]", Labels("P.shops"));
        Assert.Equal("[[\"Discount Mart - Shelf (31)\",31]]", Json("P.containers"));
        Assert.Equal("[[\"Discount Mart (2)\",2]]", Json("P.scenes"));
        Assert.Equal("\"No shop list\"", Json("L.preSupply({}).error"));
    }

    [Fact]
    public void Buying_from_a_picked_shop_sends_the_three_fields_the_game_finds_the_shop_by()
    {
        js.Execute("var P = L.preSupply(" + Supply + "); var groceries = P.shops[0][1];");

        Assert.Equal("[[\"Canned Beans - price 8 (1203)\",1203]]", Json("groceries.entries"));
        Assert.Equal("{\"msgHead\":200,\"Op\":\"buyitem\",\"GroupKind\":\"Item\",\"GroupId\":11,\"ShopId\":3,\"Id\":1203,\"Count\":2}",
            Json("L.specMessages(ROWSPEC['money|Buy one item'], undefined, { shop: groceries, Id: 1203, Count: '2' }).msgs[0]"));
        Assert.Equal("{\"msgHead\":200,\"Op\":\"searchcontainer\",\"GroupId\":31}",
            Json("L.specMessages(ROWSPEC['money|Search one container'], undefined, { GroupId: 31 }).msgs[0]"));
    }

    [Fact]
    public void Item_and_furniture_purchases_offer_only_shops_that_sell_that_kind_and_only_that_shops_stock()
    {
        js.Execute(@"var P = L.preSupply(" + Supply + @");
var lists = function (of) { return P[of]; }, none = function () { return null; };
function shops(key) { return ROWSPEC[key].in[0].opts(none, lists); }");

        Assert.Equal("[\"Discount Mart - Groceries\",\"Pawnbroker - Counter\"]", Labels("shops('money|Buy one item')"));
        Assert.Equal("[\"Discount Mart - Beds\"]", Labels("shops('money|Buy one piece of furniture')"));
        Assert.Equal("[\"Discount Mart - Groceries\",\"Discount Mart - Beds\",\"Pawnbroker - Counter\"]", Labels("shops('money|Buy everything in this shop')"));
        Assert.Equal("null", Json("ROWSPEC['money|Buy one item'].in[0].opts(none, none)"));
        Assert.Equal("[\"Bunk Bed - price 120 (5001)\"]", Labels("ROWSPEC['money|Buy one piece of furniture'].in[1].opts(function (f) { return f === 'shop' ? P.shops[1][1] : null; })"));
        Assert.Equal("null", Json("ROWSPEC['money|Buy one piece of furniture'].in[1].opts(none)"));
    }

    [Fact]
    public void Installing_furniture_offers_only_the_home_slots_that_take_it_and_clearing_offers_only_filled_ones()
    {
        js.Execute(@"var bed = GAMEX.furn.find(function (f) { return f[2] === 7; });
var slots = L.homeSlots({ Slots: [
  { SlotName: 'HomeBuildingPos07', RoomName: '1st Floor', SlotTypeId: 7, OccupantConfigId: 0 },
  { SlotName: 'HomeBuildingPos02', RoomName: '1st Floor', SlotTypeId: 3, OccupantConfigId: 7001, OccupantName: 'Sofa' },
  { SlotName: 'HomeBuildingPos08', RoomName: '1st Floor', SlotTypeId: 9, OccupantConfigId: 0 },
  { SlotName: 'HomeBuildingPos30', RoomName: 'Basement', SlotTypeId: 7, OccupantConfigId: 0, IsOpen: false }] });
var lists = function () { return slots; };");

        Assert.Equal("[\"HomeBuildingPos07 - 1st Floor - empty\",\"HomeBuildingPos30 - Basement - locked\"]",
            Labels("ROWSPEC['home|Install furniture in a slot'].in[0].opts(function (f) { return f === 'FurnitureConfigId' ? bed[0] : null; }, lists)"));
        Assert.Equal("[[\"HomeBuildingPos02 - 1st Floor - Sofa\",\"HomeBuildingPos02\",3,7001]]", Json("ROWSPEC['home|Clear a slot'].opts(function () { return null; }, lists)"));
        Assert.Equal("null", Json("L.homeSlots({ msgHead: 1 })"));
    }

    [Fact]
    public void Fixed_pickers_send_the_games_own_values()
    {
        Assert.Equal("[\"Bicycle - price 150 (1)\",1]", Json("ROWSPEC['money|Buy a vehicle'].in[0].opts[0]"));
        Assert.Equal("[1,2,4,8,16]", Json("ROWSPEC['debug|Simulate a cheat detection'].in[0].opts.map(function (o) { return o[1]; })"));
        Assert.Equal(102, js.Evaluate("L.specMessages(ROWSPEC['people|Send an NPC somewhere'], undefined, { NpcId: 5, TargetMapId: 102 }).msgs[0].TargetMapId").AsNumber());
        Assert.Equal(0, js.Evaluate("L.specMessages(ROWSPEC['people|Meet an NPC'], 0, {}).msgs[0].NpcConfigId").AsNumber());
    }

    [Theory]
    [InlineData("SkipMoving", "Skip moving")]
    [InlineData("TargetPosX", "Target pos x")]
    [InlineData("UseRealDeathChain", "Use real death chain")]
    [InlineData("NPCId", "Npc id")]
    public void Field_names_under_more_fields_read_as_plain_words(string field, string shown)
    {
        Assert.Equal(shown, js.Evaluate("L.humanize(" + JsonSerializer.Serialize(field) + ")").AsString());
    }

    [Fact]
    public void Each_group_goes_in_the_shorter_column_so_far_and_an_empty_group_in_neither()
    {
        Assert.Equal("[0,1,1,-1,0]", Json("L.balance([100, 50, 50, 0, 30])"));
        Assert.Equal("[0,1,0,0]", Json("L.balance([10, 300, 20, 20])"));
    }

    [Fact]
    public void A_list_box_only_says_it_is_reading_the_game_while_it_is()
    {
        // Showing a tab reads nothing, so a box whose list was never asked for must not claim to be waiting on the game.
        Assert.Equal("Type to search", js.Evaluate("L.pickHint(undefined, false, {})").AsString());
        Assert.Equal("Pick a shop first", js.Evaluate("L.pickHint(undefined, false, { wait: 'Pick a shop first' })").AsString());
        Assert.Equal("(reading the game)", js.Evaluate("L.pickHint(undefined, true, { wait: 'Pick a shop first' })").AsString());
        Assert.Equal("(none found)", js.Evaluate("L.pickHint([], false, {})").AsString());
        Assert.Equal("Any name", js.Evaluate("L.pickHint([], false, { free: true, blank: 'Any name' })").AsString());
        Assert.Equal("Type to search", js.Evaluate("L.pickHint([[1, 'A']], false, {})").AsString());
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

    [Fact]
    public void Only_the_spawn_button_wears_the_full_width_amber_bar()
    {
        // .go is the big SPAWN bar; a row's button wrapped in it showed as an empty amber bar across the row.
        var page = LogicTests.Web("page.js");
        var bars = System.Text.RegularExpressions.Regex.Matches(page, "class=\"go\"").Count;

        Assert.Equal(1, bars);
        Assert.Contains("<button class=\"go\">SPAWN</button>", page);
        Assert.Contains("<div class=\"tgo\">", page);
    }
}
