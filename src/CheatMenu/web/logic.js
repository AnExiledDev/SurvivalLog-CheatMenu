// How each menu row reaches the game: one of the game's GM switches, one GM message, a row spec (rows.js) that builds
// game messages or the mod's own cheats from the row's controls, or nothing. No page drawing here, so it can be
// checked on its own.
(function () {
  const SCHEMA = window.SCHEMA;
  const CATALOG = window.CATALOG || [];
  const SPEC = window.ROWSPEC || {};
  const FLAGS = ['SkipTimeline', 'SkipOpeningTimeline', 'SkipDailySettlement', 'LockCharacterAttr', 'LockFurnitureDurability', 'LockExploreExposure', 'RightClickCopyFurnitureId', 'RaiseExploreCamera', 'PhotoModeUnlocked', 'ExploreFreeCamera', 'PauseRenderFreezeOff', 'ShowZombieDebugText', 'ShowEnvDebug', 'ShowAudioSourceViz', 'ShowShadowDebug', 'ReviveOnDoorBreak', 'SpeedHotkeyEnabled', 'ForceDanceRecommend', 'EventVerifyLog'];
  const WHOLE = ['int', 'long', 'short', 'byte', 'uint', 'ulong'];
  const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);

  // The game names its GM commands after the switch they flip, sometimes with a Gm in front.
  function flagOf(ref) {
    const name = String(ref).replace(/^Gm/, '');

    return FLAGS.indexOf(name) >= 0 ? name : null;
  }

  const commandsOf = (refs) => (refs || []).filter((k) => has(SCHEMA, k));

  // A typed value for one field of a game message, or undefined when the text can't be one.
  function coerce(type, raw) {
    const text = raw == null ? '' : String(raw).trim();

    if (type === 'bool') return raw === true || ['true', '1', 'on', 'yes'].indexOf(text.toLowerCase()) >= 0;
    if (type === 'string') return raw == null ? '' : String(raw);
    if (type === 'List<int>') return text === '' ? [] : text.split(/[\s,]+/).map(Number).every(Number.isInteger) ? text.split(/[\s,]+/).map(Number) : undefined;
    if (type === 'List<string>') return text === '' ? [] : text.split(',').map((s) => s.trim());
    if (type.indexOf('List<') === 0) { try { const v = JSON.parse(text || '[]'); return Array.isArray(v) ? v : undefined; } catch (e) { return undefined; } }
    if (text === '') return undefined;

    const n = Number(text.replace(/^x/i, '').replace(/x$/i, ''));

    if (!isFinite(n)) return undefined;

    return WHOLE.indexOf(type) >= 0 ? (Number.isInteger(n) ? n : undefined) : n;
  }

  // One game message from field values typed in the menu. Fields left out are left out of the message, as the game's
  // own panel does; the game then uses its default for them.
  // raw names fields the game's handler reads that its message type does not declare, with their types.
  function message(name, values, raw) {
    const sc = SCHEMA[name];

    if (!sc) return { error: 'The game has no command ' + name };

    const msg = { msgHead: sc.id };
    const bad = [];
    const one = (type, field) => {
      if (!values || !has(values, field)) return;

      const v = coerce(type, values[field]);

      if (v === undefined) bad.push(field); else msg[field] = v;
    };

    sc.f.forEach(([type, field]) => one(type, field));
    Object.keys(raw || {}).forEach((field) => { if (!sc.f.some((f) => f[1] === field)) one(raw[field], field); });

    return bad.length ? { error: 'Check ' + bad.join(', ') } : { msg };
  }

  // How a row reaches the game.
  //   flag: one of WebGm's switches, set to the row's toggle
  //   cmd:  one message; field is the one value the row's control supplies, or null for none
  //   form: the row's game commands need more than its control holds, so each gets its fields shown
  //   spec: rows.js says what the row sends
  //   none: why is 'inactive' (does nothing in the release game), 'mod' or 'code' (a row with nothing to send, which
  //         the tests keep from ever shipping)
  function bind(r) {
    if (SPEC[r.key]) return { kind: 'spec', spec: SPEC[r.key] };
    if (r.s === 'E' || r.s === 'X') return { kind: 'none', why: 'inactive' };
    if (r.s === 'M') return { kind: 'none', why: 'mod' };

    const refs = r.ref || [];

    if (r.k === 'tog') {
      const flag = refs.map(flagOf).find(Boolean);

      if (flag) return { kind: 'flag', flag };
    }

    const cmds = commandsOf(refs);

    if (cmds.length === 1) {
      const name = cmds[0];
      const f = SCHEMA[name].f;
      const one = f.length === 1 ? f[0] : null;

      if (f.length === 0 && (r.k === 'btn' || r.k === 'tog')) return { kind: 'cmd', name, field: null };
      if (one && r.k === 'tog' && one[0] === 'bool') return { kind: 'cmd', name, field: one[1] };
      if (one && r.k === 'num' && one[0] !== 'bool' && one[0] !== 'string' && one[0].indexOf('List<') !== 0) return { kind: 'cmd', name, field: one[1] };
      if (one && r.k === 'sel' && one[0] !== 'bool' && (r.o || []).every((o) => coerce(one[0], o) !== undefined)) return { kind: 'cmd', name, field: one[1] };
    }

    if (cmds.length) return { kind: 'form', cmds };

    return { kind: 'none', why: 'code' };
  }

  // The message a bound row sends for the control's current value.
  function rowMessage(b, value) {
    return message(b.name, b.field ? { [b.field]: value } : {});
  }

  // The control a spec row shows: a switch, a list, a box to type in, or a button.
  function control(r, sp) {
    if (sp.k) return sp.k;
    if (r.k === 'tog') return 'tog';
    if (sp.opts || sp.live) return 'sel';

    return sp.main || sp.attr ? 'num' : 'btn';
  }

  // The field sets a spec row sends. main is the row control's value: a field value, an option's object (merged in),
  // or '*' for every option. inputs are the row's other fields by name; blank ones are left out.
  function specValues(sp, main, inputs) {
    const base = Object.assign({}, sp.fix || {});

    Object.keys(inputs || {}).forEach((f) => { const v = inputs[f]; if (v !== '' && v != null) base[f] = v; });

    const withMain = (v) => {
      const set = Object.assign({}, base);

      if (v && typeof v === 'object') Object.assign(set, v);
      else if (sp.main && v !== undefined && v !== null && v !== '') set[sp.main] = v;

      return set;
    };
    let sets = main === '*' ? (sp.opts || []).filter((o) => o[1] !== '*').map((o) => withMain(o[1])) : [withMain(main)];

    if (sp.each) sets = sets.flatMap((set) => sp.each.map((e) => Object.assign({}, set, e)));

    return sets;
  }

  // The game messages a cmd spec row sends, in order, or an error naming the fields to check.
  function specMessages(sp, main, inputs) {
    const msgs = [];

    for (const set of specValues(sp, main, inputs)) {
      const m = message(sp.cmd, set, sp.raw);

      if (m.error) return { error: m.error };
      msgs.push(m.msg);
    }
    (sp.also || []).forEach((name) => msgs.push({ msgHead: SCHEMA[name].id }));

    return { msgs };
  }

  // The arguments of one of the mod's own cheats: numbers and switches typed, everything else as text.
  function actArgs(sp, main, inputs) {
    const out = {};
    const set = specValues(Object.assign({}, sp, { each: null }), main, inputs)[0];

    Object.keys(set).forEach((k) => {
      const v = set[k];
      const t = String(v).trim();

      out[k] = typeof v !== 'string' ? v : /^-?\d+(\.\d+)?$/.test(t) ? Number(t) : t === 'true' || t === 'false' ? t === 'true' : v;
    });

    return out;
  }

  // The value an attribute row sends for what the menu shows: a percent row shows 100% for "as the game has it"
  // and sends the ratio the game adds on top (150% sends 0.5); a switch row sends its on or off value.
  function attrValue(sp, shown) {
    if (sp.on !== undefined) return shown ? sp.on : sp.off;

    const n = Number(shown);

    if (!isFinite(n)) return undefined;

    return sp.pct === undefined ? n : (n - sp.pct) / 100;
  }

  // What an attribute row shows for the value the game holds.
  function attrShown(sp, value) {
    if (sp.on !== undefined) return value === sp.on;

    return sp.pct === undefined ? value : Math.round(value * 100 + sp.pct);
  }

  const attrMessage = (key, value) => message('ChangeAttr', { attrKey: key, attrValue: value, type: 0 });

  // [label, value] lines from a list the plugin read ("[[id, label], ...]"), or null when it is not one.
  function parseList(text) {
    let v;

    try { v = JSON.parse(text); } catch (e) { return null; }

    return Array.isArray(v) ? v.filter(Array.isArray).map((x) => [`${x[1]} (${x[0]})`, x[0]]) : null;
  }

  // The saves or backups in a save-list readout, as [label, value, file on disk], or null.
  function saveList(msg) {
    if (!msg || !Array.isArray(msg.Items)) return null;
    if (msg.Items.some((i) => i && 'FileNameOnDisk' in i)) return { of: 'backups', list: msg.Items.filter(Boolean).map((i) => [`${i.BackupName}${i.OriginDay ? ' (day ' + i.OriginDay + ')' : ''}${i.CreatedAt ? ' - ' + i.CreatedAt : ''}`, i.BackupName, i.FileNameOnDisk]) };
    if (msg.Items.some((i) => i && 'FileName' in i)) return { of: 'saves', list: msg.Items.filter(Boolean).map((i) => [i.FileName + (i.IsCurrent ? ' (playing)' : ''), i.FileName]) };

    return null;
  }

  // ---------- what the game sends back ----------
  const READ = {};

  CATALOG.forEach((c) => { if (c.kind === 'read') READ[c.id] = c.key.replace(/^C2S_/, ''); });

  const readName = (msg) => READ[msg && msg.msgHead] || ('message ' + (msg && msg.msgHead));

  const STATS = ['Satiety', 'Morale', 'Stamina', 'Health', 'Vitality'];

  // The five bars from the game's attribute readout, or null when the message is not one.
  function vitals(msg) {
    if (!msg || !Array.isArray(msg.attrs)) return null;

    const at = {};

    msg.attrs.forEach((a) => { if (a && a.key != null) at[a.key] = a; });

    const val = (a) => a ? (typeof a.baseTotal === 'number' ? a.baseTotal : a.baseValue) : null;
    const out = STATS.filter((k) => at[k]).map((k) => ({ k, v: val(at[k]), max: val(at['Max' + k]) }));

    return out.length ? out : null;
  }

  // The file name of the save being played, from the game's save list, or null.
  function currentSave(msg) {
    if (!msg || !Array.isArray(msg.Items)) return null;

    const cur = msg.Items.find((i) => i && i.IsCurrent);

    return cur ? cur.FileName : null;
  }

  // A short line for the log: the readout's name and its text fields.
  function describe(msg) {
    if (msg && Array.isArray(msg.msgs)) return msg.msgs.map((m) => typeof m === 'string' ? m : Object.keys(m || {}).map((k) => m[k]).filter((v) => typeof v === 'string').join(' ')).join(' | ');

    const text = Object.keys(msg || {}).filter((k) => k !== 'msgHead' && ['string', 'number', 'boolean'].indexOf(typeof msg[k]) >= 0).map((k) => k + ' ' + msg[k]).join(', ');

    return readName(msg) + (text ? ': ' + text : '');
  }

  // The menu shows one language. English drops the game's Chinese names written in brackets; Chinese looks each
  // piece of text up in the menu's own table (zh.js), then the game's (gamedata.js). "Name (id ...)" keeps its
  // bracket and translates the name. Text with no entry stays as it is.
  const HAN = /[\u4e00-\u9fff]/;
  const ZH_BRACKET = / ?[(\uff08][^()\uff08\uff09]*[\u4e00-\u9fff][^()\uff08\uff09]*[)\uff09]/g;

  function zhOf(s) {
    const own = window.ZH || {};
    const game = window.GAMEZH || {};

    if (has(own, s)) return own[s];
    if (has(game, s)) return game[s];

    const m = s.match(/^(.+?) \((.*)\)$/);

    const known = (x) => zhOf(x) !== x;

    if (m && known(m[1])) return zhOf(m[1]) + ' (' + m[2].replace(/\bhp\b/, '\u751f\u547d').replace(/\battack\b/, '\u653b\u51fb') + ')';
    // "Tab > Row" is two names; "Panel command 12" is a name and a number; "5 Ending line 1" is a number first.
    if (s.indexOf(' > ') > 0) return s.split(' > ').map(zhOf).join(' > ');

    const n = s.match(/^(.+) (\d+)$/);

    if (n && known(n[1])) return zhOf(n[1]) + ' ' + n[2];

    const lead = s.match(/^(\d+) (.+)$/);

    if (lead && known(lead[2])) return lead[1] + ' ' + zhOf(lead[2]);

    return s;
  }

  function tr(s, lang) {
    if (typeof s !== 'string' || !s.trim()) return s;
    if (lang !== 'zh') return HAN.test(s) ? s.replace(ZH_BRACKET, '') : s;

    const core = s.trim();
    const at = s.indexOf(core);
    let out = zhOf(core);

    // The table is keyed by the English as shown, without the game's Chinese name in brackets.
    if (out === core && HAN.test(core)) {
      const en = core.replace(ZH_BRACKET, '');
      const z = zhOf(en);

      if (z !== en) out = z;
    }

    return s.slice(0, at) + out + s.slice(at + core.length);
  }

  // The game's language, unless the player switched while the game was in the language it is in now.
  function startLang(saved, chinese) {
    const game = chinese ? 'zh' : 'en';
    let s = null;

    try { s = JSON.parse(saved || 'null'); } catch (e) { s = null; }

    return s && s.game === game && (s.lang === 'zh' || s.lang === 'en') ? s.lang : game;
  }

  window.__slcheatmenuLogic = { tr, startLang, FLAGS, flagOf, coerce, message, bind, rowMessage, control, specValues, specMessages, actArgs, attrValue, attrShown, attrMessage, parseList, saveList, readName, vitals, currentSave, describe };
})();
