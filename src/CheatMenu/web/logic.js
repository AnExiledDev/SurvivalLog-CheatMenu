// How each menu row reaches the game: one of the game's GM switches, one GM message, a form over the fields of the
// game's own messages, or nothing yet. No page drawing here, so it can be checked on its own.
(function () {
  const SCHEMA = window.SCHEMA;
  const CATALOG = window.CATALOG || [];
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
  function message(name, values) {
    const sc = SCHEMA[name];

    if (!sc) return { error: 'The game has no command ' + name };

    const msg = { msgHead: sc.id };
    const bad = [];

    sc.f.forEach(([type, field]) => {
      if (!values || !has(values, field)) return;

      const v = coerce(type, values[field]);

      if (v === undefined) bad.push(field); else msg[field] = v;
    });

    return bad.length ? { error: 'Check ' + bad.join(', ') } : { msg };
  }

  // How a row reaches the game.
  //   flag: one of WebGm's switches, set to the row's toggle
  //   cmd:  one message; field is the one value the row's control supplies, or null for none
  //   form: the row's game commands need more than its control holds, so each gets its fields shown
  //   none: why is 'mod' (added by this mod, not built yet), 'inactive' (does nothing in the release game) or 'code'
  //         (it calls game code the GM message handler does not reach)
  function bind(r) {
    if (r.s === 'M') return { kind: 'none', why: 'mod' };
    if (r.s === 'E' || r.s === 'X') return { kind: 'none', why: 'inactive' };

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

  window.__slcheatmenuLogic = { FLAGS, flagOf, coerce, message, bind, rowMessage, readName, vitals, currentSave, describe };
})();
