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
  }

  appendChild(child) {
    child.parentNode = this;
    this.children.push(child);

    return child;
  }

  addEventListener() {}

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

var handed = [];
window.ExiledUi = { size: function (el, options) { handed.push({ el: el, options: options }); } };

// The menu's shadow root, made on the element the bundle puts on the page.
function menuRoot() {
  return shadows[0];
}
