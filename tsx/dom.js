// Minimal DOM polyfill for NanoJSX server-side rendering in goja.
// Provides enough API surface for NanoJSX to create elements and serialize to HTML.

// --- Text nodes ---

function TextNode(text) {
  this.nodeType = 3;
  this.textContent = String(text);
}
TextNode.prototype.cloneNode = function () {
  return new TextNode(this.textContent);
};
TextNode.prototype.toString = function () {
  return this.textContent;
};

// RawNode: text node whose content is emitted without escaping.
function RawNode(html) {
  this.nodeType = 3;
  this.textContent = String(html || "");
  this._isRaw = true;
}
RawNode.prototype.cloneNode = function () {
  return new RawNode(this.textContent);
};
RawNode.prototype.toString = function () {
  return this.textContent;
};

// --- Element ---

function Element(tagName) {
  this.tagName = tagName;
  this.nodeType = 1;
  this.childNodes = [];
  this.attributes = [];
  this._attrs = {};
  this.id = "";
  this.parentNode = null;
  this.parentElement = null;
  this.style = {};
  this._rawInnerHTML = null;
}

Element.prototype.setAttribute = function (name, value) {
  var s = String(value);
  if (name === "id") this.id = s;
  this._attrs[name] = s;
  for (var i = 0; i < this.attributes.length; i++) {
    if (this.attributes[i].name === name) {
      this.attributes[i].value = s;
      return;
    }
  }
  this.attributes.push({ name: name, value: s });
};

Element.prototype.getAttribute = function (name) {
  return this._attrs.hasOwnProperty(name) ? this._attrs[name] : null;
};

Element.prototype.appendChild = function (child) {
  if (typeof child === "string") child = new TextNode(child);
  if (child.parentNode) child.parentNode.removeChild(child);
  child.parentNode = this;
  child.parentElement = this;
  this.childNodes.push(child);
  this._rawInnerHTML = null;
  return child;
};

Element.prototype.removeChild = function (child) {
  var i = this.childNodes.indexOf(child);
  if (i !== -1) {
    this.childNodes.splice(i, 1);
    child.parentNode = null;
    child.parentElement = null;
  }
  return child;
};

Element.prototype.insertBefore = function (newNode, refNode) {
  if (newNode.parentNode) newNode.parentNode.removeChild(newNode);
  var i = refNode ? this.childNodes.indexOf(refNode) : -1;
  if (i !== -1) this.childNodes.splice(i, 0, newNode);
  else this.childNodes.push(newNode);
  newNode.parentNode = this;
  newNode.parentElement = this;
  this._rawInnerHTML = null;
  return newNode;
};

Element.prototype.replaceChild = function (newChild, oldChild) {
  var i = this.childNodes.indexOf(oldChild);
  if (i !== -1) {
    if (newChild.parentNode) newChild.parentNode.removeChild(newChild);
    this.childNodes[i] = newChild;
    newChild.parentNode = this;
    newChild.parentElement = this;
    oldChild.parentNode = null;
    oldChild.parentElement = null;
  }
  return oldChild;
};

Element.prototype.remove = function () {
  if (this.parentNode) this.parentNode.removeChild(this);
};

Element.prototype.append = function () {
  for (var i = 0; i < arguments.length; i++) this.appendChild(arguments[i]);
};

Element.prototype.addEventListener = function () {};
Element.prototype.removeEventListener = function () {};

Element.prototype.cloneNode = function (deep) {
  var c = new Element(this.tagName);
  for (var i = 0; i < this.attributes.length; i++)
    c.setAttribute(this.attributes[i].name, this.attributes[i].value);
  if (this._rawInnerHTML !== null) c._rawInnerHTML = this._rawInnerHTML;
  if (deep) {
    for (var j = 0; j < this.childNodes.length; j++) {
      var ch = this.childNodes[j].cloneNode(true);
      ch.parentNode = c;
      ch.parentElement = c;
      c.childNodes.push(ch);
    }
  }
  return c;
};

Object.defineProperty(Element.prototype, "firstChild", {
  get: function () {
    return this.childNodes[0] || null;
  },
});

Object.defineProperty(Element.prototype, "lastChild", {
  get: function () {
    return this.childNodes[this.childNodes.length - 1] || null;
  },
});

Object.defineProperty(Element.prototype, "children", {
  get: function () {
    return this.childNodes.filter(function (c) {
      return c.nodeType === 1;
    });
  },
});

Object.defineProperty(Element.prototype, "isConnected", {
  get: function () {
    return false;
  },
});

