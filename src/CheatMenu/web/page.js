// The Cheat Menu panel, drawn over the game's web UI in its own shadow root so the game's styles and ids never meet
// ours. Every action goes to the plugin: a GM message the game's own handler runs, or one of the mod's own cheats
// (an action or a hold) the plugin runs through the game's own methods. Nothing here changes the game by itself.
(function () {
  if (window.__slcheatmenu) return;

  const PREFIX = 'slmod|cheatmenu|';
  const L = window.__slcheatmenuLogic;
  const S = window.SCHEMA;
  const TABS = window.TABS;
  const GAME = window.GAME;
  const CATALOG = window.CATALOG;
  const REFS = window.REFS;
  const KIND = { cmd: 'Panel command', read: 'Readout', sub: 'Panel sub-command', gm: 'Gm method', hook: 'GM hook' };
  const CHIP = { G: '<span class="c gm">GAME</span>', M: '<span class="c add">ADDED BY MOD</span>', E: '<span class="c ed">EDITOR</span>', S: '<span class="c steam">STEAM</span>', X: '<span class="c nw">NOT WIRED</span>' };
  const send = (m) => { try { if (window.vuplex) window.vuplex.postMessage(PREFIX + m); } catch (e) { /* the bridge is gone; the plugin reinstalls us */ } };

  // The game's own Chinese font, from its web UI folder; the panel falls back to Windows fonts without it.
  const fonts = document.createElement('style');
  const at = location.href.indexOf('/WebUI/');
  const res = (at >= 0 ? location.href.slice(0, at + 7) : '../../') + 'Res/GameResult/';

  fonts.textContent = `@font-face{font-family:"SL Cheat Sans";src:url("${res}SourceHanSansSC-Regular-2.otf");font-weight:400 600}@font-face{font-family:"SL Cheat Sans";src:url("${res}SourceHanSansSC-Heavy-2.otf");font-weight:700 900}`;
  (document.head || document.documentElement).appendChild(fonts);

  const host = document.createElement('div');

  host.id = 'slcheatmenu-host';
  host.style.cssText = 'position:fixed;left:0;top:0;right:0;bottom:0;z-index:2147483000;display:none;';

  const root = host.attachShadow({ mode: 'open' });
  const $ = (s, el) => (el || root).querySelector(s);
  const $$ = (s, el) => Array.from((el || root).querySelectorAll(s));
  const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstChild; };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const EXTRA = `
:host { all: initial; color: var(--steel); font-family: var(--ui); }
.c.nb { color: var(--steel-3); border: 1px dashed var(--steel-3); }
.c.nr { color: #ffb08f; border: 1px dashed rgba(255,176,143,.6); }
.row.off .btn, .row.off .sw, .row.off .num, .row.off .sel { opacity: .35; pointer-events: none; }
.row.formrow { grid-template-columns: 1fr; }
.gmform { margin-top: 6px; padding: 8px 10px; border: 1px solid var(--line-2); background: rgba(0,0,0,.22); }
.gmform header { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; font: 11px var(--mono); color: var(--amber-d); }
.gmform header .btn { margin-left: auto; }
.gmform .fl { display: flex; flex-wrap: wrap; gap: 6px 12px; }
.gmform label { display: flex; align-items: center; gap: 6px; font: 11.5px var(--mono); color: var(--steel-2); }
.gmform label i { font-style: normal; color: var(--steel-3); }
.gmform .num { width: 110px; }
.gmform .none { font: 11.5px var(--ui); color: var(--steel-3); }
.irow .run { margin-left: 8px; font: 11px var(--mono); color: var(--amber); cursor: pointer; text-decoration: underline; }
.irow + .gmform { margin: 0 14px 8px; }
.statusbox { padding: 16px 18px 12px; border-bottom: 1px solid var(--line-2); font: 12px var(--mono); color: var(--steel-3); line-height: 1.6; }
.statusbox b { color: var(--steel); }
.statusbox .bad { color: #ffb08f; }
.wait { padding: 10px 14px; font-size: 12px; color: var(--steel-3); }
.row.specrow { grid-template-columns: 1fr auto; }
.row .fields { margin-top: 6px; }
.row .fields .fl { display: flex; flex-wrap: wrap; gap: 6px 12px; }
.row .fields label { display: flex; align-items: center; gap: 6px; font: 11.5px var(--mono); color: var(--steel-2); }
.row .fields .num { width: 110px; }
.row .fields .sel { max-width: 260px; }
.row details.more { margin-top: 6px; }
.row details.more summary { cursor: pointer; font: 11px var(--mono); color: var(--steel-3); }
.row details.more .fl { margin-top: 6px; }
.pick { display: inline-flex; align-items: center; gap: 4px; }
.pick .filt { width: 90px; }
.ctl .pick .sel { max-width: 230px; }
`;

  const css = (window.__slcheatmenuCss || '').replace(/:root/g, ':host').replace(/html, body \{[^}]*\}/, '') + EXTRA;

  root.innerHTML = `<style>${css}</style>
<div id="stage">
  <div id="veil"></div>
  <section id="cm" aria-label="Cheat Menu">
    <header id="top">
      <div class="brand"><div class="mark">CHEAT<span>/</span>MENU</div><div class="sub"><span class="zh">作弊与开发者菜单</span> - v0.2.1 - game 1.1.19611</div></div>
      <label class="search"><svg viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21"/></svg><input id="q" placeholder="Find any cheat or tool..." autocomplete="off"><kbd>Ctrl K</kbd></label>
      <div class="lamp" title="The game reports cheat evidence to its developer"><i></i><div><b>Telemetry on</b><span>the game reports cheat use</span></div></div>
      <button class="x" id="close" title="Close"><span id="keyname"></span> <span>X</span></button>
    </header>
    <nav id="rail"></nav>
    <main id="main"><div id="tabhead"></div><div id="body"></div></main>
    <aside id="live">
      <div class="statusbox" id="status"></div>
      <div class="vitals" id="vitals"></div>
      <div class="loghead"><span>Game log</span><button id="clearlog">clear</button></div>
      <ol id="log"></ol>
    </aside>
    <footer id="console">
      <span class="prompt">gm&gt;</span>
      <input id="cmd" placeholder="AddItem ItemConfigId=1203 Count=20 - {&quot;msgHead&quot;:52,&quot;Scale&quot;:4} - help" autocomplete="off">
      <span class="hint">Enter to run - Up history</span>
    </footer>
  </section>
</div>`;

  // Clicks, wheels and keys stay in the panel, so the game under it never reacts to them.
  ['mousedown', 'mouseup', 'pointerdown', 'pointerup', 'click', 'wheel', 'keydown', 'keyup'].forEach((t) => host.addEventListener(t, (e) => e.stopPropagation()));

  const ITEM_CATS = { 1: 'Food', 2: 'Medicine', 3: 'Books', 5: 'Leisure', 6: 'Tools', 9: 'Materials', 10: 'Seeds', 11: 'Fertilizer', 12: 'Traps', 13: 'Fuel', 14: 'Packages', 15: 'Flowers', 16: 'Weapons & bait', 17: 'Robot modules', 18: 'Story items', 19: 'Decor', 20: 'Records', 21: 'Renovation', 22: 'Keys' };
  const COLORS = { Satiety: '#c9a14a', Morale: '#d36aa0', Stamina: '#e2b23a', Health: '#d9534f', Vitality: '#7fbf6a' };
  const ZH = { Satiety: '饱食', Morale: '心情', Stamina: '体力', Health: '生命', Vitality: '活力' };

  const state = {
    tab: 'quick',
    open: false,
    inGame: false,
    key: 'F3',
    flags: {},
    holds: {},
    toggles: {},
    lists: {},
    attrs: {},
    attrSet: {},
    lastRead: {},
    saveFile: null,
    riskyBackup: true,
    weather: null,
    vitals: [],
    cat: 1,
    item: null,
    count: 10,
    history: [],
    hpos: -1,
    filter: 'all',
    journal: [],
    backedUp: null,
    presets: [],
    started: false
  };

  // Fold in the rows the coverage check added, the tag fixes, each row's game tools, and how it reaches the game.
  (function merge() {
    window.ADD.forEach((a) => {
      const t = TABS.find((x) => x.id === a.tab);
      let g = t.groups.find((x) => x.t === a.group);

      if (!g) { g = { t: a.group, zh: a.zh || '', rows: [], note: a.note, warn: a.warn }; t.groups.push(g); }
      g.rows.push(Object.assign({ b: 'Run', v: 0, u: '' }, a.row));
    });
    TABS.forEach((t) => {
      t.customRef = REFS[t.id + '|#' + t.custom] || [];
      t.groups.forEach((g) => g.rows.forEach((r) => {
        const key = t.id + '|' + r.l;

        Object.assign(r, window.RETAG[key] || {});
        r.key = key;
        r.tab = t.id;
        r.ref = REFS[key] || [];
        r.bind = L.bind(r);
        if (r.bind.kind === 'spec') {
          if (r.bind.spec.d) r.d = r.bind.spec.d;
          if (r.bind.spec.u) r.u = r.bind.spec.u;
        }
        if (r.k === 'sel') r.cur = r.cur || ['x1', 'Normal'].find((o) => r.o.includes(o)) || r.o[0];
      }));
    });
  })();
  const ALLROWS = TABS.flatMap((t) => t.groups.flatMap((g) => g.rows));
  const ROW = new Map(ALLROWS.map((r) => [r.key, r]));
  const FLAG_LABEL = {};

  ALLROWS.forEach((r) => { if (r.bind.kind === 'flag' && !FLAG_LABEL[r.bind.flag]) FLAG_LABEL[r.bind.flag] = r; });

  // ---------- log ----------
  function log(msg, kind) {
    const t = new Date().toTimeString().slice(0, 8);
    const tag = kind === 'mod' ? '[MOD]' : kind === 'err' ? '[ERR]' : '[GM]';
    const list = $('#log');

    list.prepend(h(`<li class="${kind || ''}"><time>${t}</time><span class="tg">${tag}</span> ${esc(msg)}</li>`));
    while (list.children.length > 120) list.lastChild.remove();
  }

  // ---------- talking to the game ----------
  let nextId = 1;
  const pending = {};

  // Sends one GM message. onFail runs if the plugin reports the game refused it.
  function post(msg, label, onFail) {
    const id = String(nextId++);

    pending[id] = { label, onFail };
    send('gm|' + id + '|' + JSON.stringify(msg));

    return id;
  }

  // The container preview comes back as instance|config|searched|itemxcount,... lines; this names the items.
  let itemNames = null;

  function containerText(text) {
    if (!itemNames) itemNames = new Map(GAME.items.map((i) => [i.id, i.n]));

    const lines = String(text || '').split('\n').filter(Boolean).map((line) => {
      const [inst, cfg, searched, items] = line.split('|');
      const what = (items || '').split(',').filter(Boolean).map((x) => {
        const [id, count] = x.split('x');

        return `${itemNames.get(Number(id)) || '#' + id} x ${count || 1}`;
      });

      return `#${inst} (${itemNames.get(Number(cfg)) || 'furniture ' + cfg}, ${searched === '1' ? 'searched' : 'not searched'}): ${what.join(', ') || 'empty'}`;
    });

    return lines.length ? `${lines.length} containers\n` + lines.join('\n') : 'no containers';
  }

  const FORMAT = { containers: containerText };

  // Runs one of the mod's own cheats. onText gets what the plugin hands back (and the error, if any) instead of the log.
  function act(name, args, label, onText) {
    const id = String(nextId++);

    pending[id] = { label, onText: onText || (FORMAT[name] && ((text, error) => error ? log(`${label}: ${error}`, 'err') : log(`${label}: ${FORMAT[name](text)}`, 'mod'))) };
    send('act|' + id + '|' + name + '|' + JSON.stringify(args || {}));

    return id;
  }

  // The first change of a session waits for a backup of the save being played, so it can always be undone.
  const backup = { step: 'none', queue: [], name: null, timer: null };

  function cheat(fn) {
    if (backup.step === 'done' || backup.step === 'failed' || !state.inGame) return fn();

    backup.queue.push(fn);
    if (backup.step !== 'none') return;

    backup.step = 'listing';
    post({ msgHead: S.ListGameSaves.id }, null);
    backup.timer = setTimeout(() => finishBackup(false, 'the game did not answer'), 5000);
  }

  function finishBackup(ok, why) {
    if (backup.step === 'done' || backup.step === 'failed') return;

    clearTimeout(backup.timer);
    backup.step = ok ? 'done' : 'failed';
    if (ok) {
      state.backedUp = backup.name;
      log(`First cheat this session: saved a backup "${backup.name}" first (BackupSave)`, 'mod');
    } else {
      log('Could not back up the save before the first cheat (' + why + '). Cheats still work; "Load backup" will have nothing to load.', 'err');
    }
    backup.queue.splice(0).forEach((fn) => fn());
    if (state.tab === 'changes') refresh();
  }

  // With "Back up before every risky cheat" on, a red row waits for a fresh backup of the save being played, and
  // does not run without one.
  const risky = { wait: null };

  function guarded(fn, isRisky) {
    if (!isRisky || !state.riskyBackup || !state.inGame) return cheat(fn);

    const first = backup.step !== 'done';

    cheat(() => {
      if (first && backup.step === 'done') return fn();
      if (!state.saveFile) return log('Not run: the menu could not tell which save to back up first. Turn off "Back up before every risky cheat" in Saves to run it without a backup.', 'err');
      if (risky.wait) return log('Not run: still waiting for the last backup.', 'err');

      const name = stamp('BeforeRisky');

      risky.wait = { name, fn, timer: setTimeout(() => doneRisky(false, 'the game did not answer'), 8000) };
      post({ msgHead: S.BackupSave.id, FileName: state.saveFile, BackupName: name }, 'Backup before a risky cheat', () => doneRisky(false, 'the game refused it'));
    });
  }

  function doneRisky(ok, why) {
    const w = risky.wait;

    if (!w) return;

    risky.wait = null;
    clearTimeout(w.timer);
    if (!ok) return log(`Not run: the backup before it failed (${why}). Turn off "Back up before every risky cheat" in Saves to run it without one.`, 'err');

    log(`Backed up the save as "${w.name}" first`, 'mod');
    w.fn();
  }

  function stamp(prefix) {
    const d = new Date();
    const p = (n) => String(n).padStart(2, '0');

    return `${prefix}_${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
  }

  function onBackupReadouts(msg) {
    const saves = L.saveList(msg);

    if (backup.step === 'listing' && saves && saves.of === 'saves') {
      const file = L.currentSave(msg);

      if (!file) return finishBackup(false, 'no save is marked as the one being played');

      backup.name = stamp('BeforeCheating');
      backup.step = 'saving';
      post({ msgHead: S.BackupSave.id, FileName: file, BackupName: backup.name }, null);
    } else if (backup.step === 'saving' && typeof msg.Ok === 'boolean' && 'BackupName' in msg) {
      if (msg.BackupName) backup.name = msg.BackupName;
      finishBackup(msg.Ok, msg.Reason || 'the game said no');
    } else if (risky.wait && typeof msg.Ok === 'boolean' && 'BackupName' in msg) {
      doneRisky(msg.Ok, msg.Reason || 'the game said no');
    }
  }

  // ---------- settings: what stays until changed, so it can be undone and kept in a preset ----------
  const flagSetting = (name) => {
    const r = FLAG_LABEL[name];

    return { key: 'flag:' + name, l: r ? r.l : name, s: 'G', tab: r ? r.tab : 'debug', get: () => !!state.flags[name], set: (x) => setFlag(name, x), show: (x) => x ? 'on' : 'off' };
  };

  function setFlag(name, on) {
    state.flags[name] = !!on;
    send('flag|' + name + '|' + (on ? '1' : '0'));
  }

  // A toggle row that is one game message: a plain one flips the game's own switch each time it is sent, a bool one
  // says on or off.
  function toggleSetting(r) {
    return {
      key: 'row:' + r.key,
      l: r.l,
      s: r.s,
      tab: r.tab,
      get: () => !!state.toggles[r.key],
      set: (x) => {
        if (!!state.toggles[r.key] === !!x) return;

        const m = L.rowMessage(r.bind, !!x);

        state.toggles[r.key] = !!x;
        if (m.msg) post(m.msg, r.l, () => { state.toggles[r.key] = !x; refresh(); });
      },
      show: (x) => x ? 'on' : 'off'
    };
  }

  const weatherSetting = {
    key: 'weather',
    l: 'Weather',
    s: 'G',
    tab: 'time',
    get: () => state.weather,
    set: (x) => {
      state.weather = x;
      post(x === null ? { msgHead: S.ResetWeather.id } : { msgHead: S.SetWeather.id, WeatherConfigId: x }, 'Weather');
    },
    show: (x) => x === null ? 'forecast' : ((GAME.weather.find((w) => w.id === x) || {}).n || 'weather ' + x)
  };

  const onOff = (x) => x ? 'on' : 'off';

  // One of the mod's holds: the plugin keeps it true while it is on.
  function holdSetting(r) {
    const name = r.bind.spec.hold;

    return { key: 'hold:' + name, l: r.l, s: r.s, tab: r.tab, get: () => !!state.holds[name], set: (x) => { state.holds[name] = !!x; send('hold|' + name + '|' + (x ? '1' : '0')); }, show: onOff };
  }

  // A switch row from rows.js: a game message (its field set to on or off, or sent again to flip the game's own
  // switch) or one of the mod's actions told on or off.
  function specToggleSetting(r) {
    const sp = r.bind.spec;

    return {
      key: 'row:' + r.key,
      l: r.l,
      s: r.s,
      tab: r.tab,
      get: () => !!state.toggles[r.key],
      set: (x) => {
        if (!!state.toggles[r.key] === !!x) return;

        const back = () => { state.toggles[r.key] = !x; refresh(); };

        state.toggles[r.key] = !!x;
        if (sp.act) return act(sp.act, L.actArgs(sp, !!x, specInputs(r)), r.l, (text, error) => error ? (log(`${r.l}: ${error}`, 'err'), back()) : text && log(`${r.l}: ${text}`, 'mod'));

        const m = L.specMessages(sp, sp.opts && sp.opts.length === 2 ? sp.opts[x ? 0 : 1][1] : !!x, specInputs(r));

        if (m.error) return log(`${r.l}: ${m.error}`, 'err');
        m.msgs.forEach((msg) => post(msg, r.l, back));
      },
      show: onOff
    };
  }

  // An attribute of the survivor, set with the game's own ChangeAttr. Ratios start at the game's 0, so "as before"
  // is known; a maximum is known once the game has sent the survivor's attributes.
  function attrSetting(r) {
    const sp = r.bind.spec;
    const key = 'attr:' + r.key;
    const ratio = sp.on !== undefined || sp.pct !== undefined || /Ratio$|Bonus$/.test(sp.attr);

    return {
      key,
      l: r.l,
      s: r.s,
      tab: r.tab,
      get: () => key in state.attrSet ? state.attrSet[key] : ratio ? L.attrShown(sp, 0) : state.attrs[sp.attr] === undefined ? null : state.attrs[sp.attr],
      set: (x) => {
        if (x === null || x === undefined) return;

        const m = L.attrMessage(sp.attr, L.attrValue(sp, x));

        if (m.error) return log(`${r.l}: ${m.error}`, 'err');
        state.attrSet[key] = x;
        post(m.msg, r.l, () => { delete state.attrSet[key]; refresh(); });
      },
      show: (x) => x === null || x === undefined ? 'as the game had it' : sp.on !== undefined ? onOff(x) : sp.pct !== undefined ? x + '%' : String(x)
    };
  }

  // A list row that sets several attributes to one value.
  function attrsSetting(r) {
    const sp = r.bind.spec;
    const key = 'attrs:' + r.key;

    return {
      key,
      l: r.l,
      s: r.s,
      tab: r.tab,
      get: () => key in state.attrSet ? state.attrSet[key] : sp.opts[0][1],
      set: (x) => {
        state.attrSet[key] = x;
        sp.attrs.forEach((a) => { const m = L.attrMessage(a, x); if (m.msg) post(m.msg, r.l); });
      },
      show: (x) => (sp.opts.find((o) => o[1] === x) || [String(x)])[0]
    };
  }

  function setting(key) {
    if (key === 'weather') return weatherSetting;
    if (key.indexOf('flag:') === 0) return L.FLAGS.indexOf(key.slice(5)) >= 0 ? flagSetting(key.slice(5)) : null;
    if (key.indexOf('hold:') === 0) {
      const r = ALLROWS.find((x) => rowSettingKey(x) === key);

      return r ? holdSetting(r) : null;
    }

    const r = ROW.get(key.slice(key.indexOf(':') + 1));

    if (!r || rowSettingKey(r) !== key) return null;
    if (key.indexOf('attr:') === 0) return attrSetting(r);
    if (key.indexOf('attrs:') === 0) return attrsSetting(r);

    return r.bind.kind === 'spec' ? specToggleSetting(r) : toggleSetting(r);
  }

  function rowSettingKey(r) {
    const b = r.bind;

    if (b.kind === 'flag') return 'flag:' + b.flag;
    if (b.kind === 'spec') {
      const sp = b.spec;

      if (sp.hold) return 'hold:' + sp.hold;
      if (sp.attr) return 'attr:' + r.key;
      if (sp.attrs) return 'attrs:' + r.key;
      if (sp.page || sp.pulse || sp.readout) return null;

      return L.control(r, sp) === 'tog' ? 'row:' + r.key : null;
    }

    return r.k === 'tog' && b.kind === 'cmd' ? 'row:' + r.key : null;
  }

  const allSettingKeys = () => [...new Set([...L.FLAGS.filter((f) => f in state.flags).map((f) => 'flag:' + f), ...ALLROWS.map(rowSettingKey).filter((k) => k && k.indexOf('flag:') !== 0), 'weather'])];
  const BASE = new Map();

  // ---------- rail ----------
  // The rail is built once; later calls only update the counts.
  function renderRail() {
    const rail = $('#rail');

    if (rail.children.length) return paintRailCounts();

    TABS.forEach((t, i) => {
      if (t.id === 'saves' || t.id === 'changes') rail.append(h('<div class="railsep"></div>'));

      const key = i < 10 ? (i + 1) % 10 : '';
      const count = countTools(t);
      const b = h(`<button class="tab${t.danger ? ' danger' : ''}${t.id === state.tab ? ' on' : ''}" data-tab="${t.id}"><span class="k">${key}</span><svg viewBox="0 0 24 24">${window.TAB_ICONS[t.id]}</svg><span class="t">${t.name}<small>${t.zh}</small></span><span class="n">${count || ''}</span></button>`);

      b.onclick = () => openTab(t.id);
      rail.append(b);
    });
  }

  function paintRailCounts() {
    $$('.tab').forEach((b) => { $('.n', b).textContent = countTools(TABS.find((t) => t.id === b.dataset.tab)) || ''; });
  }

  function countTools(t) {
    if (t.custom === 'items') return GAME.itemTotal;
    if (t.id === 'changes') return state.journal.filter((j) => !j.undone).length;
    if (t.id === 'index') return CATALOG.length;

    return t.groups.reduce((n, g) => n + g.rows.length, 0);
  }

  // ---------- tabs ----------
  function openTab(id) {
    const t = TABS.find((x) => x.id === id);

    state.tab = id;
    $('#q').value = '';
    $$('.tab').forEach((b) => b.classList.toggle('on', b.dataset.tab === id));
    renderHead(t);
    renderBody(t);
  }

  function renderHead(t) {
    const rows = t.groups.flatMap((g) => g.rows);
    const mod = rows.filter((r) => r.s === 'M').length;
    const ed = rows.filter((r) => r.s === 'E' || r.s === 'X').length;
    const counts = t.page === 'index'
      ? Object.keys(KIND).map((k) => `<span><b>${CATALOG.filter((c) => c.kind === k).length}</b> ${KIND[k].toLowerCase()}s</span>`).join('')
      : t.page === 'changes' ? `<span><b>${state.journal.length}</b> changes</span><span><b>${state.presets.length + 1}</b> presets</span>`
      : t.custom === 'items' ? `<span><b>${GAME.itemTotal}</b> items in the game</span><span><b>${GAME.items.length}</b> with pictures here; any id works</span>`
      : '';

    $('#tabhead').innerHTML = `<h1>${t.title || t.name}<small>${t.zh}</small></h1><p>${t.blurb}</p><div class="counts">${counts}</div>`;
    if (t.custom === 'items' || t.page) return;

    const f = $('#tabhead .counts');

    f.classList.add('filter');
    f.innerHTML = [['all', 'All', rows.length], ['game', "Game's own", rows.length - mod], ['mod', 'Added by mod', mod]].map(([k, l, n]) => `<button data-f="${k}" class="${state.filter === k ? 'on' : ''}"><b>${n}</b> ${l}</button>`).join('') + (ed ? `<span title="Editor-only or not wired: shown greyed, they do nothing in the release game"><b>${ed}</b> inactive</span>` : '');
    $$('button', f).forEach((b) => { b.onclick = () => { state.filter = b.dataset.f; openTab(t.id); }; });
  }

  const shown = (r) => state.filter === 'all' || (state.filter === 'mod' ? r.s === 'M' : r.s !== 'M');

  function refresh() {
    if (!state.open) return;

    const y = $('#body').scrollTop;

    renderRail();
    renderStatus();
    if ($('#q').value.trim()) search($('#q').value.trim()); else openTab(state.tab);
    $('#body').scrollTop = y;
  }

  function renderBody(t) {
    const body = $('#body');

    body.innerHTML = '';
    body.classList.toggle('flat', t.custom === 'items' || !!t.page);
    body.scrollTop = 0;

    if (t.page === 'changes') return changesPage(body);
    if (t.page === 'index') return indexPage(body);
    if (t.custom === 'items') { body.append(itemSpawner()); t.groups.forEach((g, i) => body.append(groupEl(g, i))); return; }

    const cols = h('<div class="cols"></div>');

    body.append(cols);
    if (state.filter !== 'mod') {
      if (t.custom === 'stats') cols.append(statGroup());
      if (t.custom === 'weather') cols.append(weatherGroup());
      if (t.custom === 'maps') cols.append(mapGroup());
      if (t.custom === 'people') cols.append(peopleGroup());
    }

    t.groups.forEach((g, i) => { if (g.rows.some(shown)) cols.append(groupEl(g, i)); });
  }

  function groupEl(g) {
    const el = h(`<section class="group${g.warn ? ' warn' : ''}"><h2>${g.t}<small>${g.zh}</small><em>${g.rows.length}</em></h2>${g.note ? `<div class="gnote">${g.note}</div>` : ''}</section>`);

    g.rows.filter(shown).forEach((r) => el.append(rowEl(r)));

    return el;
  }

  function rowEl(r) {
    const b = r.bind;
    const refs = r.ref.length ? `<code class="refs" title="${esc(r.ref.join('\n'))}">${esc(r.ref[0])}${r.ref.length > 1 ? ` +${r.ref.length - 1}` : ''}</code>` : '';
    const off = b.kind === 'none';
    const cls = `row${r.s === 'E' || r.s === 'X' ? ' ed' : ''}${r.s === 'M' ? ' added' : ''}${off ? ' off' : ''}${b.kind === 'form' ? ' formrow' : ''}${b.kind === 'spec' ? ' specrow' : ''}`;
    const el = h(`<div class="${cls}" data-key="${esc(r.key)}"><div class="lab"><b>${esc(r.l)}</b>${CHIP[r.s] || ''}${r.d ? `<p>${esc(r.d)}</p>` : ''}${refs}</div><div class="ctl"></div></div>`);

    if (b.kind === 'spec') {
      const f = fieldsEl(r);

      if (f) $('.lab', el).append(f);
      $('.ctl', el).append(...specControls(r));
    } else if (b.kind === 'form') {
      $('.ctl', el).remove();
      b.cmds.forEach((name) => $('.lab', el).append(formEl(name, r)));
    } else {
      $('.ctl', el).append(...controlFor(r));
    }

    return el;
  }

  // The fields of one of the game's messages, typed in by hand, with a button that sends it.
  function formEl(name, r) {
    const sc = S[name];
    const el = h(`<div class="gmform"><header><code>${esc(name)}</code><span>msgHead ${sc.id}</span><button class="btn">Run</button></header><div class="fl"></div></div>`);
    const fl = $('.fl', el);

    if (!sc.f.length) fl.append(h('<span class="none">No fields: it runs as it is.</span>'));
    sc.f.forEach(([type, field]) => {
      const input = type === 'bool'
        ? h(`<select class="sel" data-f="${esc(field)}"><option>false</option><option>true</option></select>`)
        : h(`<input class="num" data-f="${esc(field)}" placeholder="${esc(type)}">`);
      const lab = h(`<label><span>${esc(field)} <i>${esc(type)}</i></span></label>`);

      lab.append(input);
      fl.append(lab);
    });
    $('header .btn', el).onclick = () => {
      const values = {};

      $$('[data-f]', el).forEach((i) => { if (i.tagName === 'SELECT' || i.value.trim() !== '') values[i.dataset.f] = i.value; });

      const m = L.message(name, values);

      if (m.error) return log(`${name}: ${m.error}`, 'err');

      const label = r ? r.l : name;

      cheat(() => {
        log(`${label}: ${JSON.stringify(m.msg)}`);
        once({ l: label, s: r ? r.s : 'G', tab: r ? r.tab : 'index', ref: [name] }, Object.keys(values).map((k) => k + ' ' + values[k]).join(', ') || 'done');
        post(m.msg, label);
      });
    };

    return el;
  }

  // ---------- rows from rows.js ----------
  const listReq = {};

  // Reads a live list (the pots, furniture, events or buffs in the save, or the saves and backups) once; Reload reads
  // it again.
  function loadList(of) {
    listReq[of] = true;
    if (of === 'saves') return post({ msgHead: S.ListGameSaves.id }, 'Save list', () => { listReq[of] = false; state.lists[of] = []; refresh(); });
    if (of === 'backups') return post({ msgHead: S.ListBackups.id }, 'Backup list', () => { listReq[of] = false; state.lists[of] = []; refresh(); });

    act('list', { of }, 'List', (text, error) => {
      listReq[of] = false;
      state.lists[of] = (!error && L.parseList(text)) || [];
      if (error) log(`List of ${of}: ${error}`, 'err');
      refresh();
    });
  }

  const listOf = (of) => { if (!state.lists[of] && !listReq[of]) loadList(of); return state.lists[of] || null; };
  const ui = (r) => r.ui || (r.ui = {});

  // The value picked in one of a row's lists, by the slot it is kept in.
  function picked(r, slot, x) {
    const list = x.live ? state.lists[x.live] : x.opts;
    const i = ui(r)[slot];

    if (i === undefined && !x.blank && !x.live && list && list.length) return list[0][1];
    if (i === '' || i === undefined || !list || !list[+i]) return '';

    return x.pickFile ? list[+i][2] : list[+i][1];
  }

  function pickedLabel(r, slot, x) {
    const list = x.live ? state.lists[x.live] : x.opts;
    const i = ui(r)[slot] === undefined ? (x.blank || x.live ? '' : 0) : ui(r)[slot];

    return list && list[+i] && i !== '' ? list[+i][0] : '';
  }

  // A list, with a filter box when it is long and Reload when it is read from the game.
  function pickEl(r, slot, x) {
    const u = ui(r);
    const list = x.live ? listOf(x.live) : x.opts;
    const wrap = h('<span class="pick"></span>');
    const sel = h('<select class="sel"></select>');
    const paint = () => {
      const q = (u['q:' + slot] || '').toLowerCase();
      const items = (list || []).map((o, i) => [o, i]).filter(([o]) => !q || String(o[0]).toLowerCase().indexOf(q) >= 0).slice(0, 500);

      sel.innerHTML = (x.blank ? `<option value="">${esc(x.blank)}</option>` : '')
        + (!list ? '<option value="">(reading the game)</option>' : !list.length ? '<option value="">(none found)</option>' : items.map(([o, i]) => `<option value="${i}"${String(i) === u[slot] ? ' selected' : ''}>${esc(o[0])}</option>`).join(''));
      if (u[slot] !== undefined && sel.value !== u[slot]) u[slot] = sel.value;
    };

    if ((list || []).length > 30) {
      const f = h(`<input class="num filt" placeholder="Filter" value="${esc(u['q:' + slot] || '')}">`);

      f.oninput = () => { u['q:' + slot] = f.value; paint(); u[slot] = sel.value; };
      wrap.append(f);
    }
    paint();
    sel.onchange = () => { u[slot] = sel.value; };
    wrap.append(sel);
    if (x.live) {
      const b = h('<button class="btn ghost" title="Read the list from the game again">Reload</button>');

      b.onclick = () => { delete state.lists[x.live]; loadList(x.live); };
      wrap.append(b);
    }

    return wrap;
  }

  function boxEl(r, slot, value, wide) {
    const u = ui(r);
    const n = h(`<input class="num${wide ? ' wide' : ''}" value="${esc(u[slot] !== undefined ? u[slot] : value == null ? '' : value)}">`);

    n.oninput = () => { u[slot] = n.value; };

    return n;
  }

  const BOOL = [['true', true], ['false', false]];
  const inputOf = (x) => x.t === 'bool' ? Object.assign({ opts: x.v ? BOOL : BOOL.slice().reverse() }, x) : x.live && !x.blank ? Object.assign({ blank: '(none)' }, x) : x;

  // The fields of a game message a row leaves out of its own inputs; blank ones are not sent.
  function moreFields(sp) {
    if (!sp.cmd || sp.more === false || !S[sp.cmd]) return [];

    const used = new Set([sp.main, ...Object.keys(sp.fix || {}), ...(sp.in || []).map((x) => x.f), ...(sp.opts || []).flatMap((o) => o[1] && typeof o[1] === 'object' ? Object.keys(o[1]) : []), ...(sp.each || []).flatMap((e) => Object.keys(e))]);

    return S[sp.cmd].f.filter(([, f]) => !used.has(f)).map(([type, f]) => type === 'bool' ? { f, l: f, opts: BOOL, blank: '(leave out)' } : { f, l: `${f} (${type})`, v: '' });
  }

  // The row's other inputs by field name, from what is typed and picked.
  function specInputs(r) {
    const sp = r.bind.spec;
    const out = {};
    const one = (x, slot) => {
      const y = inputOf(x);

      out[x.f] = y.opts || y.live ? picked(r, slot, y) : ui(r)[slot] !== undefined ? ui(r)[slot] : y.v == null ? '' : y.v;
    };

    (sp.in || []).forEach((x) => one(x, 'in:' + x.f));
    moreFields(sp).forEach((x) => one(x, 'more:' + x.f));

    return out;
  }

  function fieldsEl(r) {
    const sp = r.bind.spec;
    const box = h('<div class="fields"><div class="fl"></div></div>');
    const add = (to, x, slot) => {
      const y = inputOf(x);
      const lab = h(`<label><span>${esc(y.l || y.f)}</span></label>`);

      lab.append(y.opts || y.live ? pickEl(r, slot, y) : boxEl(r, slot, y.v, y.t === 'text'));
      to.append(lab);
    };
    const more = moreFields(sp);

    (sp.in || []).forEach((x) => add($('.fl', box), x, 'in:' + x.f));
    if (more.length) {
      const d = h(`<details class="more"${ui(r).more ? ' open' : ''}><summary>More fields (${more.length})</summary><div class="fl"></div></details>`);

      d.ontoggle = () => { ui(r).more = d.open; };
      more.forEach((x) => add($('.fl', d), x, 'more:' + x.f));
      box.append(d);
    }

    return (sp.in || []).length || more.length ? box : null;
  }

  function specControls(r) {
    const sp = r.bind.spec;
    const kind = L.control(r, sp);

    if (sp.page === 'riskybackup') {
      const sw = h(`<button class="sw${state.riskyBackup ? ' on' : ''}" aria-label="${esc(r.l)}"></button>`);

      sw.onclick = () => { state.riskyBackup = !state.riskyBackup; log(`${r.l}: ${onOff(state.riskyBackup)}`, 'mod'); refresh(); };

      return [sw];
    }
    if (kind === 'tog') return controlFor(r);

    const parts = [];
    const key = rowSettingKey(r);
    const x = key && setting(key);

    if (kind === 'sel') {
      if (x && ui(r).main === undefined) { const i = sp.opts.findIndex((o) => o[1] === x.get()); if (i >= 0) ui(r).main = String(i); }
      parts.push(pickEl(r, 'main', sp));
    } else if (kind === 'num' || kind === 'text') {
      parts.push(boxEl(r, 'main', x ? x.get() : sp.v !== undefined ? sp.v : r.v, kind === 'text'));
      if (r.u) parts.push(h(`<span class="unit">${esc(r.u)}</span>`));
    }

    const btn = h(`<button class="btn${r.red || sp.risky ? ' red' : ''}">${esc(sp.readout ? 'Show' : r.b || 'Run')}</button>`);

    btn.onclick = () => runSpec(r);
    parts.push(btn);

    return parts;
  }

  // The value of a row's own control.
  function mainValue(r) {
    const sp = r.bind.spec;
    const kind = L.control(r, sp);

    if (kind === 'sel') return picked(r, 'main', sp);
    if (kind === 'num' || kind === 'text') {
      const x = rowSettingKey(r) && setting(rowSettingKey(r));

      return ui(r).main !== undefined ? ui(r).main : x ? x.get() : sp.v !== undefined ? sp.v : r.v;
    }

    return undefined;
  }

  function showReadout(name) {
    const m = state.lastRead[name];

    if (!m) return log(`${name}: the game has not sent one since the menu opened. Wait a second and try again.`, 'err');

    log(L.describe(m));
    log(JSON.stringify(m).slice(0, 2000));
  }

  function runSpec(r) {
    const sp = r.bind.spec;
    const kind = L.control(r, sp);
    const main = mainValue(r);
    const inputs = specInputs(r);
    const label = kind === 'sel' ? pickedLabel(r, 'main', sp) : main === undefined || main === '' ? '' : main + (r.u ? ' ' + r.u : '');
    const what = [label, ...Object.keys(inputs).filter((k) => inputs[k] !== '' && inputs[k] != null).map((k) => k + ' ' + inputs[k])].filter(Boolean).join(', ') || 'done';
    const isRisky = !!(sp.risky || r.red);

    if (sp.readout) return showReadout(sp.readout);
    if (kind === 'sel' && sp.main && main === '') return log(`${r.l}: pick one first`, 'err');
    if (sp.pulse) return guarded(() => { send('hold|' + sp.pulse + '|1'); log(`${r.l}`); once(r, 'stepped'); });
    if (sp.attr || sp.attrs) {
      const x = setting(rowSettingKey(r));
      const v = sp.attrs ? main : Number(main);

      if (sp.attr && (main === null || main === undefined || String(main).trim() === '' || !isFinite(v))) return log(`${r.l}: type a number (the game has not sent this value yet)`, 'err');

      return guarded(() => {
        const was = x.get();

        x.set(v);
        log(`${r.l}: ${x.show(v)}`);
        journal(x, x.show(was), x.show(v), was === null ? null : () => x.set(was), x.key);
        refresh();
      });
    }
    if (sp.act) {
      const args = L.actArgs(sp, main, inputs);

      return guarded(() => { log(`${r.l}: ${what}`); once(r, what); act(sp.act, args, r.l); }, isRisky);
    }

    const m = L.specMessages(sp, main, inputs);

    if (m.error) return log(`${r.l}: ${m.error}`, 'err');

    guarded(() => { log(`${r.l}: ${what}`); once(r, what); m.msgs.forEach((msg) => post(msg, r.l)); }, isRisky);
  }

  function controlFor(r) {
    const b = r.bind;
    const key = rowSettingKey(r);

    if (r.k === 'tog') {
      const x = key && setting(key);
      const on = x ? x.get() : false;
      const sw = h(`<button class="sw${on ? ' on' : ''}" aria-label="${esc(r.l)}"></button>`);

      sw.onclick = () => {
        if (!x) return;

        const was = x.get();

        cheat(() => {
          x.set(!was);
          log(`${r.l}: ${!was ? 'on' : 'off'}`);
          journal(x, x.show(was), x.show(!was), () => x.set(was), x.key);
          refresh();
        });
      };

      return [sw];
    }

    const btn = h(`<button class="btn${r.red ? ' red' : ''}">${esc(r.b)}</button>`);
    const fire = (value, shownValue) => {
      if (b.kind !== 'cmd') return;

      const m = L.rowMessage(b, value);

      if (m.error) return log(`${r.l}: ${m.error}`, 'err');

      guarded(() => {
        log(`${r.l}: ${shownValue}`);
        once(r, shownValue);
        post(m.msg, r.l);
      }, !!r.red);
    };

    if (r.k === 'num') {
      const n = h(`<input class="num" value="${esc(r.v)}">`);
      const parts = [n];

      if (r.u) parts.push(h(`<span class="unit">${esc(r.u)}</span>`));
      btn.onclick = () => fire(n.value, n.value + (r.u ? ' ' + r.u : ''));

      return [...parts, btn];
    }

    if (r.k === 'sel') {
      const s = h(`<select class="sel">${r.o.map((o) => `<option${o === r.cur ? ' selected' : ''}>${esc(o)}</option>`).join('')}</select>`);

      btn.onclick = () => { r.cur = s.value; fire(s.value, s.value); };

      return [s, btn];
    }

    btn.onclick = () => fire(null, 'done');

    return [btn];
  }

  // ---------- custom groups ----------
  function statGroup() {
    const lockOn = !!state.flags.LockCharacterAttr;
    const g = h(`<section class="group"><h2>Stats<small>属性</small><em>drag to set</em></h2><div class="row"><div class="lab"><b>Lock all stats where they are</b>${CHIP.G}<p>The game's own attribute lock (LockCharacterAttr).</p></div><div class="ctl"><button class="sw${lockOn ? ' on' : ''}"></button></div></div></section>`);

    $('.sw', g).onclick = () => {
      const x = flagSetting('LockCharacterAttr');
      const was = x.get();

      cheat(() => { x.set(!was); log(`Stat lock: ${!was ? 'on' : 'off'}`); journal(x, x.show(was), x.show(!was), () => x.set(was), x.key); refresh(); });
    };
    if (!state.vitals.length) g.append(h(`<div class="wait">${state.inGame ? 'Waiting for the game to send the survivor\'s stats.' : 'Load a save to see and set the stats.'}</div>`));
    state.vitals.forEach((v) => g.append(statRow(v)));

    return g;
  }

  function statRow(v) {
    const max = v.max || Math.max(100, v.v);
    const el = h(`<div class="stat"><b>${v.k}<small>${ZH[v.k] || ''}</small></b><div class="bar" style="--col:${COLORS[v.k] || '#ccc'}"><i style="width:${Math.min(100, v.v / max * 100)}%"></i></div><span class="v">${Math.round(v.v)}/${Math.round(max)}</span><span></span></div>`);
    const bar = $('.bar', el);
    let to = v.v;
    const setFrom = (e) => {
      const rc = bar.getBoundingClientRect();

      to = Math.round(Math.max(0, Math.min(1, (e.clientX - rc.left) / rc.width)) * max);
      $('i', bar).style.width = (to / max * 100) + '%';
      $('.v', el).textContent = `${to}/${Math.round(max)}`;
    };

    bar.onpointerdown = (e) => { bar.setPointerCapture(e.pointerId); setFrom(e); bar.onpointermove = setFrom; };
    bar.onpointerup = () => {
      bar.onpointermove = null;

      const was = Math.round(v.v);
      const msg = { msgHead: S.ChangeAttr.id, attrKey: v.k, attrValue: to, type: 0 };

      cheat(() => {
        log(`${v.k} set to ${to}`);
        journal({ l: v.k, s: 'G', tab: 'survivor', ref: ['ChangeAttr'] }, was, to, () => post({ msgHead: S.ChangeAttr.id, attrKey: v.k, attrValue: was, type: 0 }, v.k));
        post(msg, v.k);
      });
    };

    return el;
  }

  function weatherGroup() {
    const g = h(`<section class="group"><h2>Weather<small>天气</small><em>${GAME.weather.length}</em></h2><div class="row"><div class="lab"><b>Back to the forecast</b>${CHIP.G}<p>Hands the weather back to the game's tables (ResetWeather).</p></div><div class="ctl"><button class="btn ghost">Reset</button></div></div><div class="tiles"></div></section>`);
    const tiles = $('.tiles', g);
    const setW = (id) => {
      const was = weatherSetting.get();

      cheat(() => {
        weatherSetting.set(id);
        log(id === null ? 'Weather back to the forecast' : `Weather set: ${weatherSetting.show(id)} (id ${id})`);
        journal(weatherSetting, weatherSetting.show(was), weatherSetting.show(id), () => weatherSetting.set(was), 'weather');
        refresh();
      });
    };

    $('.btn', g).onclick = () => setW(null);
    GAME.weather.forEach((w) => {
      const t = h(`<button class="tile${state.weather === w.id ? ' on' : ''}"><img src="${w.i}" alt=""><span>${esc(w.n)}</span><small>${esc(w.zh)}</small></button>`);

      t.onclick = () => setW(w.id);
      tiles.append(t);
    });

    return g;
  }

  function mapGroup() {
    const g = h(`<section class="group"><h2>Go there now<small>一键进探索</small><em>${GAME.maps.length}</em></h2><div class="gnote" style="color:var(--steel-3)">Skips the map, the day and time rules, and the trip (BypassEnterExplore).</div><div class="tiles maps"></div></section>`);
    const tiles = $('.tiles', g);

    GAME.maps.forEach((m) => {
      const t = h(`<button class="tile">${m.i ? `<img src="${m.i}" alt="">` : ''}<span>${esc(m.n)}</span><small>${esc(m.zh)} - ${m.id}</small></button>`);

      t.onclick = () => cheat(() => {
        log(`Enter explore: ${m.n} (map point ${m.id})`);
        once({ l: 'Go there now', s: 'G', tab: 'explore', ref: ['BypassEnterExplore'] }, m.n);
        post({ msgHead: S.BypassEnterExplore.id, MapPointId: m.id }, 'Go there now');
      });
      tiles.append(t);
    });

    return g;
  }

  function peopleGroup() {
    const g = h(`<section class="group"><h2>Neighbour<small>救助与陪伴</small><em>quick</em></h2><div class="row"><div class="lab"><b>Affinity and rescue</b>${CHIP.G}<p>Adds to the neighbour's affinity or rescue progress (AddNeighborAffinity, AddNeighborRescueProgress).</p></div><div class="ctl"><input class="num" value="10"><button class="btn" data-c="AddNeighborAffinity">Affinity</button><button class="btn" data-c="AddNeighborRescueProgress">Rescue</button></div></div></section>`);
    const n = $('.num', g);

    $$('[data-c]', g).forEach((b) => {
      b.onclick = () => {
        const m = L.message(b.dataset.c, { Delta: n.value });

        if (m.error) return log(`${b.textContent}: ${m.error}`, 'err');

        cheat(() => {
          log(`Neighbour ${b.textContent.toLowerCase()} +${n.value}`);
          once({ l: `Neighbour ${b.textContent.toLowerCase()}`, s: 'G', tab: 'people', ref: [b.dataset.c] }, '+' + n.value);
          post(m.msg, b.textContent);
        });
      };
    });

    return g;
  }

  // ---------- items ----------
  function itemSpawner() {
    const cats = [...new Set(GAME.items.map((i) => i.c))].filter((c) => ITEM_CATS[c]);
    const wrap = h(`<div class="spawner"><div><div class="chips"></div><label class="search" style="margin:0 0 12px;max-width:none"><svg viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21"/></svg><input id="iq" placeholder="Search items by name, Chinese name or id"></label><div class="igrid"></div></div><div class="detail"></div></div>`);
    const chips = $('.chips', wrap);
    const grid = $('.igrid', wrap);
    const iq = $('#iq', wrap);
    const paintGrid = () => {
      const q = iq.value.trim().toLowerCase();
      const list = GAME.items.filter((i) => q ? (i.n.toLowerCase().includes(q) || i.zh.includes(q) || String(i.id) === q) : i.c === state.cat);

      grid.innerHTML = '';
      list.forEach((it) => {
        const c = h(`<button class="cell${state.item === it ? ' on' : ''}" title="${esc(it.n)} - ${it.id}"><img src="${it.i}" alt="" loading="lazy"><span>${esc(it.n)}</span></button>`);

        c.onclick = () => { state.item = it; paintGrid(); paintDetail(wrap); };
        grid.append(c);
      });
      if (!list.length) grid.append(h(`<div class="empty">No pictured item matches.${/^\d+$/.test(q) ? ` Id ${esc(q)} can still be spawned: it is in the box on the right.` : ''}</div>`));
      if (/^\d+$/.test(q) && !list.length) { state.item = { id: +q, n: 'Item ' + q, zh: '', st: '?', c: 0, i: '' }; paintDetail(wrap); }
    };

    cats.forEach((c) => {
      const b = h(`<button class="chip${c === state.cat ? ' on' : ''}">${ITEM_CATS[c]}</button>`);

      b.onclick = () => { state.cat = c; iq.value = ''; $$('.chip', chips).forEach((x) => x.classList.remove('on')); b.classList.add('on'); paintGrid(); };
      chips.append(b);
    });
    iq.oninput = paintGrid;
    state.item = state.item || GAME.items.find((i) => i.c === state.cat);
    paintGrid();
    paintDetail(wrap);

    return wrap;
  }

  function paintDetail(wrap) {
    const it = state.item;
    const d = $('.detail', wrap);

    d.innerHTML = `<div class="big">${it.i ? `<img src="${it.i}" alt="">` : ''}</div><h3>${esc(it.n)}</h3><div class="zhn">${esc(it.zh)}</div><div class="meta">id ${it.id} - stack ${it.st} - ${ITEM_CATS[it.c] || 'Other'}</div><div class="stepper"><button class="btn ghost" data-d="-10">-10</button><button class="btn ghost" data-d="-1">-1</button><input class="num" value="${state.count}"><button class="btn ghost" data-d="1">+1</button><button class="btn ghost" data-d="10">+10</button></div><button class="go">SPAWN</button><div class="foot">Goes to your bag. Bag full? The rest goes to the floor, like the game's own add-item (AddItem).</div>`;

    const n = $('.num', d);

    $$('[data-d]', d).forEach((b) => { b.onclick = () => { state.count = Math.max(1, (+n.value || 0) + +b.dataset.d); n.value = state.count; }; });
    n.oninput = () => { state.count = Math.max(1, Math.floor(+n.value) || 1); };
    $('.go', d).onclick = () => cheat(() => {
      log(`Added item: ${it.n} x${state.count} (id ${it.id})`);
      once({ l: 'Spawn item', s: 'G', tab: 'items', ref: ['AddItem'] }, `${it.n} x${state.count}`);
      post({ msgHead: S.AddItem.id, ItemConfigId: it.id, Count: state.count, RequestId: 'cheatmenu' + nextId }, 'Spawn item');
    });
  }

  // ---------- changes journal ----------
  const clock = () => new Date().toTimeString().slice(0, 5);
  const tabName = (id) => (TABS.find((t) => t.id === id) || { name: id }).name;

  function journal(x, before, after, undo, key) {
    state.journal.unshift({ n: state.journal.length + 1, t: clock(), l: x.l, s: x.s, tab: x.tab, ref: x.ref, before, after, undo: undo || null, key: key || null, undone: false });
    renderRail();
  }

  const once = (x, after) => journal(x, null, after);

  // Only the newest live entry for a setting can be undone; older ones were replaced by it.
  const latest = (j) => state.journal.find((x) => x.key === j.key && !x.undone) === j;

  function undo(j) {
    cheat(() => {
      j.undo();
      j.undone = true;
      log(`Undid: ${j.l}${j.before === null ? '' : ' back to ' + j.before}`, 'mod');
      refresh();
    });
  }

  function setTo(key, v, why) {
    const x = setting(key);

    if (!x) return false;

    const was = x.get();

    if (was === v || v === null || v === undefined) return false;
    x.set(v);
    journal(x, x.show(was), x.show(v), () => x.set(was), key);
    state.journal[0].why = why;

    return true;
  }

  function returnToBefore() {
    cheat(() => {
      const n = allSettingKeys().filter((k) => BASE.has(k) && setTo(k, BASE.get(k), 'Back to before cheating')).length;

      log(n ? `Back to before cheating: ${n} settings restored` : 'Already at the before-cheating settings', 'mod');
      refresh();
    });
  }

  // ---------- presets ----------
  const savePresets = () => send('presets|' + JSON.stringify(state.presets));
  const changedNow = () => allSettingKeys().filter((k) => BASE.has(k) && setting(k) && setting(k).get() !== BASE.get(k));

  function applyPreset(p) {
    cheat(() => {
      const n = Object.entries(p.values).filter(([k, v]) => setTo(k, v, `Preset "${p.name}"`)).length;

      log(`Preset "${p.name}": ${n} settings changed`, 'mod');
      refresh();
    });
  }

  // ---------- changes page ----------
  let confirmLoad = false;

  function changesPage(body) {
    const live = state.journal.filter((j) => !j.undone);
    const changed = changedNow();
    const oneTime = live.filter((j) => !j.key);
    const bak = state.backedUp;
    const top = h(`<section class="group before"><h2>Before cheating<small>作弊前</small><em>${bak ? 'backup: ' + esc(bak) : backup.step === 'failed' ? 'backup failed' : 'no cheats yet'}</em></h2>
      <div class="bstat"><div><b>${changed.length}</b><span>settings differ from before</span></div><div><b>${oneTime.length}</b><span>one-time actions</span></div><div><b>${live.length}</b><span>changes in the journal</span></div></div>
      <div class="row"><div class="lab"><b>Return to before cheating</b><span class="c add">ADDED BY MOD</span><p>Puts every switch back the way it was when you first opened the menu this session, and the weather back to the forecast. One-time actions (items, skipped days, kills) stay.</p></div><div class="ctl"><button class="btn" id="tobase"${changed.length ? '' : ' disabled'}>Restore settings</button></div></div>
      <div class="row"><div class="lab"><b>Load the before-cheating backup</b><span class="c gm">GAME</span><p>${bak ? `Undoes everything, one-time actions too, by loading the save the menu backed up before your first cheat (${esc(bak)}). Uses the game's own InjectSave. Anything since then is lost.` : 'The menu backs up your save with the game\'s own BackupSave the moment you make your first change, so this has something to load.'}</p></div><div class="ctl"><button class="btn red" id="loadbak"${bak ? '' : ' disabled'}>${confirmLoad ? 'Click again to load' : 'Load backup'}</button></div></div></section>`);

    $('#tobase', top).onclick = returnToBefore;
    $('#loadbak', top).onclick = () => {
      if (!confirmLoad) { confirmLoad = true; refresh(); setTimeout(() => { confirmLoad = false; refresh(); }, 4000); return; }

      confirmLoad = false;
      post({ msgHead: S.InjectSave.id, BackupName: bak, LoadAfterInject: true }, 'Load backup');
      state.journal.forEach((j) => { j.undone = true; });
      log(`Loading backup "${bak}" (InjectSave). Every change since it is gone.`, 'mod');
      refresh();
    };
    body.append(top);

    const pg = h(`<section class="group"><h2>Presets<small>预设</small><em>${state.presets.length + 1}</em></h2><div class="gnote" style="color:var(--steel-3)">A preset is a saved set of switches. Apply one to set up a test, then pick Default to go back. They are kept in BepInEx/config/CheatMenu/presets.json.</div><div class="presets"></div>
      <div class="row"><div class="lab"><b>Save the current settings as a preset</b><p>${changed.length ? `Saves the ${changed.length} settings that differ from before cheating.` : 'Change some settings first; a preset only stores what differs from before cheating.'}</p></div><div class="ctl"><input class="num wide" id="pname" placeholder="Preset name"><button class="btn" id="psave"${changed.length ? '' : ' disabled'}>Save</button></div></div></section>`);
    const list = $('.presets', pg);
    const card = (p, builtin) => {
      const entries = builtin ? changed.map((k) => [k, BASE.get(k)]) : Object.entries(p.values);
      const items = entries.map(([k, v]) => { const x = setting(k); return x ? `<li><span>${esc(tabName(x.tab))} > ${esc(x.l)}</span><b>${esc(x.show(v))}</b>${x.s === 'M' ? '<i class="c add">MOD</i>' : ''}</li>` : ''; }).join('');
      const active = !builtin && entries.every(([k, v]) => setting(k) && setting(k).get() === v);
      const el = h(`<div class="preset${builtin ? ' base' : ''}${active || (builtin && !changed.length) ? ' active' : ''}"><header><b>${esc(p.name)}</b><small>${builtin ? 'built in - the settings this session started with' : esc(p.made)}</small></header><ul>${items || `<li class="none">${builtin ? 'Nothing to change: you are at the default.' : 'Empty'}</li>`}</ul><footer><button class="btn">${builtin ? 'Apply default' : 'Apply'}</button>${builtin ? '' : '<button class="btn ghost del">Delete</button>'}</footer></div>`);

      $('.btn', el).onclick = () => builtin ? returnToBefore() : applyPreset(p);
      if (!builtin) $('.del', el).onclick = () => { state.presets = state.presets.filter((x) => x !== p); savePresets(); log(`Deleted preset "${p.name}"`, 'mod'); refresh(); };

      return el;
    };

    list.append(card({ name: 'Default (no cheats)' }, true));
    state.presets.forEach((p) => list.append(card(p)));
    $('#psave', pg).onclick = () => {
      const name = $('#pname', pg).value.trim() || `Preset ${state.presets.length + 1}`;

      state.presets.push({ name, made: `saved ${new Date().toLocaleDateString()} ${clock()}`, values: Object.fromEntries(changed.map((k) => [k, setting(k).get()])) });
      savePresets();
      log(`Saved preset "${name}" (${changed.length} settings)`, 'mod');
      refresh();
    };
    body.append(pg);

    const jg = h('<section class="group journal"><h2>Journal<small>变更记录</small><em>every change, newest first</em></h2></section>');

    if (!state.journal.length) jg.append(h('<div class="empty">No changes yet. Everything you do in the menu shows up here, with what it was before.</div>'));
    state.journal.forEach((j) => {
      const act = j.undone ? '<span class="st">undone</span>'
        : j.key ? (latest(j) ? '<button class="btn ghost">Undo</button>' : '<span class="st">replaced later</span>')
          : j.undo ? '<button class="btn ghost">Undo</button>' : '<span class="st" title="Load the before-cheating backup to undo this">one-time</span>';
      const el = h(`<div class="jrow${j.undone ? ' gone' : ''}${j.s === 'M' ? ' added' : ''}"><span class="jn">${j.n}</span><time>${j.t}</time><span class="jw">${esc(tabName(j.tab))} > <b>${esc(j.l)}</b>${CHIP[j.s] || ''}${j.why ? `<small>${esc(j.why)}</small>` : ''}</span><span class="jv">${j.before === null ? '' : `<s>${esc(j.before)}</s> -> `}<b>${esc(j.after)}</b></span><span class="ja">${act}</span></div>`);
      const b = $('.ja .btn', el);

      if (b) b.onclick = () => undo(j);
      jg.append(el);
    });
    body.append(jg);
  }

  // ---------- game index ----------
  function indexPage(body) {
    const where = new Map();
    const at = (k) => where.get(k) || where.set(k, []).get(k);

    TABS.forEach((t) => {
      (t.customRef || []).forEach((k) => at(k).push({ tab: t, l: { stats: 'Stats bars', weather: 'Weather tiles', maps: 'Go there now', people: 'Neighbour', items: 'Item spawner' }[t.custom] }));
      t.groups.forEach((g) => g.rows.forEach((r) => r.ref.forEach((k) => at(k).push({ tab: t, l: r.l, r }))));
    });

    const box = h(`<div><div class="ibar"><label class="search" style="margin:0;max-width:none;flex:1"><svg viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21"/></svg><input id="ixq" placeholder="Filter by game name, e.g. Weather, PsOp, Codex"></label><span class="cov">Every panel command can be run from here: click run</span></div><div class="ilist"></div></div>`);
    const paint = () => {
      const q = $('#ixq', box).value.trim().toLowerCase();
      const out = $('.ilist', box);

      out.innerHTML = '';
      Object.keys(KIND).forEach((kind) => {
        const list = CATALOG.filter((c) => c.kind === kind && (!q || (c.key + ' ' + c.src).toLowerCase().includes(q)));

        if (!list.length) return;

        const g = h(`<section class="group"><h2>${KIND[kind]}s<small>${{ cmd: '面板命令', read: '回报', sub: '子命令', gm: 'Gm 方法', hook: 'GM 钩子' }[kind]}</small><em>${list.length}</em></h2></section>`);

        list.forEach((c) => {
          const w = where.get(c.key) || [];
          const el = h(`<div class="irow"><code>${esc(c.key)}</code><span class="isrc">${esc(c.src)}${c.via ? ' - via ' + esc(c.via) : ''}${kind === 'cmd' && S[c.key] ? '<a class="run">run</a>' : ''}</span><span class="iw">${w.length ? w.map((x, i) => `<a data-i="${i}">${esc(x.tab.name)} > ${esc(x.l)}</a>`).join('') : '<em>not in the menu</em>'}</span></div>`);

          $$('a[data-i]', el).forEach((a) => { a.onclick = () => jumpTo(w[+a.dataset.i]); });

          const run = $('.run', el);

          if (run) run.onclick = () => { const next = el.nextSibling; if (next && next.classList && next.classList.contains('gmform')) next.remove(); else el.after(formEl(c.key, null)); };
          g.append(el);
        });
        out.append(g);
      });
    };

    $('#ixq', box).oninput = paint;
    body.append(box);
    paint();
  }

  function jumpTo(x) {
    state.filter = 'all';
    openTab(x.tab.id);

    const el = x.r && root.querySelector(`.row[data-key="${CSS.escape(x.r.key)}"]`);

    if (el) { el.scrollIntoView({ block: 'center' }); el.classList.add('hit'); setTimeout(() => el.classList.remove('hit'), 1600); }
  }

  // ---------- live column ----------
  function renderStatus() {
    $('#keyname').textContent = state.key || 'Close';
    $('#status').innerHTML = `${state.inGame ? '<b>In a save</b>: cheats go to the game.' : '<span class="bad">No save loaded</span>: load one to use cheats.'}<br>${state.key ? `<b>${esc(state.key)}</b> opens and closes this menu.` : 'No key set; see the config.'}<br>Backup: ${state.backedUp ? esc(state.backedUp) : backup.step === 'failed' ? '<span class="bad">failed</span>' : 'made at your first cheat'}`;
  }

  function renderVitals() {
    $('#vitals').innerHTML = state.vitals.map((v) => { const max = v.max || Math.max(100, v.v); return `<div class="vit${state.flags.LockCharacterAttr ? ' locked' : ''}"><span>${v.k}</span><div class="bar" style="--col:${COLORS[v.k] || '#ccc'}"><i style="width:${Math.min(100, v.v / max * 100)}%"></i></div><span class="v">${Math.round(v.v)}/${Math.round(max)}</span></div>`; }).join('');
  }

  // ---------- search ----------
  function search(q) {
    if (!q) return openTab(state.tab);

    const needle = q.toLowerCase();
    const hits = [];

    TABS.forEach((tab) => tab.groups.forEach((g) => g.rows.forEach((r) => {
      if ((r.l + ' ' + (r.d || '') + ' ' + g.t + ' ' + g.zh + ' ' + r.ref.join(' ')).toLowerCase().includes(needle)) hits.push({ tab, g, r });
    })));

    $('#tabhead').innerHTML = `<h1>Search<small>搜索</small></h1><p>Every tab, every tool. Run it from here or jump to its tab.</p><div class="counts"><span><b>${hits.length}</b> found</span></div>`;

    const body = $('#body');

    body.innerHTML = '';
    body.classList.add('flat');
    if (!hits.length) return body.append(h('<div class="empty">Nothing matches. Try a Chinese word, or a game command in the Game index.</div>'));

    const box = h('<section class="group results"><h2>Results<small>结果</small></h2></section>');

    hits.filter(({ r }) => shown(r)).slice(0, 60).forEach(({ tab, g, r }) => {
      const row = rowEl(r);

      $('.lab', row).append(h(`<p class="where">${tab.name} > ${g.t}</p>`));
      box.append(row);
    });
    body.append(box);
  }

  // ---------- console ----------
  const NAMES = Object.keys(S);
  const HISTORY_KEY = 'slcheatmenu.history';
  const HISTORY_MAX = 50;

  try { const kept = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); if (Array.isArray(kept)) state.history = kept.filter((x) => typeof x === 'string').slice(0, HISTORY_MAX); } catch (e) { /* no saved history */ }

  function runCommand(line) {
    const text = line.trim();

    if (!text) return;

    if (state.history[0] !== text) state.history.unshift(text);
    state.history.length = Math.min(state.history.length, HISTORY_MAX);
    state.hpos = -1;
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(state.history)); } catch (e) { /* history then lasts only while the page is open */ }

    if (text === 'help') return log('A game command and its fields: AddItem ItemConfigId=1203 Count=20. Or a whole message: {"msgHead":52,"Scale":4}. Or tab NAME. history lists what you typed before; the up and down arrows bring it back. Every command is listed in the Game index.', 'mod');
    if (text === 'history') return log(state.history.length > 1 ? 'Earlier commands, newest first:\n' + state.history.slice(1, 21).join('\n') : 'No earlier commands yet.', 'mod');

    if (text[0] === '{') {
      let msg;

      try { msg = JSON.parse(text); } catch (e) { return log('That is not valid JSON: ' + e.message, 'err'); }

      return cheat(() => { log('Console: ' + text); once({ l: 'Console', s: 'G', tab: 'debug' }, text); post(msg, 'Console'); });
    }

    const [word, ...args] = text.split(/\s+/);

    if (word.toLowerCase() === 'tab') {
      const t = TABS.find((x) => x.name.toLowerCase().startsWith((args[0] || '').toLowerCase()));

      return t ? openTab(t.id) : log(`No tab "${args[0]}"`, 'err');
    }

    const name = NAMES.find((n) => n.toLowerCase() === word.toLowerCase());

    if (!name) return log(`No game command "${word}". Type help.`, 'err');

    const values = {};

    args.forEach((a) => { const i = a.indexOf('='); if (i > 0) values[a.slice(0, i)] = a.slice(i + 1); });

    const m = L.message(name, values);

    if (m.error) return log(`${name}: ${m.error}`, 'err');

    cheat(() => { log('Console: ' + JSON.stringify(m.msg)); once({ l: 'Console ' + name, s: 'G', tab: 'debug', ref: [name] }, args.join(' ') || 'done'); post(m.msg, name); });
  }

  // ---------- wiring ----------
  function fitStage() {
    const s = Math.min(innerWidth / 1920, innerHeight / 1080);

    $('#stage').style.transform = `scale(${s}) translate(-50%, -50%)`;
  }

  function wire() {
    const cmd = $('#cmd');
    const q = $('#q');

    addEventListener('resize', fitStage);
    q.oninput = () => search(q.value.trim());
    cmd.onkeydown = (e) => {
      if (e.key === 'Enter') { runCommand(cmd.value); cmd.value = ''; }
      if (e.key === 'ArrowUp' && state.history.length) { state.hpos = Math.min(state.hpos + 1, state.history.length - 1); cmd.value = state.history[state.hpos]; e.preventDefault(); }
      if (e.key === 'ArrowDown' && state.hpos >= 0) { state.hpos -= 1; cmd.value = state.hpos >= 0 ? state.history[state.hpos] : ''; e.preventDefault(); }
    };
    host.addEventListener('keydown', (e) => {
      const target = e.composedPath()[0];
      const typing = target && target.matches && target.matches('input, select');

      if (e.key === 'Escape') { send('close'); return; }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); q.focus(); q.select(); return; }
      if (typing) return;
      if (/^[0-9]$/.test(e.key)) { const i = (+e.key + 9) % 10; if (TABS[i]) openTab(TABS[i].id); }
    });
    $('#clearlog').onclick = () => { $('#log').innerHTML = ''; };
    $('#close').onclick = () => send('close');
  }

  TABS.push(
    { id: 'changes', name: 'Changes', title: 'Changes & Presets', zh: '变更与预设', page: 'changes', blurb: 'Every change you made, with what it was before. Undo one, save a set as a preset, or go back to before you cheated.', groups: [] },
    { id: 'index', name: 'Game index', zh: '内置目录', page: 'index', blurb: 'Every built-in GM tool in game build 1.1.19611, read off the game code, and where each one is in this menu. Panel commands run from here with their fields.', groups: [] }
  );
  window.TAB_ICONS.changes = '<path d="M4 12a8 8 0 1 0 2.5-5.8"/><path d="M4 4v4h4M12 8v4l3 2"/>';
  window.TAB_ICONS.index = '<path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"/>';

  (document.body || document.documentElement).appendChild(host);
  wire();

  // ---------- what the plugin calls ----------
  window.__slcheatmenu = {
    // st: { inGame, chinese, key, flags, holds, presets }
    open(st) {
      if (state.inGame !== !!st.inGame) { state.lists = {}; state.saveFile = null; }
      state.inGame = !!st.inGame;
      state.key = st.key || '';
      state.flags = st.flags || {};
      state.holds = st.holds || {};
      if (Array.isArray(st.presets)) state.presets = st.presets;
      if (!state.started) {
        state.started = true;
        allSettingKeys().forEach((k) => BASE.set(k, setting(k).get()));
        log(`Cheat Menu 0.2.1. ${CATALOG.length} built-in GM tools indexed.`, 'mod');
      }
      state.open = true;
      host.style.display = 'block';
      fitStage();
      refresh();
      renderVitals();
    },
    close() {
      state.open = false;
      host.style.display = 'none';
    },
    // The game ran a message or one of the mod's cheats (error null) or refused it; text is what a cheat handed back.
    result(id, error, text) {
      const p = pending[id];

      delete pending[id];
      if (p && p.onText) return p.onText(text || '', error);
      if (!error) {
        if (text) { const list = L.parseList(text); log(`${(p && p.label) || 'Cheat'}: ${list ? list.map((x) => x[0]).join(', ') || 'none' : text}`, 'mod'); }

        return;
      }

      log(((p && p.label) || 'GM') + ': ' + error, 'err');
      if (p && p.onFail) p.onFail();
      if (backup.step === 'listing' || backup.step === 'saving') finishBackup(false, error);
    },
    flags(f, holds) {
      const isSame = JSON.stringify(f || {}) === JSON.stringify(state.flags) && (!holds || JSON.stringify(holds) === JSON.stringify(state.holds));

      if (isSame) return;

      state.flags = f || {};
      if (holds) state.holds = holds;
      if (state.open && state.tab !== 'changes') refresh();
    },
    // What the game's GM handler sent back while the menu is open.
    readouts(list) {
      (list || []).forEach((msg) => {
        if (!msg) return;

        onBackupReadouts(msg);
        state.lastRead[L.readName(msg)] = msg;

        const saves = L.saveList(msg);

        if (saves) {
          state.lists[saves.of] = saves.list;
          listReq[saves.of] = false;
          if (saves.of === 'saves') state.saveFile = L.currentSave(msg) || state.saveFile;
          if (state.tab === 'saves') refresh();
        }
        if (Array.isArray(msg.attrs)) {
          msg.attrs.forEach((a) => { if (a && a.key != null) state.attrs[a.key] = typeof a.baseValue === 'number' ? a.baseValue : a.baseTotal; });
          // A maximum the menu could not read when it opened is "before cheating" once the game sends it.
          BASE.forEach((v, k) => { if (v === null && k.indexOf('attr:') === 0 && !(k in state.attrSet)) { const x = setting(k); if (x) BASE.set(k, x.get()); } });
        }

        const v = L.vitals(msg);

        if (v) {
          const was = state.vitals.length;

          state.vitals = v;
          renderVitals();
          if (!was && state.tab === 'survivor') refresh();

          return;
        }
        if (Array.isArray(msg.msgs)) { if (msg.msgs.length) log(L.describe(msg)); return; }
        if (QUIET.indexOf(L.readName(msg)) >= 0) return;

        log(L.describe(msg));
      });
    }
  };

  // Readouts the game repeats every second or so while the menu is open; the log would show nothing else.
  const QUIET = ['AllCharactersKeyArray', 'CharacterBaseConfig', 'SkillListInfo', 'ReportBuffInfo', 'ReportAuraInfo', 'ReportPassiveSkillInfo', 'Permissions', 'UIStack', 'NearbyFurnitureList', 'EnvironmentSnapshot', 'ReportAIStatus', 'ActionTypeList'];

  send('ready');
})();
