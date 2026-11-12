// The Cheat Menu panel, drawn over the game's web UI in its own shadow root so the game's styles and ids never meet
// ours. Every action goes to the plugin: a GM message the game's handler runs, or one of the mod's own cheats
// (an action or a hold) the plugin runs through the game's methods. Nothing here changes the game by itself.
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
  // Exiled's Toolkit's page API, once its script has run (see startWithToolkit).
  let etk = null;
  // Through the Toolkit's bridge. Nothing goes before its page API is there; the page says it is ready once it is.
  const send = (m) => { if (etk) etk.send(PREFIX, m); };

  // The game's Chinese font, from its web UI folder; the panel falls back to Windows fonts without it.
  const at = location.href.indexOf('/WebUI/');
  const res = (at >= 0 ? location.href.slice(0, at + 7) : '../../') + 'Res/GameResult/';
  const FONTS_ID = 'slcheatmenu-fonts';
  const FONTS = `@font-face{font-family:"SL Cheat Sans";src:url("${res}SourceHanSansSC-Regular-2.otf");font-weight:400 600}@font-face{font-family:"SL Cheat Sans";src:url("${res}SourceHanSansSC-Heavy-2.otf");font-weight:700 900}`;

  const host = document.createElement('div');

  host.id = 'slcheatmenu-host';
  host.style.cssText = 'position:fixed;left:0;top:0;right:0;bottom:0;z-index:2147483000;display:none;';

  const root = host.attachShadow({ mode: 'open' });
  const $ = (s, el) => (el || root).querySelector(s);
  const $$ = (s, el) => Array.from((el || root).querySelectorAll(s));
  const HAN = /[\u4e00-\u9fff]/;
  const h = (html) => {
    const t = document.createElement('template');

    t.innerHTML = html.trim();

    const el = t.content.firstChild;

    if (state.lang === 'zh' || HAN.test(html)) localize(el);

    return el;
  };
  const tr = (s) => L.tr(s, state.lang);

  // Puts every text and tooltip under el in the menu's language. Each keeps its English, so switching back works.
  // The game log (data-nolang) stays as the game wrote it.
  function localize(el) {
    if (!el) return el;

    const walk = document.createTreeWalker(el, 5, { acceptNode: (n) => n.nodeType === 1 && n.hasAttribute('data-nolang') ? 2 : 1 });

    for (let n = walk.currentNode; n; n = walk.nextNode()) {
      if (n.nodeType === 3) {
        const en = n.__en !== undefined ? n.__en : n.data;
        const out = L.tr(en, state.lang);

        if (out !== n.data) { n.__en = en; n.data = out; }
      } else if (n.nodeType === 1 && n.tagName !== 'STYLE') {
        ['title', 'placeholder'].forEach((a) => {
          if (!n.hasAttribute(a)) return;

          const key = '__en_' + a;
          const en = n[key] !== undefined ? n[key] : n.getAttribute(a);
          const out = L.tr(en, state.lang);

          if (out !== n.getAttribute(a)) { n[key] = en; n.setAttribute(a, out); }
        });
      }
    }

    return el;
  }
  const nameOf = (x) => (state.lang === 'zh' && x.zh) || x.n;
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const EXTRA = `
:host { all: initial; color: var(--steel); font-family: var(--ui); }
.c.nb { color: var(--steel-3); border: 1px dashed var(--steel-3); }
.c.nr { color: #ffb08f; border: 1px dashed rgba(255,176,143,.6); }
.row.off .btn, .row.off .sw, .row.off .num, .row.off .drop { opacity: .35; pointer-events: none; }
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
.row.stack { display: block; }
.tier { display: flex; flex-wrap: wrap; align-items: flex-end; gap: 8px 12px; margin-top: 8px; }
.fld { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.fld > .cap { font: 11px var(--mono); color: var(--steel-3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.fld > .fc { display: flex; align-items: center; gap: 6px; min-width: 0; min-height: 30px; }
.fld .num { width: 96px; }
.fld .dropw, .fld .drop { max-width: 100%; }
.fld.grow { flex: 1 1 260px; }
.fld.grow .num { width: 100%; }
.tier .tgo { margin-left: auto; display: flex; align-items: center; gap: 6px; }
.row details.more { margin-top: 8px; }
.row details.more summary { cursor: pointer; font: 11px var(--mono); color: var(--steel-3); }
.row details.more .tier { margin-top: 4px; }
.pick { display: flex; align-items: center; gap: 4px; flex: 1; min-width: 0; }
.pick .rl { width: 30px; padding: 0; display: inline-flex; align-items: center; justify-content: center; }
.pick .rl svg { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 2; }
.combo { position: relative; display: flex; align-items: center; flex: 1; min-width: 0; }
.cbin { width: 100%; min-width: 0; height: 30px; padding: 0 26px 0 8px; background: rgba(0,0,0,.45); border: 1px solid var(--line-2); font: 13px var(--ui); color: var(--steel); outline: 0; text-overflow: ellipsis; }
.cbin:focus { border-color: var(--amber); }
.cbin::placeholder { color: var(--steel-3); }
.combo > svg { position: absolute; right: 8px; top: 8px; width: 14px; height: 14px; fill: none; stroke: var(--steel-3); stroke-width: 2; pointer-events: none; }
.cbpop { position: absolute; left: 0; right: 0; top: calc(100% + 2px); max-height: 300px; overflow-y: auto; z-index: 20; background: #1d1a14; border: 1px solid var(--amber-d); box-shadow: 0 8px 24px rgba(0,0,0,.6); }
.cbpop.up { top: auto; bottom: calc(100% + 2px); }
.cbo { padding: 6px 10px; font: 12.5px/1.35 var(--ui); color: var(--steel-2); cursor: pointer; }
.cbo:hover { background: rgba(255,255,255,.05); }
.cbo.on { background: rgba(255,200,58,.14); color: var(--steel); }
.cbo.blank, .cbo.use { color: var(--amber); font: 12px var(--mono); }
.cbo.none { color: var(--steel-3); cursor: default; }
.cbmore { height: 1px; }
.group.popping { contain: none; content-visibility: visible; position: relative; z-index: 10; }
.dropw { position: relative; display: inline-flex; min-width: 0; }
.drop { position: relative; display: flex; align-items: center; height: 30px; min-width: 110px; max-width: 190px; padding: 0 26px 0 8px; background: rgba(0,0,0,.45); border: 1px solid var(--line-2); font: 13px var(--ui); color: var(--steel); text-align: left; cursor: pointer; outline: 0; }
.drop .dl { min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.drop > svg { position: absolute; right: 8px; top: 8px; width: 14px; height: 14px; fill: none; stroke: var(--steel-3); stroke-width: 2; pointer-events: none; }
.drop:hover, .drop:focus, .drop.open { border-color: var(--amber); }
.ctl .drop { max-width: 220px; }
.dropw .cbpop { right: auto; min-width: 100%; width: max-content; max-width: 420px; }
.ctl .dropw .cbpop { left: auto; right: 0; }
.view[data-f="mod"] .row:not(.added), .view[data-f="game"] .row.added, .view[data-f="mod"] .group.nomod, .view[data-f="game"] .group.nogame { display: none; }
.stbody { display: contents; }
.row .lab p.info { margin-top: 6px; padding-left: 8px; border-left: 2px solid var(--line-2); color: var(--steel-2); white-space: pre-line; }
`;

  const css = (window.__slcheatmenuCss || '').replace(/:root/g, ':host').replace(/html, body \{[^}]*\}/, '') + EXTRA;

  root.innerHTML = `<style>${css}</style>
<div id="stage">
  <div id="veil"></div>
  <section id="cm" aria-label="Cheat Menu">
    <header id="top">
      <div class="brand"><div class="mark">CHEAT<span>/</span>MENU</div><div class="sub"><span>Cheat and developer menu</span> - v0.2.11 - game 1.1.19611</div></div>
      <label class="search"><svg viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21"/></svg><input id="q" placeholder="Find any cheat or tool..." autocomplete="off"><kbd>Ctrl K</kbd></label>
      <div class="lamp" title="The game reports cheat evidence to its developer"><i></i><div><b>Telemetry on</b><span>the game reports cheat use</span></div></div>
      <button class="lang" id="lang" title="Switch between English and Chinese"><b data-l="en">EN</b><b data-l="zh">中文</b></button>
      <button class="x" id="close" title="Close"><span id="keyname"></span> <span>X</span></button>
    </header>
    <nav id="rail"></nav>
    <main id="main"><div id="tabhead"></div><div id="body"></div></main>
    <aside id="live">
      <div class="statusbox" id="status"></div>
      <div class="vitals" id="vitals"></div>
      <div class="loghead"><span>Game log</span><button id="clearlog">clear</button></div>
      <ol id="log" data-nolang></ol>
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

  const ITEMS = L.itemRows(window.GAMEITEMS);
  const ITEM_CATS = { 1: 'Food', 2: 'Medicine', 3: 'Books', 4: 'Electronics', 5: 'Leisure', 6: 'Tools', 8: 'Boxes', 9: 'Materials', 10: 'Seeds', 11: 'Fertilizer', 12: 'Traps', 13: 'Fuel', 14: 'Furniture', 15: 'Flowers', 16: 'Weapons & bait', 17: 'Robot modules', 18: 'Story items', 19: 'Decor', 20: 'Records', 21: 'Renovation', 22: 'Keys' };
  const ITEM_CHUNK = 120;
  const COLORS = { Satiety: '#c9a14a', Morale: '#d36aa0', Stamina: '#e2b23a', Health: '#d9534f', Vitality: '#7fbf6a' };

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
    started: false,
    lang: 'en'
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
  const ctlOf = (r) => r.__ctl || (r.__ctl = L.control(r, r.bind.spec));
  let HOLDS = null;

  ALLROWS.forEach((r) => { if (r.bind.kind === 'flag' && !FLAG_LABEL[r.bind.flag]) FLAG_LABEL[r.bind.flag] = r; });

  // ---------- log ----------
  function log(msg, kind) {
    const t = new Date().toTimeString().slice(0, 8);
    const tag = kind === 'mod' ? '[MOD]' : kind === 'err' ? '[ERR]' : '[GM]';
    const list = $('#log');
    const li = document.createElement('li');

    li.className = kind || '';
    li.innerHTML = `<time>${t}</time><span class="tg">${tag}</span> ${esc(msg)}`;
    if (state.lang === 'zh' || HAN.test(msg)) localize(li);
    list.prepend(li);
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
    if (!itemNames) itemNames = new Map(ITEMS.map((i) => [i.id, i.n]));

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

  // A toggle row that is one game message: a plain one flips the game's switch each time it is sent, a bool one
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
        if (m.msg) post(m.msg, r.l, () => { state.toggles[r.key] = !x; repaint(); });
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

  // A switch row from rows.js: a game message (its field set to on or off, or sent again to flip the game's
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

        const back = () => { state.toggles[r.key] = !x; repaint(); };

        state.toggles[r.key] = !!x;
        if (sp.act) return act(sp.act, L.actArgs(sp, !!x, specInputs(r)), r.l, (text, error) => error ? (log(`${r.l}: ${error}`, 'err'), back()) : text && log(`${r.l}: ${text}`, 'mod'));

        const m = L.specMessages(sp, sp.opts && sp.opts.length === 2 ? sp.opts[x ? 0 : 1][1] : !!x, specInputs(r));

        if (m.error) return log(`${r.l}: ${m.error}`, 'err');
        m.msgs.forEach((msg) => post(msg, r.l, back));
      },
      show: onOff
    };
  }

  // An attribute of the survivor, set with the game's ChangeAttr. Ratios start at the game's 0, so "as before"
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
        post(m.msg, r.l, () => { delete state.attrSet[key]; repaint(); });
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
      if (!HOLDS) { HOLDS = new Map(); ALLROWS.forEach((x) => { const k = rowSettingKey(x); if (k && k.indexOf('hold:') === 0 && !HOLDS.has(k)) HOLDS.set(k, x); }); }

      const r = HOLDS.get(key);

      return r ? holdSetting(r) : null;
    }

    const r = ROW.get(key.slice(key.indexOf(':') + 1));

    if (!r || rowSettingKey(r) !== key) return null;
    if (key.indexOf('attr:') === 0) return attrSetting(r);
    if (key.indexOf('attrs:') === 0) return attrsSetting(r);

    return r.bind.kind === 'spec' ? specToggleSetting(r) : toggleSetting(r);
  }

  function rowSettingKey(r) {
    if (!('__sk' in r)) r.__sk = settingKeyOf(r);

    return r.__sk;
  }

  function settingKeyOf(r) {
    const b = r.bind;

    if (b.kind === 'flag') return 'flag:' + b.flag;
    if (b.kind === 'spec') {
      const sp = b.spec;

      if (sp.hold) return 'hold:' + sp.hold;
      if (sp.attr) return 'attr:' + r.key;
      if (sp.attrs) return 'attrs:' + r.key;
      if (sp.page || sp.pulse || sp.readout) return null;

      return ctlOf(r) === 'tog' ? 'row:' + r.key : null;
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

    rail.innerHTML = TABS.map((t, i) => `${t.id === 'saves' || t.id === 'changes' ? '<div class="railsep"></div>' : ''}<button class="tab${t.danger ? ' danger' : ''}${t.id === state.tab ? ' on' : ''}" data-tab="${t.id}"><span class="k">${i < 10 ? (i + 1) % 10 : ''}</span><svg viewBox="0 0 24 24">${window.TAB_ICONS[t.id]}</svg><span class="t">${t.name}</span><span class="n">${countTools(t) || ''}</span></button>`).join('');
    if (state.lang === 'zh') localize(rail);
  }

  function paintRailCounts() {
    $$('.tab', $('#rail')).forEach((b) => setProp($('.n', b), 'textContent', String(countTools(TABS.find((t) => t.id === b.dataset.tab)) || '')));
  }

  function countTools(t) {
    if (t.custom === 'items') return ITEMS.length;
    if (t.id === 'changes') return state.journal.filter((j) => !j.undone).length;
    if (t.id === 'index') return CATALOG.length;

    return t.groups.reduce((n, g) => n + g.rows.length, 0);
  }

  // ---------- tabs ----------
  // Each tab's page is built once and kept. Opening it again only paints what changed since (switches, picks, typed
  // values), so a tab opens at once and keeps what was typed in it. A language switch, or a save loaded or left,
  // builds them again. Changes and Mod tests are built each time they open.
  const views = {};
  let showing = null;
  let kindCounts = null;

  function openTab(id) {
    const t = TABS.find((x) => x.id === id);

    state.tab = id;
    clearTimeout(searchTimer);
    $('#q').value = '';
    $$('.tab', $('#rail')).forEach((b) => b.classList.toggle('on', b.dataset.tab === id));
    renderHead(t);
    showTab(t);
    $('#body').scrollTop = 0;
  }

  function headCounts(t) {
    if (!t.__counts) {
      const rows = t.groups.flatMap((g) => g.rows);

      t.__counts = { all: rows.length, mod: rows.filter((r) => r.s === 'M').length, ed: rows.filter((r) => r.s === 'E' || r.s === 'X').length };
    }

    return t.__counts;
  }

  function renderHead(t) {
    const head = $('#tabhead');
    let counts = '';

    if (t.page === 'index') counts = kindCounts || (kindCounts = Object.keys(KIND).map((k) => `<span><b>${CATALOG.filter((c) => c.kind === k).length}</b> ${KIND[k].toLowerCase()}s</span>`).join(''));
    else if (t.page === 'changes') counts = `<span><b>${state.journal.length}</b> changes</span><span><b>${state.presets.length + 1}</b> presets</span>`;
    else if (t.custom === 'items') counts = `<span><b>${ITEMS.length}</b> items in the game</span>`;
    else if (!t.page) {
      const c = headCounts(t);

      counts = [['all', 'All', c.all], ['game', "Built-in", c.all - c.mod], ['mod', 'Added by mod', c.mod]].map(([k, l, n]) => `<button data-f="${k}" class="${state.filter === k ? 'on' : ''}"><b>${n}</b> ${l}</button>`).join('') + (c.ed ? `<span title="Editor-only or not wired: shown greyed, they do nothing in the release game"><b>${c.ed}</b> inactive</span>` : '');
    }

    head.innerHTML = `<h1>${t.title || t.name}</h1><p>${t.blurb}</p><div class="counts${t.page || t.custom === 'items' ? '' : ' filter'}">${counts}</div>`;
    localize(head);
  }

  const shown = (r) => state.filter === 'all' || (state.filter === 'mod' ? r.s === 'M' : r.s !== 'M');

  // The filter only hides rows and moves groups between the columns; nothing is built again.
  function setFilter(f) {
    state.filter = f;
    $$('#tabhead button[data-f]').forEach((b) => b.classList.toggle('on', b.dataset.f === f));
    if (showing && showing.cols) applyFilter(showing);
    $('#body').scrollTop = 0;
  }

  function refresh() {
    if (!state.open) return;

    const y = $('#body').scrollTop;

    renderRail();
    renderStatus();
    if ($('#q').value.trim()) search($('#q').value.trim()); else openTab(state.tab);
    $('#body').scrollTop = y;
  }

  // After a switch, a lock or the weather changes, only what shows it is updated: the page is not drawn again, so
  // what is typed and picked, and the scroll, stay as they are.
  function repaint() {
    if (!state.open) return;

    if (showing) syncSwitches(showing.el);
    renderStatus();
    renderVitals();
    paintRailCounts();
  }

  function syncSwitches(el) {
    $$('.sw[data-set]', el).forEach((sw) => { const x = setting(sw.dataset.set); if (x) sw.classList.toggle('on', !!x.get()); });
    $$('.sw[data-do="risky"]', el).forEach((sw) => sw.classList.toggle('on', state.riskyBackup));
    $$('.tile[data-w]', el).forEach((t) => t.classList.toggle('on', String(state.weather) === t.dataset.w));
  }

  // Everything on a page that shows a setting, a pick or a typed value, painted from them. Lists are only looked at
  // here, never read from the game.
  function syncView(el) {
    $$('.num[data-slot]', el).forEach((n) => { const r = rowOf(n); if (r) setProp(n, 'value', String(boxValue(r, n.dataset.slot))); });
    $$('.sw[data-slot]', el).forEach((sw) => { const r = rowOf(sw); if (r) sw.classList.toggle('on', swOn(r, sw.dataset.slot)); });
    $$('details.more', el).forEach((d) => { const r = rowOf(d); if (r && d.open !== !!ui(r).more) d.open = !!ui(r).more; });
    syncSwitches(el);
    peek(() => {
      $$('.cbin', el).forEach((i) => { if (i.__combo) i.__combo.paint(); });
      $$('.drop', el).forEach(paintDrop);
      $$('p.info', el).forEach(paintInfo);
    });
  }

  function dropViews() {
    closeDrop();
    if (showing && showing.search) showing.el.remove();
    Object.keys(views).forEach((k) => { views[k].el.remove(); delete views[k]; });
    showing = null;
  }

  function showView(v) {
    closeDrop();
    if (showing && showing !== v) {
      if (showing.search) showing.el.remove();
      else showing.el.hidden = true;
    }
    v.el.hidden = false;
    showing = v;
  }

  function showTab(t) {
    let v = views[t.id];

    $('#body').classList.toggle('flat', t.custom === 'items' || !!t.page);
    if (!v || t.page === 'changes' || t.page === 'modtests') {
      if (v) v.el.remove();
      v = views[t.id] = makeView(t);
    }
    showView(v);
    if (v.cols) applyFilter(v);
    if (v.stats) paintStats(v);
    syncView(v.el);
  }

  // A tab's own group (stats, weather, maps, neighbour) and its rough height.
  const CUSTOM = {
    stats: { make: (v) => statGroup(v), est: () => 104 + Math.max(1, state.vitals.length) * 40 },
    weather: { make: () => weatherGroup(), est: () => 104 + GAME.weather.length * 30 },
    maps: { make: () => mapGroup(), est: () => 78 + GAME.maps.length * 30 },
    people: { make: () => peopleGroup(), est: () => 104 }
  };

  function makeView(t) {
    const el = document.createElement('div');
    const v = { el, t };

    el.className = 'view';
    if (t.page === 'changes') changesPage(el);
    else if (t.page === 'index') indexPage(el);
    else if (t.page === 'modtests') modTestsPage(el);
    else if (t.custom === 'items') el.append(itemSpawner(), hydrate(build(t.groups.map(groupHtml).join(''))));
    else {
      const gs = t.groups.filter((g) => g.rows.length);
      const custom = CUSTOM[t.custom];

      el.innerHTML = '<div class="cols"><div class="col"></div><div class="col"></div></div>';
      v.cols = $$('.col', el);
      v.groups = [];
      if (custom) {
        const g = custom.make(v);

        g.classList.add('nomod');
        v.groups.push({ el: g, est: (f) => f === 'mod' ? 0 : custom.est() });
      }

      const els = Array.from(hydrate(build(gs.map(groupHtml).join(''))).children);

      gs.forEach((g, i) => v.groups.push({ el: els[i], est: groupEst(g) }));
    }
    $('#body').append(el);

    return v;
  }

  // A group's rough height under each filter; 0 when none of its rows show.
  function groupEst(g) {
    const sum = (keep) => {
      const rows = g.rows.filter(keep);

      return rows.length ? 48 + (g.note ? 30 : 0) + rows.reduce((n, r) => n + (isStacked(r) ? 120 : 56), 0) : 0;
    };
    const e = { all: sum(() => true), game: sum((r) => r.s !== 'M'), mod: sum((r) => r.s === 'M') };

    return (f) => e[f];
  }

  // Two columns, each group put in the shorter one by a rough height, so neither runs far past the other and a group
  // never splits across them. A group with nothing to show goes to the second column, hidden.
  function applyFilter(v) {
    const f = state.filter;

    if (v.f === f) return;
    v.f = f;
    v.el.dataset.f = f;
    L.balance(v.groups.map((g) => g.est(f))).forEach((i, k) => v.cols[i < 0 ? 1 : i].append(v.groups[k].el));
  }

  // ---------- building rows ----------
  // A page is one HTML string parsed once, put in the menu's language once. Its buttons and boxes have no handlers of
  // their own: the page body handles every click, key and edit and finds the row by its key.
  function build(html) {
    const t = document.createElement('template');

    t.innerHTML = html;
    if (state.lang === 'zh' || HAN.test(html)) localize(t.content);

    return t.content;
  }

  function hydrate(fr) {
    $$('.cbin', fr).forEach(bindCombo);
    $$('.row.formrow', fr).forEach((el) => {
      const r = ROW.get(el.dataset.key);
      const lab = $('.lab', el);

      r.bind.cmds.forEach((name) => lab.append(formEl(name, r)));
    });

    return fr;
  }

  const rowOf = (el) => { const row = el.closest('.row[data-key]'); return row ? ROW.get(row.dataset.key) : null; };

  // The field a control stands for: the row's own (main), one of its inputs (in:F) or one under More fields (more:F).
  function slotX(r, slot) {
    const sp = r.bind.spec;

    if (slot === 'main') return sp;

    const f = slot.slice(slot.indexOf(':') + 1);

    return (slot.indexOf('in:') === 0 ? sp.in || [] : moreFields(sp)).find((x) => x.f === f);
  }

  function groupHtml(g) {
    const mod = g.rows.some((r) => r.s === 'M');
    const game = g.rows.some((r) => r.s !== 'M');

    return `<section class="group${g.warn ? ' warn' : ''}${mod ? '' : ' nomod'}${game ? '' : ' nogame'}"><h2>${g.t}<em>${g.rows.length}</em></h2>${g.note ? `<div class="gnote">${g.note}</div>` : ''}${g.rows.map((r) => rowHtml(r)).join('')}</section>`;
  }

  // A row with fields of its own, or a list to search, puts them in a tier under its name, each with its caption on
  // top, so the name keeps the row's full width. A row with one small control keeps it on the right.
  function isStacked(r) {
    if (r.__stack !== undefined) return r.__stack;
    if (r.bind.kind !== 'spec') return (r.__stack = false);

    const sp = r.bind.spec;
    const kind = ctlOf(r);

    if (sp.page || sp.readout || sp.pulse || sp.hold) return (r.__stack = false);

    return (r.__stack = (sp.in || []).length > 0 || moreFields(sp).length > 0 || kind === 'text' || (kind === 'sel' && isCombo(sp)));
  }

  function rowHtml(r, extra) {
    const b = r.bind;
    const d = L.shownDesc(r.d);
    const sp = b.kind === 'spec' ? b.spec : null;
    const stack = isStacked(r);
    const cls = `row${r.s === 'E' || r.s === 'X' ? ' ed' : ''}${r.s === 'M' ? ' added' : ''}${b.kind === 'none' ? ' off' : ''}${b.kind === 'form' ? ' formrow' : ''}${sp ? ' specrow' : ''}${stack ? ' stack' : ''}`;
    // The game's words on what the picked buff, talent or plan does, kept in step with the list.
    const info = sp && sp.info ? `<p class="info" data-nolang data-of="${esc(sp.live || '*')}" hidden></p>` : '';
    const ctl = b.kind === 'form' ? '' : stack ? tierHtml(r) : `<div class="ctl">${sp ? specControlsHtml(r) : controlHtml(r)}</div>`;

    return `<div class="${cls}" data-key="${esc(r.key)}"><div class="lab"><b>${esc(r.l)}</b>${CHIP[r.s] || ''}${d ? `<p>${esc(d)}</p>` : ''}${info}${extra || ''}</div>${ctl}</div>`;
  }

  // The fields of one of the game's messages, typed in by hand, with a button that sends it.
  function formEl(name, r) {
    const sc = S[name];
    const fields = sc.f.map(([type, field]) => `<label><span>${esc(field)} <i>${esc(type)}</i></span>${type === 'bool'
      ? `<span class="dropw"><button class="drop" data-slot="form" data-f="${esc(field)}" data-v="false"><span class="dl" data-nolang>false</span>${CARET}</button></span>`
      : `<input class="num" data-f="${esc(field)}" placeholder="${esc(type)}">`}</label>`).join('');
    const el = h(`<div class="gmform"><header><code>${esc(name)}</code><span>msgHead ${sc.id}</span><button class="btn">Run</button></header><div class="fl">${fields || '<span class="none">No fields: it runs as it is.</span>'}</div></div>`);

    $('header .btn', el).onclick = () => {
      const values = {};

      $$('[data-f]', el).forEach((i) => {
        if (i.classList.contains('drop')) values[i.dataset.f] = i.dataset.v;
        else if (i.value.trim() !== '') values[i.dataset.f] = i.value;
      });

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
  // The lists one game readout fills together, and which readouts the menu asked for itself (those stay out of the log).
  const PRESUPPLY = ['shops', 'containers', 'scenes'];
  const asked = {};

  // A list that came in, or was read again, is painted where the page shows it now; other pages paint it when shown.
  function notify(of) {
    if (!showing) return;

    peek(() => $$(`[data-of="${of}"], [data-of="*"]`, showing.el).forEach((el) => {
      if (el.classList.contains('cbin')) { if (el.__combo) el.__combo.paint(); } else paintInfo(el);
    }));
  }

  // Reads a live list once; Reload reads it again. Most come from the plugin; the saves, backups, shops, slots and UI
  // actions are the game's readouts. A list the game never answers for shows as empty after a few seconds.
  function loadList(of) {
    const ofs = PRESUPPLY.indexOf(of) >= 0 ? PRESUPPLY : [of];
    const failed = () => ofs.forEach((o) => { if (!listReq[o]) return; listReq[o] = false; state.lists[o] = []; notify(o); });
    const gm = (msg, label) => { post(msg, label, failed); setTimeout(failed, 8000); };

    ofs.forEach((o) => { listReq[o] = true; });
    if (of === 'saves') return gm({ msgHead: S.ListGameSaves.id }, 'Save list');
    if (of === 'backups') return gm({ msgHead: S.ListBackups.id }, 'Backup list');
    if (ofs === PRESUPPLY) { asked.supply = true; return gm({ msgHead: S.GmPreSupplyQuery.id }, 'Shop list'); }
    if (of === 'homeslots') { asked.slots = true; return gm({ msgHead: S.GmQueryHomeSlots.id }, 'Slot list'); }
    if (of === 'uiactions') return gm({ msgHead: S.ListActionTypes.id, RequestId: 'cheatmenu-pick', Filter: '' }, 'UI action list');

    act('list', { of }, 'List', (text, error) => {
      listReq[of] = false;
      state.lists[of] = (!error && L.parseList(text)) || [];
      if (error) log(`List of ${of}: ${error}`, 'err');
      notify(of);
    });
  }

  function gotList(of, list) {
    listReq[of] = false;
    state.lists[of] = list;
    notify(of);
  }

  // Painting a page only looks at the lists it has; a list is read from the game when a picker is opened or a row is
  // run. Reading every list a page shows as it was drawn is what made opening a tab slow.
  let lazy = false;
  const peek = (fn) => { const was = lazy; lazy = true; try { return fn(); } finally { lazy = was; } };
  const listOf = (of) => { if (!lazy && !state.lists[of] && !listReq[of]) loadList(of); return state.lists[of] || null; };
  const ui = (r) => r.ui || (r.ui = {});
  const setProp = (el, k, v) => { if (el[k] !== v) el[k] = v; };

  // A pick is kept as {v, l, f} (value, label, file), so it survives the list being read again; '' is picked blank.
  const SHORT = 12;
  const entry = (o) => ({ v: o[1], l: o[0], f: o[2] });
  const same = (a, b) => a === b || (!!a && !!b && typeof a === 'object' && typeof b === 'object' && JSON.stringify(a) === JSON.stringify(b));
  const isCombo = (x) => !!(x.live || x.free || typeof x.opts === 'function' || (x.opts || []).length > SHORT);
  // The lists a picker's list comes from, which Reload reads again.
  const srcsOf = (x) => x.live ? [x.live] : (typeof x.opts === 'function' && x.opts.of) || [];

  // What a picker offers: a list read from the game, one worked out from the row's other fields (null until those
  // are filled in), or a fixed one.
  function listFor(r, x) {
    if (x.live) return listOf(x.live);
    if (typeof x.opts === 'function') return x.opts((f) => fieldValue(r, f), listOf);

    return x.opts || [];
  }

  // The entry picked in one of a row's lists, or null. A short fixed list starts on its first entry; a long one or
  // one read from the game starts empty. A pick no longer in the list is no pick, but one made while the list is
  // being read again stays.
  function pick(r, slot, x) {
    const s = ui(r)[slot];

    if (s === '') return null;

    const list = listFor(r, x);

    if (s === undefined) return !x.blank && !isCombo(x) && list && list.length ? entry(list[0]) : null;
    if (s.typed) return s;
    if (!list) return x.live ? s : null;

    const o = list.find((e) => same(e[1], s.v));

    return o ? entry(o) : null;
  }

  function picked(r, slot, x) {
    const p = pick(r, slot, x);

    return !p ? '' : x.pickFile && !p.typed ? p.f : p.v;
  }

  const pickedLabel = (r, slot, x) => { const p = pick(r, slot, x); return p ? String(p.l) : ''; };

  // A field's value by name, for a list worked out from it.
  function fieldValue(r, f) {
    const sp = r.bind.spec;

    if (f === sp.main) return mainValue(r);

    const x = (sp.in || []).find((y) => y.f === f);

    return x ? inValue(r, x, 'in:' + f) : '';
  }

  const CARET = '<svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>';
  const RELOAD = '<svg viewBox="0 0 24 24"><path d="M20 12a8 8 0 1 1-2.3-5.6"/><path d="M20 4v5h-5"/></svg>';
  const KEYS = new WeakMap();

  // A picker: a dropdown when the list is short and fixed, or a box that searches the list as you type.
  function pickerHtml(slot, x) {
    if (!isCombo(x)) return `<span class="dropw"><button class="drop" data-slot="${esc(slot)}"><span class="dl" data-nolang></span>${CARET}</button></span>`;

    const reload = srcsOf(x).length ? `<button class="btn ghost rl" data-do="rl" data-slot="${esc(slot)}" title="Read the list from the game again">${RELOAD}</button>` : '';

    return `<span class="pick"><span class="combo"><input class="cbin" autocomplete="off" spellcheck="false" data-slot="${esc(slot)}" data-of="${esc(x.live || '*')}">${CARET}</span>${reload}</span>`;
  }

  // Each entry's words in lower case, in English and the menu's language, worked out once per list.
  function keysOf(list) {
    let k = KEYS.get(list);

    if (!k || k.lang !== state.lang) {
      k = { lang: state.lang, keys: list.map((o) => { const en = String(o[0]); const t = tr(en); return (t === en ? en : en + ' ' + t).toLowerCase(); }) };
      KEYS.set(list, k);
    }

    return k.keys;
  }

  // Keeps an entry of an open list in view by scrolling the list only, never the page under it.
  function scrollInPop(pop, el) {
    if (el.offsetTop < pop.scrollTop) pop.scrollTop = el.offsetTop;
    else if (el.offsetTop + el.offsetHeight > pop.scrollTop + pop.clientHeight) pop.scrollTop = el.offsetTop + el.offsetHeight - pop.clientHeight;
  }

  // Opens a list upward when the panel has more room above the box than below it.
  function flip(pop, box) {
    const b = $('#body').getBoundingClientRect();
    const w = box.getBoundingClientRect();

    if (b.bottom - w.bottom < 260 && w.top - b.top > b.bottom - w.bottom) pop.classList.add('up');
  }

  // The search box. Typing filters the list (every word has to match); the arrows and Enter pick; a number the list
  // does not have can still be used as an id, and a list marked free takes any text. Only the first 60 matches are
  // drawn; more are drawn as the list scrolls.
  function bindCombo(inp) {
    const r = rowOf(inp);

    if (!r) return;

    const slot = inp.dataset.slot;
    const x = slotX(r, slot);
    const box = inp.parentNode;
    const u = ui(r);
    let pop = null;
    let group = null;
    let io = null;
    let q = '';
    let hits = [];
    let at = 0;
    let drawn = 0;
    let typed = null;

    const paintBox = () => peek(() => {
      const list = listFor(r, x);
      const p = pick(r, slot, x);
      const v = p ? tr(String(p.l)) : '';

      setProp(inp, 'value', v);
      setProp(inp, 'placeholder', tr(L.pickHint(list, srcsOf(x).some((o) => listReq[o]), x)));
      setProp(inp, 'title', v);
    });
    const line = (k, list) => {
      const n = hits[k];
      const cls = `cbo${k === at ? ' on' : ''}${n === -1 ? ' blank' : n === -2 ? ' use' : ''}`;
      const text = n === -1 ? tr(x.blank) : n === -2 ? typed.use : tr(String(list[n][0]));

      return `<div class="${cls}" data-k="${k}">${esc(text)}</div>`;
    };
    const more = () => {
      const list = listFor(r, x) || [];
      const end = Math.min(hits.length, drawn + 60);
      const old = $('.cbmore', pop);
      let html = '';

      for (let k = drawn; k < end; k++) html += line(k, list);
      if (old) old.remove();
      pop.insertAdjacentHTML('beforeend', html + (end < hits.length ? '<div class="cbmore"></div>' : ''));
      drawn = end;

      const marker = $('.cbmore', pop);

      if (io) { io.disconnect(); if (marker) io.observe(marker); }
    };
    const filter = () => {
      const list = listFor(r, x);
      const all = list || [];
      const keys = keysOf(all);
      const text = q.trim();
      const words = text.toLowerCase().split(/\s+/).filter(Boolean);
      const id = /^-?\d+$/.test(text) && all.length && typeof all[0][1] === 'number' ? Number(text) : null;

      hits = [];
      typed = null;
      if (id !== null && !all.some((o) => o[1] === id)) typed = { v: id, l: `id ${id}`, use: `${tr('Use id')} ${id}`, typed: true };
      else if (x.free && text && !all.some((o) => String(o[1]) === text)) typed = { v: text, l: text, use: `${tr('Use')} "${text}"`, typed: true };
      if (typed) hits.push(-2);
      if (!words.length && x.blank) hits.push(-1);
      for (let i = 0; i < all.length; i++) if (words.every((w) => keys[i].indexOf(w) >= 0)) hits.push(i);
      at = Math.max(0, hits.findIndex((n) => n >= 0));
      if (!hits.length || hits[at] < 0) at = 0;
      drawn = 0;
      pop.innerHTML = '';
      pop.scrollTop = 0;
      if (!hits.length) pop.innerHTML = `<div class="cbo none">${esc(tr(list ? 'Nothing matches' : !x.wait || srcsOf(x).some((o) => listReq[o]) ? '(reading the game)' : x.wait))}</div>`;
      else more();
    };
    const mark = () => {
      const was = $('.cbo.on', pop);
      const now = $(`.cbo[data-k="${at}"]`, pop);

      if (was) was.classList.remove('on');
      if (now) { now.classList.add('on'); scrollInPop(pop, now); }
    };
    const open = () => {
      if (pop) return;

      closeDrop();
      pop = h('<div class="cbpop" data-nolang></div>');
      pop.onmousedown = (e) => e.preventDefault();
      pop.onclick = (e) => { const o = e.target.closest && e.target.closest('.cbo[data-k]'); if (o) choose(+o.dataset.k); };
      box.append(pop);
      group = box.closest('.group');
      if (group) group.classList.add('popping');
      flip(pop, box);
      if (window.IntersectionObserver) io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting) && drawn < hits.length) more(); }, { root: pop, rootMargin: '200px' });
      else pop.onscroll = () => { if (drawn < hits.length && pop.scrollTop + pop.clientHeight > pop.scrollHeight - 200) more(); };
      q = '';
      filter();
    };
    const close = () => {
      if (!pop) return;
      if (io) io.disconnect();
      io = null;
      pop.remove();
      pop = null;
      if (group) group.classList.remove('popping');
      group = null;
    };
    const choose = (k) => {
      const n = hits[k];
      const list = listFor(r, x) || [];

      if (n === undefined) return;
      u[slot] = n === -1 ? '' : n === -2 ? { v: typed.v, l: typed.l, typed: true } : entry(list[n]);
      close();
      paintBox();
      inp.dispatchEvent(new Event('change', { bubbles: true }));
    };

    inp.onfocus = () => { open(); inp.select(); };
    inp.onclick = () => { if (!pop) open(); };
    inp.oninput = () => { if (!pop) open(); q = inp.value; filter(); };
    inp.onblur = () => { close(); paintBox(); };
    inp.onkeydown = (e) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (!pop) return open();
        at = Math.max(0, Math.min(hits.length - 1, at + (e.key === 'ArrowDown' ? 1 : -1)));
        while (at >= drawn && drawn < hits.length) more();
        mark();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (pop && hits.length) choose(at);
      } else if (e.key === 'Escape') {
        if (pop) { e.stopPropagation(); close(); paintBox(); }
      } else if (e.key === 'Tab') {
        close();
      }
    };
    inp.__combo = { paint: () => { if (pop) filter(); else paintBox(); } };
  }

  // ---------- the dropdown ----------
  // A short fixed list is drawn by the page itself. The browser's own dropdown is slow to open in the game and shows
  // what it held the last time for a moment before it updates.
  let drop = null;

  // What a dropdown offers and how a choice is kept: a true/false field of a hand-typed message, a row's own list
  // (cur), or one of a row's fields.
  function dropModel(el) {
    const slot = el.dataset.slot;

    if (slot === 'form') return { labels: ['false', 'true'], lead: 0, at: el.dataset.v === 'true' ? 1 : 0, set: (k) => { el.dataset.v = k ? 'true' : 'false'; } };

    const r = rowOf(el);

    if (slot === 'cur') return { labels: r.o.map((o) => tr(o)), lead: 0, at: Math.max(0, r.o.indexOf(r.cur)), set: (k) => { r.cur = r.o[k]; } };

    const x = slotX(r, slot);
    const list = listFor(r, x) || [];
    const p = pick(r, slot, x);
    const lead = x.blank ? 1 : 0;
    const i = p ? list.findIndex((o) => same(o[1], p.v)) : -1;

    return { labels: (x.blank ? [tr(x.blank)] : []).concat(list.map((o) => tr(String(o[0])))), lead, at: i >= 0 ? i + lead : 0, set: (k) => { ui(r)[slot] = k < lead ? '' : entry(list[k - lead]); } };
  }

  function paintDrop(el) {
    const slot = el.dataset.slot;
    let text = '';

    if (slot === 'form') text = el.dataset.v;
    else {
      const r = rowOf(el);

      if (!r) return;
      if (slot === 'cur') text = tr(r.cur);
      else {
        const x = slotX(r, slot);
        const p = peek(() => pick(r, slot, x));

        text = p ? tr(String(p.l)) : x.blank ? tr(x.blank) : '';
      }
    }
    setProp($('.dl', el), 'textContent', text);
    setProp(el, 'title', text);
  }

  function openDrop(el) {
    closeDrop();

    const m = dropModel(el);
    const wrap = el.parentNode;
    const pop = document.createElement('div');

    pop.className = 'cbpop';
    pop.setAttribute('data-nolang', '');
    pop.innerHTML = m.labels.map((l, k) => `<div class="cbo${k === m.at ? ' on' : ''}${k < m.lead ? ' blank' : ''}" data-k="${k}">${esc(l)}</div>`).join('') || `<div class="cbo none">${esc(tr('(none found)'))}</div>`;
    pop.onmousedown = (e) => e.preventDefault();
    pop.onclick = (e) => { const o = e.target.closest && e.target.closest('.cbo[data-k]'); if (o) chooseDrop(+o.dataset.k); };
    wrap.append(pop);
    drop = { el, pop, m, at: m.at, group: wrap.closest('.group') };
    if (drop.group) drop.group.classList.add('popping');
    flip(pop, wrap);
    el.classList.add('open');

    const on = pop.children[m.at];

    if (on) pop.scrollTop = Math.max(0, on.offsetTop - (pop.clientHeight - on.offsetHeight) / 2);
  }

  function closeDrop() {
    if (!drop) return;

    drop.pop.remove();
    drop.el.classList.remove('open');
    if (drop.group) drop.group.classList.remove('popping');
    drop = null;
  }

  function chooseDrop(k) {
    const d = drop;

    if (!d || !(k >= 0 && k < d.m.labels.length)) return;
    d.m.set(k);
    closeDrop();
    paintDrop(d.el);
    d.el.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function markDrop(k) {
    if (!drop || !drop.m.labels.length) return;

    const was = drop.pop.children[drop.at];

    drop.at = Math.max(0, Math.min(drop.m.labels.length - 1, k));

    const now = drop.pop.children[drop.at];

    if (was) was.classList.remove('on');
    if (now) { now.classList.add('on'); scrollInPop(drop.pop, now); }
  }

  // ---------- fields ----------
  // A switch in "More fields" also has the game's default, which sends nothing.
  const TRI = [['on', true], ['off', false]];
  const MORE = new WeakMap();

  // The fields of a game message a row leaves out of its own inputs; blank ones are not sent. A row with a fixed Op
  // runs one of the game's sub-commands, which reads only the fields the row shows.
  function moreFields(sp) {
    let more = MORE.get(sp);

    if (more) return more;
    if (!sp.cmd || sp.more === false || !S[sp.cmd] || (sp.fix && 'Op' in sp.fix)) more = [];
    else {
      const used = new Set(['RequestId', sp.main, ...Object.keys(sp.fix || {}), ...(sp.in || []).flatMap((x) => [x.f].concat(x.covers || [])), ...(Array.isArray(sp.opts) ? sp.opts : []).flatMap((o) => o[1] && typeof o[1] === 'object' ? Object.keys(o[1]) : []), ...(sp.each || []).flatMap((e) => Object.keys(e))]);

      more = S[sp.cmd].f.filter(([, f]) => !used.has(f)).map(([type, f]) => type === 'bool' ? { f, l: L.humanize(f), opts: TRI, blank: '(game default)' } : { f, l: L.humanize(f), v: '', ph: type });
    }
    MORE.set(sp, more);

    return more;
  }

  // One of the row's other inputs: a switch, a pick or what is typed.
  function inValue(r, x, slot) {
    if (x.t === 'bool') return ui(r)[slot] !== undefined ? !!ui(r)[slot] : !!x.v;
    if (x.opts || x.live) return picked(r, slot, x);

    const u = ui(r)[slot];

    return u !== undefined ? u : x.v == null ? '' : x.v;
  }

  // The row's other inputs by field name, from what is typed and picked.
  function specInputs(r) {
    const sp = r.bind.spec;
    const out = {};

    (sp.in || []).forEach((x) => { out[x.f] = inValue(r, x, 'in:' + x.f); });
    moreFields(sp).forEach((x) => { out[x.f] = inValue(r, x, 'more:' + x.f); });

    return out;
  }

  // What a typed box shows: what was typed, else the setting it changes, else the row's starting value.
  function boxValue(r, slot) {
    const u = ui(r)[slot];

    if (u !== undefined) return u;
    if (slot === 'main') {
      const sp = r.bind.spec;
      const key = rowSettingKey(r);
      const x = key && setting(key);
      const v = x ? x.get() : sp.v !== undefined ? sp.v : r.v;

      return v == null ? '' : v;
    }

    const x = slotX(r, slot);

    return slot.indexOf('in:') === 0 && x && x.v != null ? x.v : '';
  }

  const swOn = (r, slot) => { const u = ui(r)[slot]; return u !== undefined ? !!u : !!(slotX(r, slot) || {}).v; };

  // One field in a row's tier: its caption on top, the control under it.
  const fieldHtml = (cap, inner, grow) => `<div class="fld${grow ? ' grow' : ''}">${cap ? `<span class="cap">${esc(cap)}</span>` : ''}<span class="fc">${inner}</span></div>`;

  function inputHtml(x, slot) {
    const cap = x.l || x.f;

    if (x.t === 'bool') return fieldHtml(cap, `<button class="sw" data-do="sw" data-slot="${esc(slot)}" aria-label="${esc(cap)}"></button>`);
    if (x.opts || x.live) return fieldHtml(cap, pickerHtml(slot, x), isCombo(x));

    return fieldHtml(cap, `<input class="num${x.t === 'text' ? ' wide' : ''}" data-slot="${esc(slot)}"${x.ph ? ` placeholder="${esc(x.ph)}"` : ''}>`, x.t === 'text');
  }

  // A list row starts on the setting it changes.
  function seedMain(r) {
    const sp = r.bind.spec;
    const key = rowSettingKey(r);
    const x = key && setting(key);

    if (x && ui(r).main === undefined && Array.isArray(sp.opts)) { const o = sp.opts.find((e) => e[1] === x.get()); if (o) ui(r).main = entry(o); }
  }

  // The row's own control: a list or a box. Its value is painted in when the page is shown.
  function mainHtml(r, kind) {
    const sp = r.bind.spec;

    if (kind === 'sel') { seedMain(r); return pickerHtml('main', sp); }
    if (kind === 'num' || kind === 'text') return `<input class="num${kind === 'text' ? ' wide' : ''}" data-slot="main">${r.u ? `<span class="unit">${esc(r.u)}</span>` : ''}`;

    return '';
  }

  const runBtn = (r) => { const sp = r.bind.spec; return `<button class="btn${r.red || sp.risky ? ' red' : ''}" data-do="spec">${esc(sp.readout ? 'Show' : r.b || 'Run')}</button>`; };

  // A stacked row's controls: the row's own field and its inputs side by side under its name, wrapping when they do
  // not fit, then the button; the message's other fields fold away under "More fields".
  function tierHtml(r) {
    const sp = r.bind.spec;
    const kind = ctlOf(r);
    const ins = (sp.in || []).map((x) => inputHtml(x, 'in:' + x.f));
    const main = kind === 'sel' ? fieldHtml(sp.ml || '', pickerHtml('main', sp), isCombo(sp)) : kind === 'num' || kind === 'text' ? fieldHtml(sp.ml || '', mainHtml(r, kind), kind === 'text') : '';
    const more = moreFields(sp);

    if (main) ins.splice(Math.min(sp.mainAt || 0, ins.length), 0, main);

    return `<div class="tier">${ins.join('')}<div class="tgo">${kind === 'tog' ? controlHtml(r) : runBtn(r)}</div></div>${more.length ? `<details class="more"${ui(r).more ? ' open' : ''}><summary>More fields (${more.length})</summary><div class="tier">${more.map((x) => inputHtml(x, 'more:' + x.f)).join('')}</div></details>` : ''}`;
  }

  function specControlsHtml(r) {
    const sp = r.bind.spec;
    const kind = ctlOf(r);

    if (sp.page === 'riskybackup') return `<button class="sw" data-do="risky" aria-label="${esc(r.l)}"></button>`;
    if (kind === 'tog') return controlHtml(r);

    return mainHtml(r, kind) + runBtn(r);
  }

  // The value of a row's own control.
  function mainValue(r) {
    const sp = r.bind.spec;
    const kind = ctlOf(r);

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

  // How a run reads in the log and the changes list: picks by name, the other fields by their captions, in the order
  // the row shows them.
  function runText(r, main, kind) {
    const sp = r.bind.spec;
    const out = [];
    const one = (x, slot) => {
      const v = inValue(r, x, slot);
      const l = tr(x.l || x.f);

      if (x.t === 'bool') return out.push(`${l}: ${tr(onOff(v))}`);
      if (x.opts || x.live) { const p = pickedLabel(r, slot, x); if (p) out.push(x.opts === TRI ? `${l}: ${tr(p)}` : tr(p)); return; }
      if (v !== '' && v != null) out.push(`${l} ${v}`);
    };

    (sp.in || []).forEach((x) => one(x, 'in:' + x.f));

    const own = kind === 'sel' ? tr(pickedLabel(r, 'main', sp)) : main === undefined || main === '' ? '' : (sp.ml ? tr(sp.ml) + ' ' : '') + main + (r.u ? ' ' + r.u : '');

    if (own) out.splice(Math.min(sp.mainAt || 0, out.length), 0, own);
    moreFields(sp).forEach((x) => one(x, 'more:' + x.f));

    return out.join(', ') || 'done';
  }

  function runSpec(r) {
    const sp = r.bind.spec;
    const kind = ctlOf(r);
    const main = mainValue(r);
    const inputs = specInputs(r);
    const what = runText(r, main, kind);
    const isRisky = !!(sp.risky || r.red);
    const missing = (sp.in || []).find((x) => x.need && inputs[x.f] === '');

    if (sp.readout) return showReadout(sp.readout);
    if (kind === 'sel' && main === '' && !sp.blank) return log(`${r.l}: pick one first`, 'err');
    if (missing) return log(`${r.l}: pick ${tr(missing.l || missing.f)} first`, 'err');
    if (sp.cmd === 'ListActionTypes') state.askedActions = true;
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
        repaint();
      });
    }
    if (sp.act) {
      const args = L.actArgs(sp, main, inputs);

      const reread = sp.reread && ((text, error) => {
        if (error) return log(`${r.l}: ${error}`, 'err');
        if (text) log(`${r.l}: ${text}`, 'mod');
        delete state.lists[sp.live];
        loadList(sp.live);
      });

      return guarded(() => { log(`${r.l}: ${what}`); once(r, what); act(sp.act, args, r.l, reread); }, isRisky);
    }

    const m = L.specMessages(sp, main, inputs);

    if (m.error) return log(`${r.l}: ${m.error}`, 'err');

    guarded(() => { log(`${r.l}: ${what}`); once(r, what); m.msgs.forEach((msg) => post(msg, r.l)); }, isRisky);
  }

  // A row from tabs.js: a switch, a box or a list with a button, or a button.
  function controlHtml(r) {
    if (r.k === 'tog') {
      const key = rowSettingKey(r);

      return `<button class="sw" data-do="tog" aria-label="${esc(r.l)}"${key ? ` data-set="${esc(key)}"` : ''}></button>`;
    }

    const fire = `<button class="btn${r.red ? ' red' : ''}" data-do="fire">${esc(r.b)}</button>`;

    if (r.k === 'num') return `<input class="num" value="${esc(r.v)}">${r.u ? `<span class="unit">${esc(r.u)}</span>` : ''}${fire}`;
    if (r.k === 'sel') return `<span class="dropw"><button class="drop" data-slot="cur"><span class="dl" data-nolang></span>${CARET}</button></span>${fire}`;

    return fire;
  }

  function togRow(r) {
    const key = rowSettingKey(r);
    const x = key && setting(key);

    if (!x) return;

    const was = x.get();

    cheat(() => {
      x.set(!was);
      log(`${r.l}: ${!was ? 'on' : 'off'}`);
      journal(x, x.show(was), x.show(!was), () => x.set(was), x.key);
      repaint();
    });
  }

  function fireRow(r, btn) {
    const b = r.bind;

    if (b.kind !== 'cmd') return;

    let value = null;
    let shownValue = 'done';

    if (r.k === 'num') { const n = $('.num', btn.parentNode); value = n.value; shownValue = n.value + (r.u ? ' ' + r.u : ''); }
    else if (r.k === 'sel') { value = r.cur; shownValue = r.cur; }

    const m = L.rowMessage(b, value);

    if (m.error) return log(`${r.l}: ${m.error}`, 'err');

    guarded(() => {
      log(`${r.l}: ${shownValue}`);
      once(r, shownValue);
      post(m.msg, r.l);
    }, !!r.red);
  }

  // Every click on a row's controls, by what the control does.
  function onBodyClick(e) {
    const t = e.target.closest && e.target.closest('[data-do], .drop');

    if (!t) return;
    if (t.classList.contains('drop')) return drop && drop.el === t ? closeDrop() : openDrop(t);

    const r = rowOf(t);

    if (!r) return;

    const slot = t.dataset.slot;

    switch (t.dataset.do) {
      case 'spec': return runSpec(r);
      case 'fire': return fireRow(r, t);
      case 'tog': return togRow(r);
      case 'risky':
        state.riskyBackup = !state.riskyBackup;
        log(`${r.l}: ${onOff(state.riskyBackup)}`, 'mod');
        t.classList.toggle('on', state.riskyBackup);
        return;
      case 'sw': {
        const on = !swOn(r, slot);

        ui(r)[slot] = on;
        t.classList.toggle('on', on);
        t.dispatchEvent(new Event('change', { bubbles: true }));
        return;
      }
      case 'rl':
        // A list read from the game, or worked out from ones that are, can be read again.
        srcsOf(slotX(r, slot)).forEach((of) => { delete state.lists[of]; loadList(of); notify(of); });
    }
  }

  function onBodyKey(e) {
    if (e.key === 'Enter' && e.target.matches && e.target.matches('input.num')) return pressRowButton(e.target);

    const el = e.target.closest && e.target.closest('.drop');

    if (!el) return;

    const open = drop && drop.el === el;

    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!open) return openDrop(el);
      markDrop(drop.at + (e.key === 'ArrowDown' ? 1 : -1));
    } else if (e.key === 'Enter') {
      if (open) { e.preventDefault(); chooseDrop(drop.at); }
    } else if (e.key === 'Escape') {
      if (open) { e.stopPropagation(); closeDrop(); }
    } else if (e.key === 'Tab') {
      closeDrop();
    }
  }

  // Enter in a row's box does what the row's button does.
  function pressRowButton(box) {
    const row = box.closest('.row');
    const button = row && $('[data-do="fire"], [data-do="spec"]', row);

    if (button) button.click();
  }

  // A pick can change what another list on the row offers (a shop's goods, the slots a furniture fits), and what the
  // row says about it.
  function onBodyChange(e) {
    const row = e.target.closest && e.target.closest('.row[data-key]');

    if (!row) return;

    peek(() => {
      $$('.cbin', row).forEach((i) => { if (i !== e.target && i.__combo) i.__combo.paint(); });
      $$('p.info', row).forEach(paintInfo);
    });
  }

  function paintInfo(p) {
    const r = rowOf(p);

    if (!r) return;

    const sp = r.bind.spec;
    const text = peek(() => L.detail(sp.info, picked(r, 'main', sp), state.lang)) || '';

    setProp(p, 'textContent', text);
    setProp(p, 'hidden', !text);
  }

  // ---------- custom groups ----------
  function statGroup(v) {
    const g = h(`<section class="group"><h2>Stats<em>drag to set</em></h2><div class="row"><div class="lab"><b>Lock all stats where they are</b>${CHIP.G}<p>The game's attribute lock (LockCharacterAttr).</p></div><div class="ctl"><button class="sw" data-set="flag:LockCharacterAttr"></button></div></div><div class="stbody"></div></section>`);

    $('.sw', g).onclick = () => {
      const x = flagSetting('LockCharacterAttr');
      const was = x.get();

      cheat(() => { x.set(!was); log(`Stat lock: ${!was ? 'on' : 'off'}`); journal(x, x.show(was), x.show(!was), () => x.set(was), x.key); repaint(); });
    };
    v.stats = $('.stbody', g);

    return g;
  }

  // The stat bars, drawn again each time the tab is shown.
  function paintStats(v) {
    const body = v.stats;

    body.innerHTML = '';
    if (!state.vitals.length) body.append(h(`<div class="wait">${state.inGame ? 'Waiting for the game to send the survivor\'s stats.' : 'Load a save to see and set the stats.'}</div>`));
    state.vitals.forEach((x) => body.append(statRow(x)));
  }

  function statRow(v) {
    const max = v.max || Math.max(100, v.v);
    const el = h(`<div class="stat"><b>${v.k}</b><div class="bar" style="--col:${COLORS[v.k] || '#ccc'}"><i style="width:${Math.min(100, v.v / max * 100)}%"></i></div><span class="v">${Math.round(v.v)}/${Math.round(max)}</span><span></span></div>`);
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
    const g = h(`<section class="group"><h2>Weather<em>${GAME.weather.length}</em></h2><div class="row"><div class="lab"><b>Back to the forecast</b>${CHIP.G}<p>Hands the weather back to the game's tables (ResetWeather).</p></div><div class="ctl"><button class="btn ghost">Reset</button></div></div><div class="tiles">${GAME.weather.map((w, i) => `<button class="tile" data-w="${w.id}" data-i="${i}"><img src="${w.i}" alt="" loading="lazy" decoding="async"><span>${esc(nameOf(w))}</span></button>`).join('')}</div></section>`);
    const setW = (id) => {
      const was = weatherSetting.get();

      cheat(() => {
        weatherSetting.set(id);
        log(id === null ? 'Weather back to the forecast' : `Weather set: ${weatherSetting.show(id)} (id ${id})`);
        journal(weatherSetting, weatherSetting.show(was), weatherSetting.show(id), () => weatherSetting.set(was), 'weather');
        repaint();
      });
    };

    $('.btn', g).onclick = () => setW(null);
    $('.tiles', g).onclick = (e) => { const t = e.target.closest && e.target.closest('.tile'); if (t) setW(GAME.weather[+t.dataset.i].id); };

    return g;
  }

  function mapGroup() {
    const g = h(`<section class="group"><h2>Go there now<em>${GAME.maps.length}</em></h2><div class="gnote" style="color:var(--steel-3)">Skips the map, the day and time rules, and the trip (BypassEnterExplore).</div><div class="tiles maps">${GAME.maps.map((m, i) => `<button class="tile" data-i="${i}">${m.i ? `<img src="${m.i}" alt="" loading="lazy" decoding="async">` : ''}<span>${esc(nameOf(m))}</span><small>${m.id}</small></button>`).join('')}</div></section>`);

    $('.tiles', g).onclick = (e) => {
      const t = e.target.closest && e.target.closest('.tile');

      if (!t) return;

      const m = GAME.maps[+t.dataset.i];

      cheat(() => {
        log(`Enter explore: ${m.n} (map point ${m.id})`);
        once({ l: 'Go there now', s: 'G', tab: 'explore', ref: ['BypassEnterExplore'] }, m.n);
        post({ msgHead: S.BypassEnterExplore.id, MapPointId: m.id }, 'Go there now');
      });
    };

    return g;
  }

  function peopleGroup() {
    const g = h(`<section class="group"><h2>Neighbour<em>quick</em></h2><div class="row"><div class="lab"><b>Affinity and rescue</b>${CHIP.G}<p>Adds to the neighbour's affinity or rescue progress (AddNeighborAffinity, AddNeighborRescueProgress).</p></div><div class="ctl"><input class="num" value="10"><button class="btn" data-c="AddNeighborAffinity">Affinity</button><button class="btn" data-c="AddNeighborRescueProgress">Rescue</button></div></div></section>`);
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
  // Every item in the game, by category or by search. A category or a search can find thousands, so the grid draws
  // them a chunk at a time as it scrolls.
  function itemSpawner() {
    const cats = Object.keys(ITEM_CATS).map(Number).filter((c) => ITEMS.some((i) => i.c === c));
    const wrap = h(`<div class="spawner"><div><div class="chips">${cats.map((c) => `<button class="chip${c === state.cat ? ' on' : ''}" data-c="${c}">${ITEM_CATS[c]}</button>`).join('')}</div><label class="search" style="margin:0 0 12px;max-width:none"><svg viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21"/></svg><input id="iq" placeholder="Search items by name, Chinese name or id" autocomplete="off" spellcheck="false"></label><div class="igrid"></div></div><div class="detail"></div></div>`);
    const chips = $('.chips', wrap);
    const grid = $('.igrid', wrap);
    const iq = $('#iq', wrap);
    let list = [];
    let drawn = 0;
    let timer = null;
    let io = null;

    const cell = (it, i) => `<button class="cell${state.item === it ? ' on' : ''}" data-i="${i}" title="${esc(nameOf(it))} - ${it.id}">${it.i ? `<img src="${it.i}" alt="" loading="lazy" decoding="async">` : ''}<span>${esc(nameOf(it))}</span></button>`;

    const more = () => {
      const end = Math.min(list.length, drawn + ITEM_CHUNK);
      const old = $('.imore', grid);
      let html = '';

      for (let i = drawn; i < end; i++) html += cell(list[i], i);
      if (old) old.remove();
      grid.insertAdjacentHTML('beforeend', html + (end < list.length ? '<div class="imore"></div>' : ''));
      drawn = end;

      const marker = $('.imore', grid);

      if (io) { io.disconnect(); if (marker) io.observe(marker); }
    };

    const paintGrid = () => {
      const q = iq.value.trim();

      clearTimeout(timer);
      list = q ? L.findItems(ITEMS, q) : ITEMS.filter((i) => i.c === state.cat);
      drawn = 0;
      grid.innerHTML = '';
      grid.scrollTop = 0;
      if (list.length) return more();

      const isId = /^\d+$/.test(q);

      grid.innerHTML = `<div class="empty"><span>No item matches.</span>${isId ? ' <span>That id is not in the list. You can still send it from the box on the right; the game ignores ids it doesn\'t have.</span>' : ''}</div>`;
      localize(grid);
      if (isId) { state.item = { id: +q, n: 'Item ' + q, zh: '', st: '?', c: 0, i: '' }; paintDetail(wrap); }
    };

    const pick = (i) => {
      const was = $('.cell.on', grid);
      const now = $(`.cell[data-i="${i}"]`, grid);

      if (was) was.classList.remove('on');
      if (now) now.classList.add('on');
      state.item = list[i];
      paintDetail(wrap);
    };

    if (window.IntersectionObserver) io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting) && drawn < list.length) more(); }, { root: grid, rootMargin: '300px' });
    else grid.onscroll = () => { if (drawn < list.length && grid.scrollTop + grid.clientHeight > grid.scrollHeight - 300) more(); };
    chips.onclick = (e) => {
      const b = e.target.closest && e.target.closest('.chip');

      if (!b) return;
      state.cat = +b.dataset.c;
      iq.value = '';
      $$('.chip', chips).forEach((x) => x.classList.toggle('on', x === b));
      paintGrid();
    };
    grid.onclick = (e) => {
      const c = e.target.closest && e.target.closest('.cell');

      if (c) pick(+c.dataset.i);
    };
    iq.oninput = () => { clearTimeout(timer); timer = setTimeout(paintGrid, 100); };
    // Enter shows the best match on the right, ready to spawn.
    iq.onkeydown = (e) => {
      if (e.key !== 'Enter') return;
      paintGrid();
      if (list.length) pick(0);
    };
    state.item = state.item || ITEMS.find((i) => i.c === state.cat);
    paintGrid();
    paintDetail(wrap);

    return wrap;
  }

  function paintDetail(wrap) {
    const it = state.item;
    const d = $('.detail', wrap);

    d.innerHTML = `<div class="big">${it.i ? `<img src="${it.i}" alt="">` : ''}</div><h3>${esc(nameOf(it))}</h3><div class="meta">id ${it.id} - <span>stack</span> ${it.st} - <span>${ITEM_CATS[it.c] || 'Other'}</span></div><div class="stepper"><button class="btn ghost" data-d="-10">-10</button><button class="btn ghost" data-d="-1">-1</button><input class="num" inputmode="numeric" value="${state.count}"><button class="btn ghost" data-d="1">+1</button><button class="btn ghost" data-d="10">+10</button></div><button class="go">SPAWN</button><div class="foot">Goes to your bag. When the bag is full the game stops adding, so you can get fewer (AddItem).</div>`;
    localize(d);

    const n = $('.num', d);
    const go = $('.go', d);

    $$('[data-d]', d).forEach((b) => { b.onclick = () => { state.count = Math.max(1, (+n.value || 0) + +b.dataset.d); n.value = state.count; }; });
    n.oninput = () => { state.count = Math.max(1, Math.floor(+n.value) || 1); };
    // Once the box is left it shows the count that will be spawned, so a typo or a zero never sits there.
    n.onchange = () => { n.value = state.count; };
    n.onkeydown = (e) => { if (e.key === 'Enter') { n.value = state.count; go.click(); } };
    go.onclick = () => cheat(() => {
      log(`Spawn item: ${it.n} x${state.count} (id ${it.id})`);
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
    const top = h(`<section class="group before"><h2>Before cheating<em>${bak ? 'backup: ' + esc(bak) : backup.step === 'failed' ? 'backup failed' : 'no cheats yet'}</em></h2>
      <div class="bstat"><div><b>${changed.length}</b><span>settings differ from before</span></div><div><b>${oneTime.length}</b><span>one-time actions</span></div><div><b>${live.length}</b><span>changes in the journal</span></div></div>
      <div class="row"><div class="lab"><b>Return to before cheating</b><span class="c add">ADDED BY MOD</span><p>Puts every switch back the way it was when you first opened the menu this session, and the weather back to the forecast. One-time actions (items, skipped days, kills) stay.</p></div><div class="ctl"><button class="btn" id="tobase"${changed.length ? '' : ' disabled'}>Restore settings</button></div></div>
      <div class="row"><div class="lab"><b>Load the before-cheating backup</b><span class="c gm">GAME</span><p>${bak ? `Undoes everything, one-time actions too, by loading the save the menu backed up before your first cheat: <b>${esc(bak)}</b>. Uses the game's InjectSave. Anything since then is lost.` : 'The menu backs up your save with the game\'s BackupSave the moment you make your first change, so this has something to load.'}</p></div><div class="ctl"><button class="btn red" id="loadbak"${bak ? '' : ' disabled'}>${confirmLoad ? 'Click again to load' : 'Load backup'}</button></div></div></section>`);

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

    const pg = h(`<section class="group"><h2>Presets<em>${state.presets.length + 1}</em></h2><div class="gnote" style="color:var(--steel-3)">A preset is a saved set of switches. Apply one to set up a test, then pick Default to go back. They are kept in BepInEx/config/CheatMenu/presets.json.</div><div class="presets"></div>
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

    // The journal is one string; its Undo buttons are handled by the group and find their entry by number.
    const rows = state.journal.slice();
    const jrow = (j, i) => {
      const act = j.undone ? '<span class="st">undone</span>'
        : j.key ? (latest(j) ? `<button class="btn ghost" data-j="${i}">Undo</button>` : '<span class="st">replaced later</span>')
          : j.undo ? `<button class="btn ghost" data-j="${i}">Undo</button>` : '<span class="st" title="Load the before-cheating backup to undo this">one-time</span>';

      return `<div class="jrow${j.undone ? ' gone' : ''}${j.s === 'M' ? ' added' : ''}"><span class="jn">${j.n}</span><time>${j.t}</time><span class="jw">${esc(tabName(j.tab))} > <b>${esc(j.l)}</b>${CHIP[j.s] || ''}${j.why ? `<small>${esc(j.why)}</small>` : ''}</span><span class="jv">${j.before === null ? '' : `<s>${esc(j.before)}</s> -> `}<b>${esc(j.after)}</b></span><span class="ja">${act}</span></div>`;
    };
    const jg = build(`<section class="group journal"><h2>Journal<em>every change, newest first</em></h2>${rows.length ? rows.map(jrow).join('') : '<div class="empty">No changes yet. Everything you do in the menu shows up here, with what it was before.</div>'}</section>`).firstChild;

    jg.onclick = (e) => { const b = e.target.closest && e.target.closest('[data-j]'); if (b) undo(rows[+b.dataset.j]); };
    body.append(jg);
  }

  // ---------- game index ----------
  // Other mods' test cheats (each mod's DevCheats class), read from the plugin every time the tab opens.
  function modTestsPage(body) {
    let mods = [];
    const draw = (list, error) => {
      if (!body.isConnected) return;

      mods = list;
      body.innerHTML = '';
      if (error) return body.append(h(`<section class="group"><div class="gnote">${esc(error)}</div></section>`));
      if (!mods.length) return body.append(h('<section class="group"><h2>No test cheats</h2><div class="gnote">None of the loaded mods adds test cheats.</div></section>'));

      const zh = state.lang === 'zh';

      body.append(build(mods.map((m, mi) => `<section class="group"><h2>${esc(m.name)}<em>${m.cheats.length}</em></h2>${m.cheats.map((c, ci) => {
        const label = zh ? c.zh : c.l;
        const help = zh ? c.dzh : c.d;

        return `<div class="row added"><div class="lab"><b>${esc(label)}</b>${CHIP.M}${help ? `<p>${esc(help)}</p>` : ''}</div><div class="ctl"><button class="btn" data-m="${mi}" data-c="${ci}">Run</button></div></div>`;
      }).join('')}</section>`).join('')));
    };

    body.onclick = (e) => {
      const b = e.target.closest && e.target.closest('button[data-m]');

      if (!b) return;

      const m = mods[+b.dataset.m];
      const c = m.cheats[+b.dataset.c];
      const label = state.lang === 'zh' ? c.zh : c.l;

      cheat(() => {
        once({ l: `${m.name}: ${c.l}`, s: 'M', tab: 'modtests', ref: [] }, 'ran');
        act('modtest', { mod: m.mod, cheat: c.id }, label, (text, err) => err ? log(`${label}: ${err}`, 'err') : log(`${label}: ${text || 'done'}`, 'mod'));
      });
    };
    body.append(h('<section class="group"><div class="gnote">Reading the loaded mods...</div></section>'));
    act('modtests', {}, 'Mod tests', (text, error) => {
      if (error) return draw([], error);

      let list;

      try { list = JSON.parse(text || '[]'); } catch (e) { return draw([], 'The test cheat list could not be read.'); }
      draw(list);
    });
  }

  function indexPage(body) {
    const where = new Map();
    const at = (k) => where.get(k) || where.set(k, []).get(k);

    TABS.forEach((t) => {
      (t.customRef || []).forEach((k) => at(k).push({ tab: t, l: { stats: 'Stats bars', weather: 'Weather tiles', maps: 'Go there now', people: 'Neighbour', items: 'Item spawner' }[t.custom] }));
      t.groups.forEach((g) => g.rows.forEach((r) => r.ref.forEach((k) => at(k).push({ tab: t, l: r.l, r }))));
    });

    const box = h(`<div><div class="ibar"><label class="search" style="margin:0;max-width:none;flex:1"><svg viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21"/></svg><input id="ixq" placeholder="Filter by game name, e.g. Weather, PsOp, Codex"></label><span class="cov">Every panel command can be run from here: click run</span></div><div class="ilist"></div></div>`);
    const out = $('.ilist', box);
    const ixq = $('#ixq', box);
    let timer = null;
    const paint = () => {
      const q = ixq.value.trim().toLowerCase();
      let html = '';

      Object.keys(KIND).forEach((kind) => {
        const list = CATALOG.filter((c) => c.kind === kind && (!q || (c.key + ' ' + c.src).toLowerCase().includes(q)));

        if (!list.length) return;

        html += `<section class="group"><h2>${KIND[kind]}s<em>${list.length}</em></h2>${list.map((c) => {
          const w = where.get(c.key) || [];

          return `<div class="irow" data-key="${esc(c.key)}"><code>${esc(c.key)}</code><span class="isrc">${esc(c.src)}${c.via ? ' - via ' + esc(c.via) : ''}${kind === 'cmd' && S[c.key] ? '<a class="run">run</a>' : ''}</span><span class="iw">${w.length ? w.map((x, i) => `<a data-i="${i}">${esc(x.tab.name)} > ${esc(x.l)}</a>`).join('') : '<em>not in the menu</em>'}</span></div>`;
        }).join('')}</section>`;
      });
      out.innerHTML = html;
      if (state.lang === 'zh' || HAN.test(html)) localize(out);
    };

    out.onclick = (e) => {
      const a = e.target.closest && e.target.closest('a');
      const row = a && a.closest('.irow');

      if (!row) return;

      const key = row.dataset.key;

      if (a.classList.contains('run')) {
        const next = row.nextSibling;

        if (next && next.classList && next.classList.contains('gmform')) next.remove(); else row.after(formEl(key, null));
      } else if (a.dataset.i !== undefined) jumpTo((where.get(key) || [])[+a.dataset.i]);
    };
    ixq.oninput = () => { clearTimeout(timer); timer = setTimeout(paint, 100); };
    body.append(box);
    paint();
  }

  function jumpTo(x) {
    if (!x) return;
    state.filter = 'all';
    openTab(x.tab.id);

    const el = x.r && showing && $$('.row[data-key]', showing.el).find((e) => e.dataset.key === x.r.key);

    if (!el) return;

    el.scrollIntoView({ block: 'center' });
    el.classList.add('hit');
    // The groups below it may only now be laid out, which can move it.
    setTimeout(() => el.scrollIntoView({ block: 'center' }), 50);
    setTimeout(() => el.classList.remove('hit'), 1600);
  }

  // ---------- live column ----------
  let statusWas = '';
  let vitalsWas = '';

  function renderStatus() {
    const html = `${state.inGame ? '<b>In a save</b>: cheats go to the game.' : '<span class="bad">No save loaded</span>: load one to use cheats.'}<br>${state.key ? `<b>${esc(state.key)}</b> opens and closes this menu.` : 'No key set; see the config.'}<br>Backup: ${state.backedUp ? esc(state.backedUp) : backup.step === 'failed' ? '<span class="bad">failed</span>' : 'made at your first cheat'}`;

    setProp($('#keyname'), 'textContent', state.key || tr('Close'));
    if (statusWas === state.lang + html) return;
    statusWas = state.lang + html;
    $('#status').innerHTML = html;
    localize($('#status'));
  }

  function renderVitals() {
    const html = state.vitals.map((v) => { const max = v.max || Math.max(100, v.v); return `<div class="vit${state.flags.LockCharacterAttr ? ' locked' : ''}"><span>${v.k}</span><div class="bar" style="--col:${COLORS[v.k] || '#ccc'}"><i style="width:${Math.min(100, v.v / max * 100)}%"></i></div><span class="v">${Math.round(v.v)}/${Math.round(max)}</span></div>`; }).join('');

    if (vitalsWas === state.lang + html) return;
    vitalsWas = state.lang + html;
    $('#vitals').innerHTML = html;
    if (state.lang === 'zh') localize($('#vitals'));
  }

  // ---------- search ----------
  let searchTimer = null;

  // Each row's searchable words, worked out once per language.
  function hayOf(r, g) {
    if (!r.__hay || r.__hay.lang !== state.lang) r.__hay = { lang: state.lang, text: (r.l + ' ' + (r.d || '') + ' ' + g.t + ' ' + g.zh + ' ' + r.ref.join(' ') + (state.lang === 'zh' ? ' ' + tr(r.l) + ' ' + tr(r.d || '') : '')).toLowerCase() };

    return r.__hay.text;
  }

  // The results are a page of their own, made for each search and dropped when another page is shown.
  function search(q) {
    if (!q) return openTab(state.tab);

    const needle = q.toLowerCase();
    const hits = [];

    TABS.forEach((tab) => tab.groups.forEach((g) => g.rows.forEach((r) => {
      if (hayOf(r, g).includes(needle)) hits.push({ tab, g, r });
    })));

    $('#tabhead').innerHTML = `<h1>Search</h1><p>Every tab, every tool. Run it from here or jump to its tab.</p><div class="counts"><span><b>${hits.length}</b> found</span></div>`;
    localize($('#tabhead'));

    const el = document.createElement('div');
    const v = { el, search: true };
    const body = $('#body');

    el.className = 'view';
    body.classList.add('flat');
    if (!hits.length) el.append(h('<div class="empty">Nothing matches. Try a Chinese word, or a game command in the Game index.</div>'));
    else el.append(hydrate(build(`<section class="group results"><h2>Results</h2>${hits.filter(({ r }) => shown(r)).slice(0, 60).map(({ tab, g, r }) => rowHtml(r, `<p class="where">${tab.name} > ${g.t}</p>`)).join('')}</section>`)));
    body.append(el);
    showView(v);
    syncView(el);
    body.scrollTop = 0;
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
  // Runs once the Toolkit's page API is there: at once when its script ran first, else when it runs. The stage fills
  // the screen at any size, so the window on it is what follows the UI size and has to fit.
  function startWithToolkit(api) {
    etk = api;
    etk.addStyle(document, FONTS_ID, FONTS);
    etk.size($('#cm'), { mod: 'CheatMenu' });
    send('ready');
  }

  function fitStage() {
    const s = Math.min(innerWidth / 1920, innerHeight / 1080);

    $('#stage').style.transform = `scale(${s}) translate(-50%, -50%)`;
  }

  function wire() {
    const cmd = $('#cmd');
    const q = $('#q');

    addEventListener('resize', fitStage);
    q.oninput = () => { clearTimeout(searchTimer); searchTimer = setTimeout(() => search(q.value.trim()), 150); };
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
    // The game sends keys to the web UI only while it is told a text box is in use, so a focused box says so.
    const isTextBox = (el) => !!(el && el.matches && el.matches('input:not([type=checkbox]):not([type=radio]), textarea'));
    host.addEventListener('focusin', (e) => { if (isTextBox(e.composedPath()[0])) send('focus|1'); });
    host.addEventListener('focusout', (e) => { if (isTextBox(e.composedPath()[0])) send('focus|0'); });
    $('#clearlog').onclick = () => { $('#log').innerHTML = ''; };
    // The rail, the filter and every row's controls are handled here, once, for whatever page is showing.
    const body = $('#body');

    $('#rail').addEventListener('click', (e) => { const b = e.target.closest && e.target.closest('.tab[data-tab]'); if (b) openTab(b.dataset.tab); });
    $('#tabhead').addEventListener('click', (e) => { const b = e.target.closest && e.target.closest('button[data-f]'); if (b) setFilter(b.dataset.f); });
    body.addEventListener('click', onBodyClick);
    body.addEventListener('keydown', onBodyKey);
    body.addEventListener('change', onBodyChange);
    body.addEventListener('input', (e) => {
      const n = e.target;

      if (!n.matches || !n.matches('.num[data-slot]')) return;

      const r = rowOf(n);

      if (r) ui(r)[n.dataset.slot] = n.value;
    });
    // The toggle of a details element does not bubble, so it is caught on the way down.
    body.addEventListener('toggle', (e) => {
      const d = e.target;

      if (!d.matches || !d.matches('details.more')) return;

      const r = rowOf(d);

      if (r) ui(r).more = d.open;
    }, true);
    // A click anywhere but on the open dropdown closes it.
    root.addEventListener('mousedown', (e) => { if (drop && !drop.el.parentNode.contains(e.target)) closeDrop(); }, true);
    $('#close').onclick = () => send('close');
    $('#lang').onclick = () => setLang(state.lang === 'zh' ? 'en' : 'zh');
  }

  // The menu starts in the game's language. A switch is kept until the game's language changes.
  const LANG_KEY = 'slcheatmenu.lang';

  function startLang(chinese) {
    let saved = null;

    try { saved = window.localStorage.getItem(LANG_KEY); } catch (e) { saved = null; }

    return L.startLang(saved, chinese);
  }

  function setLang(lang, game) {
    state.lang = lang;
    if (game) state.gameLang = game;
    try { window.localStorage.setItem(LANG_KEY, JSON.stringify({ game: state.gameLang, lang })); } catch (e) { /* no storage: the switch lasts this session */ }
    $$('#lang b').forEach((b) => b.classList.toggle('on', b.dataset.l === lang));
    $('#rail').innerHTML = '';
    dropViews();
    localize(root);
    if (state.open) { refresh(); renderVitals(); }
  }

  TABS.push(
    { id: 'changes', name: 'Changes', title: 'Changes & Presets', zh: '变更与预设', page: 'changes', blurb: 'Every change you made, with what it was before. Undo one, save a set as a preset, or go back to before you cheated.', groups: [] },
    { id: 'modtests', name: 'Mod tests', zh: '模组测试', page: 'modtests', blurb: 'Test cheats other mods add, to check their features quickly. Each mod adds its own.', groups: [] },
    { id: 'index', name: 'Game index', zh: '内置目录', page: 'index', blurb: 'Every built-in GM tool in game build 1.1.19611, read off the game code, and where each one is in this menu. Panel commands run from here with their fields.', groups: [] }
  );
  window.TAB_ICONS.changes = '<path d="M4 12a8 8 0 1 0 2.5-5.8"/><path d="M4 4v4h4M12 8v4l3 2"/>';
  window.TAB_ICONS.modtests = '<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3"/><path d="M7.5 15h9"/>';
  window.TAB_ICONS.index = '<path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"/>';

  window.ZH = window.ZH || {};
  TABS.forEach((t) => {
    [t.name, t.title].forEach((n) => { if (n && t.zh && !(n in window.ZH)) window.ZH[n] = t.zh; });
    t.groups.forEach((g) => { if (g.t && g.zh && !(g.t in window.ZH)) window.ZH[g.t] = g.zh; });
  });

  (document.body || document.documentElement).appendChild(host);
  wire();

  // ---------- what the plugin calls ----------
  window.__slcheatmenu = {
    // st: { inGame, chinese, key, flags, holds, presets }
    open(st) {
      if (state.inGame !== !!st.inGame) { state.lists = {}; state.saveFile = null; Object.keys(listReq).forEach((k) => { listReq[k] = false; }); dropViews(); }
      state.inGame = !!st.inGame;
      state.key = st.key || '';
      state.flags = st.flags || {};
      state.holds = st.holds || {};
      if (Array.isArray(st.presets)) state.presets = st.presets;
      if (!state.started) {
        state.started = true;
        allSettingKeys().forEach((k) => BASE.set(k, setting(k).get()));
        log(`Cheat Menu 0.2.11. ${CATALOG.length} built-in GM tools indexed.`, 'mod');
      }
      const game = st.chinese ? 'zh' : 'en';

      if (state.gameLang !== game) setLang(startLang(st.chinese), game);
      state.open = true;
      host.style.display = 'block';
      fitStage();
      refresh();
      renderVitals();
    },
    close() {
      closeDrop();
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
      repaint();
    },
    // What the game's GM handler sent back while the menu is open.
    readouts(list) {
      (list || []).forEach((msg) => {
        if (!msg) return;

        onBackupReadouts(msg);
        state.lastRead[L.readName(msg)] = msg;

        const saves = L.saveList(msg);

        if (saves) {
          if (saves.of === 'saves') state.saveFile = L.currentSave(msg) || state.saveFile;
          gotList(saves.of, saves.list);
        }

        const name = L.readName(msg);

        // The shops, containers and scenes of the save, and the home's slots: read for the pickers. A readout the
        // menu asked for stays out of the log; one asked for at the console is shown as usual.
        if (name === 'GmPreSupplyList') {
          const p = L.preSupply(msg);

          PRESUPPLY.forEach((o) => gotList(o, p[o]));
          if (asked.supply) { asked.supply = false; if (p.error) log(`Shop list: ${p.error}`, 'err'); return; }
        }
        if (name === 'GmHomeSlotsList') {
          const s = L.homeSlots(msg);

          gotList('homeslots', s || []);
          if (asked.slots) { asked.slots = false; return; }
        }
        if (name === 'ActionTypeList') {
          if (msg.RequestId === 'cheatmenu-pick') return gotList('uiactions', (msg.TypeNames || []).map((n) => [n, n]));
          if (state.askedActions) { state.askedActions = false; log(`UI actions (${msg.TotalCount}${msg.IsTruncated ? ', list cut short' : ''}): ${(msg.TypeNames || []).join(', ')}`); }

          return;
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
          // The stat bars come in after the tab may already be showing.
          if (!was && showing && showing.stats) { paintStats(showing); showing.f = null; applyFilter(showing); }

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

  (window.ExiledToolkitReady = window.ExiledToolkitReady || []).push(startWithToolkit);
})();