Object.defineProperty(Element.prototype, "classList", {
  get: function () {
    var el = this;
    return {
      add: function (c) {
        var cur = el.getAttribute("class") || "";
        if ((" " + cur + " ").indexOf(" " + c + " ") === -1)
          el.setAttribute("class", (cur ? cur + " " : "") + c);
      },
      remove: function (c) {
        var cur = el.getAttribute("class") || "";
        el.setAttribute(
          "class",
          cur
            .replace(new RegExp("(^|\\s)" + c + "(\\s|$)"), " ")
            .trim()
        );
      },
      contains: function (c) {
        return (
          (" " + (el.getAttribute("class") || "") + " ").indexOf(
            " " + c + " "
          ) !== -1
        );
      },
    };
  },
});

// --- HTML serialization ---

var __voids = {
  area: 1, base: 1, br: 1, col: 1, embed: 1, hr: 1, img: 1,
  input: 1, link: 1, meta: 1, source: 1, track: 1, wbr: 1,
};

function __escAttr(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function __escText(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function __toHTML(n) {
  if (n == null) return "";
  if (typeof n === "string") return n;
  if (n.nodeType === 3)
    return n._isRaw ? n.textContent : __escText(n.textContent);
  if (n.nodeType !== 1) return "";

  var tag = n.tagName.toLowerCase();

  // Transparent wrappers: output children without the wrapper tag
  if (tag === "fragment" || tag === "template") {
    if (n._rawInnerHTML !== null) return n._rawInnerHTML;
    var f = "";
    for (var fi = 0; fi < n.childNodes.length; fi++) f += __toHTML(n.childNodes[fi]);
    return f;
  }

  var h = "<" + tag;
  for (var i = 0; i < n.attributes.length; i++) {
    var a = n.attributes[i];
    h += " " + a.name + '="' + __escAttr(a.value) + '"';
  }
  if (__voids[tag]) return h + " />";

  h += ">";
  if (n._rawInnerHTML !== null) h += n._rawInnerHTML;
  else
    for (var j = 0; j < n.childNodes.length; j++) h += __toHTML(n.childNodes[j]);
  h += "</" + tag + ">";
  return h;
}

Object.defineProperty(Element.prototype, "innerHTML", {
  get: function () {
    if (this._rawInnerHTML !== null) return this._rawInnerHTML;
    var h = "";
    for (var i = 0; i < this.childNodes.length; i++)
      h += __toHTML(this.childNodes[i]);
    return h;
  },
  set: function (v) {
    this.childNodes = [];
    this._rawInnerHTML = v != null ? String(v) : "";
  },
});

Object.defineProperty(Element.prototype, "outerHTML", {
  get: function () {
    return __toHTML(this);
  },
});

Object.defineProperty(Element.prototype, "textContent", {
  get: function () {
    var t = "";
    for (var i = 0; i < this.childNodes.length; i++) {
      var c = this.childNodes[i];
      t += c.nodeType === 3 ? c.textContent : c.textContent || "";
    }
    return t;
  },
  set: function (v) {
    this.childNodes = [];
    this._rawInnerHTML = null;
    if (v) this.childNodes.push(new TextNode(v));
  },
});

Object.defineProperty(Element.prototype, "innerText", {
  get: function () {
    return this.textContent;
  },
  set: function (v) {
    this.textContent = v;
  },
});

// --- Globals ---

var document = {
  createElement: function (t) {
    return new Element(t);
  },
  createElementNS: function (ns, t) {
    return new Element(t);
  },
  createTextNode: function (t) {
    return new TextNode(String(t));
  },
  head: new Element("head"),
  body: new Element("body"),
  querySelector: function () {
    return null;
  },
  querySelectorAll: function () {
    return [];
  },
  getElementsByTagName: function () {
    return [];
  },
  getElementById: function () {
    return null;
  },
};

var window = {
  document: document,
  addEventListener: function () {},
  removeEventListener: function () {},
  location: { pathname: "/", href: "" },
  history: { pushState: function () {}, replaceState: function () {} },
  dispatchEvent: function () {},
  innerWidth: 1920,
  innerHeight: 1080,
  scrollY: 0,
};

function Event(type) {
  this.type = type;
}

function MutationObserver() {
  this.observe = function () {};
  this.disconnect = function () {};
}

function IntersectionObserver() {
  this.observe = function () {};
  this.disconnect = function () {};
}

var navigator = { userAgent: "goja" };

var localStorage = {
  getItem: function () { return null; },
  setItem: function () {},
  removeItem: function () {},
};

var sessionStorage = {
  getItem: function () { return null; },
  setItem: function () {},
  removeItem: function () {},
};

var setTimeout = function (fn) {
  if (typeof fn === "function") fn();
  return 0;
};
var clearTimeout = function () {};

var console = {
  log: function () {},
  warn: function () {},
  error: function () {},
};

// --- Template helper: inject raw HTML without escaping ---

function raw(html) {
  return new RawNode(html);
}
