// A fake game page for the shipped bundle: elements that keep their children, a shadow root whose querySelector gives
// one element per selector, and a fake Exiled's Toolkit that records the panels handed to it.
var window = this;
var location = { href: 'file:///D:/Game/WebUI/Root.html' };
var localStorage = { getItem: function () { return null; }, setItem: function () {} };
var innerWidth = 1920;
var innerHeight = 1080;

function setTimeout() { return 1; }
function clearTimeout() {}
function setInterval() { return 1; }
function addEventListener() {}

class FakeEl {
  constructor(tag) {
    this.tagName = String(tag).toUpperCase();
    this.children = [];
    this.parentNode = null;
    this.style = {};
    this.dataset = {};
    this.classList = { add: function () {}, remove: function () {}, toggle: function () {}, contains: function () { return false; } };
    this.id = '';
    this.textContent = '';
    this.found = {};
    this.listeners = {};
  }

  appendChild(child) {
    child.parentNode = this;
    this.children.push(child);

    return child;
  }

  addEventListener(type, fn) {
    (this.listeners[type] = this.listeners[type] || []).push(fn);
  }

  // Fires a bubbling event whose real target is target, as a shadow-root event reaches its host.
  fire(type, target) {
    var e = { type: type, key: '', composedPath: function () { return [target]; }, stopPropagation: function () {}, preventDefault: function () {} };
    (this.listeners[type] || []).forEach(function (fn) { fn(e); });
  }

  // Enough of CSS for "tag:not([type=x]), tag" lists.
  matches(selector) {
    var el = this;

    return selector.split(',').some(function (part) {
      var tag = part.trim().split(':')[0];
      var excluded = (part.match(/\[type=(\w+)\]/g) || []).map(function (m) { return m.slice(6, -1); });

      return tag.toUpperCase() === el.tagName && excluded.indexOf(el.type) < 0;
    });
  }

  querySelector(selector) {
    if (!this.found[selector]) {
      this.found[selector] = new FakeEl('div');
      this.found[selector].selector = selector;
    }

    return this.found[selector];
  }

  querySelectorAll() { return []; }

  attachShadow() {
    this.shadowRoot = new FakeEl('#shadow-root');
    shadows.push(this.shadowRoot);

    return this.shadowRoot;
  }
}

var shadows = [];

var document = {
  documentElement: new FakeEl('html'),
  head: new FakeEl('head'),
  body: new FakeEl('body'),
  createElement: function (tag) { return new FakeEl(tag); }
};

var posted = [];
window.vuplex = { postMessage: function (m) { posted.push(m); } };

// The element the bundle puts on the page, which every panel event reaches.
function menuHost() {
  return document.body.children[0];
}

var handed = [];
window.ExiledUi = { size: function (el, options) { handed.push({ el: el, options: options }); } };

// The menu's shadow root, made on the element the bundle puts on the page.
function menuRoot() {
  return shadows[0];
}
